/**
 * Intent Selection Screen
 * First step: Choose between library-only vs marketplace listing
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import type { UploadIntent } from './FragranceUploadFlow';

interface Props {
  onSelect: (intent: UploadIntent) => void;
  onClose: () => void;
}

export default function IntentSelectionScreen({ onSelect, onClose }: Props) {
  const { user } = useAuth();

  const handleLibrarySelection = () => {
    onSelect('library');
  };

  const handleMarketplaceSelection = () => {
    onSelect('marketplace');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Add a Fragrance</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to add your fragrance
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* AI-Powered Journey Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerIcon}>
            <Ionicons name="sparkles" size={24} color="#b68a71" />
          </View>
          <Text style={styles.bannerText}>
            AI-powered photo recognition and smart valuation
          </Text>
        </View>

        {/* Library Option */}
        <TouchableOpacity
          style={[styles.optionCard, styles.libraryCard]}
          onPress={handleLibrarySelection}
        >
          <View style={styles.optionHeader}>
            <View style={styles.optionIcon}>
              <Ionicons name="library" size={32} color="#b68a71" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Add to My Collection</Text>
              <Text style={styles.optionSubtitle}>Personal fragrance library</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#b68a71" />
          </View>

          <Text style={styles.optionDescription}>
            Keep track of your fragrances privately. Perfect for organising your collection and remembering what you own.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="camera" size={16} color="#b68a71" />
              <Text style={styles.featureText}>Quick photo capture</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="search" size={16} color="#b68a71" />
              <Text style={styles.featureText}>AI fragrance recognition</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={16} color="#b68a71" />
              <Text style={styles.featureText}>Private collection</Text>
            </View>
          </View>

          <View style={styles.processSteps}>
            <Text style={styles.processTitle}>Simple 3-step process:</Text>
            <Text style={styles.processStep}>1. Take a photo</Text>
            <Text style={styles.processStep}>2. Confirm AI recognition</Text>
            <Text style={styles.processStep}>3. Add to collection</Text>
          </View>
        </TouchableOpacity>

        {/* Marketplace Option */}
        <TouchableOpacity
          style={[styles.optionCard, styles.marketplaceCard]}
          onPress={handleMarketplaceSelection}
        >
          <View style={styles.optionHeader}>
            <View style={styles.optionIcon}>
              <Ionicons name="storefront" size={32} color="#b68a71" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Add & List for Swap</Text>
              <Text style={styles.optionSubtitle}>Join the marketplace</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#b68a71" />
          </View>

          <Text style={styles.optionDescription}>
            List your fragrance for swapping with other users. Get AI-powered authenticity checks and Australian market valuations.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="images" size={16} color="#b68a71" />
              <Text style={styles.featureText}>Multi-angle photos</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield" size={16} color="#b68a71" />
              <Text style={styles.featureText}>Authenticity assessment</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="trending-up" size={16} color="#b68a71" />
              <Text style={styles.featureText}>Market valuation</Text>
            </View>
          </View>

          <View style={styles.processSteps}>
            <Text style={styles.processTitle}>Complete 7-step verification:</Text>
            <Text style={styles.processStep}>1. Multiple photos</Text>
            <Text style={styles.processStep}>2. AI recognition & confirmation</Text>
            <Text style={styles.processStep}>3. Condition assessment</Text>
            <Text style={styles.processStep}>4. Authenticity risk check</Text>
            <Text style={styles.processStep}>5. Australian market valuation</Text>
            <Text style={styles.processStep}>6. Final review</Text>
            <Text style={styles.processStep}>7. List for swap</Text>
          </View>
        </TouchableOpacity>

        {/* User Authentication Notice */}
        {!user && (
          <View style={styles.authNotice}>
            <Ionicons name="information-circle" size={20} color="#b68a71" />
            <Text style={styles.authNoticeText}>
              You'll need to sign in to save fragrances to your collection or list them for swap.
            </Text>
          </View>
        )}

        {/* Legal Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            AI estimates are advisory only and not guarantees. All valuations are estimates for guidance purposes.
            Users are responsible for verifying authenticity and condition before any transactions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 250, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(182, 138, 113, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#b68a71',
  },
  bannerIcon: {
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  optionCard: {
    backgroundColor: '#475569',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  libraryCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  marketplaceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#b68a71',
    fontFamily: 'Inter',
  },
  optionDescription: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  featuresList: {
    gap: 8,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontFamily: 'Inter',
  },
  processSteps: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  processTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b68a71',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  processStep: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  authNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  authNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  disclaimer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    fontStyle: 'italic',
    fontFamily: 'Inter',
  },
});