/**
 * RatingForm Component
 * 
 * Post-swap rating form with multiple categories
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from './Button';
import { User } from '@/types';

interface RatingFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: RatingData) => Promise<void>;
  swapPartner: User;
  swapId: string;
}

export interface RatingData {
  swap_id: string;
  ratee_id: string;
  overall_score: number;
  item_accuracy: number;
  communication: number;
  shipping_speed: number;
  packaging_quality: number;
  comment: string;
  would_trade_again: boolean;
}

interface RatingCategory {
  key: keyof Pick<RatingData, 'item_accuracy' | 'communication' | 'shipping_speed' | 'packaging_quality'>;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const RATING_CATEGORIES: RatingCategory[] = [
  {
    key: 'item_accuracy',
    label: 'Item Accuracy',
    description: 'Was the item as described?',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'How was their responsiveness?',
    icon: 'chatbubble-outline',
  },
  {
    key: 'shipping_speed',
    label: 'Shipping Speed',
    description: 'How quickly did they ship?',
    icon: 'rocket-outline',
  },
  {
    key: 'packaging_quality',
    label: 'Packaging Quality',
    description: 'Was it packed safely?',
    icon: 'cube-outline',
  },
];

export function RatingForm({
  visible,
  onClose,
  onSubmit,
  swapPartner,
  swapId,
}: RatingFormProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    item_accuracy: 0,
    communication: 0,
    shipping_speed: 0,
    packaging_quality: 0,
  });
  const [comment, setComment] = useState('');
  const [wouldTradeAgain, setWouldTradeAgain] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setRating = (category: string, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const calculateOverall = () => {
    const values = Object.values(ratings);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return values.length > 0 ? Math.round(sum / values.length) : 0;
  };

  const canSubmit = () => {
    return (
      Object.values(ratings).every(r => r > 0) &&
      wouldTradeAgain !== null
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        swap_id: swapId,
        ratee_id: swapPartner.id,
        overall_score: calculateOverall(),
        item_accuracy: ratings.item_accuracy,
        communication: ratings.communication,
        shipping_speed: ratings.shipping_speed,
        packaging_quality: ratings.packaging_quality,
        comment: comment.trim(),
        would_trade_again: wouldTradeAgain!,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (category: string, currentValue: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(category, star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentValue ? 'star' : 'star-outline'}
              size={28}
              color={star <= currentValue ? '#F59E0B' : Colors.light.border}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Your Swap</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Partner Info */}
          <View style={styles.partnerCard}>
            <View style={styles.partnerAvatar}>
              <Text style={styles.partnerAvatarText}>
                {swapPartner.username?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{swapPartner.username}</Text>
              <Text style={styles.partnerSubtext}>
                How was your experience trading with them?
              </Text>
            </View>
          </View>

          {/* Overall Score Preview */}
          <View style={styles.overallContainer}>
            <Text style={styles.overallLabel}>Overall Score</Text>
            <View style={styles.overallScoreRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name={star <= calculateOverall() ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= calculateOverall() ? '#F59E0B' : Colors.light.border}
                />
              ))}
            </View>
            <Text style={styles.overallValue}>
              {calculateOverall() > 0 ? `${calculateOverall()}/5` : 'Rate below to calculate'}
            </Text>
          </View>

          {/* Rating Categories */}
          {RATING_CATEGORIES.map(category => (
            <View key={category.key} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Ionicons name={category.icon} size={20} color={Colors.light.primary} />
                <View style={styles.categoryTextContainer}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>
              </View>
              {renderStars(category.key, ratings[category.key])}
            </View>
          ))}

          {/* Would Trade Again */}
          <View style={styles.tradeAgainCard}>
            <Text style={styles.tradeAgainLabel}>Would you trade with them again?</Text>
            <View style={styles.tradeAgainOptions}>
              <TouchableOpacity
                style={[
                  styles.tradeAgainButton,
                  wouldTradeAgain === true && styles.tradeAgainButtonYes,
                ]}
                onPress={() => setWouldTradeAgain(true)}
              >
                <Ionicons
                  name="thumbs-up"
                  size={24}
                  color={wouldTradeAgain === true ? '#FFFFFF' : '#10B981'}
                />
                <Text
                  style={[
                    styles.tradeAgainText,
                    wouldTradeAgain === true && styles.tradeAgainTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tradeAgainButton,
                  wouldTradeAgain === false && styles.tradeAgainButtonNo,
                ]}
                onPress={() => setWouldTradeAgain(false)}
              >
                <Ionicons
                  name="thumbs-down"
                  size={24}
                  color={wouldTradeAgain === false ? '#FFFFFF' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.tradeAgainText,
                    wouldTradeAgain === false && styles.tradeAgainTextSelected,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comment */}
          <View style={styles.commentCard}>
            <Text style={styles.commentLabel}>Additional Comments (Optional)</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience..."
              placeholderTextColor={Colors.light.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.commentCount}>{comment.length}/500</Text>
          </View>

          {/* Guidelines */}
          <View style={styles.guidelinesCard}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.guidelinesText}>
              Your rating helps build trust in the ScentSwap community. 
              Be honest and constructive in your feedback.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Submit Rating"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!canSubmit()}
            icon={<Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    marginBottom: 20,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  partnerSubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  overallContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 20,
  },
  overallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  overallScoreRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  overallValue: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  categoryDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  tradeAgainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tradeAgainLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  tradeAgainOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  tradeAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  tradeAgainButtonYes: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  tradeAgainButtonNo: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  tradeAgainText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  tradeAgainTextSelected: {
    color: '#FFFFFF',
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  commentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  commentCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  guidelinesCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    marginBottom: 20,
  },
  guidelinesText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
});

