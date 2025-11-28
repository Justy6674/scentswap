import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/Button';
import { Listing } from '@/types';
import { db } from '@/lib/database';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated, outsetaUser, openLogin } = useSubscription();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id && id !== 'new') {
      loadListing();
    } else {
      setLoading(false);
    }
  }, [id]);

  async function loadListing() {
    setLoading(true);
    const listings = await db.getListings();
    const found = listings.find(l => l.id === id);
    setListing(found || null);
    setLoading(false);
  }

  async function handleShare() {
    if (!listing) return;
    
    const message = `Check out this ${listing.house || ''} ${listing.custom_name || ''} on ScentSwap! Trade value ~$${listing.estimated_value?.toFixed(0) || '?'}. #ScentSwap`;
    const url = `https://www.scentswap.com.au/listing/${listing.id}`;
    
    try {
      await Share.share({
        message: `${message} ${url}`,
        url: url, // iOS
        title: 'ScentSwap Listing'
      });
    } catch (error) {
      console.error(error);
    }
  }

  function handleProposeSwap() {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to propose a swap.');
      openLogin();
      return;
    }
    router.push(`/swap/new?targetListing=${id}`);
  }

  function getConditionLabel(condition: string) {
    switch (condition) {
      case 'new': return 'Brand New';
      case 'like_new': return 'Like New';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      default: return condition;
    }
  }

  function getConditionColor(condition: string) {
    switch (condition) {
      case 'new': return colors.success;
      case 'like_new': return '#22D3EE';
      case 'good': return colors.warning;
      case 'fair': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  }

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
    imageContainer: {
      width: width,
      height: width,
      backgroundColor: colors.backgroundSecondary,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageIndicators: {
      flexDirection: 'row',
      justifyContent: 'center',
      position: 'absolute',
      bottom: 16,
      left: 0,
      right: 0,
    },
    imageIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FFFFFF50',
      marginHorizontal: 4,
    },
    imageIndicatorActive: {
      backgroundColor: '#FFFFFF',
    },
    content: {
      padding: 20,
    },
    header: {
      marginBottom: 16,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    house: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
    },
    badgeText: {
      fontSize: 14,
      color: colors.text,
    },
    conditionBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    conditionText: {
      fontSize: 14,
      fontWeight: '500',
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    fillContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fillBar: {
      height: 8,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    fillLevel: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    fillText: {
      fontSize: 14,
      color: colors.text,
    },
    fillSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    descriptionText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    username: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    userStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    userStat: {
      fontSize: 12,
      color: colors.textSecondary,
      marginRight: 12,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      fontSize: 12,
      color: colors.text,
      marginLeft: 4,
    },
    footer: {
      padding: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    estimatedValue: {
      textAlign: 'center',
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    valueAmount: {
      fontWeight: '600',
      color: colors.text,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={{ color: colors.text, marginTop: 16, fontSize: 18 }}>
          Listing not found
        </Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const isOwner = outsetaUser?.personUid === listing.user_id;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={{ marginRight: 16, padding: 8, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20 }}>
              <Ionicons name="share-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.imageContainer}>
            {listing.photos && listing.photos.length > 0 ? (
              <>
                <Image
                  source={{ uri: listing.photos[currentImageIndex] }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {listing.photos.length > 1 && (
                  <View style={styles.imageIndicators}>
                    {listing.photos.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setCurrentImageIndex(index)}
                      >
                        <View
                          style={[
                            styles.imageIndicator,
                            index === currentImageIndex && styles.imageIndicatorActive,
                          ]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="flask-outline" size={80} color={colors.textSecondary} />
              </View>
            )}
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.name}>
                {listing.custom_name || listing.fragrance?.name || 'Unknown Fragrance'}
              </Text>
              <Text style={styles.house}>
                {listing.house || listing.fragrance?.house || 'Unknown House'}
              </Text>
              <View style={styles.badgesRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{listing.size_ml}ml</Text>
                </View>
                {listing.concentration && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{listing.concentration}</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.conditionBadge,
                    { backgroundColor: getConditionColor(listing.condition) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.conditionText,
                      { color: getConditionColor(listing.condition) },
                    ]}
                  >
                    {getConditionLabel(listing.condition)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fill Level</Text>
              <View style={styles.fillContainer}>
                <View style={styles.fillBar}>
                  <View
                    style={[styles.fillLevel, { width: `${listing.fill_percentage}%` }]}
                  />
                </View>
                <Text style={styles.fillText}>{listing.fill_percentage}% remaining</Text>
                <Text style={styles.fillSubtext}>
                  Approximately {Math.round((listing.size_ml * listing.fill_percentage) / 100)}ml
                  left
                </Text>
              </View>
            </View>

            {listing.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{listing.description}</Text>
              </View>
            )}

            {listing.batch_code && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Batch Code</Text>
                <Text style={styles.descriptionText}>{listing.batch_code}</Text>
              </View>
            )}

            {listing.user && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Listed By</Text>
                <TouchableOpacity
                  style={styles.userCard}
                  onPress={() => router.push(`/profile/${listing.user_id}`)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(listing.user.username || listing.user.email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>
                      {listing.user.username || listing.user.email?.split('@')[0]}
                    </Text>
                    <View style={styles.userStats}>
                      <Text style={styles.userStat}>
                        {listing.user.total_swaps} swaps
                      </Text>
                      {listing.user.rating > 0 && (
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={12} color={colors.accent} />
                          <Text style={styles.ratingText}>
                            {listing.user.rating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {!isOwner && (
          <View style={styles.footer}>
            {listing.estimated_value && (
              <Text style={styles.estimatedValue}>
                Estimated value:{' '}
                <Text style={styles.valueAmount}>
                  ${listing.estimated_value.toFixed(0)} AUD
                </Text>
              </Text>
            )}
            <Button
              title="Propose Swap"
              onPress={handleProposeSwap}
              icon={<Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />}
            />
          </View>
        )}
      </View>
    </>
  );
}
