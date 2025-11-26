import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Listing } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface ListingCardProps {
  listing: Listing;
  onPress?: () => void;
  showUser?: boolean;
  compact?: boolean;
}

export function ListingCard({ listing, onPress, showUser = true, compact = false }: ListingCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return colors.success;
      case 'like_new': return '#22D3EE';
      case 'good': return colors.warning;
      case 'fair': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return 'New';
      case 'like_new': return 'Like New';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      default: return condition;
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    compactCard: {
      flexDirection: 'row',
    },
    image: {
      width: '100%',
      height: compact ? 80 : 180,
      backgroundColor: colors.backgroundSecondary,
    },
    compactImage: {
      width: 80,
      height: 80,
    },
    placeholder: {
      width: '100%',
      height: compact ? 80 : 180,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    compactPlaceholder: {
      width: 80,
      height: 80,
    },
    content: {
      padding: compact ? 12 : 16,
      flex: compact ? 1 : undefined,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    name: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    house: {
      fontSize: compact ? 12 : 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    details: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: compact ? 4 : 12,
      gap: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.backgroundSecondary,
    },
    badgeText: {
      fontSize: 12,
      color: colors.text,
    },
    conditionBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    conditionText: {
      fontSize: 12,
      fontWeight: '500',
    },
    fillBar: {
      height: 4,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 2,
      marginTop: compact ? 4 : 12,
      overflow: 'hidden',
    },
    fillLevel: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    fillText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    username: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 8,
      flex: 1,
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      fontSize: 12,
      color: colors.text,
      marginLeft: 4,
    },
  });

  return (
    <TouchableOpacity 
      style={[styles.card, compact && styles.compactCard]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {listing.photos && listing.photos.length > 0 ? (
        <Image
          source={{ uri: listing.photos[0] }}
          style={[styles.image, compact && styles.compactImage]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholder, compact && styles.compactPlaceholder]}>
          <Ionicons name="flask-outline" size={compact ? 24 : 48} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={compact ? 1 : 2}>
              {listing.custom_name || listing.fragrance?.name || 'Unknown Fragrance'}
            </Text>
            <Text style={styles.house} numberOfLines={1}>
              {listing.house || listing.fragrance?.house || 'Unknown House'}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{listing.size_ml}ml</Text>
          </View>
          {listing.concentration && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{listing.concentration}</Text>
            </View>
          )}
          <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(listing.condition) + '20' }]}>
            <Text style={[styles.conditionText, { color: getConditionColor(listing.condition) }]}>
              {getConditionLabel(listing.condition)}
            </Text>
          </View>
        </View>

        {!compact && (
          <>
            <View style={styles.fillBar}>
              <View style={[styles.fillLevel, { width: `${listing.fill_percentage}%` }]} />
            </View>
            <Text style={styles.fillText}>{listing.fill_percentage}% full</Text>
          </>
        )}

        {showUser && listing.user && !compact && (
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(listing.user.username || listing.user.email || '?')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.username}>
              {listing.user.username || listing.user.email?.split('@')[0]}
            </Text>
            {listing.user.rating > 0 && (
              <View style={styles.rating}>
                <Ionicons name="star" size={12} color={colors.accent} />
                <Text style={styles.ratingText}>{listing.user.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
