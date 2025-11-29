import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Switch,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { db } from '@/lib/database';
import { User, Listing, Swap } from '@/types';
import { parseFragranceData } from '@/lib/ai-services';
import { enhancementService, EnhancementQueueStats } from '@/lib/enhancement-service';
import { aiEnhancementEngine } from '@/lib/ai-enhancement-engine';

// ... (Previous Interfaces)
interface AdminStats {
  // User stats
  total_users: number;
  new_users_7d: number;
  verified_users: number;
  premium_users: number;
  elite_users: number;

  // Listings stats
  active_listings: number;
  new_listings_7d: number;
  total_listings: number;

  // Swaps stats
  total_swaps: number;
  pending_swaps: number;
  active_swaps: number;
  completed_swaps: number;
  disputed_swaps: number;
  cancelled_swaps: number;
  new_swaps_7d: number;

  // Fragrance Master Database stats
  total_fragrances: number;
  unique_brands: number;
  avg_rating: number;
  new_fragrances_7d: number;
  fragrances_with_concentration: number;
  fragrances_with_family: number;
  database_completeness: number;
}

// New Interfaces for AI
interface AIConfig {
  id: string;
  key: string;
  value: any;
  description: string;
}

type AdminTab = 'overview' | 'database' | 'users' | 'listings' | 'swaps' | 'ai-config' | 'review' | 'models' | 'market' | 'ai-enhance';

export default function AdminScreen() {
  // useColorScheme returns null during SSR, 'light' or 'dark' after mount
  const colorScheme = useColorScheme() ?? 'dark';
  const { user, isAdmin: authIsAdmin, isLoading: legacyAuthLoading } = useAuth();
  const { isAdmin: subscriptionIsAdmin, outsetaUser, isLoading: subscriptionLoading } = useSubscription();
  
  // User is admin if either context says so (covers both auth methods)
  const isAdmin = authIsAdmin || subscriptionIsAdmin;
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [disputedSwaps, setDisputedSwaps] = useState<Swap[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // AI Config State
  const [systemPrompt, setSystemPrompt] = useState('');
  const [fairnessWeights, setFairnessWeights] = useState({ authenticity: 0.5, condition: 0.3, fill_level: 0.2 });
  
  // Database Tab State
  const [dbSubTab, setDbSubTab] = useState<'search' | 'new' | 'import'>('search');
  const [dbSearch, setDbSearch] = useState('');
  const [fragranceResults, setFragranceResults] = useState<any[]>([]);
  const [fragranceStats, setFragranceStats] = useState<{
    total_count: number;
    unique_brands: number;
    avg_rating: number;
    with_year: number;
    with_perfumers: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Manual Entry Form State
  const [newFragrance, setNewFragrance] = useState({
    name: '',
    brand: '',
    concentration: 'edp',
    gender: 'unisex',
    year: '',
    description: '',
    image_url: ''
  });
  const [pyramid, setPyramid] = useState({ top: '', middle: '', base: '' }); // Comma separated strings for now
  const [perfumersInput, setPerfumersInput] = useState(''); // Comma separated
  const [magicText, setMagicText] = useState(''); // AI Text Extraction Input
  
  // CSV Import State
  const [csvData, setCsvData] = useState('');
  // Use a ref to hold the full content if it's too large to display
  const fullCsvContent = React.useRef<string | null>(null);
  const [importProgress, setImportProgress] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [fileStats, setFileStats] = useState<{name: string, size: number} | null>(null);

  // AI Review Queue State
  const [flaggedListings, setFlaggedListings] = useState<Listing[]>([]);
  
  // AI Enhancement State
  const [enhancementStats, setEnhancementStats] = useState<EnhancementQueueStats | null>(null);
  const [fragrancesToEnhance, setFragrancesToEnhance] = useState<any[]>([]);
  const [enhancingFragranceId, setEnhancingFragranceId] = useState<string | null>(null);
  const [enhancementProgress, setEnhancementProgress] = useState('');
  const [enhancementBrandFilter, setEnhancementBrandFilter] = useState('');
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [enhancementSubTab, setEnhancementSubTab] = useState<'find' | 'approve' | 'analytics'>('find');
  const [analyticsData, setAnalyticsData] = useState<{
    total_enhanced: number;
    success_rate: number;
    avg_changes_per_fragrance: number;
    top_sources: {source: string; count: number}[];
    recent_activity: {date: string; count: number}[];
  } | null>(null);
  
  // Hydration fix: Ensure component only renders on client
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    if (user || outsetaUser) {
    checkAdminAccess();
    }
  }, [user, isAdmin, outsetaUser]);

  // Load fragrance stats on mount
  useEffect(() => {
    if (isAdmin && isMounted) {
      loadFragranceStats();
    }
  }, [isAdmin, isMounted]);

  // Search fragrances when search term changes
  useEffect(() => {
    if (dbSearch.length >= 2) {
      searchFragrances();
    } else {
      setFragranceResults([]);
    }
  }, [dbSearch]);

  const loadFragranceStats = async () => {
    try {
      const stats = await db.getFragranceMasterStats();
      setFragranceStats(stats);
    } catch (error) {
      console.error('Error loading fragrance stats:', error);
    }
  };

  const searchFragrances = async () => {
    setIsSearching(true);
    try {
      const results = await db.searchFragranceMaster(dbSearch, 20);
      setFragranceResults(results);
    } catch (error) {
      console.error('Error searching fragrances:', error);
      setFragranceResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Ensure clipboard handler is defined before render
  const handlePasteFromClipboard = async () => {
    try {
      // Client-side check for clipboard support
      if (Platform.OS === 'web' && !navigator.clipboard) {
         Alert.alert('Error', 'Clipboard access not supported in this browser context.');
         return;
      }

      const content = await Clipboard.getStringAsync();
      if (!content) {
        Alert.alert('Clipboard Empty', 'No text found in clipboard.');
        return;
      }

      // Check size
      const MAX_DISPLAY_LENGTH = 5000;
      const isLarge = content.length > 100000; // > 100KB

      fullCsvContent.current = content;
      
      if (isLarge) {
        setCsvData(content.slice(0, MAX_DISPLAY_LENGTH) + `\n\n... [Content truncated for performance. Total size: ${(content.length / 1024 / 1024).toFixed(2)} MB. Ready for import.]`);
        Alert.alert('Large Data Pasted', `Retrieved ${(content.length / 1024 / 1024).toFixed(2)} MB from clipboard. Previewing first 5000 chars.`);
      } else {
        setCsvData(content);
        Alert.alert('Success', 'Data pasted from clipboard.');
      }
    } catch (err) {
      console.error('Clipboard error:', err);
      Alert.alert('Error', 'Failed to read from clipboard. Please allow permissions if prompted.');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    
    if (activeTab === 'ai-config') {
      loadAiConfigs();
    } else if (activeTab === 'review') {
      loadReviewQueue();
    }
  }, [activeTab, isAdmin]);

  async function checkAdminAccess() {
    const isAuthenticated = user || outsetaUser;
    
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      if (isAdmin) {
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAdminData() {
    try {
      const [statsData, usersData, swapsData] = await Promise.all([
        db.getAdminStats(),
        db.getRecentUsers(10),
        db.getDisputedSwaps(),
      ]);
      
      setStats(statsData);
      setRecentUsers(usersData);
      setDisputedSwaps(swapsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  }

  async function loadReviewQueue() {
    try {
      const listings = await db.getFlaggedListings();
      setFlaggedListings(listings);
    } catch (error) {
      console.error('Error loading review queue:', error);
    }
  }

  async function handleApproveListing(listing: Listing) {
    if (!user && !outsetaUser) return;
    const adminId = user?.id || outsetaUser?.clientIdentifier || 'admin';
    
    Alert.alert(
      'Approve Listing',
      `Mark ${listing.house} - ${listing.custom_name} as verified?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            await db.approveListing(listing.id, adminId);
            await loadReviewQueue(); // Refresh list
          }
        }
      ]
    );
  }

  async function loadAiConfigs() {
    try {
      const configs = await db.getAiConfigs();
      
      const promptConfig = configs.find(c => c.key === 'assessment_prompts');
      if (promptConfig) {
        setSystemPrompt(JSON.stringify(promptConfig.value, null, 2));
      }

      const weightsConfig = configs.find(c => c.key === 'criteria_weights');
      if (weightsConfig) {
        setFairnessWeights(weightsConfig.value);
      }
    } catch (error) {
      console.error('Error loading AI configs:', error);
    }
  }

  async function handleSaveConfig(key: string, value: any) {
    if (!user && !outsetaUser) return;
    const adminId = user?.id || outsetaUser?.clientIdentifier || 'admin'; 
    
    try {
      await db.updateAiConfig(key, value, adminId);
      Alert.alert('Success', 'Configuration updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update configuration');
    }
  }

  async function handleCreateFragrance() {
    if (!newFragrance.name || !newFragrance.brand) {
      Alert.alert('Error', 'Name and Brand are required');
      return;
    }
    
    try {
      setIsLoading(true);
      await createSingleFragrance({
        name: newFragrance.name,
        brand: newFragrance.brand,
        concentration: newFragrance.concentration,
        gender: newFragrance.gender,
        year: newFragrance.year,
        description: newFragrance.description,
        image_url: newFragrance.image_url,
        topNotes: pyramid.top,
        middleNotes: pyramid.middle,
        baseNotes: pyramid.base,
        perfumers: perfumersInput
      });

      Alert.alert('Success', 'Fragrance added to database');
      setNewFragrance({ name: '', brand: '', concentration: 'edp', gender: 'unisex', year: '', description: '', image_url: '' });
      setPyramid({ top: '', middle: '', base: '' });
      setPerfumersInput('');
      
    } catch (e) {
      Alert.alert('Error', 'Failed to create fragrance');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  // Reusable helper for creating a fragrance
  async function createSingleFragrance(data: {
    name: string,
    brand: string,
    concentration: string,
    gender: string,
    year: string,
    description: string,
    image_url: string,
    topNotes: string,
    middleNotes: string,
    baseNotes: string,
    perfumers: string,
    accords?: string[],
    fragrantica_url?: string,
    country?: string
  }) {
      // Brand: Find or Create
      let brandId;
    const brands = await db.getBrands(data.brand);
    const existingBrand = brands.find(b => b.name.toLowerCase() === data.brand.toLowerCase());
      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
      const newB = await db.createBrand({ name: data.brand, country: data.country });
        if (newB) brandId = newB.id;
      }

    if (!brandId) {
      console.warn(`Failed to resolve brand: ${data.brand} - skipping fragrance`);
      return; // Skip this fragrance if brand can't be created
    }

      // Notes: Find or Create
      const processNotes = async (input: string) => {
      const names = input.split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'unknown');
        const ids = [];
        for (const name of names) {
          const existing = await db.getNotes(name);
          const match = existing.find(n => n.name.toLowerCase() === name.toLowerCase());
          if (match) {
            ids.push(match.id);
          } else {
            const newN = await db.createNote({ name });
            if (newN) ids.push(newN.id);
          }
        }
        return ids;
      };

    const topIds = await processNotes(data.topNotes);
    const midIds = await processNotes(data.middleNotes);
    const baseIds = await processNotes(data.baseNotes);

      // Perfumers: Find or Create
      const perfumerIds = [];
    const pNames = data.perfumers.split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'unknown');
      for (const name of pNames) {
        const existing = await db.getPerfumers(name);
        const match = existing.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (match) {
          perfumerIds.push(match.id);
        } else {
          const newP = await db.createPerfumer({ name });
          if (newP) perfumerIds.push(newP.id);
        }
      }

      // Create Fragrance
      await db.createFragrance({
      name: data.name,
        brand_id: brandId,
      concentration: data.concentration,
      gender: data.gender,
      launch_year: data.year ? parseInt(data.year) : null,
      description: data.description,
      image_url: data.image_url,
      accords: data.accords || [],
      fragrantica_url: data.fragrantica_url
      }, { top: topIds, middle: midIds, base: baseIds }, perfumerIds);
  }

  async function handlePickCsv() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      let content = '';

      // Check file size (limit preview for performance)
      const isLargeFile = (asset.size || 0) > 1024 * 1024; // > 1MB
      
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        content = await response.text();
      } else {
        content = await FileSystem.readAsStringAsync(asset.uri);
      }

      if (content) {
        fullCsvContent.current = content;
        setFileStats({ name: asset.name, size: asset.size || 0 });
        
        if (isLargeFile) {
          // Preview only first 50 lines
          const preview = content.split('\n').slice(0, 50).join('\n');
          setCsvData(preview + '\n... (File too large to display fully, but ready for import)');
          Alert.alert('Large File Loaded', `Loaded ${asset.name} (${(asset.size! / 1024 / 1024).toFixed(2)} MB). Previewing first 50 lines.`);
        } else {
          setCsvData(content);
          Alert.alert('File Loaded', 'CSV data loaded. Review and click "Process CSV" to import.');
        }
      }
    } catch (err) {
      console.error('Error picking file:', err);
      Alert.alert('Error', 'Failed to read file');
    }
  }

  async function handleImportCsv() {
    // Use full content from ref if available, otherwise state
    const rawData = fullCsvContent.current || csvData;
    
    if (!rawData.trim()) {
      Alert.alert('Error', 'Please paste CSV data or load a file first');
      return;
    }

    setIsImporting(true);
    setImportProgress('Initializing 4-Phase Bulk Import...');

    try {
      const lines = rawData.split('\n').filter(l => l.trim());
      
      // PHASE 1: PARSE & ANALYZE
      setImportProgress('Phase 1/4: Parsing & Analyzing Data...');
      await new Promise(r => setTimeout(r, 10)); // Yield UI

      const brandsToSync = new Set<string>();
      const notesToSync = new Set<string>();
      const perfumersToSync = new Set<string>();
      const parsedRows: any[] = [];

      // Pre-process lines to extract unique entities
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(';').map(s => s.trim());
        
        // Skip header or invalid
        if ((cols[1]?.toLowerCase() === 'perfume' && cols[2]?.toLowerCase() === 'brand') || !cols[1] || !cols[2]) continue;

        const brand = cols[2]; // Keep original casing for later proper formatting
        const top = cols[8] || '';
        const middle = cols[9] || '';
        const base = cols[10] || '';
        const perfumersStr = [cols[11], cols[12]].filter(p => p && p.toLowerCase() !== 'unknown').join(', ');
        const accords = cols.slice(13, 18).filter(a => a && a.toLowerCase() !== 'unknown');

        // Collect unique names for bulk sync
        if (brand) brandsToSync.add(brand);
        
        // Helper to split and add notes
        const addNotes = (str: string) => {
            str.split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'unknown').forEach(n => notesToSync.add(n));
        };
        addNotes(top);
        addNotes(middle);
        addNotes(base);

        perfumersStr.split(',').map(s => s.trim()).filter(s => s).forEach(p => perfumersToSync.add(p));

        parsedRows.push({
            cols,
            brand,
            top,
            middle,
            base,
            perfumersStr,
            accords
        });
      }

      // PHASE 2: SYNC REFERENCES
      setImportProgress(`Phase 2/4: Syncing References (${brandsToSync.size} brands, ${notesToSync.size} notes)...`);
      await new Promise(r => setTimeout(r, 10));

      // Sync Brands (with proper casing and case-insensitive matching)
      const brandMap = new Map<string, string>();
      const brandNames = Array.from(brandsToSync);

      // First, try to fetch all brands that exist (case-sensitive)
      const existingBrands = await db.bulkGetBrands(brandNames);
      existingBrands.forEach(b => brandMap.set(b.name.toLowerCase(), b.id));

      // Also try with Title Case versions
      const titleCasedNames = brandNames.map(name =>
        name.split('-').map(part =>
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join('-')
      );
      const existingTitleBrands = await db.bulkGetBrands(titleCasedNames);
      existingTitleBrands.forEach(b => brandMap.set(b.name.toLowerCase(), b.id));

      // Create missing brands with proper Title Case
      const newBrands = brandNames.filter(name => !brandMap.has(name.toLowerCase()));
      if (newBrands.length > 0) {
          const brandsToCreate = newBrands.map(name => ({
            name: name.split('-').map(part =>
              part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            ).join('-')
          }));
          try {
            const created = await db.bulkCreateBrands(brandsToCreate);
            created.forEach(b => brandMap.set(b.name.toLowerCase(), b.id));
          } catch (error) {
            console.error('Error bulk creating brands:', error);
            // Try to create them one by one as fallback
            for (const brand of brandsToCreate) {
              try {
                const single = await db.createBrand(brand);
                if (single) {
                  brandMap.set(single.name.toLowerCase(), single.id);
                }
    } catch (e) {
                console.warn(`Could not create brand ${brand.name}:`, e);
              }
            }
          }
      }

      // Sync Notes
      const noteMap = new Map<string, string>();
      const noteNames = Array.from(notesToSync);
      const existingNotes = await db.bulkGetNotes(noteNames);
      existingNotes.forEach(n => noteMap.set(n.name.toLowerCase(), n.id));

      const newNotes = noteNames.filter(name => !noteMap.has(name.toLowerCase()));
      if (newNotes.length > 0) {
          const created = await db.bulkCreateNotes(newNotes.map(name => ({ name })));
          created.forEach(n => noteMap.set(n.name.toLowerCase(), n.id));
      }

      // Sync Perfumers
      const perfumerMap = new Map<string, string>();
      const perfumerNames = Array.from(perfumersToSync);
      const existingPerfumers = await db.bulkGetPerfumers(perfumerNames);
      existingPerfumers.forEach(p => perfumerMap.set(p.name.toLowerCase(), p.id));

      const newPerfumers = perfumerNames.filter(name => !perfumerMap.has(name.toLowerCase()));
      if (newPerfumers.length > 0) {
          const created = await db.bulkCreatePerfumers(newPerfumers.map(name => ({ name })));
          created.forEach(p => perfumerMap.set(p.name.toLowerCase(), p.id));
      }

      // PHASE 3: PREPARE & BATCH INSERT FRAGRANCES
      setImportProgress('Phase 3/4: Uploading Fragrances...');
      await new Promise(r => setTimeout(r, 10));

      // We need IDs for the new fragrances to link relations.
      // Strategy: Insert fragrances, get IDs back, then insert relations.
      // We will do this in batches of 500.

      const BATCH_SIZE = 500;
      let processedCount = 0;
      let i = 0;

      // Recursive function for batch processing
      const processChunk = async () => {
        if (i >= parsedRows.length) {
          setIsImporting(false);
          setImportProgress('');
          Alert.alert('Import Complete', `Successfully imported ${processedCount} fragrances.`);
          setCsvData('');
          fullCsvContent.current = null;
          setFileStats(null);
          return;
        }

        const batch = parsedRows.slice(i, i + BATCH_SIZE);
        const batchFragrances = [];
        
        // Prepare batch
        for (const row of batch) {
            // Correct logic:
            // brandMap key is brand NAME (lowercase), value is brand ID.
            // So we look up the ID using the row's brand name.
            const brandNameKey = row.brand.toLowerCase();
            const brandId = brandMap.get(brandNameKey);
            
            if (!brandId) {
                console.warn(`Skipping row: Brand ID not found for '${row.brand}'`);
                continue; 
            }

            const cols = row.cols;
            const url = cols[0] || '';
            const name = cols[1] || '';
            const country = cols[3] || '';
            let gender = cols[5]?.toLowerCase() || 'unisex'; // Gender is column 5, not 4
            if (gender === 'women') gender = 'female';
            if (gender === 'men') gender = 'male';
            const year = cols[7] ? parseInt(cols[7]) : null;

            batchFragrances.push({
                name,
                brand_id: brandId,
                concentration: 'edp', // Default
                gender,
                launch_year: isNaN(year!) ? null : year,
                description: `Imported from Fragrantica. URL: ${url}`,
                image_url: '',
                fragrantica_url: url,
                accords: row.accords
            });
        }

        if (batchFragrances.length === 0) {
           // Skip batch if empty (all invalid)
           processedCount += batch.length;
           setImportProgress(`Phase 3/4: Uploading Fragrances (${processedCount}/${parsedRows.length})...`);
           i += BATCH_SIZE;
           setTimeout(processChunk, 0);
           return;
        }

        try {
          // Insert Batch
          const createdFragrances = await db.bulkCreateFragrances(batchFragrances);

          if (!createdFragrances || createdFragrances.length === 0) {
             console.warn(`Batch ${i/BATCH_SIZE} insert returned no data. Skipping relations.`);
             processedCount += batch.length;
             i += BATCH_SIZE;
             setTimeout(processChunk, 0);
             return;
          }

          // Link Relations for this batch
          const batchNoteRelations: any[] = [];
          const batchPerfumerRelations: any[] = [];

          for (let j = 0; j < createdFragrances.length; j++) {
              const frag = createdFragrances[j];
              // Map back to original row using Name + BrandID logic
              const originalRow = batch.find(r => 
                  (r.cols[1] === frag.name && brandMap.get(r.brand.toLowerCase()) === frag.brand_id)
              );
              
              // Fallback to index if unique match fails
              const fallbackRow = batch[j]; 
              const rowToUse = originalRow || fallbackRow;

              if (!rowToUse) continue;

              // Link Notes
              const processNotes = (str: string, type: string) => {
                  str.split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'unknown').forEach(n => {
                      const nid = noteMap.get(n.toLowerCase());
                      if (nid) batchNoteRelations.push({ fragrance_id: frag.id, note_id: nid, type });
                  });
              };
              processNotes(rowToUse.top, 'top');
              processNotes(rowToUse.middle, 'middle');
              processNotes(rowToUse.base, 'base');

              // Link Perfumers
              rowToUse.perfumersStr.split(',').map((s: string) => s.trim()).filter((s: string) => s).forEach((p: string) => {
                  const pid = perfumerMap.get(p.toLowerCase());
                  if (pid) batchPerfumerRelations.push({ fragrance_id: frag.id, perfumer_id: pid });
              });
          }

          // Insert Relations
          if (batchNoteRelations.length > 0) await db.bulkCreateFragranceNotes(batchNoteRelations);
          if (batchPerfumerRelations.length > 0) await db.bulkCreateFragrancePerfumers(batchPerfumerRelations);

          processedCount += batch.length;
          setImportProgress(`Phase 3/4: Uploading Fragrances (${processedCount}/${parsedRows.length})...`);
          
          i += BATCH_SIZE;
          setTimeout(processChunk, 0); // Yield to event loop and process next chunk

        } catch (err) {
          console.error(`Error processing batch ${i/BATCH_SIZE}:`, err);
          // Continue to next batch even if this one failed
          i += BATCH_SIZE;
          setTimeout(processChunk, 0);
        }
      };

      // Start recursive loop
      processChunk();

    } catch (e) {
      Alert.alert('Import Error', 'An unexpected error occurred during import');
      console.error(e);
      setIsImporting(false);
      setImportProgress('');
    }
  }

  async function handleAnalyzeText() {
    setIsLoading(true);
    try {
      const data = await parseFragranceData(magicText);
      // Pre-fill form state
      setNewFragrance({
        name: data.name || '',
        brand: data.brand || '',
        concentration: data.concentration || 'edp',
        gender: data.gender || 'unisex',
        year: data.year?.toString() || '',
        description: data.description || '',
        image_url: ''
      });
      setPyramid({
        top: data.notes?.top?.join(', ') || '',
        middle: data.notes?.middle?.join(', ') || '',
        base: data.notes?.base?.join(', ') || ''
      });
      setPerfumersInput(data.perfumers?.join(', ') || '');
      
      // Switch to 'new' tab to review
      setDbSubTab('new');
      Alert.alert('Success', 'Data extracted! Please review and save.');
    } catch (e) {
      Alert.alert('Error', 'Failed to parse text');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  // ... (Previous Handlers: handleVerifyUser, handleSuspendUser, handleResolveDispute)
  async function handleVerifyUser(userId: string) {
    Alert.alert(
      'Verify User',
      'Are you sure you want to verify this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            await db.adminUpdateUser(userId, { verification_tier: 'verified' });
            await loadAdminData();
          },
        },
      ]
    );
  }

  async function handleSuspendUser(userId: string) {
    Alert.alert(
      'Suspend User',
      'Are you sure you want to suspend this user? They will not be able to access the platform.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            await db.adminUpdateUser(userId, { verification_tier: 'suspended' });
            await loadAdminData();
          },
        },
      ]
    );
  }

  async function handleResolveDispute(swapId: string, resolution: 'favor_initiator' | 'favor_recipient' | 'mutual') {
    Alert.alert(
      'Resolve Dispute',
      `Resolve in favor of: ${resolution.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await db.adminResolveDispute(swapId, resolution);
            await loadAdminData();
          },
        },
      ]
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    accessDenied: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    accessDeniedTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
    },
    accessDeniedText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    tabsContainer: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabsContent: {
      paddingHorizontal: 10,
    },
    tab: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      marginRight: 8,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    content: {
      padding: 16,
    },
    // ... (Previous Stats Styles)
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statCardWide: {
      width: '100%',
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    statChange: {
      fontSize: 12,
      marginTop: 4,
    },
    statChangePositive: {
      color: '#22C55E',
    },
    statChangeNegative: {
      color: '#EF4444',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    // ... (User Card Styles)
    userCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    userEmail: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    userMeta: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    userActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    // ... (Dispute Card Styles)
    disputeCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#EF4444',
    },
    disputeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    disputeTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    disputeReason: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
    disputeActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    emptyState: {
      alignItems: 'center',
      padding: 32,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
    // New Styles for AI Config
    configCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    configTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    configDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    configInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    configActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 12,
    },
  });

  // Use consistent loading state to prevent hydration mismatch
  // Server always renders this, client will update after mount
  if (!isMounted || legacyAuthLoading || subscriptionLoading || isLoading) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#1A1A2E'}}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={{color: '#9CA3AF', marginTop: 12}}>Loading Admin Panel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Initialize colors AFTER isMounted check to prevent hydration mismatch
  const colors = Colors[colorScheme];

  const isAuthenticated = user || outsetaUser;
  
  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={colors.textSecondary} />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You don't have admin privileges to access this page.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Define tabs list for cleaner rendering
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'database', label: 'Database' },
    { id: 'ai-enhance', label: '🤖 AI Enhance' },
    { id: 'users', label: 'Users' },
    { id: 'listings', label: 'Listings' },
    { id: 'swaps', label: 'Swaps' },
    { id: 'ai-config', label: 'AI Config' },
    { id: 'review', label: 'Review Queue' },
    { id: 'models', label: 'Models' },
    { id: 'market', label: 'Marketplace' },
  ] as const;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Manage ScentSwap platform & AI
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && stats && (
          <>
            {/* Platform Statistics */}
            <View style={styles.statsGrid}>
              {/* Users Section */}
              <View style={[styles.statCard, styles.statCardWide]}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <View>
                    <Text style={styles.statValue}>{stats.total_users?.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                <Text style={[styles.statChange, styles.statChangePositive]}>
                      +{stats.new_users_7d || 0} this week
                    </Text>
                    <Text style={{fontSize: 10, color: colors.textSecondary}}>
                      +{stats.new_users_30d || 0} this month
                </Text>
              </View>
                </View>
                <View style={{flexDirection: 'row', gap: 12, marginTop: 12}}>
                  <View style={{flex: 1, alignItems: 'center', padding: 8, backgroundColor: colors.background, borderRadius: 8}}>
                    <Text style={{fontSize: 16, fontWeight: 'bold', color: '#22C55E'}}>{stats.verified_users || 0}</Text>
                    <Text style={{fontSize: 10, color: colors.textSecondary}}>Verified</Text>
                  </View>
                  <View style={{flex: 1, alignItems: 'center', padding: 8, backgroundColor: colors.background, borderRadius: 8}}>
                    <Text style={{fontSize: 16, fontWeight: 'bold', color: '#A855F7'}}>{stats.premium_users || 0}</Text>
                    <Text style={{fontSize: 10, color: colors.textSecondary}}>Premium</Text>
                  </View>
                  <View style={{flex: 1, alignItems: 'center', padding: 8, backgroundColor: colors.background, borderRadius: 8}}>
                    <Text style={{fontSize: 16, fontWeight: 'bold', color: '#F59E0B'}}>{stats.elite_users || 0}</Text>
                    <Text style={{fontSize: 10, color: colors.textSecondary}}>Elite</Text>
                  </View>
                </View>
              </View>

              {/* Database Section */}
              <View style={[styles.statCard, styles.statCardWide]}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <View>
                    <Text style={[styles.statValue, {color: '#22C55E'}]}>{stats.total_fragrances?.toLocaleString() || 0}</Text>
                    <Text style={styles.statLabel}>Fragrance Master Database</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={{fontSize: 14, fontWeight: 'bold', color: colors.primary}}>
                      {stats.unique_brands || 0} Brands
                    </Text>
                    <Text style={{fontSize: 12, color: colors.textSecondary}}>
                      ⭐ {stats.avg_rating?.toFixed(2) || '0.00'} avg rating
                    </Text>
                    {stats.new_fragrances_7d > 0 && (
                      <Text style={{fontSize: 11, color: '#22C55E', fontWeight: 'bold'}}>
                        +{stats.new_fragrances_7d} this week
                      </Text>
                    )}
                  </View>
                </View>
                <View style={{flexDirection: 'row', gap: 12, marginTop: 12}}>
                  <View style={{flex: 1, alignItems: 'center', padding: 8, backgroundColor: colors.background, borderRadius: 8}}>
                    <Text style={{fontSize: 14, fontWeight: 'bold', color: '#3B82F6'}}>{stats.fragrances_with_concentration || 0}</Text>
                    <Text style={{fontSize: 10, color: colors.textSecondary}}>With Concentration</Text>
                  </View>
                  <View style={{flex: 1, alignItems: 'center', padding: 8, backgroundColor: colors.background, borderRadius: 8}}>
                    <Text style={{fontSize: 14, fontWeight: 'bold', color: '#8B5CF6'}}>{stats.fragrances_with_family || 0}</Text>
                    <Text style={{fontSize: 10, color: colors.textSecondary}}>With Family</Text>
                  </View>
                  <View style={{flex: 1, alignItems: 'center', padding: 8, backgroundColor: colors.background, borderRadius: 8}}>
                    <Text style={{fontSize: 14, fontWeight: 'bold', color: '#10B981'}}>{stats.database_completeness}%</Text>
                    <Text style={{fontSize: 10, color: colors.textSecondary}}>Complete</Text>
                  </View>
                </View>
              </View>

              {/* Listings */}
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.total_listings?.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Total Listings</Text>
                <View style={{marginTop: 8}}>
                  <Text style={{fontSize: 12, color: '#22C55E'}}>
                    {stats.active_listings || 0} active
                  </Text>
                <Text style={[styles.statChange, styles.statChangePositive]}>
                    +{stats.new_listings_7d || 0} this week
                </Text>
              </View>
            </View>

              {/* Swaps */}
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.total_swaps?.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Total Swaps</Text>
                <View style={{marginTop: 8}}>
                  <View style={{flexDirection: 'row', gap: 8}}>
                    <Text style={{fontSize: 11, color: '#F59E0B'}}>
                      {stats.pending_swaps || 0} pending
                    </Text>
                    <Text style={{fontSize: 11, color: '#3B82F6'}}>
                      {stats.active_swaps || 0} active
                    </Text>
                  </View>
                  <View style={{flexDirection: 'row', gap: 8, marginTop: 2}}>
                    <Text style={{fontSize: 11, color: '#22C55E'}}>
                      {stats.completed_swaps || 0} completed
                    </Text>
                    {stats.cancelled_swaps > 0 && (
                      <Text style={{fontSize: 11, color: '#9CA3AF'}}>
                        {stats.cancelled_swaps} cancelled
                      </Text>
                    )}
                  </View>
                  {stats.disputed_swaps > 0 && (
                    <Text style={{fontSize: 11, color: '#EF4444', fontWeight: 'bold'}}>
                      ⚠️ {stats.disputed_swaps} disputed
                    </Text>
                  )}
                  {stats.new_swaps_7d > 0 && (
                    <Text style={{fontSize: 11, color: '#22C55E', marginTop: 4}}>
                      +{stats.new_swaps_7d} this week
                    </Text>
                  )}
                </View>
              </View>
            </View>
            {/* Disputes Section */}
            {disputedSwaps && disputedSwaps.length > 0 && (
               <View style={styles.section}>
                 <Text style={styles.sectionTitle}>⚠️ Disputes Requiring Attention</Text>
                 {disputedSwaps.map(swap => (
                    <View key={swap.id} style={styles.disputeCard}>
                    <View style={styles.disputeHeader}>
                      <Text style={styles.disputeTitle}>Swap #{swap.id.slice(0, 8)}</Text>
                      <Text style={{fontSize: 12, color: colors.textSecondary}}>
                        {new Date(swap.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.disputeReason}>
                      Status: {swap.status}
                    </Text>
                    {swap.dispute_reason && (
                      <Text style={{fontSize: 12, color: colors.textSecondary, marginTop: 4}}>
                        Reason: {swap.dispute_reason}
                      </Text>
                    )}
                    <View style={styles.disputeActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, {borderColor: '#22C55E'}]}
                        onPress={() => handleResolveDispute(swap.id, 'favor_initiator')}
                      >
                        <Text style={[styles.actionButtonText, {color: '#22C55E'}]}>Favor Initiator</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, {borderColor: '#3B82F6'}]}
                        onPress={() => handleResolveDispute(swap.id, 'favor_recipient')}
                      >
                        <Text style={[styles.actionButtonText, {color: '#3B82F6'}]}>Favor Recipient</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, {borderColor: '#F59E0B'}]}
                        onPress={() => handleResolveDispute(swap.id, 'mutual')}
                      >
                        <Text style={[styles.actionButtonText, {color: '#F59E0B'}]}>Mutual</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recent Users Section */}
            {recentUsers && recentUsers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Users</Text>
                {recentUsers.map(user => (
                  <View key={user.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View>
                        <Text style={styles.userName}>{user.full_name || 'Anonymous'}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                      <View style={{alignItems: 'flex-end'}}>
                        <Text style={{fontSize: 10, color: colors.textSecondary}}>
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </Text>
                        {user.verification_tier && (
                          <View style={[styles.badge, {
                            backgroundColor: user.verification_tier === 'verified' ? '#22C55E' :
                                          user.verification_tier === 'trusted' ? '#3B82F6' :
                                          user.verification_tier === 'elite' ? '#F59E0B' : '#6B7280'
                          }]}>
                            <Text style={[styles.badgeText, {color: '#FFF'}]}>
                              {user.verification_tier}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.userActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, {borderColor: '#22C55E'}]}
                        onPress={() => handleVerifyUser(user.id)}
                      >
                        <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                        <Text style={[styles.actionButtonText, {color: '#22C55E'}]}>Verify</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, {borderColor: '#EF4444'}]}
                        onPress={() => handleSuspendUser(user.id)}
                      >
                        <Ionicons name="ban" size={14} color="#EF4444" />
                        <Text style={[styles.actionButtonText, {color: '#EF4444'}]}>Suspend</Text>
                      </TouchableOpacity>
                    </View>
                    </View>
                 ))}
               </View>
            )}
          </>
        )}

        {activeTab === 'database' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fragrance Database</Text>
            <View style={{flexDirection: 'row', marginBottom: 16, gap: 8}}>
              {(['search', 'new', 'import'] as const).map(sub => (
                <TouchableOpacity 
                  key={sub} 
                  onPress={() => setDbSubTab(sub)}
                  style={[
                    styles.actionButton, 
                    {
                      backgroundColor: dbSubTab === sub ? colors.primary : 'transparent', 
                      borderColor: colors.primary,
                      flex: 1
                    }
                  ]}
                >
                  <Text style={{
                    color: dbSubTab === sub ? '#FFF' : colors.primary, 
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {dbSubTab === 'search' && (
              <View>
                {/* Stats Summary */}
                {fragranceStats && (
                  <View style={[styles.configCard, {marginBottom: 16}]}>
                    <Text style={styles.configTitle}>Database Stats</Text>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 8}}>
                      <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.primary}}>
                          {fragranceStats.total_count?.toLocaleString() || 0}
                        </Text>
                        <Text style={{fontSize: 12, color: colors.textSecondary}}>Total Fragrances</Text>
                      </View>
                      <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.primary}}>
                          {fragranceStats.unique_brands?.toLocaleString() || 0}
                        </Text>
                        <Text style={{fontSize: 12, color: colors.textSecondary}}>Brands</Text>
                      </View>
                      <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.primary}}>
                          {(fragranceStats.avg_rating || 0).toFixed(2)}
                        </Text>
                        <Text style={{fontSize: 12, color: colors.textSecondary}}>Avg Rating</Text>
                      </View>
                      <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontWeight: 'bold', color: '#22C55E'}}>
                          {fragranceStats.recently_added || 0}
                        </Text>
                        <Text style={{fontSize: 12, color: colors.textSecondary}}>Added (7d)</Text>
                      </View>
                    </View>
                    {fragranceStats.source_breakdown && Object.keys(fragranceStats.source_breakdown).length > 0 && (
                      <View style={{marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border}}>
                        <Text style={{fontSize: 12, fontWeight: 'bold', color: colors.text, marginBottom: 8}}>Data Sources:</Text>
                        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                          {Object.entries(fragranceStats.source_breakdown).map(([source, count]) => (
                            <View key={source} style={{
                              backgroundColor: colors.background,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 12
                            }}>
                              <Text style={{fontSize: 10, color: colors.textSecondary}}>
                                {source}: {count}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <TextInput 
                  style={[styles.configInput, {marginBottom: 16, minHeight: 40}]} 
                  placeholder="Search fragrances by name or brand..."
                  value={dbSearch}
                  onChangeText={setDbSearch}
                />

                {isSearching && (
                  <View style={{alignItems: 'center', padding: 20}}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{color: colors.textSecondary, marginTop: 8}}>Searching...</Text>
                  </View>
                )}

                {!isSearching && dbSearch.length >= 2 && fragranceResults.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                    <Text style={styles.emptyStateText}>No fragrances found for "{dbSearch}"</Text>
                  </View>
                )}

                {!isSearching && fragranceResults.length > 0 && (
                  <View>
                    <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: colors.text}}>
                      Found {fragranceResults.length} results
                    </Text>
                    <FlatList
                      data={fragranceResults}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <View style={[styles.configCard, {marginBottom: 12}]}>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <View style={{flex: 1}}>
                              <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.text}}>
                                {item.name}
                              </Text>
                              <Text style={{fontSize: 14, color: colors.primary, marginBottom: 4}}>
                                {item.brand}
                              </Text>
                              {item.year_released && (
                                <Text style={{fontSize: 12, color: colors.textSecondary}}>
                                  {item.year_released} • {item.gender || 'Unspecified'}
                                </Text>
                              )}
                              {item.rating_value && (
                                <Text style={{fontSize: 12, color: colors.textSecondary}}>
                                  ⭐ {item.rating_value}/5.0
                                </Text>
                              )}
                            </View>
                            {item.rating_value && (
                              <View style={{
                                backgroundColor: item.rating_value >= 4 ? '#4ade80' : item.rating_value >= 3 ? '#fbbf24' : '#f87171',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 12
                              }}>
                                <Text style={{fontSize: 12, fontWeight: 'bold', color: 'white'}}>
                                  {item.rating_value}
                                </Text>
                              </View>
                            )}
                          </View>

                          {item.top_notes?.length > 0 && (
                            <View style={{marginTop: 8}}>
                              <Text style={{fontSize: 12, color: colors.textSecondary, marginBottom: 2}}>
                                Top: {item.top_notes.join(', ')}
                              </Text>
                            </View>
                          )}

                          {item.main_accords?.length > 0 && (
                            <View style={{marginTop: 4}}>
                              <Text style={{fontSize: 12, color: colors.textSecondary}}>
                                Accords: {item.main_accords.join(' • ')}
                              </Text>
                            </View>
                          )}

                          {item.perfumers?.length > 0 && (
                            <View style={{marginTop: 4}}>
                              <Text style={{fontSize: 12, color: colors.textSecondary}}>
                                Perfumer: {item.perfumers.join(', ')}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      showsVerticalScrollIndicator={false}
                      style={{maxHeight: 600}}
                    />
                  </View>
                )}

                {dbSearch.length < 2 && !isSearching && fragranceStats && (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={48} color={colors.textSecondary} />
                    <Text style={styles.emptyStateText}>
                      Enter 2+ characters to search {fragranceStats.total_count.toLocaleString()} fragrances
                    </Text>
                </View>
                )}
              </View>
            )}

            {dbSubTab === 'new' && (
              <View>
                <View style={styles.configCard}>
                  <Text style={styles.configTitle}>Core Information</Text>
                  <View style={{gap: 12}}>
                    <TextInput 
                      style={styles.configInput} 
                      placeholder="Fragrance Name" 
                      value={newFragrance.name}
                      onChangeText={t => setNewFragrance({...newFragrance, name: t})}
                    />
                    <TextInput 
                      style={styles.configInput} 
                      placeholder="Brand / House" 
                      value={newFragrance.brand}
                      onChangeText={t => setNewFragrance({...newFragrance, brand: t})}
                    />
                    <View style={{flexDirection: 'row', gap: 12}}>
                      <TextInput 
                        style={[styles.configInput, {flex: 1}]} 
                        placeholder="Year" 
                        keyboardType="numeric"
                        value={newFragrance.year}
                        onChangeText={t => setNewFragrance({...newFragrance, year: t})}
                      />
                      <TextInput 
                        style={[styles.configInput, {flex: 1}]} 
                        placeholder="Concentration (edp, edt...)" 
                        value={newFragrance.concentration}
                        onChangeText={t => setNewFragrance({...newFragrance, concentration: t})}
                      />
                    </View>
                    <TextInput 
                      style={styles.configInput} 
                      placeholder="Gender (male, female, unisex)" 
                      value={newFragrance.gender}
                      onChangeText={t => setNewFragrance({...newFragrance, gender: t})}
                    />
                    <TextInput 
                      style={[styles.configInput, {minHeight: 60}]} 
                      placeholder="Description" 
                      multiline
                      value={newFragrance.description}
                      onChangeText={t => setNewFragrance({...newFragrance, description: t})}
                    />
                  </View>
                </View>

                <View style={styles.configCard}>
                  <Text style={styles.configTitle}>Note Pyramid (comma separated)</Text>
                  <View style={{gap: 12}}>
                    <TextInput 
                      style={styles.configInput} 
                      placeholder="Top Notes (e.g. Bergamot, Lemon)" 
                      value={pyramid.top}
                      onChangeText={t => setPyramid({...pyramid, top: t})}
                    />
                    <TextInput 
                      style={styles.configInput} 
                      placeholder="Middle/Heart Notes" 
                      value={pyramid.middle}
                      onChangeText={t => setPyramid({...pyramid, middle: t})}
                    />
                    <TextInput 
                      style={styles.configInput} 
                      placeholder="Base Notes" 
                      value={pyramid.base}
                      onChangeText={t => setPyramid({...pyramid, base: t})}
                    />
                  </View>
                </View>

                <View style={styles.configCard}>
                  <Text style={styles.configTitle}>Credits</Text>
                  <TextInput 
                    style={styles.configInput} 
                    placeholder="Perfumers (comma separated)" 
                    value={perfumersInput}
                    onChangeText={setPerfumersInput}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, {marginBottom: 40}]} 
                  onPress={handleCreateFragrance}
                >
                  <Text style={styles.saveButtonText}>Add to Database</Text>
                </TouchableOpacity>
              </View>
            )}

            {dbSubTab === 'import' && (
              <View>
                <View style={styles.configCard}>
                  <Text style={styles.configTitle}>Magic Text Extraction (AI)</Text>
                  <Text style={styles.configDescription}>
                    Paste text from a brand website, Fragrantica, or press release. The AI will parse it into the database format.
                  </Text>
                  <TextInput 
                    style={[styles.configInput, {marginBottom: 12}]} 
                    multiline
                    numberOfLines={8}
                    placeholder="Paste unstructured text here..."
                    value={magicText}
                    onChangeText={setMagicText}
                  />
                  <TouchableOpacity style={styles.saveButton} onPress={handleAnalyzeText}>
                    <Text style={styles.saveButtonText}>Analyze & Populate Form</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.configCard}>
                  <Text style={styles.configTitle}>Bulk CSV Upload</Text>
                  <Text style={styles.configDescription}>
                    Paste CSV data (semicolon separated) to import fragrances.
                    Format: url;Perfume;Brand;Country;Gender;...
                  </Text>
                  
                  <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
                    <TouchableOpacity 
                        style={[styles.actionButton, {borderColor: colors.primary, flex: 1}]}
                        onPress={handlePickCsv}
                        disabled={isImporting}
                    >
                        <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                        <Text style={[styles.actionButtonText, {color: colors.primary}]}>Load File</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionButton, {borderColor: colors.primary, flex: 1}]}
                        onPress={handlePasteFromClipboard}
                        disabled={isImporting}
                    >
                        <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
                        <Text style={[styles.actionButtonText, {color: colors.primary}]}>Paste Clipboard</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput 
                    style={[styles.configInput, {marginBottom: 12}]} 
                    multiline
                    numberOfLines={10}
                    placeholder="Paste CSV data here (Use buttons above for large files > 1MB to avoid freezing)"
                    value={csvData}
                    onChangeText={(text) => {
                        // If content is massive, don't render it all to prevent UI freeze
                        const MAX_DISPLAY_LENGTH = 5000;
                        if (text.length > 100000) { // > 100KB
                            fullCsvContent.current = text;
                            setCsvData(text.slice(0, MAX_DISPLAY_LENGTH) + `\n\n... [Content truncated for performance. Total size: ${(text.length / 1024 / 1024).toFixed(2)} MB. Ready for import.]`);
                            Alert.alert('Large Data Detected', 'To prevent browser freezing, the text box is showing a preview only. The full data has been captured and is ready for import.');
                        } else {
                            setCsvData(text);
                            fullCsvContent.current = text;
                        }
                    }}
                    editable={!isImporting && !fileStats} 
                  />
                  {fileStats && (
                     <View style={{marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between'}}>
                        <Text style={{fontSize: 12, color: colors.textSecondary}}>
                            File: {fileStats.name} ({(fileStats.size / 1024).toFixed(1)} KB)
                        </Text>
                        <TouchableOpacity onPress={() => {
                            setCsvData('');
                            fullCsvContent.current = null;
                            setFileStats(null);
                        }}>
                            <Text style={{fontSize: 12, color: '#EF4444'}}>Clear File</Text>
                        </TouchableOpacity>
                     </View>
                  )}
                  {importProgress ? (
                    <View style={{marginBottom: 12}}>
                      <Text style={{color: colors.primary, textAlign: 'center'}}>{importProgress}</Text>
                      <ActivityIndicator style={{marginTop: 8}} color={colors.primary} />
                    </View>
                  ) : null}
                  <TouchableOpacity 
                    style={[styles.saveButton, {opacity: isImporting ? 0.5 : 1}]} 
                    onPress={handleImportCsv}
                    disabled={isImporting}
                  >
                    <Text style={styles.saveButtonText}>
                      {isImporting ? 'Importing...' : 'Process CSV'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Management</Text>
            {/* Existing User Management Logic */}
            {recentUsers.map((u) => (
              <View key={u.id} style={styles.userCard}>
                <Text style={styles.userName}>{u.full_name}</Text>
                {/* ... actions ... */}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'ai-config' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Configuration</Text>
            <Text style={{color: colors.textSecondary, marginBottom: 16}}>
              Adjust prompts, weights, and model behavior.
            </Text>
            
            {/* System Prompt Config */}
            <View style={styles.configCard}>
              <Text style={styles.configTitle}>Assessment System Prompt (JSON)</Text>
              <Text style={styles.configDescription}>
                Instructions for the AI when analyzing listing photos.
              </Text>
              <TextInput 
                style={styles.configInput}
                multiline
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                placeholder="Loading..."
              />
              <View style={styles.configActions}>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={() => {
                    try {
                      const parsed = JSON.parse(systemPrompt);
                      handleSaveConfig('assessment_prompts', parsed);
                    } catch (e) {
                      Alert.alert('Invalid JSON', 'Please ensure the prompt is valid JSON');
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Weights Config */}
            <View style={styles.configCard}>
              <Text style={styles.configTitle}>Fairness Weights</Text>
              <Text style={styles.configDescription}>
                Adjust how much each factor contributes to the fairness score.
              </Text>
              <View style={{gap: 12}}>
                {Object.entries(fairnessWeights).map(([key, val]) => (
                  <View key={key} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={{color: colors.text, textTransform: 'capitalize'}}>{key.replace('_', ' ')}</Text>
                    <TextInput 
                      style={{
                        borderWidth: 1, 
                        borderColor: colors.border, 
                        borderRadius: 4, 
                        padding: 4, 
                        width: 60, 
                        textAlign: 'center',
                        color: colors.text
                      }}
                      keyboardType="numeric"
                      value={String(val)}
                      onChangeText={(text) => {
                        const num = parseFloat(text);
                        if (!isNaN(num) || text === '' || text === '.') {
                           setFairnessWeights(prev => ({ ...prev, [key]: text === '' ? 0 : num }));
                        }
                      }}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.configActions}>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={() => handleSaveConfig('criteria_weights', fairnessWeights)}
                >
                  <Text style={styles.saveButtonText}>Update Weights</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'review' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Review Queue</Text>
            {flaggedListings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle" size={48} color="#22C55E" />
                <Text style={styles.emptyStateText}>All flagged listings reviewed</Text>
              </View>
            ) : (
              flaggedListings.map((listing) => (
                <View key={listing.id} style={styles.disputeCard}>
                  <View style={styles.disputeHeader}>
                    <Text style={styles.disputeTitle}>{listing.house} - {listing.custom_name}</Text>
                    <Text style={{fontSize: 12, color: colors.textSecondary}} suppressHydrationWarning={true}>
                      {new Date(listing.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.disputeReason}>
                    Reason: {listing.ai_assessment_override ? 'Manual Flag' : 'Low AI Confidence'}
                  </Text>
                  <View style={styles.disputeActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, {borderColor: '#22C55E'}]}
                      onPress={() => handleApproveListing(listing)}
                    >
                      <Text style={[styles.actionButtonText, {color: '#22C55E'}]}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, {borderColor: colors.primary}]}
                      onPress={() => router.push(`/listing/${listing.id}`)}
                    >
                      <Text style={[styles.actionButtonText, {color: colors.primary}]}>Inspect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'models' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Model Management</Text>
            <View style={styles.configCard}>
              <Text style={styles.configTitle}>Active Model</Text>
              <Text style={styles.configDescription}>
                Select the underlying LLM for assessments.
              </Text>
              <View style={{flexDirection: 'row', gap: 12, marginTop: 8}}>
                <TouchableOpacity style={{
                  padding: 12, 
                  borderWidth: 2, 
                  borderColor: colors.primary, 
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center'
                }}>
                  <Text style={{fontWeight: 'bold', color: colors.primary}}>GPT-4o</Text>
                  <Text style={{fontSize: 10, color: colors.textSecondary}}>Current</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{
                  padding: 12, 
                  borderWidth: 1, 
                  borderColor: colors.border, 
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center'
                }}>
                  <Text style={{color: colors.text}}>Claude 3.5</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{
                  padding: 12, 
                  borderWidth: 1, 
                  borderColor: colors.border, 
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center'
                }}>
                  <Text style={{color: colors.text}}>DeepSeek</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{
                  padding: 12, 
                  borderWidth: 1, 
                  borderColor: colors.border, 
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center'
                }}>
                  <Text style={{color: colors.text}}>Gemini</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'ai-enhance' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 AI Database Enhancement</Text>
            <Text style={{color: colors.textSecondary, marginBottom: 16}}>
              Use AI (Gemini + OpenAI hybrid) and web scraping to automatically enhance fragrance data.
            </Text>

            {/* Enhancement Stats */}
            {enhancementStats && (
              <View style={[styles.statsGrid, {marginBottom: 16}]}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{enhancementStats.pending_requests}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{enhancementStats.processing_requests}</Text>
                  <Text style={styles.statLabel}>Processing</Text>
                </View>
                <View style={[styles.statCard, enhancementStats.pending_approvals > 0 && {borderColor: '#F59E0B', borderWidth: 2}]}>
                  <Text style={[styles.statValue, enhancementStats.pending_approvals > 0 && {color: '#F59E0B'}]}>
                    {enhancementStats.pending_approvals}
                  </Text>
                  <Text style={styles.statLabel}>⚡ Awaiting Approval</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{enhancementStats.total_completed_today}</Text>
                  <Text style={styles.statLabel}>Completed Today</Text>
                </View>
              </View>
            )}

            {/* Sub-tabs for Enhancement */}
            <View style={{flexDirection: 'row', marginBottom: 16, gap: 8}}>
              <TouchableOpacity 
                style={{
                  flex: 1, 
                  padding: 12, 
                  borderRadius: 8, 
                  backgroundColor: enhancementSubTab === 'find' ? colors.primary : colors.card,
                  alignItems: 'center'
                }}
                onPress={() => setEnhancementSubTab('find')}
              >
                <Text style={{color: enhancementSubTab === 'find' ? '#FFF' : colors.text, fontWeight: '600'}}>
                  🔍 Find & Enhance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{
                  flex: 1, 
                  padding: 12, 
                  borderRadius: 8, 
                  backgroundColor: enhancementSubTab === 'approve' ? colors.primary : colors.card,
                  alignItems: 'center',
                  position: 'relative'
                }}
                onPress={async () => {
                  setEnhancementSubTab('approve');
                  setEnhancementProgress('Loading pending changes...');
                  const changes = await enhancementService.getPendingChanges(50);
                  setPendingChanges(changes);
                  setEnhancementProgress('');
                }}
              >
                <Text style={{color: enhancementSubTab === 'approve' ? '#FFF' : colors.text, fontWeight: '600'}}>
                  ✅ Approve Changes
                </Text>
                {enhancementStats && enhancementStats.pending_approvals > 0 && (
                  <View style={{
                    position: 'absolute', 
                    top: -8, 
                    right: -8, 
                    backgroundColor: '#EF4444', 
                    borderRadius: 12, 
                    minWidth: 24, 
                    height: 24, 
                    justifyContent: 'center', 
                    alignItems: 'center'
                  }}>
                    <Text style={{color: '#FFF', fontSize: 12, fontWeight: 'bold'}}>
                      {enhancementStats.pending_approvals}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={{
                  flex: 1, 
                  padding: 12, 
                  borderRadius: 8, 
                  backgroundColor: enhancementSubTab === 'analytics' ? colors.primary : colors.card,
                  alignItems: 'center'
                }}
                onPress={async () => {
                  setEnhancementSubTab('analytics');
                  setEnhancementProgress('Loading analytics...');
                  // Load analytics data
                  const stats = await enhancementService.getEnhancementAnalytics();
                  setAnalyticsData(stats);
                  setEnhancementProgress('');
                }}
              >
                <Text style={{color: enhancementSubTab === 'analytics' ? '#FFF' : colors.text, fontWeight: '600'}}>
                  📊 Analytics
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progress Display */}
            {enhancementProgress ? (
              <View style={{marginVertical: 12, padding: 12, backgroundColor: colors.card, borderRadius: 8}}>
                <Text style={{color: colors.primary, textAlign: 'center'}}>{enhancementProgress}</Text>
                {enhancingFragranceId && <ActivityIndicator style={{marginTop: 8}} color={colors.primary} />}
              </View>
            ) : null}

            {/* FIND & ENHANCE SUB-TAB */}
            {enhancementSubTab === 'find' && (
              <>
                {/* Load Stats Button */}
                <TouchableOpacity 
                  style={[styles.saveButton, {marginBottom: 16}]}
                  onPress={async () => {
                    setEnhancementProgress('Loading enhancement stats...');
                    const stats = await enhancementService.getQueueStats();
                    setEnhancementStats(stats);
                    setEnhancementProgress('');
                  }}
                >
                  <Text style={styles.saveButtonText}>Refresh Stats</Text>
                </TouchableOpacity>

                {/* Quick Priority Filters */}
                <View style={{flexDirection: 'row', gap: 8, marginBottom: 16}}>
                  <TouchableOpacity 
                    style={[styles.actionButton, {flex: 1, borderColor: '#EF4444', backgroundColor: '#EF444410'}]}
                    onPress={async () => {
                      setEnhancementProgress('Finding fragrances missing images...');
                      const fragrances = await enhancementService.getFragrancesByPriority(20, { missingImages: true });
                      setFragrancesToEnhance(fragrances);
                      setEnhancementProgress(`Found ${fragrances.length} fragrances missing images`);
                    }}
                  >
                    <Text style={{color: '#EF4444', fontWeight: '600', fontSize: 12}}>🖼️ No Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, {flex: 1, borderColor: '#F59E0B', backgroundColor: '#F59E0B10'}]}
                    onPress={async () => {
                      setEnhancementProgress('Finding fragrances missing description...');
                      const fragrances = await enhancementService.getFragrancesByPriority(20, { missingDescription: true });
                      setFragrancesToEnhance(fragrances);
                      setEnhancementProgress(`Found ${fragrances.length} fragrances missing description`);
                    }}
                  >
                    <Text style={{color: '#F59E0B', fontWeight: '600', fontSize: 12}}>📝 No Desc</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, {flex: 1, borderColor: '#8B5CF6', backgroundColor: '#8B5CF610'}]}
                    onPress={async () => {
                      setEnhancementProgress('Finding least complete fragrances...');
                      const fragrances = await enhancementService.getFragrancesNeedingEnhancement(20);
                      setFragrancesToEnhance(fragrances);
                      setEnhancementProgress(`Found ${fragrances.length} fragrances needing enhancement`);
                    }}
                  >
                    <Text style={{color: '#8B5CF6', fontWeight: '600', fontSize: 12}}>⚡ Priority</Text>
                  </TouchableOpacity>
                </View>

                {/* Filter & Find Fragrances */}
                <View style={styles.configCard}>
                  <Text style={styles.configTitle}>Find Fragrances to Enhance</Text>
                  <Text style={styles.configDescription}>
                    Search for fragrances with incomplete data that need AI enhancement.
                  </Text>
                  <TextInput 
                    style={[styles.configInput, {marginBottom: 12, minHeight: 40}]} 
                    placeholder="Filter by brand (e.g., Chanel, Dior)..." 
                    value={enhancementBrandFilter}
                    onChangeText={setEnhancementBrandFilter}
                  />
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={async () => {
                      setEnhancementProgress('Searching for fragrances needing enhancement...');
                      const fragrances = await enhancementService.getFragrancesNeedingEnhancement(
                        20,
                        enhancementBrandFilter || undefined
                      );
                      setFragrancesToEnhance(fragrances);
                      setEnhancementProgress(`Found ${fragrances.length} fragrances needing enhancement`);
                    }}
                  >
                    <Text style={styles.saveButtonText}>Search</Text>
                  </TouchableOpacity>
                </View>

            {/* Progress Display */}
            {enhancementProgress ? (
              <View style={{marginVertical: 12, padding: 12, backgroundColor: colors.card, borderRadius: 8}}>
                <Text style={{color: colors.primary, textAlign: 'center'}}>{enhancementProgress}</Text>
                {enhancingFragranceId && <ActivityIndicator style={{marginTop: 8}} color={colors.primary} />}
              </View>
            ) : null}

            {/* Fragrances List */}
            {fragrancesToEnhance.length > 0 && (
              <View style={styles.configCard}>
                <Text style={styles.configTitle}>Fragrances Needing Enhancement ({fragrancesToEnhance.length})</Text>
                {fragrancesToEnhance.map((frag) => (
                  <View key={frag.id} style={{
                    borderBottomWidth: 1, 
                    borderBottomColor: colors.border, 
                    paddingVertical: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <View style={{flex: 1}}>
                      <Text style={{color: colors.text, fontWeight: '600'}}>{frag.name}</Text>
                      <Text style={{color: colors.textSecondary, fontSize: 12}}>{frag.brand}</Text>
                      <Text style={{color: colors.textSecondary, fontSize: 10}}>
                        Completeness: {Math.round((frag.completeness_score || 0) * 100)}% | 
                        Missing: {(frag.missing_fields || []).slice(0, 3).join(', ')}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.actionButton, {
                        borderColor: colors.primary, 
                        paddingHorizontal: 12,
                        opacity: enhancingFragranceId === frag.id ? 0.5 : 1
                      }]}
                      disabled={enhancingFragranceId === frag.id}
                      onPress={async () => {
                        const adminId = user?.id || outsetaUser?.clientIdentifier || 'admin';
                        setEnhancingFragranceId(frag.id);
                        setEnhancementProgress(`Enhancing ${frag.name}...`);
                        
                        try {
                          // Create enhancement request
                          const requestId = await enhancementService.createEnhancementRequest(
                            frag.id,
                            adminId,
                            'hybrid',
                            5,
                            0.7
                          );
                          
                          if (requestId) {
                            setEnhancementProgress(`Request created. Running AI analysis...`);
                            
                            // Run the actual enhancement
                            const result = await aiEnhancementEngine.enhanceFragrance(
                              frag,
                              'hybrid'
                            );
                            
                            if (result.success && result.changes.length > 0) {
                              // Save changes to database
                              const savedCount = await enhancementService.createEnhancementChanges(
                                requestId,
                                result.changes
                              );
                              
                              await enhancementService.updateRequestStatus(requestId, 'completed');
                              setEnhancementProgress(`✅ ${frag.name}: ${savedCount} changes ready for approval`);
                              
                              // Refresh stats
                              const stats = await enhancementService.getQueueStats();
                              setEnhancementStats(stats);
                            } else {
                              await enhancementService.updateRequestStatus(requestId, 'failed', result.errors.join(', '));
                              setEnhancementProgress(`⚠️ ${frag.name}: ${result.errors.join(', ') || 'No changes detected'}`);
                            }
                          }
                        } catch (err) {
                          setEnhancementProgress(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
                        } finally {
                          setEnhancingFragranceId(null);
                        }
                      }}
                    >
                      {enhancingFragranceId === frag.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[styles.actionButtonText, {color: colors.primary}]}>Enhance</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Bulk Enhancement */}
            <View style={[styles.configCard, {marginTop: 16}]}>
              <Text style={styles.configTitle}>Bulk Enhancement</Text>
              <Text style={styles.configDescription}>
                Enhance all fragrances in the current list automatically.
              </Text>
              <TouchableOpacity 
                style={[styles.saveButton, {
                  backgroundColor: fragrancesToEnhance.length === 0 ? colors.border : colors.primary,
                  opacity: fragrancesToEnhance.length === 0 || enhancingFragranceId ? 0.5 : 1
                }]}
                disabled={fragrancesToEnhance.length === 0 || !!enhancingFragranceId}
                onPress={async () => {
                  const adminId = user?.id || outsetaUser?.clientIdentifier || 'admin';
                  const ids = fragrancesToEnhance.map(f => f.id);
                  
                  setEnhancementProgress(`Creating ${ids.length} enhancement requests...`);
                  
                  const requestIds = await enhancementService.createBulkEnhancementRequests(
                    ids,
                    adminId,
                    'hybrid',
                    5
                  );
                  
                  setEnhancementProgress(`✅ Created ${requestIds.length} enhancement requests. Processing in background...`);
                  
                  // Refresh stats
                  const stats = await enhancementService.getQueueStats();
                  setEnhancementStats(stats);
                }}
              >
                <Text style={styles.saveButtonText}>
                  Enhance All ({fragrancesToEnhance.length})
                </Text>
              </TouchableOpacity>
            </View>
              </>
            )}

            {/* APPROVE CHANGES SUB-TAB */}
            {enhancementSubTab === 'approve' && (
              <>
                <View style={styles.configCard}>
                  <Text style={styles.configTitle}>Pending Changes ({pendingChanges.length})</Text>
                  <Text style={styles.configDescription}>
                    Review and approve AI-generated changes before they're applied to the database.
                  </Text>
                  
                  {/* Quick Actions */}
                  <View style={{flexDirection: 'row', gap: 8, marginVertical: 12}}>
                    <TouchableOpacity 
                      style={[styles.actionButton, {flex: 1, borderColor: '#22C55E', backgroundColor: '#22C55E20'}]}
                      onPress={async () => {
                        const highConfidence = pendingChanges.filter(c => c.confidence_score >= 0.9);
                        if (highConfidence.length === 0) {
                          setEnhancementProgress('No high-confidence changes to auto-approve');
                          return;
                        }
                        setEnhancementProgress(`Auto-approving ${highConfidence.length} high-confidence changes...`);
                        const adminId = user?.id || outsetaUser?.clientIdentifier || 'admin';
                        await enhancementService.approveChanges(highConfidence.map(c => c.id), adminId);
                        const changes = await enhancementService.getPendingChanges(50);
                        setPendingChanges(changes);
                        const stats = await enhancementService.getQueueStats();
                        setEnhancementStats(stats);
                        setEnhancementProgress(`✅ Auto-approved ${highConfidence.length} changes`);
                      }}
                    >
                      <Text style={{color: '#22C55E', fontWeight: '600'}}>✅ Auto-Approve High Confidence (≥90%)</Text>
                    </TouchableOpacity>
                  </View>

                  {pendingChanges.length === 0 ? (
                    <View style={{padding: 24, alignItems: 'center'}}>
                      <Text style={{fontSize: 48, marginBottom: 12}}>🎉</Text>
                      <Text style={{color: colors.textSecondary, textAlign: 'center'}}>
                        No pending changes to review!{'\n'}All caught up.
                      </Text>
                    </View>
                  ) : (
                    pendingChanges.map((change) => (
                      <View key={change.id} style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 12,
                        backgroundColor: colors.card
                      }}>
                        {/* Change Header */}
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                          <View>
                            <Text style={{color: colors.text, fontWeight: '600', fontSize: 14}}>
                              {change.fragrance_name || 'Unknown Fragrance'}
                            </Text>
                            <Text style={{color: colors.textSecondary, fontSize: 12}}>
                              Field: {change.field_name} • Source: {change.source}
                            </Text>
                          </View>
                          <View style={{
                            backgroundColor: change.confidence_score >= 0.9 ? '#22C55E20' : 
                                           change.confidence_score >= 0.7 ? '#F59E0B20' : '#EF444420',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12
                          }}>
                            <Text style={{
                              color: change.confidence_score >= 0.9 ? '#22C55E' : 
                                     change.confidence_score >= 0.7 ? '#F59E0B' : '#EF4444',
                              fontWeight: '600',
                              fontSize: 12
                            }}>
                              {Math.round(change.confidence_score * 100)}% confidence
                            </Text>
                          </View>
                        </View>

                        {/* Diff View */}
                        <View style={{backgroundColor: colors.background, borderRadius: 6, padding: 8, marginBottom: 8}}>
                          <View style={{flexDirection: 'row', marginBottom: 4}}>
                            <Text style={{color: '#EF4444', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', flex: 1}}>
                              - {JSON.stringify(change.old_value) || '(empty)'}
                            </Text>
                          </View>
                          <View style={{flexDirection: 'row'}}>
                            <Text style={{color: '#22C55E', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', flex: 1}}>
                              + {JSON.stringify(change.new_value)}
                            </Text>
                          </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={{flexDirection: 'row', gap: 8}}>
                          <TouchableOpacity 
                            style={{
                              flex: 1, 
                              padding: 10, 
                              backgroundColor: '#22C55E', 
                              borderRadius: 6, 
                              alignItems: 'center'
                            }}
                            onPress={async () => {
                              const adminId = user?.id || outsetaUser?.clientIdentifier || 'admin';
                              await enhancementService.approveChanges([change.id], adminId);
                              setPendingChanges(prev => prev.filter(c => c.id !== change.id));
                              const stats = await enhancementService.getQueueStats();
                              setEnhancementStats(stats);
                            }}
                          >
                            <Text style={{color: '#FFF', fontWeight: '600'}}>✅ Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={{
                              flex: 1, 
                              padding: 10, 
                              backgroundColor: '#EF4444', 
                              borderRadius: 6, 
                              alignItems: 'center'
                            }}
                            onPress={async () => {
                              const adminId = user?.id || outsetaUser?.clientIdentifier || 'admin';
                              await enhancementService.rejectChanges([change.id], adminId, 'Rejected by admin');
                              setPendingChanges(prev => prev.filter(c => c.id !== change.id));
                              const stats = await enhancementService.getQueueStats();
                              setEnhancementStats(stats);
                            }}
                          >
                            <Text style={{color: '#FFF', fontWeight: '600'}}>❌ Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            {/* ANALYTICS SUB-TAB */}
            {enhancementSubTab === 'analytics' && (
              <>
                <View style={styles.configCard}>
                  <Text style={styles.configTitle}>📊 Enhancement Analytics</Text>
                  
                  {analyticsData ? (
                    <>
                      {/* Key Metrics */}
                      <View style={[styles.statsGrid, {marginTop: 12}]}>
                        <View style={styles.statCard}>
                          <Text style={styles.statValue}>{analyticsData.total_enhanced}</Text>
                          <Text style={styles.statLabel}>Total Enhanced</Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={[styles.statValue, {color: analyticsData.success_rate >= 80 ? '#22C55E' : '#F59E0B'}]}>
                            {analyticsData.success_rate}%
                          </Text>
                          <Text style={styles.statLabel}>Success Rate</Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statValue}>{analyticsData.avg_changes_per_fragrance.toFixed(1)}</Text>
                          <Text style={styles.statLabel}>Avg Changes/Fragrance</Text>
                        </View>
                      </View>

                      {/* Top Sources */}
                      <Text style={{color: colors.text, fontWeight: '600', marginTop: 16, marginBottom: 8}}>
                        Top Data Sources
                      </Text>
                      {analyticsData.top_sources.map((source, idx) => (
                        <View key={source.source} style={{
                          flexDirection: 'row', 
                          justifyContent: 'space-between', 
                          paddingVertical: 8,
                          borderBottomWidth: idx < analyticsData.top_sources.length - 1 ? 1 : 0,
                          borderBottomColor: colors.border
                        }}>
                          <Text style={{color: colors.text}}>{source.source}</Text>
                          <Text style={{color: colors.primary, fontWeight: '600'}}>{source.count} changes</Text>
                        </View>
                      ))}

                      {/* Recent Activity Chart (simple bar representation) */}
                      <Text style={{color: colors.text, fontWeight: '600', marginTop: 16, marginBottom: 8}}>
                        Recent Activity (Last 7 Days)
                      </Text>
                      <View style={{flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4}}>
                        {analyticsData.recent_activity.map((day, idx) => {
                          const maxCount = Math.max(...analyticsData.recent_activity.map(d => d.count), 1);
                          const height = (day.count / maxCount) * 80;
                          return (
                            <View key={day.date} style={{flex: 1, alignItems: 'center'}}>
                              <View style={{
                                width: '100%', 
                                height: Math.max(height, 4), 
                                backgroundColor: colors.primary,
                                borderRadius: 4
                              }} />
                              <Text style={{color: colors.textSecondary, fontSize: 10, marginTop: 4}}>
                                {new Date(day.date).toLocaleDateString('en-AU', {weekday: 'short'})}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <View style={{padding: 24, alignItems: 'center'}}>
                      <ActivityIndicator color={colors.primary} />
                      <Text style={{color: colors.textSecondary, marginTop: 8}}>Loading analytics...</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'market' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Marketplace</Text>
            <TouchableOpacity style={[styles.actionButton, {backgroundColor: colors.primary, borderColor: colors.primary, marginBottom: 16}]}>
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={{color: '#FFF', fontWeight: 'bold'}}>Create Verified Listing</Text>
            </TouchableOpacity>
            <View style={styles.emptyState}>
              <Ionicons name="storefront" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No admin listings active</Text>
            </View>
          </View>
        )}

        {/* Other tabs placeholders */}
        {(activeTab === 'listings' || activeTab === 'swaps') && activeTab !== 'overview' && (
           <View style={styles.section}>
             <Text style={styles.sectionTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</Text>
             <View style={styles.emptyState}>
               <Text style={styles.emptyStateText}>Placeholder for {activeTab}</Text>
             </View>
           </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
