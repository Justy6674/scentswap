/**
 * Register Screen
 * 
 * Redirects to Outseta hosted registration page with plan selection.
 * Uses only Outseta-approved methods per documentation.
 * 
 * @see docs/OUTSETA_INTEGRATION.md
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
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { 
  useSubscription, 
  OUTSETA_CONFIG, 
  SUBSCRIPTION_PLANS,
  SubscriptionTier 
} from '@/contexts/SubscriptionContext';
import { Button } from '@/components/Button';

export default function RegisterScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated, isLoading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('free');

  // If already authenticated, redirect to tabs
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  /**
   * Handle sign up - redirect to Outseta hosted registration page
   * This is the Outseta-approved method per their documentation
   * 
   * URL format: https://[subdomain].outseta.com/auth?widgetMode=register&planUid=[planUid]#o-anonymous
   */
  const handleSignUp = (planTier: SubscriptionTier = selectedPlan) => {
    const plan = SUBSCRIPTION_PLANS[planTier];
    
    // Build Outseta registration URL with selected plan
    const signUpUrl = `https://${OUTSETA_CONFIG.domain}/auth?widgetMode=register&planUid=${plan.outsetaPlanUid}#o-anonymous`;
    
    if (Platform.OS === 'web') {
      window.location.href = signUpUrl;
    } else {
      // Mobile - open in system browser
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
    planCardPremium: {
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const plans: { tier: SubscriptionTier; popular?: boolean }[] = [
    { tier: 'free' },
    { tier: 'premium', popular: true },
    { tier: 'elite' },
  ];

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
          {plans.map(({ tier, popular }) => {
            const plan = SUBSCRIPTION_PLANS[tier];
            const isSelected = selectedPlan === tier;
            
            return (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                  popular && styles.planCardPremium,
                ]}
                onPress={() => setSelectedPlan(tier)}
                activeOpacity={0.7}
              >
                {popular && (
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
                  <View style={styles.planFeature}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={18} 
                      color={colors.primary} 
                    />
                    <Text style={styles.planFeatureText}>
                      {plan.maxListings === -1 ? 'Unlimited' : plan.maxListings} listings
                    </Text>
                  </View>
                  
                  {tier === 'premium' && (
                    <>
                      <View style={styles.planFeature}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        <Text style={styles.planFeatureText}>Priority matching</Text>
                      </View>
                      <View style={styles.planFeature}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        <Text style={styles.planFeatureText}>Photo verification</Text>
                      </View>
                      <View style={styles.planFeature}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        <Text style={styles.planFeatureText}>No ads</Text>
                      </View>
                    </>
                  )}
                  
                  {tier === 'elite' && (
                    <>
                      <View style={styles.planFeature}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        <Text style={styles.planFeatureText}>All Premium features</Text>
                      </View>
                      <View style={styles.planFeature}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        <Text style={styles.planFeatureText}>Advanced analytics</Text>
                      </View>
                      <View style={styles.planFeature}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        <Text style={styles.planFeatureText}>Early access to features</Text>
                      </View>
                      <View style={styles.planFeature}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        <Text style={styles.planFeatureText}>Bulk upload</Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.selectButton}>
                  <Button
                    title={isSelected ? 'Selected - Continue' : `Select ${plan.name}`}
                    onPress={() => handleSignUp(tier)}
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
