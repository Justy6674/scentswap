/**
 * ShippingTracker Component
 * 
 * Displays shipping status, tracking info, and packing guidelines
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Swap } from '@/types';
import { Button } from './Button';

interface ShippingTrackerProps {
  swap: Swap;
  isInitiator: boolean;
  onUpdateTracking: (trackingNumber: string, carrier: string) => Promise<void>;
  onConfirmReceived: () => Promise<void>;
  userShippingAddress?: string;
  partnerShippingAddress?: string;
}

const CARRIERS = [
  { key: 'auspost', label: 'Australia Post', trackingUrl: 'https://auspost.com.au/track/track.html?id=' },
  { key: 'sendle', label: 'Sendle', trackingUrl: 'https://track.sendle.com/tracking?ref=' },
  { key: 'couriersplease', label: 'Couriers Please', trackingUrl: 'https://www.couriersplease.com.au/tools-track?cpno=' },
  { key: 'startrack', label: 'StarTrack', trackingUrl: 'https://startrack.com.au/track/track.html?id=' },
  { key: 'other', label: 'Other', trackingUrl: '' },
];

const PACKING_CHECKLIST = [
  { id: 1, text: 'Remove the cap and store separately', icon: 'remove-circle-outline' as const },
  { id: 2, text: 'Secure the sprayer with tape to prevent leaks', icon: 'bandage-outline' as const },
  { id: 3, text: 'Wrap bottle in bubble wrap (2+ layers)', icon: 'layers-outline' as const },
  { id: 4, text: 'Place in a rigid box with padding on all sides', icon: 'cube-outline' as const },
  { id: 5, text: 'Include your username note inside', icon: 'document-text-outline' as const },
  { id: 6, text: 'Seal securely and label "FRAGILE"', icon: 'warning-outline' as const },
];

type ShippingStatus = 'awaiting_lock' | 'locked' | 'packing' | 'shipped' | 'in_transit' | 'delivered' | 'received';

export function ShippingTracker({
  swap,
  isInitiator,
  onUpdateTracking,
  onConfirmReceived,
  userShippingAddress,
  partnerShippingAddress,
}: ShippingTrackerProps) {
  const [showPackingGuide, setShowPackingGuide] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('auspost');
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // Determine shipping status for this user
  const myTracking = isInitiator ? swap.initiator_tracking : swap.recipient_tracking;
  const theirTracking = isInitiator ? swap.recipient_tracking : swap.initiator_tracking;
  const myShippedAt = isInitiator ? swap.initiator_shipped_at : swap.recipient_shipped_at;
  const theirShippedAt = isInitiator ? swap.recipient_shipped_at : swap.initiator_shipped_at;
  const myReceivedAt = isInitiator ? swap.initiator_received_at : swap.recipient_received_at;
  const theirReceivedAt = isInitiator ? swap.recipient_received_at : swap.initiator_received_at;

  const getMyStatus = (): ShippingStatus => {
    if (swap.status === 'accepted') return 'awaiting_lock';
    if (swap.status === 'locked' && !myTracking) return 'packing';
    if (myTracking && !theirReceivedAt) return 'shipped';
    if (theirReceivedAt) return 'received';
    return 'locked';
  };

  const getTheirStatus = (): ShippingStatus => {
    if (swap.status === 'accepted') return 'awaiting_lock';
    if (swap.status === 'locked' && !theirTracking) return 'packing';
    if (theirTracking && !myReceivedAt) return 'in_transit';
    if (myReceivedAt) return 'delivered';
    return 'locked';
  };

  const myStatus = getMyStatus();
  const theirStatus = getTheirStatus();

  const handleSubmitTracking = async () => {
    if (!trackingNumber.trim()) return;
    setIsUpdating(true);
    try {
      await onUpdateTracking(trackingNumber.trim(), selectedCarrier);
      setTrackingNumber('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmReceived = async () => {
    setIsUpdating(true);
    try {
      await onConfirmReceived();
    } finally {
      setIsUpdating(false);
    }
  };

  const openTrackingUrl = (tracking: string, carrier?: string) => {
    const carrierInfo = CARRIERS.find(c => c.key === carrier) || CARRIERS[0];
    if (carrierInfo.trackingUrl) {
      Linking.openURL(carrierInfo.trackingUrl + tracking);
    }
  };

  const toggleCheckItem = (id: number) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: ShippingStatus) => {
    switch (status) {
      case 'received':
      case 'delivered':
        return '#10B981';
      case 'shipped':
      case 'in_transit':
        return Colors.light.primary;
      case 'packing':
        return '#F59E0B';
      default:
        return Colors.light.textSecondary;
    }
  };

  const getStatusLabel = (status: ShippingStatus, isMine: boolean) => {
    switch (status) {
      case 'awaiting_lock':
        return 'Awaiting Lock';
      case 'locked':
        return 'Swap Locked';
      case 'packing':
        return isMine ? 'Pack & Ship' : 'Packing...';
      case 'shipped':
        return 'Shipped';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'received':
        return 'Confirmed Received';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      {/* Status Overview */}
      <View style={styles.statusOverview}>
        <View style={styles.statusColumn}>
          <Text style={styles.statusLabel}>Your Shipment</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(myStatus) + '20' }]}>
            <Ionicons 
              name={myStatus === 'received' ? 'checkmark-circle' : 'cube-outline'} 
              size={16} 
              color={getStatusColor(myStatus)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(myStatus) }]}>
              {getStatusLabel(myStatus, true)}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusDivider}>
          <Ionicons name="swap-horizontal" size={24} color={Colors.light.border} />
        </View>
        
        <View style={styles.statusColumn}>
          <Text style={styles.statusLabel}>Their Shipment</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(theirStatus) + '20' }]}>
            <Ionicons 
              name={theirStatus === 'delivered' ? 'checkmark-circle' : 'cube-outline'} 
              size={16} 
              color={getStatusColor(theirStatus)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(theirStatus) }]}>
              {getStatusLabel(theirStatus, false)}
            </Text>
          </View>
        </View>
      </View>

      {/* Shipping Address (only show when locked) */}
      {swap.status === 'locked' && partnerShippingAddress && (
        <View style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <Ionicons name="location-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.addressTitle}>Ship To</Text>
          </View>
          <Text style={styles.addressText}>{partnerShippingAddress}</Text>
        </View>
      )}

      {/* Packing Guide Button */}
      {myStatus === 'packing' && (
        <TouchableOpacity 
          style={styles.packingGuideButton}
          onPress={() => setShowPackingGuide(true)}
        >
          <Ionicons name="book-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.packingGuideText}>View Packing Guide</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      )}

      {/* Tracking Input (when user needs to ship) */}
      {myStatus === 'packing' && (
        <View style={styles.trackingInputSection}>
          <Text style={styles.sectionTitle}>Enter Tracking Details</Text>
          
          {/* Carrier Selection */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.carrierScroll}
          >
            {CARRIERS.map(carrier => (
              <TouchableOpacity
                key={carrier.key}
                style={[
                  styles.carrierOption,
                  selectedCarrier === carrier.key && styles.carrierOptionSelected
                ]}
                onPress={() => setSelectedCarrier(carrier.key)}
              >
                <Text style={[
                  styles.carrierText,
                  selectedCarrier === carrier.key && styles.carrierTextSelected
                ]}>
                  {carrier.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Tracking Number Input */}
          <View style={styles.trackingInputRow}>
            <TextInput
              style={styles.trackingInput}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="Enter tracking number"
              placeholderTextColor={Colors.light.textSecondary}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                !trackingNumber.trim() && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitTracking}
              disabled={!trackingNumber.trim() || isUpdating}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={trackingNumber.trim() ? '#FFFFFF' : Colors.light.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* My Tracking Display */}
      {myTracking && (
        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <Ionicons name="cube" size={20} color={Colors.light.primary} />
            <Text style={styles.trackingTitle}>Your Package</Text>
            <View style={[styles.shippedBadge, { backgroundColor: '#10B981' + '20' }]}>
              <Text style={[styles.shippedText, { color: '#10B981' }]}>Shipped</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.trackingNumberRow}
            onPress={() => openTrackingUrl(myTracking)}
          >
            <Text style={styles.trackingNumber}>{myTracking}</Text>
            <Ionicons name="open-outline" size={16} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Their Tracking Display */}
      {theirTracking && (
        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <Ionicons name="cube" size={20} color="#E8927C" />
            <Text style={styles.trackingTitle}>Incoming Package</Text>
            <View style={[styles.shippedBadge, { backgroundColor: Colors.light.primary + '20' }]}>
              <Text style={[styles.shippedText, { color: Colors.light.primary }]}>In Transit</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.trackingNumberRow}
            onPress={() => openTrackingUrl(theirTracking)}
          >
            <Text style={styles.trackingNumber}>{theirTracking}</Text>
            <Ionicons name="open-outline" size={16} color={Colors.light.primary} />
          </TouchableOpacity>
          
          {/* Confirm Received Button */}
          {!myReceivedAt && (
            <Button
              title="Confirm Package Received"
              onPress={handleConfirmReceived}
              loading={isUpdating}
              icon={<Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
              style={{ marginTop: 12 }}
            />
          )}
        </View>
      )}

      {/* Packing Guide Modal */}
      <Modal
        visible={showPackingGuide}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPackingGuide(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Packing Guide</Text>
            <TouchableOpacity onPress={() => setShowPackingGuide(false)}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Follow these steps to ensure your fragrance arrives safely
            </Text>
            
            {PACKING_CHECKLIST.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItem}
                onPress={() => toggleCheckItem(item.id)}
              >
                <View style={[
                  styles.checkbox,
                  checkedItems.includes(item.id) && styles.checkboxChecked
                ]}>
                  {checkedItems.includes(item.id) && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Ionicons name={item.icon} size={24} color={Colors.light.primary} />
                <Text style={[
                  styles.checklistText,
                  checkedItems.includes(item.id) && styles.checklistTextChecked
                ]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}
            
            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>
                Pro tip: Take a photo of your packed item before sealing. 
                This can help resolve any disputes if the package is damaged in transit.
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              title="Got it, Let's Ship!"
              onPress={() => setShowPackingGuide(false)}
              icon={<Ionicons name="cube" size={20} color="#FFFFFF" />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusDivider: {
    paddingHorizontal: 12,
  },
  addressCard: {
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  addressText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  packingGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary + '10',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  packingGuideText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.primary,
  },
  trackingInputSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  carrierScroll: {
    marginBottom: 12,
  },
  carrierOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  carrierOptionSelected: {
    backgroundColor: Colors.light.primary + '20',
    borderColor: Colors.light.primary,
  },
  carrierText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  carrierTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  trackingInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trackingInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  submitButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  trackingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trackingTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  shippedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shippedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  trackingNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    letterSpacing: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  checklistTextChecked: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
});

