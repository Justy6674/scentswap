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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ArrowRight,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';
import { enhancementService, EnhancementChange } from '@/lib/enhancement-service';

interface EnhancementPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
  fragranceId: string | null;
  fragrance: {
    id: string;
    name: string;
    brand: string;
    [key: string]: any;
  } | null;
  adminId: string;
  onApprovalComplete: (appliedChanges: number, errors: string[]) => void;
}

interface ChangePreview {
  id: string;
  field_name: string;
  old_value: any;
  new_value: any;
  change_type: string;
  confidence_score: number;
  source: string;
  source_url?: string;
  notes?: string;
  validation_errors?: string[];
  selected: boolean;
}

export const EnhancementPreviewModal: React.FC<EnhancementPreviewModalProps> = ({
  isOpen,
  onClose,
  requestId,
  fragranceId,
  fragrance,
  adminId,
  onApprovalComplete
}) => {
  const [changes, setChanges] = useState<ChangePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());

  // Load changes when modal opens
  useEffect(() => {
    if (isOpen && requestId) {
      loadChanges();
    }
  }, [isOpen, requestId]);

  const loadChanges = async () => {
    if (!requestId) return;

    setLoading(true);
    setError(null);

    try {
      const enhancementChanges = await enhancementService.getChangesForRequest(requestId);

      const changesPreviews: ChangePreview[] = enhancementChanges.map(change => ({
        id: change.id,
        field_name: change.field_name,
        old_value: change.old_value,
        new_value: change.new_value,
        change_type: change.change_type,
        confidence_score: change.confidence_score,
        source: change.source,
        source_url: change.source_url,
        notes: change.notes,
        validation_errors: change.validation_errors,
        selected: change.confidence_score >= 0.8 // Auto-select high confidence changes
      }));

      setChanges(changesPreviews);

      // Auto-select high-confidence changes
      const autoSelected = new Set(
        changesPreviews
          .filter(change => change.confidence_score >= 0.8 && !change.validation_errors?.length)
          .map(change => change.id)
      );
      setSelectedChanges(autoSelected);

    } catch (err) {
      console.error('Error loading changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load changes');
    } finally {
      setLoading(false);
    }
  };

  // Toggle change selection
  const toggleChangeSelection = (changeId: string) => {
    setSelectedChanges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(changeId)) {
        newSet.delete(changeId);
      } else {
        newSet.add(changeId);
      }
      return newSet;
    });
  };

  // Select all changes
  const selectAll = () => {
    const validChanges = changes.filter(c => !c.validation_errors?.length);
    setSelectedChanges(new Set(validChanges.map(c => c.id)));
  };

  // Deselect all changes
  const deselectAll = () => {
    setSelectedChanges(new Set());
  };

  // Apply selected changes
  const applySelectedChanges = async () => {
    if (selectedChanges.size === 0) return;

    setApplying(true);
    setError(null);

    try {
      const changeIds = Array.from(selectedChanges);
      const result = await enhancementService.approveChanges(changeIds, adminId);

      onApprovalComplete(result.applied_count, result.errors);
      onClose();

    } catch (err) {
      console.error('Error applying changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply changes');
    } finally {
      setApplying(false);
    }
  };

  // Reject changes
  const rejectChanges = async () => {
    if (!rejectionReason.trim()) return;

    setApplying(true);

    try {
      const allChangeIds = changes.map(c => c.id);
      await enhancementService.rejectChanges(allChangeIds, adminId, rejectionReason);

      setShowRejectionDialog(false);
      onClose();

    } catch (err) {
      console.error('Error rejecting changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject changes');
    } finally {
      setApplying(false);
    }
  };

  // Format field name for display
  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not set';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Get confidence colour
  const getConfidenceColour = (score: number): string => {
    if (score >= 0.9) return 'bg-green-100 text-green-800';
    if (score >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Get change type colour
  const getChangeTypeColour = (type: string): string => {
    switch (type) {
      case 'addition': return 'bg-blue-100 text-blue-800';
      case 'update': return 'bg-orange-100 text-orange-800';
      case 'correction': return 'bg-red-100 text-red-800';
      case 'enhancement': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-brown" />
            Enhancement Preview - {fragrance?.brand} {fragrance?.name}
          </DialogTitle>
          <DialogDescription className="text-cream">
            Review and approve AI-generated enhancements before applying them to the database.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brown" />
              <span className="ml-3 text-cream">Loading enhancement preview...</span>
            </div>
          ) : changes.length === 0 ? (
            <div className="text-center py-12 text-cream">
              No changes were detected for this fragrance.
            </div>
          ) : (
            <>
              {/* Control Bar */}
              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-white font-medium">
                    {selectedChanges.size} of {changes.length} changes selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      className="text-cream border-slate-600"
                    >
                      Select All Valid
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
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-cream">
                    {changes.filter(c => c.confidence_score >= 0.8).length} High Confidence
                  </Badge>
                  <Badge variant="outline" className="text-cream">
                    {changes.filter(c => c.validation_errors?.length).length} Warnings
                  </Badge>
                </div>
              </div>

              {/* Changes List */}
              <div className="space-y-3">
                {changes.map((change) => (
                  <Card
                    key={change.id}
                    className={`transition-all ${
                      selectedChanges.has(change.id)
                        ? 'bg-slate-700 border-brown'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedChanges.has(change.id)}
                            onCheckedChange={() => toggleChangeSelection(change.id)}
                            disabled={!!change.validation_errors?.length}
                            className="border-slate-600"
                          />
                          <div>
                            <CardTitle className="text-white text-base">
                              {formatFieldName(change.field_name)}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={getChangeTypeColour(change.change_type)}
                              >
                                {change.change_type}
                              </Badge>
                              <Badge
                                className={getConfidenceColour(change.confidence_score)}
                              >
                                {Math.round(change.confidence_score * 100)}% confidence
                              </Badge>
                              <Badge variant="outline" className="text-cream">
                                {change.source}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {change.source_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(change.source_url, '_blank')}
                            className="text-cream hover:text-white"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Value Comparison */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-sm text-cream font-medium">Before:</label>
                          <div className="bg-slate-800 p-3 rounded border border-red-300 mt-1">
                            <pre className="text-sm text-white whitespace-pre-wrap">
                              {formatValue(change.old_value)}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-cream font-medium">After:</label>
                          <div className="bg-slate-800 p-3 rounded border border-green-300 mt-1">
                            <pre className="text-sm text-white whitespace-pre-wrap">
                              {formatValue(change.new_value)}
                            </pre>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {change.notes && (
                        <div className="mb-3">
                          <label className="text-sm text-cream font-medium">AI Notes:</label>
                          <p className="text-slate-300 text-sm mt-1">{change.notes}</p>
                        </div>
                      )}

                      {/* Validation Errors */}
                      {change.validation_errors && change.validation_errors.length > 0 && (
                        <Alert className="bg-red-50 border-red-200">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <strong>Validation Issues:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {change.validation_errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-slate-700 pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setShowRejectionDialog(true)}
              disabled={applying || changes.length === 0}
              className="text-cream border-slate-600"
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              Reject All
            </Button>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} disabled={applying}>
                Cancel
              </Button>
              <Button
                onClick={applySelectedChanges}
                disabled={applying || selectedChanges.size === 0}
                className="bg-brown hover:bg-brown/80 text-white"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Applying...
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Apply Selected ({selectedChanges.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>

        {/* Rejection Dialog */}
        {showRejectionDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Reject All Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-cream">
                    Please provide a reason for rejecting these changes:
                  </p>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>
              </CardContent>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowRejectionDialog(false)}
                  disabled={applying}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={rejectChanges}
                  disabled={applying || !rejectionReason.trim()}
                >
                  {applying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Rejecting...
                    </>
                  ) : (
                    'Reject Changes'
                  )}
                </Button>
              </DialogFooter>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};