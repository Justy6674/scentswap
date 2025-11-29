import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button } from '@/components/Button';
import { ListingCard } from '@/components/ListingCard';
import { User, Listing, Rating } from '@/types';
import { db } from '@/lib/database';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  async function loadProfile() {
    setLoading(true);
    const [userData, userListings, userRatings] = await Promise.all([
      db.getUser(id!),
      db.getUserListings(id!),
      db.getUserRatings(id!),
    ]);
    setUser(userData);
    setListings(userListings.filter(l => l.is_active));
    setRatings(userRatings);
    setLoading(false);
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    badgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
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
    listingContainer: {
      marginBottom: 12,
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
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 20,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
        <Text style={{ color: colors.text, marginTop: 16, fontSize: 18 }}>
          User not found
        </Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const badge = getVerificationBadge(user.verification_tier);

  return (
    <>
      <Stack.Screen
        options={{
          title: user.username || 'Profile',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Active Listings ({listings.length})
            </Text>
            {listings.length === 0 ? (
              <Text style={styles.emptyText}>No active listings</Text>
            ) : (
              listings.map((listing) => (
                <View key={listing.id} style={styles.listingContainer}>
                  <ListingCard
                    listing={listing}
                    showUser={false}
                    onPress={() => router.push(`/listing/${listing.id}`)}
                  />
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Reviews ({ratings.length})
            </Text>
            {ratings.length === 0 ? (
              <Text style={styles.emptyText}>No reviews yet</Text>
            ) : (
              ratings.map((rating) => (
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
                      {mounted ? new Date(rating.created_at).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  {rating.review && (
                    <Text style={styles.reviewText}>{rating.review}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}
