/**
 * Smart Search Page
 * AI-powered fragrance discovery with natural language processing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import SmartSearchBar from '../../components/SmartSearchBar';
import SmartSearchResults from '../../components/SmartSearchResults';
import { SmartSearchResponse, EnhancedFragranceResult } from '../../lib/searchAI';
import { router } from 'expo-router';

export default function SearchScreen() {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<SmartSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      // Load user's search history from storage or API
      // For now, using mock data
      const history = [
        'fresh summer citrus under $150',
        'woody masculine winter fragrances',
        'floral feminine date night scents'
      ];
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const handleSearchStart = () => {
    setIsSearching(true);
  };

  const handleSearchResults = (results: SmartSearchResponse) => {
    setSearchResults(results);
    setIsSearching(false);

    // Log search analytics
    logSearchAnalytics(results);
  };

  const handleSearchError = (error: string) => {
    setIsSearching(false);
    Alert.alert('Search Error', error);
  };

  const handleFragranceSelect = (fragrance: EnhancedFragranceResult) => {
    // Navigate to fragrance detail page
    router.push({
      pathname: '/fragrance/[id]',
      params: {
        id: fragrance.id,
        name: fragrance.name,
        brand: fragrance.brand
      }
    });
  };

  const handleRetailerPress = (retailer: any) => {
    // Handle retailer selection for purchasing
    Alert.alert(
      'Purchase Option',
      `View ${retailer.name} for pricing and availability?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View', onPress: () => openRetailerLink(retailer) }
      ]
    );
  };

  const openRetailerLink = (retailer: any) => {
    // Open retailer link in browser or app
    console.log('Opening retailer link:', retailer);
  };

  const logSearchAnalytics = (results: SmartSearchResponse) => {
    // Log search analytics for improving AI
    const analyticsData = {
      query: results.searchInsights.parsedIntent,
      resultCount: results.totalCount,
      searchStrategy: results.searchInsights.searchStrategy,
      confidence: results.searchInsights.confidence,
      timestamp: new Date().toISOString(),
      userId: user?.email || 'anonymous'
    };

    console.log('Search analytics:', analyticsData);
    // TODO: Send to analytics service
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Smart Search</Text>
          <Text style={styles.headerSubtitle}>
            AI-powered fragrance discovery
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SmartSearchBar
            onSearchResults={handleSearchResults}
            onSearchStart={handleSearchStart}
            onSearchError={handleSearchError}
            userEmail={user?.email}
            autoFocus={false}
          />
        </View>

        {/* Search Results */}
        <View style={styles.resultsContainer}>
          <SmartSearchResults
            searchResults={searchResults}
            onFragranceSelect={handleFragranceSelect}
            onRetailerPress={handleRetailerPress}
            isLoading={isSearching}
          />
        </View>

        {/* Search Tips (when no results) */}
        {!searchResults && !isSearching && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>✨ AI Search Examples</Text>

            <View style={styles.tipCard}>
              <Text style={styles.tipHeader}>🌊 Natural Language</Text>
              <Text style={styles.tipText}>
                "Fresh summer fragrances under $150"
              </Text>
              <Text style={styles.tipDescription}>
                Our AI understands context, budget, and occasion
              </Text>
            </View>

            <View style={styles.tipCard}>
              <Text style={styles.tipHeader}>🎯 Specific Needs</Text>
              <Text style={styles.tipText}>
                "Long lasting office appropriate masculine scents"
              </Text>
              <Text style={styles.tipDescription}>
                Include performance and occasion requirements
              </Text>
            </View>

            <View style={styles.tipCard}>
              <Text style={styles.tipHeader}>🔍 Comparative Search</Text>
              <Text style={styles.tipText}>
                "Something like Tom Ford Neroli Portofino but cheaper"
              </Text>
              <Text style={styles.tipDescription}>
                Find alternatives and dupes with AI analysis
              </Text>
            </View>

            <View style={styles.tipCard}>
              <Text style={styles.tipHeader}>🇦🇺 Australian Focus</Text>
              <Text style={styles.tipText}>
                "Available at Chemist Warehouse under $100"
              </Text>
              <Text style={styles.tipDescription}>
                Include Australian retailers for local availability
              </Text>
            </View>

            <View style={styles.aiFeatures}>
              <Text style={styles.featuresTitle}>🧠 AI Features</Text>
              <Text style={styles.featureItem}>• Intent recognition and smart filtering</Text>
              <Text style={styles.featureItem}>• Australian market intelligence</Text>
              <Text style={styles.featureItem}>• Personalised recommendations</Text>
              <Text style={styles.featureItem}>• Fragrance DNA matching</Text>
              <Text style={styles.featureItem}>• Real-time pricing and availability</Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334155',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#b68a71',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  resultsContainer: {
    flex: 1,
    marginTop: 16,
  },
  tipsSection: {
    flex: 1,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  tipCard: {
    backgroundColor: '#475569',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#b68a71',
  },
  tipHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  tipText: {
    fontSize: 14,
    color: '#fef5e7',
    fontStyle: 'italic',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  tipDescription: {
    fontSize: 12,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  aiFeatures: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  featureItem: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
});