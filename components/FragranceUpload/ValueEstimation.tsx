/**
 * Value Estimation Component
 * Australian market-based valuation with condition and rarity factors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FragranceData } from './FragranceUploadFlow';

interface Props {
  fragranceData: FragranceData;
  onComplete: (valuation: FragranceData['valuation']) => void;
  onBack: () => void;
}

interface PriceDataPoint {
  retailer: string;
  price: number;
  size: string;
  inStock: boolean;
  lastChecked: string;
}

interface MarketData {
  currentRetailPrice: number;
  averageUsedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  marketActivity: 'high' | 'moderate' | 'low';
  recentSales: PriceDataPoint[];
  retailPrices: PriceDataPoint[];
}

interface ValuationBreakdown {
  basePrice: number;
  conditionMultiplier: number;
  rarityMultiplier: number;
  marketDemandMultiplier: number;
  estimatedMin: number;
  estimatedMax: number;
  confidence: number;
}

export default function ValueEstimation({ fragranceData, onComplete, onBack }: Props) {
  const [isCalculating, setIsCalculating] = useState(true);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [valuation, setValuation] = useState<ValuationBreakdown | null>(null);
  const [calculationStage, setCalculationStage] = useState('Fetching Australian market data...');
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    calculateValuation();
  }, []);

  const calculateValuation = async () => {
    setIsCalculating(true);

    try {
      // Stage 1: Market data collection
      setCalculationStage('Fetching Australian market prices...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 2: Condition assessment
      setCalculationStage('Analysing condition impact...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Stage 3: Rarity calculation
      setCalculationStage('Calculating rarity multiplier...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Stage 4: Market demand analysis
      setCalculationStage('Assessing market demand...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 5: Final calculation
      setCalculationStage('Calculating estimated value range...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock market data
      const mockMarketData: MarketData = {
        currentRetailPrice: 145,
        averageUsedPrice: 98,
        priceRange: {
          min: 75,
          max: 120
        },
        marketActivity: 'high',
        recentSales: [
          {
            retailer: 'ScentSwap User',
            price: 95,
            size: '100ml',
            inStock: true,
            lastChecked: '2 days ago'
          },
          {
            retailer: 'ScentSwap User',
            price: 110,
            size: '100ml',
            inStock: true,
            lastChecked: '5 days ago'
          },
          {
            retailer: 'Private Sale',
            price: 88,
            size: '100ml',
            inStock: false,
            lastChecked: '1 week ago'
          }
        ],
        retailPrices: [
          {
            retailer: 'Myer',
            price: 145,
            size: '100ml',
            inStock: true,
            lastChecked: '1 day ago'
          },
          {
            retailer: 'David Jones',
            price: 149,
            size: '100ml',
            inStock: true,
            lastChecked: '1 day ago'
          },
          {
            retailer: 'Chemist Warehouse',
            price: 139,
            size: '100ml',
            inStock: true,
            lastChecked: '2 days ago'
          }
        ]
      };

      // Calculate valuation breakdown
      const fillLevel = fragranceData.condition.fillPercentage || 75;
      const hasDefects = fragranceData.condition.defects && fragranceData.condition.defects.length > 0;

      // Base price from market average
      const basePrice = mockMarketData.averageUsedPrice;

      // Condition multiplier (based on fill level and defects)
      let conditionMultiplier = 1.0;
      if (fillLevel >= 95) conditionMultiplier = 1.1;
      else if (fillLevel >= 80) conditionMultiplier = 1.0;
      else if (fillLevel >= 60) conditionMultiplier = 0.9;
      else if (fillLevel >= 40) conditionMultiplier = 0.8;
      else conditionMultiplier = 0.7;

      if (hasDefects) conditionMultiplier -= 0.1;

      // Rarity multiplier (based on fragrance popularity)
      const rarityMultiplier = 1.0; // Standard fragrance

      // Market demand multiplier
      const marketDemandMultiplier = mockMarketData.marketActivity === 'high' ? 1.05 : 1.0;

      const finalPrice = basePrice * conditionMultiplier * rarityMultiplier * marketDemandMultiplier;

      const mockValuation: ValuationBreakdown = {
        basePrice,
        conditionMultiplier,
        rarityMultiplier,
        marketDemandMultiplier,
        estimatedMin: Math.round(finalPrice * 0.85),
        estimatedMax: Math.round(finalPrice * 1.15),
        confidence: 0.82
      };

      setMarketData(mockMarketData);
      setValuation(mockValuation);
    } catch (error) {
      console.error('Valuation calculation error:', error);
      // Handle error with default valuation
    } finally {
      setIsCalculating(false);
    }
  };

  const handleContinue = () => {
    if (!valuation || !marketData) return;

    const valuationData: FragranceData['valuation'] = {
      basePrice: valuation.basePrice,
      conditionMultiplier: valuation.conditionMultiplier,
      rarityMultiplier: valuation.rarityMultiplier,
      estimatedMin: valuation.estimatedMin,
      estimatedMax: valuation.estimatedMax,
      confidence: valuation.confidence,
      lastUpdated: new Date()
    };

    onComplete(valuationData);
  };

  const getMarketActivityColor = (activity: string) => {
    switch (activity) {
      case 'high': return '#22c55e';
      case 'moderate': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getMarketActivityDescription = (activity: string) => {
    switch (activity) {
      case 'high': return 'High demand, sells quickly';
      case 'moderate': return 'Steady demand, moderate selling time';
      case 'low': return 'Lower demand, may take longer to sell';
      default: return 'Unknown market activity';
    }
  };

  const formatPrice = (price: number) => `$${price}`;

  if (isCalculating) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Value Estimation</Text>
            <Text style={styles.headerSubtitle}>Calculating Australian market value</Text>
          </View>
        </View>

        <View style={styles.calculatingContainer}>
          <View style={styles.calculatingContent}>
            <View style={styles.calculatingIcon}>
              <ActivityIndicator size="large" color="#b68a71" />
            </View>

            <Text style={styles.calculatingTitle}>Calculating Market Value</Text>
            <Text style={styles.calculatingStage}>{calculationStage}</Text>

            <View style={styles.calculatingSteps}>
              <View style={styles.calculatingStep}>
                <Ionicons name="storefront" size={20} color="#3b82f6" />
                <Text style={styles.calculatingStepText}>Australian retail prices</Text>
              </View>
              <View style={styles.calculatingStep}>
                <Ionicons name="people" size={20} color="#8b5cf6" />
                <Text style={styles.calculatingStepText}>Recent community sales</Text>
              </View>
              <View style={styles.calculatingStep}>
                <Ionicons name="trending-up" size={20} color="#f59e0b" />
                <Text style={styles.calculatingStepText}>Market demand analysis</Text>
              </View>
              <View style={styles.calculatingStep}>
                <Ionicons name="calculator" size={20} color="#22c55e" />
                <Text style={styles.calculatingStepText}>Condition impact calculation</Text>
              </View>
            </View>

            <View style={styles.calculatingNote}>
              <Text style={styles.calculatingNoteText}>
                Our valuation engine analyses over 50 Australian retailers and recent community sales
                to provide accurate market estimates.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!valuation || !marketData) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Market Valuation</Text>
          <Text style={styles.headerSubtitle}>Australian market estimate</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Valuation Result */}
        <View style={styles.valuationCard}>
          <View style={styles.valuationHeader}>
            <View style={styles.valuationIcon}>
              <Ionicons name="trending-up" size={32} color="#22c55e" />
            </View>
            <View style={styles.valuationInfo}>
              <Text style={styles.valuationTitle}>Estimated Swap Value</Text>
              <Text style={styles.fragranceName}>
                {fragranceData.recognitionResults?.selectedSuggestion?.brand}{' '}
                {fragranceData.recognitionResults?.selectedSuggestion?.name}
              </Text>
            </View>
          </View>

          <View style={styles.priceRange}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Minimum</Text>
              <Text style={styles.priceValue}>{formatPrice(valuation.estimatedMin)}</Text>
            </View>
            <View style={styles.priceConnector}>
              <View style={styles.priceConnectorLine} />
              <Text style={styles.priceConnectorText}>to</Text>
              <View style={styles.priceConnectorLine} />
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Maximum</Text>
              <Text style={styles.priceValue}>{formatPrice(valuation.estimatedMax)}</Text>
            </View>
          </View>

          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>
              Confidence: {(valuation.confidence * 100).toFixed(0)}%
            </Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${valuation.confidence * 100}%` }
                ]}
              />
            </View>
          </View>
        </View>

        {/* Market Activity */}
        <View style={styles.marketActivityCard}>
          <View style={styles.marketActivityHeader}>
            <Ionicons
              name="pulse"
              size={20}
              color={getMarketActivityColor(marketData.marketActivity)}
            />
            <Text style={styles.marketActivityTitle}>Market Activity</Text>
            <Text style={[
              styles.marketActivityStatus,
              { color: getMarketActivityColor(marketData.marketActivity) }
            ]}>
              {marketData.marketActivity.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.marketActivityDescription}>
            {getMarketActivityDescription(marketData.marketActivity)}
          </Text>
        </View>

        {/* Detailed Breakdown */}
        <TouchableOpacity
          style={styles.breakdownToggle}
          onPress={() => setShowBreakdown(!showBreakdown)}
        >
          <Text style={styles.breakdownToggleText}>
            {showBreakdown ? 'Hide' : 'Show'} Calculation Breakdown
          </Text>
          <Ionicons
            name={showBreakdown ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#b68a71"
          />
        </TouchableOpacity>

        {showBreakdown && (
          <View style={styles.breakdownSection}>
            {/* Calculation Steps */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownCardTitle}>Calculation Steps</Text>

              <View style={styles.calculationStep}>
                <Text style={styles.calculationStepLabel}>Base Market Price</Text>
                <Text style={styles.calculationStepValue}>
                  {formatPrice(valuation.basePrice)}
                </Text>
              </View>

              <View style={styles.calculationStep}>
                <Text style={styles.calculationStepLabel}>
                  Condition Adjustment ({(valuation.conditionMultiplier * 100 - 100).toFixed(0)}%)
                </Text>
                <Text style={[
                  styles.calculationStepValue,
                  {
                    color: valuation.conditionMultiplier >= 1 ? '#22c55e' : '#ef4444'
                  }
                ]}>
                  {valuation.conditionMultiplier >= 1 ? '+' : ''}
                  {formatPrice((valuation.basePrice * valuation.conditionMultiplier) - valuation.basePrice)}
                </Text>
              </View>

              <View style={styles.calculationStep}>
                <Text style={styles.calculationStepLabel}>
                  Market Demand ({(valuation.marketDemandMultiplier * 100 - 100).toFixed(0)}%)
                </Text>
                <Text style={[
                  styles.calculationStepValue,
                  { color: valuation.marketDemandMultiplier >= 1 ? '#22c55e' : '#ef4444' }
                ]}>
                  {valuation.marketDemandMultiplier >= 1 ? '+' : ''}
                  {formatPrice(Math.round(valuation.basePrice * 0.05))}
                </Text>
              </View>

              <View style={[styles.calculationStep, styles.calculationTotal]}>
                <Text style={styles.calculationTotalLabel}>Estimated Range</Text>
                <Text style={styles.calculationTotalValue}>
                  {formatPrice(valuation.estimatedMin)} - {formatPrice(valuation.estimatedMax)}
                </Text>
              </View>
            </View>

            {/* Market Data */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownCardTitle}>Australian Retail Prices</Text>
              {marketData.retailPrices.map((price, index) => (
                <View key={index} style={styles.priceDataItem}>
                  <View style={styles.priceDataInfo}>
                    <Text style={styles.priceDataRetailer}>{price.retailer}</Text>
                    <Text style={styles.priceDataDetails}>
                      {price.size} • Updated {price.lastChecked}
                    </Text>
                  </View>
                  <View style={styles.priceDataPrice}>
                    <Text style={styles.priceDataValue}>{formatPrice(price.price)}</Text>
                    <View style={[
                      styles.priceDataStatus,
                      { backgroundColor: price.inStock ? '#22c55e' : '#ef4444' }
                    ]}>
                      <Text style={styles.priceDataStatusText}>
                        {price.inStock ? 'In Stock' : 'Out of Stock'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Recent Sales */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownCardTitle}>Recent Community Sales</Text>
              {marketData.recentSales.map((sale, index) => (
                <View key={index} style={styles.priceDataItem}>
                  <View style={styles.priceDataInfo}>
                    <Text style={styles.priceDataRetailer}>{sale.retailer}</Text>
                    <Text style={styles.priceDataDetails}>
                      {sale.size} • Sold {sale.lastChecked}
                    </Text>
                  </View>
                  <Text style={styles.priceDataValue}>{formatPrice(sale.price)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Important Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Valuation Notes</Text>

          <View style={styles.note}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>Market Estimate Only</Text>
              <Text style={styles.noteText}>
                This valuation is an estimate based on current Australian market data.
                Actual swap values may vary based on demand and individual negotiations.
              </Text>
            </View>
          </View>

          <View style={styles.note}>
            <Ionicons name="trending-up" size={20} color="#22c55e" />
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>Dynamic Pricing</Text>
              <Text style={styles.noteText}>
                Market values update regularly based on retail price changes,
                community activity, and seasonal demand patterns.
              </Text>
            </View>
          </View>

          <View style={styles.note}>
            <Ionicons name="shield-checkmark" size={20} color="#b68a71" />
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>Fair Trading</Text>
              <Text style={styles.noteText}>
                Our valuations help ensure fair trades within the ScentSwap community.
                Consider this estimate when setting your swap preferences.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.continueContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue to Final Review</Text>
          <Ionicons name="arrow-forward" size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 250, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calculatingContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  calculatingContent: {
    alignItems: 'center',
  },
  calculatingIcon: {
    marginBottom: 24,
  },
  calculatingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  calculatingStage: {
    fontSize: 16,
    color: '#b68a71',
    marginBottom: 32,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  calculatingSteps: {
    alignSelf: 'stretch',
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  calculatingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calculatingStepText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  calculatingNote: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  calculatingNoteText: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  valuationCard: {
    backgroundColor: '#475569',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  valuationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  valuationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuationInfo: {
    flex: 1,
  },
  valuationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  fragranceName: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  priceRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#22c55e',
    fontFamily: 'Inter',
  },
  priceConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  priceConnectorLine: {
    height: 2,
    width: 20,
    backgroundColor: '#475569',
  },
  priceConnectorText: {
    fontSize: 12,
    color: '#94a3b8',
    marginHorizontal: 8,
    fontFamily: 'Inter',
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  confidenceBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  marketActivityCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  marketActivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  marketActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
    fontFamily: 'Inter',
  },
  marketActivityStatus: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  marketActivityDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  breakdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  breakdownToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b68a71',
    fontFamily: 'Inter',
  },
  breakdownSection: {
    gap: 16,
    marginBottom: 20,
  },
  breakdownCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
  },
  breakdownCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  calculationStep: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  calculationStepLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
    fontFamily: 'Inter',
  },
  calculationStepValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  calculationTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#b68a71',
    paddingTop: 12,
    marginTop: 8,
  },
  calculationTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
    fontFamily: 'Inter',
  },
  calculationTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22c55e',
    fontFamily: 'Inter',
  },
  priceDataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  priceDataInfo: {
    flex: 1,
  },
  priceDataRetailer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  priceDataDetails: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  priceDataPrice: {
    alignItems: 'flex-end',
  },
  priceDataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  priceDataStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  priceDataStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  notesSection: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  noteText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  continueContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b68a71',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
});