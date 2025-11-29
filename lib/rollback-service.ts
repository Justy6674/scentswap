import { getSupabase, isSupabaseConfigured } from './supabase';
import { enhancementService } from './enhancement-service';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface RollbackPoint {
  id: string;
  fragrance_id: string;
  enhancement_request_id: string;
  snapshot_data: Record<string, any>;
  applied_change_ids: string[];
  created_by: string;
  created_at: string;
  rollback_reason?: string;
}

export interface RollbackResult {
  success: boolean;
  rollback_point_id: string;
  reverted_fields: string[];
  errors: string[];
  fragrance_id: string;
}

export interface RollbackHistory {
  id: string;
  original_rollback_point_id: string;
  fragrance_id: string;
  rollback_reason: string;
  reverted_fields: string[];
  performed_by: string;
  performed_at: string;
  success: boolean;
  errors?: string[];
}

// =============================================================================
// ROLLBACK SERVICE CLASS
// =============================================================================

class RollbackService {

  // ===========================================================================
  // ROLLBACK POINT MANAGEMENT
  // ===========================================================================

  async createRollbackPoint(
    fragranceId: string,
    enhancementRequestId: string,
    appliedChangeIds: string[],
    adminId: string
  ): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase()!;

    try {
      // Get current fragrance data before changes
      const { data: currentData, error: fetchError } = await supabase
        .from('fragrance_master')
        .select('*')
        .eq('id', fragranceId)
        .single();

      if (fetchError) throw fetchError;

      // Create rollback point
      const { data, error } = await supabase
        .from('fragrance_rollback_points')
        .insert({
          fragrance_id: fragranceId,
          enhancement_request_id: enhancementRequestId,
          snapshot_data: currentData,
          applied_change_ids: appliedChangeIds,
          created_by: adminId
        })
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error creating rollback point:', error);
      return null;
    }
  }

  async getRollbackPoints(
    fragranceId?: string,
    limit: number = 50
  ): Promise<RollbackPoint[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    try {
      let query = supabase
        .from('fragrance_rollback_points')
        .select(`
          *,
          enhancement_request:fragrance_enhancement_requests(
            id,
            enhancement_type,
            status
          ),
          fragrance:fragrance_master(id, name, brand)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fragranceId) {
        query = query.eq('fragrance_id', fragranceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting rollback points:', error);
      return [];
    }
  }

  async getRollbackPoint(rollbackPointId: string): Promise<RollbackPoint | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('fragrance_rollback_points')
        .select('*')
        .eq('id', rollbackPointId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting rollback point:', error);
      return null;
    }
  }

  // ===========================================================================
  // ROLLBACK OPERATIONS
  // ===========================================================================

  async rollbackToPoint(
    rollbackPointId: string,
    adminId: string,
    reason: string
  ): Promise<RollbackResult> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        rollback_point_id: rollbackPointId,
        reverted_fields: [],
        errors: ['Supabase not configured'],
        fragrance_id: ''
      };
    }

    const supabase = getSupabase()!;

    try {
      // Get the rollback point
      const rollbackPoint = await this.getRollbackPoint(rollbackPointId);
      if (!rollbackPoint) {
        throw new Error('Rollback point not found');
      }

      // Get current fragrance data
      const { data: currentData, error: fetchError } = await supabase
        .from('fragrance_master')
        .select('*')
        .eq('id', rollbackPoint.fragrance_id)
        .single();

      if (fetchError) throw fetchError;

      // Compare current data with snapshot to determine what fields to revert
      const revertedFields: string[] = [];
      const updateData: Record<string, any> = {};

      // Identify fields that have changed since the rollback point
      for (const [field, originalValue] of Object.entries(rollbackPoint.snapshot_data)) {
        if (field === 'id' || field === 'created_at' || field === 'updated_at') {
          continue; // Skip system fields
        }

        const currentValue = currentData[field];
        if (!this.areValuesEqual(originalValue, currentValue)) {
          updateData[field] = originalValue;
          revertedFields.push(field);
        }
      }

      if (revertedFields.length === 0) {
        return {
          success: true,
          rollback_point_id: rollbackPointId,
          reverted_fields: [],
          errors: [],
          fragrance_id: rollbackPoint.fragrance_id
        };
      }

      // Add updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      // Perform the rollback
      const { error: updateError } = await supabase
        .from('fragrance_master')
        .update(updateData)
        .eq('id', rollbackPoint.fragrance_id);

      if (updateError) throw updateError;

      // Mark the applied changes as rolled back
      if (rollbackPoint.applied_change_ids.length > 0) {
        await supabase
          .from('fragrance_enhancement_changes')
          .update({
            status: 'rolled_back',
            updated_at: new Date().toISOString()
          })
          .in('id', rollbackPoint.applied_change_ids);
      }

      // Record the rollback in history
      await this.recordRollbackHistory(
        rollbackPointId,
        rollbackPoint.fragrance_id,
        reason,
        revertedFields,
        adminId,
        true
      );

      // Log the rollback
      await enhancementService.logEnhancement(
        rollbackPoint.enhancement_request_id,
        'info',
        `Rollback performed: reverted ${revertedFields.length} fields`,
        {
          rollback_point_id: rollbackPointId,
          reverted_fields: revertedFields,
          reason
        },
        'rollback-service',
        'rollbackToPoint'
      );

      return {
        success: true,
        rollback_point_id: rollbackPointId,
        reverted_fields: revertedFields,
        errors: [],
        fragrance_id: rollbackPoint.fragrance_id
      };

    } catch (error) {
      console.error('Error performing rollback:', error);

      // Record failed rollback in history
      try {
        const rollbackPoint = await this.getRollbackPoint(rollbackPointId);
        if (rollbackPoint) {
          await this.recordRollbackHistory(
            rollbackPointId,
            rollbackPoint.fragrance_id,
            reason,
            [],
            adminId,
            false,
            [error instanceof Error ? error.message : 'Unknown error']
          );
        }
      } catch (historyError) {
        console.error('Error recording rollback history:', historyError);
      }

      return {
        success: false,
        rollback_point_id: rollbackPointId,
        reverted_fields: [],
        errors: [error instanceof Error ? error.message : 'Rollback failed'],
        fragrance_id: ''
      };
    }
  }

  // ===========================================================================
  // ROLLBACK HISTORY
  // ===========================================================================

  private async recordRollbackHistory(
    rollbackPointId: string,
    fragranceId: string,
    reason: string,
    revertedFields: string[],
    performedBy: string,
    success: boolean,
    errors?: string[]
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase()!;

    try {
      await supabase
        .from('fragrance_rollback_history')
        .insert({
          original_rollback_point_id: rollbackPointId,
          fragrance_id: fragranceId,
          rollback_reason: reason,
          reverted_fields: revertedFields,
          performed_by: performedBy,
          success,
          errors: errors || null
        });
    } catch (error) {
      console.error('Error recording rollback history:', error);
    }
  }

  async getRollbackHistory(
    fragranceId?: string,
    limit: number = 50
  ): Promise<RollbackHistory[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    try {
      let query = supabase
        .from('fragrance_rollback_history')
        .select(`
          *,
          fragrance:fragrance_master(id, name, brand)
        `)
        .order('performed_at', { ascending: false })
        .limit(limit);

      if (fragranceId) {
        query = query.eq('fragrance_id', fragranceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting rollback history:', error);
      return [];
    }
  }

  // ===========================================================================
  // ERROR HANDLING UTILITIES
  // ===========================================================================

  async handleEnhancementError(
    requestId: string,
    error: Error,
    context?: any
  ): Promise<void> {
    try {
      // Update request status to failed
      await enhancementService.updateRequestStatus(
        requestId,
        'failed',
        error.message
      );

      // Log the error
      await enhancementService.logEnhancement(
        requestId,
        'error',
        `Enhancement failed: ${error.message}`,
        {
          error_stack: error.stack,
          context
        },
        'rollback-service',
        'handleEnhancementError'
      );

    } catch (handlingError) {
      console.error('Error handling enhancement error:', handlingError);
    }
  }

  async validateFragranceIntegrity(fragranceId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    if (!isSupabaseConfigured()) {
      return {
        isValid: false,
        errors: ['Supabase not configured'],
        warnings: []
      };
    }

    const supabase = getSupabase()!;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get fragrance data
      const { data: fragrance, error: fetchError } = await supabase
        .from('fragrance_master')
        .select('*')
        .eq('id', fragranceId)
        .single();

      if (fetchError) {
        errors.push(`Failed to fetch fragrance: ${fetchError.message}`);
        return { isValid: false, errors, warnings };
      }

      // Validate required fields
      if (!fragrance.name || fragrance.name.trim().length === 0) {
        errors.push('Fragrance name is required');
      }

      if (!fragrance.brand || fragrance.brand.trim().length === 0) {
        errors.push('Brand is required');
      }

      // Validate rating ranges
      if (fragrance.rating_value !== null) {
        const rating = Number(fragrance.rating_value);
        if (isNaN(rating) || rating < 0 || rating > 5) {
          errors.push('Rating value must be between 0 and 5');
        }
      }

      if (fragrance.longevity_rating !== null) {
        const longevity = Number(fragrance.longevity_rating);
        if (isNaN(longevity) || longevity < 0 || longevity > 5) {
          errors.push('Longevity rating must be between 0 and 5');
        }
      }

      if (fragrance.sillage_rating !== null) {
        const sillage = Number(fragrance.sillage_rating);
        if (isNaN(sillage) || sillage < 0 || sillage > 5) {
          errors.push('Sillage rating must be between 0 and 5');
        }
      }

      // Validate year
      if (fragrance.year_released !== null) {
        const year = Number(fragrance.year_released);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1800 || year > currentYear + 2) {
          errors.push(`Year released must be between 1800 and ${currentYear + 2}`);
        }
      }

      // Check for potential issues (warnings)
      if (!fragrance.description || fragrance.description.trim().length < 10) {
        warnings.push('Description is very short or missing');
      }

      if (!fragrance.main_accords || !Array.isArray(fragrance.main_accords) || fragrance.main_accords.length === 0) {
        warnings.push('No main accords specified');
      }

      if (!fragrance.concentration) {
        warnings.push('Concentration not specified');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Error validating fragrance integrity:', error);
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings
      };
    }
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  private areValuesEqual(value1: any, value2: any): boolean {
    // Handle null/undefined
    if (value1 === value2) return true;
    if (value1 == null || value2 == null) return false;

    // Handle arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) return false;
      return value1.every((item, index) => this.areValuesEqual(item, value2[index]));
    }

    // Handle objects
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      const keys1 = Object.keys(value1);
      const keys2 = Object.keys(value2);

      if (keys1.length !== keys2.length) return false;
      return keys1.every(key => this.areValuesEqual(value1[key], value2[key]));
    }

    // Handle primitives
    return value1 === value2;
  }

  async cleanupOldRollbackPoints(daysToKeep: number = 30): Promise<number> {
    if (!isSupabaseConfigured()) return 0;
    const supabase = getSupabase()!;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('fragrance_rollback_points')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up old rollback points:', error);
      return 0;
    }
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

export const rollbackService = new RollbackService();