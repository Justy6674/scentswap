import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Database,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Settings,
  BarChart3,
  Zap,
  RefreshCw
} from 'lucide-react';

import { FragranceSelector } from './FragranceSelector';
import { EnhancementQueue } from './EnhancementQueue';
import { EnhancementPreviewModal } from './EnhancementPreviewModal';
import {
  enhancementService,
  EnhancementRequest,
  EnhancementQueueStats
} from '@/lib/enhancement-service';

interface EnhancementDashboardProps {
  adminId: string;
}

interface EnhancementStats {
  total_requests: number;
  completed_requests: number;
  failed_requests: number;
  pending_approvals: number;
  success_rate: number;
  avg_processing_time_hours: number;
}

export const EnhancementDashboard: React.FC<EnhancementDashboardProps> = ({
  adminId
}) => {
  const [activeTab, setActiveTab] = useState('selector');
  const [stats, setStats] = useState<EnhancementStats | null>(null);
  const [queueStats, setQueueStats] = useState<EnhancementQueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview Modal State
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    requestId: null as string | null,
    fragranceId: null as string | null,
    fragrance: null as any
  });

  // Load dashboard stats
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [enhancementStats, queueData] = await Promise.all([
        enhancementService.getEnhancementStats(adminId),
        enhancementService.getQueueStats()
      ]);

      setStats(enhancementStats);
      setQueueStats(queueData);

    } catch (err) {
      console.error('Error loading enhancement stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  // Load stats on mount and set up auto-refresh
  useEffect(() => {
    loadStats();

    // Refresh stats every 2 minutes
    const interval = setInterval(loadStats, 120000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // Handle enhancement start
  const handleEnhancementStart = (fragranceId: string) => {
    // Switch to queue tab to show progress
    setActiveTab('queue');
  };

  // Handle enhancement completion
  const handleEnhancementComplete = (fragranceId: string, changes: any[]) => {
    // Show preview modal for approval
    setPreviewModal({
      isOpen: true,
      requestId: changes[0]?.request_id || null,
      fragranceId,
      fragrance: null // Will be loaded in modal
    });
  };

  // Handle request selection from queue
  const handleRequestSelect = (request: EnhancementRequest) => {
    setPreviewModal({
      isOpen: true,
      requestId: request.id,
      fragranceId: request.fragrance_id,
      fragrance: null
    });
  };

  // Handle approval completion
  const handleApprovalComplete = (appliedChanges: number, errors: string[]) => {
    if (errors.length > 0) {
      setError(`Applied ${appliedChanges} changes with ${errors.length} errors`);
    } else {
      setError(null);
    }

    // Refresh stats to reflect changes
    loadStats();

    // Close modal
    setPreviewModal({
      isOpen: false,
      requestId: null,
      fragranceId: null,
      fragrance: null
    });
  };

  return (
    <div className="space-y-6 p-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-brown" />
            AI Enhancement Dashboard
          </h1>
          <p className="text-cream mt-1">
            Optimise fragrance database with AI-powered analysis and web scraping
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadStats}
          disabled={loading}
          className="text-cream border-slate-600"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      {stats && queueStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cream">Queue Status</p>
                  <p className="text-2xl font-bold text-white">
                    {queueStats.pending_requests + queueStats.processing_requests}
                  </p>
                  <p className="text-xs text-slate-400">
                    {queueStats.pending_requests} pending, {queueStats.processing_requests} active
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cream">Success Rate</p>
                  <p className="text-2xl font-bold text-white">{stats.success_rate}%</p>
                  <p className="text-xs text-slate-400">
                    {stats.completed_requests} / {stats.total_requests} completed
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cream">Pending Approvals</p>
                  <p className="text-2xl font-bold text-white">{queueStats.pending_approvals}</p>
                  <p className="text-xs text-slate-400">Changes awaiting review</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cream">Avg. Processing</p>
                  <p className="text-2xl font-bold text-white">{stats.avg_processing_time_hours}h</p>
                  <p className="text-xs text-slate-400">Per fragrance</p>
                </div>
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Enhancement Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-700">
              <TabsTrigger
                value="selector"
                className="data-[state=active]:bg-brown data-[state=active]:text-white"
              >
                <Database className="h-4 w-4 mr-2" />
                Select & Enhance
              </TabsTrigger>
              <TabsTrigger
                value="queue"
                className="data-[state=active]:bg-brown data-[state=active]:text-white"
              >
                <Clock className="h-4 w-4 mr-2" />
                Queue
                {queueStats && (queueStats.pending_requests + queueStats.processing_requests) > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 text-xs">
                    {queueStats.pending_requests + queueStats.processing_requests}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="approvals"
                className="data-[state=active]:bg-brown data-[state=active]:text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approvals
                {queueStats && queueStats.pending_approvals > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 text-xs">
                    {queueStats.pending_approvals}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-brown data-[state=active]:text-white"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="selector" className="mt-6">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Select Fragrances for AI Enhancement
                  </h3>
                  <p className="text-cream">
                    Filter and select fragrances to enhance with AI analysis and web scraping
                  </p>
                </div>
                <FragranceSelector
                  adminId={adminId}
                  onEnhancementStart={handleEnhancementStart}
                  onEnhancementComplete={handleEnhancementComplete}
                />
              </div>
            </TabsContent>

            <TabsContent value="queue" className="mt-6">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Enhancement Queue Management
                  </h3>
                  <p className="text-cream">
                    Monitor and manage ongoing enhancement requests
                  </p>
                </div>
                <EnhancementQueue
                  adminId={adminId}
                  onRequestSelect={handleRequestSelect}
                />
              </div>
            </TabsContent>

            <TabsContent value="approvals" className="mt-6">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Pending Approvals
                  </h3>
                  <p className="text-cream">
                    Review and approve AI-generated changes before applying to database
                  </p>
                </div>

                {queueStats?.pending_approvals === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      All Clear!
                    </h3>
                    <p className="text-cream">
                      No pending approvals at this time.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-medium">
                        {queueStats?.pending_approvals || 0} changes awaiting approval
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('queue')}
                        className="text-cream border-slate-600"
                      >
                        View Queue
                      </Button>
                    </div>
                    <p className="text-cream text-sm">
                      Switch to the Queue tab to review and approve individual enhancement requests.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Enhancement Analytics
                  </h3>
                  <p className="text-cream">
                    Performance metrics and insights for AI enhancement operations
                  </p>
                </div>

                {stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-900 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Request Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-cream">Total Requests:</span>
                          <span className="text-white font-semibold">{stats.total_requests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream">Completed:</span>
                          <span className="text-green-400 font-semibold">{stats.completed_requests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream">Failed:</span>
                          <span className="text-red-400 font-semibold">{stats.failed_requests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream">Success Rate:</span>
                          <span className="text-white font-semibold">{stats.success_rate}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Performance Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-cream">Avg. Processing Time:</span>
                          <span className="text-white font-semibold">{stats.avg_processing_time_hours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream">Queue Length:</span>
                          <span className="text-white font-semibold">
                            {(queueStats?.pending_requests || 0) + (queueStats?.processing_requests || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream">Today's Completed:</span>
                          <span className="text-white font-semibold">{queueStats?.total_completed_today || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream">Avg. Queue Time:</span>
                          <span className="text-white font-semibold">{queueStats?.avg_processing_time_minutes || 0}m</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-cream">
                    Loading analytics...
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Enhancement Preview Modal */}
      <EnhancementPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() =>
          setPreviewModal({
            isOpen: false,
            requestId: null,
            fragranceId: null,
            fragrance: null
          })
        }
        requestId={previewModal.requestId}
        fragranceId={previewModal.fragranceId}
        fragrance={previewModal.fragrance}
        adminId={adminId}
        onApprovalComplete={handleApprovalComplete}
      />
    </div>
  );
};