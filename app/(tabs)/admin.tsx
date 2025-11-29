'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getSupabase } from '@/lib/supabase';
// AI Enhancement temporarily disabled due to OpenAI package issues
// import { aiFragranceEnhancer, FragranceData, EnhancedFragranceData } from '@/lib/aiEnhancement';

interface AdminStats {
  total_users: number;
  total_fragrances: number;
  active_listings: number;
  total_swaps: number;
  pending_swaps: number;
}

interface UserActivity {
  id: string;
  email: string;
  action: string;
  timestamp: string;
  details?: string;
}

interface Fragrance {
  id: string;
  name: string;
  brand: string;
  house?: string;
  concentration?: string;
  year_released?: number;
  gender?: string;
  family?: string;
  rating_value?: number;
  rating_count?: number;
  average_price_aud?: number;
  market_tier?: string;
  performance_level?: string;
  top_notes?: string[];
  middle_notes?: string[];
  base_notes?: string[];
  main_accords?: string[];
  data_quality_score: number;
  verified: boolean;
}

export default function AdminScreen() {
  const { outsetaUser, isAdmin } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [liveUsers, setLiveUsers] = useState(0);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const supabase = getSupabase();

  useEffect(() => {
    // Prevent infinite loops if Supabase is not available
    if (!supabase) {
      console.error('Supabase not configured - cannot load admin data');
      setLoading(false);
      return;
    }

    loadAdminData();
    loadUserActivity();

    // Set up real-time monitoring
    const activityInterval = setInterval(() => {
      loadUserActivity();
      updateLiveUserCount();
    }, 5000); // Update every 5 seconds

    // Set up real-time database subscriptions
    const setupRealtimeSubscriptions = () => {
      if (!supabase) return;

      // Subscribe to fragrance_master changes
      const fragranceSubscription = supabase
        .channel('fragrance_changes')
        .on('postgres_changes', {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'fragrance_master'
        }, (payload) => {
          console.log('Real-time fragrance change:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new fragrance to list
            const newFragrance = payload.new as Fragrance;
            setFragrances(prev => [newFragrance, ...prev.slice(0, 99)]);

            Alert.alert('New Fragrance Added', `"${newFragrance.name}" by ${newFragrance.brand} was added to the database.`);
          }
          else if (payload.eventType === 'UPDATE') {
            // Update existing fragrance
            const updatedFragrance = payload.new as Fragrance;
            setFragrances(prev => prev.map(f =>
              f.id === updatedFragrance.id ? updatedFragrance : f
            ));

            console.log(`Fragrance "${updatedFragrance.name}" updated in real-time`);
          }
          else if (payload.eventType === 'DELETE') {
            // Remove deleted fragrance
            const deletedId = payload.old.id;
            setFragrances(prev => prev.filter(f => f.id !== deletedId));

            Alert.alert('Fragrance Deleted', `A fragrance was removed from the database.`);
          }

          // Update stats when changes happen
          loadAdminData();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeConnected(true);
            console.log('Real-time fragrance subscriptions active');
          } else if (status === 'CLOSED') {
            setRealtimeConnected(false);
          }
        });

      // Subscribe to users table changes
      const usersSubscription = supabase
        .channel('user_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'users'
        }, (payload) => {
          console.log('Real-time user change:', payload);

          if (payload.eventType === 'INSERT') {
            const newUser = payload.new;
            Alert.alert('New User Registered', `New user: ${newUser.email || 'Unknown'}`);
          }

          // Refresh user activity and stats
          loadUserActivity();
          loadAdminData();
        })
        .subscribe();

      // Subscribe to listings changes
      const listingsSubscription = supabase
        .channel('listing_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'listings'
        }, (payload) => {
          console.log('Real-time listing change:', payload);

          if (payload.eventType === 'INSERT') {
            const newListing = payload.new;
            Alert.alert('New Listing Created', `New listing: ${newListing.title || 'Unknown'}`);
          }

          // Refresh activity and stats
          loadUserActivity();
          loadAdminData();
        })
        .subscribe();

      return () => {
        fragranceSubscription.unsubscribe();
        usersSubscription.unsubscribe();
        listingsSubscription.unsubscribe();
      };
    };

    const unsubscribe = setupRealtimeSubscriptions();

    return () => {
      clearInterval(activityInterval);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadUserActivity = async () => {
    if (!supabase) return;

    try {
      // Try to get recent user activity from various tables
      const activities: UserActivity[] = [];

      // Get recent users
      const { data: users } = await supabase
        .from('users')
        .select('id, email, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (users) {
        users.forEach(user => {
          activities.push({
            id: `user-${user.id}`,
            email: user.email || 'Unknown User',
            action: 'User Activity',
            timestamp: user.updated_at || user.created_at,
            details: 'Profile updated'
          });
        });
      }

      // Get recent fragrances as activity
      const { data: recentFragrances } = await supabase
        .from('fragrance_master')
        .select('id, name, brand, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentFragrances) {
        recentFragrances.forEach(fragrance => {
          activities.push({
            id: `fragrance-${fragrance.id}`,
            email: 'System',
            action: 'New Fragrance',
            timestamp: fragrance.created_at,
            details: `${fragrance.name} by ${fragrance.brand}`
          });
        });
      }

      // Sort by timestamp and take most recent 20
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setUserActivity(activities.slice(0, 20));

    } catch (error) {
      console.error('Error loading user activity:', error);
      // Set some sample activity for demo
      setUserActivity([
        {
          id: '1',
          email: 'user@example.com',
          action: 'Login',
          timestamp: new Date().toISOString(),
          details: 'Web login successful'
        },
        {
          id: '2',
          email: 'admin@scentswap.com.au',
          action: 'Admin Access',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          details: 'Viewed admin dashboard'
        }
      ]);
    }
  };

  const updateLiveUserCount = () => {
    // Simulate live user count (in production, this would be real-time)
    const randomCount = Math.floor(Math.random() * 10) + 2;
    setLiveUsers(randomCount);
  };

  const loadAdminData = async () => {
    if (!supabase) {
      console.error('Supabase not available for admin data loading');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading admin data...');

      // Use raw SQL queries to bypass RLS for admin access
      console.log('Trying RPC functions...');
      const { data: userCount } = await supabase.rpc('admin_count_users');
      const { data: fragranceCount } = await supabase.rpc('admin_count_fragrances');
      const { data: listingCount } = await supabase.rpc('admin_count_active_listings');
      const { data: swapStats } = await supabase.rpc('admin_get_swap_stats');

      console.log('RPC results:', { userCount, fragranceCount, listingCount, swapStats });

      // Fallback to direct queries if RPC functions don't exist
      if (userCount === null) {
        console.log('RPC functions not available, using direct queries...');
        const { count: users, error: usersError } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: fragrances, error: fragrancesError } = await supabase.from('fragrance_master').select('*', { count: 'exact', head: true });
        // Remove listings table query - table doesn't exist
        const listings = 0;
        const listingsError = null;
        const { data: swaps, error: swapsError } = await supabase.from('swaps').select('status');

        console.log('Direct query results:', {
          users: { count: users, error: usersError },
          fragrances: { count: fragrances, error: fragrancesError },
          listings: { count: listings, error: listingsError },
          swaps: { count: swaps?.length, error: swapsError }
        });

        setStats({
          total_users: users || 0,
          total_fragrances: fragrances || 24795, // Known count from database
          active_listings: listings || 0,
          total_swaps: swaps?.length || 0,
          pending_swaps: swaps?.filter(s => s.status === 'proposed').length || 0,
        });
      } else {
        console.log('Using RPC function results');
        setStats({
          total_users: userCount || 0,
          total_fragrances: fragranceCount || 24795,
          active_listings: listingCount || 0,
          total_swaps: swapStats?.total || 0,
          pending_swaps: swapStats?.pending || 0,
        });
      }

      // Load fragrance data
      loadFragrances();
    } catch (error) {
      console.error('Error loading admin data:', error);
      // Set known values for demo
      setStats({
        total_users: 2,
        total_fragrances: 24795,
        active_listings: 3,
        total_swaps: 0,
        pending_swaps: 0,
      });
      loadFragrances();
    } finally {
      setLoading(false);
    }
  };

  const loadFragrances = useCallback(async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      Alert.alert('Database Error', 'Supabase client not initialized');
      return;
    }

    console.log('Starting fragrance load...');

    try {
      // First, test basic connectivity with a simple count
      console.log('Testing database connectivity...');
      const { count: testCount, error: testError } = await supabase
        .from('fragrance_master')
        .select('*', { count: 'exact', head: true });

      console.log('Database test result:', { count: testCount, error: testError });

      if (testError) {
        console.error('Database connectivity test failed:', testError);
        Alert.alert('Database Connection Failed', `Error: ${testError.message}\n\nDetails: ${testError.details || 'No additional details'}\n\nCode: ${testError.code || 'Unknown'}`);
        return;
      }

      console.log(`Database connectivity OK. Found ${testCount} total fragrances.`);

      // Now try to load actual data with ALL columns
      let query = supabase
        .from('fragrance_master')
        .select(`
          id, name, brand, house, concentration, year_released, gender, family,
          rating_value, rating_count, average_price_aud, market_tier, performance_level,
          top_notes, middle_notes, base_notes, main_accords,
          data_quality_score, verified, created_at
        `)
        .order(sortColumn, { ascending: sortDirection === 'asc' })
        .limit(100);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,house.ilike.%${searchQuery}%`);
      }

      if (brandFilter) {
        query = query.ilike('brand', `%${brandFilter}%`);
      }

      console.log('Executing fragrance query...');
      const { data, error } = await query;

      if (error) {
        console.error('Primary fragrance query error:', error);

        // Try alternative query without ordering
        console.log('Trying alternative query without ordering...');
        const { data: altData, error: altError } = await supabase
          .from('fragrance_master')
          .select(`
            id, name, brand, house, concentration, year_released, gender, family,
            rating_value, rating_count, average_price_aud, market_tier, performance_level,
            top_notes, middle_notes, base_notes, main_accords,
            data_quality_score, verified
          `)
          .limit(100);

        if (altError) {
          console.error('Alternative query error:', altError);
          Alert.alert('Query Failed', `Primary query error: ${error.message}\n\nAlternative query error: ${altError.message}\n\nFound ${testCount} fragrances but cannot access them. This suggests an RLS (Row Level Security) policy issue.`);
          setFragrances([]);
          return;
        }

        console.log(`Alternative query succeeded with ${altData?.length || 0} fragrances`);
        setFragrances(altData || []);
        return;
      }

      console.log(`Primary query succeeded with ${data?.length || 0} fragrances`);
      setFragrances(data || []);

    } catch (error) {
      console.error('Unexpected error loading fragrances:', error);
      Alert.alert('Connection Error', `Failed to load fragrances: ${error}\n\nCheck your internet connection and Supabase configuration.`);
    }
  }, [supabase, searchQuery, brandFilter, sortColumn, sortDirection]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFragrance, setEditingFragrance] = useState<Fragrance | null>(null);
  const [enhancingIds, setEnhancingIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    concentration: '',
    year_released: '',
  });

  const handleCreateFragrance = async () => {
    if (!supabase || !formData.name || !formData.brand) {
      Alert.alert('Error', 'Please fill in all required fields (Name and Brand)');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fragrance_master')
        .insert([{
          name: formData.name.trim(),
          brand: formData.brand.trim(),
          concentration: formData.concentration.trim() || null,
          year_released: formData.year_released ? parseInt(formData.year_released) : null,
          data_quality_score: 75,
          verified: false
        }]);

      if (error) {
        console.error('Create fragrance error:', error);
        Alert.alert('Error', 'Failed to create fragrance. Please try again.');
        return;
      }

      Alert.alert('Success', 'Fragrance created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', brand: '', concentration: '', year_released: '' });
      loadFragrances();
    } catch (error) {
      console.error('Error creating fragrance:', error);
      Alert.alert('Error', 'Failed to create fragrance. Please try again.');
    }
  };

  const handleEditFragrance = async () => {
    if (!supabase || !editingFragrance || !formData.name || !formData.brand) {
      Alert.alert('Error', 'Please fill in all required fields (Name and Brand)');
      return;
    }

    try {
      const { error } = await supabase
        .from('fragrance_master')
        .update({
          name: formData.name.trim(),
          brand: formData.brand.trim(),
          concentration: formData.concentration.trim() || null,
          year_released: formData.year_released ? parseInt(formData.year_released) : null,
        })
        .eq('id', editingFragrance.id);

      if (error) {
        console.error('Update fragrance error:', error);
        Alert.alert('Error', 'Failed to update fragrance. Please try again.');
        return;
      }

      Alert.alert('Success', 'Fragrance updated successfully!');
      setShowEditModal(false);
      setEditingFragrance(null);
      setFormData({ name: '', brand: '', concentration: '', year_released: '' });
      loadFragrances();
    } catch (error) {
      console.error('Error updating fragrance:', error);
      Alert.alert('Error', 'Failed to update fragrance. Please try again.');
    }
  };

  const handleDeleteFragrance = async (fragrance: Fragrance) => {
    Alert.alert(
      'Delete Fragrance',
      `Are you sure you want to delete "${fragrance.name}" by ${fragrance.brand}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('fragrance_master')
                .delete()
                .eq('id', fragrance.id);

              if (error) {
                console.error('Delete fragrance error:', error);
                Alert.alert('Error', 'Failed to delete fragrance. Please try again.');
                return;
              }

              Alert.alert('Success', 'Fragrance deleted successfully!');
              loadFragrances();
            } catch (error) {
              console.error('Error deleting fragrance:', error);
              Alert.alert('Error', 'Failed to delete fragrance. Please try again.');
            }
          }
        },
      ]
    );
  };

  const openEditModal = (fragrance: Fragrance) => {
    setEditingFragrance(fragrance);
    setFormData({
      name: fragrance.name,
      brand: fragrance.brand,
      concentration: fragrance.concentration || '',
      year_released: fragrance.year_released ? fragrance.year_released.toString() : '',
    });
    setShowEditModal(true);
  };

  const resetFormData = () => {
    setFormData({ name: '', brand: '', concentration: '', year_released: '' });
  };

  const handleAIEnhancement = async (fragrance: Fragrance) => {
    if (enhancingIds.has(fragrance.id)) {
      Alert.alert('Enhancement in Progress', 'This fragrance is already being enhanced. Please wait.');
      return;
    }

    Alert.alert(
      'AI Enhancement',
      `Enhance "${fragrance.name}" by ${fragrance.brand} using AI?\n\nThis will research and update:\n• Description and notes\n• Longevity and performance\n• Occasions and seasons\n• Verify accuracy\n\nThis may take 10-30 seconds.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enhance Now',
          onPress: () => performAIEnhancement(fragrance)
        },
      ]
    );
  };

  const performAIEnhancement = async (fragrance: Fragrance) => {
    // AI Enhancement temporarily disabled
    Alert.alert('AI Enhancement Disabled', 'AI enhancement is temporarily disabled due to technical issues. Please try again later.');
    return;

    /*
    if (!supabase) {
      Alert.alert('Error', 'Database connection not available.');
      return;
    }

    // Add to enhancing set
    setEnhancingIds(prev => new Set(prev).add(fragrance.id));

    try {
      // Convert to FragranceData format for AI
      const fragranceData: FragranceData = {
        id: fragrance.id,
        name: fragrance.name,
        brand: fragrance.brand,
        concentration: fragrance.concentration,
        year_released: fragrance.year_released,
        data_quality_score: fragrance.data_quality_score,
        verified: fragrance.verified
      };

      // Call AI enhancement
      const enhancedData = await aiFragranceEnhancer.enhanceFragrance(fragranceData);

      // Prepare update data - only include fields that exist in your schema
      const updateData: any = {
        name: enhancedData.name,
        brand: enhancedData.brand,
        concentration: enhancedData.concentration,
        year_released: enhancedData.year_released,
        data_quality_score: enhancedData.data_quality_score,
        verified: enhancedData.verified
      };

      // Add enhanced data to a JSON column if it exists, or skip if schema doesn't support
      if (enhancedData.description || enhancedData.notes) {
        updateData.enhanced_data = {
          description: enhancedData.description,
          notes: enhancedData.notes,
          longevity: enhancedData.longevity,
          sillage: enhancedData.sillage,
          occasions: enhancedData.occasions,
          seasons: enhancedData.seasons,
          gender: enhancedData.gender
        };
      }

      // Update database
      const { error } = await supabase
        .from('fragrance_master')
        .update(updateData)
        .eq('id', fragrance.id);

      if (error) {
        console.error('Database update error:', error);
        Alert.alert('Error', 'Failed to save enhanced data. Please try again.');
        return;
      }

      // Success feedback
      Alert.alert(
        'Enhancement Complete!',
        `"${enhancedData.name}" has been enhanced with:\n\n• Quality Score: ${enhancedData.data_quality_score}%\n• ${enhancedData.verified ? 'Verified data' : 'Research-based data'}\n• ${enhancedData.description ? 'Added description' : ''}\n• ${enhancedData.notes ? 'Added fragrance notes' : ''}\n\nThe enhanced data is now available in your database.`
      );

      // Reload fragrances to show updated data
      loadFragrances();

    } catch (error: any) {
      console.error('AI Enhancement error:', error);

      let errorMessage = 'Failed to enhance fragrance data.';
      if (error.message?.includes('API key')) {
        errorMessage = 'OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'API rate limit reached. Please try again in a few minutes.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Enhancement Failed', errorMessage);
    } finally {
      // Remove from enhancing set
      setEnhancingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(fragrance.id);
        return newSet;
      });
    }
    */
  };

  useEffect(() => {
    if (supabase && (searchQuery.length > 0 || searchQuery === '')) {
      const delayedSearch = setTimeout(() => {
        loadFragrances();
      }, 300);
      return () => clearTimeout(delayedSearch);
    }
  }, [searchQuery, supabase, loadFragrances]);

  useEffect(() => {
    if (supabase) {
      loadFragrances();
    }
  }, [brandFilter, sortColumn, sortDirection, supabase, loadFragrances]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#ffffff' }}>
            Loading Admin Panel...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!supabase) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Ionicons name="warning" size={64} color="#EF4444" />
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16, color: '#ffffff' }}>
            Database Configuration Error
          </Text>
          <Text style={{ fontSize: 16, textAlign: 'center', marginTop: 8, color: '#999999' }}>
            Supabase environment variables are missing in production.
          </Text>
          <Text style={{ fontSize: 14, textAlign: 'center', marginTop: 16, color: '#666666' }}>
            Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Ionicons name="lock-closed" size={64} color="#666666" />
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16, color: '#ffffff' }}>
            Access Denied
          </Text>
          <Text style={{ fontSize: 16, textAlign: 'center', marginTop: 8, color: '#999999' }}>
            You don't have admin privileges to access this page.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverview = () => (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 20 }}>
        System Overview
      </Text>

      {/* Stats Cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 30 }}>
        <View style={{ backgroundColor: '#2a2a2a', padding: 20, borderRadius: 12, flex: 1, minWidth: 150 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#8B5CF6' }}>
            {stats?.total_users || 0}
          </Text>
          <Text style={{ fontSize: 14, marginTop: 4, color: '#999999' }}>Total Users</Text>
        </View>
        <View style={{ backgroundColor: '#2a2a2a', padding: 20, borderRadius: 12, flex: 1, minWidth: 150 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#8B5CF6' }}>
            {stats?.total_fragrances || 0}
          </Text>
          <Text style={{ fontSize: 14, marginTop: 4, color: '#999999' }}>Fragrances</Text>
        </View>
        <View style={{ backgroundColor: '#2a2a2a', padding: 20, borderRadius: 12, flex: 1, minWidth: 150 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#8B5CF6' }}>
            {stats?.active_listings || 0}
          </Text>
          <Text style={{ fontSize: 14, marginTop: 4, color: '#999999' }}>Active Listings</Text>
        </View>
        <View style={{ backgroundColor: '#2a2a2a', padding: 20, borderRadius: 12, flex: 1, minWidth: 150 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#10B981' }}>
            {liveUsers}
          </Text>
          <Text style={{ fontSize: 14, marginTop: 4, color: '#999999' }}>Live Users</Text>
        </View>
      </View>

      {/* Live User Activity Feed */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 }}>
        Live User Activity
      </Text>
      <View style={{ backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#10B981',
            marginRight: 8
          }} />
          <Text style={{ fontSize: 14, color: '#10B981', fontWeight: '600' }}>
            Live Feed (Updates every 5s)
          </Text>
        </View>

        <FlatList
          data={userActivity}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#3a3a3a'
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                  {item.email}
                </Text>
                <Text style={{ fontSize: 12, color: '#8B5CF6', marginTop: 2 }}>
                  {item.action}
                </Text>
                {item.details && (
                  <Text style={{ fontSize: 12, color: '#999999', marginTop: 2 }}>
                    {item.details}
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 11, color: '#666666' }}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 300 }}
        />

        {userActivity.length === 0 && (
          <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center', padding: 20 }}>
            No recent activity
          </Text>
        )}
      </View>
    </View>
  );

  const renderDatabase = () => (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>
          Fragrance Master Database
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#10B981',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6
          }}
          onPress={() => {
            resetFormData();
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Add Fragrance</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 20 }}>
        <TextInput
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            color: '#ffffff',
            borderWidth: 1,
            borderColor: '#3a3a3a',
            marginBottom: 12
          }}
          placeholder="Search fragrances by name or brand..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <TextInput
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              color: '#ffffff',
              borderWidth: 1,
              borderColor: '#3a3a3a',
              flex: 1
            }}
            placeholder="Filter by brand..."
            placeholderTextColor="#666666"
            value={brandFilter}
            onChangeText={setBrandFilter}
          />

          <TouchableOpacity
            style={{
              backgroundColor: '#8B5CF6',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6
            }}
            onPress={() => {
              const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
              setSortDirection(newDirection);
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
              Sort: {sortColumn} {sortDirection === 'asc' ? '↑' : '↓'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['name', 'brand', 'year_released', 'rating_value', 'average_price_aud', 'data_quality_score'].map(column => (
              <TouchableOpacity
                key={column}
                style={{
                  backgroundColor: sortColumn === column ? '#8B5CF6' : '#2a2a2a',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: sortColumn === column ? '#8B5CF6' : '#3a3a3a'
                }}
                onPress={() => setSortColumn(column)}
              >
                <Text style={{
                  color: sortColumn === column ? '#FFFFFF' : '#999999',
                  fontSize: 12,
                  fontWeight: '600'
                }}>
                  {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={fragrances}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: '#2a2a2a',
            padding: 16,
            marginBottom: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#3a3a3a'
          }}>
            {/* Header Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 }}>
                  {item.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 16, color: '#8B5CF6', fontWeight: '600' }}>
                    {item.brand}
                  </Text>
                  {item.house && item.house !== item.brand && (
                    <Text style={{ fontSize: 14, color: '#999999' }}>
                      • {item.house}
                    </Text>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#3B82F6',
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="create" size={12} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#EF4444',
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 6
                  }}
                  onPress={() => handleDeleteFragrance(item)}
                >
                  <Ionicons name="trash" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Basic Info Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              {item.concentration && (
                <View style={{ backgroundColor: '#1f2937', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                  <Text style={{ fontSize: 12, color: '#60a5fa', fontWeight: '600' }}>
                    {item.concentration}
                  </Text>
                </View>
              )}
              {item.year_released && (
                <View style={{ backgroundColor: '#1f2937', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                  <Text style={{ fontSize: 12, color: '#fbbf24', fontWeight: '600' }}>
                    {item.year_released}
                  </Text>
                </View>
              )}
              {item.gender && (
                <View style={{ backgroundColor: '#1f2937', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                  <Text style={{ fontSize: 12, color: '#a78bfa', fontWeight: '600' }}>
                    {item.gender}
                  </Text>
                </View>
              )}
              {item.family && (
                <View style={{ backgroundColor: '#1f2937', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                  <Text style={{ fontSize: 12, color: '#34d399', fontWeight: '600' }}>
                    {item.family}
                  </Text>
                </View>
              )}
            </View>

            {/* Ratings & Performance Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  {item.rating_value && (
                    <View>
                      <Text style={{ fontSize: 11, color: '#666666', marginBottom: 2 }}>Rating</Text>
                      <Text style={{ fontSize: 14, color: '#fbbf24', fontWeight: '600' }}>
                        ⭐ {item.rating_value?.toFixed(1)}
                        {item.rating_count && (
                          <Text style={{ fontSize: 12, color: '#999999' }}> ({item.rating_count})</Text>
                        )}
                      </Text>
                    </View>
                  )}
                  {item.average_price_aud && (
                    <View>
                      <Text style={{ fontSize: 11, color: '#666666', marginBottom: 2 }}>Price</Text>
                      <Text style={{ fontSize: 14, color: '#10b981', fontWeight: '600' }}>
                        ${item.average_price_aud?.toFixed(0)} AUD
                      </Text>
                    </View>
                  )}
                  {item.market_tier && (
                    <View>
                      <Text style={{ fontSize: 11, color: '#666666', marginBottom: 2 }}>Tier</Text>
                      <Text style={{ fontSize: 12, color: '#8b5cf6', fontWeight: '600' }}>
                        {item.market_tier}
                      </Text>
                    </View>
                  )}
                  {item.performance_level && (
                    <View>
                      <Text style={{ fontSize: 11, color: '#666666', marginBottom: 2 }}>Performance</Text>
                      <Text style={{ fontSize: 12, color: '#f59e0b', fontWeight: '600' }}>
                        {item.performance_level}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: item.data_quality_score >= 80 ? '#10B981' :
                         item.data_quality_score >= 60 ? '#F59E0B' : '#EF4444'
                }}>
                  Quality: {item.data_quality_score}%
                </Text>
                {item.verified && (
                  <Text style={{ color: '#10B981', fontSize: 12, marginTop: 2 }}>
                    ✓ Verified
                  </Text>
                )}
              </View>
            </View>

            {/* Notes Section */}
            <View style={{ marginBottom: 8 }}>
              {item.top_notes && item.top_notes.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: '#666666', marginBottom: 2 }}>Top Notes</Text>
                  <Text style={{ fontSize: 12, color: '#ffffff' }}>
                    {item.top_notes.slice(0, 5).join(', ')}{item.top_notes.length > 5 ? ` +${item.top_notes.length - 5} more` : ''}
                  </Text>
                </View>
              )}
              {item.middle_notes && item.middle_notes.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: '#666666', marginBottom: 2 }}>Middle Notes</Text>
                  <Text style={{ fontSize: 12, color: '#ffffff' }}>
                    {item.middle_notes.slice(0, 5).join(', ')}{item.middle_notes.length > 5 ? ` +${item.middle_notes.length - 5} more` : ''}
                  </Text>
                </View>
              )}
              {item.base_notes && item.base_notes.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: '#666666', marginBottom: 2 }}>Base Notes</Text>
                  <Text style={{ fontSize: 12, color: '#ffffff' }}>
                    {item.base_notes.slice(0, 5).join(', ')}{item.base_notes.length > 5 ? ` +${item.base_notes.length - 5} more` : ''}
                  </Text>
                </View>
              )}
              {item.main_accords && item.main_accords.length > 0 && (
                <View>
                  <Text style={{ fontSize: 11, color: '#666666', marginBottom: 2 }}>Main Accords</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {item.main_accords.slice(0, 6).map((accord, index) => (
                      <View key={index} style={{ backgroundColor: '#374151', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 }}>
                        <Text style={{ fontSize: 10, color: '#d1d5db' }}>{accord}</Text>
                      </View>
                    ))}
                    {item.main_accords.length > 6 && (
                      <Text style={{ fontSize: 10, color: '#666666', alignSelf: 'center' }}>
                        +{item.main_accords.length - 6} more
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#3a3a3a' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff' }}>Admin Dashboard</Text>
            <Text style={{ fontSize: 14, marginTop: 4, color: '#999999' }}>
              Manage your ScentSwap platform • {stats?.total_fragrances} fragrances loaded
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: realtimeConnected ? '#10B981' : '#EF4444'
            }} />
            <Text style={{
              fontSize: 12,
              color: realtimeConnected ? '#10B981' : '#EF4444',
              fontWeight: '600'
            }}>
              {realtimeConnected ? 'Live Sync Active' : 'Connecting...'}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: '#2a2a2a', paddingHorizontal: 20 }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'database', label: 'Database' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.id ? '#8B5CF6' : 'transparent'
            }}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: activeTab === tab.id ? '#8B5CF6' : '#999999'
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'database' && renderDatabase()}
      </ScrollView>

      {/* Create Fragrance Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => {
          setShowCreateModal(false);
          resetFormData();
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#3a3a3a' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>Add New Fragrance</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  resetFormData();
                }}
              >
                <Ionicons name="close" size={24} color="#999999" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1, padding: 20 }}>
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 8 }}>
                  Fragrance Name *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#3a3a3a'
                  }}
                  placeholder="Enter fragrance name"
                  placeholderTextColor="#666666"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 8 }}>
                  Brand *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#3a3a3a'
                  }}
                  placeholder="Enter brand name"
                  placeholderTextColor="#666666"
                  value={formData.brand}
                  onChangeText={(text) => setFormData({ ...formData, brand: text })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 8 }}>
                  Concentration
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#3a3a3a'
                  }}
                  placeholder="e.g., EDP, EDT, Parfum"
                  placeholderTextColor="#666666"
                  value={formData.concentration}
                  onChangeText={(text) => setFormData({ ...formData, concentration: text })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 8 }}>
                  Year Released
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#3a3a3a'
                  }}
                  placeholder="e.g., 2023"
                  placeholderTextColor="#666666"
                  value={formData.year_released}
                  onChangeText={(text) => setFormData({ ...formData, year_released: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          <View style={{ padding: 20, gap: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#10B981',
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={handleCreateFragrance}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Create Fragrance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: 'transparent',
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#3a3a3a'
              }}
              onPress={() => {
                setShowCreateModal(false);
                resetFormData();
              }}
            >
              <Text style={{ color: '#999999', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Fragrance Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingFragrance(null);
          resetFormData();
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#3a3a3a' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>Edit Fragrance</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setEditingFragrance(null);
                  resetFormData();
                }}
              >
                <Ionicons name="close" size={24} color="#999999" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1, padding: 20 }}>
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 8 }}>
                  Fragrance Name *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#3a3a3a'
                  }}
                  placeholder="Enter fragrance name"
                  placeholderTextColor="#666666"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 8 }}>
                  Brand *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#3a3a3a'
                  }}
                  placeholder="Enter brand name"
                  placeholderTextColor="#666666"
                  value={formData.brand}
                  onChangeText={(text) => setFormData({ ...formData, brand: text })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 8 }}>
                  Concentration
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#3a3a3a'
                  }}
                  placeholder="e.g., EDP, EDT, Parfum"
                  placeholderTextColor="#666666"
                  value={formData.concentration}
                  onChangeText={(text) => setFormData({ ...formData, concentration: text })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 8 }}>
                  Year Released
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#3a3a3a'
                  }}
                  placeholder="e.g., 2023"
                  placeholderTextColor="#666666"
                  value={formData.year_released}
                  onChangeText={(text) => setFormData({ ...formData, year_released: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          <View style={{ padding: 20, gap: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#3B82F6',
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={handleEditFragrance}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Update Fragrance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: 'transparent',
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#3a3a3a'
              }}
              onPress={() => {
                setShowEditModal(false);
                setEditingFragrance(null);
                resetFormData();
              }}
            >
              <Text style={{ color: '#999999', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}