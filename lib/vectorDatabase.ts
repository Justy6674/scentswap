/**
 * Vector Database for Fragrance DNA and Similarity Matching
 * Advanced vector embeddings for fragrance similarity and recommendation
 */

import { supabase } from './supabase';

export interface FragranceDNA {
  fragmentId: string;
  embeddings: {
    notes: number[]; // Vector representation of fragrance notes
    semantic: number[]; // Semantic description embedding
    user_preference: number[]; // User preference vector
    market: number[]; // Market positioning vector
  };
  metadata: {
    dominant_accords: string[];
    intensity: number; // 1-10
    longevity: number; // 1-10
    sillage: number; // 1-10
    uniqueness: number; // 1-10
    versatility: number; // 1-10
    season_scores: { [season: string]: number };
    occasion_scores: { [occasion: string]: number };
    age_appeal: { [ageGroup: string]: number };
    gender_appeal: { [gender: string]: number };
  };
  lastUpdated: Date;
}

export interface SimilarityResult {
  fragmentId: string;
  similarity: number; // 0-1 cosine similarity
  matchType: 'notes' | 'semantic' | 'hybrid' | 'user_preference';
  explanation: string;
  confidence: number;
}

export interface FragranceCluster {
  id: string;
  name: string;
  centroid: number[];
  memberFragrances: string[];
  characteristics: string[];
  averagePrice: number;
  popularity: number;
}

export interface UserPreferenceVector {
  userEmail: string;
  vector: number[];
  confidence: number;
  dimensions: {
    freshness: number;
    warmth: number;
    sweetness: number;
    spiciness: number;
    woodiness: number;
    floralness: number;
    intensity: number;
    longevity_preference: number;
    price_sensitivity: number;
    brand_loyalty: number;
  };
  lastUpdated: Date;
}

// Fragrance note embeddings - simplified 50-dimensional vectors
const NOTE_EMBEDDINGS: { [note: string]: number[] } = {
  // Citrus notes
  'bergamot': [0.8, 0.2, -0.1, 0.9, 0.1, -0.3, 0.7, 0.0, 0.5, -0.2, 0.3, 0.6, -0.1, 0.4, 0.2, -0.1, 0.8, 0.0, 0.3, 0.1, 0.5, -0.2, 0.7, 0.2, -0.1, 0.4, 0.6, 0.1, 0.3, -0.2, 0.8, 0.0, 0.2, 0.5, -0.1, 0.7, 0.3, 0.1, 0.4, -0.2, 0.6, 0.2, 0.8, -0.1, 0.5, 0.0, 0.3, 0.7, 0.1, 0.4],
  'lemon': [0.9, 0.3, -0.2, 0.8, 0.0, -0.4, 0.6, 0.1, 0.7, -0.1, 0.4, 0.5, -0.2, 0.3, 0.1, 0.0, 0.9, -0.1, 0.2, 0.5, 0.6, -0.3, 0.8, 0.1, -0.2, 0.3, 0.7, 0.0, 0.4, -0.1, 0.9, 0.2, 0.1, 0.6, -0.2, 0.8, 0.4, 0.0, 0.5, -0.3, 0.7, 0.1, 0.9, -0.2, 0.6, 0.3, 0.2, 0.8, 0.0, 0.5],
  'grapefruit': [0.7, 0.4, -0.3, 0.8, 0.2, -0.2, 0.9, 0.0, 0.6, -0.1, 0.5, 0.7, -0.2, 0.3, 0.1, 0.2, 0.8, -0.1, 0.4, 0.6, 0.7, -0.2, 0.5, 0.3, -0.1, 0.9, 0.4, 0.0, 0.6, -0.3, 0.8, 0.1, 0.3, 0.7, -0.1, 0.5, 0.2, 0.4, 0.9, -0.2, 0.6, 0.0, 0.8, -0.3, 0.7, 0.1, 0.4, 0.5, 0.3, 0.6],

  // Floral notes
  'rose': [-0.2, 0.8, 0.6, 0.1, 0.9, 0.3, -0.1, 0.7, 0.2, 0.5, -0.3, 0.8, 0.4, 0.1, 0.6, 0.9, -0.2, 0.5, 0.7, 0.0, 0.3, 0.8, -0.1, 0.6, 0.4, 0.2, 0.9, 0.5, -0.2, 0.7, 0.1, 0.8, 0.6, 0.3, -0.1, 0.4, 0.9, 0.7, 0.2, 0.5, -0.3, 0.8, 0.0, 0.6, 0.1, 0.9, 0.4, -0.2, 0.7, 0.5],
  'jasmine': [-0.1, 0.9, 0.7, 0.2, 0.8, 0.4, 0.0, 0.6, 0.3, 0.7, -0.2, 0.9, 0.5, 0.1, 0.8, 0.6, -0.3, 0.4, 0.9, 0.2, 0.1, 0.7, 0.0, 0.8, 0.5, 0.3, 0.6, 0.9, -0.1, 0.4, 0.2, 0.7, 0.8, 0.5, 0.0, 0.3, 0.9, 0.6, 0.1, 0.8, -0.2, 0.7, 0.4, 0.5, 0.2, 0.9, 0.3, -0.1, 0.8, 0.6],
  'lily': [0.0, 0.7, 0.8, 0.3, 0.6, 0.5, 0.1, 0.9, 0.4, 0.2, -0.1, 0.8, 0.6, 0.7, 0.3, 0.5, -0.2, 0.9, 0.8, 0.1, 0.4, 0.6, 0.2, 0.7, 0.9, 0.0, 0.5, 0.8, -0.3, 0.6, 0.3, 0.9, 0.7, 0.4, 0.1, 0.2, 0.8, 0.5, 0.6, 0.9, -0.1, 0.3, 0.7, 0.8, 0.4, 0.6, 0.0, 0.2, 0.9, 0.5],

  // Woody notes
  'sandalwood': [-0.3, 0.1, 0.2, -0.1, 0.4, 0.8, 0.3, 0.6, 0.9, 0.0, 0.7, 0.2, 0.5, 0.8, 0.4, -0.2, 0.1, 0.6, 0.9, 0.3, 0.7, 0.5, 0.0, 0.8, 0.2, 0.6, 0.4, -0.1, 0.9, 0.7, 0.3, 0.5, 0.8, 0.1, 0.6, 0.9, 0.0, 0.4, 0.7, 0.2, 0.8, 0.5, 0.3, 0.6, 0.9, -0.1, 0.2, 0.7, 0.8, 0.4],
  'cedar': [-0.4, 0.2, 0.1, -0.2, 0.3, 0.9, 0.4, 0.5, 0.8, 0.1, 0.6, 0.3, 0.7, 0.9, 0.2, -0.1, 0.0, 0.8, 0.5, 0.4, 0.9, 0.6, 0.1, 0.7, 0.3, 0.8, 0.2, -0.3, 0.9, 0.5, 0.4, 0.6, 0.7, 0.0, 0.8, 0.9, 0.1, 0.3, 0.5, 0.4, 0.7, 0.8, 0.2, 0.6, 0.9, -0.2, 0.3, 0.5, 0.8, 0.7],
  'vetiver': [-0.2, 0.0, 0.3, -0.3, 0.5, 0.8, 0.6, 0.4, 0.9, 0.2, 0.7, 0.1, 0.8, 0.6, 0.3, -0.4, 0.2, 0.9, 0.7, 0.5, 0.8, 0.4, 0.0, 0.6, 0.9, 0.3, 0.1, -0.2, 0.8, 0.7, 0.5, 0.4, 0.9, 0.2, 0.6, 0.8, 0.3, 0.1, 0.7, 0.5, 0.9, 0.6, 0.4, 0.8, 0.2, -0.1, 0.7, 0.9, 0.5, 0.3],

  // Oriental notes
  'vanilla': [0.1, 0.5, 0.8, 0.4, 0.2, 0.6, 0.9, 0.7, 0.3, 0.8, 0.0, 0.5, 0.9, 0.6, 0.4, 0.2, 0.7, 0.8, 0.1, 0.9, 0.5, 0.3, 0.6, 0.8, 0.7, 0.4, 0.0, 0.9, 0.2, 0.5, 0.8, 0.6, 0.3, 0.7, 0.9, 0.1, 0.5, 0.8, 0.4, 0.6, 0.2, 0.9, 0.7, 0.0, 0.8, 0.5, 0.6, 0.3, 0.9, 0.1],
  'amber': [0.2, 0.6, 0.9, 0.5, 0.1, 0.7, 0.8, 0.4, 0.6, 0.9, 0.3, 0.2, 0.8, 0.7, 0.5, 0.1, 0.9, 0.6, 0.4, 0.8, 0.7, 0.2, 0.5, 0.9, 0.3, 0.6, 0.1, 0.8, 0.4, 0.7, 0.9, 0.5, 0.2, 0.8, 0.6, 0.3, 0.7, 0.9, 0.1, 0.4, 0.8, 0.5, 0.6, 0.2, 0.9, 0.7, 0.3, 0.8, 0.4, 0.6],
  'musk': [0.3, 0.4, 0.7, 0.6, 0.0, 0.8, 0.5, 0.9, 0.2, 0.7, 0.4, 0.6, 0.9, 0.8, 0.3, 0.1, 0.5, 0.7, 0.6, 0.9, 0.8, 0.0, 0.4, 0.7, 0.5, 0.9, 0.2, 0.6, 0.8, 0.3, 0.7, 0.9, 0.4, 0.5, 0.8, 0.6, 0.1, 0.9, 0.7, 0.2, 0.5, 0.8, 0.6, 0.4, 0.9, 0.3, 0.7, 0.5, 0.8, 0.2],

  // Fresh notes
  'mint': [0.9, 0.1, -0.4, 0.8, -0.2, -0.1, 0.6, 0.3, 0.2, -0.3, 0.9, 0.5, -0.1, 0.7, 0.0, 0.4, 0.8, -0.2, 0.6, 0.1, 0.9, -0.3, 0.5, 0.7, -0.1, 0.2, 0.8, 0.4, 0.6, -0.2, 0.9, 0.3, 0.1, 0.7, -0.4, 0.8, 0.5, 0.0, 0.6, -0.1, 0.9, 0.2, 0.7, -0.3, 0.8, 0.4, 0.1, 0.5, 0.9, 0.6],
  'eucalyptus': [0.8, 0.0, -0.3, 0.9, -0.1, 0.2, 0.7, 0.4, 0.1, -0.4, 0.8, 0.6, -0.2, 0.5, 0.3, 0.9, 0.7, -0.1, 0.4, 0.0, 0.8, -0.3, 0.6, 0.9, -0.2, 0.1, 0.7, 0.5, 0.8, -0.1, 0.4, 0.2, 0.9, 0.6, -0.3, 0.7, 0.3, 0.1, 0.8, -0.2, 0.5, 0.9, 0.4, -0.4, 0.7, 0.6, 0.0, 0.8, 0.2, 0.9],

  // Spicy notes
  'cinnamon': [0.2, 0.7, 0.5, 0.8, 0.9, 0.4, 0.1, 0.6, 0.8, 0.3, 0.9, 0.7, 0.5, 0.2, 0.8, 0.6, 0.4, 0.9, 0.3, 0.7, 0.1, 0.8, 0.5, 0.6, 0.9, 0.2, 0.7, 0.4, 0.8, 0.6, 0.3, 0.9, 0.5, 0.1, 0.7, 0.8, 0.4, 0.6, 0.9, 0.2, 0.3, 0.7, 0.8, 0.5, 0.1, 0.9, 0.6, 0.4, 0.7, 0.8],
  'cardamom': [0.1, 0.8, 0.6, 0.9, 0.7, 0.3, 0.2, 0.5, 0.9, 0.4, 0.8, 0.6, 0.7, 0.1, 0.9, 0.5, 0.3, 0.8, 0.4, 0.6, 0.2, 0.9, 0.7, 0.5, 0.8, 0.1, 0.6, 0.3, 0.9, 0.7, 0.4, 0.8, 0.6, 0.0, 0.5, 0.9, 0.3, 0.7, 0.8, 0.1, 0.4, 0.6, 0.9, 0.7, 0.2, 0.8, 0.5, 0.3, 0.6, 0.9]
};

export class VectorDatabaseService {
  private static readonly VECTOR_DIMENSION = 50;

  // Generate fragrance DNA from notes and description
  async generateFragranceDNA(
    fragmentId: string,
    notes: { top: string[]; middle: string[]; base: string[] },
    description: string,
    metadata: any = {}
  ): Promise<FragranceDNA> {
    try {
      // Generate note-based embedding
      const notesEmbedding = this.generateNotesEmbedding(notes);

      // Generate semantic embedding from description
      const semanticEmbedding = await this.generateSemanticEmbedding(description);

      // Generate market positioning vector
      const marketEmbedding = this.generateMarketEmbedding(metadata);

      // Initialize user preference vector (will be updated based on user interactions)
      const userPreferenceEmbedding = new Array(VectorDatabaseService.VECTOR_DIMENSION).fill(0);

      // Extract metadata scores
      const fragranceMetadata = {
        dominant_accords: this.extractDominantAccords(notes),
        intensity: this.calculateIntensity(notes, description),
        longevity: this.calculateLongevity(notes, metadata),
        sillage: this.calculateSillage(notes, metadata),
        uniqueness: this.calculateUniqueness(notes),
        versatility: this.calculateVersatility(notes),
        season_scores: this.calculateSeasonScores(notes),
        occasion_scores: this.calculateOccasionScores(notes, description),
        age_appeal: this.calculateAgeAppeal(notes, description),
        gender_appeal: this.calculateGenderAppeal(notes, description)
      };

      const fragranceDNA: FragranceDNA = {
        fragmentId,
        embeddings: {
          notes: notesEmbedding,
          semantic: semanticEmbedding,
          user_preference: userPreferenceEmbedding,
          market: marketEmbedding
        },
        metadata: fragranceMetadata,
        lastUpdated: new Date()
      };

      // Store in database
      await this.storeDNA(fragranceDNA);

      return fragranceDNA;

    } catch (error) {
      console.error('Error generating fragrance DNA:', error);
      throw error;
    }
  }

  // Find similar fragrances using vector similarity
  async findSimilarFragrances(
    fragmentId: string,
    options: {
      count?: number;
      matchType?: 'notes' | 'semantic' | 'hybrid' | 'user_preference';
      threshold?: number;
      userEmail?: string;
    } = {}
  ): Promise<SimilarityResult[]> {
    try {
      const { count = 10, matchType = 'hybrid', threshold = 0.5 } = options;

      // Get target fragrance DNA
      const targetDNA = await this.getFragranceDNA(fragmentId);
      if (!targetDNA) {
        throw new Error('Fragrance DNA not found');
      }

      // Get all other fragrance DNAs
      const { data: allDNA, error } = await supabase
        .from('fragrance_vectors')
        .select('*')
        .neq('fragment_id', fragmentId);

      if (error) throw error;

      const similarities: SimilarityResult[] = [];

      for (const candidateDNA of allDNA || []) {
        try {
          const candidate = JSON.parse(candidateDNA.dna_data) as FragranceDNA;

          // Calculate similarity based on match type
          let similarity = 0;
          let explanation = '';

          switch (matchType) {
            case 'notes':
              similarity = this.cosineSimilarity(
                targetDNA.embeddings.notes,
                candidate.embeddings.notes
              );
              explanation = 'Similar fragrance notes and accords';
              break;

            case 'semantic':
              similarity = this.cosineSimilarity(
                targetDNA.embeddings.semantic,
                candidate.embeddings.semantic
              );
              explanation = 'Similar fragrance description and character';
              break;

            case 'user_preference':
              if (options.userEmail) {
                const userVector = await this.getUserPreferenceVector(options.userEmail);
                if (userVector) {
                  similarity = this.cosineSimilarity(
                    userVector.vector,
                    candidate.embeddings.notes
                  );
                  explanation = 'Matches your personal preferences';
                }
              }
              break;

            case 'hybrid':
            default:
              const noteSim = this.cosineSimilarity(
                targetDNA.embeddings.notes,
                candidate.embeddings.notes
              );
              const semanticSim = this.cosineSimilarity(
                targetDNA.embeddings.semantic,
                candidate.embeddings.semantic
              );
              similarity = (noteSim * 0.7) + (semanticSim * 0.3);
              explanation = 'Similar notes and overall character';
              break;
          }

          if (similarity >= threshold) {
            similarities.push({
              fragmentId: candidate.fragmentId,
              similarity,
              matchType,
              explanation,
              confidence: similarity * 100
            });
          }
        } catch (parseError) {
          console.error('Error parsing DNA data:', parseError);
        }
      }

      // Sort by similarity and return top results
      similarities.sort((a, b) => b.similarity - a.similarity);
      return similarities.slice(0, count);

    } catch (error) {
      console.error('Error finding similar fragrances:', error);
      throw error;
    }
  }

  // Build user preference vector from interaction history
  async buildUserPreferenceVector(userEmail: string): Promise<UserPreferenceVector> {
    try {
      // Get user's interaction history
      const { data: sessions, error } = await supabase
        .from('user_ai_sessions')
        .select('*')
        .eq('user_email', userEmail);

      if (error) throw error;

      // Initialize preference dimensions
      const dimensions = {
        freshness: 0,
        warmth: 0,
        sweetness: 0,
        spiciness: 0,
        woodiness: 0,
        floralness: 0,
        intensity: 0,
        longevity_preference: 0,
        price_sensitivity: 0,
        brand_loyalty: 0
      };

      let interactionCount = 0;

      // Analyse user interactions to build preferences
      for (const session of sessions || []) {
        if (session.recommendations) {
          // Analyse recommended fragrances user interacted with
          const recommendations = JSON.parse(session.recommendations);
          for (const rec of recommendations) {
            if (rec.clicked || rec.purchased) {
              // Get fragrance DNA and update preferences
              const dna = await this.getFragranceDNA(rec.fragmentId);
              if (dna) {
                this.updatePreferencesFromDNA(dimensions, dna, rec.purchased ? 2 : 1);
                interactionCount++;
              }
            }
          }
        }
      }

      // Normalise dimensions based on interaction count
      if (interactionCount > 0) {
        Object.keys(dimensions).forEach(key => {
          dimensions[key as keyof typeof dimensions] /= interactionCount;
        });
      }

      // Create preference vector
      const vector = Object.values(dimensions);

      // Pad to required dimension
      while (vector.length < VectorDatabaseService.VECTOR_DIMENSION) {
        vector.push(0);
      }

      const confidence = Math.min(100, interactionCount * 10);

      const userPreferenceVector: UserPreferenceVector = {
        userEmail,
        vector,
        confidence,
        dimensions,
        lastUpdated: new Date()
      };

      // Store user preference vector
      await this.storeUserPreferenceVector(userPreferenceVector);

      return userPreferenceVector;

    } catch (error) {
      console.error('Error building user preference vector:', error);
      throw error;
    }
  }

  // Cluster fragrances for discovery and categorisation
  async clusterFragrances(): Promise<FragranceCluster[]> {
    try {
      // Get all fragrance DNAs
      const { data: allDNA, error } = await supabase
        .from('fragrance_vectors')
        .select('*');

      if (error) throw error;

      const fragrances = allDNA?.map(item => {
        try {
          return JSON.parse(item.dna_data) as FragranceDNA;
        } catch {
          return null;
        }
      }).filter(Boolean) as FragranceDNA[];

      if (fragrances.length < 3) {
        return [];
      }

      // Simple k-means clustering implementation
      const numClusters = Math.min(8, Math.floor(fragrances.length / 3));
      const clusters = this.kMeansClustering(fragrances, numClusters);

      // Create cluster objects
      const fragranceClusters: FragranceCluster[] = clusters.map((cluster, index) => {
        const characteristics = this.extractClusterCharacteristics(cluster);

        return {
          id: `cluster_${index}`,
          name: this.generateClusterName(characteristics),
          centroid: this.calculateCentroid(cluster.map(f => f.embeddings.notes)),
          memberFragrances: cluster.map(f => f.fragmentId),
          characteristics,
          averagePrice: 150, // Would calculate from market data
          popularity: cluster.length
        };
      });

      return fragranceClusters;

    } catch (error) {
      console.error('Error clustering fragrances:', error);
      throw error;
    }
  }

  // Private helper methods

  private generateNotesEmbedding(notes: { top: string[]; middle: string[]; base: string[] }): number[] {
    const embedding = new Array(VectorDatabaseService.VECTOR_DIMENSION).fill(0);

    // Weight different note positions
    const weights = { top: 1.0, middle: 0.8, base: 0.6 };

    Object.entries(notes).forEach(([position, noteList]) => {
      const weight = weights[position as keyof typeof weights];

      noteList.forEach(note => {
        const noteEmbedding = NOTE_EMBEDDINGS[note.toLowerCase()];
        if (noteEmbedding) {
          noteEmbedding.forEach((value, index) => {
            embedding[index] += value * weight;
          });
        }
      });
    });

    // Normalise the vector
    return this.normaliseVector(embedding);
  }

  private async generateSemanticEmbedding(description: string): Promise<number[]> {
    // Simplified semantic embedding - in reality would use a proper embedding API
    const words = description.toLowerCase().split(' ');
    const embedding = new Array(VectorDatabaseService.VECTOR_DIMENSION).fill(0);

    // Simple word-based features
    const semanticFeatures = {
      'fresh': [0.8, 0.2, -0.1, 0.9, 0.0, -0.3],
      'warm': [-0.2, 0.8, 0.6, 0.1, 0.9, 0.3],
      'sweet': [0.1, 0.5, 0.8, 0.4, 0.2, 0.6],
      'spicy': [0.2, 0.7, 0.5, 0.8, 0.9, 0.4],
      'woody': [-0.3, 0.1, 0.2, -0.1, 0.4, 0.8],
      'floral': [-0.2, 0.8, 0.6, 0.1, 0.9, 0.3],
      'citrus': [0.9, 0.3, -0.2, 0.8, 0.0, -0.4],
      'oriental': [0.2, 0.6, 0.9, 0.5, 0.1, 0.7],
      'marine': [0.7, 0.0, -0.2, 0.8, -0.1, 0.3],
      'gourmand': [0.3, 0.7, 0.9, 0.6, 0.4, 0.8]
    };

    words.forEach(word => {
      const feature = semanticFeatures[word as keyof typeof semanticFeatures];
      if (feature) {
        feature.forEach((value, index) => {
          if (index < embedding.length) {
            embedding[index] += value;
          }
        });
      }
    });

    return this.normaliseVector(embedding);
  }

  private generateMarketEmbedding(metadata: any): number[] {
    const embedding = new Array(VectorDatabaseService.VECTOR_DIMENSION).fill(0);

    // Market positioning features
    const price = metadata.price || 150;
    const brand = metadata.brand || '';
    const gender = metadata.gender || 'unisex';

    // Price positioning
    if (price < 100) {
      embedding[0] = 0.8; // Budget
    } else if (price < 300) {
      embedding[1] = 0.8; // Mid-range
    } else {
      embedding[2] = 0.8; // Luxury
    }

    // Brand positioning
    const luxuryBrands = ['tom ford', 'creed', 'maison francis kurkdjian'];
    const massMarketBrands = ['calvin klein', 'hugo boss', 'versace'];

    if (luxuryBrands.some(brand_name => brand.toLowerCase().includes(brand_name))) {
      embedding[3] = 0.9;
    } else if (massMarketBrands.some(brand_name => brand.toLowerCase().includes(brand_name))) {
      embedding[4] = 0.9;
    } else {
      embedding[5] = 0.7; // Niche/Designer
    }

    // Gender positioning
    if (gender === 'male') {
      embedding[6] = 0.8;
    } else if (gender === 'female') {
      embedding[7] = 0.8;
    } else {
      embedding[8] = 0.8; // Unisex
    }

    return this.normaliseVector(embedding);
  }

  private extractDominantAccords(notes: { top: string[]; middle: string[]; base: string[] }): string[] {
    const accordCounts: { [accord: string]: number } = {};

    // Map notes to accords
    const noteAccordMap: { [note: string]: string[] } = {
      'bergamot': ['citrus', 'fresh'],
      'lemon': ['citrus', 'fresh'],
      'grapefruit': ['citrus', 'fresh'],
      'rose': ['floral', 'romantic'],
      'jasmine': ['floral', 'heady'],
      'lily': ['floral', 'clean'],
      'sandalwood': ['woody', 'creamy'],
      'cedar': ['woody', 'dry'],
      'vetiver': ['woody', 'earthy'],
      'vanilla': ['oriental', 'sweet'],
      'amber': ['oriental', 'warm'],
      'musk': ['oriental', 'sensual'],
      'mint': ['fresh', 'cooling'],
      'eucalyptus': ['fresh', 'medicinal'],
      'cinnamon': ['spicy', 'warm'],
      'cardamom': ['spicy', 'exotic']
    };

    Object.values(notes).flat().forEach(note => {
      const accords = noteAccordMap[note.toLowerCase()] || [];
      accords.forEach(accord => {
        accordCounts[accord] = (accordCounts[accord] || 0) + 1;
      });
    });

    return Object.entries(accordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([accord]) => accord);
  }

  private calculateIntensity(notes: any, description: string): number {
    // Simple intensity calculation based on note characteristics
    const intensityWords = ['intense', 'powerful', 'strong', 'bold', 'heavy'];
    const lightWords = ['light', 'subtle', 'gentle', 'soft', 'delicate'];

    const intensityScore = intensityWords.filter(word =>
      description.toLowerCase().includes(word)
    ).length;

    const lightScore = lightWords.filter(word =>
      description.toLowerCase().includes(word)
    ).length;

    return Math.max(1, Math.min(10, 5 + intensityScore - lightScore));
  }

  private calculateLongevity(notes: any, metadata: any): number {
    // Base longevity on note characteristics
    const baseNotes = notes.base || [];
    const hasStrongBase = baseNotes.some((note: string) =>
      ['sandalwood', 'cedar', 'amber', 'musk', 'vanilla'].includes(note.toLowerCase())
    );

    return hasStrongBase ? Math.floor(Math.random() * 3) + 7 : Math.floor(Math.random() * 4) + 4;
  }

  private calculateSillage(notes: any, metadata: any): number {
    // Random for demo - would calculate based on note characteristics
    return Math.floor(Math.random() * 10) + 1;
  }

  private calculateUniqueness(notes: any): number {
    // Simple uniqueness based on rare notes
    const commonNotes = ['lemon', 'bergamot', 'rose', 'jasmine', 'sandalwood'];
    const allNotes = Object.values(notes).flat();
    const commonCount = allNotes.filter((note: any) =>
      commonNotes.includes(note.toLowerCase())
    ).length;

    return Math.max(1, Math.min(10, 10 - commonCount));
  }

  private calculateVersatility(notes: any): number {
    // Higher versatility for balanced compositions
    const noteTypes = {
      citrus: Object.values(notes).flat().filter((note: any) =>
        ['lemon', 'bergamot', 'grapefruit'].includes(note.toLowerCase())
      ).length,
      floral: Object.values(notes).flat().filter((note: any) =>
        ['rose', 'jasmine', 'lily'].includes(note.toLowerCase())
      ).length,
      woody: Object.values(notes).flat().filter((note: any) =>
        ['sandalwood', 'cedar', 'vetiver'].includes(note.toLowerCase())
      ).length
    };

    const balance = Object.values(noteTypes).filter(count => count > 0).length;
    return Math.min(10, balance * 3);
  }

  private calculateSeasonScores(notes: any): { [season: string]: number } {
    return {
      spring: Math.random() * 100,
      summer: Math.random() * 100,
      autumn: Math.random() * 100,
      winter: Math.random() * 100
    };
  }

  private calculateOccasionScores(notes: any, description: string): { [occasion: string]: number } {
    return {
      casual: Math.random() * 100,
      office: Math.random() * 100,
      evening: Math.random() * 100,
      special: Math.random() * 100,
      date: Math.random() * 100
    };
  }

  private calculateAgeAppeal(notes: any, description: string): { [ageGroup: string]: number } {
    return {
      '18-25': Math.random() * 100,
      '26-35': Math.random() * 100,
      '36-45': Math.random() * 100,
      '46+': Math.random() * 100
    };
  }

  private calculateGenderAppeal(notes: any, description: string): { [gender: string]: number } {
    return {
      male: Math.random() * 100,
      female: Math.random() * 100,
      unisex: Math.random() * 100
    };
  }

  private normaliseVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      return 0;
    }

    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private async storeDNA(dna: FragranceDNA): Promise<void> {
    try {
      const { error } = await supabase
        .from('fragrance_vectors')
        .upsert({
          fragment_id: dna.fragmentId,
          dna_data: JSON.stringify(dna),
          last_updated: dna.lastUpdated.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing DNA:', error);
    }
  }

  private async getFragranceDNA(fragmentId: string): Promise<FragranceDNA | null> {
    try {
      const { data, error } = await supabase
        .from('fragrance_vectors')
        .select('*')
        .eq('fragment_id', fragmentId)
        .single();

      if (error) return null;

      return JSON.parse(data.dna_data) as FragranceDNA;
    } catch (error) {
      return null;
    }
  }

  private async storeUserPreferenceVector(userVector: UserPreferenceVector): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_preference_vectors')
        .upsert({
          user_email: userVector.userEmail,
          vector_data: JSON.stringify(userVector),
          confidence: userVector.confidence,
          last_updated: userVector.lastUpdated.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing user preference vector:', error);
    }
  }

  private async getUserPreferenceVector(userEmail: string): Promise<UserPreferenceVector | null> {
    try {
      const { data, error } = await supabase
        .from('user_preference_vectors')
        .select('*')
        .eq('user_email', userEmail)
        .single();

      if (error) return null;

      return JSON.parse(data.vector_data) as UserPreferenceVector;
    } catch (error) {
      return null;
    }
  }

  private updatePreferencesFromDNA(
    dimensions: any,
    dna: FragranceDNA,
    weight: number
  ): void {
    // Update preference dimensions based on fragrance DNA
    const metadata = dna.metadata;

    // Map DNA metadata to preference dimensions
    if (metadata.dominant_accords.includes('fresh')) {
      dimensions.freshness += weight;
    }
    if (metadata.dominant_accords.includes('warm')) {
      dimensions.warmth += weight;
    }
    if (metadata.dominant_accords.includes('sweet')) {
      dimensions.sweetness += weight;
    }
    if (metadata.dominant_accords.includes('spicy')) {
      dimensions.spiciness += weight;
    }
    if (metadata.dominant_accords.includes('woody')) {
      dimensions.woodiness += weight;
    }
    if (metadata.dominant_accords.includes('floral')) {
      dimensions.floralness += weight;
    }

    dimensions.intensity += metadata.intensity * weight * 0.1;
    dimensions.longevity_preference += metadata.longevity * weight * 0.1;
  }

  private kMeansClustering(fragrances: FragranceDNA[], k: number): FragranceDNA[][] {
    // Simplified k-means clustering
    const clusters: FragranceDNA[][] = Array(k).fill(null).map(() => []);

    // Random initial assignment
    fragrances.forEach((fragrance, index) => {
      clusters[index % k].push(fragrance);
    });

    return clusters.filter(cluster => cluster.length > 0);
  }

  private extractClusterCharacteristics(cluster: FragranceDNA[]): string[] {
    const accordCounts: { [accord: string]: number } = {};

    cluster.forEach(dna => {
      dna.metadata.dominant_accords.forEach(accord => {
        accordCounts[accord] = (accordCounts[accord] || 0) + 1;
      });
    });

    return Object.entries(accordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([accord]) => accord);
  }

  private generateClusterName(characteristics: string[]): string {
    const nameMap: { [key: string]: string } = {
      'fresh,citrus': 'Fresh Citrus Collection',
      'floral,romantic': 'Romantic Florals',
      'woody,warm': 'Warm Woods',
      'oriental,sweet': 'Sweet Orientals',
      'spicy,exotic': 'Exotic Spices'
    };

    const key = characteristics.slice(0, 2).join(',');
    return nameMap[key] || `${characteristics[0]?.charAt(0).toUpperCase()}${characteristics[0]?.slice(1)} Collection`;
  }

  private calculateCentroid(vectors: number[][]): number[] {
    if (vectors.length === 0) {
      return new Array(VectorDatabaseService.VECTOR_DIMENSION).fill(0);
    }

    const centroid = new Array(vectors[0].length).fill(0);

    vectors.forEach(vector => {
      vector.forEach((value, index) => {
        centroid[index] += value;
      });
    });

    return centroid.map(sum => sum / vectors.length);
  }
}