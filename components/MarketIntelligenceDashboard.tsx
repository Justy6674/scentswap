/**
 * Market Intelligence Dashboard
 * Australian fragrance market pricing and trends dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketIntelligenceService, FragrancePricing, MarketTrend, AUSTRALIAN_RETAILERS } from '../lib/marketIntelligence';

interface MarketDashboardProps {
  style?: any;
  onFragranceSelect?: (fragmentId: string) => void;
}

export default function MarketIntelligenceDashboard({
  style,
  onFragranceSelect
}: MarketDashboardProps) {
  const [marketService] = useState(() => new MarketIntelligenceService());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marketData, setMarketData] = useState<{
    totalFragrances: number;
    averagePrice: number;
    topDeals: FragrancePricing[];
    retailerPerformance: { retailer: string; averageScore: number; avgPrice: number }[];
  } | null>(null);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      const data = await marketService.getMarketOverview();
      setMarketData(data);
    } catch (error) {
      console.error('Error loading market data:', error);
      Alert.alert('Error', 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMarketData();
    setRefreshing(false);
  };

  const handleDealPress = (deal: FragrancePricing) => {
    if (onFragranceSelect) {
      onFragranceSelect(deal.fragmentId);
    }
  };

  const getRetailerIcon = (retailerId: string): string => {
    const icons: { [key: string]: string } = {
      'chemist-warehouse': 'medical',
      'priceline': 'heart',
      'myer': 'storefront',
      'david-jones': 'diamond',
      'adore-beauty': 'rose',
      'sephora-au': 'brush',
      'strawberrynet': 'leaf',
      'perfume-direct': 'flash'
    };
    return icons[retailerId] || 'storefront';
  };

  const getRetailerDisplayName = (retailerId: string): string => {
    const retailer = AUSTRALIAN_RETAILERS.find(r => r.id === retailerId);
    return retailer?.name || retailerId;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#b68a71" />
        <Text style={styles.loadingText}>Loading market intelligence...</Text>
      </View>
    );
  }

  if (!marketData) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load market data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMarketData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, style]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#b68a71"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="analytics" size={24} color="#b68a71" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Market Intelligence</Text>
          <Text style={styles.headerSubtitle}>
            Australian fragrance market insights
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#b68a71" />
        </TouchableOpacity>
      </View>

      {/* Market Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="bag" size={20} color="#b68a71" />
            </View>
            <Text style={styles.statValue}>
              {marketData.totalFragrances.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Available Products</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="cash" size={20} color="#b68a71" />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(marketData.averagePrice)}
            </Text>
            <Text style={styles.statLabel}>Average Price</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="trending-up" size={20} color="#b68a71" />
            </View>
            <Text style={styles.statValue}>
              {marketData.topDeals.length}
            </Text>
            <Text style={styles.statLabel}>Top Deals</Text>
          </View>
        </View>
      </View>

      {/* Top Deals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Best Deals</Text>
          <Text style={styles.sectionSubtitle}>Highest discounts available now</Text>
        </View>

        {marketData.topDeals.length > 0 ? (
          <View style={styles.dealsList}>
            {marketData.topDeals.map((deal, index) => (
              <TouchableOpacity
                key={`${deal.fragmentId}-${deal.retailerId}`}
                style={styles.dealCard}
                onPress={() => handleDealPress(deal)}
              >
                <View style={styles.dealHeader}>
                  <View style={styles.dealRank}>
                    <Text style={styles.dealRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.dealInfo}>
                    <Text style={styles.dealFragrance} numberOfLines={1}>
                      Fragrance #{deal.fragmentId.slice(-6)}
                    </Text>
                    <View style={styles.dealRetailer}>
                      <Ionicons
                        name={getRetailerIcon(deal.retailerId) as any}
                        size={14}
                        color="#b68a71"
                      />
                      <Text style={styles.dealRetailerText}>
                        {getRetailerDisplayName(deal.retailerId)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.dealPricing}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.currentPrice}>
                      {formatCurrency(deal.priceAUD)}
                    </Text>
                    {deal.originalPriceAUD && deal.originalPriceAUD > deal.priceAUD && (
                      <Text style={styles.originalPrice}>
                        {formatCurrency(deal.originalPriceAUD)}
                      </Text>
                    )}
                  </View>
                  {deal.discountPercent && deal.discountPercent > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        -{Math.round(deal.discountPercent)}%
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.dealFooter}>
                  <View style={[
                    styles.stockIndicator,
                    deal.inStock ? styles.inStock : styles.outOfStock
                  ]}>
                    <Ionicons
                      name={deal.inStock ? "checkmark-circle" : "close-circle"}
                      size={12}
                      color={deal.inStock ? "#22c55e" : "#ef4444"}
                    />
                    <Text style={[
                      styles.stockText,
                      deal.inStock ? styles.inStockText : styles.outOfStockText
                    ]}>
                      {deal.inStock ? 'In Stock' : 'Out of Stock'}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View</Text>
                    <Ionicons name="chevron-forward" size={14} color="#f8fafc" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color="#64748b" />
            <Text style={styles.emptyStateText}>No deals found</Text>
            <Text style={styles.emptyStateSubtext}>
              Check back later for new discounts
            </Text>
          </View>
        )}
      </View>

      {/* Retailer Performance */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏪 Retailer Performance</Text>
          <Text style={styles.sectionSubtitle}>Trust scores and pricing</Text>
        </View>

        <View style={styles.retailerList}>
          {marketData.retailerPerformance
            .sort((a, b) => b.averageScore - a.averageScore)
            .map((retailer, index) => (
              <View key={retailer.retailer} style={styles.retailerCard}>
                <View style={styles.retailerRank}>
                  <Text style={styles.retailerRankText}>{index + 1}</Text>
                </View>

                <View style={styles.retailerIcon}>
                  <Ionicons
                    name={getRetailerIcon(retailer.retailer) as any}
                    size={20}
                    color="#b68a71"
                  />
                </View>

                <View style={styles.retailerInfo}>
                  <Text style={styles.retailerName}>
                    {getRetailerDisplayName(retailer.retailer)}
                  </Text>
                  <Text style={styles.retailerPrice}>
                    Avg: {formatCurrency(retailer.avgPrice)}
                  </Text>
                </View>

                <View style={styles.retailerScore}>
                  <View style={styles.scoreBar}>
                    <View style={[
                      styles.scoreBarFill,
                      { width: `${(retailer.averageScore / 10) * 100}%` }
                    ]} />
                  </View>
                  <Text style={styles.scoreText}>
                    {retailer.averageScore.toFixed(1)}/10
                  </Text>
                </View>
              </View>
            ))
          }
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Data updated from {AUSTRALIAN_RETAILERS.length} trusted retailers
        </Text>
        <Text style={styles.footerSubtext}>
          Last updated: {new Date().toLocaleDateString('en-AU')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334155',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#f8fafc',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: '#b68a71',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: '#f8fafc',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  refreshButton: {
    padding: 8,
  },
  section: {
    padding: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  dealsList: {
    gap: 12,
  },
  dealCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#b68a71',
  },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dealRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#b68a71',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dealRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  dealInfo: {
    flex: 1,
  },
  dealFragrance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  dealRetailer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dealRetailerText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  dealPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22c55e',
    fontFamily: 'Inter',
  },
  originalPrice: {
    fontSize: 14,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    fontFamily: 'Inter',
  },
  discountBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inStock: {},
  outOfStock: {},
  stockText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  inStockText: {
    color: '#22c55e',
  },
  outOfStockText: {
    color: '#ef4444',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b68a71',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    fontFamily: 'Inter',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  retailerList: {
    gap: 12,
  },
  retailerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  retailerRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#b68a71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retailerRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  retailerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retailerInfo: {
    flex: 1,
  },
  retailerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  retailerPrice: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  retailerScore: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  scoreBar: {
    width: 50,
    height: 4,
    backgroundColor: '#64748b',
    borderRadius: 2,
    marginBottom: 4,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#b68a71',
    borderRadius: 2,
  },
  scoreText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  footerText: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    fontFamily: 'Inter',
  },
});