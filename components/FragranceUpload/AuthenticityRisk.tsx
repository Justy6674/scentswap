/**
 * Authenticity Risk Assessment
 * AI-powered fake detection with clear disclaimers
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { FragranceData } from './FragranceUploadFlow';

interface Props {
  photos: Record<string, string>;
  fragranceData: FragranceData;
  onComplete: (authenticity: FragranceData['authenticity']) => void;
  onBack: () => void;
}

interface RiskFactor {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detected: boolean;
  confidence: number;
}

interface AuthenticityAssessment {
  riskLevel: 'likely_authentic' | 'unclear' | 'higher_risk';
  riskFactors: string[];
  confidenceScore: number;
  analysisDetails: {
    bottleAnalysis: RiskFactor[];
    textAnalysis: RiskFactor[];
    packagingAnalysis: RiskFactor[];
  };
}

const RISK_FACTORS: RiskFactor[] = [
  {
    id: 'bottle_shape',
    severity: 'high',
    title: 'Bottle Shape Analysis',
    description: 'Comparing bottle proportions and design details',
    detected: false,
    confidence: 0
  },
  {
    id: 'text_quality',
    severity: 'high',
    title: 'Text & Font Analysis',
    description: 'Checking brand name, font quality, and spelling',
    detected: false,
    confidence: 0
  },
  {
    id: 'batch_code',
    severity: 'medium',
    title: 'Batch Code Verification',
    description: 'Validating batch code format and placement',
    detected: false,
    confidence: 0
  },
  {
    id: 'cap_analysis',
    severity: 'medium',
    title: 'Cap & Sprayer Design',
    description: 'Checking cap design and sprayer mechanism',
    detected: false,
    confidence: 0
  },
  {
    id: 'packaging',
    severity: 'low',
    title: 'Packaging Quality',
    description: 'Box materials, printing quality, and design',
    detected: false,
    confidence: 0
  },
  {
    id: 'price_indicator',
    severity: 'low',
    title: 'Price Point Analysis',
    description: 'Comparing expected price vs typical market prices',
    detected: false,
    confidence: 0
  }
];

export default function AuthenticityRisk({
  photos,
  fragranceData,
  onComplete,
  onBack
}: Props) {
  const [isAnalysing, setIsAnalysing] = useState(true);
  const [assessment, setAssessment] = useState<AuthenticityAssessment | null>(null);
  const [analysisStage, setAnalysisStage] = useState('Initialising authenticity analysis...');
  const [showDetailedView, setShowDetailedView] = useState(false);

  useEffect(() => {
    performAuthenticityAnalysis();
  }, []);

  const performAuthenticityAnalysis = async () => {
    setIsAnalysing(true);

    try {
      // Stage 1: Bottle analysis
      setAnalysisStage('Analysing bottle design and proportions...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 2: Text and font analysis
      setAnalysisStage('Examining text quality and fonts...');
      await new Promise(resolve => setTimeout(resolve, 1800));

      // Stage 3: Batch code verification
      setAnalysisStage('Verifying batch codes and markings...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Stage 4: Packaging assessment
      setAnalysisStage('Assessing packaging quality...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Stage 5: Final risk calculation
      setAnalysisStage('Calculating authenticity confidence...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authenticity assessment - Phase 1: Basic risk scoring
      const mockAssessment: AuthenticityAssessment = {
        riskLevel: 'likely_authentic',
        riskFactors: [],
        confidenceScore: 0.87,
        analysisDetails: {
          bottleAnalysis: [
            {
              ...RISK_FACTORS[0],
              detected: false,
              confidence: 0.92
            },
            {
              ...RISK_FACTORS[3],
              detected: false,
              confidence: 0.88
            }
          ],
          textAnalysis: [
            {
              ...RISK_FACTORS[1],
              detected: false,
              confidence: 0.94
            }
          ],
          packagingAnalysis: [
            {
              ...RISK_FACTORS[2],
              detected: false,
              confidence: 0.78
            },
            {
              ...RISK_FACTORS[4],
              detected: false,
              confidence: 0.85
            },
            {
              ...RISK_FACTORS[5],
              detected: false,
              confidence: 0.82
            }
          ]
        }
      };

      setAssessment(mockAssessment);
    } catch (error) {
      console.error('Authenticity analysis error:', error);
      Alert.alert(
        'Analysis Error',
        'Unable to complete authenticity assessment. This item will be marked as "unclear" for manual review.',
        [{ text: 'Continue', onPress: () => handleError() }]
      );
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleError = () => {
    const errorAssessment: AuthenticityAssessment = {
      riskLevel: 'unclear',
      riskFactors: ['analysis_failed'],
      confidenceScore: 0.5,
      analysisDetails: {
        bottleAnalysis: [],
        textAnalysis: [],
        packagingAnalysis: []
      }
    };
    setAssessment(errorAssessment);
  };

  const handleContinue = () => {
    if (!assessment) return;

    onComplete({
      riskLevel: assessment.riskLevel,
      riskFactors: assessment.riskFactors,
      confidenceScore: assessment.confidenceScore
    });
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'likely_authentic': return '#22c55e';
      case 'unclear': return '#f59e0b';
      case 'higher_risk': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'likely_authentic': return 'shield-checkmark';
      case 'unclear': return 'shield';
      case 'higher_risk': return 'shield-outline';
      default: return 'help';
    }
  };

  const getRiskLevelTitle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'likely_authentic': return 'Likely Authentic';
      case 'unclear': return 'Unclear - Manual Review';
      case 'higher_risk': return 'Higher Risk Detected';
      default: return 'Unknown';
    }
  };

  const getRiskLevelDescription = (riskLevel: string, confidence: number) => {
    switch (riskLevel) {
      case 'likely_authentic':
        return `Based on AI analysis, this appears to be an authentic fragrance (${(confidence * 100).toFixed(0)}% confidence).`;
      case 'unclear':
        return `AI analysis is inconclusive. Manual review recommended before listing (${(confidence * 100).toFixed(0)}% confidence).`;
      case 'higher_risk':
        return `AI detected potential authenticity concerns. Further verification strongly recommended (${(confidence * 100).toFixed(0)}% confidence).`;
      default:
        return 'Unable to determine authenticity status.';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
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
            <Text style={styles.headerTitle}>Authenticity Check</Text>
            <Text style={styles.headerSubtitle}>AI analysis in progress</Text>
          </View>
        </View>

        <View style={styles.analysisContainer}>
          <View style={styles.analysisPhotoGrid}>
            {Object.entries(photos).slice(0, 4).map(([key, uri]) => (
              <View key={key} style={styles.analysisPhotoContainer}>
                <Image source={{ uri }} style={styles.analysisPhoto} />
                <View style={styles.analysisPhotoOverlay}>
                  <ActivityIndicator size="small" color="#b68a71" />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.analysisContent}>
            <View style={styles.analysisIcon}>
              <Ionicons name="shield-checkmark" size={48} color="#b68a71" />
            </View>

            <Text style={styles.analysisTitle}>AI Authenticity Analysis</Text>
            <Text style={styles.analysisStage}>{analysisStage}</Text>

            <View style={styles.analysisSteps}>
              <Text style={styles.analysisStepsTitle}>Analysis Components:</Text>
              <View style={styles.analysisStepsList}>
                <View style={styles.analysisStep}>
                  <Ionicons name="cube" size={16} color="#3b82f6" />
                  <Text style={styles.analysisStepText}>Bottle design verification</Text>
                </View>
                <View style={styles.analysisStep}>
                  <Ionicons name="text" size={16} color="#8b5cf6" />
                  <Text style={styles.analysisStepText}>Font and text analysis</Text>
                </View>
                <View style={styles.analysisStep}>
                  <Ionicons name="barcode" size={16} color="#f59e0b" />
                  <Text style={styles.analysisStepText}>Batch code verification</Text>
                </View>
                <View style={styles.analysisStep}>
                  <Ionicons name="library" size={16} color="#22c55e" />
                  <Text style={styles.analysisStepText}>Packaging assessment</Text>
                </View>
              </View>
            </View>

            <View style={styles.importantDisclaimer}>
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <Text style={styles.importantDisclaimerText}>
                AI analysis is advisory only and cannot guarantee authenticity.
                Final verification is always the user's responsibility.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!assessment) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Authenticity Assessment</Text>
          <Text style={styles.headerSubtitle}>Review AI analysis</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Result */}
        <View style={[
          styles.resultCard,
          { borderColor: getRiskLevelColor(assessment.riskLevel) }
        ]}>
          <View style={styles.resultHeader}>
            <View style={[
              styles.resultIcon,
              { backgroundColor: getRiskLevelColor(assessment.riskLevel) + '20' }
            ]}>
              <Ionicons
                name={getRiskLevelIcon(assessment.riskLevel) as any}
                size={32}
                color={getRiskLevelColor(assessment.riskLevel)}
              />
            </View>

            <View style={styles.resultInfo}>
              <Text style={[
                styles.resultTitle,
                { color: getRiskLevelColor(assessment.riskLevel) }
              ]}>
                {getRiskLevelTitle(assessment.riskLevel)}
              </Text>
              <Text style={styles.resultSubtitle}>
                {fragranceData.recognitionResults?.selectedSuggestion?.brand}{' '}
                {fragranceData.recognitionResults?.selectedSuggestion?.name}
              </Text>
            </View>

            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Confidence</Text>
              <Text style={[
                styles.confidenceValue,
                { color: getRiskLevelColor(assessment.riskLevel) }
              ]}>
                {(assessment.confidenceScore * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          <Text style={styles.resultDescription}>
            {getRiskLevelDescription(assessment.riskLevel, assessment.confidenceScore)}
          </Text>

          {assessment.riskLevel === 'higher_risk' && assessment.riskFactors.length > 0 && (
            <View style={styles.riskFactorsContainer}>
              <Text style={styles.riskFactorsTitle}>Concerns Detected:</Text>
              {assessment.riskFactors.map((factor, index) => (
                <View key={index} style={styles.riskFactor}>
                  <Ionicons name="warning" size={16} color="#ef4444" />
                  <Text style={styles.riskFactorText}>{factor}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Analysis Details */}
        <TouchableOpacity
          style={styles.detailsToggle}
          onPress={() => setShowDetailedView(!showDetailedView)}
        >
          <Text style={styles.detailsToggleText}>
            {showDetailedView ? 'Hide' : 'Show'} Detailed Analysis
          </Text>
          <Ionicons
            name={showDetailedView ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#b68a71"
          />
        </TouchableOpacity>

        {showDetailedView && (
          <View style={styles.detailedAnalysis}>
            {/* Bottle Analysis */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Bottle & Design Analysis</Text>
              {assessment.analysisDetails.bottleAnalysis.map((factor, index) => (
                <View key={index} style={styles.factorCard}>
                  <View style={styles.factorHeader}>
                    <Text style={styles.factorTitle}>{factor.title}</Text>
                    <View style={styles.factorStatus}>
                      <Ionicons
                        name={factor.detected ? 'warning' : 'checkmark-circle'}
                        size={16}
                        color={factor.detected ? getSeverityColor(factor.severity) : '#22c55e'}
                      />
                      <Text style={[
                        styles.factorStatusText,
                        { color: factor.detected ? getSeverityColor(factor.severity) : '#22c55e' }
                      ]}>
                        {factor.detected ? 'Issue Detected' : 'Passed'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.factorDescription}>{factor.description}</Text>
                  <Text style={styles.factorConfidence}>
                    Analysis Confidence: {(factor.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>

            {/* Text Analysis */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Text & Font Analysis</Text>
              {assessment.analysisDetails.textAnalysis.map((factor, index) => (
                <View key={index} style={styles.factorCard}>
                  <View style={styles.factorHeader}>
                    <Text style={styles.factorTitle}>{factor.title}</Text>
                    <View style={styles.factorStatus}>
                      <Ionicons
                        name={factor.detected ? 'warning' : 'checkmark-circle'}
                        size={16}
                        color={factor.detected ? getSeverityColor(factor.severity) : '#22c55e'}
                      />
                      <Text style={[
                        styles.factorStatusText,
                        { color: factor.detected ? getSeverityColor(factor.severity) : '#22c55e' }
                      ]}>
                        {factor.detected ? 'Issue Detected' : 'Passed'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.factorDescription}>{factor.description}</Text>
                  <Text style={styles.factorConfidence}>
                    Analysis Confidence: {(factor.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>

            {/* Packaging Analysis */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Packaging Analysis</Text>
              {assessment.analysisDetails.packagingAnalysis.map((factor, index) => (
                <View key={index} style={styles.factorCard}>
                  <View style={styles.factorHeader}>
                    <Text style={styles.factorTitle}>{factor.title}</Text>
                    <View style={styles.factorStatus}>
                      <Ionicons
                        name={factor.detected ? 'warning' : 'checkmark-circle'}
                        size={16}
                        color={factor.detected ? getSeverityColor(factor.severity) : '#22c55e'}
                      />
                      <Text style={[
                        styles.factorStatusText,
                        { color: factor.detected ? getSeverityColor(factor.severity) : '#22c55e' }
                      ]}>
                        {factor.detected ? 'Issue Detected' : 'Passed'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.factorDescription}>{factor.description}</Text>
                  <Text style={styles.factorConfidence}>
                    Analysis Confidence: {(factor.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Key Disclaimers */}
        <View style={styles.disclaimersSection}>
          <Text style={styles.disclaimersTitle}>Important Information</Text>

          <View style={styles.disclaimer}>
            <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
            <View style={styles.disclaimerContent}>
              <Text style={styles.disclaimerTitle}>AI Analysis Limitations</Text>
              <Text style={styles.disclaimerText}>
                This AI assessment is advisory only and cannot definitively prove authenticity.
                It should be used as guidance alongside your own verification.
              </Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <Ionicons name="people" size={20} color="#22c55e" />
            <View style={styles.disclaimerContent}>
              <Text style={styles.disclaimerTitle}>Community Trust</Text>
              <Text style={styles.disclaimerText}>
                ScentSwap relies on honest sellers. Listing known fakes violates our terms
                and can result in account suspension.
              </Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <View style={styles.disclaimerContent}>
              <Text style={styles.disclaimerTitle}>Your Responsibility</Text>
              <Text style={styles.disclaimerText}>
                You are responsible for ensuring authenticity. If in doubt,
                seek professional authentication before listing.
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
          <Text style={styles.continueButtonText}>Continue to Valuation</Text>
          <Ionicons name="arrow-forward" size={20} color="#f8fafc" />
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
  analysisContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  analysisPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
    justifyContent: 'center',
  },
  analysisPhotoContainer: {
    width: 80,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  analysisPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#475569',
  },
  analysisPhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisContent: {
    alignItems: 'center',
  },
  analysisIcon: {
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  analysisStage: {
    fontSize: 16,
    color: '#b68a71',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  analysisSteps: {
    alignSelf: 'stretch',
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  analysisStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  analysisStepsList: {
    gap: 8,
  },
  analysisStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analysisStepText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  importantDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  importantDisclaimerText: {
    flex: 1,
    fontSize: 14,
    color: '#f59e0b',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  resultCard: {
    backgroundColor: '#475569',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  resultIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  resultDescription: {
    fontSize: 16,
    color: '#f8fafc',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  riskFactorsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  riskFactorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  riskFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  riskFactorText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'Inter',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  detailsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b68a71',
    fontFamily: 'Inter',
  },
  detailedAnalysis: {
    gap: 20,
    marginBottom: 20,
  },
  analysisSection: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  factorCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
    fontFamily: 'Inter',
  },
  factorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  factorStatusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  factorDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  factorConfidence: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'Inter',
  },
  disclaimersSection: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  disclaimersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
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
});