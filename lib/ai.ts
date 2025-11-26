export type SearchFilters = {
  brand_name?: string[];
  segment_type?: string;
  gender_marketing?: string;
  family?: string;
  accords?: string[];
  notes?: string[];
  main_notes?: string[];
  performance_level?: string;
  season_tags?: string[];
  occasion_tags?: string[];
  min_value?: number;
  max_value?: number;
  state?: string;
  condition?: string[];
};

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export async function parseSearchPreferences(query: string): Promise<SearchFilters> {
  if (!query.trim()) return {};

  // If no API key is set, fallback to basic keyword search or mock behavior
  // But since user explicitly asked for OpenAI, we'll try to use it if available.
  // If not available, we might want to warn or just return basic text query.
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API Key not found. Falling back to simple text search.');
    return {};
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // or gpt-4 if preferred
        messages: [
          {
            role: 'system',
            content: `You are a fragrance expert assistant. Your goal is to parse natural language search queries into structured search filters for a fragrance marketplace.
            
            The available filters and their possible values are:
            - segment_type: 'designer', 'niche', 'indie', 'clone', 'oil', 'decant'
            - gender_marketing: 'mens', 'womens', 'unisex'
            - family: 'floral', 'oriental', 'woody', 'fresh', 'citrus', 'fruity', 'gourmand', 'leather', 'chypre', 'fougere'
            - performance_level: 'soft', 'moderate', 'loud', 'beast_mode'
            - accords: array of strings (e.g. ['rose', 'oud', 'vanilla'])
            - notes: array of strings (e.g. ['bergamot', 'patchouli'])
            - season_tags: array of ['spring', 'summer', 'fall', 'winter']
            - occasion_tags: array of ['daily', 'date', 'office', 'party', 'gym', 'formal']
            
            Return ONLY a JSON object matching this structure. Do not include markdown formatting or explanations.
            Example input: "loud woody cologne for clubbing"
            Example output: { "performance_level": "loud", "family": "woody", "occasion_tags": ["party"] }`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1, // Low temperature for consistent parsing
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error:', data);
      throw new Error(data.error?.message || 'Failed to parse query');
    }

    const content = data.choices[0].message.content;
    const parsedFilters = JSON.parse(content);

    return parsedFilters;

  } catch (error) {
    console.error('Error parsing search preferences:', error);
    // Fallback: return empty filters so at least the text query works in the main search flow
    return {};
  }
}
