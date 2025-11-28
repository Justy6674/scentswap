import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// New Light Luxe color palette (from logo)
const COLORS = {
  // Primary brand colors
  teal: '#5BBFBA',
  tealDark: '#4A9E9A',
  tealLight: '#7DD3CE',
  coral: '#E8927C',
  coralDark: '#D4836D',
  coralLight: '#F0A894',
  
  // Backgrounds
  warmCream: '#FBF9F7',
  softIvory: '#F5F3F0',
  white: '#FFFFFF',
  heroLight: '#E8F6F5',
  heroLightEnd: '#D4EFED',
  
  // Text
  charcoal: '#2D3436',
  warmGray: '#636E72',
  lightGray: '#B2BEC3',
  
  // Utility
  border: '#E8E4E0',
};

// Spray particle component
const SprayParticle = ({ 
  delay, 
  index, 
  sizeScale = 1, 
  mirror = false 
}: { 
  delay: number; 
  index: number; 
  sizeScale?: number; 
  mirror?: boolean; 
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animate = () => {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 3000,
        delay: delay,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => animate());
    };
    animate();
  }, []);

  // Calculate trajectory - fan out from left side
  // Use deterministic pseudo-random values based on index to prevent hydration mismatch
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const angle = -30 + (index * 8); // Spread from -30 to +90 degrees
  const distance = 150 + pseudoRandom(index) * 200;
  const radians = (angle * Math.PI) / 180;
  
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(radians) * distance * (mirror ? -1 : 1)],
  });
  
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(radians) * distance],
  });
  
  const opacity = animValue.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.7, 0.3, 0],
  });
  
  const scale = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.3],
  });

  const isTeal = index % 3 !== 0; // 2/3 teal, 1/3 coral
  const size = (6 + pseudoRandom(index + 100) * 8) * sizeScale;

  return (
    <Animated.View
      style={[
        styles.sprayParticle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isTeal ? COLORS.teal : COLORS.coral,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
          [mirror ? 'right' : 'left']: 10, // Flip origin
        },
      ]}
    />
  );
};

// Main Spray effect component (Left)
const SprayEffect = () => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    delay: i * 150,
  }));

  return (
    <View style={styles.sprayContainer}>
      {/* Spray origin glow */}
      <View style={styles.sprayOrigin} />
      {/* Particles */}
      {particles.map((particle) => (
        <SprayParticle key={particle.id} delay={particle.delay} index={particle.id} />
      ))}
    </View>
  );
};

// Fine Mist Effect (Right - Smaller, more particles)
const FineMistEffect = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    delay: i * 120,
  }));

  return (
    <View style={[styles.mistContainer, isDesktop && { right: '10%', top: '10%' }]}>
      <View style={styles.sprayOrigin} />
      {particles.map((particle) => (
        <SprayParticle 
          key={particle.id} 
          delay={particle.delay} 
          index={particle.id} 
          sizeScale={0.5} // Smaller
          mirror={true}   // Fan Left
        />
      ))}
    </View>
  );
};

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  const handleGetStarted = () => {
    router.push('/(auth)/register');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  const handleExplore = () => {
    router.push('/(tabs)');
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLogo}>
            <Image 
              source={require('@/assets/images/favicon-nobg.png')} 
              style={styles.headerLogoImage}
              resizeMode="contain"
            />
            <Text style={styles.headerBrand}>ScentSwap</Text>
          </View>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => router.push('/faq')} style={styles.headerNavLink}>
              <Text style={styles.headerNavText}>FAQ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/register')} style={styles.headerNavLink}>
              <Text style={styles.headerNavText}>Pricing</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignIn} style={styles.headerNavLink}>
              <Text style={styles.headerNavText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGetStarted} style={styles.headerCta}>
              <Text style={styles.headerCtaText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Hero Section - Light Teal */}
      <View style={styles.heroSection}>
        {/* Background gradient effect */}
        <View style={styles.heroBackground}>
          <View style={styles.heroGradientCircle1} />
          <View style={styles.heroGradientCircle2} />
          <View style={styles.heroCoralAccent} />
        </View>
        
        {/* Spray Effect */}
        <SprayEffect />
        <FineMistEffect />

        <Animated.View 
          style={[
            styles.heroContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/logo-nobg.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          {/* Brand Name */}
          <Text style={styles.brandName}>ScentSwap</Text>

          {/* Tagline */}
          <Text style={styles.tagline}>TRADE SCENTS, NOT CASH</Text>
          
          {/* Hero headline */}
          <Text style={styles.heroTitle}>
            Australia's First{'\n'}
            <Text style={styles.heroTitleAccent}>AI-Powered</Text>{'\n'}
            Fragrance Exchange
          </Text>

          <Text style={styles.heroSubtitle}>
            Turn your shelf of regrets into your next signature scent.{'\n'}
            No money. No haggling. Just pure trade.
          </Text>

          {/* CTA Buttons */}
          <View style={[styles.ctaContainer, isDesktop && { flexDirection: 'row' }]}>
            <TouchableOpacity style={[styles.ctaPrimary, isDesktop && { width: 'auto' }]} onPress={handleGetStarted}>
              <Text style={styles.ctaPrimaryText}>START SWAPPING</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.ctaSecondary, isDesktop && { width: 'auto' }]} onPress={handleExplore}>
              <Text style={styles.ctaSecondaryText}>EXPLORE LISTINGS</Text>
            </TouchableOpacity>
          </View>

          {/* Sign in link */}
          <TouchableOpacity onPress={handleSignIn} style={styles.signInLink}>
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Scroll indicator */}
        <View style={styles.scrollIndicator}>
          <Ionicons name="chevron-down" size={24} color={COLORS.coral} />
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>THE PROCESS</Text>
        <Text style={styles.sectionTitle}>How ScentSwap Works</Text>
        
        <View style={[styles.stepsContainer, isDesktop && { flexDirection: 'row' }]}>
          {[
            {
              icon: 'camera-outline',
              title: 'List Your Bottles',
              description: 'Snap photos, add details. Our AI verifies authenticity markers.',
              accent: false,
            },
            {
              icon: 'search-outline',
              title: 'Discover & Match',
              description: 'Browse listings or let AI find your perfect swap partners.',
              accent: true,
            },
            {
              icon: 'swap-horizontal-outline',
              title: 'Propose a Swap',
              description: 'AI fairness engine ensures balanced trades. No haggling.',
              accent: false,
            },
            {
              icon: 'cube-outline',
              title: 'Ship & Enjoy',
              description: 'Pack securely, add tracking, receive your new scent.',
              accent: true,
            },
          ].map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={[styles.stepNumber, step.accent && styles.stepNumberCoral]}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={[styles.stepIconContainer, step.accent && styles.stepIconContainerCoral]}>
                <Ionicons name={step.icon as any} size={32} color={step.accent ? COLORS.coral : COLORS.teal} />
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Features Section - Soft Teal Background */}
      <View style={[styles.section, styles.sectionTeal]}>
        <Text style={[styles.sectionLabel, { color: COLORS.tealDark }]}>WHY SCENTSWAP</Text>
        <Text style={[styles.sectionTitle, { color: COLORS.charcoal }]}>
          Built for the Fragrance Community
        </Text>

        <View style={styles.featuresGrid}>
          {[
            {
              icon: 'shield-checkmark',
              title: 'AI Authenticity',
              description: 'Photo analysis flags fake markers before you trade.',
              accent: false,
            },
            {
              icon: 'scale',
              title: 'Fairness Engine',
              description: 'Real-time value scoring ensures balanced swaps.',
              accent: true,
            },
            {
              icon: 'chatbubbles',
              title: 'AI Mediator',
              description: '@ScentBot helps negotiate and answers questions.',
              accent: false,
            },
            {
              icon: 'star',
              title: 'Trust Tiers',
              description: 'Verified → Trusted → Elite. Build your reputation.',
              accent: true,
            },
            {
              icon: 'location',
              title: 'Australia First',
              description: 'Local community, accountable users, fast shipping.',
              accent: false,
            },
            {
              icon: 'cash-outline',
              title: 'Zero Money',
              description: 'Pure barter. No fees, no payment scams, no haggling.',
              accent: true,
            },
          ].map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIconBg, feature.accent && styles.featureIconBgCoral]}>
                <Ionicons name={feature.icon as any} size={24} color={feature.accent ? COLORS.coral : COLORS.teal} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <View style={[styles.statsContainer, isDesktop && { flexDirection: 'row', gap: 80 }]}>
          {[
            { value: '$850M+', label: 'AU Fragrance Market', accent: false },
            { value: '100%', label: 'Cashless Trading', accent: true },
            { value: 'AI', label: 'Powered Matching', accent: false },
          ].map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={[styles.statValue, stat.accent && styles.statValueCoral]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Testimonial/Quote Section */}
      <View style={[styles.section, styles.quoteSection]}>
        <View style={styles.quoteContainer}>
          <Ionicons name="chatbox-ellipses" size={40} color={COLORS.coral} style={{ opacity: 0.4 }} />
          <Text style={styles.quoteText}>
            "Finally, a platform that understands the fragrance community. 
            No more sketchy Facebook trades or eBay fees."
          </Text>
          <Text style={styles.quoteAuthor}>— The Vision</Text>
        </View>
      </View>

      {/* Final CTA Section */}
      <View style={[styles.section, styles.finalCtaSection]}>
        <Text style={styles.finalCtaTitle}>
          Ready to Transform Your Collection?
        </Text>
        <Text style={styles.finalCtaSubtitle}>
          Join Australia's most trusted fragrance trading community.
        </Text>
        
        <TouchableOpacity style={styles.finalCtaButton} onPress={handleGetStarted}>
          <Text style={styles.finalCtaButtonText}>CREATE FREE ACCOUNT</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.coral} />
        </TouchableOpacity>

        <Text style={styles.finalCtaNote}>
          Free forever • No credit card required • Start trading in minutes
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.footerContent, isDesktop && { flexDirection: 'row', alignItems: 'flex-start' }]}>
          <View style={[styles.footerLogo, isDesktop && { alignItems: 'flex-start' }]}>
            <Image 
              source={require('@/assets/images/logo-nobg.png')} 
              style={styles.footerLogoImage}
              resizeMode="contain"
            />
            <Text style={styles.footerTagline}>Trade scents, not cash</Text>
          </View>

          <View style={[styles.footerLinks, isDesktop && { flexDirection: 'row', gap: 32 }]}>
            <TouchableOpacity onPress={() => router.push('/faq')}>
              <Text style={styles.footerLink}>FAQ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/faq')}>
              <Text style={styles.footerLink}>How It Works</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/faq')}>
              <Text style={styles.footerLink}>Trust & Safety</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Contact</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerSocial}>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-instagram" size={20} color={COLORS.coral} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-facebook" size={20} color={COLORS.teal} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-tiktok" size={20} color={COLORS.coral} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.footerBottom, isDesktop && { flexDirection: 'row' }]}>
          <Text style={styles.footerCopyright}>
            © 2025 ScentSwap. Made in Australia 🇦🇺
          </Text>
          <View style={styles.footerLegal}>
            <TouchableOpacity>
              <Text style={styles.footerLegalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerLegalDivider}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLegalLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmCream,
  },
  contentContainer: {
    flexGrow: 1,
  },

  // Spray Effect
  sprayContainer: {
    position: 'absolute',
    left: 20, // Default mobile
    top: '35%',
    width: 300,
    height: 300,
    zIndex: 2,
  },
  mistContainer: {
    position: 'absolute',
    right: 20, // Default mobile
    top: '15%', // Higher up
    width: 200,
    height: 200,
    zIndex: 2,
    transform: [{ scaleX: -1 }], // Flip horizontally for right-side spray
  },
  sprayOrigin: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.teal,
    opacity: 0.3,
  },
  sprayParticle: {
    position: 'absolute',
    left: 10,
    top: '50%',
  },

  // Header
  header: {
    position: 'absolute', 
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 1400,
    width: '100%',
    marginHorizontal: 'auto',
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoImage: {
    width: 32,
    height: 32,
  },
  headerBrand: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.charcoal,
    letterSpacing: 1,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerNavLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  headerNavText: {
    fontSize: 14,
    color: COLORS.warmGray,
    fontWeight: '500',
  },
  headerCta: {
    backgroundColor: COLORS.teal,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  headerCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Hero Section
  heroSection: {
    minHeight: Platform.OS === 'web' ? '100vh' : height,
    backgroundColor: COLORS.heroLight,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 60,
    overflow: 'hidden',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  heroGradientCircle1: {
    position: 'absolute',
    width: 800,
    height: 800,
    borderRadius: 400,
    backgroundColor: COLORS.heroLightEnd,
    top: -200,
    right: -200,
    opacity: 0.6,
  },
  heroGradientCircle2: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: COLORS.white,
    bottom: -100,
    left: -100,
    opacity: 0.4,
  },
  heroCoralAccent: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.coral,
    bottom: '20%',
    right: '5%',
    opacity: 0.08,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 800,
    width: '100%',
    zIndex: 3,
  },
  logoContainer: {
    marginBottom: 16,
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logo: {
    width: 70,
    height: 70,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 6,
    color: COLORS.charcoal,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 4,
    color: COLORS.teal,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '300',
    color: COLORS.charcoal,
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 24,
  },
  heroTitleAccent: {
    color: COLORS.teal,
    fontWeight: '600',
  },
  heroSubtitle: {
    fontSize: 18,
    color: COLORS.warmGray,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    maxWidth: 500,
  },
  ctaContainer: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    gap: 8,
    width: '100%',
    minWidth: 200,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.white,
  },
  ctaSecondary: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.coral,
    backgroundColor: 'transparent',
    width: '100%',
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.coral,
  },
  signInLink: {
    paddingVertical: 12,
  },
  signInText: {
    fontSize: 14,
    color: COLORS.warmGray,
  },
  signInTextBold: {
    color: COLORS.coral,
    fontWeight: '600',
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },

  // Sections
  section: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: COLORS.warmCream,
  },
  sectionTeal: {
    backgroundColor: COLORS.heroLight,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    color: COLORS.teal,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 48,
  },

  // Steps
  stepsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    maxWidth: 1200,
    width: '100%',
  },
  stepCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: -12,
    left: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberCoral: {
    backgroundColor: COLORS.coral,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.heroLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIconContainerCoral: {
    backgroundColor: '#FDF0EC',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.warmGray,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1000,
    width: '100%',
  },
  featureCard: {
    width: '100%',
    maxWidth: 300,
    padding: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  featureIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.heroLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIconBgCoral: {
    backgroundColor: '#FDF0EC',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.warmGray,
    lineHeight: 22,
  },

  // Stats
  statsContainer: {
    flexDirection: 'column',
    gap: 40,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 40,
    fontWeight: '300',
    color: COLORS.teal,
    marginBottom: 8,
  },
  statValueCoral: {
    color: COLORS.coral,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.warmGray,
    textTransform: 'uppercase',
  },

  // Quote
  quoteSection: {
    backgroundColor: COLORS.softIvory,
  },
  quoteContainer: {
    maxWidth: 600,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 20,
    fontStyle: 'italic',
    color: COLORS.charcoal,
    textAlign: 'center',
    lineHeight: 32,
    marginTop: 16,
    marginBottom: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.coral,
    letterSpacing: 1,
  },

  // Final CTA
  finalCtaSection: {
    backgroundColor: COLORS.teal,
    paddingVertical: 100,
  },
  finalCtaTitle: {
    fontSize: 40,
    fontWeight: '300',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  finalCtaSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  finalCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 8,
    gap: 10,
    marginBottom: 24,
  },
  finalCtaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.teal,
  },
  finalCtaNote: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },

  // Footer
  footer: {
    backgroundColor: COLORS.charcoal,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  footerContent: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 40,
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    marginBottom: 40,
  },
  footerLogo: {
    alignItems: 'center',
  },
  footerLogoImage: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  footerTagline: {
    fontSize: 14,
    color: COLORS.lightGray,
  },
  footerLinks: {
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.lightGray,
  },
  footerSocial: {
    flexDirection: 'row',
    gap: 16,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 24,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
  },
  footerCopyright: {
    fontSize: 13,
    color: COLORS.lightGray,
  },
  footerLegal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLegalLink: {
    fontSize: 13,
    color: COLORS.lightGray,
  },
  footerLegalDivider: {
    color: COLORS.lightGray,
  },
});
