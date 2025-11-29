import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Sparkles, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSupabase } from '@/lib/supabase';
import { enhancementService } from '@/lib/enhancement-service';
import { aiEnhancementEngine } from '@/lib/ai-enhancement-engine';

interface Fragrance {
  id: string;
  name: string;
  brand: string;
  concentration?: string;
  family?: string;
  gender?: string;
  description?: string;
  completeness_score?: number;
  last_enhanced_at?: string;
  enhancement_status?: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
  fragrantica_url?: string;
}

interface FragranceSelectorProps {
  onEnhancementStart?: (fragranceId: string) => void;
  onEnhancementComplete?: (fragranceId: string, changes: any[]) => void;
  adminId: string;
}

export const FragranceSelector: React.FC<FragranceSelectorProps> = ({
  onEnhancementStart,
  onEnhancementComplete,
  adminId
}) => {
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({
    brand: '',
    name: '',
    needsEnhancement: false
  });
  const [selectedFragrance, setSelectedFragrance] = useState<Fragrance | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load fragrances based on filters
  const loadFragrances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase not configured');

      let query = supabase
        .from('fragrance_master')
        .select(`
          id,
          name,
          brand,
          concentration,
          family,
          gender,
          description,
          fragrantica_url,
          completeness_score,
          last_enhanced_at
        `)
        .order('brand')
        .order('name')
        .limit(100);

      // Apply filters
      if (filters.brand) {
        query = query.ilike('brand', `%${filters.brand}%`);
      }
      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;

      // Calculate completeness scores and filter if needed
      let processedFragrances = (data || []).map(fragrance => ({
        ...fragrance,
        completeness_score: calculateCompletenessScore(fragrance),
        enhancement_status: getEnhancementStatus(fragrance)
      }));

      if (filters.needsEnhancement) {
        processedFragrances = processedFragrances.filter(f =>
          (f.completeness_score || 0) < 80 || !f.last_enhanced_at
        );
      }

      setFragrances(processedFragrances);
    } catch (err) {
      console.error('Error loading fragrances:', err);
      setError(err instanceof Error ? err.message : 'Failed to load fragrances');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Calculate completeness score based on available fields
  const calculateCompletenessScore = (fragrance: any): number => {
    const fields = [
      'name', 'brand', 'concentration', 'family', 'gender',
      'description', 'main_accords', 'top_notes', 'middle_notes',
      'base_notes', 'longevity_rating', 'sillage_rating'
    ];

    const filledFields = fields.filter(field => {
      const value = fragrance[field];
      return value !== null && value !== undefined && value !== '';
    }).length;

    return Math.round((filledFields / fields.length) * 100);
  };

  // Get enhancement status for display
  const getEnhancementStatus = (fragrance: any): 'none' | 'pending' | 'processing' | 'completed' | 'failed' => {
    if (!fragrance.last_enhanced_at) return 'none';

    // Check if enhancement is in progress for this fragrance
    if (enhancing[fragrance.id]) return 'processing';

    // Check completeness score
    const score = calculateCompletenessScore(fragrance);
    if (score >= 90) return 'completed';
    if (score >= 70) return 'pending';

    return 'none';
  };

  // Get status badge colour and icon
  const getStatusBadge = (status: string, score: number) => {
    switch (status) {
      case 'completed':
        return { variant: 'default' as const, icon: CheckCircle2, colour: 'bg-green-100 text-green-800' };
      case 'processing':
        return { variant: 'secondary' as const, icon: Loader2, colour: 'bg-blue-100 text-blue-800' };
      case 'pending':
        return { variant: 'outline' as const, icon: Clock, colour: 'bg-yellow-100 text-yellow-800' };
      default:
        return { variant: 'destructive' as const, icon: AlertCircle, colour: 'bg-red-100 text-red-800' };
    }
  };

  // Handle AI enhancement for a fragrance
  const handleEnhancement = async (fragrance: Fragrance) => {
    if (enhancing[fragrance.id]) return;

    setEnhancing(prev => ({ ...prev, [fragrance.id]: true }));
    setError(null);
    onEnhancementStart?.(fragrance.id);

    try {
      // Create enhancement request
      const requestId = await enhancementService.createEnhancementRequest(
        fragrance.id,
        adminId,
        'hybrid', // Use hybrid approach (AI + web scraping)
        5, // Medium priority
        0.7 // 70% confidence threshold
      );

      if (!requestId) {
        throw new Error('Failed to create enhancement request');
      }

      // Start AI enhancement
      const result = await aiEnhancementEngine.enhanceFragrance(
        fragrance.id,
        requestId,
        {
          useWebScraping: true,
          aiProvider: 'hybrid',
          confidenceThreshold: 0.7,
          includeNotes: true,
          includeAccords: true,
          includePerformance: true
        }
      );

      if (result.success && result.changes) {
        onEnhancementComplete?.(fragrance.id, result.changes);

        // Refresh the fragrance list to show updated status
        await loadFragrances();
      } else {
        throw new Error(result.error || 'Enhancement failed');
      }

    } catch (err) {
      console.error('Enhancement error:', err);
      setError(`Enhancement failed for ${fragrance.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setEnhancing(prev => ({ ...prev, [fragrance.id]: false }));
    }
  };

  // Load fragrances when filters change
  useEffect(() => {
    loadFragrances();
  }, [loadFragrances]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filter Fragrances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-cream mb-1 block">Brand</label>
              <Input
                placeholder="Filter by brand..."
                value={filters.brand}
                onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-cream mb-1 block">Fragrance Name</label>
              <Input
                placeholder="Filter by name..."
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant={filters.needsEnhancement ? 'default' : 'outline'}
                onClick={() => setFilters(prev => ({ ...prev, needsEnhancement: !prev.needsEnhancement }))}
                className="w-full"
              >
                {filters.needsEnhancement ? 'Show All' : 'Needs Enhancement Only'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Fragrance List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Fragrances
            <Badge variant="outline" className="text-cream">
              {fragrances.length} found
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brown" />
              <span className="ml-2 text-cream">Loading fragrances...</span>
            </div>
          ) : fragrances.length === 0 ? (
            <div className="text-center py-8 text-cream">
              No fragrances found matching your filters
            </div>
          ) : (
            <div className="space-y-3">
              {fragrances.map((fragrance) => {
                const status = getEnhancementStatus(fragrance);
                const score = fragrance.completeness_score || 0;
                const statusBadge = getStatusBadge(status, score);
                const StatusIcon = statusBadge.icon;

                return (
                  <div
                    key={fragrance.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedFragrance?.id === fragrance.id
                        ? 'bg-slate-700 border-brown'
                        : 'bg-slate-900 border-slate-700 hover:bg-slate-700'
                    }`}
                    onClick={() => setSelectedFragrance(fragrance)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">
                            {fragrance.name}
                          </h3>
                          <Badge
                            variant={statusBadge.variant}
                            className={`flex items-center gap-1 ${statusBadge.colour}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {score}% complete
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-cream">
                          <span><strong>Brand:</strong> {fragrance.brand}</span>
                          {fragrance.concentration && (
                            <span><strong>Type:</strong> {fragrance.concentration}</span>
                          )}
                          {fragrance.family && (
                            <span><strong>Family:</strong> {fragrance.family}</span>
                          )}
                        </div>
                        {fragrance.description && (
                          <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                            {fragrance.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnhancement(fragrance);
                          }}
                          disabled={enhancing[fragrance.id] || status === 'processing'}
                          className="bg-brown hover:bg-brown/80 text-white"
                        >
                          {enhancing[fragrance.id] ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Enhancing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              AI Enhance
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Fragrance Details */}
      {selectedFragrance && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Selected Fragrance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong className="text-cream">Name:</strong> <span className="text-white">{selectedFragrance.name}</span></div>
              <div><strong className="text-cream">Brand:</strong> <span className="text-white">{selectedFragrance.brand}</span></div>
              <div><strong className="text-cream">Concentration:</strong> <span className="text-white">{selectedFragrance.concentration || 'Not specified'}</span></div>
              <div><strong className="text-cream">Family:</strong> <span className="text-white">{selectedFragrance.family || 'Not specified'}</span></div>
              <div><strong className="text-cream">Gender:</strong> <span className="text-white">{selectedFragrance.gender || 'Not specified'}</span></div>
              <div><strong className="text-cream">Completeness:</strong> <span className="text-white">{selectedFragrance.completeness_score || 0}%</span></div>
            </div>
            {selectedFragrance.description && (
              <div className="mt-4">
                <strong className="text-cream">Description:</strong>
                <p className="text-white mt-1">{selectedFragrance.description}</p>
              </div>
            )}
            {selectedFragrance.fragrantica_url && (
              <div className="mt-4">
                <strong className="text-cream">Fragrantica URL:</strong>
                <a
                  href={selectedFragrance.fragrantica_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brown hover:underline ml-2"
                >
                  View on Fragrantica
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};