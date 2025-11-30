/**
 * Smart Search Bar Component
 * Natural language search interface with AI-powered suggestions
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { smartSearch, SmartSearchRequest, SmartSearchResponse } from '../lib/searchAI';

interface SmartSearchBarProps {
  onSearchResults?: (results: SmartSearchResponse) => void;
  onSearchStart?: () => void;
  onSearchError?: (error: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: any;
  userEmail?: string;
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'suggestion' | 'autocomplete';
  icon?: string;
}

export default function SmartSearchBar({
  onSearchResults,
  onSearchStart,
  onSearchError,
  placeholder = "Search fragrances naturally... e.g. 'fresh citrus for summer under $150'",
  autoFocus = false,
  style,
  userEmail
}: SmartSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      // Debounced suggestion generation
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        generateSuggestions(query);
      }, 300);
    } else {
      setSuggestions(getDefaultSuggestions());
    }
  }, [query]);

  const loadSearchHistory = async () => {
    try {
      // Load from AsyncStorage or user preferences
      const history = [
        'fresh citrus summer',
        'woody masculine winter',
        'floral feminine date night',
        'niche under $200'
      ]; // Mock data for now
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const getDefaultSuggestions = (): SearchSuggestion[] => [
    { text: 'Fresh citrus for summer under $150', type: 'suggestion', icon: 'sunny-outline' },
    { text: 'Woody masculine fragrances for winter', type: 'suggestion', icon: 'leaf-outline' },
    { text: 'Floral feminine scents for date night', type: 'suggestion', icon: 'flower-outline' },
    { text: 'Long lasting office appropriate', type: 'suggestion', icon: 'briefcase-outline' },
    { text: 'Niche alternatives to designer fragrances', type: 'suggestion', icon: 'diamond-outline' },
    ...searchHistory.slice(0, 3).map(item => ({
      text: item,
      type: 'recent' as const,
      icon: 'time-outline'
    }))
  ];

  const generateSuggestions = async (searchQuery: string) => {
    try {
      const newSuggestions: SearchSuggestion[] = [];

      // Add autocomplete suggestions based on query
      if (searchQuery.toLowerCase().includes('fresh')) {
        newSuggestions.push(
          { text: 'fresh citrus summer fragrances', type: 'autocomplete', icon: 'water-outline' },
          { text: 'fresh aquatic clean scents', type: 'autocomplete', icon: 'water-outline' },
          { text: 'fresh green herbal fragrances', type: 'autocomplete', icon: 'leaf-outline' }
        );
      } else if (searchQuery.toLowerCase().includes('woody')) {
        newSuggestions.push(
          { text: 'woody sandalwood fragrances', type: 'autocomplete', icon: 'leaf-outline' },
          { text: 'woody cedar masculine scents', type: 'autocomplete', icon: 'leaf-outline' },
          { text: 'woody amber warm fragrances', type: 'autocomplete', icon: 'leaf-outline' }
        );
      } else if (searchQuery.toLowerCase().includes('floral')) {
        newSuggestions.push(
          { text: 'floral rose romantic fragrances', type: 'autocomplete', icon: 'flower-outline' },
          { text: 'floral jasmine white flowers', type: 'autocomplete', icon: 'flower-outline' },
          { text: 'floral spring feminine scents', type: 'autocomplete', icon: 'flower-outline' }
        );
      }

      // Add budget-based suggestions
      if (searchQuery.toLowerCase().includes('under')) {
        newSuggestions.push(
          { text: searchQuery + ' Australian retailers', type: 'suggestion', icon: 'storefront-outline' },
          { text: searchQuery + ' with good performance', type: 'suggestion', icon: 'star-outline' }
        );
      }

      // Add occasion-based suggestions
      if (searchQuery.toLowerCase().includes('work') || searchQuery.toLowerCase().includes('office')) {
        newSuggestions.push(
          { text: searchQuery + ' professional appropriate', type: 'suggestion', icon: 'briefcase-outline' },
          { text: searchQuery + ' not too strong', type: 'suggestion', icon: 'remove-circle-outline' }
        );
      }

      setSuggestions(newSuggestions.slice(0, 6));
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions(getDefaultSuggestions());
    }
  };

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query.trim();

    if (!finalQuery) {
      Alert.alert('Search Required', 'Please enter a search query.');
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);
    onSearchStart?.();

    try {
      // Save to search history
      const updatedHistory = [finalQuery, ...searchHistory.filter(h => h !== finalQuery)].slice(0, 10);
      setSearchHistory(updatedHistory);

      // Execute smart search
      const searchRequest: SmartSearchRequest = {
        query: finalQuery,
        userContext: {
          searchHistory: updatedHistory,
          location: 'Australia'
        },
        limit: 20
      };

      const results = await smartSearch.intelligentSearch(searchRequest);
      onSearchResults?.(results);

      // Clear the input if using a suggestion
      if (searchQuery) {
        setQuery('');
      }

    } catch (error) {
      console.error('Smart search error:', error);
      const errorMessage = error.message || 'Search failed. Please try again.';
      onSearchError?.(errorMessage);
      Alert.alert('Search Error', errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
    if (suggestions.length === 0) {
      setSuggestions(getDefaultSuggestions());
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
    setSuggestions(getDefaultSuggestions());
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        item.type === 'recent' && styles.recentSuggestion
      ]}
      onPress={() => handleSuggestionSelect(item)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.icon as any || 'search-outline'}
        size={18}
        color={item.type === 'recent' ? '#666' : '#b68a71'}
        style={styles.suggestionIcon}
      />
      <Text style={[
        styles.suggestionText,
        item.type === 'recent' && styles.recentText
      ]}>
        {item.text}
      </Text>
      {item.type === 'recent' && (
        <Text style={styles.recentLabel}>Recent</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchBarContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />

          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus={autoFocus}
            multiline={false}
            numberOfLines={1}
          />

          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}

          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#b68a71" />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleSearch()}
              style={styles.searchButton}
              disabled={!query.trim()}
            >
              <Ionicons
                name="arrow-forward"
                size={20}
                color={query.trim() ? "#b68a71" : "#ccc"}
              />
            </TouchableOpacity>
          )}
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item, index) => `${item.type}-${index}`}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionsList}
            />
          </View>
        )}
      </View>

      {/* Search Tips */}
      {!showSuggestions && query.length === 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Try searching naturally:</Text>
          <Text style={styles.tipText}>• "Fresh summer fragrances under $150"</Text>
          <Text style={styles.tipText}>• "Woody masculine scents for winter"</Text>
          <Text style={styles.tipText}>• "Long lasting office appropriate"</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  searchBarContainer: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#475569',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#64748b',
  },
  searchIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#f8fafc',
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  searchButton: {
    marginLeft: 8,
    padding: 4,
  },
  loadingContainer: {
    marginLeft: 8,
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#334155',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  recentSuggestion: {
    backgroundColor: '#3f4b5b',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  recentText: {
    color: '#cbd5e1',
  },
  recentLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Inter',
    fontStyle: 'italic',
  },
  tipsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  tipText: {
    fontSize: 13,
    color: '#d1d5db',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
});