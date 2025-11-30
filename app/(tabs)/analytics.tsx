/**
 * Analytics & Insights Tab
 * Comprehensive analytics dashboard combining personal insights and market intelligence
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceDashboard from '@/components/MarketIntelligenceDashboard';
import { router } from 'expo-router';

type DashboardView = 'personal' | 'market' | 'overview';

interface OverviewMetric {
  id: string;
  title: string;
  value: string;
  trend: number; // percentage change
  icon: string;
  color: string;
}

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetric[]>([]);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    setLoading(true);
    try {
      // Simulate loading overview metrics
      await new Promise(resolve => setTimeout(resolve, 1000));

      const metrics: OverviewMetric[] = [
        {
          id: 'total_searches',
          title: 'AI Searches',
          value: '247',
          trend: 12.5,
          icon: 'search',
          color: '#3b82f6'
        },
        {
          id: 'recommendations',
          title: 'Recommendations',
          value: '89',
          trend: 8.3,
          icon: 'star',
          color: '#f59e0b'
        },
        {
          id: 'market_insights',
          title: 'Market Insights',
          value: '156',
          trend: 15.7,
          icon: 'trending-up',
          color: '#10b981'
        },
        {
          id: 'savings_found',
          title: 'Savings Found',
          value: '$2,340',
          trend: 22.1,
          icon: 'cash',
          color: '#22c55e'
        },
        {
          id: 'price_alerts',
          title: 'Active Alerts',
          value: '12',
          trend: -5.2,
          icon: 'notifications',
          color: '#ef4444'
        },
        {
          id: 'fragrance_matches',
          title: 'Perfect Matches',
          value: '34',
          trend: 18.9,
          icon: 'heart',
          color: '#ec4899'
        }
      ];

      setOverviewMetrics(metrics);
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
  };

  const handleFragranceSelect = (fragmentId: string) => {
    router.push(`/fragrance/${fragmentId}`);
  };

  const getTrendIcon = (trend: number): string => {
    return trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'remove';
  };

  const getTrendColor = (trend: number): string => {
    return trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#64748b';
  };

  const renderViewSelector = () => (
    <View style={styles.viewSelector}>
      <TouchableOpacity
        style={[
          styles.viewOption,
          currentView === 'overview' && styles.viewOptionActive
        ]}
        onPress={() => setCurrentView('overview')}
      >
        <Ionicons
          name="grid"
          size={18}
          color={currentView === 'overview' ? '#f8fafc' : '#cbd5e1'}
        />
        <Text style={[
          styles.viewOptionText,
          currentView === 'overview' && styles.viewOptionTextActive
        ]}>
          Overview
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.viewOption,
          currentView === 'personal' && styles.viewOptionActive
        ]}
        onPress={() => setCurrentView('personal')}
      >
        <Ionicons
          name="person"
          size={18}
          color={currentView === 'personal' ? '#f8fafc' : '#cbd5e1'}
        />
        <Text style={[
          styles.viewOptionText,
          currentView === 'personal' && styles.viewOptionTextActive
        ]}>
          Personal
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.viewOption,
          currentView === 'market' && styles.viewOptionActive
        ]}
        onPress={() => setCurrentView('market')}
      >
        <Ionicons
          name="globe"
          size={18}
          color={currentView === 'market' ? '#f8fafc' : '#cbd5e1'}
        />
        <Text style={[
          styles.viewOptionText,
          currentView === 'market' && styles.viewOptionTextActive
        ]}>
          Market
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewMetric = (metric: OverviewMetric) => (
    <View key={metric.id} style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
          <Ionicons name={metric.icon as any} size={20} color={metric.color} />
        </View>
        <View style={styles.metricTrend}>
          <Ionicons
            name={getTrendIcon(metric.trend) as any}
            size={14}
            color={getTrendColor(metric.trend)}
          />
          <Text style={[
            styles.metricTrendText,
            { color: getTrendColor(metric.trend) }
          ]}>
            {Math.abs(metric.trend).toFixed(1)}%
          </Text>
        </View>
      </View>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <Text style={styles.metricTitle}>{metric.title}</Text>
    </View>
  );

  const renderOverviewDashboard = () => (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#b68a71"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Your Analytics Summary</Text>
        <Text style={styles.sectionSubtitle}>
          AI-powered insights from your fragrance journey
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#b68a71" />
          </View>
        ) : (
          <View style={styles.metricsGrid}>
            {overviewMetrics.map(renderOverviewMetric)}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>

        <View style={styles.actionsList}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setCurrentView('personal')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="person" size={24} color="#b68a71" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Personal Analytics</Text>
              <Text style={styles.actionDescription}>
                View your fragrance preferences and AI recommendations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setCurrentView('market')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="globe" size={24} color="#b68a71" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Market Intelligence</Text>
              <Text style={styles.actionDescription}>
                Australian pricing, deals, and market trends
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/search')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="sparkles" size={24} color="#b68a71" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>AI Search</Text>
              <Text style={styles.actionDescription}>
                Discover fragrances with natural language AI search
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/assistant')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="chatbubble" size={24} color="#b68a71" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>AI Assistant</Text>
              <Text style={styles.actionDescription}>
                Get personalised fragrance advice and recommendations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 AI Insights</Text>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="lightbulb" size={24} color="#f59e0b" />
            <Text style={styles.insightTitle}>Seasonal Recommendation</Text>
          </View>
          <Text style={styles.insightText}>
            Based on current weather patterns, fresh citrus and aquatic fragrances are trending 23% higher this month. Perfect time to explore summer scents!
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="cash" size={24} color="#22c55e" />
            <Text style={styles.insightTitle}>Savings Opportunity</Text>
          </View>
          <Text style={styles.insightText}>
            Our AI detected 8 fragrances on your wishlist with price drops averaging 18%. Check Market Intelligence for details.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="heart" size={24} color="#ec4899" />
            <Text style={styles.insightTitle}>Perfect Match Found</Text>
          </View>
          <Text style={styles.insightText}>
            Based on your preferences, we found 3 new fragrances with 94%+ compatibility. View them in Personal Analytics.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="analytics" size={28} color="#b68a71" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Analytics & Insights</Text>
            <Text style={styles.subtitle}>
              AI-powered fragrance market intelligence
            </Text>
          </View>
        </View>

        <View style={styles.authContainer}>
          <Ionicons name="lock-closed" size={64} color="#64748b" />
          <Text style={styles.authTitle}>Sign In for Personal Analytics</Text>
          <Text style={styles.authDescription}>
            Get personalised insights, recommendations, and track your fragrance journey with AI-powered analytics.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.publicFeatures}>
            <Text style={styles.publicFeaturesTitle}>Available Without Sign In:</Text>
            <TouchableOpacity
              style={styles.publicFeatureButton}
              onPress={() => setCurrentView('market')}
            >
              <Ionicons name="globe" size={20} color="#b68a71" />
              <Text style={styles.publicFeatureText}>Market Intelligence</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="analytics" size={28} color="#b68a71" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Analytics & Insights</Text>
          <Text style={styles.subtitle}>
            AI-powered fragrance market intelligence
          </Text>
        </View>
      </View>

      {renderViewSelector()}

      {currentView === 'overview' && renderOverviewDashboard()}

      {currentView === 'personal' && (
        <AnalyticsDashboard
          style={styles.dashboardContainer}
          onFragranceSelect={handleFragranceSelect}
        />
      )}

      {currentView === 'market' && (
        <MarketIntelligenceDashboard
          style={styles.dashboardContainer}
          onFragranceSelect={handleFragranceSelect}
        />
      )}
    </SafeAreaView>
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
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#475569',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
  },
  viewOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewOptionActive: {
    backgroundColor: '#b68a71',
  },
  viewOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  viewOptionTextActive: {
    color: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    minWidth: 160,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricTrendText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  metricTitle: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  actionDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  insightCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#b68a71',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  insightText: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  dashboardContainer: {
    flex: 1,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  authDescription: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: 'Inter',
  },
  signInButton: {
    backgroundColor: '#b68a71',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  publicFeatures: {
    alignItems: 'center',
  },
  publicFeaturesTitle: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  publicFeatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#475569',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  publicFeatureText: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});