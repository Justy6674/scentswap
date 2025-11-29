import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Zap,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  SkipForward,
  Settings
} from 'lucide-react';
import {
  enhancementService,
  EnhancementRequest,
  FragranceForEnhancement
} from '@/lib/enhancement-service';

interface BulkEnhancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  selectedFragrances?: string[];
  onBulkComplete: (results: BulkEnhancementResult) => void;
}

interface BulkEnhancementConfig {
  enhancementType: 'ai_analysis' | 'web_scrape' | 'hybrid';
  priority: number;
  confidenceThreshold: number;
  batchSize: number;
  maxConcurrent: number;
  includeNotes: boolean;
  includeAccords: boolean;
  includePerformance: boolean;
  skipRecentlyEnhanced: boolean;
  daysThreshold: number;
}

interface BulkEnhancementResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  requestIds: string[];
  errors: string[];
}

interface ProcessingStatus {
  fragranceId: string;
  fragranceName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  requestId?: string;
  error?: string;
  progress: number;
}

export const BulkEnhancementModal: React.FC<BulkEnhancementModalProps> = ({
  isOpen,
  onClose,
  adminId,
  selectedFragrances = [],
  onBulkComplete
}) => {
  const [step, setStep] = useState<'config' | 'processing' | 'results'>('config');
  const [config, setConfig] = useState<BulkEnhancementConfig>({
    enhancementType: 'hybrid',
    priority: 5,
    confidenceThreshold: 0.7,
    batchSize: 5,
    maxConcurrent: 2,
    includeNotes: true,
    includeAccords: true,
    includePerformance: true,
    skipRecentlyEnhanced: true,
    daysThreshold: 7
  });

  const [fragrances, setFragrances] = useState<FragranceForEnhancement[]>([]);
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<BulkEnhancementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load candidate fragrances
  useEffect(() => {
    if (isOpen && step === 'config') {
      loadCandidateFragrances();
    }
  }, [isOpen, step]);

  // Pre-select provided fragrances
  useEffect(() => {
    if (selectedFragrances.length > 0) {
      setSelectedForBulk(new Set(selectedFragrances));
    }
  }, [selectedFragrances]);

  const loadCandidateFragrances = async () => {
    setLoading(true);
    setError(null);

    try {
      const candidates = await enhancementService.getFragrancesNeedingEnhancement(
        100, // Get more candidates for selection
        undefined, // No brand filter
        undefined // No specific missing fields filter
      );

      // Filter based on configuration
      const filtered = candidates.filter(fragrance => {
        if (config.skipRecentlyEnhanced && fragrance.last_enhanced_at) {
          const lastEnhanced = new Date(fragrance.last_enhanced_at);
          const daysSince = (Date.now() - lastEnhanced.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince > config.daysThreshold;
        }
        return true;
      });

      setFragrances(filtered);

      // If we have selected fragrances, filter to only those
      if (selectedFragrances.length > 0) {
        const preSelected = filtered.filter(f => selectedFragrances.includes(f.id));
        setFragrances(preSelected);
        setSelectedForBulk(new Set(selectedFragrances));
      }

    } catch (err) {
      console.error('Error loading candidate fragrances:', err);
      setError(err instanceof Error ? err.message : 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  // Toggle fragrance selection
  const toggleFragranceSelection = (fragranceId: string) => {
    setSelectedForBulk(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fragranceId)) {
        newSet.delete(fragranceId);
      } else {
        newSet.add(fragranceId);
      }
      return newSet;
    });
  };

  // Select all visible fragrances
  const selectAll = () => {
    setSelectedForBulk(new Set(fragrances.map(f => f.id)));
  };

  // Deselect all fragrances
  const deselectAll = () => {
    setSelectedForBulk(new Set());
  };

  // Start bulk processing
  const startBulkProcessing = async () => {
    if (selectedForBulk.size === 0) return;

    setStep('processing');
    setIsProcessing(true);
    setIsPaused(false);

    const selectedFragranceIds = Array.from(selectedForBulk);
    const initialStatus: ProcessingStatus[] = selectedFragranceIds.map(id => {
      const fragrance = fragrances.find(f => f.id === id);
      return {
        fragranceId: id,
        fragranceName: fragrance ? `${fragrance.brand} ${fragrance.name}` : 'Unknown',
        status: 'pending',
        progress: 0
      };
    });

    setProcessingStatus(initialStatus);

    const result: BulkEnhancementResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      requestIds: [],
      errors: []
    };

    // Process in batches
    try {
      for (let i = 0; i < selectedFragranceIds.length; i += config.batchSize) {
        if (isPaused) {
          break; // Stop if paused
        }

        const batch = selectedFragranceIds.slice(i, i + config.batchSize);

        // Create enhancement requests for the batch
        const requestIds = await enhancementService.createBulkEnhancementRequests(
          batch,
          adminId,
          config.enhancementType,
          config.priority
        );

        // Update status for successful requests
        batch.forEach((fragranceId, index) => {
          const requestId = requestIds[index];
          setProcessingStatus(prev =>
            prev.map(status =>
              status.fragranceId === fragranceId
                ? {
                    ...status,
                    status: requestId ? 'processing' : 'failed',
                    requestId,
                    error: requestId ? undefined : 'Failed to create request',
                    progress: requestId ? 50 : 0
                  }
                : status
            )
          );

          if (requestId) {
            result.successful++;
            result.requestIds.push(requestId);
          } else {
            result.failed++;
            result.errors.push(`Failed to create request for fragrance ${fragranceId}`);
          }

          result.totalProcessed++;
        });

        // Add delay between batches to avoid overwhelming the system
        if (i + config.batchSize < selectedFragranceIds.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setResults(result);
      setStep('results');

    } catch (err) {
      console.error('Bulk processing error:', err);
      setError(err instanceof Error ? err.message : 'Bulk processing failed');
      result.errors.push(err instanceof Error ? err.message : 'Unknown error');
      setResults(result);
      setStep('results');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate overall progress
  const calculateProgress = (): number => {
    if (processingStatus.length === 0) return 0;

    const totalProgress = processingStatus.reduce((sum, status) => sum + status.progress, 0);
    return Math.round(totalProgress / processingStatus.length);
  };

  // Get status counts
  const getStatusCounts = () => {
    const counts = { pending: 0, processing: 0, completed: 0, failed: 0, skipped: 0 };
    processingStatus.forEach(status => {
      counts[status.status]++;
    });
    return counts;
  };

  const handleClose = () => {
    if (results) {
      onBulkComplete(results);
    }

    // Reset state
    setStep('config');
    setIsProcessing(false);
    setIsPaused(false);
    setResults(null);
    setProcessingStatus([]);
    setSelectedForBulk(new Set());
    setError(null);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-brown" />
            Bulk AI Enhancement
          </DialogTitle>
          <DialogDescription className="text-cream">
            {step === 'config' && 'Configure and select fragrances for bulk AI enhancement'}
            {step === 'processing' && 'Processing enhancement requests...'}
            {step === 'results' && 'Bulk enhancement completed'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Configuration Step */}
          {step === 'config' && (
            <div className="space-y-6">
              {/* Enhancement Configuration */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Enhancement Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-cream mb-1 block">Enhancement Type</label>
                    <Select
                      value={config.enhancementType}
                      onValueChange={(value: any) =>
                        setConfig(prev => ({ ...prev, enhancementType: value }))
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ai_analysis">AI Analysis Only</SelectItem>
                        <SelectItem value="web_scrape">Web Scraping Only</SelectItem>
                        <SelectItem value="hybrid">Hybrid (AI + Web)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-cream mb-1 block">Priority (1-10)</label>
                    <Select
                      value={config.priority.toString()}
                      onValueChange={(value) =>
                        setConfig(prev => ({ ...prev, priority: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Urgent</SelectItem>
                        <SelectItem value="3">3 - High</SelectItem>
                        <SelectItem value="5">5 - Medium</SelectItem>
                        <SelectItem value="7">7 - Low</SelectItem>
                        <SelectItem value="10">10 - Background</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-cream mb-1 block">Batch Size</label>
                    <Select
                      value={config.batchSize.toString()}
                      onValueChange={(value) =>
                        setConfig(prev => ({ ...prev, batchSize: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 fragrances</SelectItem>
                        <SelectItem value="5">5 fragrances</SelectItem>
                        <SelectItem value="10">10 fragrances</SelectItem>
                        <SelectItem value="20">20 fragrances</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Fragrance Selection */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Select Fragrances
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                        className="text-cream border-slate-600"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAll}
                        className="text-cream border-slate-600"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-brown" />
                      <span className="ml-2 text-cream">Loading candidates...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {fragrances.map((fragrance) => (
                        <div
                          key={fragrance.id}
                          className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedForBulk.has(fragrance.id)}
                              onCheckedChange={() => toggleFragranceSelection(fragrance.id)}
                              className="border-slate-600"
                            />
                            <div>
                              <h4 className="text-white font-medium">
                                {fragrance.brand} {fragrance.name}
                              </h4>
                              <p className="text-sm text-cream">
                                Completeness: {fragrance.completeness_score}%
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              fragrance.completeness_score >= 80
                                ? 'text-green-400 border-green-400'
                                : fragrance.completeness_score >= 60
                                ? 'text-yellow-400 border-yellow-400'
                                : 'text-red-400 border-red-400'
                            }
                          >
                            {fragrance.missing_fields?.length || 0} missing fields
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedForBulk.size > 0 && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    {selectedForBulk.size} fragrances selected for bulk enhancement.
                    This will create {selectedForBulk.size} enhancement requests.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    Bulk Processing Progress
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPaused(!isPaused)}
                        disabled={!isProcessing}
                        className="text-cream border-slate-600"
                      >
                        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-cream">Overall Progress</span>
                        <span className="text-cream">{calculateProgress()}%</span>
                      </div>
                      <Progress value={calculateProgress()} className="h-2 bg-slate-700" />
                    </div>

                    {/* Status Summary */}
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(getStatusCounts()).map(([status, count]) => (
                        <div key={status} className="text-center">
                          <p className="text-2xl font-bold text-white">{count}</p>
                          <p className="text-xs text-cream capitalize">{status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Status */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Individual Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {processingStatus.map((status) => (
                      <div
                        key={status.fragranceId}
                        className="flex items-center justify-between p-2 bg-slate-800 rounded"
                      >
                        <span className="text-cream text-sm">{status.fragranceName}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              status.status === 'completed'
                                ? 'default'
                                : status.status === 'failed'
                                ? 'destructive'
                                : 'outline'
                            }
                            className="text-xs"
                          >
                            {status.status}
                          </Badge>
                          {status.status === 'processing' && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Step */}
          {step === 'results' && results && (
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Bulk Enhancement Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{results.totalProcessed}</p>
                      <p className="text-sm text-cream">Total Processed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{results.successful}</p>
                      <p className="text-sm text-cream">Successful</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{results.failed}</p>
                      <p className="text-sm text-cream">Failed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">{results.skipped}</p>
                      <p className="text-sm text-cream">Skipped</p>
                    </div>
                  </div>

                  {results.errors.length > 0 && (
                    <Alert className="mt-4 bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Errors encountered:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {results.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="border-t border-slate-700 pt-4">
          <div className="flex justify-between w-full">
            {step === 'config' && (
              <>
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={startBulkProcessing}
                  disabled={selectedForBulk.size === 0 || loading}
                  className="bg-brown hover:bg-brown/80 text-white"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Start Bulk Enhancement ({selectedForBulk.size})
                </Button>
              </>
            )}

            {step === 'processing' && (
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="text-cream border-slate-600"
              >
                Close
              </Button>
            )}

            {step === 'results' && (
              <Button onClick={handleClose} className="bg-brown hover:bg-brown/80 text-white">
                Done
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};