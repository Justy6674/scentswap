/**
 * Register Screen - Premium Pricing Page
 * 
 * Matches landing page aesthetic with warm cream background and spray effects
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/contexts/SubscriptionContext';

const { width, height } = Dimensions.get('window');

// Colors matching landing page
const COLORS = {
  // Primary brand colors
  teal: '#5BBFBA',
  tealDark: '#4A9E9A',
  tealLight: '#7DD3CE',
  coral: '#E8927C',
  coralDark: '#D4836D',
  coralLight: '#F0A894',
  purple: '#9B7DFF',
  purpleLight: '#B8A4FF',
  
  // Backgrounds - slightly darker than landing page
  background: '#F0EDE9',       // Slightly darker warm cream
  cardBg: '#FFFFFF',
  heroGradientStart: '#E0F0EF', // Soft teal tint
  heroGradientEnd: '#F5F0EC',   // Warm cream
  
  // Text
  charcoal: '#2D3436',
  warmGray: '#636E72',
  lightGray: '#B2BEC3',
  
  // Utility
  border: '#E0DCD8',
};

// Spray particle component (matching landing page)
const SprayParticle = ({ delay, index }: { delay: number; index: number }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animate = () => {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 4000,
        delay: delay,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, []);

  // Calculate trajectory - fan out from top-left
  const angle = -20 + (index * 12);
  const distance = 100 + Math.random() * 150;
  const radians = (angle * Math.PI) / 180;
  
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(radians) * distance],
  });
  
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(radians) * distance],
  });
  
  const opacity = animValue.interpolate({
    inputRange: [0, 0.2, 0.7, 1],
    outputRange: [0, 0.5, 0.2, 0],
  });
  
  const scale = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.2],
  });

  const isTeal = index % 3 !== 0;
  const size = 4 + Math.random() * 6;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isTeal ? COLORS.teal : COLORS.coral,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
};

// Spray effect container
const SprayEffect = () => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 200,
  }));

  return (
    <View style={styles.sprayContainer}>
      {particles.map((particle) => (
        <SprayParticle key={particle.id} delay={particle.delay} index={particle.id} />
      ))}
    </View>
  );
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
    colorLight: COLORS.tealLight,
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
    colorLight: COLORS.coralLight,
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
    colorLight: COLORS.purpleLight,
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

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onSelect}
        style={[
          styles.card,
          {
            borderColor: isSelected ? plan.color : COLORS.border,
            borderWidth: isSelected ? 2 : 1,
            ...(Platform.OS === 'web' ? {
              boxShadow: isSelected 
                ? `0 8px 32px ${plan.color}30, 0 4px 16px rgba(0,0,0,0.08)`
                : `0 4px 16px rgba(0,0,0,0.06)`,
            } : {
              shadowColor: isSelected ? plan.color : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isSelected ? 0.25 : 0.08,
              shadowRadius: isSelected ? 16 : 8,
              elevation: isSelected ? 8 : 4,
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
          <View style={[styles.iconContainer, { backgroundColor: plan.color + '15' }]}>
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
              <View style={[styles.checkIcon, { backgroundColor: plan.color + '15' }]}>
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
  const [selectedPlan, setSelectedPlan] = useState('premium');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  /**
   * Handle sign up - uses Outseta's popup widget like TeleCheck
   * 
   * The key is using data attributes that Outseta's script picks up:
   * - data-o-auth="1" - triggers Outseta auth widget
   * - data-widget-mode="register" - opens in register mode
   * - data-plan-uid="xxx" - pre-selects the plan
   * - data-mode="popup" - opens as popup, user stays on page
   * 
   * When popup closes, Outseta:
   * 1. Stores token in localStorage (tokenStorage: "local")
   * 2. Fires 'accessToken.set' event
   * 3. SubscriptionContext picks it up and sets user as logged in
   */
  const handleSignUp = (planId: string) => {
    const plan = PLANS.find(p => p.id === planId) || PLANS[0];
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Create a temporary link element with Outseta data attributes
      // This triggers Outseta's no-code widget in popup mode
      const link = document.createElement('a');
      link.setAttribute('data-o-auth', '1');
      link.setAttribute('data-widget-mode', 'register');
      link.setAttribute('data-plan-uid', plan.uid);
      link.setAttribute('data-skip-plan-options', 'true');
      link.setAttribute('data-mode', 'popup');
      link.href = '#';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Mobile fallback - open in browser
      const signUpUrl = `https://scentswap.outseta.com/auth?widgetMode=register&planUid=${plan.uid}#o-anonymous`;
      Linking.openURL(signUpUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[COLORS.heroGradientStart, COLORS.heroGradientEnd, COLORS.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Spray Effects */}
      <View style={styles.sprayTopLeft}>
        <SprayEffect />
      </View>
      <View style={styles.sprayBottomRight}>
        <SprayEffect />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.charcoal} />
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
  sprayContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  sprayTopLeft: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 0,
  },
  sprayBottomRight: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 0,
    transform: [{ rotate: '180deg' }],
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
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
    color: COLORS.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.warmGray,
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
    color: COLORS.charcoal,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.warmGray,
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
    color: COLORS.lightGray,
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
    color: COLORS.charcoal,
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
    color: COLORS.lightGray,
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
    color: COLORS.warmGray,
  },
  signInLink: {
    fontSize: 14,
    color: COLORS.teal,
    fontWeight: '600',
  },
});
