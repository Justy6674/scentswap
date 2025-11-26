import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { ListingCard } from '@/components/ListingCard';
import { Listing } from '@/types';
import { db } from '@/lib/database';

export default function NewSwapScreen() {
  const { targetListing } = useLocalSearchParams<{ targetListing?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [targetListingData, setTargetListingData] = useState<Listing | null>(null);
  const [selectedMyListings, setSelectedMyListings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fairnessCheck, setFairnessCheck] = useState<{
    score: number;
    assessment: string;
    suggestions: string[];
  } | null>(null);
  const [checkingFairness, setCheckingFairness] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    
    const [userListings, allListings] = await Promise.all([
      db.getUserListings(user.id),
      db.getListings(),
    ]);
    
    setMyListings(userListings.filter(l => l.is_active));
    
    if (targetListing) {
      const found = allListings.find(l => l.id === targetListing);
      setTargetListingData(found || null);
    }
    
    setLoading(false);
  }

  function toggleSelection(listingId: string) {
    if (selectedMyListings.includes(listingId)) {
      setSelectedMyListings(selectedMyListings.filter(id => id !== listingId));
    } else {
      setSelectedMyListings([...selectedMyListings, listingId]);
    }
    setFairnessCheck(null);
  }

  async function checkFairness() {
    if (!targetListing || selectedMyListings.length === 0) return;
    setCheckingFairness(true);
    const result = await db.checkFairness(selectedMyListings, [targetListing]);
    setFairnessCheck(result);
    setCheckingFairness(false);
  }

  async function submitSwap() {
    if (!user || !targetListingData || selectedMyListings.length === 0) return;
    
    setSubmitting(true);
    const { swap, fairnessScore, aiAssessment } = await db.createSwap({
      initiator_id: user.id,
      recipient_id: targetListingData.user_id,
      initiator_listings: selectedMyListings,
      recipient_listings: [targetListing!],
    });
    setSubmitting(false);

    if (swap) {
      Alert.alert(
        'Swap Proposed!',
        `Your swap proposal has been sent. Fairness score: ${fairnessScore}%`,
        [{ text: 'View Swap', onPress: () => router.replace(`/swap/${swap.id}`) }]
      );
    } else {
      Alert.alert('Error', 'Failed to create swap. Please try again.');
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
    scrollContent: {
      padding: 20,
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
    targetCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    targetLabel: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    listingsGrid: {
      gap: 12,
    },
    selectableCard: {
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: 16,
      overflow: 'hidden',
    },
    selectedCard: {
      borderColor: colors.primary,
    },
    selectionIndicator: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
    fairnessCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fairnessScore: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    fairnessValue: {
      fontSize: 36,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    fairnessLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    assessmentText: {
      fontSize: 14,
      color: colors.text,
      marginTop: 12,
      lineHeight: 20,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 8,
    },
    suggestionText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    footer: {
      padding: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    selectedCount: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
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
    router.replace('/(auth)/login');
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Propose Swap',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {targetListingData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>You Want</Text>
              <View style={styles.targetCard}>
                <Text style={styles.targetLabel}>Target Item</Text>
                <ListingCard listing={targetListingData} showUser compact />
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Select Items to Offer ({selectedMyListings.length} selected)
            </Text>
            {myListings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="flask-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>
                  You don't have any listings yet.{'\n'}Add fragrances to your cabinet first.
                </Text>
                <Button
                  title="Add Fragrance"
                  onPress={() => router.push('/listing/new')}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              <View style={styles.listingsGrid}>
                {myListings.map((listing) => (
                  <TouchableOpacity
                    key={listing.id}
                    style={[
                      styles.selectableCard,
                      selectedMyListings.includes(listing.id) && styles.selectedCard,
                    ]}
                    onPress={() => toggleSelection(listing.id)}
                    activeOpacity={0.8}
                  >
                    {selectedMyListings.includes(listing.id) && (
                      <View style={styles.selectionIndicator}>
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      </View>
                    )}
                    <ListingCard listing={listing} showUser={false} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {fairnessCheck && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Fairness Check</Text>
              <View style={styles.fairnessCard}>
                <View style={styles.fairnessScore}>
                  <Ionicons
                    name="shield-checkmark"
                    size={32}
                    color={fairnessCheck.score >= 80 ? colors.success : colors.warning}
                  />
                  <Text
                    style={[
                      styles.fairnessValue,
                      { color: fairnessCheck.score >= 80 ? colors.success : colors.warning },
                    ]}
                  >
                    {fairnessCheck.score}%
                  </Text>
                </View>
                <Text style={styles.fairnessLabel}>
                  {fairnessCheck.score >= 90
                    ? 'Excellent match!'
                    : fairnessCheck.score >= 80
                    ? 'Good, fair swap'
                    : fairnessCheck.score >= 60
                    ? 'Acceptable, but slightly imbalanced'
                    : 'Consider adjusting your offer'}
                </Text>
                <Text style={styles.assessmentText}>{fairnessCheck.assessment}</Text>
                {fairnessCheck.suggestions.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                      Suggestions:
                    </Text>
                    {fairnessCheck.suggestions.map((suggestion, index) => (
                      <View key={index} style={styles.suggestionItem}>
                        <Ionicons name="bulb-outline" size={16} color={colors.accent} />
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {myListings.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.selectedCount}>
              {selectedMyListings.length} item(s) selected
            </Text>
            <View style={styles.actionsRow}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Check Fairness"
                  variant="outline"
                  onPress={checkFairness}
                  loading={checkingFairness}
                  disabled={selectedMyListings.length === 0}
                  icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Propose Swap"
                  onPress={submitSwap}
                  loading={submitting}
                  disabled={selectedMyListings.length === 0}
                  icon={<Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </>
  );
}
