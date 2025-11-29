'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getSupabase } from '@/lib/supabase';

interface AdminStats {
  total_users: number;
  total_fragrances: number;
  active_listings: number;
  total_swaps: number;
  pending_swaps: number;
}

interface Fragrance {
  id: string;
  name: string;
  brand: string;
  concentration?: string;
  year_released?: number;
  data_quality_score: number;
  verified: boolean;
}

export default function AdminDashboard() {
  const { outsetaUser, isAdmin } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = getSupabase();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load stats
      const { data: users } = await supabase.from('users').select('id');
      const { data: fragranceData } = await supabase.from('fragrance_master').select('id');
      const { data: listings } = await supabase.from('listings').select('id').eq('is_active', true);
      const { data: swaps } = await supabase.from('swaps').select('id, status');

      setStats({
        total_users: users?.length || 0,
        total_fragrances: fragranceData?.length || 0,
        active_listings: listings?.length || 0,
        total_swaps: swaps?.length || 0,
        pending_swaps: swaps?.filter(s => s.status === 'proposed').length || 0,
      });

      // Load fragrance data
      loadFragrances();
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFragrances = async () => {
    if (!supabase) return;

    try {
      let query = supabase
        .from('fragrance_master')
        .select('id, name, brand, concentration, year_released, data_quality_score, verified')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFragrances(data || []);
    } catch (error) {
      console.error('Error loading fragrances:', error);
    }
  };

  const handleAIEnhancement = async (fragranceId: string) => {
    Alert.alert(
      'AI Enhancement',
      'This would start the AI enhancement workflow for this fragrance. The system will analyze and improve the fragrance data using your configured AI providers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Enhancement',
          onPress: async () => {
            Alert.alert('Success', 'AI enhancement started! You can monitor progress in the AI Enhancement tab.');
          }
        },
      ]
    );
  };

  useEffect(() => {
    if (searchQuery.length > 0 || searchQuery === '') {
      const delayedSearch = setTimeout(() => {
        loadFragrances();
      }, 300);
      return () => clearTimeout(delayedSearch);
    }
  }, [searchQuery]);

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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
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
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#8B5CF6' }}>
            {stats?.total_swaps || 0}
          </Text>
          <Text style={{ fontSize: 14, marginTop: 4, color: '#999999' }}>Total Swaps</Text>
        </View>
      </View>
    </View>
  );

  const renderDatabase = () => (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 20 }}>
        Fragrance Master Database
      </Text>

      <View style={{ marginBottom: 20 }}>
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
          placeholder="Search fragrances by name or brand..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 }}>
              {item.name}
            </Text>
            <Text style={{ fontSize: 14, color: '#999999', marginBottom: 8 }}>
              {item.brand}
              {item.concentration && ` • ${item.concentration}`}
              {item.year_released && ` • ${item.year_released}`}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <View>
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

              <TouchableOpacity
                style={{
                  backgroundColor: '#8B5CF6',
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6
                }}
                onPress={() => handleAIEnhancement(item.id)}
              >
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Enhance</Text>
              </TouchableOpacity>
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
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff' }}>Admin Dashboard</Text>
        <Text style={{ fontSize: 14, marginTop: 4, color: '#999999' }}>
          Manage your ScentSwap platform • {stats?.total_fragrances} fragrances loaded
        </Text>
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
    </SafeAreaView>
  );
}