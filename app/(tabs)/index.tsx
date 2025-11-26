import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ListingCard } from '@/components/ListingCard';
import { Listing } from '@/types';
import { db } from '@/lib/database';
import { FilterDrawer } from '@/components/search/FilterDrawer';
import { SearchFilters } from '@/lib/ai';


export default function BrowseScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedConcentration, setSelectedConcentration] = useState('all');
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});


  useEffect(() => {
    loadListings();
  }, []);

  async function loadListings() {
    setLoading(true);
    const filters: any = {};
    if (search) filters.search = search;
    if (selectedConcentration !== 'all') filters.concentration = selectedConcentration;
    const data = await db.getListings(filters);
    setListings(data);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  }

  function handleSearch() {
    loadListings();
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginTop: 16,
      gap: 12,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      paddingHorizontal: 16,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
    },
    filterButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filtersContainer: {
      paddingVertical: 12,
    },
    filtersContent: {
      paddingHorizontal: 20,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      marginRight: 8,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
    },
    filterChipText: {
      fontSize: 14,
      color: colors.text,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    listContent: {
      padding: 20,
      paddingTop: 8,
    },
    listingContainer: {
      marginBottom: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderItem = ({ item }: { item: Listing }) => (
    <View style={styles.listingContainer}>
      <ListingCard
        listing={item}
        onPress={() => router.push(`/listing/${item.id}`)}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="flask-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyText}>No fragrances found</Text>
      <Text style={styles.emptySubtext}>
        Be the first to list a fragrance{'\n'}or try adjusting your filters
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>ScentSwap</Text>
        <Text style={styles.subtitle}>Trade scents, not cash</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search fragrances..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterDrawerVisible(true)}>
          <Ionicons name="options-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Quick Filters - Horizontal Scroll */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: 'All', value: 'all', type: 'concentration' },
            { label: 'Extrait', value: 'extrait', type: 'concentration' },
            { label: 'Parfum', value: 'parfum', type: 'concentration' },
            { label: 'EDP', value: 'edp', type: 'concentration' },
            { label: 'EDT', value: 'edt', type: 'concentration' },
            { label: 'EDC', value: 'edc', type: 'concentration' },
            { label: 'Cologne', value: 'cologne', type: 'concentration' },
          ]}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedConcentration === item.value && styles.filterChipActive,
              ]}
              onPress={() => {
                setSelectedConcentration(item.value);
                setTimeout(loadListings, 0);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedConcentration === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.value}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterDrawer
        visible={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          loadListings();
        }}
        onResetFilters={() => {
          setFilters({});
          loadListings();
        }}
      />
    </SafeAreaView>
  );
}
