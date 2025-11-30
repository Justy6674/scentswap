/**
 * Final Review Component
 * Complete summary and submission for fragrance upload
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { UploadIntent, FragranceData } from './FragranceUploadFlow';

interface Props {
  fragranceData: FragranceData;
  intent: UploadIntent;
  onSubmit: () => void;
  onBack: () => void;
}

interface ListingPreferences {
  isPublic: boolean;
  acceptPartialSwaps: boolean;
  requireShipping: boolean;
  notifications: boolean;
}

export default function FinalReview({
  fragranceData,
  intent,
  onSubmit,
  onBack
}: Props) {
  const [listingPreferences, setListingPreferences] = useState<ListingPreferences>({
    isPublic: intent === 'marketplace',
    acceptPartialSwaps: true,
    requireShipping: false,
    notifications: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      Alert.alert(
        'Terms Required',
        'Please agree to the terms and conditions before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      onSubmit();
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert(
        'Submission Failed',
        'Unable to submit your fragrance. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePreference = (key: keyof ListingPreferences, value: boolean) => {
    setListingPreferences(prev => ({ ...prev, [key]: value }));
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'excellent': return '#22c55e';
      case 'good': return '#84cc16';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'likely_authentic': return '#22c55e';
      case 'unclear': return '#f59e0b';
      case 'higher_risk': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatPrice = (price: number) => `$${price}`;

  const selectedFragrance = fragranceData.recognitionResults?.selectedSuggestion;
  const manualEntry = fragranceData.recognitionResults?.manualEntry;
  const fragrance = selectedFragrance || manualEntry;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Final Review</Text>
          <Text style={styles.headerSubtitle}>
            {intent === 'library' ? 'Add to collection' : 'List for swap'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fragrance Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>Ready to Submit</Text>
              <Text style={styles.summarySubtitle}>
                {intent === 'library' ? 'Personal collection' : 'Marketplace listing'}
              </Text>
            </View>
          </View>

          {/* Photos Preview */}
          <View style={styles.photosPreview}>
            <Text style={styles.sectionTitle}>Photos ({Object.keys(fragranceData.photos).length})</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photosScroll}
              contentContainerStyle={styles.photosContainer}
            >
              {Object.entries(fragranceData.photos).map(([key, uri]) => (
                <View key={key} style={styles.photoPreview}>
                  <Image source={{ uri }} style={styles.photoPreviewImage} />
                  <Text style={styles.photoPreviewLabel}>
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Fragrance Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Fragrance Details</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{fragrance?.name || 'Not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Brand</Text>
              <Text style={styles.detailValue}>{fragrance?.brand || 'Not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{fragrance?.concentration || 'Not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{fragrance?.size || 'Not specified'}</Text>
            </View>

            {selectedFragrance && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>AI Confidence</Text>
                <Text style={[styles.detailValue, { color: '#b68a71' }]}>
                  {(selectedFragrance.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Condition Summary */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Condition</Text>

          <View style={styles.conditionSummary}>
            <View style={styles.conditionMain}>
              <View style={styles.fillLevelContainer}>
                <Text style={styles.fillLevelValue}>{fragranceData.condition.fillPercentage}%</Text>
                <Text style={styles.fillLevelLabel}>Full</Text>
              </View>

              <View style={styles.conditionInfo}>
                <Text style={[
                  styles.conditionValue,
                  { color: getConditionColor(fragranceData.condition.bottleCondition) }
                ]}>
                  {fragranceData.condition.bottleCondition?.charAt(0).toUpperCase() +
                   fragranceData.condition.bottleCondition?.slice(1) || 'Not assessed'}
                </Text>
                <Text style={styles.conditionLabel}>Condition</Text>
              </View>
            </View>

            {fragranceData.condition.defects && fragranceData.condition.defects.length > 0 && (
              <View style={styles.defectsContainer}>
                <Text style={styles.defectsTitle}>Issues Noted:</Text>
                {fragranceData.condition.defects.slice(0, 3).map((defect, index) => (
                  <Text key={index} style={styles.defectItem}>• {defect}</Text>
                ))}
                {fragranceData.condition.defects.length > 3 && (
                  <Text style={styles.defectItem}>
                    • +{fragranceData.condition.defects.length - 3} more
                  </Text>
                )}
              </View>
            )}

            {fragranceData.condition.userOverride && (
              <View style={styles.overrideNotice}>
                <Ionicons name="warning" size={16} color="#f59e0b" />
                <Text style={styles.overrideNoticeText}>
                  Fill level adjusted from AI estimate
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Marketplace-specific sections */}
        {intent === 'marketplace' && (
          <>
            {/* Authenticity Assessment */}
            {fragranceData.authenticity && (
              <View style={styles.detailsCard}>
                <Text style={styles.cardTitle}>Authenticity Assessment</Text>

                <View style={styles.authenticityContainer}>
                  <View style={styles.authenticityStatus}>
                    <Ionicons
                      name="shield-checkmark"
                      size={24}
                      color={getRiskLevelColor(fragranceData.authenticity.riskLevel)}
                    />
                    <View style={styles.authenticityInfo}>
                      <Text style={[
                        styles.authenticityValue,
                        { color: getRiskLevelColor(fragranceData.authenticity.riskLevel) }
                      ]}>
                        {fragranceData.authenticity.riskLevel === 'likely_authentic' ? 'Likely Authentic' :
                         fragranceData.authenticity.riskLevel === 'unclear' ? 'Unclear' : 'Higher Risk'}
                      </Text>
                      <Text style={styles.authenticityConfidence}>
                        {(fragranceData.authenticity.confidenceScore * 100).toFixed(0)}% confidence
                      </Text>
                    </View>
                  </View>

                  {fragranceData.authenticity.riskFactors.length > 0 && (
                    <View style={styles.riskFactorsNotice}>
                      <Text style={styles.riskFactorsText}>
                        {fragranceData.authenticity.riskFactors.length} potential concern(s) detected
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Valuation */}
            {fragranceData.valuation && (
              <View style={styles.detailsCard}>
                <Text style={styles.cardTitle}>Market Valuation</Text>

                <View style={styles.valuationContainer}>
                  <View style={styles.valuationRange}>
                    <View style={styles.pricePoint}>
                      <Text style={styles.priceValue}>
                        {formatPrice(fragranceData.valuation.estimatedMin)}
                      </Text>
                      <Text style={styles.priceLabel}>Minimum</Text>
                    </View>

                    <View style={styles.priceConnector}>
                      <Text style={styles.priceConnectorText}>to</Text>
                    </View>

                    <View style={styles.pricePoint}>
                      <Text style={styles.priceValue}>
                        {formatPrice(fragranceData.valuation.estimatedMax)}
                      </Text>
                      <Text style={styles.priceLabel}>Maximum</Text>
                    </View>
                  </View>

                  <View style={styles.valuationMeta}>
                    <Text style={styles.valuationConfidence}>
                      {(fragranceData.valuation.confidence * 100).toFixed(0)}% confidence
                    </Text>
                    <Text style={styles.valuationNote}>Australian market estimate</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Listing Preferences */}
            <View style={styles.preferencesCard}>
              <Text style={styles.cardTitle}>Listing Preferences</Text>

              <View style={styles.preferencesList}>
                <View style={styles.preferenceItem}>
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceTitle}>Public Listing</Text>
                    <Text style={styles.preferenceDescription}>
                      Make this fragrance visible to all ScentSwap users
                    </Text>
                  </View>
                  <Switch
                    value={listingPreferences.isPublic}
                    onValueChange={(value) => updatePreference('isPublic', value)}
                    trackColor={{ false: '#475569', true: '#b68a71' }}
                    thumbColor={listingPreferences.isPublic ? '#f8fafc' : '#cbd5e1'}
                  />
                </View>

                <View style={styles.preferenceItem}>
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceTitle}>Accept Partial Swaps</Text>
                    <Text style={styles.preferenceDescription}>
                      Allow trades where value differences are covered by cash
                    </Text>
                  </View>
                  <Switch
                    value={listingPreferences.acceptPartialSwaps}
                    onValueChange={(value) => updatePreference('acceptPartialSwaps', value)}
                    trackColor={{ false: '#475569', true: '#b68a71' }}
                    thumbColor={listingPreferences.acceptPartialSwaps ? '#f8fafc' : '#cbd5e1'}
                  />
                </View>

                <View style={styles.preferenceItem}>
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceTitle}>Swap Notifications</Text>
                    <Text style={styles.preferenceDescription}>
                      Get notified when someone wants to swap with you
                    </Text>
                  </View>
                  <Switch
                    value={listingPreferences.notifications}
                    onValueChange={(value) => updatePreference('notifications', value)}
                    trackColor={{ false: '#475569', true: '#b68a71' }}
                    thumbColor={listingPreferences.notifications ? '#f8fafc' : '#cbd5e1'}
                  />
                </View>
              </View>
            </View>
          </>
        )}

        {/* Terms Agreement */}
        <View style={styles.termsCard}>
          <Text style={styles.cardTitle}>Terms & Conditions</Text>

          <TouchableOpacity
            style={styles.termsAgreement}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View style={[
              styles.checkbox,
              agreedToTerms && styles.checkboxChecked
            ]}>
              {agreedToTerms && (
                <Ionicons name="checkmark" size={16} color="#f8fafc" />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree that the information provided is accurate and I understand that
              {intent === 'marketplace' && ' AI assessments are estimates only and '}
              I am responsible for the authenticity and condition of this fragrance.
            </Text>
          </TouchableOpacity>

          {intent === 'marketplace' && (
            <View style={styles.marketplaceTerms}>
              <Text style={styles.marketplaceTermsText}>
                By listing for swap, you agree to ScentSwap's community guidelines,
                dispute resolution process, and understand that all valuations are estimates.
              </Text>
            </View>
          )}
        </View>

        {/* Final Disclaimers */}
        <View style={styles.disclaimersCard}>
          <Text style={styles.disclaimersTitle}>Important Reminders</Text>

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.disclaimerText}>
              AI analysis results are advisory only and not guarantees of authenticity or condition.
            </Text>
          </View>

          {intent === 'marketplace' && (
            <>
              <View style={styles.disclaimer}>
                <Ionicons name="trending-up" size={20} color="#22c55e" />
                <Text style={styles.disclaimerText}>
                  Market valuations are estimates based on Australian retail and community data.
                </Text>
              </View>

              <View style={styles.disclaimer}>
                <Ionicons name="shield-checkmark" size={20} color="#f59e0b" />
                <Text style={styles.disclaimerText}>
                  You are responsible for ensuring all information is accurate before listing.
                </Text>
              </View>
            </>
          )}

          <View style={styles.disclaimer}>
            <Ionicons name="heart" size={20} color="#ef4444" />
            <Text style={styles.disclaimerText}>
              ScentSwap relies on honest community members to maintain trust and quality.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!agreedToTerms || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!agreedToTerms || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color="#f8fafc" />
              <Text style={styles.submitButtonText}>
                {intent === 'library' ? 'Adding to Collection...' : 'Creating Listing...'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.submitButtonText}>
                {intent === 'library' ? 'Add to My Collection' : 'List for Swap'}
              </Text>
              <Ionicons name="checkmark" size={20} color="#f8fafc" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 250, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: '#475569',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  photosPreview: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  photosScroll: {
    marginHorizontal: -4,
  },
  photosContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  photoPreview: {
    alignItems: 'center',
  },
  photoPreviewImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginBottom: 4,
  },
  photoPreviewLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  detailsCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  conditionSummary: {
    gap: 16,
  },
  conditionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  fillLevelContainer: {
    alignItems: 'center',
  },
  fillLevelValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3b82f6',
    fontFamily: 'Inter',
  },
  fillLevelLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  conditionInfo: {
    alignItems: 'center',
  },
  conditionValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  conditionLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  defectsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
  },
  defectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  defectItem: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  overrideNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
  },
  overrideNoticeText: {
    fontSize: 12,
    color: '#f59e0b',
    fontFamily: 'Inter',
  },
  authenticityContainer: {
    gap: 12,
  },
  authenticityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authenticityInfo: {
    flex: 1,
  },
  authenticityValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  authenticityConfidence: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  riskFactorsNotice: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  riskFactorsText: {
    fontSize: 12,
    color: '#f59e0b',
    fontFamily: 'Inter',
  },
  valuationContainer: {
    gap: 16,
  },
  valuationRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricePoint: {
    alignItems: 'center',
    flex: 1,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#22c55e',
    fontFamily: 'Inter',
  },
  priceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  priceConnector: {
    paddingHorizontal: 16,
  },
  priceConnectorText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  valuationMeta: {
    alignItems: 'center',
  },
  valuationConfidence: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  valuationNote: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  preferencesCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  preferencesList: {
    gap: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  termsCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  termsAgreement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#b68a71',
    borderColor: '#b68a71',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  marketplaceTerms: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  marketplaceTermsText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    fontFamily: 'Inter',
  },
  disclaimersCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  disclaimersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
    fontFamily: 'Inter',
  },
  submitContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b68a71',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
});