/**
 * Admin Dashboard
 * 
 * Only accessible to users with is_admin = true
 * Features:
 * - Platform statistics
 * - User management
 * - Listing moderation
 * - Swap monitoring
 * - Dispute resolution
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/database';
import { User, Listing, Swap } from '@/types';

interface AdminStats {
  total_users: number;
  new_users_7d: number;
  active_listings: number;
  new_listings_7d: number;
  total_swaps: number;
  pending_swaps: number;
  completed_swaps: number;
  disputed_swaps: number;
  new_swaps_7d: number;
  verified_users: number;
  premium_users: number;
  elite_users: number;
}

export default function AdminScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [disputedSwaps, setDisputedSwaps] = useState<Swap[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'listings' | 'swaps'>('overview');

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  async function checkAdminAccess() {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const adminStatus = await db.isUserAdmin(user.id);
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAdminData() {
    try {
      const [statsData, usersData, swapsData] = await Promise.all([
        db.getAdminStats(),
        db.getRecentUsers(10),
        db.getDisputedSwaps(),
      ]);
      
      setStats(statsData);
      setRecentUsers(usersData);
      setDisputedSwaps(swapsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  }

  async function handleVerifyUser(userId: string) {
    Alert.alert(
      'Verify User',
      'Are you sure you want to verify this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            await db.adminUpdateUser(userId, { verification_tier: 'verified' });
            await loadAdminData();
          },
        },
      ]
    );
  }

  async function handleSuspendUser(userId: string) {
    Alert.alert(
      'Suspend User',
      'Are you sure you want to suspend this user? They will not be able to access the platform.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            await db.adminUpdateUser(userId, { verification_tier: 'suspended' });
            await loadAdminData();
          },
        },
      ]
    );
  }

  async function handleResolveDispute(swapId: string, resolution: 'favor_initiator' | 'favor_recipient' | 'mutual') {
    Alert.alert(
      'Resolve Dispute',
      `Resolve in favor of: ${resolution.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await db.adminResolveDispute(swapId, resolution);
            await loadAdminData();
          },
        },
      ]
    );
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
    accessDenied: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    accessDeniedTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
    },
    accessDeniedText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      padding: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statCardWide: {
      width: '100%',
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    statChange: {
      fontSize: 12,
      marginTop: 4,
    },
    statChangePositive: {
      color: '#22C55E',
    },
    statChangeNegative: {
      color: '#EF4444',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    userCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    userEmail: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    userMeta: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    userActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    disputeCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#EF4444',
    },
    disputeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    disputeTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    disputeReason: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
    disputeActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    emptyState: {
      alignItems: 'center',
      padding: 32,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={colors.textSecondary} />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You don't have admin privileges to access this page.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Manage ScentSwap platform
        </Text>
      </View>

      <View style={styles.tabs}>
        {(['overview', 'users', 'listings', 'swaps'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && stats && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.total_users}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
                <Text style={[styles.statChange, styles.statChangePositive]}>
                  +{stats.new_users_7d} this week
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.active_listings}</Text>
                <Text style={styles.statLabel}>Active Listings</Text>
                <Text style={[styles.statChange, styles.statChangePositive]}>
                  +{stats.new_listings_7d} this week
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.total_swaps}</Text>
                <Text style={styles.statLabel}>Total Swaps</Text>
                <Text style={[styles.statChange, styles.statChangePositive]}>
                  +{stats.new_swaps_7d} this week
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.completed_swaps}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.pending_swaps}</Text>
                <Text style={styles.statLabel}>Pending Swaps</Text>
              </View>
              
              <View style={[styles.statCard, { borderColor: stats.disputed_swaps > 0 ? '#EF4444' : colors.border }]}>
                <Text style={[styles.statValue, { color: stats.disputed_swaps > 0 ? '#EF4444' : colors.primary }]}>
                  {stats.disputed_swaps}
                </Text>
                <Text style={styles.statLabel}>Disputed</Text>
              </View>

              <View style={[styles.statCard, styles.statCardWide]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={styles.statValue}>{stats.verified_users}</Text>
                    <Text style={styles.statLabel}>Verified Users</Text>
                  </View>
                  <View>
                    <Text style={styles.statValue}>{stats.premium_users}</Text>
                    <Text style={styles.statLabel}>Premium</Text>
                  </View>
                  <View>
                    <Text style={styles.statValue}>{stats.elite_users}</Text>
                    <Text style={styles.statLabel}>Elite</Text>
                  </View>
                </View>
              </View>
            </View>

            {disputedSwaps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ Disputes Requiring Attention</Text>
                {disputedSwaps.map((swap) => (
                  <View key={swap.id} style={styles.disputeCard}>
                    <View style={styles.disputeHeader}>
                      <Text style={styles.disputeTitle}>Swap #{swap.id.slice(0, 8)}</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {new Date(swap.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.disputeReason}>
                      Reason: {swap.dispute_reason || 'No reason provided'}
                    </Text>
                    <View style={styles.disputeActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { borderColor: colors.primary, flex: 1 }]}
                        onPress={() => router.push(`/swap/${swap.id}`)}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.primary }]}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Users</Text>
              {recentUsers.map((u) => (
                <View key={u.id} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View>
                      <Text style={styles.userName}>{u.full_name || u.username}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                    </View>
                  </View>
                  <View style={styles.userMeta}>
                    <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>
                        {u.verification_tier}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: colors.textSecondary + '20' }]}>
                      <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                        {u.total_swaps} swaps
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'users' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Management</Text>
            {recentUsers.map((u) => (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View>
                    <Text style={styles.userName}>{u.full_name || u.username}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>
                </View>
                <View style={styles.userMeta}>
                  <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {u.verification_tier}
                    </Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  {u.verification_tier === 'unverified' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: '#22C55E' }]}
                      onPress={() => handleVerifyUser(u.id)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                      <Text style={[styles.actionButtonText, { color: '#22C55E' }]}>Verify</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: '#EF4444' }]}
                    onPress={() => handleSuspendUser(u.id)}
                  >
                    <Ionicons name="ban" size={16} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Suspend</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.primary }]}
                    onPress={() => router.push(`/profile/${u.id}`)}
                  >
                    <Ionicons name="eye" size={16} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'swaps' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disputed Swaps</Text>
            {disputedSwaps.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                <Text style={styles.emptyStateText}>No disputes to resolve</Text>
              </View>
            ) : (
              disputedSwaps.map((swap) => (
                <View key={swap.id} style={styles.disputeCard}>
                  <View style={styles.disputeHeader}>
                    <Text style={styles.disputeTitle}>Swap #{swap.id.slice(0, 8)}</Text>
                  </View>
                  <Text style={styles.disputeReason}>
                    {swap.dispute_reason || 'No reason provided'}
                  </Text>
                  <View style={styles.disputeActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: '#22C55E' }]}
                      onPress={() => handleResolveDispute(swap.id, 'favor_initiator')}
                    >
                      <Text style={[styles.actionButtonText, { color: '#22C55E' }]}>Favor Initiator</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: '#3B82F6' }]}
                      onPress={() => handleResolveDispute(swap.id, 'mutual')}
                    >
                      <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Mutual</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: '#F59E0B' }]}
                      onPress={() => handleResolveDispute(swap.id, 'favor_recipient')}
                    >
                      <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>Favor Recipient</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'listings' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listing Moderation</Text>
            <View style={styles.emptyState}>
              <Ionicons name="document-text" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>
                Listing moderation coming soon
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

