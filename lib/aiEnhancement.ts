// @ts-ignore
import OpenAI from 'openai/lite';

interface FragranceData {
  id: string;
  name: string;
  brand: string;
  concentration?: string;
  year_released?: number;
  data_quality_score: number;
  verified: boolean;
}

interface EnhancedFragranceData {
  name: string;
  brand: string;
  concentration?: string;
  year_released?: number;
  description?: string;
  notes?: {
    top?: string[];
    middle?: string[];
    base?: string[];
  };
  longevity?: string;
  sillage?: string;
  occasions?: string[];
  seasons?: string[];
  gender?: string;
  data_quality_score: number;
  verified: boolean;
}

class AIFragranceEnhancer {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment.');
    }

    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for React Native/Expo
    });
  }

  async enhanceFragrance(fragrance: FragranceData): Promise<EnhancedFragranceData> {
    try {
      const prompt = this.createEnhancementPrompt(fragrance);

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert fragrance analyst and perfumer with deep knowledge of the fragrance industry.
            Your task is to enhance fragrance data by researching and providing comprehensive information about perfumes.
            Always respond with valid JSON only, no additional text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const enhancedData = this.parseAIResponse(completion.choices[0]?.message?.content || '{}');
      return this.validateAndMergeData(fragrance, enhancedData);

    } catch (error) {
      console.error('AI Enhancement Error:', error);
      throw new Error('Failed to enhance fragrance data. Please try again.');
    }
  }

  private createEnhancementPrompt(fragrance: FragranceData): string {
    return `
Enhance the following fragrance data by researching and providing comprehensive information:

Current Data:
- Name: ${fragrance.name}
- Brand: ${fragrance.brand}
- Concentration: ${fragrance.concentration || 'Unknown'}
- Year Released: ${fragrance.year_released || 'Unknown'}

Please provide enhanced data in this exact JSON format:
{
  "name": "corrected or confirmed fragrance name",
  "brand": "corrected or confirmed brand name",
  "concentration": "EDP/EDT/Parfum/Cologne/etc",
  "year_released": year_as_number,
  "description": "detailed fragrance description (50-100 words)",
  "notes": {
    "top": ["note1", "note2", "note3"],
    "middle": ["note1", "note2", "note3"],
    "base": ["note1", "note2", "note3"]
  },
  "longevity": "Poor/Moderate/Good/Very Good/Excellent",
  "sillage": "Intimate/Moderate/Strong/Enormous",
  "occasions": ["casual", "formal", "date night", "office"],
  "seasons": ["spring", "summer", "autumn", "winter"],
  "gender": "masculine/feminine/unisex",
  "verified": true
}

Research this fragrance and provide accurate, comprehensive data. If you cannot find specific information, provide educated estimates based on similar fragrances from the brand/year.
`;
  }

  private parseAIResponse(response: string): Partial<EnhancedFragranceData> {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {};
    }
  }

  private validateAndMergeData(original: FragranceData, enhanced: Partial<EnhancedFragranceData>): EnhancedFragranceData {
    // Calculate new quality score based on available data
    const dataPoints = [
      enhanced.name,
      enhanced.brand,
      enhanced.concentration,
      enhanced.year_released,
      enhanced.description,
      enhanced.notes?.top?.length,
      enhanced.notes?.middle?.length,
      enhanced.notes?.base?.length,
      enhanced.longevity,
      enhanced.sillage,
      enhanced.occasions?.length,
      enhanced.seasons?.length,
      enhanced.gender
    ].filter(point => point !== undefined && point !== null && point !== '');

    const qualityScore = Math.min(95, Math.max(60, (dataPoints.length / 13) * 100));

    return {
      name: enhanced.name || original.name,
      brand: enhanced.brand || original.brand,
      concentration: enhanced.concentration || original.concentration,
      year_released: enhanced.year_released || original.year_released,
      description: enhanced.description,
      notes: enhanced.notes,
      longevity: enhanced.longevity,
      sillage: enhanced.sillage,
      occasions: enhanced.occasions,
      seasons: enhanced.seasons,
      gender: enhanced.gender,
      data_quality_score: Math.round(qualityScore),
      verified: enhanced.verified !== undefined ? enhanced.verified : true
    };
  }

  async batchEnhance(fragrances: FragranceData[]): Promise<EnhancedFragranceData[]> {
    const results: EnhancedFragranceData[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < fragrances.length; i += batchSize) {
      const batch = fragrances.slice(i, i + batchSize);
      const batchPromises = batch.map(fragrance => this.enhanceFragrance(fragrance));

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error('Batch enhancement failed:', result.reason);
          }
        });

        // Add delay between batches to respect rate limits
        if (i + batchSize < fragrances.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    }

    return results;
  }
}

export const aiFragranceEnhancer = new AIFragranceEnhancer();
export type { FragranceData, EnhancedFragranceData };