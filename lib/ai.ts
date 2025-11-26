export type SearchFilters = {
  segment_type?: string;
  gender_marketing?: string;
  family?: string;
  accords?: string[];
  notes?: string[];
  performance_level?: string;
  season_tags?: string[];
  occasion_tags?: string[];
  min_value?: number;
  max_value?: number;
  state?: string;
};

/**
 * Mocks the AI parsing of a natural language query into structured filters.
 * In a real implementation, this would call an LLM endpoint.
 */
export async function parseSearchPreferences(query: string): Promise<SearchFilters> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const filters: SearchFilters = {};
  const lowerQuery = query.toLowerCase();

  // Mock parsing logic based on keywords
  if (lowerQuery.includes('men') || lowerQuery.includes('male') || lowerQuery.includes('masculine')) {
    filters.gender_marketing = 'mens';
  } else if (lowerQuery.includes('women') || lowerQuery.includes('female') || lowerQuery.includes('feminine')) {
    filters.gender_marketing = 'womens';
  } else if (lowerQuery.includes('unisex')) {
    filters.gender_marketing = 'unisex';
  }

  // Families
  const families = ['woody', 'floral', 'fresh', 'amber', 'fruity', 'gourmand', 'spicy', 'citrus', 'aquatic', 'green', 'oriental'];
  for (const family of families) {
    if (lowerQuery.includes(family)) {
      filters.family = family;
      break; // Assume one primary family for now
    }
  }

  // Performance
  if (lowerQuery.includes('loud') || lowerQuery.includes('beast') || lowerQuery.includes('strong')) {
    filters.performance_level = 'beast_mode';
  } else if (lowerQuery.includes('soft') || lowerQuery.includes('intimate')) {
    filters.performance_level = 'soft';
  }

  // Occasions
  const occasions = ['office', 'date', 'club', 'gym', 'casual'];
  const detectedOccasions = [];
  if (lowerQuery.includes('office') || lowerQuery.includes('work')) detectedOccasions.push('office');
  if (lowerQuery.includes('date') || lowerQuery.includes('romantic')) detectedOccasions.push('date_night');
  if (lowerQuery.includes('club') || lowerQuery.includes('party')) detectedOccasions.push('clubbing');
  if (lowerQuery.includes('gym') || lowerQuery.includes('sport')) detectedOccasions.push('gym');
  
  if (detectedOccasions.length > 0) {
    filters.occasion_tags = detectedOccasions;
  }

  return filters;
}
