/**
 * Analytics Dashboard Component
 * Advanced analytics and personalised recommendations dashboard
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
import { useAuth } from '@/contexts/AuthContext';
import {
  AdvancedAnalyticsService,
  UserProfile,
  PersonalisedRecommendation,
  AnalyticsInsight
} from '../lib/advancedAnalytics';

interface AnalyticsDashboardProps {
  style?: any;
  onFragranceSelect?: (fragmentId: string) => void;
}

export default function AnalyticsDashboard({
  style,
  onFragranceSelect
}: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const [analyticsService] = useState(() => new AdvancedAnalyticsService());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalisedRecommendation[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);

  useEffect(() => {
    if (user?.email) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);

      // Load user profile and recommendations in parallel
      const [profile, recs, analyticsInsights] = await Promise.all([
        analyticsService.buildUserProfile(user.email),
        analyticsService.generatePersonalisedRecommendations(user.email, {
          count: 8,
          includeExplanations: true
        }),
        analyticsService.generateAnalyticsInsights()
      ]);

      setUserProfile(profile);
      setRecommendations(recs);
      setInsights(analyticsInsights);

    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleRecommendationPress = (recommendation: PersonalisedRecommendation) => {
    if (onFragranceSelect) {
      onFragranceSelect(recommendation.fragmentId);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return '#22c55e';
    if (confidence >= 60) return '#f59e0b';
    if (confidence >= 40) return '#f97316';
    return '#ef4444';
  };

  const getTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'personalised': 'person',
      'similar': 'copy',
      'trending': 'trending-up',
      'seasonal': 'leaf',
      'price_match': 'cash',
      'discovery': 'compass'
    };
    return icons[type] || 'star';
  };

  const getInsightIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'user_trend': 'people',
      'market_trend': 'trending-up',
      'product_insight': 'lightbulb',
      'opportunity': 'target'
    };
    return icons[type] || 'analytics';
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.authContainer, style]}>
        <Ionicons name="lock-closed" size={48} color="#64748b" />
        <Text style={styles.authText}>Please sign in to view analytics</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#b68a71" />
        <Text style={styles.loadingText}>Loading your analytics...</Text>
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
          <Text style={styles.headerTitle}>Personal Analytics</Text>
          <Text style={styles.headerSubtitle}>
            AI-powered insights and recommendations
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#b68a71" />
        </TouchableOpacity>
      </View>

      {/* User Profile Summary */}
      {userProfile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.confidenceIndicator}>
                <View style={[
                  styles.confidenceBar,
                  { width: `${userProfile.confidenceScore}%` }
                ]} />
              </View>
              <Text style={styles.confidenceText}>
                {userProfile.confidenceScore}% Profile Confidence
              </Text>
            </View>

            <View style={styles.profileMetrics}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>
                  {userProfile.behaviourMetrics.searchPatterns.searchFrequency.toFixed(1)}
                </Text>
                <Text style={styles.metricLabel}>Searches per session</Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricValue}>
                  ${userProfile.preferences.preferredPriceRange[0]}-${userProfile.preferences.preferredPriceRange[1]}
                </Text>
                <Text style={styles.metricLabel}>Price range</Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricValue}>
                  {userProfile.preferences.preferredCategories.length || 'Any'}
                </Text>
                <Text style={styles.metricLabel}>Preferred categories</Text>
              </View>
            </View>

            <View style={styles.topQueries}>
              <Text style={styles.topQueriesTitle}>Recent interests:</Text>
              <View style={styles.queryTags}>
                {userProfile.behaviourMetrics.searchPatterns.commonQueries.slice(0, 3).map((query, index) => (
                  <View key={index} style={styles.queryTag}>
                    <Text style={styles.queryTagText} numberOfLines={1}>
                      {query.length > 20 ? `${query.substring(0, 20)}...` : query}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Personalised Recommendations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>✨ For You</Text>
          <Text style={styles.sectionSubtitle}>
            Personalised recommendations based on your preferences
          </Text>
        </View>

        {recommendations.length > 0 ? (
          <View style={styles.recommendationsList}>
            {recommendations.map((rec, index) => (
              <TouchableOpacity
                key={`${rec.fragmentId}-${index}`}
                style={styles.recommendationCard}
                onPress={() => handleRecommendationPress(rec)}
              >
                <View style={styles.recHeader}>
                  <View style={styles.recTypeIcon}>
                    <Ionicons
                      name={getTypeIcon(rec.type) as any}
                      size={16}
                      color="#b68a71"
                    />
                  </View>
                  <View style={styles.recInfo}>
                    <Text style={styles.recTitle}>
                      Fragrance #{rec.fragmentId.slice(-6)}
                    </Text>
                    <Text style={styles.recType}>
                      {rec.type.replace('_', ' ')} recommendation
                    </Text>
                  </View>
                  <View style={[
                    styles.confidenceBadge,
                    { backgroundColor: getConfidenceColor(rec.confidenceScore) }
                  ]}>
                    <Text style={styles.confidenceBadgeText}>
                      {Math.round(rec.confidenceScore)}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.recReason} numberOfLines={2}>
                  {rec.reason}
                </Text>

                <View style={styles.recMetrics}>
                  <View style={styles.recMetric}>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={styles.recMetricText}>
                      {rec.expectedRating.toFixed(1)}/5
                    </Text>
                  </View>

                  <View style={styles.recMetric}>
                    <Ionicons
                      name={rec.priceMatch ? "checkmark-circle" : "close-circle"}
                      size={14}
                      color={rec.priceMatch ? "#22c55e" : "#ef4444"}
                    />
                    <Text style={styles.recMetricText}>
                      {rec.priceMatch ? 'In budget' : 'Above budget'}
                    </Text>
                  </View>

                  <View style={styles.recMetric}>
                    <Ionicons name="diamond" size={14} color="#8b5cf6" />
                    <Text style={styles.recMetricText}>
                      {rec.marketPosition}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.exploreButton}>
                  <Text style={styles.exploreButtonText}>Explore</Text>
                  <Ionicons name="chevron-forward" size={14} color="#f8fafc" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="compass" size={48} color="#64748b" />
            <Text style={styles.emptyStateText}>Building your profile...</Text>
            <Text style={styles.emptyStateSubtext}>
              Use the app more to get personalised recommendations
            </Text>
          </View>
        )}
      </View>

      {/* Analytics Insights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📊 Market Insights</Text>
          <Text style={styles.sectionSubtitle}>
            Trends and opportunities in the fragrance market
          </Text>
        </View>

        <View style={styles.insightsList}>
          {insights.map((insight, index) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightIcon}>
                  <Ionicons
                    name={getInsightIcon(insight.type) as any}
                    size={20}
                    color="#b68a71"
                  />
                </View>
                <View style={styles.insightInfo}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightType}>
                    {insight.type.replace('_', ' ')}
                  </Text>
                </View>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(insight.confidence) }
                ]}>
                  <Text style={styles.confidenceBadgeText}>
                    {insight.confidence}%
                  </Text>
                </View>
              </View>

              <Text style={styles.insightDescription}>
                {insight.description}
              </Text>

              {insight.actionable && (
                <View style={styles.actionableIndicator}>
                  <Ionicons name="flash" size={14} color="#f59e0b" />
                  <Text style={styles.actionableText}>Actionable insight</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Analytics powered by machine learning
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
  authContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  authText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 16,
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
  profileCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#b68a71',
  },
  profileHeader: {
    marginBottom: 16,
  },
  confidenceIndicator: {
    height: 4,
    backgroundColor: '#64748b',
    borderRadius: 2,
    marginBottom: 8,
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: '#b68a71',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  profileMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  metricLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  topQueries: {
    marginTop: 8,
  },
  topQueriesTitle: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  queryTags: {
    flexDirection: 'row',
    gap: 8,
  },
  queryTag: {
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: 120,
  },
  queryTagText: {
    fontSize: 12,
    color: '#b68a71',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#b68a71',
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recInfo: {
    flex: 1,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  recType: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  recReason: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 12,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  recMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  recMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recMetricText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b68a71',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightInfo: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  insightType: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  insightDescription: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  actionableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionableText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
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