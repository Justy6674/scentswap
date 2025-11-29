import { getSupabase, isSupabaseConfigured } from './supabase';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface EnhancementRequest {
  id: string;
  fragrance_id: string;
  admin_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  enhancement_type: 'ai_analysis' | 'web_scrape' | 'hybrid' | 'manual';
  priority: number;
  confidence_threshold: number;
  processing_notes?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
}

export interface EnhancementChange {
  id: string;
  request_id: string;
  field_name: string;
  old_value: any;
  new_value: any;
  change_type: 'addition' | 'update' | 'correction' | 'enhancement';
  confidence_score: number;
  source: 'fragrantica_scrape' | 'brand_website' | 'ai_gemini' | 'ai_openai' | 'ai_hybrid' | 'manual_entry';
  source_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  validation_errors?: string[];
  created_at: string;
  updated_at: string;
}

export interface FragranceForEnhancement {
  id: string;
  name: string;
  brand: string;
  fragrantica_url: string;
  completeness_score: number;
  missing_fields: string[];
  last_enhanced_at?: string;
  priority_score: number;
}

export interface EnhancementQueueStats {
  pending_requests: number;
  processing_requests: number;
  pending_approvals: number;
  high_confidence_changes: number;
  total_completed_today: number;
  avg_processing_time_minutes: number;
}

export interface CreateChangeInput {
  field_name: string;
  old_value: any;
  new_value: any;
  change_type?: string;
  confidence_score?: number;
  source: string;
  source_url?: string;
  notes?: string;
}

// =============================================================================
// ENHANCEMENT SERVICE CLASS
// =============================================================================

class EnhancementService {

  // ===========================================================================
  // QUEUE MANAGEMENT
  // ===========================================================================

  async getQueueStats(): Promise<EnhancementQueueStats | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase.rpc('get_enhancement_queue_stats');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return null;
    }
  }

  async getFragrancesNeedingEnhancement(
    limit: number = 50,
    brandFilter?: string,
    missingFields?: string[]
  ): Promise<FragranceForEnhancement[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase.rpc('get_fragrances_needing_enhancement', {
        p_limit: limit,
        p_brand_filter: brandFilter,
        p_missing_fields: missingFields
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting fragrances needing enhancement:', error);
      return [];
    }
  }

  // ===========================================================================
  // REQUEST MANAGEMENT
  // ===========================================================================

  async createEnhancementRequest(
    fragranceId: string,
    adminId: string,
    enhancementType: EnhancementRequest['enhancement_type'],
    priority: number = 5,
    confidenceThreshold: number = 0.7
  ): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase.rpc('create_enhancement_request', {
        p_fragrance_id: fragranceId,
        p_admin_id: adminId,
        p_enhancement_type: enhancementType,
        p_priority: priority,
        p_confidence_threshold: confidenceThreshold
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating enhancement request:', error);
      return null;
    }
  }

  async updateRequestStatus(
    requestId: string,
    status: EnhancementRequest['status'],
    errorMessage?: string,
    processingNotes?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase.rpc('update_enhancement_request_status', {
        p_request_id: requestId,
        p_status: status,
        p_error_message: errorMessage,
        p_processing_notes: processingNotes
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating request status:', error);
      return false;
    }
  }

  async getEnhancementRequest(requestId: string): Promise<EnhancementRequest | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('fragrance_enhancement_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting enhancement request:', error);
      return null;
    }
  }

  async getRequestsForAdmin(adminId: string, limit: number = 50): Promise<EnhancementRequest[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('fragrance_enhancement_requests')
        .select(`
          *,
          fragrance:fragrance_master(id, name, brand)
        `)
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting requests for admin:', error);
      return [];
    }
  }

  async getPendingRequests(limit: number = 20): Promise<EnhancementRequest[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('fragrance_enhancement_requests')
        .select(`
          *,
          fragrance:fragrance_master(id, name, brand)
        `)
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return [];
    }
  }

  // ===========================================================================
  // CHANGES MANAGEMENT
  // ===========================================================================

  async createEnhancementChanges(
    requestId: string,
    changes: CreateChangeInput[]
  ): Promise<number> {
    if (!isSupabaseConfigured()) return 0;
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase.rpc('create_enhancement_changes', {
        p_request_id: requestId,
        p_changes: JSON.stringify(changes)
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error creating enhancement changes:', error);
      return 0;
    }
  }

  async getChangesForRequest(requestId: string): Promise<EnhancementChange[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('fragrance_enhancement_changes')
        .select('*')
        .eq('request_id', requestId)
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting changes for request:', error);
      return [];
    }
  }

  async getPendingApprovals(adminId?: string, limit: number = 50): Promise<EnhancementChange[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    try {
      let query = supabase
        .from('fragrance_enhancement_changes')
        .select(`
          *,
          request:fragrance_enhancement_requests(
            id,
            admin_id,
            fragrance_id,
            fragrance:fragrance_master(id, name, brand)
          )
        `)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (adminId) {
        query = query.eq('request.admin_id', adminId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      return [];
    }
  }

  async getPendingChanges(limit: number = 50): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('fragrance_enhancement_changes')
        .select(`
          *,
          request:fragrance_enhancement_requests(
            id,
            fragrance_id,
            fragrance:fragrance_master(id, name, brand)
          )
        `)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Flatten the data to include fragrance info at top level
      return (data || []).map(change => ({
        ...change,
        fragrance_name: change.request?.fragrance?.name,
        fragrance_brand: change.request?.fragrance?.brand
      }));
    } catch (error) {
      console.error('Error getting pending changes:', error);
      return [];
    }
  }

  async getEnhancementAnalytics(): Promise<{
    total_enhanced: number;
    success_rate: number;
    avg_changes_per_fragrance: number;
    top_sources: {source: string; count: number}[];
    recent_activity: {date: string; count: number}[];
  }> {
    if (!isSupabaseConfigured()) {
      return {
        total_enhanced: 0,
        success_rate: 0,
        avg_changes_per_fragrance: 0,
        top_sources: [],
        recent_activity: []
      };
    }
    const supabase = getSupabase()!;

    try {
      // Get total completed requests
      const { count: totalCompleted } = await supabase
        .from('fragrance_enhancement_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Get total failed requests
      const { count: totalFailed } = await supabase
        .from('fragrance_enhancement_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');

      // Get total approved changes
      const { count: totalApproved } = await supabase
        .from('fragrance_enhancement_changes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'auto_approved']);

      // Calculate success rate
      const totalRequests = (totalCompleted || 0) + (totalFailed || 0);
      const successRate = totalRequests > 0 ? Math.round(((totalCompleted || 0) / totalRequests) * 100) : 0;

      // Calculate average changes per fragrance
      const avgChanges = (totalCompleted || 0) > 0 ? (totalApproved || 0) / (totalCompleted || 0) : 0;

      // Get top sources
      const { data: sourceData } = await supabase
        .from('fragrance_enhancement_changes')
        .select('source')
        .in('status', ['approved', 'auto_approved']);
      
      const sourceCounts: Record<string, number> = {};
      (sourceData || []).forEach(item => {
        sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
      });
      const topSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentData } = await supabase
        .from('fragrance_enhancement_requests')
        .select('completed_at')
        .eq('status', 'completed')
        .gte('completed_at', sevenDaysAgo.toISOString());

      // Group by date
      const activityByDate: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        activityByDate[date.toISOString().split('T')[0]] = 0;
      }
      
      (recentData || []).forEach(item => {
        if (item.completed_at) {
          const date = item.completed_at.split('T')[0];
          if (activityByDate[date] !== undefined) {
            activityByDate[date]++;
          }
        }
      });

      const recentActivity = Object.entries(activityByDate)
        .map(([date, count]) => ({ date, count }));

      return {
        total_enhanced: totalCompleted || 0,
        success_rate: successRate,
        avg_changes_per_fragrance: avgChanges,
        top_sources: topSources,
        recent_activity: recentActivity
      };
    } catch (error) {
      console.error('Error getting enhancement analytics:', error);
      return {
        total_enhanced: 0,
        success_rate: 0,
        avg_changes_per_fragrance: 0,
        top_sources: [],
        recent_activity: []
      };
    }
  }

  async approveChanges(changeIds: string[], adminId: string): Promise<{
    success: boolean;
    applied_count: number;
    errors: string[];
    fragrance_id?: string;
  }> {
    if (!isSupabaseConfigured()) {
      return { success: false, applied_count: 0, errors: ['Supabase not configured'] };
    }
    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase.rpc('apply_enhancement_changes', {
        p_change_ids: changeIds,
        p_admin_id: adminId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error approving changes:', error);
      return {
        success: false,
        applied_count: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async rejectChanges(
    changeIds: string[],
    adminId: string,
    rejectionReason: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const supabase = getSupabase()!;

    try {
      const { error } = await supabase
        .from('fragrance_enhancement_changes')
        .update({
          status: 'rejected',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .in('id', changeIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting changes:', error);
      return false;
    }
  }

  // ===========================================================================
  // LOGGING
  // ===========================================================================

  async logEnhancement(
    requestId: string,
    level: 'info' | 'warning' | 'error' | 'debug',
    message: string,
    context?: any,
    component?: string,
    functionName?: string
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase()!;

    try {
      await supabase
        .from('fragrance_enhancement_logs')
        .insert({
          request_id: requestId,
          log_level: level,
          message,
          context: context ? JSON.stringify(context) : null,
          component,
          function_name: functionName
        });
    } catch (error) {
      console.error('Error logging enhancement:', error);
    }
  }

  async getLogsForRequest(requestId: string, level?: string): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    try {
      let query = supabase
        .from('fragrance_enhancement_logs')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (level) {
        query = query.eq('log_level', level);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting logs for request:', error);
      return [];
    }
  }

  // ===========================================================================
  // BATCH OPERATIONS
  // ===========================================================================

  async createBulkEnhancementRequests(
    fragranceIds: string[],
    adminId: string,
    enhancementType: EnhancementRequest['enhancement_type'],
    priority: number = 5
  ): Promise<string[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    const requestIds: string[] = [];

    try {
      // Create requests in batches of 10 to avoid hitting limits
      const batchSize = 10;
      for (let i = 0; i < fragranceIds.length; i += batchSize) {
        const batch = fragranceIds.slice(i, i + batchSize);

        const promises = batch.map(fragranceId =>
          this.createEnhancementRequest(fragranceId, adminId, enhancementType, priority)
        );

        const results = await Promise.all(promises);
        requestIds.push(...results.filter(id => id !== null) as string[]);
      }

      return requestIds;
    } catch (error) {
      console.error('Error creating bulk enhancement requests:', error);
      return requestIds; // Return partial results
    }
  }

  async cancelRequest(requestId: string, adminId: string): Promise<boolean> {
    return await this.updateRequestStatus(requestId, 'cancelled', undefined, `Cancelled by admin ${adminId}`);
  }

  /**
   * Process enhancement requests with concurrency control
   * @param maxConcurrent Maximum concurrent requests (default: 3)
   * @param onProgress Progress callback
   */
  async processBatchEnhancements(
    requestIds: string[],
    processor: (requestId: string) => Promise<boolean>,
    options: {
      maxConcurrent?: number;
      delayBetweenMs?: number;
      onProgress?: (completed: number, total: number, current: string) => void;
      onError?: (requestId: string, error: Error) => void;
    } = {}
  ): Promise<{ completed: number; failed: number; errors: string[] }> {
    const { 
      maxConcurrent = 3, 
      delayBetweenMs = 1000,
      onProgress,
      onError
    } = options;

    const results = { completed: 0, failed: 0, errors: [] as string[] };
    const queue = [...requestIds];
    const inProgress = new Set<string>();

    const processNext = async (): Promise<void> => {
      if (queue.length === 0) return;
      
      const requestId = queue.shift()!;
      inProgress.add(requestId);
      
      try {
        onProgress?.(results.completed + results.failed, requestIds.length, requestId);
        
        const success = await processor(requestId);
        
        if (success) {
          results.completed++;
        } else {
          results.failed++;
          results.errors.push(`Request ${requestId} returned false`);
        }
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Request ${requestId}: ${errorMsg}`);
        onError?.(requestId, error instanceof Error ? error : new Error(errorMsg));
      } finally {
        inProgress.delete(requestId);
        
        // Delay between requests to avoid rate limiting
        if (queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenMs));
        }
      }
    };

    // Start initial batch
    const workers = Array(Math.min(maxConcurrent, queue.length))
      .fill(null)
      .map(async () => {
        while (queue.length > 0 || inProgress.size > 0) {
          if (queue.length > 0 && inProgress.size < maxConcurrent) {
            await processNext();
          } else {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      });

    await Promise.all(workers);
    return results;
  }

  /**
   * Get fragrances prioritized by data completeness
   * Returns fragrances most in need of enhancement first
   */
  async getFragrancesByPriority(
    limit: number = 100,
    options: {
      missingImages?: boolean;
      missingDescription?: boolean;
      missingNotes?: boolean;
      brandFilter?: string;
    } = {}
  ): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;

    try {
      let query = supabase
        .from('fragrance_master')
        .select('id, name, brand, fragrantica_url, image_url, description, top_notes, concentration, family')
        .not('fragrantica_url', 'is', null);

      // Apply filters
      if (options.missingImages) {
        query = query.is('image_url', null);
      }
      if (options.missingDescription) {
        query = query.is('description', null);
      }
      if (options.brandFilter) {
        query = query.ilike('brand', `%${options.brandFilter}%`);
      }

      // Order by completeness (nulls first = least complete)
      query = query
        .order('image_url', { ascending: true, nullsFirst: true })
        .order('description', { ascending: true, nullsFirst: true })
        .limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      // Calculate completeness score for each
      return (data || []).map(f => ({
        ...f,
        completeness_score: this.calculateCompletenessScore(f),
        missing_fields: this.getMissingFields(f)
      }));
    } catch (error) {
      console.error('Error getting fragrances by priority:', error);
      return [];
    }
  }

  private calculateCompletenessScore(fragrance: any): number {
    const fields = [
      'name', 'brand', 'description', 'concentration', 'family',
      'top_notes', 'image_url'
    ];
    const filled = fields.filter(f => {
      const val = fragrance[f];
      if (Array.isArray(val)) return val.length > 0;
      return val !== null && val !== undefined && val !== '';
    }).length;
    return filled / fields.length;
  }

  private getMissingFields(fragrance: any): string[] {
    const fields = [
      { key: 'description', label: 'description' },
      { key: 'concentration', label: 'concentration' },
      { key: 'family', label: 'family' },
      { key: 'top_notes', label: 'notes' },
      { key: 'image_url', label: 'image' }
    ];
    return fields
      .filter(f => {
        const val = fragrance[f.key];
        if (Array.isArray(val)) return val.length === 0;
        return val === null || val === undefined || val === '';
      })
      .map(f => f.label);
  }

  // ===========================================================================
  // ANALYTICS & REPORTING
  // ===========================================================================

  async getEnhancementStats(adminId?: string): Promise<{
    total_requests: number;
    completed_requests: number;
    failed_requests: number;
    pending_approvals: number;
    success_rate: number;
    avg_processing_time_hours: number;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        total_requests: 0,
        completed_requests: 0,
        failed_requests: 0,
        pending_approvals: 0,
        success_rate: 0,
        avg_processing_time_hours: 0
      };
    }
    const supabase = getSupabase()!;

    try {
      let requestsQuery = supabase.from('fragrance_enhancement_requests').select('status, created_at, started_at, completed_at');
      let changesQuery = supabase.from('fragrance_enhancement_changes').select('status');

      if (adminId) {
        requestsQuery = requestsQuery.eq('admin_id', adminId);
        changesQuery = changesQuery.eq('request.admin_id', adminId);
      }

      const [requestsResult, changesResult] = await Promise.all([
        requestsQuery,
        changesQuery
      ]);

      const requests = requestsResult.data || [];
      const changes = changesResult.data || [];

      const totalRequests = requests.length;
      const completedRequests = requests.filter(r => r.status === 'completed').length;
      const failedRequests = requests.filter(r => r.status === 'failed').length;
      const pendingApprovals = changes.filter(c => c.status === 'pending').length;

      const successRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

      // Calculate average processing time
      const completedWithTimes = requests.filter(r =>
        r.status === 'completed' && r.started_at && r.completed_at
      );

      let avgProcessingTimeHours = 0;
      if (completedWithTimes.length > 0) {
        const totalTimeMs = completedWithTimes.reduce((sum, r) => {
          const start = new Date(r.started_at!).getTime();
          const end = new Date(r.completed_at!).getTime();
          return sum + (end - start);
        }, 0);
        avgProcessingTimeHours = totalTimeMs / (completedWithTimes.length * 1000 * 60 * 60);
      }

      return {
        total_requests: totalRequests,
        completed_requests: completedRequests,
        failed_requests: failedRequests,
        pending_approvals: pendingApprovals,
        success_rate: parseFloat(successRate.toFixed(2)),
        avg_processing_time_hours: parseFloat(avgProcessingTimeHours.toFixed(2))
      };
    } catch (error) {
      console.error('Error getting enhancement stats:', error);
      return {
        total_requests: 0,
        completed_requests: 0,
        failed_requests: 0,
        pending_approvals: 0,
        success_rate: 0,
        avg_processing_time_hours: 0
      };
    }
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

export const enhancementService = new EnhancementService();