/**
 * FairnessIndicator Component
 * 
 * Visual display of swap fairness with animated meter
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FairnessResult } from '@/lib/ai-services';
import { Colors } from '@/constants/Colors';

interface FairnessIndicatorProps {
  fairness: FairnessResult;
  compact?: boolean;
}

const STATUS_CONFIG = {
  excellent: {
    color: '#10B981', // Emerald
    icon: 'checkmark-circle' as const,
    label: 'Excellent Match'
  },
  good: {
    color: Colors.light.primary, // Teal
    icon: 'thumbs-up' as const,
    label: 'Good Balance'
  },
  acceptable: {
    color: '#F59E0B', // Amber
    icon: 'alert-circle' as const,
    label: 'Acceptable'
  },
  imbalanced: {
    color: '#F97316', // Orange
    icon: 'warning' as const,
    label: 'Imbalanced'
  },
  unfair: {
    color: '#EF4444', // Red
    icon: 'close-circle' as const,
    label: 'Unfair Trade'
  }
};

export function FairnessIndicator({ fairness, compact = false }: FairnessIndicatorProps) {
  const animatedScore = useRef(new Animated.Value(0)).current;
  const config = STATUS_CONFIG[fairness.status];

  useEffect(() => {
    Animated.spring(animatedScore, {
      toValue: fairness.score,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [fairness.score]);

  const progressWidth = animatedScore.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.compactBadge, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={16} color={config.color} />
          <Text style={[styles.compactScore, { color: config.color }]}>
            {fairness.score}%
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="scale-outline" size={20} color={Colors.light.text} />
          <Text style={styles.title}>Fairness Score</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreNumber, { color: config.color }]}>
          {fairness.score}
        </Text>
        <Text style={styles.scoreLabel}>/ 100</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: config.color,
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabelText}>Imbalanced</Text>
          <Text style={styles.progressLabelText}>Balanced</Text>
        </View>
      </View>

      {/* Value Comparison */}
      <View style={styles.valueComparison}>
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>Your Offer</Text>
          <Text style={styles.valueAmount}>
            ${fairness.initiatorValue.valuePoints}
          </Text>
        </View>
        <View style={styles.valueDivider}>
          <Ionicons 
            name={fairness.difference > 0 ? "swap-horizontal" : "checkmark-circle"} 
            size={24} 
            color={config.color} 
          />
          {fairness.difference > 0 && (
            <Text style={styles.differenceText}>
              ${fairness.difference} diff
            </Text>
          )}
        </View>
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>Their Offer</Text>
          <Text style={styles.valueAmount}>
            ${fairness.recipientValue.valuePoints}
          </Text>
        </View>
      </View>

      {/* Assessment */}
      <Text style={styles.assessment}>{fairness.assessment}</Text>

      {/* Suggestions */}
      {fairness.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {fairness.suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionRow}>
              <Ionicons name="bulb-outline" size={14} color={Colors.light.primary} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 18,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabelText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  valueComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
  },
  valueBox: {
    flex: 1,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  valueDivider: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  differenceText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  assessment: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compactScore: {
    fontSize: 12,
    fontWeight: '600',
  },
});

