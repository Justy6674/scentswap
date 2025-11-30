/**
 * AI-Powered Fragrance Upload Flow
 * Main orchestrator for the complete fragrance upload experience
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import IntentSelectionScreen from './IntentSelectionScreen';
import PhotoCaptureFlow from './PhotoCaptureFlow';
import FragranceRecognition from './FragranceRecognition';
import ConditionAssessment from './ConditionAssessment';
import AuthenticityRisk from './AuthenticityRisk';
import ValueEstimation from './ValueEstimation';
import FinalReview from './FinalReview';

export type UploadIntent = 'library' | 'marketplace';

export interface FragranceData {
  // AI Recognition Results
  recognitionResults?: {
    suggestions: Array<{
      id: string;
      name: string;
      brand: string;
      concentration: string;
      size: string;
      confidence: number;
    }>;
    selectedSuggestion?: any;
  };

  // Photo Data
  photos: {
    front?: string;
    side?: string;
    bottom?: string;
    boxFront?: string;
    boxBottom?: string;
  };

  // Manual Confirmations
  details: {
    fragranceId?: string;
    name?: string;
    brand?: string;
    concentration?: string;
    size?: string;
    isOriginal?: boolean;
    purchaseYear?: number;
    storageConditions?: string;
    defects?: string[];
    hasBox?: boolean;
  };

  // Condition Assessment
  condition: {
    fillPercentage?: number;
    aiFillEstimate?: number;
    userOverride?: boolean;
  };

  // Risk Assessment (Marketplace only)
  authenticity?: {
    riskLevel: 'likely_authentic' | 'unclear' | 'higher_risk';
    riskFactors: string[];
    confidenceScore: number;
  };

  // Valuation (Marketplace only)
  valuation?: {
    basePrice: number;
    conditionMultiplier: number;
    rarityMultiplier: number;
    estimatedMin: number;
    estimatedMax: number;
    confidence: number;
    lastUpdated: Date;
  };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: FragranceData, intent: UploadIntent) => void;
}

type FlowStep =
  | 'intent'
  | 'photo_capture'
  | 'recognition'
  | 'condition'
  | 'authenticity'
  | 'valuation'
  | 'review';

export default function FragranceUploadFlow({ visible, onClose, onComplete }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();

  // Flow State
  const [currentStep, setCurrentStep] = useState<FlowStep>('intent');
  const [intent, setIntent] = useState<UploadIntent | null>(null);
  const [fragranceData, setFragranceData] = useState<FragranceData>({
    photos: {},
    details: {},
    condition: {}
  });
  const [loading, setLoading] = useState(false);

  // Reset flow when modal opens/closes
  useEffect(() => {
    if (visible) {
      setCurrentStep('intent');
      setIntent(null);
      setFragranceData({
        photos: {},
        details: {},
        condition: {}
      });
    }
  }, [visible]);

  const handleIntentSelection = (selectedIntent: UploadIntent) => {
    setIntent(selectedIntent);
    setCurrentStep('photo_capture');
  };

  const handlePhotoCaptureComplete = (photos: FragranceData['photos']) => {
    setFragranceData(prev => ({ ...prev, photos }));
    setCurrentStep('recognition');
  };

  const handleRecognitionComplete = (recognition: any) => {
    setFragranceData(prev => ({ ...prev, recognitionResults: recognition }));
    setCurrentStep('condition');
  };

  const handleConditionComplete = (condition: FragranceData['condition']) => {
    setFragranceData(prev => ({ ...prev, condition }));

    // For library intent, skip to review
    if (intent === 'library') {
      setCurrentStep('review');
    } else {
      setCurrentStep('authenticity');
    }
  };

  const handleAuthenticityComplete = (authenticity: FragranceData['authenticity']) => {
    setFragranceData(prev => ({ ...prev, authenticity }));
    setCurrentStep('valuation');
  };

  const handleValuationComplete = (valuation: FragranceData['valuation']) => {
    setFragranceData(prev => ({ ...prev, valuation }));
    setCurrentStep('review');
  };

  const handleFinalSubmit = () => {
    if (!intent) return;
    onComplete(fragranceData, intent);
    onClose();
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'intent':
        onClose();
        break;
      case 'photo_capture':
        setCurrentStep('intent');
        break;
      case 'recognition':
        setCurrentStep('photo_capture');
        break;
      case 'condition':
        setCurrentStep('recognition');
        break;
      case 'authenticity':
        setCurrentStep('condition');
        break;
      case 'valuation':
        setCurrentStep('authenticity');
        break;
      case 'review':
        if (intent === 'library') {
          setCurrentStep('condition');
        } else {
          setCurrentStep('valuation');
        }
        break;
    }
  };

  const getStepInfo = () => {
    const steps = intent === 'library'
      ? ['Intent', 'Photos', 'Recognition', 'Condition', 'Review']
      : ['Intent', 'Photos', 'Recognition', 'Condition', 'Authenticity', 'Valuation', 'Review'];

    const stepIndex = {
      intent: 0,
      photo_capture: 1,
      recognition: 2,
      condition: 3,
      authenticity: 4,
      valuation: 5,
      review: intent === 'library' ? 4 : 6
    }[currentStep];

    return {
      current: stepIndex + 1,
      total: steps.length,
      title: steps[stepIndex]
    };
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'intent':
        return (
          <IntentSelectionScreen
            onSelect={handleIntentSelection}
            onClose={onClose}
          />
        );

      case 'photo_capture':
        return (
          <PhotoCaptureFlow
            intent={intent!}
            onComplete={handlePhotoCaptureComplete}
            onBack={handleBack}
          />
        );

      case 'recognition':
        return (
          <FragranceRecognition
            photos={fragranceData.photos}
            onComplete={handleRecognitionComplete}
            onBack={handleBack}
          />
        );

      case 'condition':
        return (
          <ConditionAssessment
            photos={fragranceData.photos}
            fragranceData={fragranceData}
            intent={intent!}
            onComplete={handleConditionComplete}
            onBack={handleBack}
          />
        );

      case 'authenticity':
        return (
          <AuthenticityRisk
            photos={fragranceData.photos}
            fragranceData={fragranceData}
            onComplete={handleAuthenticityComplete}
            onBack={handleBack}
          />
        );

      case 'valuation':
        return (
          <ValueEstimation
            fragranceData={fragranceData}
            onComplete={handleValuationComplete}
            onBack={handleBack}
          />
        );

      case 'review':
        return (
          <FinalReview
            fragranceData={fragranceData}
            intent={intent!}
            onSubmit={handleFinalSubmit}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  if (!visible) return null;

  const stepInfo = getStepInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: '#334155' }]} edges={['top']}>
        {/* Progress Header */}
        {currentStep !== 'intent' && (
          <View style={styles.progressHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#f8fafc" />
            </TouchableOpacity>

            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Step {stepInfo.current} of {stepInfo.total}
              </Text>
              <Text style={styles.progressTitle}>{stepInfo.title}</Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(stepInfo.current / stepInfo.total) * 100}%` }
                ]}
              />
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {renderCurrentStep()}
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#b68a71" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 250, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#b68a71',
    fontFamily: 'Inter',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#b68a71',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#475569',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#f8fafc',
    marginTop: 16,
    fontFamily: 'Inter',
  },
});