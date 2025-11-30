/**
 * Automated Fragrance Enhancement Pipeline
 * Batch processing system for AI-powered fragrance data enhancement
 */

import { aiService, FragranceEnhancementRequest, FragranceEnhancementResult } from './aiService';
import { supabase } from './supabase';

export interface AutoEnhancementJob {
  id: string;
  name: string;
  targetFragrances: string[];
  researchScope: {
    verifyBasicInfo: boolean;
    updatePricing: boolean;
    enhanceNotes: boolean;
    findPerfumers: boolean;
    checkAvailability: boolean;
    verifyYear: boolean;
    updateClassification: boolean;
  };
  batchSize: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    currentItem?: string;
  };
  settings: {
    maxCostPerItem: number;
    maxTotalCost: number;
    confidenceThreshold: number;
    skipVerifiedFragrances: boolean;
    australianFocus: boolean;
    retailersToCheck: string[];
  };
  schedule?: {
    startTime: Date;
    endTime?: Date;
    intervalHours?: number;
    recurring?: boolean;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
}

export interface EnhancementJobResult {
  jobId: string;
  fragmentId: string;
  status: 'completed' | 'failed' | 'skipped';
  result?: FragranceEnhancementResult;
  error?: string;
  cost: number;
  processingTime: number;
  qualityImprovement: number;
  changesApplied: string[];
}

export interface PipelineStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEnhancements: number;
  totalCostSpent: number;
  averageQualityImprovement: number;
  processingSpeed: number; // items per hour
  successRate: number;
  topRetailers: Array<{ name: string; count: number }>;
  commonEnhancements: Array<{ type: string; count: number }>;
}

class FragranceEnhancementPipeline {
  private activeJobs = new Map<string, AutoEnhancementJob>();
  private jobQueue: string[] = [];
  private processing = false;
  private readonly maxConcurrentJobs = 3;

  async createEnhancementJob(jobData: Omit<AutoEnhancementJob, 'id' | 'createdAt' | 'progress' | 'status'>): Promise<AutoEnhancementJob> {
    const job: AutoEnhancementJob = {
      ...jobData,
      id: this.generateJobId(),
      status: 'pending',
      progress: {
        total: jobData.targetFragrances.length,
        completed: 0,
        failed: 0,
        skipped: 0
      },
      createdAt: new Date()
    };

    // Save job to database
    await this.saveJob(job);

    // Add to queue
    this.addJobToQueue(job.id);

    return job;
  }

  async createBulkEnhancementJob(
    name: string,
    filters: any,
    settings: AutoEnhancementJob['settings'],
    createdBy: string
  ): Promise<AutoEnhancementJob> {

    // Get fragrances based on filters
    const targetFragrances = await this.getFragrancesForEnhancement(filters);

    const job = await this.createEnhancementJob({
      name,
      targetFragrances: targetFragrances.map(f => f.id),
      researchScope: {
        verifyBasicInfo: true,
        updatePricing: settings.australianFocus,
        enhanceNotes: true,
        findPerfumers: true,
        checkAvailability: settings.australianFocus,
        verifyYear: true,
        updateClassification: true
      },
      batchSize: 10,
      priority: 'medium',
      settings,
      createdBy
    });

    return job;
  }

  async startJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'pending' && job.status !== 'paused') {
      throw new Error(`Cannot start job in ${job.status} status`);
    }

    job.status = 'running';
    job.startedAt = new Date();
    await this.saveJob(job);

    this.activeJobs.set(jobId, job);

    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }
  }

  async pauseJob(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'paused';
      await this.saveJob(job);
      this.activeJobs.delete(jobId);
    }
  }

  async resumeJob(jobId: string): Promise<void> {
    await this.startJob(jobId);
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.completedAt = new Date();
      await this.saveJob(job);
      this.activeJobs.delete(jobId);
    }
  }

  async getJob(jobId: string): Promise<AutoEnhancementJob | null> {
    try {
      const { data, error } = await supabase
        .from('enhancement_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) return null;
      return this.parseJobFromDB(data);
    } catch (error) {
      console.error('Error getting job:', error);
      return null;
    }
  }

  async getAllJobs(createdBy?: string): Promise<AutoEnhancementJob[]> {
    try {
      let query = supabase.from('enhancement_jobs').select('*');

      if (createdBy) {
        query = query.eq('created_by', createdBy);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(job => this.parseJobFromDB(job)) || [];
    } catch (error) {
      console.error('Error getting jobs:', error);
      return [];
    }
  }

  async getJobResults(jobId: string): Promise<EnhancementJobResult[]> {
    try {
      const { data, error } = await supabase
        .from('enhancement_results')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at');

      if (error) throw error;
      return data?.map(result => this.parseResultFromDB(result)) || [];
    } catch (error) {
      console.error('Error getting job results:', error);
      return [];
    }
  }

  async getPipelineStats(): Promise<PipelineStats> {
    try {
      // Get job statistics
      const { data: jobsData } = await supabase
        .from('enhancement_jobs')
        .select('status, created_at');

      // Get enhancement statistics
      const { data: resultsData } = await supabase
        .from('enhancement_results')
        .select('status, cost, processing_time, quality_improvement, retailers_checked');

      const totalJobs = jobsData?.length || 0;
      const activeJobs = jobsData?.filter(j => j.status === 'running').length || 0;
      const completedJobs = jobsData?.filter(j => j.status === 'completed').length || 0;

      const completedResults = resultsData?.filter(r => r.status === 'completed') || [];
      const totalEnhancements = completedResults.length;
      const totalCostSpent = completedResults.reduce((sum, r) => sum + (r.cost || 0), 0);
      const averageQualityImprovement = totalEnhancements > 0
        ? completedResults.reduce((sum, r) => sum + (r.quality_improvement || 0), 0) / totalEnhancements
        : 0;

      // Calculate processing speed (items per hour)
      const totalProcessingTime = completedResults.reduce((sum, r) => sum + (r.processing_time || 0), 0);
      const processingSpeed = totalProcessingTime > 0
        ? (totalEnhancements / (totalProcessingTime / 3600000)) // Convert ms to hours
        : 0;

      const successRate = resultsData?.length > 0
        ? (completedResults.length / resultsData.length) * 100
        : 0;

      // Top retailers
      const retailerCounts = new Map<string, number>();
      completedResults.forEach(result => {
        const retailers = result.retailers_checked || [];
        retailers.forEach((retailer: string) => {
          retailerCounts.set(retailer, (retailerCounts.get(retailer) || 0) + 1);
        });
      });

      const topRetailers = Array.from(retailerCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalJobs,
        activeJobs,
        completedJobs,
        totalEnhancements,
        totalCostSpent,
        averageQualityImprovement,
        processingSpeed,
        successRate,
        topRetailers,
        commonEnhancements: [] // TODO: Implement
      };

    } catch (error) {
      console.error('Error getting pipeline stats:', error);
      return this.getDefaultStats();
    }
  }

  async createSmartEnhancementJob(
    criteria: {
      priorityLevel: 'low_quality' | 'missing_data' | 'unverified' | 'outdated_pricing';
      maxItems?: number;
      focusAreas?: string[];
    },
    createdBy: string
  ): Promise<AutoEnhancementJob> {

    const filters = this.buildSmartFilters(criteria);
    const targetFragrances = await this.getFragrancesForEnhancement(filters);

    // Limit items if specified
    const limitedFragrances = criteria.maxItems
      ? targetFragrances.slice(0, criteria.maxItems)
      : targetFragrances;

    const settings: AutoEnhancementJob['settings'] = {
      maxCostPerItem: 1.0, // $1 AUD per item
      maxTotalCost: 50.0, // $50 AUD total
      confidenceThreshold: 70,
      skipVerifiedFragrances: criteria.priorityLevel !== 'unverified',
      australianFocus: true,
      retailersToCheck: [
        'Chemist Warehouse',
        'Priceline',
        'David Jones',
        'Myer',
        'Adore Beauty',
        'Sephora Australia'
      ]
    };

    return this.createEnhancementJob({
      name: `Smart Enhancement: ${criteria.priorityLevel} (${limitedFragrances.length} items)`,
      targetFragrances: limitedFragrances.map(f => f.id),
      researchScope: this.buildResearchScope(criteria),
      batchSize: 5,
      priority: 'medium',
      settings,
      createdBy
    });
  }

  private async startProcessing(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (this.activeJobs.size > 0 || this.jobQueue.length > 0) {
      // Start new jobs from queue
      while (this.activeJobs.size < this.maxConcurrentJobs && this.jobQueue.length > 0) {
        const jobId = this.jobQueue.shift();
        if (jobId) {
          const job = await this.getJob(jobId);
          if (job && job.status === 'pending') {
            await this.startJob(jobId);
          }
        }
      }

      // Process active jobs
      const processingPromises = Array.from(this.activeJobs.values()).map(job =>
        this.processJob(job)
      );

      await Promise.all(processingPromises);

      // Wait before next iteration
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processing = false;
  }

  private async processJob(job: AutoEnhancementJob): Promise<void> {
    try {
      const remainingFragrances = job.targetFragrances.slice(job.progress.completed + job.progress.failed + job.progress.skipped);

      if (remainingFragrances.length === 0) {
        // Job completed
        job.status = 'completed';
        job.completedAt = new Date();
        await this.saveJob(job);
        this.activeJobs.delete(job.id);
        return;
      }

      // Process next batch
      const batch = remainingFragrances.slice(0, job.batchSize);
      const batchPromises = batch.map(fragmentId => this.processFragrance(job, fragmentId));

      await Promise.all(batchPromises);

    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      job.status = 'failed';
      await this.saveJob(job);
      this.activeJobs.delete(job.id);
    }
  }

  private async processFragrance(job: AutoEnhancementJob, fragmentId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Get current fragrance data
      const { data: fragrance, error } = await supabase
        .from('fragrances')
        .select('*')
        .eq('id', fragmentId)
        .single();

      if (error || !fragrance) {
        await this.recordResult(job.id, fragmentId, 'skipped', undefined, 'Fragrance not found', 0, 0, 0, []);
        job.progress.skipped++;
        job.progress.currentItem = fragmentId;
        await this.saveJob(job);
        return;
      }

      // Skip if verified and settings say to skip
      if (job.settings.skipVerifiedFragrances && fragrance.verified) {
        await this.recordResult(job.id, fragmentId, 'skipped', undefined, 'Already verified', 0, 0, 0, []);
        job.progress.skipped++;
        job.progress.currentItem = fragmentId;
        await this.saveJob(job);
        return;
      }

      // Build enhancement request
      const enhancementRequest: FragranceEnhancementRequest = {
        fragmentId,
        currentData: fragrance,
        researchScope: job.researchScope,
        retailersToCheck: job.settings.retailersToCheck
      };

      // Check cost limits
      if (!aiService.canAffordEnhancement(4000)) {
        await this.recordResult(job.id, fragmentId, 'skipped', undefined, 'Budget exceeded', 0, 0, 0, []);
        job.progress.skipped++;
        job.progress.currentItem = fragmentId;
        await this.saveJob(job);
        return;
      }

      // Perform AI enhancement
      const result = await aiService.enhanceFragrance(enhancementRequest);

      // Check confidence threshold
      if (result.confidence < job.settings.confidenceThreshold) {
        await this.recordResult(job.id, fragmentId, 'skipped', result, 'Low confidence', result.costBreakdown.estimatedCost, Date.now() - startTime, 0, []);
        job.progress.skipped++;
        job.progress.currentItem = fragmentId;
        await this.saveJob(job);
        return;
      }

      // Apply changes to database
      const changesApplied = await this.applyEnhancements(fragmentId, result);
      const qualityImprovement = this.calculateQualityImprovement(fragrance, result);

      await this.recordResult(job.id, fragmentId, 'completed', result, undefined, result.costBreakdown.estimatedCost, Date.now() - startTime, qualityImprovement, changesApplied);

      job.progress.completed++;
      job.progress.currentItem = fragmentId;
      await this.saveJob(job);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      await this.recordResult(job.id, fragmentId, 'failed', undefined, error.message, 0, processingTime, 0, []);

      job.progress.failed++;
      job.progress.currentItem = fragmentId;
      await this.saveJob(job);
    }
  }

  private async applyEnhancements(fragmentId: string, result: FragranceEnhancementResult): Promise<string[]> {
    const changesApplied: string[] = [];

    try {
      const updates: any = {};

      // Apply suggested changes
      Object.entries(result.suggestedChanges).forEach(([field, change]) => {
        if (change.confidence >= 80) { // High confidence threshold for automatic updates
          updates[field] = change.suggested;
          changesApplied.push(field);
        }
      });

      if (Object.keys(updates).length > 0) {
        // Update last_enhanced timestamp
        updates.last_enhanced = new Date().toISOString();
        updates.data_quality_score = Math.min(100, (updates.data_quality_score || 70) + 10);

        const { error } = await supabase
          .from('fragrances')
          .update(updates)
          .eq('id', fragmentId);

        if (error) {
          throw error;
        }
      }

    } catch (error) {
      console.error('Error applying enhancements:', error);
    }

    return changesApplied;
  }

  private calculateQualityImprovement(originalData: any, result: FragranceEnhancementResult): number {
    let improvement = 0;

    // Count fields that were enhanced
    const enhancementCount = Object.keys(result.suggestedChanges).length;
    improvement += enhancementCount * 5;

    // Boost for high confidence
    if (result.confidence >= 90) improvement += 20;
    else if (result.confidence >= 80) improvement += 10;

    // Boost for verified sources
    if (result.researchSources.officialSources.length > 0) improvement += 15;

    return Math.min(100, improvement);
  }

  // Helper methods
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private addJobToQueue(jobId: string): void {
    this.jobQueue.push(jobId);
  }

  private async getFragrancesForEnhancement(filters: any): Promise<any[]> {
    let query = supabase.from('fragrances').select('id, name, brand, data_quality_score, verified, last_enhanced');

    // Apply filters
    if (filters.minQualityScore !== undefined) {
      query = query.gte('data_quality_score', filters.minQualityScore);
    }
    if (filters.maxQualityScore !== undefined) {
      query = query.lte('data_quality_score', filters.maxQualityScore);
    }
    if (filters.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }
    if (filters.brand) {
      query = query.ilike('brand', `%${filters.brand}%`);
    }
    if (filters.notEnhancedSince) {
      query = query.or(`last_enhanced.is.null,last_enhanced.lt.${filters.notEnhancedSince}`);
    }

    const { data, error } = await query.limit(filters.limit || 1000);

    if (error) {
      console.error('Error getting fragrances for enhancement:', error);
      return [];
    }

    return data || [];
  }

  private buildSmartFilters(criteria: any): any {
    const filters: any = {};

    switch (criteria.priorityLevel) {
      case 'low_quality':
        filters.maxQualityScore = 60;
        break;
      case 'missing_data':
        filters.maxQualityScore = 70;
        break;
      case 'unverified':
        filters.verified = false;
        break;
      case 'outdated_pricing':
        filters.notEnhancedSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
        break;
    }

    if (criteria.maxItems) {
      filters.limit = criteria.maxItems;
    }

    return filters;
  }

  private buildResearchScope(criteria: any): AutoEnhancementJob['researchScope'] {
    const scope: AutoEnhancementJob['researchScope'] = {
      verifyBasicInfo: true,
      updatePricing: true,
      enhanceNotes: true,
      findPerfumers: true,
      checkAvailability: true,
      verifyYear: true,
      updateClassification: true
    };

    // Customize based on criteria
    if (criteria.priorityLevel === 'outdated_pricing') {
      scope.verifyBasicInfo = false;
      scope.enhanceNotes = false;
      scope.updatePricing = true;
      scope.checkAvailability = true;
    }

    return scope;
  }

  private async saveJob(job: AutoEnhancementJob): Promise<void> {
    try {
      const jobData = {
        id: job.id,
        name: job.name,
        target_fragrances: job.targetFragrances,
        research_scope: job.researchScope,
        batch_size: job.batchSize,
        priority: job.priority,
        status: job.status,
        progress: job.progress,
        settings: job.settings,
        schedule: job.schedule,
        created_at: job.createdAt.toISOString(),
        started_at: job.startedAt?.toISOString(),
        completed_at: job.completedAt?.toISOString(),
        created_by: job.createdBy
      };

      const { error } = await supabase
        .from('enhancement_jobs')
        .upsert(jobData);

      if (error) {
        console.error('Error saving job:', error);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  }

  private async recordResult(
    jobId: string,
    fragmentId: string,
    status: 'completed' | 'failed' | 'skipped',
    result?: FragranceEnhancementResult,
    error?: string,
    cost: number = 0,
    processingTime: number = 0,
    qualityImprovement: number = 0,
    changesApplied: string[] = []
  ): Promise<void> {
    try {
      const resultData = {
        job_id: jobId,
        fragment_id: fragmentId,
        status,
        result: result ? JSON.stringify(result) : null,
        error,
        cost,
        processing_time: processingTime,
        quality_improvement: qualityImprovement,
        changes_applied: changesApplied,
        retailers_checked: result?.researchSources?.retailerPricing?.map(r => r.retailer) || [],
        created_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('enhancement_results')
        .insert(resultData);

      if (dbError) {
        console.error('Error recording result:', dbError);
      }
    } catch (error) {
      console.error('Error recording result:', error);
    }
  }

  private parseJobFromDB(data: any): AutoEnhancementJob {
    return {
      id: data.id,
      name: data.name,
      targetFragrances: data.target_fragrances,
      researchScope: data.research_scope,
      batchSize: data.batch_size,
      priority: data.priority,
      status: data.status,
      progress: data.progress,
      settings: data.settings,
      schedule: data.schedule,
      createdAt: new Date(data.created_at),
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      createdBy: data.created_by
    };
  }

  private parseResultFromDB(data: any): EnhancementJobResult {
    return {
      jobId: data.job_id,
      fragmentId: data.fragment_id,
      status: data.status,
      result: data.result ? JSON.parse(data.result) : undefined,
      error: data.error,
      cost: data.cost,
      processingTime: data.processing_time,
      qualityImprovement: data.quality_improvement,
      changesApplied: data.changes_applied
    };
  }

  private getDefaultStats(): PipelineStats {
    return {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      totalEnhancements: 0,
      totalCostSpent: 0,
      averageQualityImprovement: 0,
      processingSpeed: 0,
      successRate: 0,
      topRetailers: [],
      commonEnhancements: []
    };
  }
}

// Export singleton instance
export const enhancementPipeline = new FragranceEnhancementPipeline();
export default enhancementPipeline;