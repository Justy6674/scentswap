/**
 * AI Assistant Tab
 * Conversational AI for fragrance consultation and personalised recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import AIAssistantChat from '@/components/AIAssistantChat';
import { router } from 'expo-router';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  prompt: string;
  category: 'discovery' | 'recommendation' | 'education' | 'comparison';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'find_signature',
    title: 'Find My Signature Scent',
    description: 'Personalised fragrance matching based on your preferences',
    icon: 'star',
    prompt: 'I want to find my perfect signature fragrance. Can you help me discover scents that match my personality and style?',
    category: 'discovery'
  },
  {
    id: 'occasion_recommendation',
    title: 'Occasion Recommendations',
    description: 'Get fragrances perfect for specific occasions and seasons',
    icon: 'calendar',
    prompt: 'I have a special occasion coming up. Can you recommend the perfect fragrance for the event?',
    category: 'recommendation'
  },
  {
    id: 'fragrance_education',
    title: 'Learn About Fragrances',
    description: 'Understand fragrance notes, families, and composition',
    icon: 'school',
    prompt: 'I want to learn more about how fragrances work. Can you explain fragrance notes and families to me?',
    category: 'education'
  },
  {
    id: 'budget_finder',
    title: 'Budget-Friendly Options',
    description: 'Discover amazing fragrances within your price range',
    icon: 'cash',
    prompt: 'I have a specific budget for fragrances. Can you help me find the best options within my price range?',
    category: 'discovery'
  },
  {
    id: 'seasonal_guide',
    title: 'Seasonal Fragrance Guide',
    description: 'Perfect scents for every season and weather',
    icon: 'leaf',
    prompt: 'What fragrances work best for the current season? I want something perfect for the weather.',
    category: 'recommendation'
  },
  {
    id: 'fragrance_comparison',
    title: 'Compare Fragrances',
    description: 'Detailed comparisons between similar fragrances',
    icon: 'git-compare',
    prompt: 'I want to compare different fragrances to help me decide. Can you explain the differences between similar scents?',
    category: 'comparison'
  },
  {
    id: 'clone_finder',
    title: 'Find Alternatives',
    description: 'Discover affordable alternatives to expensive fragrances',
    icon: 'copy',
    prompt: 'I love expensive fragrances but need more affordable alternatives. Can you help me find similar scents for less?',
    category: 'discovery'
  },
  {
    id: 'australian_availability',
    title: 'Australian Availability',
    description: 'Find where to buy fragrances in Australia with best prices',
    icon: 'location',
    prompt: 'Where can I buy specific fragrances in Australia? I want to find the best prices and availability.',
    category: 'recommendation'
  }
];

export default function AssistantScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleQuickAction = (action: QuickAction) => {
    setSelectedAction(action);
    setShowChat(true);
  };

  const handleFragranceRecommendation = (fragrance: any) => {
    // Navigate to fragrance detail or listing
    Alert.alert(
      'Fragrance Recommendation',
      `Would you like to explore ${fragrance.name || 'this fragrance'}?`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        {
          text: 'Explore',
          onPress: () => {
            if (fragrance.id) {
              router.push(`/fragrance/${fragrance.id}`);
            }
          }
        }
      ]
    );
  };

  const getActionsByCategory = (category: string) => {
    return QUICK_ACTIONS.filter(action => action.category === category);
  };

  const renderQuickActionCard = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionCard}
      onPress={() => handleQuickAction(action)}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={action.icon as any} size={24} color="#b68a71" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionDescription}>{action.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderCategorySection = (categoryId: string, title: string, emoji: string) => {
    const actions = getActionsByCategory(categoryId);

    return (
      <View key={categoryId} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{emoji} {title}</Text>
        {actions.map(renderQuickActionCard)}
      </View>
    );
  };

  if (showChat) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#334155' }]} edges={['top']}>
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowChat(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <View style={styles.chatHeaderText}>
            <Text style={styles.chatHeaderTitle}>AI Fragrance Assistant</Text>
            {selectedAction && (
              <Text style={styles.chatHeaderSubtitle}>{selectedAction.title}</Text>
            )}
          </View>
        </View>

        <AIAssistantChat
          style={styles.chatContainer}
          initialMessage={selectedAction?.prompt}
          onFragranceRecommendation={handleFragranceRecommendation}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={28} color="#b68a71" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>AI Fragrance Assistant</Text>
          <Text style={styles.subtitle}>
            Your personal fragrance consultant powered by AI
          </Text>
        </View>
      </View>

      {!user && (
        <View style={styles.authPrompt}>
          <Ionicons name="lock-closed" size={24} color={colors.textSecondary} />
          <Text style={styles.authPromptText}>
            Sign in to get personalised fragrance recommendations
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Start Chat */}
        <View style={styles.quickStartSection}>
          <Text style={styles.quickStartTitle}>💬 Start a Conversation</Text>
          <TouchableOpacity
            style={styles.quickStartButton}
            onPress={() => setShowChat(true)}
          >
            <View style={styles.quickStartContent}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#b68a71" />
              <Text style={styles.quickStartText}>
                Hi! I'm your AI fragrance assistant. Ask me anything about fragrances, get personalised recommendations, or explore new scents together!
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        {renderCategorySection('discovery', 'Fragrance Discovery', '🔍')}
        {renderCategorySection('recommendation', 'Smart Recommendations', '🎯')}
        {renderCategorySection('education', 'Learn & Explore', '📚')}
        {renderCategorySection('comparison', 'Compare & Decide', '⚖️')}

        {/* AI Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>🧠 AI-Powered Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="analytics" size={16} color="#b68a71" />
              <Text style={styles.featureText}>Personalised recommendations based on your preferences</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="location" size={16} color="#b68a71" />
              <Text style={styles.featureText}>Australian market insights and pricing information</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="trending-up" size={16} color="#b68a71" />
              <Text style={styles.featureText}>Real-time fragrance trends and seasonal recommendations</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="school" size={16} color="#b68a71" />
              <Text style={styles.featureText}>Educational guidance about fragrance composition and notes</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="cash" size={16} color="#b68a71" />
              <Text style={styles.featureText}>Budget-conscious recommendations and alternatives</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  authPrompt: {
    backgroundColor: '#475569',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  authPromptText: {
    fontSize: 16,
    color: '#f8fafc',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  signInButton: {
    backgroundColor: '#b68a71',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  quickStartSection: {
    marginBottom: 24,
  },
  quickStartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  quickStartButton: {
    flexDirection: 'row',
    backgroundColor: '#475569',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#b68a71',
  },
  quickStartContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quickStartText: {
    flex: 1,
    fontSize: 16,
    color: '#f8fafc',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
  featuresSection: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
    backgroundColor: '#334155',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 250, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatHeaderText: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#334155',
  },
});