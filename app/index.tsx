import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Luxury color palette
const COLORS = {
  gold: '#D4AF37',
  goldLight: '#E8C547',
  black: '#050505',
  offBlack: '#0A0A0A',
  charcoal: '#1A1A1A',
  white: '#FFFFFF',
  offWhite: '#F5F5F5',
  gray: '#888888',
  grayLight: '#CCCCCC',
};

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // If user is logged in, redirect to main app
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
            <TouchableOpacity onPress={handleSignIn} style={styles.headerNavLink}>
              <Text style={styles.headerNavText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGetStarted} style={styles.headerCta}>
              <Text style={styles.headerCtaText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroBackground}>
          {/* Gradient overlay */}
          <View style={styles.heroGradient} />
          
          {/* Decorative gradient circles */}
          <View style={styles.heroPattern}>
            <View style={[styles.gradientCircle, styles.circleTopLeft]} />
            <View style={[styles.gradientCircle, styles.circleBottomRight]} />
            <View style={[styles.gradientCircle, styles.circleCenter]} />
          </View>
        </View>

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
          <View style={styles.ctaContainer}>
            <TouchableOpacity style={styles.ctaPrimary} onPress={handleGetStarted}>
              <Text style={styles.ctaPrimaryText}>START SWAPPING</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.black} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.ctaSecondary} onPress={handleExplore}>
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
          <Ionicons name="chevron-down" size={24} color={COLORS.gold} />
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>THE PROCESS</Text>
        <Text style={styles.sectionTitle}>How ScentSwap Works</Text>
        
        <View style={styles.stepsContainer}>
          {[
            {
              icon: 'camera-outline',
              title: 'List Your Bottles',
              description: 'Snap photos, add details. Our AI verifies authenticity markers.',
            },
            {
              icon: 'search-outline',
              title: 'Discover & Match',
              description: 'Browse listings or let AI find your perfect swap partners.',
            },
            {
              icon: 'swap-horizontal-outline',
              title: 'Propose a Swap',
              description: 'AI fairness engine ensures balanced trades. No haggling.',
            },
            {
              icon: 'cube-outline',
              title: 'Ship & Enjoy',
              description: 'Pack securely, add tracking, receive your new scent.',
            },
          ].map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepIconContainer}>
                <Ionicons name={step.icon as any} size={32} color={COLORS.gold} />
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Features Section */}
      <View style={[styles.section, styles.sectionDark]}>
        <Text style={[styles.sectionLabel, { color: COLORS.gold }]}>WHY SCENTSWAP</Text>
        <Text style={[styles.sectionTitle, { color: COLORS.white }]}>
          Built for the Fragrance Community
        </Text>

        <View style={styles.featuresGrid}>
          {[
            {
              icon: 'shield-checkmark',
              title: 'AI Authenticity',
              description: 'Photo analysis flags fake markers before you trade.',
            },
            {
              icon: 'scale',
              title: 'Fairness Engine',
              description: 'Real-time value scoring ensures balanced swaps.',
            },
            {
              icon: 'chatbubbles',
              title: 'AI Mediator',
              description: '@ScentBot helps negotiate and answers questions.',
            },
            {
              icon: 'star',
              title: 'Trust Tiers',
              description: 'Verified → Trusted → Elite. Build your reputation.',
            },
            {
              icon: 'location',
              title: 'Australia First',
              description: 'Local community, accountable users, fast shipping.',
            },
            {
              icon: 'cash-outline',
              title: 'Zero Money',
              description: 'Pure barter. No fees, no payment scams, no haggling.',
            },
          ].map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconBg}>
                <Ionicons name={feature.icon as any} size={24} color={COLORS.gold} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <View style={styles.statsContainer}>
          {[
            { value: '$850M+', label: 'AU Fragrance Market' },
            { value: '100%', label: 'Cashless Trading' },
            { value: 'AI', label: 'Powered Matching' },
          ].map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Testimonial/Quote Section */}
      <View style={[styles.section, styles.quoteSection]}>
        <View style={styles.quoteContainer}>
          <Ionicons name="chatbox-ellipses" size={40} color={COLORS.gold} style={{ opacity: 0.3 }} />
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
          <Ionicons name="arrow-forward" size={20} color={COLORS.black} />
        </TouchableOpacity>

        <Text style={styles.finalCtaNote}>
          Free forever • No credit card required • Start trading in minutes
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerLogo}>
            <Image 
              source={require('@/assets/images/logo-nobg.png')} 
              style={styles.footerLogoImage}
              resizeMode="contain"
            />
            <Text style={styles.footerTagline}>Trade scents, not cash</Text>
          </View>

          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>How It Works</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Trust & Safety</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Contact</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerSocial}>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-instagram" size={20} color={COLORS.gray} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-facebook" size={20} color={COLORS.gray} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-tiktok" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerBottom}>
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
    backgroundColor: COLORS.offWhite,
  },
  contentContainer: {
    flexGrow: 1,
  },

  // Header
  header: {
    position: isWeb ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(5, 5, 5, 0.9)',
    backdropFilter: 'blur(10px)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
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
    color: COLORS.white,
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
    color: COLORS.grayLight,
    fontWeight: '500',
  },
  headerCta: {
    backgroundColor: COLORS.gold,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  headerCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },

  // Hero Section
  heroSection: {
    minHeight: height,
    backgroundColor: COLORS.black,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 60,
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.black,
  },
  heroPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: COLORS.gold,
  },
  circleTopLeft: {
    width: 600,
    height: 600,
    top: -300,
    left: -300,
    opacity: 0.03,
  },
  circleBottomRight: {
    width: 500,
    height: 500,
    bottom: -200,
    right: -200,
    opacity: 0.04,
  },
  circleCenter: {
    width: 300,
    height: 300,
    top: '40%',
    right: '10%',
    opacity: 0.02,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 800,
    width: '100%',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 16,
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 6,
    color: COLORS.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 4,
    color: COLORS.gold,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: isWeb ? 56 : 36,
    fontWeight: '300',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: isWeb ? 68 : 44,
    marginBottom: 24,
  },
  heroTitleAccent: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  heroSubtitle: {
    fontSize: 18,
    color: COLORS.grayLight,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    maxWidth: 500,
  },
  ctaContainer: {
    flexDirection: isWeb ? 'row' : 'column',
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
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 4,
    gap: 8,
    width: isWeb ? 'auto' : '100%',
    minWidth: 200,
  },
  ctaPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.black,
  },
  ctaSecondary: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.gray,
    width: isWeb ? 'auto' : '100%',
    minWidth: 200,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.white,
  },
  signInLink: {
    paddingVertical: 12,
  },
  signInText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  signInTextBold: {
    color: COLORS.gold,
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
  },
  sectionDark: {
    backgroundColor: COLORS.charcoal,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    color: COLORS.gold,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: isWeb ? 40 : 28,
    fontWeight: '300',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 48,
  },

  // Steps
  stepsContainer: {
    flexDirection: isWeb ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1200,
    width: '100%',
  },
  stepCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    width: isWeb ? 260 : '100%',
    maxWidth: 300,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: -12,
    left: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.gray,
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
    width: isWeb ? 280 : '100%',
    maxWidth: 300,
    padding: 24,
  },
  featureIconBg: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.grayLight,
    lineHeight: 22,
  },

  // Stats
  statsContainer: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: isWeb ? 80 : 40,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: isWeb ? 56 : 40,
    fontWeight: '300',
    color: COLORS.gold,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.gray,
    textTransform: 'uppercase',
  },

  // Quote
  quoteSection: {
    backgroundColor: COLORS.offWhite,
  },
  quoteContainer: {
    maxWidth: 600,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: isWeb ? 24 : 20,
    fontStyle: 'italic',
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: isWeb ? 36 : 32,
    marginTop: 16,
    marginBottom: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gold,
    letterSpacing: 1,
  },

  // Final CTA
  finalCtaSection: {
    backgroundColor: COLORS.black,
    paddingVertical: 100,
  },
  finalCtaTitle: {
    fontSize: isWeb ? 40 : 28,
    fontWeight: '300',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  finalCtaSubtitle: {
    fontSize: 18,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginBottom: 40,
  },
  finalCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 4,
    gap: 10,
    marginBottom: 24,
  },
  finalCtaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.black,
  },
  finalCtaNote: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
  },

  // Footer
  footer: {
    backgroundColor: COLORS.offBlack,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  footerContent: {
    flexDirection: isWeb ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isWeb ? 'flex-start' : 'center',
    gap: 40,
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    marginBottom: 40,
  },
  footerLogo: {
    alignItems: isWeb ? 'flex-start' : 'center',
  },
  footerLogoImage: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  footerTagline: {
    fontSize: 14,
    color: COLORS.gray,
  },
  footerLinks: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: isWeb ? 32 : 16,
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.grayLight,
  },
  footerSocial: {
    flexDirection: 'row',
    gap: 16,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: COLORS.charcoal,
    paddingTop: 24,
    flexDirection: isWeb ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
  },
  footerCopyright: {
    fontSize: 13,
    color: COLORS.gray,
  },
  footerLegal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLegalLink: {
    fontSize: 13,
    color: COLORS.gray,
  },
  footerLegalDivider: {
    color: COLORS.gray,
  },
});

