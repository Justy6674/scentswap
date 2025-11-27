/**
 * Register Screen
 * 
 * Shows plan options and redirects to Outseta's hosted registration page.
 * Outseta handles everything - we just redirect with the selected plan.
 * 
 * Outseta Sign Up URL: https://scentswap.outseta.com/auth?widgetMode=register&planUid=[PLAN_UID]#o-anonymous
 * 
 * Plan UIDs:
 * - Free: z9MP7yQ4
 * - Premium: vW5RoJm4  
 * - Elite: aWxr2rQV
 * 
 * @see .cursor/rules/outseta.mdc
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/Button';

// Outseta Plan UIDs
const PLAN_UIDS = {
  FREE: 'z9MP7yQ4',
  PREMIUM: 'vW5RoJm4',
  ELITE: 'aWxr2rQV',
};

// Plan definitions for display
const PLANS = [
  {
    id: 'free',
    uid: PLAN_UIDS.FREE,
    name: 'Free',
    price: 0,
    description: 'Get started with basic swapping',
    maxListings: 5,
    features: ['5 listings', 'Basic matching', 'Community access'],
  },
  {
    id: 'premium',
    uid: PLAN_UIDS.PREMIUM,
    name: 'Premium',
    price: 9.99,
    description: 'Enhanced swapping experience',
    maxListings: 25,
    features: ['25 listings', 'Priority matching', 'Photo verification', 'No ads', 'Premium badge'],
    popular: true,
  },
  {
    id: 'elite',
    uid: PLAN_UIDS.ELITE,
    name: 'Elite',
    price: 19.99,
    description: 'The ultimate collector experience',
    maxListings: -1,
    features: ['Unlimited listings', 'All Premium features', 'Advanced analytics', 'Early access', 'Bulk upload'],
  },
];

export default function RegisterScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState('free');

  // If already authenticated, redirect to tabs
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  /**
   * Redirect to Outseta's hosted registration page with selected plan
   * This is the NO-CODE approach - Outseta handles everything
   */
  const handleSignUp = (planId: string) => {
    const plan = PLANS.find(p => p.id === planId) || PLANS[0];
    const signUpUrl = `https://scentswap.outseta.com/auth?widgetMode=register&planUid=${plan.uid}#o-anonymous`;
    
    if (Platform.OS === 'web') {
      window.location.href = signUpUrl;
    } else {
      Linking.openURL(signUpUrl);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 24,
    },
    logoContainer: {
      width: 100,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
    plansContainer: {
      gap: 16,
      marginBottom: 24,
    },
    planCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    planCardSelected: {
      borderColor: colors.primary,
    },
    planCardPopular: {
      borderColor: '#E8927C',
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    planName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    planPrice: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    planPriceLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    planDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    planFeatures: {
      gap: 8,
    },
    planFeature: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    planFeatureText: {
      fontSize: 14,
      color: colors.text,
    },
    popularBadge: {
      position: 'absolute',
      top: -10,
      right: 16,
      backgroundColor: '#E8927C',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    popularBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    selectButton: {
      marginTop: 16,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 32,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
    backButton: {
      position: 'absolute',
      top: 16,
      left: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    termsText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 18,
    },
    termsLink: {
      color: colors.primary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo-nobg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Join ScentSwap</Text>
          <Text style={styles.subtitle}>
            Choose a plan and start swapping fragrances today
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                  plan.popular && styles.planCardPopular,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.7}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.planPrice}>
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </Text>
                    {plan.price > 0 && (
                      <Text style={styles.planPriceLabel}>/month AUD</Text>
                    )}
                  </View>
                </View>

                <Text style={styles.planDescription}>{plan.description}</Text>

                <View style={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.planFeature}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      <Text style={styles.planFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.selectButton}>
                  <Button
                    title={isSelected ? 'Continue with ' + plan.name : `Select ${plan.name}`}
                    onPress={() => handleSignUp(plan.id)}
                    variant={isSelected ? 'primary' : 'outline'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.termsText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
