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
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/Button';
import { ListingCard } from '@/components/ListingCard';
import { Listing } from '@/types';
import { db } from '@/lib/database';
import { calculateTradeValue, calculateVariance } from '@/lib/valuation';

export default function NewSwapScreen() {
  const { targetListing } = useLocalSearchParams<{ targetListing?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated, outsetaUser, isLoading: authLoading, openLogin } = useSubscription();
  
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [targetListingData, setTargetListingData] = useState<Listing | null>(null);
  const [selectedMyListings, setSelectedMyListings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fairness State
  const [initiatorValue, setInitiatorValue] = useState(0);
  const [recipientValue, setRecipientValue] = useState(0);
  const [valueDiff, setValueDiff] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);
  const [lossAccepted, setLossAccepted] = useState(false);
  
  const [fairnessCheck, setFairnessCheck] = useState<{
    score: number;
    assessment: string;
    suggestions: string[];
  } | null>(null);
  const [checkingFairness, setCheckingFairness] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && outsetaUser) {
      loadData();
    }
  }, [isAuthenticated, outsetaUser, targetListing]);

  async function loadData() {
    if (!isAuthenticated || !outsetaUser) return;
    setLoading(true);
    
    const [userListings, allListings] = await Promise.all([
      db.getUserListings(outsetaUser?.personUid || ''),
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
    if (!targetListingData || selectedMyListings.length === 0) return;
    setCheckingFairness(true);

    // Calculate Initiator Value
    const selectedItems = myListings.filter(l => selectedMyListings.includes(l.id));
    const initiatorTotal = selectedItems.reduce((sum, item) => {
        const base = item.estimated_value || (item.size_ml * 1.5); // Fallback base price
        return sum + calculateTradeValue(item, base).value;
    }, 0);

    // Calculate Recipient Value
    const recipientBase = targetListingData.estimated_value || (targetListingData.size_ml * 1.5);
    const recipientTotal = calculateTradeValue(targetListingData, recipientBase).value;

    const variance = calculateVariance(initiatorTotal, recipientTotal);

    setInitiatorValue(initiatorTotal);
    setRecipientValue(recipientTotal);
    setValueDiff(variance.diff);
    setIsBalanced(variance.isBalanced);
    setLossAccepted(false);

    setFairnessCheck({
      score: recipientTotal > 0 ? Math.max(0, 100 - Math.round((Math.abs(variance.diff) / recipientTotal) * 100)) : 0,
      assessment: variance.suggestion,
      suggestions: variance.isBalanced ? [] : ['Add a sample or decant', 'Accept the value difference']
    });
    
    setCheckingFairness(false);
  }

  async function submitSwap() {
    if (!isAuthenticated || !outsetaUser || !targetListingData || selectedMyListings.length === 0) return;
    
    // Validation: Must be balanced OR loss accepted
    if (!isBalanced && !lossAccepted && Math.abs(valueDiff) > 5) {
      Alert.alert('Unbalanced Trade', 'Please balance the trade value or explicitly accept the loss to proceed.');
      return;
    }
    
    setSubmitting(true);
    const { swap, fairnessScore } = await db.createSwap({
      initiator_id: outsetaUser?.personUid || '',
      recipient_id: targetListingData.user_id,
      initiator_listings: selectedMyListings,
      recipient_listings: [targetListingData.id],
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
    authContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor: colors.background,
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
      width: '80%',
    },
  });

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#FBF9F7' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !outsetaUser) {
    return (
      <View style={styles.authContainer}>
        <Ionicons name="lock-closed-outline" size={72} color={colors.primary} />
        <Text style={styles.authTitle}>Sign in to propose swaps</Text>
        <Text style={styles.authSubtitle}>
          Log in to assemble trade bundles, check fairness, and send a proposal.
        </Text>
        <View style={styles.authButton}>
          <Button title="Sign In" onPress={openLogin} />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isLoading && !isAuthenticated) {
    openLogin();
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
              <Text style={styles.sectionTitle}>Value Comparison</Text>
              <View style={styles.fairnessCard}>
                {/* Comparison Bar Visual */}
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
                  <Text style={{color: colors.text}}>You Give: ${initiatorValue.toFixed(2)}</Text>
                  <Text style={{color: colors.text}}>You Get: ${recipientValue.toFixed(2)}</Text>
                </View>
                <View style={{height: 10, flexDirection: 'row', borderRadius: 5, overflow: 'hidden', marginBottom: 16, backgroundColor: colors.backgroundSecondary}}>
                  <View style={{flex: initiatorValue || 1, backgroundColor: colors.primary}} />
                  <View style={{width: 2, backgroundColor: '#FFF'}} />
                  <View style={{flex: recipientValue || 1, backgroundColor: '#9B7DFF'}} />
                </View>
                
                <Text style={[styles.assessmentText, {fontWeight: 'bold', color: isBalanced ? '#22C55E' : '#F59E0B', textAlign: 'center'}]}>
                  {Math.abs(valueDiff) < 5 
                    ? "Perfectly Balanced" 
                    : valueDiff > 0 
                      ? `You are offering $${valueDiff.toFixed(2)} more value.` 
                      : `You are receiving $${Math.abs(valueDiff).toFixed(2)} less value.`}
                </Text>
                <Text style={[styles.assessmentText, {marginTop: 4, textAlign: 'center'}]}>{fairnessCheck.assessment}</Text>
                
                {!isBalanced && Math.abs(valueDiff) > 5 && (
                  <TouchableOpacity 
                    style={{marginTop: 16, flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.background, borderRadius: 8}} 
                    onPress={() => setLossAccepted(!lossAccepted)}
                  >
                    <View style={{width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: lossAccepted ? colors.primary : colors.border, marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: lossAccepted ? colors.primary : 'transparent'}}>
                       {lossAccepted && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                    <Text style={{color: colors.text, flex: 1, fontSize: 14}}>
                      I accept this value difference and wish to proceed with the trade.
                    </Text>
                  </TouchableOpacity>
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
