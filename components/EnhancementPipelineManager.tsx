/**
 * Enhancement Pipeline Manager Component
 * Admin interface for managing automated fragrance enhancement jobs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Switch,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { enhancementPipeline, AutoEnhancementJob, PipelineStats, EnhancementJobResult } from '../lib/enhancementPipeline';

interface EnhancementPipelineManagerProps {
  userEmail: string;
}

export default function EnhancementPipelineManager({ userEmail }: EnhancementPipelineManagerProps) {
  const [jobs, setJobs] = useState<AutoEnhancementJob[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [selectedJob, setSelectedJob] = useState<AutoEnhancementJob | null>(null);
  const [jobResults, setJobResults] = useState<EnhancementJobResult[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create job form state
  const [newJobData, setNewJobData] = useState({
    name: '',
    priorityLevel: 'low_quality' as 'low_quality' | 'missing_data' | 'unverified' | 'outdated_pricing',
    maxItems: 50,
    maxCostPerItem: 1.0,
    maxTotalCost: 50.0,
    australianFocus: true,
    skipVerified: true,
    selectedRetailers: [
      'Chemist Warehouse',
      'Priceline',
      'David Jones',
      'Myer'
    ]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, statsData] = await Promise.all([
        enhancementPipeline.getAllJobs(userEmail),
        enhancementPipeline.getPipelineStats()
      ]);

      setJobs(jobsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading pipeline data:', error);
      Alert.alert('Error', 'Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateSmartJob = async () => {
    try {
      const job = await enhancementPipeline.createSmartEnhancementJob(
        {
          priorityLevel: newJobData.priorityLevel,
          maxItems: newJobData.maxItems
        },
        userEmail
      );

      setJobs([job, ...jobs]);
      setShowCreateModal(false);
      resetCreateForm();

      Alert.alert('Success', `Enhancement job "${job.name}" created successfully!`);
    } catch (error) {
      console.error('Error creating job:', error);
      Alert.alert('Error', 'Failed to create enhancement job');
    }
  };

  const handleStartJob = async (jobId: string) => {
    try {
      await enhancementPipeline.startJob(jobId);
      await loadData(); // Refresh to see status change
      Alert.alert('Success', 'Job started successfully!');
    } catch (error) {
      console.error('Error starting job:', error);
      Alert.alert('Error', 'Failed to start job');
    }
  };

  const handlePauseJob = async (jobId: string) => {
    try {
      await enhancementPipeline.pauseJob(jobId);
      await loadData(); // Refresh to see status change
      Alert.alert('Success', 'Job paused successfully!');
    } catch (error) {
      console.error('Error pausing job:', error);
      Alert.alert('Error', 'Failed to pause job');
    }
  };

  const handleViewJobDetails = async (job: AutoEnhancementJob) => {
    setSelectedJob(job);
    try {
      const results = await enhancementPipeline.getJobResults(job.id);
      setJobResults(results);
    } catch (error) {
      console.error('Error loading job results:', error);
      setJobResults([]);
    }
    setShowJobDetail(true);
  };

  const resetCreateForm = () => {
    setNewJobData({
      name: '',
      priorityLevel: 'low_quality',
      maxItems: 50,
      maxCostPerItem: 1.0,
      maxTotalCost: 50.0,
      australianFocus: true,
      skipVerified: true,
      selectedRetailers: [
        'Chemist Warehouse',
        'Priceline',
        'David Jones',
        'Myer'
      ]
    });
  };

  const getJobStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'running': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'paused': return '#6b7280';
      default: return '#64748b';
    }
  };

  const getJobStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'running': return 'play-circle-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'failed': return 'close-circle-outline';
      case 'paused': return 'pause-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>📊 Pipeline Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalJobs}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.activeJobs}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalEnhancements.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Enhanced</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${stats.totalCostSpent.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Spent (AUD)</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            Success Rate: {stats.successRate.toFixed(1)}%
          </Text>
          <Text style={styles.statText}>
            Avg Quality: +{stats.averageQualityImprovement.toFixed(1)}
          </Text>
        </View>
      </View>
    );
  };

  const renderJobCard = ({ item: job }: { item: AutoEnhancementJob }) => (
    <View style={styles.jobCard}>
      {/* Job Header */}
      <View style={styles.jobHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobName} numberOfLines={2}>{job.name}</Text>
          <Text style={styles.jobCreated}>
            Created: {job.createdAt.toLocaleDateString()}
          </Text>
        </View>

        <View style={[
          styles.statusBadge,
          { backgroundColor: getJobStatusColor(job.status) }
        ]}>
          <Ionicons
            name={getJobStatusIcon(job.status) as any}
            size={16}
            color="#ffffff"
          />
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(job.progress.completed / job.progress.total) * 100}%`,
                backgroundColor: getJobStatusColor(job.status)
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {job.progress.completed}/{job.progress.total} ({Math.round((job.progress.completed / job.progress.total) * 100)}%)
        </Text>
      </View>

      {/* Job Details */}
      <View style={styles.jobDetails}>
        <Text style={styles.detailText}>
          Priority: {job.priority} • Batch: {job.batchSize}
        </Text>
        <Text style={styles.detailText}>
          Failed: {job.progress.failed} • Skipped: {job.progress.skipped}
        </Text>
        {job.progress.currentItem && (
          <Text style={styles.currentItem} numberOfLines={1}>
            Current: {job.progress.currentItem}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewJobDetails(job)}
        >
          <Ionicons name="eye-outline" size={16} color="#b68a71" />
          <Text style={styles.actionText}>Details</Text>
        </TouchableOpacity>

        {job.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => handleStartJob(job.id)}
          >
            <Ionicons name="play-outline" size={16} color="#10b981" />
            <Text style={[styles.actionText, { color: '#10b981' }]}>Start</Text>
          </TouchableOpacity>
        )}

        {job.status === 'running' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.pauseButton]}
            onPress={() => handlePauseJob(job.id)}
          >
            <Ionicons name="pause-outline" size={16} color="#f59e0b" />
            <Text style={[styles.actionText, { color: '#f59e0b' }]}>Pause</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCreateJobModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create Smart Enhancement Job</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Job Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Job Name</Text>
            <TextInput
              style={styles.textInput}
              value={newJobData.name}
              onChangeText={(text) => setNewJobData({...newJobData, name: text})}
              placeholder="Enter job name (optional)"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Priority Level */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Enhancement Priority</Text>
            {[
              { key: 'low_quality', label: 'Low Quality Data', desc: 'Fragrances with quality score < 60%' },
              { key: 'missing_data', label: 'Missing Data', desc: 'Incomplete fragrance information' },
              { key: 'unverified', label: 'Unverified', desc: 'Fragrances not yet verified' },
              { key: 'outdated_pricing', label: 'Outdated Pricing', desc: 'Price data older than 30 days' }
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionButton,
                  newJobData.priorityLevel === option.key && styles.selectedOption
                ]}
                onPress={() => setNewJobData({...newJobData, priorityLevel: option.key as any})}
              >
                <Text style={[
                  styles.optionText,
                  newJobData.priorityLevel === option.key && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDesc}>{option.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Settings */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Settings</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Max Items: {newJobData.maxItems}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.numberInput}
                  value={newJobData.maxItems.toString()}
                  onChangeText={(text) => setNewJobData({...newJobData, maxItems: parseInt(text) || 50})}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Max Cost per Item: ${newJobData.maxCostPerItem}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.numberInput}
                  value={newJobData.maxCostPerItem.toString()}
                  onChangeText={(text) => setNewJobData({...newJobData, maxCostPerItem: parseFloat(text) || 1.0})}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.settingLabel}>Australian Focus</Text>
              <Switch
                value={newJobData.australianFocus}
                onValueChange={(value) => setNewJobData({...newJobData, australianFocus: value})}
                trackColor={{ false: '#64748b', true: '#b68a71' }}
                thumbColor="#f8fafc"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.settingLabel}>Skip Verified Fragrances</Text>
              <Switch
                value={newJobData.skipVerified}
                onValueChange={(value) => setNewJobData({...newJobData, skipVerified: value})}
                trackColor={{ false: '#64748b', true: '#b68a71' }}
                thumbColor="#f8fafc"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSmartJob}
            disabled={!newJobData.maxItems}
          >
            <Text style={styles.createButtonText}>Create Enhancement Job</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Enhancement Pipeline</Text>
        <TouchableOpacity
          style={styles.createJobButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.createJobText}>New Job</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      {renderStatsCard()}

      {/* Jobs List */}
      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.jobsList}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color="#64748b" />
            <Text style={styles.emptyTitle}>No Enhancement Jobs</Text>
            <Text style={styles.emptyText}>
              Create your first smart enhancement job to improve fragrance data quality
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Job Modal */}
      {renderCreateJobModal()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  createJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b68a71',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createJobText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#475569',
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#b68a71',
  },
  statLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  jobsList: {
    padding: 20,
    paddingTop: 0,
  },
  jobCard: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  jobName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  jobCreated: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#64748b',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  jobDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  currentItem: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#b68a71',
  },
  startButton: {
    borderColor: '#10b981',
  },
  pauseButton: {
    borderColor: '#f59e0b',
  },
  actionText: {
    color: '#b68a71',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#475569',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#64748b',
  },
  optionButton: {
    backgroundColor: '#64748b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#1e293b',
    borderColor: '#b68a71',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  selectedOptionText: {
    color: '#b68a71',
  },
  optionDesc: {
    fontSize: 12,
    color: '#94a3b8',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#e2e8f0',
    flex: 1,
  },
  inputContainer: {
    minWidth: 80,
  },
  numberInput: {
    backgroundColor: '#475569',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#f8fafc',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#64748b',
  },
  createButton: {
    backgroundColor: '#b68a71',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});