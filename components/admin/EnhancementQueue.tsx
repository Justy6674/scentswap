import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { enhancementService, EnhancementRequest, EnhancementQueueStats } from '@/lib/enhancement-service';

interface EnhancementQueueProps {
  adminId: string;
  onRequestSelect: (request: EnhancementRequest) => void;
}

interface QueueFilters {
  status: string;
  enhancementType: string;
  priority: string;
}

export const EnhancementQueue: React.FC<EnhancementQueueProps> = ({
  adminId,
  onRequestSelect
}) => {
  const [requests, setRequests] = useState<EnhancementRequest[]>([]);
  const [stats, setStats] = useState<EnhancementQueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QueueFilters>({
    status: 'all',
    enhancementType: 'all',
    priority: 'all'
  });

  // Load queue data
  const loadQueueData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load stats and requests in parallel
      const [statsResult, requestsResult] = await Promise.all([
        enhancementService.getQueueStats(),
        enhancementService.getRequestsForAdmin(adminId, 50)
      ]);

      setStats(statsResult);
      setRequests(requestsResult);

    } catch (err) {
      console.error('Error loading queue data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load queue data');
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  // Auto-refresh queue data
  useEffect(() => {
    loadQueueData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadQueueData, 30000);
    return () => clearInterval(interval);
  }, [loadQueueData]);

  // Filter requests based on current filters
  const filteredRequests = requests.filter(request => {
    if (filters.status !== 'all' && request.status !== filters.status) return false;
    if (filters.enhancementType !== 'all' && request.enhancement_type !== filters.enhancementType) return false;
    if (filters.priority !== 'all') {
      const priority = parseInt(filters.priority);
      if (request.priority !== priority) return false;
    }
    return true;
  });

  // Handle request status changes
  const handleStatusChange = async (
    requestId: string,
    newStatus: EnhancementRequest['status'],
    errorMessage?: string
  ) => {
    setProcessing(prev => new Set(prev).add(requestId));

    try {
      const success = await enhancementService.updateRequestStatus(
        requestId,
        newStatus,
        errorMessage
      );

      if (success) {
        await loadQueueData(); // Refresh data
      } else {
        throw new Error('Failed to update request status');
      }

    } catch (err) {
      console.error('Error updating request status:', err);
      setError(`Failed to update request: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Cancel request
  const cancelRequest = async (requestId: string) => {
    await handleStatusChange(requestId, 'cancelled', `Cancelled by admin ${adminId}`);
  };

  // Retry failed request
  const retryRequest = async (requestId: string) => {
    await handleStatusChange(requestId, 'pending');
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { variant: 'outline' as const, icon: Clock, colour: 'text-yellow-600' },
      'processing': { variant: 'default' as const, icon: Loader2, colour: 'text-blue-600' },
      'completed': { variant: 'default' as const, icon: CheckCircle2, colour: 'text-green-600' },
      'failed': { variant: 'destructive' as const, icon: XCircle, colour: 'text-red-600' },
      'cancelled': { variant: 'secondary' as const, icon: XCircle, colour: 'text-slate-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.colour} ${status === 'processing' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Get priority colour
  const getPriorityColour = (priority: number): string => {
    if (priority <= 2) return 'text-red-600 bg-red-50';
    if (priority <= 4) return 'text-orange-600 bg-orange-50';
    if (priority <= 6) return 'text-blue-600 bg-blue-50';
    return 'text-slate-600 bg-slate-50';
  };

  // Format time elapsed
  const formatTimeElapsed = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ago`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  };

  // Calculate queue progress
  const calculateProgress = (): number => {
    if (!stats) return 0;
    const total = stats.pending_requests + stats.processing_requests;
    if (total === 0) return 100;
    return Math.round((stats.processing_requests / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cream">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pending_requests}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cream">Processing</p>
                  <p className="text-2xl font-bold text-white">{stats.processing_requests}</p>
                </div>
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cream">Pending Approval</p>
                  <p className="text-2xl font-bold text-white">{stats.pending_approvals}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cream">Avg. Time</p>
                  <p className="text-2xl font-bold text-white">{stats.avg_processing_time_minutes}m</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Queue Progress */}
      {stats && (stats.pending_requests > 0 || stats.processing_requests > 0) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-cream">Queue Progress</span>
              <span className="text-sm text-cream">
                {stats.processing_requests} / {stats.pending_requests + stats.processing_requests}
              </span>
            </div>
            <Progress
              value={calculateProgress()}
              className="h-2 bg-slate-700"
            />
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Controls */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Queue Filters
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadQueueData}
              disabled={loading}
              className="text-cream border-slate-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-cream mb-1 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-cream mb-1 block">Enhancement Type</label>
              <Select
                value={filters.enhancementType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, enhancementType: value }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ai_analysis">AI Analysis</SelectItem>
                  <SelectItem value="web_scrape">Web Scraping</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-cream mb-1 block">Priority</label>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="1">Urgent (1-2)</SelectItem>
                  <SelectItem value="3">High (3-4)</SelectItem>
                  <SelectItem value="5">Medium (5-6)</SelectItem>
                  <SelectItem value="7">Low (7-10)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Badge variant="outline" className="text-cream">
                {filteredRequests.length} of {requests.length} shown
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Enhancement Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brown" />
              <span className="ml-2 text-cream">Loading requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-cream">
              {requests.length === 0 ? 'No enhancement requests found' : 'No requests match your filters'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colours cursor-pointer"
                  onClick={() => onRequestSelect(request)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">
                          Request #{request.id.slice(-8)}
                        </h3>
                        {getStatusBadge(request.status)}
                        <Badge
                          className={`text-xs ${getPriorityColour(request.priority)}`}
                        >
                          Priority {request.priority}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-cream mb-3">
                        <div><strong>Type:</strong> {request.enhancement_type.replace(/_/g, ' ')}</div>
                        <div><strong>Created:</strong> {formatTimeElapsed(request.created_at)}</div>
                        <div><strong>Fragrance ID:</strong> {request.fragrance_id}</div>
                        <div><strong>Confidence:</strong> {(request.confidence_threshold * 100).toFixed(0)}%</div>
                      </div>

                      {request.processing_notes && (
                        <p className="text-sm text-slate-300 bg-slate-800 p-2 rounded">
                          <strong>Notes:</strong> {request.processing_notes}
                        </p>
                      )}

                      {request.error_message && (
                        <p className="text-sm text-red-300 bg-red-900/20 p-2 rounded mt-2">
                          <strong>Error:</strong> {request.error_message}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {request.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            retryRequest(request.id);
                          }}
                          disabled={processing.has(request.id)}
                          className="text-cream border-slate-600"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}

                      {(request.status === 'pending' || request.status === 'processing') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelRequest(request.id);
                          }}
                          disabled={processing.has(request.id)}
                          className="text-cream border-slate-600"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestSelect(request);
                        }}
                        className="text-cream"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};