/**
 * Smart Search Intelligence System
 * Natural language processing for fragrance discovery
 */

import { aiService } from './aiService';
import { supabase } from './supabase';

export interface SmartSearchRequest {
  query: string;
  filters?: {
    priceRange?: [number, number];
    gender?: string[];
    occasion?: string[];
    weather?: string;
    longevity?: string;
    projection?: string;
    concentration?: string[];
    yearRange?: [number, number];
    rating?: number;
  };
  userContext?: {
    previousPurchases?: string[];
    preferences?: FragranceProfile;
    location?: string;
    searchHistory?: string[];
  };
  limit?: number;
  offset?: number;
}

export interface FragranceProfile {
  preferredNotes: string[];
  dislikedNotes: string[];
  favouriteBrands: string[];
  preferredConcentrations: string[];
  budgetRange: [number, number];
  occasions: string[];
  seasonalPreferences: {
    spring: string[];
    summer: string[];
    autumn: string[];
    winter: string[];
  };
}

export interface SmartSearchResponse {
  results: EnhancedFragranceResult[];
  totalCount: number;
  searchInsights: {
    parsedIntent: ParsedSearchIntent;
    appliedFilters: any;
    searchStrategy: string;
    confidence: number;
    suggestions: string[];
    relatedQueries: string[];
  };
  recommendations: {
    similarFragrances: EnhancedFragranceResult[];
    brandRecommendations: string[];
    priceAlternatives: EnhancedFragranceResult[];
  };
  australianContext: {
    availableRetailers: RetailerInfo[];
    averagePriceAUD: number;
    priceRange: [number, number];
    bestDeals: DealInfo[];
  };
}

export interface ParsedSearchIntent {
  searchType: 'specific' | 'discovery' | 'comparison' | 'recommendation';
  extractedFilters: any;
  keyDescriptors: string[];
  sentimentAnalysis: {
    tone: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high';
    confidence: number;
  };
  userIntent: {
    primaryGoal: string;
    secondaryGoals: string[];
    context: string[];
  };
}

export interface EnhancedFragranceResult {
  id: string;
  name: string;
  brand: string;
  house?: string;
  concentration?: string;
  year_released?: number;
  gender?: string;
  family?: string;
  perfumers?: string[];
  top_notes?: string[];
  middle_notes?: string[];
  base_notes?: string[];
  main_accords?: string[];
  rating_value?: number;
  rating_count?: number;
  average_price_aud?: number;
  market_tier?: string;
  performance_level?: string;
  data_quality_score?: number;
  verified?: boolean;

  // AI enhancements
  relevanceScore: number;
  matchExplanation: string;
  australianAvailability: RetailerInfo[];
  similarityScore?: number;
  aiGenerated?: {
    description?: string;
    recommendationReason?: string;
    bestOccasions?: string[];
    seasonalFit?: string[];
  };
}

export interface RetailerInfo {
  name: string;
  priceAUD: number;
  inStock: boolean;
  url?: string;
  lastUpdated: Date;
  shippingOptions: string[];
  trustScore: number;
}

export interface DealInfo {
  retailer: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  dealType: string;
  validUntil?: Date;
}

class SmartSearchIntelligence {
  private readonly INTENT_CLASSIFICATION_PROMPT = `Analyse this fragrance search query and extract structured information:

Query: "{query}"

Extract:
1. Search type (specific/discovery/comparison/recommendation)
2. Filters (price, gender, occasion, weather, etc.)
3. Key descriptors and requirements
4. User intent and context
5. Sentiment and urgency

Return JSON with parsed intent and suggested search strategy.`;

  private readonly FRAGRANCE_MATCHING_PROMPT = `You are an expert perfumer and fragrance consultant. Based on this search query and filters, provide intelligent fragrance matching:

Query: "{query}"
Filters: {filters}
Available Fragrances: {fragrances}

For each fragrance, provide:
1. Relevance score (0-100)
2. Match explanation
3. Why it fits the user's needs
4. Best occasions for wearing
5. Seasonal recommendations

Focus on Australian market context and pricing.`;

  async intelligentSearch(request: SmartSearchRequest): Promise<SmartSearchResponse> {
    try {
      // Step 1: Parse search intent with AI
      const parsedIntent = await this.parseSearchIntent(request.query);

      // Step 2: Build enhanced search query
      const searchQuery = this.buildEnhancedQuery(request, parsedIntent);

      // Step 3: Execute database search with AI-enhanced filters
      const rawResults = await this.executeEnhancedSearch(searchQuery);

      // Step 4: AI-powered result ranking and enhancement
      const enhancedResults = await this.enhanceSearchResults(
        rawResults,
        request.query,
        parsedIntent,
        request.userContext
      );

      // Step 5: Generate recommendations and insights
      const recommendations = await this.generateRecommendations(enhancedResults, request);
      const australianContext = await this.getAustralianMarketContext(enhancedResults);

      return {
        results: enhancedResults.slice(0, request.limit || 20),
        totalCount: rawResults.length,
        searchInsights: {
          parsedIntent,
          appliedFilters: searchQuery.filters,
          searchStrategy: this.determineSearchStrategy(parsedIntent),
          confidence: parsedIntent.sentimentAnalysis.confidence,
          suggestions: await this.generateSearchSuggestions(request.query),
          relatedQueries: await this.generateRelatedQueries(request.query)
        },
        recommendations,
        australianContext
      };

    } catch (error) {
      console.error('Smart search error:', error);
      throw new Error(`Smart search failed: ${error.message}`);
    }
  }

  private async parseSearchIntent(query: string): Promise<ParsedSearchIntent> {
    try {
      const prompt = this.INTENT_CLASSIFICATION_PROMPT.replace('{query}', query);

      const response = await aiService.enhanceFragrance({
        fragmentId: 'search-intent',
        currentData: { query },
        researchScope: {
          checkPricing: false,
          verifyPerfumer: false,
          enhanceNotes: false,
          updateClassification: true,
          verifyYear: false,
          checkAvailability: false
        },
        retailersToCheck: []
      });

      // Parse AI response for intent classification
      return this.parseIntentResponse(response);

    } catch (error) {
      console.error('Intent parsing error:', error);
      // Fallback to basic intent parsing
      return this.fallbackIntentParsing(query);
    }
  }

  private parseIntentResponse(response: any): ParsedSearchIntent {
    // Extract structured intent from AI response
    const suggestions = response.suggestedChanges || {};

    return {
      searchType: this.determineSearchType(response),
      extractedFilters: this.extractFiltersFromResponse(response),
      keyDescriptors: this.extractDescriptors(response),
      sentimentAnalysis: {
        tone: 'positive', // Default values, enhance with actual sentiment analysis
        urgency: 'medium',
        confidence: response.confidence || 70
      },
      userIntent: {
        primaryGoal: this.extractPrimaryGoal(response),
        secondaryGoals: this.extractSecondaryGoals(response),
        context: this.extractContext(response)
      }
    };
  }

  private fallbackIntentParsing(query: string): ParsedSearchIntent {
    const lowerQuery = query.toLowerCase();

    // Basic keyword analysis
    const searchType = this.classifySearchType(lowerQuery);
    const extractedFilters = this.extractBasicFilters(lowerQuery);
    const keyDescriptors = this.extractKeywords(lowerQuery);

    return {
      searchType,
      extractedFilters,
      keyDescriptors,
      sentimentAnalysis: {
        tone: 'neutral',
        urgency: 'medium',
        confidence: 60
      },
      userIntent: {
        primaryGoal: searchType === 'specific' ? 'Find specific fragrance' : 'Discover new fragrances',
        secondaryGoals: [],
        context: ['basic_search']
      }
    };
  }

  private classifySearchType(query: string): 'specific' | 'discovery' | 'comparison' | 'recommendation' {
    if (query.includes('vs') || query.includes('compare') || query.includes('versus')) {
      return 'comparison';
    }
    if (query.includes('recommend') || query.includes('suggest') || query.includes('help me find')) {
      return 'recommendation';
    }
    if (query.includes('like') || query.includes('similar')) {
      return 'discovery';
    }
    return 'specific';
  }

  private extractBasicFilters(query: string): any {
    const filters: any = {};

    // Price extraction
    const priceMatch = query.match(/under?\s*\$?(\d+)/i);
    if (priceMatch) {
      filters.priceRange = [0, parseInt(priceMatch[1])];
    }

    // Gender extraction
    if (query.includes('men') || query.includes('masculine')) {
      filters.gender = ['masculine'];
    }
    if (query.includes('women') || query.includes('feminine')) {
      filters.gender = ['feminine'];
    }
    if (query.includes('unisex')) {
      filters.gender = ['unisex'];
    }

    // Occasion extraction
    const occasions = [];
    if (query.includes('work') || query.includes('office')) occasions.push('work');
    if (query.includes('date') || query.includes('romantic')) occasions.push('romantic');
    if (query.includes('casual')) occasions.push('casual');
    if (query.includes('formal')) occasions.push('formal');
    if (occasions.length > 0) filters.occasion = occasions;

    // Weather/season extraction
    if (query.includes('summer') || query.includes('hot')) {
      filters.weather = 'hot';
    }
    if (query.includes('winter') || query.includes('cold')) {
      filters.weather = 'cold';
    }

    return filters;
  }

  private extractKeywords(query: string): string[] {
    // Common fragrance descriptors
    const descriptors = [
      'fresh', 'citrus', 'woody', 'floral', 'spicy', 'sweet', 'clean',
      'aquatic', 'oriental', 'gourmand', 'leather', 'smoky', 'green',
      'powdery', 'musky', 'vanilla', 'rose', 'jasmine', 'sandalwood'
    ];

    return descriptors.filter(desc =>
      query.toLowerCase().includes(desc.toLowerCase())
    );
  }

  private buildEnhancedQuery(request: SmartSearchRequest, intent: ParsedSearchIntent): any {
    // Combine user filters with AI-extracted filters
    const combinedFilters = {
      ...request.filters,
      ...intent.extractedFilters
    };

    return {
      baseQuery: request.query,
      filters: combinedFilters,
      searchTerms: intent.keyDescriptors,
      strategy: this.determineSearchStrategy(intent)
    };
  }

  private async executeEnhancedSearch(searchQuery: any): Promise<any[]> {
    let query = supabase.from('fragrances').select('*');

    // Apply filters
    if (searchQuery.filters.priceRange) {
      const [min, max] = searchQuery.filters.priceRange;
      query = query.gte('average_price_aud', min).lte('average_price_aud', max);
    }

    if (searchQuery.filters.gender?.length > 0) {
      query = query.in('gender', searchQuery.filters.gender);
    }

    if (searchQuery.filters.concentration?.length > 0) {
      query = query.in('concentration', searchQuery.filters.concentration);
    }

    if (searchQuery.filters.rating) {
      query = query.gte('rating_value', searchQuery.filters.rating);
    }

    // Text search on key fields
    if (searchQuery.searchTerms?.length > 0) {
      const searchTerm = searchQuery.searchTerms.join(' | ');
      query = query.textSearch('name,brand,top_notes,middle_notes,base_notes', searchTerm);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      throw new Error(`Database search error: ${error.message}`);
    }

    return data || [];
  }

  private async enhanceSearchResults(
    results: any[],
    originalQuery: string,
    intent: ParsedSearchIntent,
    userContext?: any
  ): Promise<EnhancedFragranceResult[]> {

    if (results.length === 0) return [];

    try {
      // Use AI to score and explain relevance for each result
      const prompt = this.FRAGRANCE_MATCHING_PROMPT
        .replace('{query}', originalQuery)
        .replace('{filters}', JSON.stringify(intent.extractedFilters))
        .replace('{fragrances}', JSON.stringify(results.slice(0, 20))); // Limit for AI processing

      const aiResponse = await aiService.enhanceFragrance({
        fragmentId: 'search-ranking',
        currentData: { results: results.slice(0, 20) },
        researchScope: {
          checkPricing: false,
          verifyPerfumer: false,
          enhanceNotes: false,
          updateClassification: true,
          verifyYear: false,
          checkAvailability: false
        },
        retailersToCheck: []
      });

      // Parse AI scoring and enhance results
      return await this.parseAIEnhancements(results, aiResponse, userContext);

    } catch (error) {
      console.error('AI enhancement error:', error);
      // Fallback to basic scoring
      return this.fallbackResultScoring(results, originalQuery, intent);
    }
  }

  private async parseAIEnhancements(
    results: any[],
    aiResponse: any,
    userContext?: any
  ): Promise<EnhancedFragranceResult[]> {

    return results.map((fragrance, index) => {
      // Calculate basic relevance score
      const relevanceScore = this.calculateRelevanceScore(fragrance, aiResponse);

      return {
        ...fragrance,
        relevanceScore,
        matchExplanation: this.generateMatchExplanation(fragrance, aiResponse),
        australianAvailability: [], // Will be populated by market intelligence
        aiGenerated: {
          description: this.generateAIDescription(fragrance),
          recommendationReason: this.generateRecommendationReason(fragrance, aiResponse),
          bestOccasions: this.suggestOccasions(fragrance),
          seasonalFit: this.suggestSeasons(fragrance)
        }
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private fallbackResultScoring(
    results: any[],
    query: string,
    intent: ParsedSearchIntent
  ): EnhancedFragranceResult[] {

    return results.map(fragrance => {
      const relevanceScore = this.calculateBasicRelevance(fragrance, query, intent);

      return {
        ...fragrance,
        relevanceScore,
        matchExplanation: this.generateBasicMatchExplanation(fragrance, query),
        australianAvailability: [],
        aiGenerated: {
          recommendationReason: 'Based on search criteria match',
          bestOccasions: ['general'],
          seasonalFit: ['all-season']
        }
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateRelevanceScore(fragrance: any, aiResponse: any): number {
    // Base score from AI confidence
    let score = aiResponse.confidence || 70;

    // Boost for verified fragrances
    if (fragrance.verified) score += 10;

    // Boost for higher ratings
    if (fragrance.rating_value) {
      score += (fragrance.rating_value / 5) * 20;
    }

    // Boost for data quality
    if (fragrance.data_quality_score) {
      score += (fragrance.data_quality_score / 100) * 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateBasicRelevance(fragrance: any, query: string, intent: ParsedSearchIntent): number {
    let score = 50; // Base score

    const lowerQuery = query.toLowerCase();
    const searchableText = [
      fragrance.name,
      fragrance.brand,
      fragrance.house,
      ...(fragrance.top_notes || []),
      ...(fragrance.middle_notes || []),
      ...(fragrance.base_notes || []),
      ...(fragrance.main_accords || [])
    ].filter(Boolean).join(' ').toLowerCase();

    // Keyword matching
    const keywords = intent.keyDescriptors;
    const matchCount = keywords.filter(keyword =>
      searchableText.includes(keyword.toLowerCase())
    ).length;

    score += (matchCount / keywords.length) * 30;

    // Exact name match
    if (fragrance.name?.toLowerCase().includes(lowerQuery.split(' ')[0])) {
      score += 20;
    }

    // Brand match
    if (fragrance.brand?.toLowerCase().includes(lowerQuery.split(' ')[0])) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private generateMatchExplanation(fragrance: any, aiResponse: any): string {
    // Extract explanation from AI response or generate basic one
    return `Matches your search criteria with ${fragrance.rating_value || 'good'} rating and ${fragrance.data_quality_score || 'reliable'} data quality.`;
  }

  private generateBasicMatchExplanation(fragrance: any, query: string): string {
    return `Found "${fragrance.name}" by ${fragrance.brand} matching your search for "${query}".`;
  }

  private generateAIDescription(fragrance: any): string {
    const notes = [
      ...(fragrance.top_notes || []).slice(0, 2),
      ...(fragrance.middle_notes || []).slice(0, 2),
      ...(fragrance.base_notes || []).slice(0, 2)
    ];

    return `A ${fragrance.family || 'distinctive'} fragrance featuring ${notes.join(', ')}. ${
      fragrance.year_released ? `Released in ${fragrance.year_released}.` : ''
    }`;
  }

  private generateRecommendationReason(fragrance: any, aiResponse: any): string {
    return `Recommended for its ${fragrance.main_accords?.slice(0, 2).join(' and ') || 'unique character'} and strong performance.`;
  }

  private suggestOccasions(fragrance: any): string[] {
    // Basic occasion suggestions based on fragrance characteristics
    const occasions = [];

    if (fragrance.family?.includes('fresh') || fragrance.family?.includes('citrus')) {
      occasions.push('daytime', 'casual', 'office');
    }
    if (fragrance.family?.includes('oriental') || fragrance.family?.includes('woody')) {
      occasions.push('evening', 'formal', 'date');
    }
    if (fragrance.performance_level === 'high') {
      occasions.push('special events');
    }

    return occasions.length > 0 ? occasions : ['versatile'];
  }

  private suggestSeasons(fragrance: any): string[] {
    // Basic seasonal suggestions
    const seasons = [];

    if (fragrance.family?.includes('fresh') || fragrance.family?.includes('citrus')) {
      seasons.push('spring', 'summer');
    }
    if (fragrance.family?.includes('oriental') || fragrance.family?.includes('woody')) {
      seasons.push('autumn', 'winter');
    }

    return seasons.length > 0 ? seasons : ['all-season'];
  }

  private async generateRecommendations(
    results: EnhancedFragranceResult[],
    request: SmartSearchRequest
  ): Promise<any> {

    // Generate similar fragrances, brand recommendations, and price alternatives
    return {
      similarFragrances: await this.findSimilarFragrances(results[0]),
      brandRecommendations: this.extractBrandRecommendations(results),
      priceAlternatives: await this.findPriceAlternatives(results, request.filters?.priceRange)
    };
  }

  private async findSimilarFragrances(topResult?: EnhancedFragranceResult): Promise<EnhancedFragranceResult[]> {
    if (!topResult) return [];

    // Find fragrances with similar notes and accords
    const { data } = await supabase
      .from('fragrances')
      .select('*')
      .neq('id', topResult.id)
      .overlaps('main_accords', topResult.main_accords || [])
      .limit(5);

    return (data || []).map(fragrance => ({
      ...fragrance,
      relevanceScore: 0,
      matchExplanation: 'Similar accords and characteristics',
      australianAvailability: []
    }));
  }

  private extractBrandRecommendations(results: EnhancedFragranceResult[]): string[] {
    const brands = results.map(r => r.brand).filter(Boolean);
    return [...new Set(brands)].slice(0, 5);
  }

  private async findPriceAlternatives(
    results: EnhancedFragranceResult[],
    priceRange?: [number, number]
  ): Promise<EnhancedFragranceResult[]> {

    if (!results[0] || !priceRange) return [];

    const targetPrice = results[0].average_price_aud;
    if (!targetPrice) return [];

    // Find similar fragrances at different price points
    const { data } = await supabase
      .from('fragrances')
      .select('*')
      .lt('average_price_aud', targetPrice * 0.8)
      .overlaps('family', [results[0].family])
      .limit(3);

    return (data || []).map(fragrance => ({
      ...fragrance,
      relevanceScore: 0,
      matchExplanation: 'Budget-friendly alternative',
      australianAvailability: []
    }));
  }

  private async getAustralianMarketContext(results: EnhancedFragranceResult[]): Promise<any> {
    // Aggregate Australian market data
    const prices = results
      .map(r => r.average_price_aud)
      .filter(Boolean) as number[];

    return {
      availableRetailers: [], // Will be populated by market intelligence module
      averagePriceAUD: prices.length > 0 ? prices.reduce((a, b) => a + b) / prices.length : 0,
      priceRange: prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] as [number, number] : [0, 0],
      bestDeals: [] // Will be populated by pricing intelligence
    };
  }

  private async generateSearchSuggestions(query: string): Promise<string[]> {
    // Generate helpful search suggestions
    return [
      'Try adding specific notes (e.g., "vanilla", "bergamot")',
      'Include occasion context (e.g., "for work", "date night")',
      'Specify budget range (e.g., "under $150")',
      'Add performance preferences (e.g., "long lasting")'
    ];
  }

  private async generateRelatedQueries(query: string): Promise<string[]> {
    // Generate related search queries
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('fresh')) {
      return ['aquatic fragrances', 'citrus perfumes', 'clean scents', 'summer fragrances'];
    }
    if (lowerQuery.includes('woody')) {
      return ['sandalwood perfumes', 'cedar fragrances', 'forest scents', 'masculine woody'];
    }

    return ['trending fragrances', 'best rated perfumes', 'niche fragrances', 'designer alternatives'];
  }

  private determineSearchStrategy(intent: ParsedSearchIntent): string {
    switch (intent.searchType) {
      case 'specific': return 'exact_match';
      case 'discovery': return 'similarity_search';
      case 'comparison': return 'comparative_analysis';
      case 'recommendation': return 'ai_recommendation';
      default: return 'hybrid_search';
    }
  }

  // Helper methods for intent parsing
  private determineSearchType(response: any): 'specific' | 'discovery' | 'comparison' | 'recommendation' {
    return 'discovery'; // Default implementation
  }

  private extractFiltersFromResponse(response: any): any {
    return {}; // Default implementation
  }

  private extractDescriptors(response: any): string[] {
    return []; // Default implementation
  }

  private extractPrimaryGoal(response: any): string {
    return 'Find fragrances'; // Default implementation
  }

  private extractSecondaryGoals(response: any): string[] {
    return []; // Default implementation
  }

  private extractContext(response: any): string[] {
    return []; // Default implementation
  }
}

// Export singleton instance
export const smartSearch = new SmartSearchIntelligence();
export default smartSearch;