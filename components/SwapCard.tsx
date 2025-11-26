import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Swap } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface SwapCardProps {
  swap: Swap;
  currentUserId: string;
  onPress?: () => void;
}

export function SwapCard({ swap, currentUserId, onPress }: SwapCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isInitiator = swap.initiator_id === currentUserId;
  const otherUser = isInitiator ? swap.recipient : swap.initiator;
  const myListings = isInitiator ? swap.initiator_listing_details : swap.recipient_listing_details;
  const theirListings = isInitiator ? swap.recipient_listing_details : swap.initiator_listing_details;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return colors.warning;
      case 'negotiating': return colors.primary;
      case 'accepted': return colors.success;
      case 'locked': return colors.success;
      case 'shipping': return '#22D3EE';
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'disputed': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'proposed': return 'Proposed';
      case 'negotiating': return 'Negotiating';
      case 'accepted': return 'Accepted';
      case 'locked': return 'Locked';
      case 'shipping': return 'Shipping';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'disputed': return 'Disputed';
      default: return status;
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'proposed': return 'time-outline';
      case 'negotiating': return 'chatbubbles-outline';
      case 'accepted': return 'checkmark-circle-outline';
      case 'locked': return 'lock-closed-outline';
      case 'shipping': return 'airplane-outline';
      case 'completed': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      case 'disputed': return 'alert-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    userDetails: {
      marginLeft: 12,
      flex: 1,
    },
    username: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    swapWith: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    swapPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 12,
    },
    swapSide: {
      flex: 1,
    },
    swapLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    swapItems: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    swapArrow: {
      marginHorizontal: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    fairnessScore: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    fairnessText: {
      fontSize: 12,
      color: colors.text,
      marginLeft: 4,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(otherUser?.username || otherUser?.email || '?')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>
              {otherUser?.username || otherUser?.email?.split('@')[0] || 'Unknown User'}
            </Text>
            <Text style={styles.swapWith}>
              {isInitiator ? 'You proposed this swap' : 'Proposed to you'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(swap.status) + '20' }]}>
          <Ionicons name={getStatusIcon(swap.status)} size={14} color={getStatusColor(swap.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(swap.status) }]}>
            {getStatusLabel(swap.status)}
          </Text>
        </View>
      </View>

      <View style={styles.swapPreview}>
        <View style={styles.swapSide}>
          <Text style={styles.swapLabel}>You give</Text>
          <Text style={styles.swapItems} numberOfLines={2}>
            {myListings?.map(l => l.custom_name || l.fragrance?.name || 'Unknown').join(', ') || 
             `${swap.initiator_listings?.length || 0} item(s)`}
          </Text>
        </View>
        <View style={styles.swapArrow}>
          <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
        </View>
        <View style={styles.swapSide}>
          <Text style={styles.swapLabel}>You get</Text>
          <Text style={styles.swapItems} numberOfLines={2}>
            {theirListings?.map(l => l.custom_name || l.fragrance?.name || 'Unknown').join(', ') ||
             `${swap.recipient_listings?.length || 0} item(s)`}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          {formatDistanceToNow(new Date(swap.created_at), { addSuffix: true })}
        </Text>
        {swap.fairness_score && (
          <View style={styles.fairnessScore}>
            <Ionicons 
              name="shield-checkmark" 
              size={14} 
              color={swap.fairness_score >= 80 ? colors.success : colors.warning} 
            />
            <Text style={styles.fairnessText}>{swap.fairness_score}% fair</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
