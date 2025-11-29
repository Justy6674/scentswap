import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/Button';
import { ListingCard } from '@/components/ListingCard';
import { Swap, Message } from '@/types';
import { db } from '@/lib/database';

export default function SwapDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated, outsetaUser, isLoading: authLoading, openLogin } = useSubscription();
  const [swap, setSwap] = useState<Swap | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      loadSwapDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  async function loadSwapDetails() {
    setLoading(true);
    if (isAuthenticated && outsetaUser) {
      const swaps = await db.getSwaps(outsetaUser.personUid);
      const found = swaps.find(s => s.id === id);
      setSwap(found || null);
      if (found) {
        const msgs = await db.getMessages(found.id);
        setMessages(msgs);
      }
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !isAuthenticated || !outsetaUser || !swap) return;
    setSending(true);
    const message = await db.sendMessage(swap.id, outsetaUser?.personUid || '', newMessage.trim());
    if (message) {
      setMessages([...messages, message]);
      setNewMessage('');
    }
    setSending(false);
  }

  async function requestAIHelp() {
    if (!swap) return;
    Alert.prompt(
      'AI Mediator',
      'Ask a question about this swap (e.g., "Is this a fair trade?")',
      async (question) => {
        if (question) {
          const { response, error } = await db.requestAIMediation(swap.id, question);
          if (response) {
            Alert.alert('AI Assessment', response);
          } else {
            Alert.alert('Error', error || 'Failed to get AI response');
          }
        }
      }
    );
  }

  async function updateStatus(status: Swap['status']) {
    if (!swap) return;
    const updated = await db.updateSwapStatus(swap.id, status);
    if (updated) {
      setSwap(updated);
      Alert.alert('Success', `Swap ${status}`);
    }
  }

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
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
      flex: 1,
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
    swapVisual: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    swapSide: {
      flex: 1,
    },
    swapLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    swapArrow: {
      marginHorizontal: 16,
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
    messagesContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 300,
    },
    messageItem: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 12,
      maxWidth: '80%',
    },
    myMessage: {
      backgroundColor: colors.primary,
      alignSelf: 'flex-end',
    },
    theirMessage: {
      backgroundColor: colors.backgroundSecondary,
      alignSelf: 'flex-start',
    },
    aiMessage: {
      backgroundColor: colors.accent + '20',
      alignSelf: 'center',
      maxWidth: '90%',
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
    },
    myMessageText: {
      color: '#FFFFFF',
    },
    theirMessageText: {
      color: colors.text,
    },
    messageTime: {
      fontSize: 10,
      marginTop: 4,
      opacity: 0.7,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 8,
    },
    messageInput: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    aiButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.accent + '20',
      marginTop: 12,
    },
    aiButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent,
      marginLeft: 8,
    },
    actionsContainer: {
      gap: 12,
      marginTop: 8,
    },
    listingsList: {
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
        <Text style={styles.authTitle}>Sign in to view swaps</Text>
        <Text style={styles.authSubtitle}>
          You need to be logged in to manage swap conversations and shipping.
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

  if (!swap) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={{ color: colors.text, marginTop: 16, fontSize: 18 }}>
          Swap not found
        </Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const currentUserId = outsetaUser?.personUid || '';
  const isInitiator = currentUserId === swap.initiator_id;
  const myListings = isInitiator ? swap.initiator_listing_details : swap.recipient_listing_details;
  const theirListings = isInitiator ? swap.recipient_listing_details : swap.initiator_listing_details;
  const statusColor = getStatusColor(swap.status);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Swap Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.statusBanner, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name="swap-horizontal" size={24} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Swap Overview</Text>
            <View style={styles.swapVisual}>
              <View style={styles.swapSide}>
                <Text style={styles.swapLabel}>You give</Text>
                <Text style={{ color: colors.text, fontWeight: '500' }}>
                  {myListings?.length || 0} item(s)
                </Text>
              </View>
              <View style={styles.swapArrow}>
                <Ionicons name="swap-horizontal" size={32} color={colors.primary} />
              </View>
              <View style={styles.swapSide}>
                <Text style={styles.swapLabel}>You get</Text>
                <Text style={{ color: colors.text, fontWeight: '500' }}>
                  {theirListings?.length || 0} item(s)
                </Text>
              </View>
            </View>
          </View>

          {swap.fairness_score && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Fairness Check</Text>
              <View style={styles.fairnessCard}>
                <View style={styles.fairnessScore}>
                  <Ionicons
                    name="shield-checkmark"
                    size={32}
                    color={swap.fairness_score >= 80 ? colors.success : colors.warning}
                  />
                  <Text
                    style={[
                      styles.fairnessValue,
                      { color: swap.fairness_score >= 80 ? colors.success : colors.warning },
                    ]}
                  >
                    {swap.fairness_score}%
                  </Text>
                </View>
                <Text style={styles.fairnessLabel}>
                  {swap.fairness_score >= 90
                    ? 'Excellent match - Very fair swap'
                    : swap.fairness_score >= 80
                    ? 'Good match - Fair swap'
                    : swap.fairness_score >= 60
                    ? 'Acceptable - Slight imbalance'
                    : 'Consider adjusting this swap'}
                </Text>
                {swap.ai_assessment && (
                  <Text style={styles.assessmentText}>{swap.ai_assessment}</Text>
                )}
              </View>
            </View>
          )}

          {myListings && myListings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Items</Text>
              <View style={styles.listingsList}>
                {myListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    compact
                    showUser={false}
                  />
                ))}
              </View>
            </View>
          )}

          {theirListings && theirListings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Their Items</Text>
              <View style={styles.listingsList}>
                {theirListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    compact
                    showUser={false}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Messages</Text>
            <View style={styles.messagesContainer}>
              {messages.length === 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
                  No messages yet. Start the conversation!
                </Text>
              ) : (
                messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageItem,
                      msg.is_ai_mediation
                        ? styles.aiMessage
                        : msg.sender_id === currentUserId
                        ? styles.myMessage
                        : styles.theirMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.sender_id === currentUserId ? styles.myMessageText : styles.theirMessageText,
                      ]}
                    >
                      {msg.message}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        { color: msg.sender_id === currentUserId ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {mounted ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : ''}
                    </Text>
                  </View>
                ))
              )}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Type a message..."
                  placeholderTextColor={colors.textSecondary}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={sendMessage}
                  disabled={sending || !newMessage.trim()}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.aiButton} onPress={requestAIHelp}>
                <Ionicons name="sparkles" size={18} color={colors.accent} />
                <Text style={styles.aiButtonText}>Ask AI Mediator</Text>
              </TouchableOpacity>
            </View>
          </View>

          {swap.status === 'proposed' && !isInitiator && (
            <View style={styles.actionsContainer}>
              <Button
                title="Accept Swap"
                onPress={() => updateStatus('accepted')}
                icon={<Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
              />
              <Button
                title="Decline"
                variant="outline"
                onPress={() => updateStatus('cancelled')}
              />
            </View>
          )}

          {swap.status === 'accepted' && (
            <View style={styles.actionsContainer}>
              <Button
                title="Lock Swap & Proceed to Shipping"
                onPress={() => updateStatus('locked')}
                icon={<Ionicons name="lock-closed" size={20} color="#FFFFFF" />}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}
