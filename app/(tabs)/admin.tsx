import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  subscription_tier: string;
  created_at: string;
}

interface FragranceData {
  id: string;
  name: string;
  brand: string;
  concentration?: string;
  year_released?: number;
}

export default function AdminScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fragrances, setFragrances] = useState<FragranceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFragrances: 0,
    uniqueBrands: 0
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase()!;

      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, subscription_tier, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      // Load fragrances
      const { data: fragrancesData } = await supabase
        .from('fragrance_master')
        .select('id, name, brand, concentration, year_released')
        .order('name')
        .limit(100);

      setUsers(usersData || []);
      setFragrances(fragrancesData || []);

      // Calculate basic stats
      const uniqueBrands = new Set((fragrancesData || []).map(f => f.brand)).size;
      setStats({
        totalUsers: usersData?.length || 0,
        totalFragrances: fragrancesData?.length || 0,
        uniqueBrands
      });

    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFragrances = fragrances.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderFragrance = ({ item }: { item: FragranceData }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>{item.name}</Text>
      <Text style={styles.itemSubtitle}>{item.brand}</Text>
      <View style={styles.itemDetails}>
        {item.concentration && <Text style={styles.itemTag}>{item.concentration}</Text>}
        {item.year_released && <Text style={styles.itemTag}>{item.year_released}</Text>}
      </View>
      <TouchableOpacity style={styles.aiButton}>
        <Text style={styles.aiButtonText}>✨ Enhance</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUser = ({ item }: { item: AdminUser }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>{item.email}</Text>
      <Text style={styles.itemSubtitle}>Tier: {item.subscription_tier}</Text>
      <Text style={styles.itemDetails}>Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#b68a71" />
        <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>System Status: Operational</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalFragrances}</Text>
            <Text style={styles.statLabel}>Fragrances</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.uniqueBrands}</Text>
            <Text style={styles.statLabel}>Brands</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search fragrances by name or brand..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {/* Fragrances Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗃️ Master Fragrance Database</Text>
          <FlatList
            data={filteredFragrances}
            renderItem={renderFragrance}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Users Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Recent Users</Text>
          <FlatList
            data={users.slice(0, 10)}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#f8fafc',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#16213E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#475569',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  searchSection: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: '#475569',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#16213E',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#475569',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  itemTag: {
    fontSize: 12,
    color: '#b68a71',
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  aiButton: {
    backgroundColor: '#b68a71',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  aiButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

