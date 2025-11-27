import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/Button';
import { Rating } from '@/types';
import { db } from '@/lib/database';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, signOut } = useAuth();
  const { subscription, openProfile, logout, getPlan } = useSubscription();
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    if (user) {
      loadRatings();
    }
  }, [user]);

  async function loadRatings() {
    if (!user) return;
    const data = await db.getUserRatings(user.id);
    setRatings(data);
  }

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            // Use Outseta logout which clears the session
            logout();
            await signOut();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  }

  /**
   * Open Outseta Profile for subscription/billing management
   * Per Outseta docs: "The Profile embed serves as the user account portal"
   * @see docs/OUTSETA_INTEGRATION.md
   */
  function handleManageSubscription() {
    openProfile();
  }

  const getVerificationBadge = (tier: string) => {
    switch (tier) {
      case 'verified':
        return { icon: 'checkmark-circle', color: colors.success, label: 'Verified' };
      case 'trusted':
        return { icon: 'star', color: colors.accent, label: 'Trusted' };
      case 'elite':
        return { icon: 'diamond', color: colors.primary, label: 'Elite' };
      default:
        return { icon: 'alert-circle', color: colors.warning, label: 'Unverified' };
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    authContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    authTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 20,
      textAlign: 'center',
    },
    authSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 24,
    },
    authButton: {
      marginTop: 24,
      width: '100%',
    },
    scrollContent: {
      padding: 20,
    },
    profileHeader: {
      alignItems: 'center',
      paddingBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    username: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    badgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.backgroundSecondary,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
    },
    statsGrid: {
      flexDirection: 'row',
      marginTop: 24,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuContent: {
      flex: 1,
      marginLeft: 12,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    menuSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    signOutButton: {
      marginTop: 24,
    },
    subscriptionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    subscriptionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    planName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    planPrice: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    planBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    planBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    planDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    planListings: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      marginBottom: 16,
    },
    manageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    manageButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      flex: 1,
    },
    ratingCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ratingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    ratingStars: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 4,
    },
    ratingDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    reviewText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
  });

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authContainer}>
          <Ionicons name="person-outline" size={80} color={colors.primary} />
          <Text style={styles.authTitle}>Your Profile</Text>
          <Text style={styles.authSubtitle}>
            Sign in to view your profile, ratings, and swap history
          </Text>
          <View style={styles.authButton}>
            <Button
              title="Sign In"
              onPress={() => router.push('/(auth)/login')}
            />
          </View>
          <View style={[styles.authButton, { marginTop: 12 }]}>
            <Button
              title="Create Account"
              variant="outline"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const badge = getVerificationBadge(user.verification_tier);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(user.username || user.email || '?')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>
            {user.username || user.email?.split('@')[0]}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={[styles.badgeContainer, { backgroundColor: badge.color + '20' }]}>
            <Ionicons name={badge.icon as any} size={16} color={badge.color} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.total_swaps}</Text>
            <Text style={styles.statLabel}>Swaps</Text>
          </View>
          <View style={styles.statCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={20} color={colors.accent} />
              <Text style={[styles.statValue, { marginLeft: 4 }]}>
                {user.rating > 0 ? user.rating.toFixed(1) : '-'}
              </Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {user.positive_percentage > 0 ? `${user.positive_percentage.toFixed(0)}%` : '-'}
            </Text>
            <Text style={styles.statLabel}>Positive</Text>
          </View>
        </View>

        {/* Subscription Section - Outseta Profile Embed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View>
                <Text style={styles.planName}>{getPlan().name} Plan</Text>
                <Text style={styles.planPrice}>
                  {getPlan().price === 0 ? 'Free' : `$${getPlan().price}/month AUD`}
                </Text>
              </View>
              <View style={[styles.planBadge, { backgroundColor: subscription.tier === 'free' ? colors.textSecondary : colors.primary }]}>
                <Text style={styles.planBadgeText}>{subscription.tier.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.planDescription}>{getPlan().description}</Text>
            <Text style={styles.planListings}>
              {getPlan().maxListings === -1 ? 'Unlimited' : getPlan().maxListings} listings included
            </Text>
            
            {/* Outseta Profile Button - Opens Outseta hosted profile for billing management */}
            <TouchableOpacity 
              style={styles.manageButton} 
              onPress={handleManageSubscription}
            >
              <Ionicons name="card-outline" size={18} color={colors.primary} />
              <Text style={styles.manageButtonText}>Manage Subscription & Billing</Text>
              <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/edit')}>
            <View style={styles.menuIcon}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Edit Profile</Text>
              <Text style={styles.menuSubtitle}>Update your personal information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/address')}>
            <View style={styles.menuIcon}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Shipping Address</Text>
              <Text style={styles.menuSubtitle}>Manage your delivery address</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/verification')}>
            <View style={styles.menuIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Verification</Text>
              <Text style={styles.menuSubtitle}>Verify your Australian identity</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {ratings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {ratings.slice(0, 3).map((rating) => (
              <View key={rating.id} style={styles.ratingCard}>
                <View style={styles.ratingHeader}>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= rating.overall_score ? 'star' : 'star-outline'}
                        size={16}
                        color={colors.accent}
                      />
                    ))}
                    <Text style={styles.ratingText}>{rating.overall_score}/5</Text>
                  </View>
                  <Text style={styles.ratingDate}>
                    {new Date(rating.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {rating.review && (
                  <Text style={styles.reviewText}>{rating.review}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
