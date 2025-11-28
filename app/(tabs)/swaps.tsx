import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SwapCard } from '@/components/SwapCard';
import { Button } from '@/components/Button';
import { Swap } from '@/types';
import { db } from '@/lib/database';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

export default function SwapsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated, outsetaUser, openLogin } = useSubscription();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && outsetaUser) {
        loadSwaps();
      }
    }, [isAuthenticated, outsetaUser])
  );

  async function loadSwaps() {
    if (!outsetaUser) return;
    setLoading(true);
    const data = await db.getSwaps(outsetaUser.personUid);
    setSwaps(data);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadSwaps();
    setRefreshing(false);
  }

  const filteredSwaps = swaps.filter(swap => {
    switch (activeFilter) {
      case 'active':
        return ['negotiating', 'accepted', 'locked', 'shipping'].includes(swap.status);
      case 'pending':
        return swap.status === 'proposed';
      case 'completed':
        return swap.status === 'completed';
      default:
        return true;
    }
  });

  const pendingCount = swaps.filter(s => s.status === 'proposed').length;
  const activeCount = swaps.filter(s => 
    ['negotiating', 'accepted', 'locked', 'shipping'].includes(s.status)
  ).length;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginTop: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
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
    filtersContainer: {
      paddingVertical: 16,
    },
    filtersContent: {
      paddingHorizontal: 20,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      marginRight: 8,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
    },
    filterChipText: {
      fontSize: 14,
      color: colors.text,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    listContent: {
      padding: 20,
      paddingTop: 0,
    },
    swapContainer: {
      marginBottom: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authContainer}>
          <Ionicons name="swap-horizontal" size={80} color={colors.primary} />
          <Text style={styles.authTitle}>Your Swaps</Text>
          <Text style={styles.authSubtitle}>
            Sign in to view and manage your fragrance swaps
          </Text>
          <View style={styles.authButton}>
            <Button
              title="Sign In to Continue"
              onPress={openLogin}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: Swap }) => (
    <View style={styles.swapContainer}>
      <SwapCard
        swap={item}
        currentUserId={user.id}
        onPress={() => router.push(`/swap/${item.id}`)}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="swap-horizontal-outline" size={80} color={colors.textSecondary} />
      <Text style={styles.emptyText}>No swaps yet</Text>
      <Text style={styles.emptySubtext}>
        Browse the marketplace and propose a swap to get started
      </Text>
      <View style={{ marginTop: 24, width: '100%' }}>
        <Button title="Browse Fragrances" onPress={() => router.push('/(tabs)')} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Swaps</Text>
        <Text style={styles.subtitle}>{swaps.length} total swaps</Text>
      </View>

      {swaps.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>
      )}

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSwaps}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
