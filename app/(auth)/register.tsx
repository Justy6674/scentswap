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
import { GlobalHeader } from '@/components/GlobalHeader';
import { GlobalFooter } from '@/components/GlobalFooter';

const windowDimensions = Dimensions.get('window');
const { width: initialWidth } = windowDimensions;

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

// Deterministic pseudo-random for SSR compatibility
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Spray particle component for cards
const CardSprayParticle = ({ 
  delay, 
  index, 
  color,
  intensity = 1, // 1 = normal, higher = more dramatic
}: { 
  delay: number; 
  index: number; 
  color: string;
  intensity?: number;
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animate = () => {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 2500 + pseudoRandom(index) * 1000,
        delay: delay,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => animate());
    };
    animate();
  }, []);

  // Fan out from top-right corner, spreading left and down
  const angle = -45 + (index * 15) + pseudoRandom(index + 50) * 20;
  const distance = (60 + pseudoRandom(index) * 80) * intensity;
  const radians = (angle * Math.PI) / 180;
  
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(radians) * distance * -1], // Negative = go left
  });
  
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(radians) * distance],
  });
  
  const opacity = animValue.interpolate({
    inputRange: [0, 0.15, 0.6, 1],
    outputRange: [0, 0.8, 0.4, 0], // More visible
  });
  
  const scale = animValue.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.5, 1.2, 0.3],
  });

  // Larger, more visible particles
  const size = 6 + pseudoRandom(index + 100) * 8;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        right: 10,
        top: 10,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
};

// Card Spray Component - escalating intensity per tier
const CardSpray = ({ count, color }: { count: number; color: string }) => {
  // Intensity scales with count: 5->1x, 15->1.5x, 30->2x
  const intensity = count <= 5 ? 1 : count <= 15 ? 1.3 : 1.6;
  
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: i * 100, // Faster stagger for more particles
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'visible' }]} pointerEvents="none">
      {particles.map((p) => (
        <CardSprayParticle 
          key={p.id} 
          delay={p.delay} 
          index={p.id} 
          color={color}
          intensity={intensity}
        />
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
    buttonText: 'Get Free',
    buttonFilled: true,
    sprayCount: 5,
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
    sprayCount: 15,
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
    buttonText: 'Get Elite',
    buttonFilled: true,
    sprayCount: 30,
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
            borderColor: plan.color,
            borderWidth: isSelected ? 3 : 1,
            ...(Platform.OS === 'web' ? {
              boxShadow: isSelected 
                ? `0 8px 32px ${plan.color}40, 0 4px 16px rgba(0,0,0,0.08)`
                : `0 4px 16px ${plan.color}10`,
            } : {
              shadowColor: plan.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isSelected ? 0.4 : 0.1,
              shadowRadius: isSelected ? 16 : 8,
              elevation: isSelected ? 8 : 4,
            }),
          },
        ]}
      >
        {/* Internal Spray Effect */}
        <CardSpray count={plan.sprayCount} color={plan.color} />

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

        {/* Button - ALWAYS FILLED */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: plan.color, borderColor: plan.color, borderWidth: 0 },
          ]}
          onPress={onSignUp}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.buttonText,
            { color: '#FFF' }
          ]}>
            {plan.buttonText}
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={18} 
            color="#FFF" 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const { isAuthenticated, isLoading: authLoading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  
  // Use state to track mounting for hydration safe rendering
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={{ width: 40, height: 40 }} />
      </View>
    );
  }

  /**
   * Handle sign up - uses Outseta's JavaScript API with Popup Mode
   * 
   * This provides the "No Code" popup experience without React hydration issues.
   * Configuration matches TeleCheck's data attributes:
   * - widgetMode: 'register'
   * - mode: 'popup' 
   * - planUid: plan.uid
   * - skipPlanOptions: true
   */
  const handleSignUp = (planId: string) => {
    const plan = PLANS.find(p => p.id === planId) || PLANS[0];
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const Outseta = (window as any).Outseta;
      
      if (Outseta && Outseta.auth && Outseta.auth.open) {
        // Use Outseta's JavaScript API with Popup Mode
        Outseta.auth.open({
          widgetMode: 'register',
          mode: 'popup',
          planUid: plan.uid,
          skipPlanOptions: true,
        });
      } else {
        // Fallback if Outseta not loaded yet
        console.warn('Outseta not ready, using URL redirect');
        const signUpUrl = `https://scentswap.outseta.com/auth?widgetMode=register&planUid=${plan.uid}#o-anonymous`;
        window.location.href = signUpUrl;
      }
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
      
      {/* Background Spray Effects - using CardSpray with brand colors */}
      <View style={styles.sprayTopLeft}>
        <CardSpray count={12} color={COLORS.teal} />
      </View>
      <View style={styles.sprayBottomRight}>
        <CardSpray count={15} color={COLORS.coral} />
      </View>

      {/* Global Header */}
      <GlobalHeader />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Header */}
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
          
          {/* Global Footer */}
          <GlobalFooter />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
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
