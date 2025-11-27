/**
 * TrustBadge Component
 * 
 * Displays user verification tier and trust metrics
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { User } from '@/types';

interface TrustBadgeProps {
  user: User;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  onPress?: () => void;
}

type VerificationTier = 'unverified' | 'verified' | 'trusted' | 'elite';

const TIER_CONFIG: Record<VerificationTier, {
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}> = {
  unverified: {
    label: 'Unverified',
    color: Colors.light.textSecondary,
    icon: 'person-outline',
    description: 'Complete verification to unlock more features',
  },
  verified: {
    label: 'Verified',
    color: '#3B82F6', // Blue
    icon: 'checkmark-circle',
    description: 'Identity confirmed, ready to trade',
  },
  trusted: {
    label: 'Trusted',
    color: '#8B5CF6', // Purple
    icon: 'shield-checkmark',
    description: '5+ successful swaps with great ratings',
  },
  elite: {
    label: 'Elite',
    color: '#F59E0B', // Gold
    icon: 'star',
    description: 'Top trader with exceptional reputation',
  },
};

export function TrustBadge({ user, size = 'medium', showStats = false, onPress }: TrustBadgeProps) {
  const tier = (user.verification_tier as VerificationTier) || 'unverified';
  const config = TIER_CONFIG[tier];
  
  const iconSize = size === 'small' ? 12 : size === 'large' ? 20 : 16;
  const fontSize = size === 'small' ? 10 : size === 'large' ? 14 : 12;
  const padding = size === 'small' ? { h: 6, v: 2 } : size === 'large' ? { h: 12, v: 6 } : { h: 8, v: 4 };

  const badge = (
    <View style={[
      styles.badge, 
      { 
        backgroundColor: config.color + '20',
        paddingHorizontal: padding.h,
        paddingVertical: padding.v,
      }
    ]}>
      <Ionicons name={config.icon} size={iconSize} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color, fontSize }]}>
        {config.label}
      </Text>
    </View>
  );

  if (!showStats) {
    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress}>
          {badge}
        </TouchableOpacity>
      );
    }
    return badge;
  }

  // Full stats view
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      {badge}
      
      <View style={styles.statsRow}>
        {/* Swaps Count */}
        <View style={styles.stat}>
          <Text style={styles.statValue}>{user.total_swaps || 0}</Text>
          <Text style={styles.statLabel}>Swaps</Text>
        </View>
        
        {/* Rating */}
        <View style={styles.stat}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.statValue}>
              {user.rating ? user.rating.toFixed(1) : '-'}
            </Text>
          </View>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        
        {/* Positive % */}
        <View style={styles.stat}>
          <Text style={[
            styles.statValue, 
            { color: (user.positive_percentage || 0) >= 90 ? '#10B981' : Colors.light.text }
          ]}>
            {user.positive_percentage ? `${user.positive_percentage}%` : '-'}
          </Text>
          <Text style={styles.statLabel}>Positive</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{config.description}</Text>
    </TouchableOpacity>
  );
}

// Standalone component for displaying rating stars
export function RatingStars({ rating, size = 16, showValue = true }: { 
  rating: number | null; 
  size?: number;
  showValue?: boolean;
}) {
  const stars = Math.round(rating || 0);
  
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map(star => (
        <Ionicons
          key={star}
          name={star <= stars ? 'star' : 'star-outline'}
          size={size}
          color={star <= stars ? '#F59E0B' : Colors.light.border}
        />
      ))}
      {showValue && rating !== null && (
        <Text style={[styles.ratingText, { fontSize: size - 2 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

// Tier progression indicator
export function TierProgress({ currentTier, swapCount, rating }: {
  currentTier: VerificationTier;
  swapCount: number;
  rating: number | null;
}) {
  const tiers: VerificationTier[] = ['unverified', 'verified', 'trusted', 'elite'];
  const currentIndex = tiers.indexOf(currentTier);
  
  const getNextRequirement = (): string | null => {
    switch (currentTier) {
      case 'unverified':
        return 'Complete identity verification to become Verified';
      case 'verified':
        return `${Math.max(0, 5 - swapCount)} more swaps needed for Trusted status`;
      case 'trusted':
        return rating && rating >= 4.8 
          ? `${Math.max(0, 20 - swapCount)} more swaps for Elite status`
          : 'Maintain 4.8+ rating for Elite status';
      case 'elite':
        return null;
      default:
        return null;
    }
  };

  const nextRequirement = getNextRequirement();

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        {tiers.map((tier, index) => {
          const config = TIER_CONFIG[tier];
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <View key={tier} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                { 
                  backgroundColor: isActive ? config.color : Colors.light.border,
                  borderColor: isCurrent ? config.color : 'transparent',
                  borderWidth: isCurrent ? 2 : 0,
                }
              ]}>
                {isActive && (
                  <Ionicons name={config.icon} size={12} color="#FFFFFF" />
                )}
              </View>
              <Text style={[
                styles.progressLabel,
                { color: isActive ? config.color : Colors.light.textSecondary }
              ]}>
                {config.label}
              </Text>
            </View>
          );
        })}
        
        {/* Progress line */}
        <View style={styles.progressLine}>
          <View style={[
            styles.progressLineFill,
            { width: `${(currentIndex / (tiers.length - 1)) * 100}%` }
          ]} />
        </View>
      </View>
      
      {nextRequirement && (
        <View style={styles.nextRequirement}>
          <Ionicons name="arrow-up-circle-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.nextRequirementText}>{nextRequirement}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  description: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
    color: Colors.light.text,
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  progressTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    paddingTop: 20,
  },
  progressStep: {
    alignItems: 'center',
    zIndex: 1,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressLine: {
    position: 'absolute',
    top: 34,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: Colors.light.border,
  },
  progressLineFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },
  nextRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 8,
  },
  nextRequirementText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.text,
  },
});

