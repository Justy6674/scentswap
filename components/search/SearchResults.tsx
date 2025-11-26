import React from 'react';
import { FlatList, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ListingCard } from '@/components/ListingCard';
import { ThemedText } from '@/components/ThemedText';
import { Listing } from '@/types';

type SearchResultsProps = {
    listings: Listing[];
    loading: boolean;
    onListingPress: (listing: Listing) => void;
    ListHeaderComponent?: React.ReactElement;
};

export function SearchResults({ listings, loading, onListingPress, ListHeaderComponent }: SearchResultsProps) {
    if (loading && listings.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!loading && listings.length === 0) {
        return (
            <View style={styles.center}>
                {ListHeaderComponent}
                <View style={styles.emptyContainer}>
                    <ThemedText type="subtitle">No results found</ThemedText>
                    <ThemedText style={styles.emptyText}>Try adjusting your filters or search terms.</ThemedText>
                </View>
            </View>
        );
    }

    return (
        <FlatList
            data={listings}
            renderItem={({ item }) => (
                <View style={styles.itemContainer}>
                    <ListingCard listing={item} onPress={() => onListingPress(item)} />
                </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={ListHeaderComponent}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // Space for tab bar
    },
    itemContainer: {
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.6,
    },
});
