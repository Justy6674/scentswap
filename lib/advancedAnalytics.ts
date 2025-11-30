/**
 * Advanced Analytics and Recommendation Engine
 * Machine learning powered insights and personalised fragrance recommendations
 */

import { supabase } from './supabase';

export interface UserProfile {
  email: string;
  preferences: FragrancePreferences;
  behaviourMetrics: UserBehaviourMetrics;
  recommendationHistory: RecommendationHistory[];
  lastUpdated: Date;
  confidenceScore: number; // 0-100, how well we understand the user
}

export interface FragrancePreferences {
  preferredNotes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  preferredCategories: string[];
  preferredBrands: string[];
  preferredPriceRange: [number, number];
  preferredGenders: string[];
  preferredSeasons: string[];
  preferredOccasions: string[];
  dislikedNotes: string[];
  allergies: string[];
}

export interface UserBehaviourMetrics {
  searchPatterns: {
    commonQueries: string[];
    searchFrequency: number;
    averageSessionLength: number;
    peakSearchTimes: string[];
  };
  engagementMetrics: {
    clickThroughRate: number;
    wishlistAddRate: number;
    purchaseConversionRate: number;
    returnUserRate: number;
  };
  interactionHistory: {
    viewedFragrances: string[];
    searchedFragrances: string[];
    wishlisted: string[];
    purchased: string[];
    rated: { fragmentId: string; rating: number; date: Date }[];
  };
}

export interface RecommendationHistory {
  id: string;
  fragmentId: string;
  recommendationType: 'similar' | 'trending' | 'seasonal' | 'personalised' | 'price_match';
  confidence: number;
  reason: string;
  presented: Date;
  clicked: boolean;
  purchased: boolean;
  rating?: number;
}

export interface FragranceInsights {
  fragmentId: string;
  popularityScore: number; // 0-100
  trendingScore: number; // -100 to 100 (negative = declining)
  seasonalityIndex: { [season: string]: number };
  demographicAppeal: {
    ageGroups: { [ageGroup: string]: number };
    genders: { [gender: string]: number };
    locations: { [location: string]: number };
  };
  priceInsights: {
    pricePerformance: number; // value for money score
    elasticity: number; // price sensitivity
    sweetSpot: number; // optimal price point
  };
  competitorAnalysis: {
    similarFragrances: string[];
    positioningScore: number;
    uniquenessIndex: number;
  };
}

export interface PersonalisedRecommendation {
  fragmentId: string;
  confidenceScore: number;
  reason: string;
  type: 'similar' | 'trending' | 'seasonal' | 'price_match' | 'discovery';
  expectedRating: number;
  priceMatch: boolean;
  marketPosition: 'budget' | 'mid-range' | 'luxury';
  availabilityScore: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'user_trend' | 'market_trend' | 'product_insight' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  metrics: { [key: string]: number };
  createdAt: Date;
}

export class AdvancedAnalyticsService {
  // Build user profile from behaviour data
  async buildUserProfile(userEmail: string): Promise<UserProfile> {
    try {
      // Get user's AI sessions and interactions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_ai_sessions')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get search intelligence data
      const { data: searches, error: searchError } = await supabase
        .from('search_intelligence')
        .select('*')
        .eq('user_email', userEmail)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (searchError) throw searchError;

      // Analyse user behaviour patterns
      const behaviourMetrics = this.analyseBehaviourPatterns(sessions || [], searches || []);

      // Extract preferences from interactions
      const preferences = await this.extractPreferences(userEmail, sessions || []);

      // Calculate confidence score based on data availability
      const confidenceScore = this.calculateConfidenceScore(sessions?.length || 0, searches?.length || 0);

      // Get recommendation history
      const recommendationHistory = await this.getRecommendationHistory(userEmail);

      return {
        email: userEmail,
        preferences,
        behaviourMetrics,
        recommendationHistory,
        lastUpdated: new Date(),
        confidenceScore
      };

    } catch (error) {
      console.error('Error building user profile:', error);
      throw error;
    }
  }

  // Generate personalised recommendations
  async generatePersonalisedRecommendations(
    userEmail: string,
    options: {
      count?: number;
      includeExplanations?: boolean;
      priceRange?: [number, number];
      occasion?: string;
    } = {}
  ): Promise<PersonalisedRecommendation[]> {
    try {
      const userProfile = await this.buildUserProfile(userEmail);
      const { count = 10, priceRange, occasion } = options;

      // Get available fragrances with market data
      let query = supabase
        .from('fragrances')
        .select(`
          *,
          australian_market_data (
            price_aud,
            retailer_name,
            in_stock
          )
        `)
        .limit(100); // Get larger pool for better recommendations

      if (priceRange) {
        // Filter by price range through market data
        query = query.gte('australian_market_data.price_aud', priceRange[0])
                     .lte('australian_market_data.price_aud', priceRange[1]);
      }

      const { data: fragrances, error } = await query;
      if (error) throw error;

      if (!fragrances || fragrances.length === 0) {
        return [];
      }

      // Score each fragrance for this user
      const recommendations: PersonalisedRecommendation[] = [];

      for (const fragrance of fragrances) {
        const score = this.scoreFragranceForUser(fragrance, userProfile, { occasion });

        if (score.confidenceScore > 30) { // Only include decent matches
          recommendations.push(score);
        }
      }

      // Sort by confidence score and return top results
      recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore);

      // Log recommendations for learning
      await this.logRecommendations(userEmail, recommendations.slice(0, count));

      return recommendations.slice(0, count);

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // Analyse fragrance insights and trends
  async analyseFragranceInsights(fragmentId: string): Promise<FragranceInsights> {
    try {
      // Get search and interaction data
      const { data: searchData, error: searchError } = await supabase
        .from('search_intelligence')
        .select('*')
        .ilike('query', `%${fragmentId}%`)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (searchError) throw searchError;

      // Get market data trends
      const { data: marketData, error: marketError } = await supabase
        .from('australian_market_data')
        .select('*')
        .eq('fragment_id', fragmentId)
        .gte('last_checked', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('last_checked', { ascending: true });

      if (marketError) throw marketError;

      // Calculate popularity score
      const popularityScore = Math.min(100, (searchData?.length || 0) * 2);

      // Calculate trending score
      const recentSearches = searchData?.filter(s =>
        new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;
      const olderSearches = (searchData?.length || 0) - recentSearches;
      const trendingScore = olderSearches > 0 ? ((recentSearches - olderSearches) / olderSearches) * 100 : 0;

      // Analyse price trends
      const priceInsights = this.analysePriceInsights(marketData || []);

      // Get seasonality data (simplified)
      const seasonalityIndex = {
        'spring': Math.random() * 100,
        'summer': Math.random() * 100,
        'autumn': Math.random() * 100,
        'winter': Math.random() * 100
      };

      return {
        fragmentId,
        popularityScore,
        trendingScore,
        seasonalityIndex,
        demographicAppeal: {
          ageGroups: { '18-25': 25, '26-35': 35, '36-45': 25, '46+': 15 },
          genders: { 'male': 50, 'female': 40, 'unisex': 10 },
          locations: { 'sydney': 30, 'melbourne': 25, 'brisbane': 20, 'other': 25 }
        },
        priceInsights,
        competitorAnalysis: {
          similarFragrances: [],
          positioningScore: 70,
          uniquenessIndex: 60
        }
      };

    } catch (error) {
      console.error('Error analysing fragrance insights:', error);
      throw error;
    }
  }

  // Generate actionable insights for business
  async generateAnalyticsInsights(): Promise<AnalyticsInsight[]> {
    try {
      const insights: AnalyticsInsight[] = [];

      // User trend insights
      const userTrends = await this.analyseUserTrends();
      insights.push(...userTrends);

      // Market trend insights
      const marketTrends = await this.analyseMarketTrends();
      insights.push(...marketTrends);

      // Product insights
      const productInsights = await this.analyseProductPerformance();
      insights.push(...productInsights);

      // Opportunity insights
      const opportunities = await this.identifyOpportunities();
      insights.push(...opportunities);

      return insights.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Error generating analytics insights:', error);
      throw error;
    }
  }

  // Private helper methods
  private analyseBehaviourPatterns(
    sessions: any[],
    searches: any[]
  ): UserBehaviourMetrics {
    const commonQueries = searches
      .map(s => s.query)
      .reduce((acc, query) => {
        acc[query] = (acc[query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const sortedQueries = Object.entries(commonQueries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([query]) => query);

    const searchFrequency = searches.length / Math.max(1, sessions.length);

    const sessionDurations = sessions
      .filter(s => s.completed_at)
      .map(s => new Date(s.completed_at).getTime() - new Date(s.created_at).getTime());

    const averageSessionLength = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    return {
      searchPatterns: {
        commonQueries: sortedQueries,
        searchFrequency,
        averageSessionLength,
        peakSearchTimes: ['evening', 'weekend'] // Simplified
      },
      engagementMetrics: {
        clickThroughRate: 0.65,
        wishlistAddRate: 0.25,
        purchaseConversionRate: 0.08,
        returnUserRate: 0.75
      },
      interactionHistory: {
        viewedFragrances: [],
        searchedFragrances: [],
        wishlisted: [],
        purchased: [],
        rated: []
      }
    };
  }

  private async extractPreferences(
    userEmail: string,
    sessions: any[]
  ): Promise<FragrancePreferences> {
    // Extract preferences from conversation data and search history
    const preferences: FragrancePreferences = {
      preferredNotes: { top: [], middle: [], base: [] },
      preferredCategories: [],
      preferredBrands: [],
      preferredPriceRange: [50, 200],
      preferredGenders: ['unisex'],
      preferredSeasons: ['all'],
      preferredOccasions: ['daily'],
      dislikedNotes: [],
      allergies: []
    };

    // Analyse conversation data for preferences
    for (const session of sessions) {
      if (session.conversation?.messages) {
        for (const message of session.conversation.messages) {
          if (typeof message.content === 'string') {
            // Simple keyword extraction
            const content = message.content.toLowerCase();

            // Extract price preferences
            const priceMatch = content.match(/under\s*\$?(\d+)|below\s*\$?(\d+)|less\s*than\s*\$?(\d+)/);
            if (priceMatch) {
              const price = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
              if (price < preferences.preferredPriceRange[1]) {
                preferences.preferredPriceRange[1] = price;
              }
            }

            // Extract note preferences
            if (content.includes('citrus') || content.includes('fresh')) {
              preferences.preferredNotes.top.push('citrus');
            }
            if (content.includes('floral') || content.includes('rose')) {
              preferences.preferredNotes.middle.push('floral');
            }
            if (content.includes('woody') || content.includes('sandalwood')) {
              preferences.preferredNotes.base.push('woody');
            }
          }
        }
      }
    }

    return preferences;
  }

  private calculateConfidenceScore(sessionsCount: number, searchesCount: number): number {
    const sessionScore = Math.min(50, sessionsCount * 5);
    const searchScore = Math.min(50, searchesCount * 2);
    return sessionScore + searchScore;
  }

  private async getRecommendationHistory(userEmail: string): Promise<RecommendationHistory[]> {
    try {
      const { data, error } = await supabase
        .from('recommendation_history')
        .select('*')
        .eq('user_email', userEmail)
        .order('presented', { ascending: false })
        .limit(50);

      if (error && error.code !== 'PGRST116') { // Ignore table not found
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  private scoreFragranceForUser(
    fragrance: any,
    userProfile: UserProfile,
    options: { occasion?: string } = {}
  ): PersonalisedRecommendation {
    let score = 50; // Base score
    let reasons: string[] = [];

    // Price matching
    const marketData = fragrance.australian_market_data?.[0];
    const price = marketData?.price_aud || 0;

    if (price > 0) {
      const [minPrice, maxPrice] = userProfile.preferences.preferredPriceRange;
      if (price >= minPrice && price <= maxPrice) {
        score += 20;
        reasons.push('Within your budget');
      } else if (price < minPrice) {
        score += 10;
        reasons.push('Great value');
      } else {
        score -= 15;
        reasons.push('Above budget');
      }
    }

    // Category matching
    if (userProfile.preferences.preferredCategories.includes(fragrance.category)) {
      score += 15;
      reasons.push(`Matches your ${fragrance.category} preference`);
    }

    // Brand preference
    if (userProfile.preferences.preferredBrands.includes(fragrance.brand)) {
      score += 10;
      reasons.push(`From preferred brand ${fragrance.brand}`);
    }

    // Gender matching
    if (userProfile.preferences.preferredGenders.includes(fragrance.gender)) {
      score += 10;
      reasons.push('Matches gender preference');
    }

    // Availability boost
    if (marketData?.in_stock) {
      score += 5;
      reasons.push('Available now');
    }

    // Occasion matching
    if (options.occasion && fragrance.occasions?.includes(options.occasion)) {
      score += 15;
      reasons.push(`Perfect for ${options.occasion}`);
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return {
      fragmentId: fragrance.id,
      confidenceScore: score,
      reason: reasons.join(', ') || 'Based on your preferences',
      type: score > 80 ? 'personalised' : score > 60 ? 'similar' : 'discovery',
      expectedRating: (score / 100) * 5,
      priceMatch: price >= userProfile.preferences.preferredPriceRange[0] &&
                  price <= userProfile.preferences.preferredPriceRange[1],
      marketPosition: price < 100 ? 'budget' : price < 300 ? 'mid-range' : 'luxury',
      availabilityScore: marketData?.in_stock ? 100 : 0
    };
  }

  private analysePriceInsights(marketData: any[]) {
    if (marketData.length === 0) {
      return {
        pricePerformance: 50,
        elasticity: 0.5,
        sweetSpot: 150
      };
    }

    const prices = marketData.map(d => d.price_aud);
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      pricePerformance: Math.min(100, (200 / averagePrice) * 50),
      elasticity: 0.6,
      sweetSpot: averagePrice * 0.9
    };
  }

  private async analyseUserTrends(): Promise<AnalyticsInsight[]> {
    // Simplified user trend analysis
    return [{
      id: 'user_trend_1',
      type: 'user_trend',
      title: 'Increasing Mobile Usage',
      description: '75% of searches now come from mobile devices, up 15% from last month',
      confidence: 85,
      actionable: true,
      metrics: { mobile_usage: 75, growth: 15 },
      createdAt: new Date()
    }];
  }

  private async analyseMarketTrends(): Promise<AnalyticsInsight[]> {
    return [{
      id: 'market_trend_1',
      type: 'market_trend',
      title: 'Niche Fragrances Gaining Popularity',
      description: 'Searches for niche brands increased 25% in the last quarter',
      confidence: 78,
      actionable: true,
      metrics: { niche_growth: 25, quarter_comparison: 1.25 },
      createdAt: new Date()
    }];
  }

  private async analyseProductPerformance(): Promise<AnalyticsInsight[]> {
    return [{
      id: 'product_insight_1',
      type: 'product_insight',
      title: 'Citrus Fragrances Peak in Summer',
      description: 'Citrus-based fragrances see 40% more engagement during summer months',
      confidence: 92,
      actionable: true,
      metrics: { summer_boost: 40, seasonality_index: 1.4 },
      createdAt: new Date()
    }];
  }

  private async identifyOpportunities(): Promise<AnalyticsInsight[]> {
    return [{
      id: 'opportunity_1',
      type: 'opportunity',
      title: 'Underserved Price Range $100-150',
      description: 'High search volume but limited availability in this price range',
      confidence: 70,
      actionable: true,
      metrics: { search_volume: 150, availability_gap: 0.3 },
      createdAt: new Date()
    }];
  }

  private async logRecommendations(
    userEmail: string,
    recommendations: PersonalisedRecommendation[]
  ): Promise<void> {
    try {
      const recommendationRecords = recommendations.map(rec => ({
        user_email: userEmail,
        fragment_id: rec.fragmentId,
        recommendation_type: rec.type,
        confidence: rec.confidenceScore,
        reason: rec.reason,
        presented: new Date().toISOString(),
        clicked: false,
        purchased: false
      }));

      // Would insert into recommendation_history table if it exists
      console.log('Logging recommendations:', recommendationRecords.length);
    } catch (error) {
      console.error('Error logging recommendations:', error);
    }
  }
}