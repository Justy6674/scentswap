/**
 * PremiumGate Component
 * 
 * Gates premium features and shows upgrade prompts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Button } from './Button';
import { 
  useSubscription, 
  PremiumFeature, 
  SUBSCRIPTION_PLANS,
  SubscriptionTier 
} from '@/contexts/SubscriptionContext';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Feature descriptions for upgrade prompts
const FEATURE_INFO: Record<PremiumFeature, { title: string; description: string; icon: keyof typeof Ionicons.glyphMap }> = {
  unlimited_listings: {
    title: 'Unlimited Listings',
    description: 'List as many fragrances as you want',
    icon: 'infinite-outline',
  },
  priority_matching: {
    title: 'Priority Matching',
    description: 'Get matched with swap partners faster',
    icon: 'rocket-outline',
  },
  advanced_analytics: {
    title: 'Advanced Analytics',
    description: 'Track your collection value and swap history',
    icon: 'analytics-outline',
  },
  instant_messaging: {
    title: 'Instant Messaging',
    description: 'Real-time chat with swap partners',
    icon: 'chatbubbles-outline',
  },
  photo_verification: {
    title: 'AI Photo Verification',
    description: 'Advanced authenticity checks on your bottles',
    icon: 'shield-checkmark-outline',
  },
  no_ads: {
    title: 'Ad-Free Experience',
    description: 'Browse without interruptions',
    icon: 'eye-off-outline',
  },
  early_access: {
    title: 'Early Access',
    description: 'Try new features before everyone else',
    icon: 'star-outline',
  },
  premium_badge: {
    title: 'Premium Badge',
    description: 'Stand out with a special profile badge',
    icon: 'ribbon-outline',
  },
  bulk_upload: {
    title: 'Bulk Upload',
    description: 'Add multiple listings at once',
    icon: 'cloud-upload-outline',
  },
  export_data: {
    title: 'Export Data',
    description: 'Download your swap history and analytics',
    icon: 'download-outline',
  },
};

/**
 * Wraps content that requires a premium feature.
 * Shows children if user has access, otherwise shows upgrade prompt.
 */
export function PremiumGate({ feature, children, fallback }: PremiumGateProps) {
  const { hasFeature } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const featureInfo = FEATURE_INFO[feature];

  return (
    <>
      <TouchableOpacity
        style={styles.lockedContainer}
        onPress={() => setShowUpgradeModal(true)}
      >
        <View style={styles.lockedIcon}>
          <Ionicons name="lock-closed" size={24} color={Colors.light.primary} />
        </View>
        <Text style={styles.lockedTitle}>{featureInfo.title}</Text>
        <Text style={styles.lockedDescription}>
          Upgrade to Premium to unlock this feature
        </Text>
        <View style={styles.upgradeButton}>
          <Ionicons name="arrow-up-circle" size={16} color={Colors.light.primary} />
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </View>
      </TouchableOpacity>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        highlightFeature={feature}
      />
    </>
  );
}

/**
 * Inline premium badge that can be clicked to show upgrade modal
 */
export function PremiumBadge({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.premiumBadge} onPress={onPress}>
      <Ionicons name="star" size={12} color="#F59E0B" />
      <Text style={styles.premiumBadgeText}>Premium</Text>
    </TouchableOpacity>
  );
}

/**
 * Shows remaining listings count and upgrade prompt if near limit
 */
export function ListingLimitIndicator({ currentCount }: { currentCount: number }) {
  const { getMaxListings, canAddListing, subscription } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const maxListings = getMaxListings();
  const isUnlimited = maxListings === -1;
  const remaining = isUnlimited ? -1 : maxListings - currentCount;
  const isNearLimit = !isUnlimited && remaining <= 2;
  const isAtLimit = !isUnlimited && remaining <= 0;

  if (isUnlimited) {
    return (
      <View style={styles.limitIndicator}>
        <Ionicons name="infinite" size={16} color="#10B981" />
        <Text style={styles.limitTextUnlimited}>Unlimited listings</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.limitIndicator,
          isAtLimit && styles.limitIndicatorAtLimit,
          isNearLimit && !isAtLimit && styles.limitIndicatorNearLimit,
        ]}
        onPress={() => setShowUpgradeModal(true)}
        disabled={!isNearLimit}
      >
        <Ionicons
          name={isAtLimit ? 'warning' : 'layers-outline'}
          size={16}
          color={isAtLimit ? '#EF4444' : isNearLimit ? '#F59E0B' : Colors.light.textSecondary}
        />
        <Text style={[
          styles.limitText,
          isAtLimit && styles.limitTextAtLimit,
          isNearLimit && !isAtLimit && styles.limitTextNearLimit,
        ]}>
          {isAtLimit
            ? 'Listing limit reached'
            : `${remaining} of ${maxListings} listings remaining`}
        </Text>
        {isNearLimit && (
          <View style={styles.upgradeChip}>
            <Text style={styles.upgradeChipText}>Upgrade</Text>
          </View>
        )}
      </TouchableOpacity>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        highlightFeature="unlimited_listings"
      />
    </>
  );
}

/**
 * Full upgrade modal with plan comparison
 */
export function UpgradeModal({ 
  visible, 
  onClose, 
  highlightFeature 
}: { 
  visible: boolean; 
  onClose: () => void;
  highlightFeature?: PremiumFeature;
}) {
  const { subscription, upgradeToPremium, upgradeToElite } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('premium');

  const plans: SubscriptionTier[] = ['premium', 'elite'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Upgrade Your Experience</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <LinearGradient
            colors={[Colors.light.primary, '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Ionicons name="diamond" size={48} color="#FFFFFF" />
            <Text style={styles.heroTitle}>Unlock Premium Features</Text>
            <Text style={styles.heroSubtitle}>
              Get more from your fragrance trading experience
            </Text>
          </LinearGradient>

          {/* Plan Selection */}
          <View style={styles.planSelector}>
            {plans.map(tier => {
              const plan = SUBSCRIPTION_PLANS[tier];
              const isSelected = selectedPlan === tier;
              
              return (
                <TouchableOpacity
                  key={tier}
                  style={[
                    styles.planOption,
                    isSelected && styles.planOptionSelected,
                    tier === 'elite' && styles.planOptionElite,
                  ]}
                  onPress={() => setSelectedPlan(tier)}
                >
                  {tier === 'elite' && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>Best Value</Text>
                    </View>
                  )}
                  <Text style={[
                    styles.planName,
                    isSelected && styles.planNameSelected,
                  ]}>
                    {plan.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={[
                      styles.planPrice,
                      isSelected && styles.planPriceSelected,
                    ]}>
                      ${plan.price}
                    </Text>
                    <Text style={[
                      styles.planPeriod,
                      isSelected && styles.planPeriodSelected,
                    ]}>
                      /month
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feature List */}
          <View style={styles.featureList}>
            <Text style={styles.featureListTitle}>
              {selectedPlan === 'elite' ? 'Everything in Premium, plus:' : 'Premium includes:'}
            </Text>
            
            {SUBSCRIPTION_PLANS[selectedPlan].features.map(feature => {
              const info = FEATURE_INFO[feature];
              const isHighlighted = feature === highlightFeature;
              
              return (
                <View 
                  key={feature} 
                  style={[
                    styles.featureItem,
                    isHighlighted && styles.featureItemHighlighted,
                  ]}
                >
                  <View style={[
                    styles.featureIcon,
                    isHighlighted && styles.featureIconHighlighted,
                  ]}>
                    <Ionicons 
                      name={info.icon} 
                      size={20} 
                      color={isHighlighted ? Colors.light.primary : '#10B981'} 
                    />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{info.title}</Text>
                    <Text style={styles.featureDescription}>{info.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Listing Limit */}
          <View style={styles.limitComparison}>
            <View style={styles.limitComparisonItem}>
              <Text style={styles.limitComparisonLabel}>Free</Text>
              <Text style={styles.limitComparisonValue}>5 listings</Text>
            </View>
            <View style={styles.limitComparisonItem}>
              <Text style={styles.limitComparisonLabel}>Premium</Text>
              <Text style={styles.limitComparisonValue}>25 listings</Text>
            </View>
            <View style={styles.limitComparisonItem}>
              <Text style={styles.limitComparisonLabel}>Elite</Text>
              <Text style={[styles.limitComparisonValue, { color: '#F59E0B' }]}>Unlimited</Text>
            </View>
          </View>

          {/* Guarantee */}
          <View style={styles.guarantee}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.guaranteeText}>
              30-day money-back guarantee. Cancel anytime.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.modalFooter}>
          <Button
            title={`Upgrade to ${SUBSCRIPTION_PLANS[selectedPlan].name} - $${SUBSCRIPTION_PLANS[selectedPlan].price}/mo`}
            onPress={selectedPlan === 'elite' ? upgradeToElite : upgradeToPremium}
            icon={<Ionicons name="diamond" size={20} color="#FFFFFF" />}
          />
          <Text style={styles.footerNote}>
            Powered by Outseta • Secure payment
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Locked container styles
  lockedContainer: {
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
    borderStyle: 'dashed',
  },
  lockedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  lockedDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },

  // Premium badge
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },

  // Limit indicator
  limitIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  limitIndicatorNearLimit: {
    backgroundColor: '#FEF3C7',
  },
  limitIndicatorAtLimit: {
    backgroundColor: '#FEE2E2',
  },
  limitText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  limitTextNearLimit: {
    color: '#92400E',
  },
  limitTextAtLimit: {
    color: '#991B1B',
  },
  limitTextUnlimited: {
    fontSize: 13,
    color: '#10B981',
  },
  upgradeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  upgradeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
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
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalContent: {
    flex: 1,
  },
  heroGradient: {
    padding: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 8,
    textAlign: 'center',
  },
  planSelector: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  planOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  planOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  planOptionElite: {
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  planNameSelected: {
    color: Colors.light.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  planPriceSelected: {
    color: Colors.light.primary,
  },
  planPeriod: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  planPeriodSelected: {
    color: Colors.light.primary,
  },
  featureList: {
    padding: 16,
  },
  featureListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  featureItemHighlighted: {
    backgroundColor: Colors.light.primary + '15',
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconHighlighted: {
    backgroundColor: Colors.light.primary + '30',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  limitComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  limitComparisonItem: {
    alignItems: 'center',
  },
  limitComparisonLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  limitComparisonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    padding: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
  },
  guaranteeText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  footerNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

