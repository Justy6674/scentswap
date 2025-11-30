/**
 * Smart Search Results Component
 * Displays AI-enhanced search results with insights and recommendations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SmartSearchResponse, EnhancedFragranceResult } from '../lib/searchAI';

interface SmartSearchResultsProps {
  searchResults: SmartSearchResponse | null;
  onFragranceSelect?: (fragrance: EnhancedFragranceResult) => void;
  onRetailerPress?: (retailer: any) => void;
  isLoading?: boolean;
}

export default function SmartSearchResults({
  searchResults,
  onFragranceSelect,
  onRetailerPress,
  isLoading = false
}: SmartSearchResultsProps) {

  const [activeTab, setActiveTab] = useState<'results' | 'insights' | 'recommendations'>('results');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🧠 AI is thinking...</Text>
        <Text style={styles.loadingSubtext}>
          Analysing 25,000+ fragrances with Australian market intelligence
        </Text>
      </View>
    );
  }

  if (!searchResults) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color="#64748b" />
        <Text style={styles.emptyTitle}>Start your intelligent search</Text>
        <Text style={styles.emptyText}>
          Use natural language to find your perfect fragrance
        </Text>
      </View>
    );
  }

  const { results, searchInsights, recommendations, australianContext } = searchResults;

  const renderFragranceCard = ({ item }: { item: EnhancedFragranceResult }) => (
    <TouchableOpacity
      style={styles.fragranceCard}
      onPress={() => onFragranceSelect?.(item)}
      activeOpacity={0.8}
    >
      {/* Relevance Score Badge */}
      <View style={styles.scoreContainer}>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.relevanceScore) }]}>
          <Text style={styles.scoreText}>{Math.round(item.relevanceScore)}%</Text>
        </View>
        {item.verified && (
          <Ionicons name="checkmark-circle" size={16} color="#10b981" style={styles.verifiedIcon} />
        )}
      </View>

      {/* Fragrance Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: `https://via.placeholder.com/100x150/475569/f8fafc?text=${item.brand}` }}
          style={styles.fragranceImage}
          resizeMode="cover"
        />
      </View>

      {/* Fragrance Info */}
      <View style={styles.fragranceInfo}>
        <Text style={styles.fragranceName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.fragranceBrand}>
          {item.brand}
          {item.year_released && <Text style={styles.year}> ({item.year_released})</Text>}
        </Text>

        {/* AI Match Explanation */}
        <View style={styles.aiExplanation}>
          <Ionicons name="bulb-outline" size={14} color="#b68a71" />
          <Text style={styles.matchText} numberOfLines={2}>
            {item.matchExplanation}
          </Text>
        </View>

        {/* Fragrance Details */}
        <View style={styles.detailsRow}>
          {item.family && (
            <View style={styles.detailChip}>
              <Text style={styles.detailText}>{item.family}</Text>
            </View>
          )}
          {item.concentration && (
            <View style={styles.detailChip}>
              <Text style={styles.detailText}>{item.concentration}</Text>
            </View>
          )}
        </View>

        {/* Notes Preview */}
        {item.top_notes && item.top_notes.length > 0 && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Top notes:</Text>
            <Text style={styles.notesText} numberOfLines={1}>
              {item.top_notes.slice(0, 3).join(', ')}
            </Text>
          </View>
        )}

        {/* Australian Pricing */}
        <View style={styles.pricingRow}>
          {item.average_price_aud && (
            <Text style={styles.priceText}>
              ${item.average_price_aud.toFixed(0)} AUD
            </Text>
          )}
          {item.rating_value && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={styles.ratingText}>
                {item.rating_value.toFixed(1)}
                {item.rating_count && (
                  <Text style={styles.ratingCount}> ({item.rating_count})</Text>
                )}
              </Text>
            </View>
          )}
        </View>

        {/* AI Recommendations */}
        {item.aiGenerated && (
          <View style={styles.aiRecommendations}>
            {item.aiGenerated.bestOccasions && (
              <View style={styles.occasionsRow}>
                <Ionicons name="calendar-outline" size={12} color="#64748b" />
                <Text style={styles.occasionsText}>
                  {item.aiGenerated.bestOccasions.slice(0, 2).join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderInsightsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Search Understanding */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>
          <Ionicons name="brain-outline" size={16} color="#b68a71" /> Search Understanding
        </Text>
        <Text style={styles.insightText}>
          Search type: {searchInsights.parsedIntent.searchType}
        </Text>
        <Text style={styles.insightText}>
          Strategy: {searchInsights.searchStrategy}
        </Text>
        <Text style={styles.insightText}>
          Confidence: {searchInsights.confidence}%
        </Text>
      </View>

      {/* Applied Filters */}
      {Object.keys(searchInsights.appliedFilters || {}).length > 0 && (
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>
            <Ionicons name="filter-outline" size={16} color="#b68a71" /> Applied Filters
          </Text>
          {Object.entries(searchInsights.appliedFilters).map(([key, value]) => (
            <Text key={key} style={styles.filterText}>
              {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
            </Text>
          ))}
        </View>
      )}

      {/* Australian Market Context */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>
          <Ionicons name="location-outline" size={16} color="#b68a71" /> Australian Market
        </Text>
        <Text style={styles.insightText}>
          Average Price: ${australianContext.averagePriceAUD.toFixed(0)} AUD
        </Text>
        <Text style={styles.insightText}>
          Price Range: ${australianContext.priceRange[0]} - ${australianContext.priceRange[1]} AUD
        </Text>
      </View>

      {/* Search Suggestions */}
      {searchInsights.suggestions.length > 0 && (
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>
            <Ionicons name="bulb-outline" size={16} color="#b68a71" /> Suggestions
          </Text>
          {searchInsights.suggestions.map((suggestion, index) => (
            <Text key={index} style={styles.suggestionText}>
              • {suggestion}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderRecommendationsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Similar Fragrances */}
      {recommendations.similarFragrances.length > 0 && (
        <View style={styles.recommendationSection}>
          <Text style={styles.sectionTitle}>Similar Fragrances</Text>
          <FlatList
            data={recommendations.similarFragrances}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.similarItem}
                onPress={() => onFragranceSelect?.(item)}
              >
                <Text style={styles.similarName}>{item.name}</Text>
                <Text style={styles.similarBrand}>{item.brand}</Text>
                <Text style={styles.similarReason}>{item.matchExplanation}</Text>
              </TouchableOpacity>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.similarList}
          />
        </View>
      )}

      {/* Brand Recommendations */}
      {recommendations.brandRecommendations.length > 0 && (
        <View style={styles.recommendationSection}>
          <Text style={styles.sectionTitle}>Recommended Brands</Text>
          <View style={styles.brandsContainer}>
            {recommendations.brandRecommendations.map((brand, index) => (
              <View key={index} style={styles.brandChip}>
                <Text style={styles.brandText}>{brand}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Price Alternatives */}
      {recommendations.priceAlternatives.length > 0 && (
        <View style={styles.recommendationSection}>
          <Text style={styles.sectionTitle}>Budget Alternatives</Text>
          {recommendations.priceAlternatives.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.alternativeItem}
              onPress={() => onFragranceSelect?.(item)}
            >
              <Text style={styles.alternativeName}>{item.name}</Text>
              <Text style={styles.alternativeBrand}>{item.brand}</Text>
              <Text style={styles.alternativePrice}>
                ${item.average_price_aud?.toFixed(0)} AUD
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Results Header */}
      <View style={styles.header}>
        <Text style={styles.resultsCount}>
          {results.length} intelligent matches found
        </Text>
        <Text style={styles.searchStrategy}>
          Using {searchInsights.searchStrategy.replace('_', ' ')} strategy
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.activeTab]}
          onPress={() => setActiveTab('results')}
        >
          <Text style={[styles.tabText, activeTab === 'results' && styles.activeTabText]}>
            Results
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
          onPress={() => setActiveTab('insights')}
        >
          <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
            Insights
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
            Similar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'results' && (
        <FlatList
          data={results}
          renderItem={renderFragranceCard}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'insights' && renderInsightsTab()}
      {activeTab === 'recommendations' && renderRecommendationsTab()}
    </View>
  );
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334155',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  searchStrategy: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#475569',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#b68a71',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#cbd5e1',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
  },
  fragranceCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  scoreContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fragranceImage: {
    width: '100%',
    height: '100%',
  },
  fragranceInfo: {
    padding: 16,
  },
  fragranceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  fragranceBrand: {
    fontSize: 14,
    color: '#b68a71',
    marginBottom: 8,
  },
  year: {
    color: '#94a3b8',
  },
  aiExplanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 8,
  },
  matchText: {
    flex: 1,
    fontSize: 12,
    color: '#cbd5e1',
    marginLeft: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailChip: {
    backgroundColor: '#64748b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  detailText: {
    fontSize: 11,
    color: '#f8fafc',
    fontWeight: '500',
  },
  notesContainer: {
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#fbbf24',
    marginLeft: 4,
  },
  ratingCount: {
    color: '#94a3b8',
  },
  aiRecommendations: {
    marginTop: 8,
  },
  occasionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  occasionsText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
  },
  insightCard: {
    backgroundColor: '#475569',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  recommendationSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  similarList: {
    marginLeft: -16,
  },
  similarItem: {
    backgroundColor: '#475569',
    padding: 12,
    marginLeft: 16,
    borderRadius: 8,
    width: 160,
  },
  similarName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f8fafc',
    marginBottom: 4,
  },
  similarBrand: {
    fontSize: 12,
    color: '#b68a71',
    marginBottom: 4,
  },
  similarReason: {
    fontSize: 11,
    color: '#94a3b8',
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  brandChip: {
    backgroundColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  brandText: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
  },
  alternativeItem: {
    backgroundColor: '#475569',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alternativeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f8fafc',
    flex: 1,
  },
  alternativeBrand: {
    fontSize: 12,
    color: '#b68a71',
    flex: 1,
  },
  alternativePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
});