import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ListingCard } from '@/components/ListingCard';
import { Button } from '@/components/Button';
import { Listing } from '@/types';
import { db } from '@/lib/database';

export default function CabinetScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated, outsetaUser, openLogin, isLoading: authLoading } = useSubscription();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && outsetaUser) {
        loadListings();
      }
    }, [isAuthenticated, outsetaUser])
  );

  async function loadListings() {
    if (!outsetaUser) return;
    setLoading(true);
    // Use Outseta person UID to get listings
    // TODO: Update db.getUserListings to work with Outseta UIDs
    const data = await db.getUserListings(outsetaUser.personUid);
    setListings(data);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  }

  function handleAddListing() {
    router.push('/listing/new');
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
    },
    headerText: {
      flex: 1,
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
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    addButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      marginLeft: 6,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 16,
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
    listContent: {
      padding: 20,
      paddingTop: 0,
    },
    listingContainer: {
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

  // CRITICAL: Show loading state while auth is being checked
  // This prevents React hydration mismatch (Error #418)
  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#000000' }}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authContainer}>
          <Ionicons name="grid-outline" size={80} color={colors.primary} />
          <Text style={styles.authTitle}>Your Swap Cabinet</Text>
          <Text style={styles.authSubtitle}>
            Sign in to add fragrances and start swapping with other collectors
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

  const activeListings = listings.filter(l => l.is_active);
  const totalValue = listings.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  const renderItem = ({ item }: { item: Listing }) => (
    <View style={styles.listingContainer}>
      <ListingCard
        listing={item}
        showUser={false}
        onPress={() => router.push(`/listing/${item.id}`)}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="flask-outline" size={80} color={colors.textSecondary} />
      <Text style={styles.emptyText}>Your cabinet is empty</Text>
      <Text style={styles.emptySubtext}>
        Add fragrances you'd like to swap and start trading with other fragrance enthusiasts
      </Text>
      <View style={{ marginTop: 24, width: '100%' }}>
        <Button title="Add Your First Fragrance" onPress={handleAddListing} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>My Cabinet</Text>
          <Text style={styles.subtitle}>{listings.length} fragrances listed</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddListing}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {listings.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeListings.length}</Text>
            <Text style={styles.statLabel}>Active Listings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ${totalValue.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Est. Total Value</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
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
