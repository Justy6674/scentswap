/**
 * Fragrance Recognition Component
 * AI-powered fragrance identification from photos
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
  TextInput,
  Modal
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  photos: Record<string, string>;
  onComplete: (recognition: RecognitionResults) => void;
  onBack: () => void;
}

interface FragranceSuggestion {
  id: string;
  name: string;
  brand: string;
  concentration: string;
  size: string;
  confidence: number;
  imageUrl?: string;
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  releaseYear?: number;
  averagePrice?: number;
}

interface RecognitionResults {
  suggestions: FragranceSuggestion[];
  selectedSuggestion?: FragranceSuggestion;
  manualEntry?: {
    name: string;
    brand: string;
    concentration: string;
    size: string;
  };
  processingMetadata: {
    processingTime: number;
    modelVersion: string;
    confidenceThreshold: number;
  };
}

export default function FragranceRecognition({ photos, onComplete, onBack }: Props) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [suggestions, setSuggestions] = useState<FragranceSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<FragranceSuggestion | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    name: '',
    brand: '',
    concentration: '',
    size: ''
  });
  const [processingStage, setProcessingStage] = useState('Initialising AI analysis...');

  useEffect(() => {
    processPhotos();
  }, [photos]);

  const processPhotos = async () => {
    setIsProcessing(true);

    try {
      // Simulate AI processing stages
      setProcessingStage('Analysing bottle shape and design...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProcessingStage('Reading brand name and text...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      setProcessingStage('Matching against fragrance database...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStage('Calculating confidence scores...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock AI recognition results - Phase 1: Top 1 suggestion only
      const mockSuggestions: FragranceSuggestion[] = [
        {
          id: '1',
          name: 'Sauvage',
          brand: 'Dior',
          concentration: 'Eau de Toilette',
          size: '100ml',
          confidence: 0.92,
          notes: {
            top: ['Bergamot', 'Pepper'],
            middle: ['Sichuan Pepper', 'Lavender', 'Pink Pepper'],
            base: ['Ambroxan', 'Cedar', 'Labdanum']
          },
          releaseYear: 2015,
          averagePrice: 145
        }
      ];

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Recognition error:', error);
      Alert.alert(
        'Recognition Failed',
        'Unable to automatically identify this fragrance. You can enter the details manually.',
        [
          { text: 'Try Manual Entry', onPress: () => setShowManualEntry(true) },
          { text: 'Go Back', onPress: onBack }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionSelect = (suggestion: FragranceSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const confirmSelection = () => {
    if (!selectedSuggestion) return;

    const results: RecognitionResults = {
      suggestions,
      selectedSuggestion,
      processingMetadata: {
        processingTime: 4.5,
        modelVersion: 'FragranceVision-v2.1',
        confidenceThreshold: 0.75
      }
    };

    onComplete(results);
  };

  const handleManualEntry = () => {
    if (!manualData.name.trim() || !manualData.brand.trim()) {
      Alert.alert('Missing Information', 'Please enter at least the fragrance name and brand.');
      return;
    }

    const results: RecognitionResults = {
      suggestions: [],
      manualEntry: manualData,
      processingMetadata: {
        processingTime: 0,
        modelVersion: 'manual-entry',
        confidenceThreshold: 1.0
      }
    };

    onComplete(results);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#22c55e'; // Green
    if (confidence >= 0.75) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.75) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>AI Recognition</Text>
            <Text style={styles.headerSubtitle}>Analysing your photos</Text>
          </View>
        </View>

        <View style={styles.processingContainer}>
          <View style={styles.photoPreview}>
            {photos.front && (
              <Image source={{ uri: photos.front }} style={styles.processingImage} />
            )}
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#b68a71" />
            </View>
          </View>

          <View style={styles.processingContent}>
            <View style={styles.processingIcon}>
              <Ionicons name="sparkles" size={32} color="#b68a71" />
            </View>

            <Text style={styles.processingTitle}>AI Analysis in Progress</Text>
            <Text style={styles.processingStage}>{processingStage}</Text>

            <View style={styles.processingSteps}>
              <Text style={styles.processingStepsTitle}>What we're doing:</Text>
              <View style={styles.processingStep}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.processingStepText}>Image quality assessment</Text>
              </View>
              <View style={styles.processingStep}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.processingStepText}>Brand and text recognition</Text>
              </View>
              <View style={styles.processingStep}>
                <Ionicons name="radio-button-off" size={16} color="#b68a71" />
                <Text style={styles.processingStepText}>Database matching</Text>
              </View>
              <View style={styles.processingStep}>
                <Ionicons name="radio-button-off" size={16} color="#475569" />
                <Text style={styles.processingStepText}>Confidence calculation</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={16} color="#f59e0b" />
          <Text style={styles.disclaimerText}>
            AI identification is advisory only. Please verify the suggestion matches your fragrance.
          </Text>
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
          <Text style={styles.headerTitle}>
            {suggestions.length > 0 ? 'Recognition Results' : 'Manual Entry'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {suggestions.length > 0 ? 'AI has analysed your photos' : 'Enter fragrance details'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {suggestions.length > 0 ? (
          <>
            {/* AI Results */}
            <View style={styles.resultsHeader}>
              <View style={styles.resultsIcon}>
                <Ionicons name="sparkles" size={24} color="#b68a71" />
              </View>
              <View style={styles.resultsInfo}>
                <Text style={styles.resultsTitle}>AI Identification Complete</Text>
                <Text style={styles.resultsSubtitle}>
                  Found {suggestions.length} match{suggestions.length !== 1 ? 'es' : ''}
                </Text>
              </View>
            </View>

            {/* Suggestions */}
            <View style={styles.suggestionsContainer}>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[
                    styles.suggestionCard,
                    selectedSuggestion?.id === suggestion.id && styles.suggestionCardSelected
                  ]}
                  onPress={() => handleSuggestionSelect(suggestion)}
                >
                  <View style={styles.suggestionHeader}>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>{suggestion.name}</Text>
                      <Text style={styles.suggestionBrand}>{suggestion.brand}</Text>
                      <Text style={styles.suggestionDetails}>
                        {suggestion.concentration} • {suggestion.size}
                        {suggestion.releaseYear && ` • ${suggestion.releaseYear}`}
                      </Text>
                    </View>

                    <View style={styles.confidenceContainer}>
                      <View
                        style={[
                          styles.confidenceBadge,
                          { backgroundColor: getConfidenceColor(suggestion.confidence) }
                        ]}
                      >
                        <Text style={styles.confidenceText}>
                          {(suggestion.confidence * 100).toFixed(0)}%
                        </Text>
                      </View>
                      <Text style={styles.confidenceLabel}>
                        {getConfidenceText(suggestion.confidence)}
                      </Text>
                    </View>
                  </View>

                  {suggestion.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesTitle}>Fragrance Notes:</Text>
                      <View style={styles.notesRow}>
                        <Text style={styles.notesLabel}>Top:</Text>
                        <Text style={styles.notesValue}>
                          {suggestion.notes.top.join(', ')}
                        </Text>
                      </View>
                      <View style={styles.notesRow}>
                        <Text style={styles.notesLabel}>Heart:</Text>
                        <Text style={styles.notesValue}>
                          {suggestion.notes.middle.join(', ')}
                        </Text>
                      </View>
                      <View style={styles.notesRow}>
                        <Text style={styles.notesLabel}>Base:</Text>
                        <Text style={styles.notesValue}>
                          {suggestion.notes.base.join(', ')}
                        </Text>
                      </View>
                    </View>
                  )}

                  {suggestion.averagePrice && (
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Typical Australian Price:</Text>
                      <Text style={styles.priceValue}>${suggestion.averagePrice}</Text>
                    </View>
                  )}

                  {selectedSuggestion?.id === suggestion.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                      <Text style={styles.selectedText}>Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Alternative Option */}
            <View style={styles.alternativeSection}>
              <Text style={styles.alternativeTitle}>Not quite right?</Text>
              <TouchableOpacity
                style={styles.alternativeButton}
                onPress={() => setShowManualEntry(true)}
              >
                <Ionicons name="create" size={20} color="#b68a71" />
                <Text style={styles.alternativeButtonText}>Enter Details Manually</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Manual Entry Form */}
            <View style={styles.manualContainer}>
              <View style={styles.manualHeader}>
                <Ionicons name="create" size={24} color="#b68a71" />
                <Text style={styles.manualTitle}>Enter Fragrance Details</Text>
                <Text style={styles.manualSubtitle}>
                  Please provide the fragrance information manually
                </Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fragrance Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Sauvage, Aventus, Black Opium"
                    placeholderTextColor="#94a3b8"
                    value={manualData.name}
                    onChangeText={(text) => setManualData(prev => ({ ...prev, name: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Brand *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Dior, Creed, YSL"
                    placeholderTextColor="#94a3b8"
                    value={manualData.brand}
                    onChangeText={(text) => setManualData(prev => ({ ...prev, brand: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Concentration</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Eau de Toilette, Parfum"
                    placeholderTextColor="#94a3b8"
                    value={manualData.concentration}
                    onChangeText={(text) => setManualData(prev => ({ ...prev, concentration: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Size</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 100ml, 50ml, 3.4oz"
                    placeholderTextColor="#94a3b8"
                    value={manualData.size}
                    onChangeText={(text) => setManualData(prev => ({ ...prev, size: text }))}
                  />
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.continueContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (selectedSuggestion || (manualData.name.trim() && manualData.brand.trim())) && styles.continueButtonEnabled
          ]}
          onPress={suggestions.length > 0 ? confirmSelection : handleManualEntry}
          disabled={!selectedSuggestion && !(manualData.name.trim() && manualData.brand.trim())}
        >
          <Text style={styles.continueButtonText}>
            Continue to Next Step
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={16} color="#f59e0b" />
        <Text style={styles.disclaimerText}>
          Please verify all details are accurate before proceeding. AI suggestions are estimates only.
        </Text>
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowManualEntry(false)}
      >
        <View style={[styles.container, { backgroundColor: '#334155' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowManualEntry(false)}
            >
              <Ionicons name="close" size={24} color="#f8fafc" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Manual Entry</Text>
          </View>
          {/* Manual entry form would go here - similar to above */}
        </View>
      </Modal>
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
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
  },
  processingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  processingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  processingStage: {
    fontSize: 16,
    color: '#b68a71',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  processingSteps: {
    alignSelf: 'stretch',
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
  },
  processingStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  processingStepText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  resultsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsInfo: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  suggestionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  suggestionCard: {
    backgroundColor: '#475569',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suggestionCardSelected: {
    borderColor: '#b68a71',
    backgroundColor: '#1e293b',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  suggestionInfo: {
    flex: 1,
    marginRight: 16,
  },
  suggestionName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  suggestionBrand: {
    fontSize: 16,
    color: '#b68a71',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  suggestionDetails: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  notesContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b68a71',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  notesRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    width: 50,
    fontFamily: 'Inter',
  },
  notesValue: {
    fontSize: 12,
    color: '#cbd5e1',
    flex: 1,
    fontFamily: 'Inter',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  priceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
    fontFamily: 'Inter',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
    fontFamily: 'Inter',
  },
  alternativeSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  alternativeTitle: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#475569',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  alternativeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b68a71',
    fontFamily: 'Inter',
  },
  manualContainer: {
    paddingVertical: 20,
  },
  manualHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  manualTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  manualSubtitle: {
    fontSize: 14,
    color: '#b68a71',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  textInput: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: 'transparent',
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
    backgroundColor: '#475569',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonEnabled: {
    backgroundColor: '#b68a71',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginLeft: 12,
    fontFamily: 'Inter',
  },
});