/**
 * Australian Market Intelligence System
 * Real-time pricing tracking and retailer monitoring for Australian fragrance market
 */

import { supabase } from './supabase';

export interface AustralianRetailer {
  id: string;
  name: string;
  website: string;
  trustScore: number; // 1-10 scale
  shippingOptions: string[];
  averageDeliveryDays: number;
  acceptsReturns: boolean;
  priceMatchPolicy: boolean;
  loyaltyProgram: boolean;
  paymentMethods: string[];
}

export interface FragrancePricing {
  id: string;
  fragmentId: string;
  retailerId: string;
  priceAUD: number;
  originalPriceAUD?: number;
  discountPercent?: number;
  inStock: boolean;
  productUrl: string;
  lastChecked: Date;
  stockLevel?: 'low' | 'medium' | 'high';
  shippingCost?: number;
  estimatedDelivery?: string;
}

export interface PriceAlert {
  id: string;
  userEmail: string;
  fragmentId: string;
  targetPrice: number;
  alertType: 'below' | 'discount' | 'back_in_stock';
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface MarketTrend {
  fragmentId: string;
  averagePrice: number;
  priceChange30Day: number;
  priceChange90Day: number;
  availability: number; // percentage of retailers in stock
  popularityScore: number; // based on search frequency
  seasonalTrend: 'rising' | 'falling' | 'stable';
}

export interface CompetitorAnalysis {
  fragmentId: string;
  retailerComparison: {
    retailerId: string;
    price: number;
    trustScore: number;
    deliveryTime: number;
    totalScore: number; // weighted score
  }[];
  bestValue: string; // retailer ID with best value
  cheapest: string; // retailer ID with lowest price
  mostTrusted: string; // retailer ID with highest trust score
}

export const AUSTRALIAN_RETAILERS: AustralianRetailer[] = [
  {
    id: 'chemist-warehouse',
    name: 'Chemist Warehouse',
    website: 'chemistwarehouse.com.au',
    trustScore: 9.2,
    shippingOptions: ['Standard', 'Express', 'Click & Collect'],
    averageDeliveryDays: 3,
    acceptsReturns: true,
    priceMatchPolicy: true,
    loyaltyProgram: true,
    paymentMethods: ['Card', 'PayPal', 'Afterpay', 'Zip']
  },
  {
    id: 'priceline',
    name: 'Priceline Pharmacy',
    website: 'priceline.com.au',
    trustScore: 8.8,
    shippingOptions: ['Standard', 'Express', 'Click & Collect'],
    averageDeliveryDays: 4,
    acceptsReturns: true,
    priceMatchPolicy: false,
    loyaltyProgram: true,
    paymentMethods: ['Card', 'PayPal', 'Afterpay']
  },
  {
    id: 'myer',
    name: 'Myer',
    website: 'myer.com.au',
    trustScore: 8.5,
    shippingOptions: ['Standard', 'Express', 'Click & Collect'],
    averageDeliveryDays: 5,
    acceptsReturns: true,
    priceMatchPolicy: false,
    loyaltyProgram: true,
    paymentMethods: ['Card', 'PayPal', 'Afterpay', 'Zip']
  },
  {
    id: 'david-jones',
    name: 'David Jones',
    website: 'davidjones.com',
    trustScore: 8.7,
    shippingOptions: ['Standard', 'Express', 'Click & Collect'],
    averageDeliveryDays: 4,
    acceptsReturns: true,
    priceMatchPolicy: false,
    loyaltyProgram: true,
    paymentMethods: ['Card', 'PayPal', 'Afterpay']
  },
  {
    id: 'adore-beauty',
    name: 'Adore Beauty',
    website: 'adorebeauty.com.au',
    trustScore: 9.0,
    shippingOptions: ['Standard', 'Express'],
    averageDeliveryDays: 3,
    acceptsReturns: true,
    priceMatchPolicy: false,
    loyaltyProgram: true,
    paymentMethods: ['Card', 'PayPal', 'Afterpay', 'Zip']
  },
  {
    id: 'sephora-au',
    name: 'Sephora Australia',
    website: 'sephora.com.au',
    trustScore: 8.6,
    shippingOptions: ['Standard', 'Express', 'Click & Collect'],
    averageDeliveryDays: 4,
    acceptsReturns: true,
    priceMatchPolicy: false,
    loyaltyProgram: true,
    paymentMethods: ['Card', 'PayPal', 'Afterpay']
  },
  {
    id: 'strawberrynet',
    name: 'StrawberryNET Australia',
    website: 'strawberrynet.com.au',
    trustScore: 7.8,
    shippingOptions: ['Standard', 'Express'],
    averageDeliveryDays: 6,
    acceptsReturns: true,
    priceMatchPolicy: false,
    loyaltyProgram: false,
    paymentMethods: ['Card', 'PayPal']
  },
  {
    id: 'perfume-direct',
    name: 'Perfume Direct',
    website: 'perfumedirect.com.au',
    trustScore: 8.2,
    shippingOptions: ['Standard', 'Express'],
    averageDeliveryDays: 5,
    acceptsReturns: true,
    priceMatchPolicy: true,
    loyaltyProgram: false,
    paymentMethods: ['Card', 'PayPal', 'Afterpay']
  }
];

export class MarketIntelligenceService {
  // Track pricing across retailers
  async trackFragrancePricing(fragmentId: string): Promise<FragrancePricing[]> {
    try {
      const { data, error } = await supabase
        .from('australian_market_data')
        .select(`
          *,
          fragrances (
            id,
            name,
            brand
          )
        `)
        .eq('fragment_id', fragmentId)
        .order('last_checked', { ascending: false });

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        fragmentId: item.fragment_id,
        retailerId: item.retailer_name,
        priceAUD: item.price_aud,
        originalPriceAUD: item.original_price_aud,
        discountPercent: item.discount_percent,
        inStock: item.in_stock,
        productUrl: item.product_url,
        lastChecked: new Date(item.last_checked),
        shippingCost: item.shipping_cost,
        estimatedDelivery: item.estimated_delivery
      })) || [];

    } catch (error) {
      console.error('Error tracking fragrance pricing:', error);
      throw error;
    }
  }

  // Get best deals across all retailers
  async getBestDeals(
    filters: {
      maxPrice?: number;
      category?: string;
      retailer?: string;
      discountMin?: number;
    } = {}
  ): Promise<FragrancePricing[]> {
    try {
      let query = supabase
        .from('australian_market_data')
        .select(`
          *,
          fragrances (
            id,
            name,
            brand,
            category,
            gender
          )
        `)
        .eq('in_stock', true)
        .order('discount_percent', { ascending: false });

      if (filters.maxPrice) {
        query = query.lte('price_aud', filters.maxPrice);
      }

      if (filters.retailer) {
        query = query.eq('retailer_name', filters.retailer);
      }

      if (filters.discountMin) {
        query = query.gte('discount_percent', filters.discountMin);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        fragmentId: item.fragment_id,
        retailerId: item.retailer_name,
        priceAUD: item.price_aud,
        originalPriceAUD: item.original_price_aud,
        discountPercent: item.discount_percent,
        inStock: item.in_stock,
        productUrl: item.product_url,
        lastChecked: new Date(item.last_checked)
      })) || [];

    } catch (error) {
      console.error('Error getting best deals:', error);
      throw error;
    }
  }

  // Analyse market trends for a fragrance
  async analyseMarketTrends(fragmentId: string): Promise<MarketTrend> {
    try {
      // Get current pricing data
      const { data: currentData, error: currentError } = await supabase
        .from('australian_market_data')
        .select('price_aud, in_stock')
        .eq('fragment_id', fragmentId)
        .gte('last_checked', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (currentError) throw currentError;

      // Get historical data for comparison
      const { data: historicalData, error: histError } = await supabase
        .from('australian_market_data')
        .select('price_aud, last_checked')
        .eq('fragment_id', fragmentId)
        .gte('last_checked', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('last_checked', { ascending: true });

      if (histError) throw histError;

      // Calculate metrics
      const currentPrices = currentData?.map(d => d.price_aud).filter(p => p > 0) || [];
      const averagePrice = currentPrices.length > 0
        ? currentPrices.reduce((a, b) => a + b, 0) / currentPrices.length
        : 0;

      const availability = currentData?.length > 0
        ? (currentData.filter(d => d.in_stock).length / currentData.length) * 100
        : 0;

      // Calculate price changes
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const oldPrices30 = historicalData?.filter(d =>
        new Date(d.last_checked) <= thirtyDaysAgo
      ).map(d => d.price_aud) || [];

      const oldPrices90 = historicalData?.filter(d =>
        new Date(d.last_checked) <= ninetyDaysAgo
      ).map(d => d.price_aud) || [];

      const avgOldPrice30 = oldPrices30.length > 0
        ? oldPrices30.reduce((a, b) => a + b, 0) / oldPrices30.length
        : averagePrice;

      const avgOldPrice90 = oldPrices90.length > 0
        ? oldPrices90.reduce((a, b) => a + b, 0) / oldPrices90.length
        : averagePrice;

      const priceChange30Day = avgOldPrice30 > 0
        ? ((averagePrice - avgOldPrice30) / avgOldPrice30) * 100
        : 0;

      const priceChange90Day = avgOldPrice90 > 0
        ? ((averagePrice - avgOldPrice90) / avgOldPrice90) * 100
        : 0;

      // Determine seasonal trend
      let seasonalTrend: 'rising' | 'falling' | 'stable' = 'stable';
      if (priceChange30Day > 5) seasonalTrend = 'rising';
      else if (priceChange30Day < -5) seasonalTrend = 'falling';

      // Get popularity score from search analytics
      const { data: searchData, error: searchError } = await supabase
        .from('search_intelligence')
        .select('success_score')
        .ilike('query', `%${fragmentId}%`)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const popularityScore = searchData?.length > 0
        ? searchData.reduce((acc, s) => acc + (s.success_score || 0), 0) / searchData.length
        : 50; // Default to neutral

      return {
        fragmentId,
        averagePrice,
        priceChange30Day,
        priceChange90Day,
        availability,
        popularityScore,
        seasonalTrend
      };

    } catch (error) {
      console.error('Error analysing market trends:', error);
      throw error;
    }
  }

  // Compare retailers for a specific fragrance
  async compareRetailers(fragmentId: string): Promise<CompetitorAnalysis> {
    try {
      const pricing = await this.trackFragrancePricing(fragmentId);

      const retailerComparison = pricing.map(price => {
        const retailer = AUSTRALIAN_RETAILERS.find(r => r.id === price.retailerId);
        if (!retailer) {
          return {
            retailerId: price.retailerId,
            price: price.priceAUD,
            trustScore: 5,
            deliveryTime: 7,
            totalScore: 0
          };
        }

        // Calculate weighted score
        const priceScore = Math.max(0, 100 - (price.priceAUD / 10)); // Lower price = higher score
        const trustScoreNormalised = retailer.trustScore * 10;
        const deliveryScore = Math.max(0, 100 - (retailer.averageDeliveryDays * 10));

        const totalScore = (priceScore * 0.4) + (trustScoreNormalised * 0.4) + (deliveryScore * 0.2);

        return {
          retailerId: price.retailerId,
          price: price.priceAUD,
          trustScore: retailer.trustScore,
          deliveryTime: retailer.averageDeliveryDays,
          totalScore
        };
      }).filter(item => item.price > 0);

      // Sort by total score
      retailerComparison.sort((a, b) => b.totalScore - a.totalScore);

      // Find best options
      const bestValue = retailerComparison[0]?.retailerId || '';
      const cheapest = retailerComparison.reduce((min, current) =>
        current.price < min.price ? current : min
      )?.retailerId || '';

      const mostTrusted = retailerComparison.reduce((max, current) =>
        current.trustScore > max.trustScore ? current : max
      )?.retailerId || '';

      return {
        fragmentId,
        retailerComparison,
        bestValue,
        cheapest,
        mostTrusted
      };

    } catch (error) {
      console.error('Error comparing retailers:', error);
      throw error;
    }
  }

  // Set up price alert for user
  async createPriceAlert(
    userEmail: string,
    fragmentId: string,
    targetPrice: number,
    alertType: 'below' | 'discount' | 'back_in_stock'
  ): Promise<PriceAlert> {
    try {
      const alertData = {
        user_email: userEmail,
        fragment_id: fragmentId,
        target_price: targetPrice,
        alert_type: alertType,
        is_active: true
      };

      const { data, error } = await supabase
        .from('price_alerts')
        .insert(alertData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userEmail: data.user_email,
        fragmentId: data.fragment_id,
        targetPrice: data.target_price,
        alertType: data.alert_type,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        lastTriggered: data.last_triggered ? new Date(data.last_triggered) : undefined
      };

    } catch (error) {
      console.error('Error creating price alert:', error);
      throw error;
    }
  }

  // Check and trigger price alerts
  async checkPriceAlerts(): Promise<void> {
    try {
      const { data: activeAlerts, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const alert of activeAlerts || []) {
        const pricing = await this.trackFragrancePricing(alert.fragment_id);

        let shouldTrigger = false;
        let triggerReason = '';

        for (const price of pricing) {
          if (alert.alert_type === 'below' && price.priceAUD <= alert.target_price) {
            shouldTrigger = true;
            triggerReason = `Price dropped to $${price.priceAUD} at ${price.retailerId}`;
            break;
          } else if (alert.alert_type === 'discount' && (price.discountPercent || 0) >= alert.target_price) {
            shouldTrigger = true;
            triggerReason = `Discount of ${price.discountPercent}% available at ${price.retailerId}`;
            break;
          } else if (alert.alert_type === 'back_in_stock' && price.inStock) {
            shouldTrigger = true;
            triggerReason = `Back in stock at ${price.retailerId}`;
            break;
          }
        }

        if (shouldTrigger) {
          // Update alert
          await supabase
            .from('price_alerts')
            .update({
              last_triggered: new Date().toISOString(),
              is_active: false // Deactivate after triggering
            })
            .eq('id', alert.id);

          // Here you would typically send notification (email, push, etc.)
          console.log(`Price alert triggered for ${alert.user_email}: ${triggerReason}`);
        }
      }

    } catch (error) {
      console.error('Error checking price alerts:', error);
      throw error;
    }
  }

  // Get market overview for dashboard
  async getMarketOverview(): Promise<{
    totalFragrances: number;
    averagePrice: number;
    topDeals: FragrancePricing[];
    trendingUp: MarketTrend[];
    trendingDown: MarketTrend[];
    retailerPerformance: { retailer: string; averageScore: number; avgPrice: number }[];
  }> {
    try {
      // Get basic stats
      const { data: marketData, error: marketError } = await supabase
        .from('australian_market_data')
        .select('price_aud, retailer_name, fragment_id')
        .eq('in_stock', true)
        .gte('last_checked', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (marketError) throw marketError;

      const totalFragrances = new Set(marketData?.map(d => d.fragment_id) || []).size;
      const averagePrice = marketData?.length > 0
        ? marketData.reduce((sum, d) => sum + d.price_aud, 0) / marketData.length
        : 0;

      // Get top deals
      const topDeals = await this.getBestDeals({ discountMin: 20 });

      // Get retailer performance
      const retailerStats = new Map();
      marketData?.forEach(item => {
        if (!retailerStats.has(item.retailer_name)) {
          retailerStats.set(item.retailer_name, { prices: [], count: 0 });
        }
        const stats = retailerStats.get(item.retailer_name);
        stats.prices.push(item.price_aud);
        stats.count++;
      });

      const retailerPerformance = Array.from(retailerStats.entries()).map(([retailer, stats]) => {
        const retailerInfo = AUSTRALIAN_RETAILERS.find(r => r.id === retailer);
        return {
          retailer,
          averageScore: retailerInfo?.trustScore || 5,
          avgPrice: stats.prices.reduce((a: number, b: number) => a + b, 0) / stats.prices.length
        };
      });

      return {
        totalFragrances,
        averagePrice,
        topDeals: topDeals.slice(0, 5),
        trendingUp: [], // Would implement trend calculation
        trendingDown: [], // Would implement trend calculation
        retailerPerformance
      };

    } catch (error) {
      console.error('Error getting market overview:', error);
      throw error;
    }
  }
}