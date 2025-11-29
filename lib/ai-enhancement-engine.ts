import { enhancementService, CreateChangeInput } from './enhancement-service';

// =============================================================================
// API CONFIGURATION
// =============================================================================

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface FragranceData {
  id: string;
  name: string;
  brand: string;
  description?: string;
  concentration?: string;
  family?: string;
  gender?: string;
  year_released?: number;
  top_notes?: string[];
  middle_notes?: string[];
  base_notes?: string[];
  main_accords?: string[];
  perfumers?: string[];
  image_url?: string;
  fragrantica_url?: string;
  rating_value?: number;
  rating_count?: number;
  longevity_rating?: number;
  sillage_rating?: number;
  performance_level?: string;
  market_tier?: string;
  price_range?: string;
  tags?: string[];
}

export interface ScrapedData {
  notes?: {
    top?: string[];
    middle?: string[];
    base?: string[];
  };
  performance?: {
    longevity?: number;
    sillage?: number;
    projection?: number;
  };
  ratings?: {
    overall?: number;
    count?: number;
  };
  images?: string[];
  description?: string;
  perfumers?: string[];
  year?: number;
  accords?: string[];
  reviews?: {
    text: string;
    rating: number;
    author?: string;
  }[];
  metadata?: {
    price_range?: string;
    availability?: string;
    season?: string[];
    occasion?: string[];
  };
}

export interface AIAnalysisResult {
  enhanced_data: Partial<FragranceData>;
  confidence_scores: { [field: string]: number };
  reasoning: { [field: string]: string };
  sources: { [field: string]: string };
  quality_score: number;
  recommendations: string[];
}

export interface EnhancementResult {
  success: boolean;
  changes: CreateChangeInput[];
  errors: string[];
  processing_time_ms: number;
  source: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function cleanAndValidateText(text: string | null | undefined): string | null {
  if (!text) return null;
  const cleaned = text.trim().replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned : null;
}

function validateImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol.startsWith('http') ? url : null;
  } catch {
    return null;
  }
}

function normalizeNotes(notes: any): string[] {
  if (!notes) return [];
  if (typeof notes === 'string') {
    return notes.split(/[,;]/).map(n => n.trim()).filter(n => n.length > 0);
  }
  if (Array.isArray(notes)) {
    return notes.map(n => String(n).trim()).filter(n => n.length > 0);
  }
  return [];
}

function calculateConfidence(
  oldValue: any,
  newValue: any,
  source: string,
  validationChecks: boolean[]
): number {
  // Base confidence by source
  const sourceConfidence = {
    'fragrantica_scrape': 0.9,
    'brand_website': 0.95,
    'ai_gemini': 0.8,
    'ai_openai': 0.8,
    'ai_hybrid': 0.85,
    'manual_entry': 1.0
  };

  let confidence = sourceConfidence[source as keyof typeof sourceConfidence] || 0.7;

  // Reduce confidence for major changes
  if (oldValue && newValue && oldValue !== newValue) {
    confidence *= 0.9; // Slight reduction for modifications
  }

  // Increase confidence for additions (filling empty fields)
  if (!oldValue && newValue) {
    confidence *= 1.1;
  }

  // Apply validation checks
  const passedChecks = validationChecks.filter(Boolean).length;
  const totalChecks = validationChecks.length;
  if (totalChecks > 0) {
    const validationScore = passedChecks / totalChecks;
    confidence *= (0.5 + 0.5 * validationScore); // Scale between 50% and 100%
  }

  return Math.min(Math.max(confidence, 0.1), 1.0); // Clamp between 0.1 and 1.0
}

// =============================================================================
// WEB SCRAPING ENGINE
// =============================================================================

class FragranceWebScraper {

  async scrapeFragrantica(fragranticaUrl: string): Promise<ScrapedData> {
    const startTime = Date.now();
    const scrapedData: ScrapedData = {};

    try {
      // Use browser_eval MCP tool for web scraping
      const scrapeResult = await this.callBrowserAutomation('scrapeFragrantica', {
        url: fragranticaUrl,
        extractors: [
          'notes_pyramid',
          'performance_ratings',
          'overall_rating',
          'perfumer_info',
          'images',
          'description',
          'accords',
          'metadata'
        ]
      });

      if (!scrapeResult.success) {
        throw new Error(`Scraping failed: ${scrapeResult.error}`);
      }

      const extracted = scrapeResult.data;

      // Process notes pyramid
      if (extracted.notes) {
        scrapedData.notes = {
          top: normalizeNotes(extracted.notes.top),
          middle: normalizeNotes(extracted.notes.middle),
          base: normalizeNotes(extracted.notes.base)
        };
      }

      // Process performance ratings
      if (extracted.performance) {
        scrapedData.performance = {
          longevity: this.parseRating(extracted.performance.longevity),
          sillage: this.parseRating(extracted.performance.sillage),
          projection: this.parseRating(extracted.performance.projection)
        };
      }

      // Process overall rating
      if (extracted.rating) {
        scrapedData.ratings = {
          overall: this.parseRating(extracted.rating.overall),
          count: parseInt(extracted.rating.count) || 0
        };
      }

      // Process perfumers
      if (extracted.perfumers) {
        scrapedData.perfumers = normalizeNotes(extracted.perfumers);
      }

      // Process images
      if (extracted.images && Array.isArray(extracted.images)) {
        scrapedData.images = extracted.images
          .map(validateImageUrl)
          .filter((url): url is string => url !== null);
      }

      // Process description
      if (extracted.description) {
        scrapedData.description = cleanAndValidateText(extracted.description);
      }

      // Process accords
      if (extracted.accords) {
        scrapedData.accords = normalizeNotes(extracted.accords);
      }

      // Process year
      if (extracted.year) {
        const year = parseInt(extracted.year);
        if (year > 1800 && year <= new Date().getFullYear()) {
          scrapedData.year = year;
        }
      }

      console.log(`Fragrantica scraping completed in ${Date.now() - startTime}ms`);
      return scrapedData;

    } catch (error) {
      console.error('Error scraping Fragrantica:', error);
      throw error;
    }
  }

  private async callBrowserAutomation(action: string, params: any): Promise<any> {
    // Fetch-based scraping for Fragrantica pages
    // Uses regex parsing since we can't execute JS in a fetch context

    try {
      const url = params.url;
      if (!url || !url.includes('fragrantica.com')) {
        return { success: false, error: 'Invalid Fragrantica URL' };
      }

      // Rate limiting - wait 2 seconds before scraping
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const html = await response.text();
      
      // Parse HTML using regex patterns (Fragrantica-specific selectors)
      const extractedData = this.parseFragranticaHTML(html);

      return {
        success: true,
        data: extractedData
      };

    } catch (error) {
      console.error('Scraping error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseFragranticaHTML(html: string): any {
    const data: any = {
      notes: { top: [], middle: [], base: [] },
      performance: {},
      rating: {},
      perfumers: [],
      images: [],
      description: null,
      accords: [],
      year: null
    };

    try {
      // Extract notes pyramid - Fragrantica uses specific class patterns
      // Top notes
      const topNotesMatch = html.match(/pyramid-level.*?top.*?<div[^>]*>(.*?)<\/div>/is);
      if (topNotesMatch) {
        const noteLinks = topNotesMatch[1].match(/<a[^>]*>([^<]+)<\/a>/gi) || [];
        data.notes.top = noteLinks.map(link => {
          const match = link.match(/>([^<]+)</);
          return match ? match[1].trim() : '';
        }).filter(n => n);
      }

      // Middle notes
      const middleNotesMatch = html.match(/pyramid-level.*?middle.*?<div[^>]*>(.*?)<\/div>/is);
      if (middleNotesMatch) {
        const noteLinks = middleNotesMatch[1].match(/<a[^>]*>([^<]+)<\/a>/gi) || [];
        data.notes.middle = noteLinks.map(link => {
          const match = link.match(/>([^<]+)</);
          return match ? match[1].trim() : '';
        }).filter(n => n);
      }

      // Base notes
      const baseNotesMatch = html.match(/pyramid-level.*?base.*?<div[^>]*>(.*?)<\/div>/is);
      if (baseNotesMatch) {
        const noteLinks = baseNotesMatch[1].match(/<a[^>]*>([^<]+)<\/a>/gi) || [];
        data.notes.base = noteLinks.map(link => {
          const match = link.match(/>([^<]+)</);
          return match ? match[1].trim() : '';
        }).filter(n => n);
      }

      // Extract rating
      const ratingMatch = html.match(/itemprop="ratingValue"[^>]*content="([^"]+)"/i);
      if (ratingMatch) {
        data.rating.overall = parseFloat(ratingMatch[1]);
      }

      const ratingCountMatch = html.match(/itemprop="ratingCount"[^>]*content="([^"]+)"/i);
      if (ratingCountMatch) {
        data.rating.count = parseInt(ratingCountMatch[1]);
      }

      // Extract perfumers
      const perfumerMatches = html.match(/perfumer[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/gi) || [];
      data.perfumers = perfumerMatches.map(match => {
        const nameMatch = match.match(/>([^<]+)</);
        return nameMatch ? nameMatch[1].trim() : '';
      }).filter(n => n && n.toLowerCase() !== 'unknown');

      // Extract main accords
      const accordMatches = html.match(/accord-bar[^>]*style="[^"]*width:\s*(\d+)[^"]*"[^>]*>([^<]+)</gi) || [];
      data.accords = accordMatches.map(match => {
        const nameMatch = match.match(/>([^<]+)</);
        return nameMatch ? nameMatch[1].trim() : '';
      }).filter(n => n).slice(0, 5); // Top 5 accords

      // Extract year
      const yearMatch = html.match(/launched in (\d{4})/i) || html.match(/<span[^>]*>(\d{4})<\/span>/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        if (year > 1800 && year <= new Date().getFullYear()) {
          data.year = year;
        }
      }

      // Extract description
      const descMatch = html.match(/itemprop="description"[^>]*>([^<]+)</i);
      if (descMatch) {
        data.description = descMatch[1].trim();
      }

      // Extract main image
      const imageMatch = html.match(/itemprop="image"[^>]*content="([^"]+)"/i);
      if (imageMatch) {
        data.images = [imageMatch[1]];
      }

      // Extract longevity/sillage from voting bars if available
      const longevityMatch = html.match(/longevity[^>]*style="[^"]*width:\s*(\d+)/i);
      if (longevityMatch) {
        data.performance.longevity = Math.round(parseFloat(longevityMatch[1]) / 20 * 10) / 10; // Convert percentage to 0-5
      }

      const sillageMatch = html.match(/sillage[^>]*style="[^"]*width:\s*(\d+)/i);
      if (sillageMatch) {
        data.performance.sillage = Math.round(parseFloat(sillageMatch[1]) / 20 * 10) / 10;
      }

    } catch (parseError) {
      console.error('HTML parsing error:', parseError);
    }

    return data;
  }

  private parseRating(ratingString: any): number | undefined {
    if (!ratingString) return undefined;

    const parsed = parseFloat(String(ratingString));
    if (isNaN(parsed) || parsed < 0 || parsed > 5) return undefined;

    return Math.round(parsed * 10) / 10; // Round to 1 decimal place
  }
}

// =============================================================================
// AI ANALYSIS ENGINE
// =============================================================================

class FragranceAIAnalyzer {

  async analyzeWithGemini(fragranceData: FragranceData): Promise<AIAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(fragranceData);

    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not configured, returning empty result');
      return this.getEmptyResult('ai_gemini');
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textContent) {
        throw new Error('No content in Gemini response');
      }

      // Parse JSON response (remove markdown code blocks if present)
      const cleanedContent = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedResponse = JSON.parse(cleanedContent);

      return this.parseAIResponse(parsedResponse, 'ai_gemini');

    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      throw error;
    }
  }

  async analyzeWithOpenAI(fragranceData: FragranceData): Promise<AIAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(fragranceData);

    if (!OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, returning empty result');
      return this.getEmptyResult('ai_openai');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a fragrance data expert. Respond only with valid JSON matching the requested schema. Use Australian English spelling.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const textContent = data.choices?.[0]?.message?.content;
      
      if (!textContent) {
        throw new Error('No content in OpenAI response');
      }

      const parsedResponse = JSON.parse(textContent);
      return this.parseAIResponse(parsedResponse, 'ai_openai');

    } catch (error) {
      console.error('Error analyzing with OpenAI:', error);
      throw error;
    }
  }

  private getEmptyResult(source: string): AIAnalysisResult {
    return {
      enhanced_data: {},
      confidence_scores: {},
      reasoning: {},
      sources: {},
      quality_score: 0,
      recommendations: [`${source} API key not configured`]
    };
  }

  async hybridAnalysis(fragranceData: FragranceData): Promise<AIAnalysisResult> {
    try {
      const [geminiResult, openaiResult] = await Promise.all([
        this.analyzeWithGemini(fragranceData).catch(e => null),
        this.analyzeWithOpenAI(fragranceData).catch(e => null)
      ]);

      return this.mergeAIResults(geminiResult, openaiResult, fragranceData);
    } catch (error) {
      console.error('Error in hybrid analysis:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(fragranceData: FragranceData): string {
    return `
    Analyze this fragrance data and provide enhancements for missing or incomplete fields:

    Current Fragrance Data:
    ${JSON.stringify(fragranceData, null, 2)}

    Please provide structured JSON response with:
    1. enhanced_data: Object with improved/corrected field values
    2. confidence_scores: Object with 0-1 scores for each enhanced field
    3. reasoning: Object explaining each enhancement
    4. quality_score: Overall data quality assessment (0-1)
    5. recommendations: Array of improvement suggestions

    Focus on:
    - Completing missing notes pyramid (top/middle/base notes)
    - Inferring performance levels from available data
    - Correcting market tier classification
    - Enhancing descriptions with proper fragrance terminology
    - Suggesting main accords based on notes
    - Validating and improving existing data quality

    Return only valid JSON with Australian English spelling.
    `;
  }

  private parseAIResponse(response: any, source: string): AIAnalysisResult {
    // Parse and validate the AI response
    const defaultResult: AIAnalysisResult = {
      enhanced_data: {},
      confidence_scores: {},
      reasoning: {},
      sources: {},
      quality_score: 0.5,
      recommendations: []
    };

    try {
      // If response is a string, try to parse as JSON
      let parsed = typeof response === 'string' ? JSON.parse(response) : response;

      return {
        enhanced_data: parsed.enhanced_data || {},
        confidence_scores: parsed.confidence_scores || {},
        reasoning: parsed.reasoning || {},
        sources: Object.keys(parsed.enhanced_data || {}).reduce((acc, key) => {
          acc[key] = source;
          return acc;
        }, {} as { [key: string]: string }),
        quality_score: parsed.quality_score || 0.5,
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return defaultResult;
    }
  }

  private mergeAIResults(
    geminiResult: AIAnalysisResult | null,
    openaiResult: AIAnalysisResult | null,
    originalData: FragranceData
  ): AIAnalysisResult {
    const merged: AIAnalysisResult = {
      enhanced_data: {},
      confidence_scores: {},
      reasoning: {},
      sources: {},
      quality_score: 0,
      recommendations: []
    };

    const results = [geminiResult, openaiResult].filter(r => r !== null);
    if (results.length === 0) {
      return merged;
    }

    // Merge enhanced data, preferring higher confidence scores
    const allFields = new Set<string>();
    results.forEach(result => {
      Object.keys(result!.enhanced_data).forEach(field => allFields.add(field));
    });

    allFields.forEach(field => {
      const candidates = results
        .map(result => ({
          value: result!.enhanced_data[field],
          confidence: result!.confidence_scores[field] || 0,
          source: result === geminiResult ? 'ai_gemini' : 'ai_openai',
          reasoning: result!.reasoning[field]
        }))
        .filter(c => c.value !== undefined)
        .sort((a, b) => b.confidence - a.confidence);

      if (candidates.length > 0) {
        const best = candidates[0];
        merged.enhanced_data[field] = best.value;
        merged.confidence_scores[field] = best.confidence;
        merged.sources[field] = 'ai_hybrid';
        merged.reasoning[field] = best.reasoning;
      }
    });

    // Average quality scores
    merged.quality_score = results.reduce((sum, result) => sum + result!.quality_score, 0) / results.length;

    // Combine recommendations
    const allRecommendations = results.flatMap(result => result!.recommendations);
    merged.recommendations = [...new Set(allRecommendations)];

    return merged;
  }
}

// =============================================================================
// CHANGE DETECTION ENGINE
// =============================================================================

class EnhancementChangeDetector {

  generateChanges(
    currentData: FragranceData,
    enhancedData: Partial<FragranceData>,
    confidenceScores: { [field: string]: number },
    sources: { [field: string]: string },
    reasoning?: { [field: string]: string }
  ): CreateChangeInput[] {
    const changes: CreateChangeInput[] = [];

    const fieldsToCheck = [
      'name', 'description', 'concentration', 'family', 'gender',
      'year_released', 'top_notes', 'middle_notes', 'base_notes',
      'main_accords', 'perfumers', 'image_url', 'longevity_rating',
      'sillage_rating', 'performance_level', 'market_tier', 'price_range'
    ];

    fieldsToCheck.forEach(field => {
      const oldValue = (currentData as any)[field];
      const newValue = (enhancedData as any)[field];

      if (this.hasSignificantChange(oldValue, newValue)) {
        const confidence = this.calculateFieldConfidence(
          field,
          oldValue,
          newValue,
          confidenceScores[field] || 0.7,
          sources[field] || 'ai_analysis'
        );

        changes.push({
          field_name: field,
          old_value: oldValue,
          new_value: newValue,
          change_type: this.detectChangeType(oldValue, newValue),
          confidence_score: confidence,
          source: sources[field] || 'ai_analysis',
          notes: reasoning?.[field] || `Enhanced ${field} via AI analysis`
        });
      }
    });

    return changes;
  }

  private hasSignificantChange(oldValue: any, newValue: any): boolean {
    // Handle null/undefined cases
    if (!oldValue && !newValue) return false;
    if (!oldValue && newValue) return true;
    if (oldValue && !newValue) return false; // Don't allow deletions without manual review

    // Array comparison (notes, accords, perfumers)
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (oldValue.length === 0 && newValue.length > 0) return true;

      const oldSorted = [...oldValue].sort();
      const newSorted = [...newValue].sort();
      return JSON.stringify(oldSorted) !== JSON.stringify(newSorted);
    }

    // String comparison with quality improvements
    if (typeof oldValue === 'string' && typeof newValue === 'string') {
      const oldNormalized = oldValue.trim().toLowerCase();
      const newNormalized = newValue.trim().toLowerCase();

      // Consider it significant if new value is substantially different or longer
      if (oldNormalized !== newNormalized) {
        if (newValue.length > oldValue.length * 1.2 ||
            newValue.length < oldValue.length * 0.8) {
          return true;
        }

        // Check for substantial content changes
        const similarity = this.calculateStringSimilarity(oldNormalized, newNormalized);
        return similarity < 0.8; // Less than 80% similar
      }

      return false;
    }

    // Numeric comparison
    if (typeof oldValue === 'number' && typeof newValue === 'number') {
      return Math.abs(oldValue - newValue) > 0.1; // Significant numeric change
    }

    return oldValue !== newValue;
  }

  private detectChangeType(oldValue: any, newValue: any): 'addition' | 'update' | 'correction' | 'enhancement' {
    if (!oldValue && newValue) return 'addition';

    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (newValue.length > oldValue.length) return 'enhancement';
      return 'correction';
    }

    if (typeof oldValue === 'string' && typeof newValue === 'string') {
      if (newValue.length > oldValue.length * 1.5) return 'enhancement';
      return 'correction';
    }

    return 'update';
  }

  private calculateFieldConfidence(
    field: string,
    oldValue: any,
    newValue: any,
    baseConfidence: number,
    source: string
  ): number {
    const validationChecks: boolean[] = [];

    // Field-specific validation
    switch (field) {
      case 'year_released':
        validationChecks.push(
          typeof newValue === 'number',
          newValue > 1800,
          newValue <= new Date().getFullYear()
        );
        break;

      case 'image_url':
        validationChecks.push(
          typeof newValue === 'string',
          newValue.startsWith('http'),
          newValue.includes('.jpg') || newValue.includes('.png') || newValue.includes('.jpeg')
        );
        break;

      case 'concentration':
        const validConcentrations = ['eau de parfum', 'eau de toilette', 'parfum', 'extrait de parfum', 'eau de cologne'];
        validationChecks.push(
          typeof newValue === 'string',
          validConcentrations.includes(newValue.toLowerCase())
        );
        break;

      case 'top_notes':
      case 'middle_notes':
      case 'base_notes':
      case 'main_accords':
      case 'perfumers':
        validationChecks.push(
          Array.isArray(newValue),
          newValue.length > 0,
          newValue.every((item: any) => typeof item === 'string' && item.trim().length > 0)
        );
        break;

      case 'rating_value':
      case 'longevity_rating':
      case 'sillage_rating':
        validationChecks.push(
          typeof newValue === 'number',
          newValue >= 0,
          newValue <= 5
        );
        break;

      default:
        validationChecks.push(newValue !== null && newValue !== undefined);
    }

    return calculateConfidence(oldValue, newValue, source, validationChecks);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity for strings
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }
}

// =============================================================================
// MAIN ENHANCEMENT ENGINE
// =============================================================================

export class AIEnhancementEngine {
  private scraper = new FragranceWebScraper();
  private analyzer = new FragranceAIAnalyzer();
  private changeDetector = new EnhancementChangeDetector();

  async enhanceFragrance(
    fragranceData: FragranceData,
    enhancementType: 'ai_analysis' | 'web_scrape' | 'hybrid'
  ): Promise<EnhancementResult> {
    const startTime = Date.now();
    let allChanges: CreateChangeInput[] = [];
    const errors: string[] = [];

    try {
      switch (enhancementType) {
        case 'web_scrape':
          const result = await this.enhanceWithScraping(fragranceData);
          allChanges.push(...result.changes);
          errors.push(...result.errors);
          break;

        case 'ai_analysis':
          const aiResult = await this.enhanceWithAI(fragranceData);
          allChanges.push(...aiResult.changes);
          errors.push(...aiResult.errors);
          break;

        case 'hybrid':
          const [scrapingResult, aiEnhancement] = await Promise.allSettled([
            this.enhanceWithScraping(fragranceData),
            this.enhanceWithAI(fragranceData)
          ]);

          if (scrapingResult.status === 'fulfilled') {
            allChanges.push(...scrapingResult.value.changes);
            errors.push(...scrapingResult.value.errors);
          } else {
            errors.push(`Scraping failed: ${scrapingResult.reason}`);
          }

          if (aiEnhancement.status === 'fulfilled') {
            allChanges.push(...aiEnhancement.value.changes);
            errors.push(...aiEnhancement.value.errors);
          } else {
            errors.push(`AI analysis failed: ${aiEnhancement.reason}`);
          }
          break;

        default:
          throw new Error(`Unknown enhancement type: ${enhancementType}`);
      }

      // Deduplicate changes by field name, keeping highest confidence
      const changesByField = new Map<string, CreateChangeInput>();
      allChanges.forEach(change => {
        const existing = changesByField.get(change.field_name);
        if (!existing || (change.confidence_score || 0) > (existing.confidence_score || 0)) {
          changesByField.set(change.field_name, change);
        }
      });

      const finalChanges = Array.from(changesByField.values());

      return {
        success: errors.length === 0 || finalChanges.length > 0,
        changes: finalChanges,
        errors,
        processing_time_ms: Date.now() - startTime,
        source: enhancementType
      };

    } catch (error) {
      return {
        success: false,
        changes: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processing_time_ms: Date.now() - startTime,
        source: enhancementType
      };
    }
  }

  private async enhanceWithScraping(fragranceData: FragranceData): Promise<{
    changes: CreateChangeInput[];
    errors: string[];
  }> {
    const changes: CreateChangeInput[] = [];
    const errors: string[] = [];

    try {
      if (!fragranceData.fragrantica_url) {
        errors.push('No Fragrantica URL available for scraping');
        return { changes, errors };
      }

      const scrapedData = await this.scraper.scrapeFragrantica(fragranceData.fragrantica_url);

      // Convert scraped data to fragrance data format
      const enhancedData: Partial<FragranceData> = {};
      const confidenceScores: { [field: string]: number } = {};
      const sources: { [field: string]: string } = {};

      if (scrapedData.notes?.top && scrapedData.notes.top.length > 0) {
        enhancedData.top_notes = scrapedData.notes.top;
        confidenceScores.top_notes = 0.9;
        sources.top_notes = 'fragrantica_scrape';
      }

      if (scrapedData.notes?.middle && scrapedData.notes.middle.length > 0) {
        enhancedData.middle_notes = scrapedData.notes.middle;
        confidenceScores.middle_notes = 0.9;
        sources.middle_notes = 'fragrantica_scrape';
      }

      if (scrapedData.notes?.base && scrapedData.notes.base.length > 0) {
        enhancedData.base_notes = scrapedData.notes.base;
        confidenceScores.base_notes = 0.9;
        sources.base_notes = 'fragrantica_scrape';
      }

      if (scrapedData.accords && scrapedData.accords.length > 0) {
        enhancedData.main_accords = scrapedData.accords;
        confidenceScores.main_accords = 0.85;
        sources.main_accords = 'fragrantica_scrape';
      }

      if (scrapedData.perfumers && scrapedData.perfumers.length > 0) {
        enhancedData.perfumers = scrapedData.perfumers;
        confidenceScores.perfumers = 0.95;
        sources.perfumers = 'fragrantica_scrape';
      }

      if (scrapedData.description) {
        enhancedData.description = scrapedData.description;
        confidenceScores.description = 0.8;
        sources.description = 'fragrantica_scrape';
      }

      if (scrapedData.images && scrapedData.images.length > 0) {
        enhancedData.image_url = scrapedData.images[0];
        confidenceScores.image_url = 0.85;
        sources.image_url = 'fragrantica_scrape';
      }

      if (scrapedData.year) {
        enhancedData.year_released = scrapedData.year;
        confidenceScores.year_released = 0.9;
        sources.year_released = 'fragrantica_scrape';
      }

      if (scrapedData.performance?.longevity) {
        enhancedData.longevity_rating = scrapedData.performance.longevity;
        confidenceScores.longevity_rating = 0.8;
        sources.longevity_rating = 'fragrantica_scrape';
      }

      if (scrapedData.performance?.sillage) {
        enhancedData.sillage_rating = scrapedData.performance.sillage;
        confidenceScores.sillage_rating = 0.8;
        sources.sillage_rating = 'fragrantica_scrape';
      }

      if (scrapedData.ratings?.overall) {
        enhancedData.rating_value = scrapedData.ratings.overall;
        confidenceScores.rating_value = 0.9;
        sources.rating_value = 'fragrantica_scrape';
      }

      // Generate changes
      const detectedChanges = this.changeDetector.generateChanges(
        fragranceData,
        enhancedData,
        confidenceScores,
        sources
      );

      changes.push(...detectedChanges);

    } catch (error) {
      errors.push(`Scraping error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { changes, errors };
  }

  private async enhanceWithAI(fragranceData: FragranceData): Promise<{
    changes: CreateChangeInput[];
    errors: string[];
  }> {
    const changes: CreateChangeInput[] = [];
    const errors: string[] = [];

    try {
      const aiResult = await this.analyzer.hybridAnalysis(fragranceData);

      const detectedChanges = this.changeDetector.generateChanges(
        fragranceData,
        aiResult.enhanced_data,
        aiResult.confidence_scores,
        aiResult.sources,
        aiResult.reasoning
      );

      changes.push(...detectedChanges);

    } catch (error) {
      errors.push(`AI analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { changes, errors };
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

export const aiEnhancementEngine = new AIEnhancementEngine();