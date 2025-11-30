import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface AIChange {
  field: string;
  fieldLabel: string;
  current: any;
  suggested: any;
  confidence: number;
  sources?: string[];
  reasoning?: string;
}

interface AISuggestionsModalProps {
  visible: boolean;
  onClose: () => void;
  fragranceName: string;
  fragranceBrand: string;
  changes: AIChange[];
  overallConfidence: number;
  isLoading?: boolean;
  onApplyChanges: (selectedChanges: AIChange[]) => void;
  onRetryWithInfo: (additionalInfo: string) => void;
}

const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({
  visible,
  onClose,
  fragranceName,
  fragranceBrand,
  changes,
  overallConfidence,
  isLoading = false,
  onApplyChanges,
  onRetryWithInfo,
}) => {
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set(changes.map(c => c.field)));
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const toggleChange = (field: string) => {
    setSelectedChanges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedChanges.size === changes.length) {
      setSelectedChanges(new Set());
    } else {
      setSelectedChanges(new Set(changes.map(c => c.field)));
    }
  };

  const handleApply = () => {
    const selected = changes.filter(c => selectedChanges.has(c.field));
    onApplyChanges(selected);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10B981';
    if (confidence >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not set';
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Empty';
    }
    return String(value);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>AI Suggestions</Text>
              <Text style={styles.subtitle}>
                {fragranceName} by {fragranceBrand}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#999999" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Analyzing fragrance data...</Text>
            <Text style={styles.loadingSubtext}>
              Researching official sources, retailers, and databases
            </Text>
          </View>
        ) : (
          <>
            {/* Confidence Score */}
            <View style={styles.confidenceCard}>
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>Overall Confidence</Text>
                <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(overallConfidence) }]}>
                  <Text style={styles.confidenceValue}>{overallConfidence}%</Text>
                </View>
              </View>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceBarFill,
                    { width: `${overallConfidence}%`, backgroundColor: getConfidenceColor(overallConfidence) }
                  ]}
                />
              </View>
              <Text style={styles.confidenceHint}>
                {overallConfidence >= 80 ? '✓ High confidence - suggested changes are reliable' :
                 overallConfidence >= 60 ? '⚠ Medium confidence - review changes carefully' :
                 '⚠ Low confidence - consider providing more information'}
              </Text>
            </View>

            {/* Changes List */}
            <View style={styles.changesHeader}>
              <Text style={styles.changesTitle}>
                {changes.length} suggested {changes.length === 1 ? 'change' : 'changes'}
              </Text>
              <TouchableOpacity onPress={toggleAll} style={styles.selectAllButton}>
                <Ionicons
                  name={selectedChanges.size === changes.length ? 'checkbox' : 'square-outline'}
                  size={20}
                  color="#8B5CF6"
                />
                <Text style={styles.selectAllText}>
                  {selectedChanges.size === changes.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.changesList} showsVerticalScrollIndicator={false}>
              {changes.map((change) => (
                <View key={change.field} style={styles.changeCard}>
                  <TouchableOpacity
                    style={styles.changeHeader}
                    onPress={() => toggleChange(change.field)}
                  >
                    <Ionicons
                      name={selectedChanges.has(change.field) ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={selectedChanges.has(change.field) ? '#8B5CF6' : '#666666'}
                    />
                    <View style={styles.changeInfo}>
                      <Text style={styles.fieldLabel}>{change.fieldLabel}</Text>
                      <View style={[styles.fieldConfidence, { backgroundColor: getConfidenceColor(change.confidence) }]}>
                        <Text style={styles.fieldConfidenceText}>{change.confidence}%</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setExpandedField(expandedField === change.field ? null : change.field)}
                      style={styles.expandButton}
                    >
                      <Ionicons
                        name={expandedField === change.field ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#999999"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  <View style={styles.changeValues}>
                    <View style={styles.valueRow}>
                      <View style={[styles.valueBox, styles.currentValue]}>
                        <Text style={styles.valueLabel}>Current</Text>
                        <Text style={styles.valueText} numberOfLines={2}>
                          {formatValue(change.current)}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={20} color="#666666" style={styles.arrow} />
                      <View style={[styles.valueBox, styles.suggestedValue]}>
                        <Text style={styles.valueLabel}>Suggested</Text>
                        <Text style={styles.valueText} numberOfLines={2}>
                          {formatValue(change.suggested)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {expandedField === change.field && (
                    <View style={styles.expandedContent}>
                      {change.reasoning && (
                        <View style={styles.reasoningBox}>
                          <Text style={styles.reasoningLabel}>
                            <Ionicons name="bulb-outline" size={14} color="#F59E0B" /> Reasoning
                          </Text>
                          <Text style={styles.reasoningText}>{change.reasoning}</Text>
                        </View>
                      )}
                      {change.sources && change.sources.length > 0 && (
                        <View style={styles.sourcesBox}>
                          <Text style={styles.sourcesLabel}>
                            <Ionicons name="link-outline" size={14} color="#3B82F6" /> Sources
                          </Text>
                          {change.sources.map((source, idx) => (
                            <Text key={idx} style={styles.sourceText}>• {source}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={() => onRetryWithInfo('')}
              >
                <Ionicons name="refresh" size={18} color="#8B5CF6" />
                <Text style={styles.retryButtonText}>Retry with More Info</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.applyButton,
                  selectedChanges.size === 0 && styles.disabledButton
                ]}
                onPress={handleApply}
                disabled={selectedChanges.size === 0}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>
                  Apply {selectedChanges.size} {selectedChanges.size === 1 ? 'Change' : 'Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  confidenceCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  confidenceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#3a3a3a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceHint: {
    fontSize: 13,
    color: '#999999',
  },
  changesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  changesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllText: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  changesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  changeCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  changeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  changeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  fieldConfidence: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  fieldConfidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  expandButton: {
    padding: 4,
  },
  changeValues: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  currentValue: {
    backgroundColor: '#3a3a3a',
  },
  suggestedValue: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  valueLabel: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    color: '#ffffff',
  },
  arrow: {
    marginHorizontal: 4,
  },
  expandedContent: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    gap: 12,
  },
  reasoningBox: {
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
  },
  reasoningLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 6,
  },
  reasoningText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  sourcesBox: {
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
  },
  sourcesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 6,
  },
  sourceText: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  retryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  applyButton: {
    backgroundColor: '#8B5CF6',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.5,
  },
});

export default AISuggestionsModal;
