import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, SafeAreaView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterDrawer } from '@/components/search/FilterDrawer';
import { SearchResults } from '@/components/search/SearchResults';
import { parseSearchPreferences, SearchFilters } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import { Listing } from '@/types';

export default function SearchScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const router = useRouter();

    const [query, setQuery] = useState('');
    const [isVibeMode, setIsVibeMode] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const activeFilterCount = Object.keys(filters).length;

    const fetchListings = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
        if (!supabase) {
            console.warn('Supabase not configured');
            return;
        }

        setLoading(true);
        try {
            const { data, error, count } = await supabase.rpc('search_listings', {
                query_text: searchQuery,
                filters: searchFilters,
                page_number: 1,
                page_size: 20
            });

            if (error) {
                console.error('Search error:', error);
                Alert.alert('Error', 'Failed to fetch search results');
            } else {
                setListings(data || []);
                // Note: count might be in the data if RPC returns it, or we need to adjust RPC to return count separately or as part of row
                // My RPC returns total_count in each row
                if (data && data.length > 0) {
                    setTotalCount(data[0].total_count);
                } else {
                    setTotalCount(0);
                }
            }
        } catch (e) {
            console.error('Search exception:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isVibeMode) {
                fetchListings(query, filters);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, filters, isVibeMode, fetchListings]);

    const handleVibeSubmit = async () => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const newFilters = await parseSearchPreferences(query);
            setFilters(newFilters);
            setIsVibeMode(false);
            setQuery(''); // Clear query as it's now converted to filters
            // fetchListings will be triggered by useEffect when filters change
        } catch (e) {
            Alert.alert('Error', 'Failed to parse vibe');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = () => {
        if (isVibeMode) {
            handleVibeSubmit();
        } else {
            fetchListings(query, filters);
        }
    };

    const handleListingPress = (listing: Listing) => {
        router.push(`/listing/${listing.id}`);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <StatusBar style="auto" />
            <Stack.Screen options={{ headerShown: false }} />

            <SearchBar
                value={query}
                onChangeText={setQuery}
                onSubmit={handleSearchSubmit}
                isVibeMode={isVibeMode}
                onVibeToggle={() => setIsVibeMode(!isVibeMode)}
                onFilterPress={() => setFilterDrawerVisible(true)}
                activeFilterCount={activeFilterCount}
            />

            <SearchResults
                listings={listings}
                loading={loading}
                onListingPress={handleListingPress}
            />

            <FilterDrawer
                visible={filterDrawerVisible}
                onClose={() => setFilterDrawerVisible(false)}
                filters={filters}
                onApplyFilters={(newFilters) => {
                    setFilters(newFilters);
                    // fetchListings triggered by useEffect
                }}
                onResetFilters={() => setFilters({})}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
