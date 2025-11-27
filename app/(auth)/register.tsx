/**
 * Register Screen - Premium Pricing Page
 * 
 * Dark theme with unique color glows for each tier:
 * - Free: Teal (#5BBFBA)
 * - Premium: Coral (#E8927C) - MOST POPULAR, filled button
 * - Elite: Purple (#9B7DFF)
 * 
 * Outseta Plan UIDs:
 * - Free: z9MP7yQ4
 * - Premium: vW5RoJm4  
 * - Elite: aWxr2rQV
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Linking,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/contexts/SubscriptionContext';

const { width } = Dimensions.get('window');

// Colors
const COLORS = {
  background: '#0F0F0F',
  cardBg: '#1A1A1A',
  cardBgHover: '#222222',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  // Tier colors
  teal: '#5BBFBA',
  tealGlow: 'rgba(91, 191, 186, 0.35)',
  coral: '#E8927C',
  coralGlow: 'rgba(232, 146, 124, 0.4)',
  purple: '#9B7DFF',
  purpleGlow: 'rgba(155, 125, 255, 0.35)',
};

// Outseta Plan UIDs
const PLAN_UIDS = {
  FREE: 'z9MP7yQ4',
  PREMIUM: 'vW5RoJm4',
  ELITE: 'aWxr2rQV',
};

// Plan definitions
const PLANS = [
  {
    id: 'free',
    uid: PLAN_UIDS.FREE,
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    color: COLORS.teal,
    glow: COLORS.tealGlow,
    icon: 'leaf-outline',
    features: [
      '5 active listings',
      'Basic swap matching',
      'Community access',
      'Standard support',
    ],
    buttonText: 'Get Started Free',
    buttonFilled: false,
  },
  {
    id: 'premium',
    uid: PLAN_UIDS.PREMIUM,
    name: 'Premium',
    price: 9.99,
    description: 'For serious collectors',
    color: COLORS.coral,
    glow: COLORS.coralGlow,
    icon: 'flame-outline',
    popular: true,
    features: [
      '25 active listings',
      'Priority matching',
      'Photo verification',
      'No advertisements',
      'Premium badge',
    ],
    buttonText: 'Get Premium',
    buttonFilled: true,
  },
  {
    id: 'elite',
    uid: PLAN_UIDS.ELITE,
    name: 'Elite',
    price: 19.99,
    description: 'Ultimate collector experience',
    color: COLORS.purple,
    glow: COLORS.purpleGlow,
    icon: 'diamond-outline',
    features: [
      'Unlimited listings',
      'All Premium features',
      'Advanced analytics',
      'Early feature access',
      'Bulk upload tools',
    ],
    buttonText: 'Go Elite',
    buttonFilled: false,
  },
];

// Animated Plan Card Component
function PlanCard({ 
  plan, 
  isSelected, 
  onSelect, 
  onSignUp 
}: { 
  plan: typeof PLANS[0]; 
  isSelected: boolean; 
  onSelect: () => void;
  onSignUp: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Pulse animation for popular card
    if (plan.popular) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [plan.popular]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const glowIntensity = plan.popular 
    ? glowAnim.interpolate({
        inputRange: [0.5, 1],
        outputRange: [plan.glow, plan.glow.replace('0.4', '0.6')],
      })
    : plan.glow;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onSelect}
        style={[
          styles.card,
          {
            borderColor: isSelected ? plan.color : 'rgba(255,255,255,0.1)',
            ...(Platform.OS === 'web' ? {
              boxShadow: isSelected 
                ? `0 0 30px ${plan.glow}, 0 0 60px ${plan.glow.replace('0.35', '0.15')}`
                : `0 4px 20px rgba(0,0,0,0.3)`,
            } : {
              shadowColor: plan.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isSelected ? 0.5 : 0.1,
              shadowRadius: isSelected ? 20 : 10,
              elevation: isSelected ? 10 : 5,
            }),
          },
        ]}
      >
        {/* Popular Badge */}
        {plan.popular && (
          <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
            <Ionicons name="star" size={12} color="#FFF" />
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: plan.color + '20' }]}>
            <Ionicons name={plan.icon as any} size={24} color={plan.color} />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{plan.name}</Text>
            <Text style={styles.cardDescription}>{plan.description}</Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: plan.color }]}>
            {plan.price === 0 ? 'Free' : `$${plan.price}`}
          </Text>
          {plan.price > 0 && (
            <Text style={styles.priceLabel}>/month AUD</Text>
          )}
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={[styles.checkIcon, { backgroundColor: plan.color + '20' }]}>
                <Ionicons name="checkmark" size={14} color={plan.color} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.button,
            plan.buttonFilled 
              ? { backgroundColor: plan.color }
              : { backgroundColor: 'transparent', borderWidth: 2, borderColor: plan.color },
          ]}
          onPress={onSignUp}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.buttonText,
            { color: plan.buttonFilled ? '#FFF' : plan.color }
          ]}>
            {plan.buttonText}
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={18} 
            color={plan.buttonFilled ? '#FFF' : plan.color} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const { isAuthenticated } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState('premium'); // Default to premium

  // If already authenticated, redirect to tabs
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleSignUp = (planId: string) => {
    const plan = PLANS.find(p => p.id === planId) || PLANS[0];
    const signUpUrl = `https://scentswap.outseta.com/auth?widgetMode=register&planUid=${plan.uid}#o-anonymous`;
    
    if (Platform.OS === 'web') {
      window.location.href = signUpUrl;
    } else {
      Linking.openURL(signUpUrl);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Plan</Text>
            <Text style={styles.subtitle}>
              Start swapping fragrances with collectors across Australia
            </Text>
          </View>

          {/* Plan Cards */}
          <View style={styles.cardsContainer}>
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                onSelect={() => setSelectedPlan(plan.id)}
                onSignUp={() => handleSignUp(plan.id)}
              />
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 80 : 70,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 20,
    marginBottom: 32,
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    position: 'relative',
    overflow: 'visible',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 24,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.teal,
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signInText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signInLink: {
    fontSize: 14,
    color: COLORS.teal,
    fontWeight: '600',
  },
});
