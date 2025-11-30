/**
 * Condition Assessment Component
 * Fill level estimation and bottle condition evaluation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import type { UploadIntent, FragranceData } from './FragranceUploadFlow';

interface Props {
  photos: Record<string, string>;
  fragranceData: FragranceData;
  intent: UploadIntent;
  onComplete: (condition: FragranceData['condition']) => void;
  onBack: () => void;
}

interface ConditionData {
  fillPercentage?: number;
  aiFillEstimate?: number;
  userOverride?: boolean;
  bottleCondition?: 'excellent' | 'good' | 'fair' | 'poor';
  defects?: string[];
  notes?: string;
}

const DEFECT_OPTIONS = [
  { id: 'scratches', label: 'Minor scratches on bottle', category: 'cosmetic' },
  { id: 'chips', label: 'Chips or cracks in glass', category: 'structural' },
  { id: 'label_damage', label: 'Label damage or peeling', category: 'cosmetic' },
  { id: 'cap_issues', label: 'Cap/sprayer issues', category: 'functional' },
  { id: 'discoloration', label: 'Liquid discoloration', category: 'quality' },
  { id: 'leakage', label: 'Evidence of leakage', category: 'quality' },
  { id: 'missing_parts', label: 'Missing parts (cap, sprayer)', category: 'structural' },
  { id: 'box_damage', label: 'Box damage (if applicable)', category: 'packaging' },
];

export default function ConditionAssessment({
  photos,
  fragranceData,
  intent,
  onComplete,
  onBack
}: Props) {
  const [isAnalysing, setIsAnalysing] = useState(true);
  const [aiFillEstimate, setAiFillEstimate] = useState<number>(0);
  const [userFillLevel, setUserFillLevel] = useState<number>(0);
  const [hasUserOverride, setHasUserOverride] = useState(false);
  const [bottleCondition, setBottleCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [conditionNotes, setConditionNotes] = useState('');
  const [analysisStage, setAnalysisStage] = useState('Analysing liquid level...');

  useEffect(() => {
    performAIAnalysis();
  }, []);

  const performAIAnalysis = async () => {
    setIsAnalysing(true);

    try {
      // Stage 1: Liquid level analysis
      setAnalysisStage('Analysing liquid level from photos...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock AI liquid level detection
      const mockFillLevel = 75; // 75% full
      setAiFillEstimate(mockFillLevel);
      setUserFillLevel(mockFillLevel);

      // Stage 2: Bottle condition analysis
      setAnalysisStage('Assessing bottle condition...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Stage 3: Defect detection
      setAnalysisStage('Checking for defects and damage...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock condition assessment
      setBottleCondition('good');

    } catch (error) {
      console.error('Condition analysis error:', error);
      Alert.alert(
        'Analysis Error',
        'Unable to automatically assess condition. Please set manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleFillLevelChange = (value: number) => {
    setUserFillLevel(value);
    if (Math.abs(value - aiFillEstimate) > 10) {
      setHasUserOverride(true);
    } else {
      setHasUserOverride(false);
    }
  };

  const toggleDefect = (defectId: string) => {
    setSelectedDefects(prev =>
      prev.includes(defectId)
        ? prev.filter(id => id !== defectId)
        : [...prev, defectId]
    );
  };

  const handleContinue = () => {
    const conditionData: ConditionData = {
      fillPercentage: userFillLevel,
      aiFillEstimate,
      userOverride: hasUserOverride,
      bottleCondition,
      defects: selectedDefects,
      notes: conditionNotes.trim() || undefined
    };

    onComplete(conditionData);
  };

  const getFillLevelColor = (percentage: number) => {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 50) return '#f59e0b';
    if (percentage >= 20) return '#ef4444';
    return '#dc2626';
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return '#22c55e';
      case 'good': return '#84cc16';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConditionDescription = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'Like new condition, no visible wear or defects';
      case 'good':
        return 'Minor wear, fully functional, good appearance';
      case 'fair':
        return 'Some wear or minor defects, still functional';
      case 'poor':
        return 'Significant wear, defects, or functional issues';
      default:
        return '';
    }
  };

  if (isAnalysing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Condition Assessment</Text>
            <Text style={styles.headerSubtitle}>AI analysis in progress</Text>
          </View>
        </View>

        <View style={styles.analysisContainer}>
          <View style={styles.analysisPhotoSection}>
            <Text style={styles.analysisPhotoTitle}>Analysing Photos</Text>
            <View style={styles.analysisPhotos}>
              {photos.front && (
                <View style={styles.analysisPhotoContainer}>
                  <Image source={{ uri: photos.front }} style={styles.analysisPhoto} />
                  <Text style={styles.analysisPhotoLabel}>Front</Text>
                </View>
              )}
              {photos.side && (
                <View style={styles.analysisPhotoContainer}>
                  <Image source={{ uri: photos.side }} style={styles.analysisPhoto} />
                  <Text style={styles.analysisPhotoLabel}>Side</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.analysisProgress}>
            <View style={styles.analysisIcon}>
              <ActivityIndicator size="large" color="#b68a71" />
            </View>

            <Text style={styles.analysisTitle}>AI Condition Analysis</Text>
            <Text style={styles.analysisStage}>{analysisStage}</Text>

            <View style={styles.analysisSteps}>
              <View style={styles.analysisStep}>
                <Ionicons name="water" size={20} color="#3b82f6" />
                <Text style={styles.analysisStepText}>Liquid level detection</Text>
              </View>
              <View style={styles.analysisStep}>
                <Ionicons name="search" size={20} color="#8b5cf6" />
                <Text style={styles.analysisStepText}>Bottle condition assessment</Text>
              </View>
              <View style={styles.analysisStep}>
                <Ionicons name="warning" size={20} color="#f59e0b" />
                <Text style={styles.analysisStepText}>Defect detection</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Condition Assessment</Text>
          <Text style={styles.headerSubtitle}>Review and adjust details</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fill Level Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="water" size={24} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Fill Level</Text>
          </View>

          <View style={styles.fillLevelContainer}>
            <View style={styles.aiEstimateCard}>
              <Text style={styles.aiEstimateLabel}>AI Estimate</Text>
              <Text style={[
                styles.aiEstimateValue,
                { color: getFillLevelColor(aiFillEstimate) }
              ]}>
                {aiFillEstimate}%
              </Text>
              <Text style={styles.aiEstimateNote}>
                Based on side photo analysis
              </Text>
            </View>

            <View style={styles.userAdjustment}>
              <Text style={styles.sliderLabel}>
                Your Adjustment: {userFillLevel}%
                {hasUserOverride && (
                  <Text style={styles.overrideIndicator}> (Adjusted)</Text>
                )}
              </Text>

              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={userFillLevel}
                  onValueChange={handleFillLevelChange}
                  minimumTrackTintColor={getFillLevelColor(userFillLevel)}
                  maximumTrackTintColor="#475569"
                  thumbStyle={styles.sliderThumb}
                  step={5}
                />

                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>Empty</Text>
                  <Text style={styles.sliderLabelText}>Full</Text>
                </View>
              </View>

              {hasUserOverride && (
                <View style={styles.overrideWarning}>
                  <Ionicons name="warning" size={16} color="#f59e0b" />
                  <Text style={styles.overrideWarningText}>
                    Significant difference from AI estimate. Please double-check.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Overall Condition */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Overall Condition</Text>
          </View>

          <View style={styles.conditionOptions}>
            {(['excellent', 'good', 'fair', 'poor'] as const).map((condition) => (
              <TouchableOpacity
                key={condition}
                style={[
                  styles.conditionOption,
                  bottleCondition === condition && [
                    styles.conditionOptionSelected,
                    { borderColor: getConditionColor(condition) }
                  ]
                ]}
                onPress={() => setBottleCondition(condition)}
              >
                <View style={styles.conditionHeader}>
                  <Text style={[
                    styles.conditionTitle,
                    bottleCondition === condition && { color: getConditionColor(condition) }
                  ]}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </Text>
                  {bottleCondition === condition && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={getConditionColor(condition)}
                    />
                  )}
                </View>
                <Text style={styles.conditionDescription}>
                  {getConditionDescription(condition)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Defects & Issues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={24} color="#ef4444" />
            <Text style={styles.sectionTitle}>Defects & Issues</Text>
            <Text style={styles.sectionSubtitle}>Select any that apply</Text>
          </View>

          <View style={styles.defectsContainer}>
            {DEFECT_OPTIONS.map((defect) => (
              <TouchableOpacity
                key={defect.id}
                style={[
                  styles.defectOption,
                  selectedDefects.includes(defect.id) && styles.defectOptionSelected
                ]}
                onPress={() => toggleDefect(defect.id)}
              >
                <View style={[
                  styles.defectCheckbox,
                  selectedDefects.includes(defect.id) && styles.defectCheckboxSelected
                ]}>
                  {selectedDefects.includes(defect.id) && (
                    <Ionicons name="checkmark" size={16} color="#f8fafc" />
                  )}
                </View>
                <Text style={styles.defectLabel}>{defect.label}</Text>
                <Text style={styles.defectCategory}>{defect.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#6b7280" />
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.sectionSubtitle}>Optional details</Text>
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="Add any additional condition notes, history, or details..."
            placeholderTextColor="#94a3b8"
            value={conditionNotes}
            onChangeText={setConditionNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Condition Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Condition Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Fill Level</Text>
              <Text style={[
                styles.summaryValue,
                { color: getFillLevelColor(userFillLevel) }
              ]}>
                {userFillLevel}%
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Condition</Text>
              <Text style={[
                styles.summaryValue,
                { color: getConditionColor(bottleCondition) }
              ]}>
                {bottleCondition.charAt(0).toUpperCase() + bottleCondition.slice(1)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Issues</Text>
              <Text style={styles.summaryValue}>
                {selectedDefects.length === 0 ? 'None' : `${selectedDefects.length} noted`}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.continueContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {intent === 'library' ? 'Add to Collection' : 'Continue to Authenticity Check'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={16} color="#f59e0b" />
        <Text style={styles.disclaimerText}>
          Honest condition assessment helps build trust in the ScentSwap community.
          {intent === 'marketplace' && ' This affects your listing\'s estimated value.'}
        </Text>
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
  analysisContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  analysisPhotoSection: {
    marginBottom: 32,
  },
  analysisPhotoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  analysisPhotos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  analysisPhotoContainer: {
    alignItems: 'center',
  },
  analysisPhoto: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#475569',
  },
  analysisPhotoLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  analysisProgress: {
    alignItems: 'center',
  },
  analysisIcon: {
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  analysisStage: {
    fontSize: 14,
    color: '#b68a71',
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  analysisSteps: {
    gap: 12,
  },
  analysisStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analysisStepText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 'auto',
    fontFamily: 'Inter',
  },
  fillLevelContainer: {
    gap: 20,
  },
  aiEstimateCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  aiEstimateLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  aiEstimateValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  aiEstimateNote: {
    fontSize: 12,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  userAdjustment: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  overrideIndicator: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  sliderContainer: {
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#b68a71',
    width: 20,
    height: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  overrideWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  overrideWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#f59e0b',
    fontFamily: 'Inter',
  },
  conditionOptions: {
    gap: 12,
  },
  conditionOption: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  conditionOptionSelected: {
    backgroundColor: '#1e293b',
    borderWidth: 2,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  conditionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  conditionDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  defectsContainer: {
    gap: 8,
  },
  defectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#475569',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  defectOptionSelected: {
    backgroundColor: '#1e293b',
  },
  defectCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defectCheckboxSelected: {
    backgroundColor: '#b68a71',
    borderColor: '#b68a71',
  },
  defectLabel: {
    flex: 1,
    fontSize: 14,
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  defectCategory: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  notesInput: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#f8fafc',
    minHeight: 100,
    fontFamily: 'Inter',
  },
  summarySection: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  continueContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b68a71',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    margin: 20,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    fontFamily: 'Inter',
  },
});