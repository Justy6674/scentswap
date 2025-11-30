/**
 * Personal AI Assistant
 * Conversational AI for fragrance consultation and recommendations
 */

import { aiService } from './aiService';
import { smartSearch } from './searchAI';
import { supabase } from './supabase';

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  context: ConversationContext;
  startedAt: Date;
  lastActivity: Date;
  status: 'active' | 'archived' | 'completed';
  userEmail: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    messageType?: 'greeting' | 'question' | 'recommendation' | 'clarification' | 'followup';
    confidence?: number;
    sources?: string[];
    recommendations?: FragranceRecommendation[];
    searchResults?: any[];
    cost?: number;
    tokensUsed?: number;
  };
}

export interface ConversationContext {
  userProfile: UserFragranceProfile;
  currentTopic: string;
  conversationGoals: string[];
  mentionedFragrances: string[];
  preferences: {
    budget: [number, number] | null;
    occasions: string[];
    notes: { liked: string[]; disliked: string[] };
    brands: { preferred: string[]; avoided: string[] };
    concentration: string[];
    performance: string[];
  };
  sessionStats: {
    questionsAsked: number;
    recommendationsGiven: number;
    searchesPerformed: number;
    costAccumulated: number;
  };
}

export interface UserFragranceProfile {
  email: string;
  name?: string;
  fragranceExperience: 'beginner' | 'intermediate' | 'expert';
  skinType?: 'dry' | 'oily' | 'normal' | 'sensitive';
  preferences: {
    favoriteFragrances: string[];
    favoriteBrands: string[];
    preferredNotes: string[];
    dislikedNotes: string[];
    budgetRange: [number, number];
    occasionalPreferences: {
      work: string[];
      casual: string[];
      formal: string[];
      romantic: string[];
      special: string[];
    };
    seasonalPreferences: {
      spring: string[];
      summer: string[];
      autumn: string[];
      winter: string[];
    };
  };
  purchaseHistory: FragrancePurchase[];
  consultationHistory: string[];
  lastActive: Date;
}

export interface FragranceRecommendation {
  fragranceId: string;
  name: string;
  brand: string;
  confidence: number;
  reason: string;
  priceAUD?: number;
  alternatives?: string[];
  occasion?: string[];
  season?: string[];
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  performance?: {
    longevity: string;
    projection: string;
    rating: number;
  };
  australianAvailability?: {
    retailers: string[];
    avgPrice: number;
    inStock: boolean;
  };
}

export interface FragrancePurchase {
  fragranceId: string;
  name: string;
  brand: string;
  priceAUD: number;
  purchaseDate: Date;
  retailer: string;
  rating?: number;
  review?: string;
  wouldRepurchase?: boolean;
}

class PersonalAIAssistant {
  private readonly SYSTEM_PROMPT = `You are an expert Australian fragrance consultant and personal AI assistant for ScentSwap. Your role is to provide personalized fragrance advice, recommendations, and consultation.

Key Guidelines:
- Use Australian English spelling and terminology
- Focus on fragrances available in the Australian market
- Provide pricing in AUD
- Reference local retailers (Chemist Warehouse, Priceline, David Jones, Myer, etc.)
- Be conversational, friendly, and knowledgeable
- Ask clarifying questions to better understand user needs
- Provide specific, actionable recommendations
- Explain your reasoning clearly
- Consider Australian climate and lifestyle
- Stay current with fragrance trends and releases

Capabilities:
- Fragrance recommendations based on preferences
- Comparison between fragrances
- Occasion and seasonal advice
- Budget-conscious alternatives
- Performance and longevity guidance
- Australian market insights and pricing
- Educational content about fragrance families and notes

Always aim to be helpful, accurate, and provide value through your expertise.`;

  private activeConversations = new Map<string, AIConversation>();

  async startConversation(userEmail: string, initialMessage?: string): Promise<AIConversation> {
    // Load or create user profile
    const userProfile = await this.getUserProfile(userEmail);

    const conversation: AIConversation = {
      id: this.generateConversationId(),
      messages: [],
      context: {
        userProfile,
        currentTopic: 'general_consultation',
        conversationGoals: ['understand_preferences', 'provide_recommendations'],
        mentionedFragrances: [],
        preferences: {
          budget: userProfile.preferences.budgetRange,
          occasions: [],
          notes: { liked: userProfile.preferences.preferredNotes, disliked: userProfile.preferences.dislikedNotes },
          brands: { preferred: userProfile.preferences.favoriteBrands, avoided: [] },
          concentration: [],
          performance: []
        },
        sessionStats: {
          questionsAsked: 0,
          recommendationsGiven: 0,
          searchesPerformed: 0,
          costAccumulated: 0
        }
      },
      startedAt: new Date(),
      lastActivity: new Date(),
      status: 'active',
      userEmail
    };

    // Add system greeting
    const greeting = await this.generatePersonalizedGreeting(userProfile);
    this.addMessage(conversation, 'assistant', greeting, 'greeting');

    // Process initial message if provided
    if (initialMessage) {
      await this.processUserMessage(conversation, initialMessage);
    }

    // Store conversation
    this.activeConversations.set(conversation.id, conversation);
    await this.saveConversation(conversation);

    return conversation;
  }

  async processUserMessage(conversation: AIConversation, message: string): Promise<AIMessage> {
    // Add user message to conversation
    const userMessage = this.addMessage(conversation, 'user', message);

    try {
      // Analyze user message for intent and context
      const analysis = await this.analyzeUserMessage(message, conversation.context);

      // Update conversation context
      this.updateConversationContext(conversation, analysis);

      // Generate AI response
      const response = await this.generateAIResponse(conversation, analysis);

      // Add AI response to conversation
      const aiMessage = this.addMessage(
        conversation,
        'assistant',
        response.content,
        response.messageType,
        response.metadata
      );

      // Update conversation activity
      conversation.lastActivity = new Date();

      // Save conversation
      await this.saveConversation(conversation);

      return aiMessage;

    } catch (error) {
      console.error('Error processing message:', error);

      // Add error response
      const errorMessage = this.addMessage(
        conversation,
        'assistant',
        "I apologise, but I'm having trouble processing that right now. Could you please try rephrasing your question?",
        'clarification'
      );

      return errorMessage;
    }
  }

  async getRecommendations(
    conversation: AIConversation,
    criteria: {
      budget?: [number, number];
      occasion?: string;
      season?: string;
      notes?: string[];
      style?: string;
    }
  ): Promise<FragranceRecommendation[]> {

    try {
      // Build search query based on criteria
      const searchQuery = this.buildSearchQuery(criteria, conversation.context);

      // Use smart search to find matches
      const searchResults = await smartSearch.intelligentSearch({
        query: searchQuery,
        userContext: {
          previousPurchases: conversation.context.userProfile.purchaseHistory.map(p => p.fragranceId),
          preferences: {
            preferredNotes: conversation.context.preferences.notes.liked,
            dislikedNotes: conversation.context.preferences.notes.disliked,
            favouriteBrands: conversation.context.preferences.brands.preferred,
            preferredConcentrations: conversation.context.preferences.concentration,
            budgetRange: criteria.budget || conversation.context.preferences.budget || [0, 500],
            occasions: criteria.occasion ? [criteria.occasion] : conversation.context.preferences.occasions,
            seasonalPreferences: {
              spring: [], summer: [], autumn: [], winter: []
            }
          }
        },
        limit: 10
      });

      // Convert search results to recommendations
      const recommendations = searchResults.results.map(result => ({
        fragranceId: result.id,
        name: result.name,
        brand: result.brand,
        confidence: result.relevanceScore,
        reason: result.matchExplanation,
        priceAUD: result.average_price_aud,
        occasion: result.aiGenerated?.bestOccasions || [],
        season: result.aiGenerated?.seasonalFit || [],
        notes: {
          top: result.top_notes || [],
          middle: result.middle_notes || [],
          base: result.base_notes || []
        },
        performance: {
          longevity: result.performance_level || 'unknown',
          projection: 'moderate', // Default value
          rating: result.rating_value || 0
        },
        australianAvailability: {
          retailers: result.australianAvailability?.map(r => r.name) || [],
          avgPrice: result.average_price_aud || 0,
          inStock: result.australianAvailability?.some(r => r.inStock) || false
        }
      }));

      // Update session stats
      conversation.context.sessionStats.recommendationsGiven += recommendations.length;

      return recommendations.slice(0, 5); // Return top 5

    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  async getConversation(conversationId: string): Promise<AIConversation | null> {
    // Try to get from memory first
    const conversation = this.activeConversations.get(conversationId);
    if (conversation) {
      return conversation;
    }

    // Load from database
    try {
      const { data, error } = await supabase
        .from('user_ai_sessions')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.parseConversationFromDB(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
      return null;
    }
  }

  async getUserConversations(userEmail: string, limit: number = 10): Promise<AIConversation[]> {
    try {
      const { data, error } = await supabase
        .from('user_ai_sessions')
        .select('*')
        .eq('user_email', userEmail)
        .eq('session_type', 'consultation')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error loading user conversations:', error);
        return [];
      }

      return data?.map(item => this.parseConversationFromDB(item)) || [];
    } catch (error) {
      console.error('Error loading user conversations:', error);
      return [];
    }
  }

  private async getUserProfile(userEmail: string): Promise<UserFragranceProfile> {
    try {
      // Check if profile exists in database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error || !data) {
        // Create default profile
        return this.createDefaultProfile(userEmail);
      }

      // Parse profile from database
      return this.parseProfileFromDB(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      return this.createDefaultProfile(userEmail);
    }
  }

  private createDefaultProfile(userEmail: string): UserFragranceProfile {
    return {
      email: userEmail,
      fragranceExperience: 'beginner',
      preferences: {
        favoriteFragrances: [],
        favoriteBrands: [],
        preferredNotes: [],
        dislikedNotes: [],
        budgetRange: [50, 200],
        occasionalPreferences: {
          work: [], casual: [], formal: [], romantic: [], special: []
        },
        seasonalPreferences: {
          spring: [], summer: [], autumn: [], winter: []
        }
      },
      purchaseHistory: [],
      consultationHistory: [],
      lastActive: new Date()
    };
  }

  private async generatePersonalizedGreeting(profile: UserFragranceProfile): Promise<string> {
    const timeOfDay = this.getTimeOfDay();
    const experienceLevel = profile.fragranceExperience;

    let greeting = `Good ${timeOfDay}! I'm your personal fragrance consultant. `;

    if (profile.preferences.favoriteFragrances.length > 0) {
      greeting += `I see you've enjoyed ${profile.preferences.favoriteFragrances[0]} in the past. `;
    }

    switch (experienceLevel) {
      case 'beginner':
        greeting += "I'm here to help you discover amazing fragrances that suit your style and budget. What brings you here today?";
        break;
      case 'expert':
        greeting += "I'd love to help you explore new releases or find that perfect addition to your collection. What are you looking for?";
        break;
      default:
        greeting += "How can I help you with your fragrance journey today?";
    }

    return greeting;
  }

  private async analyzeUserMessage(message: string, context: ConversationContext): Promise<any> {
    try {
      const analysisPrompt = `Analyze this user message for fragrance consultation:

Message: "${message}"

User Context:
- Experience: ${context.userProfile.fragranceExperience}
- Preferred notes: ${context.preferences.notes.liked.join(', ')}
- Budget range: $${context.preferences.budget?.[0] || 50}-${context.preferences.budget?.[1] || 200} AUD

Extract:
1. Intent (recommendation, question, comparison, information)
2. Mentioned fragrances, brands, or notes
3. Occasion or use case
4. Budget constraints
5. Preferences or dislikes mentioned
6. Questions that need answering

Return structured information for generating a helpful response.`;

      const enhancement = await aiService.enhanceFragrance({
        fragmentId: 'message-analysis',
        currentData: { message, context: JSON.stringify(context) },
        researchScope: {
          checkPricing: false,
          verifyPerfumer: false,
          enhanceNotes: false,
          updateClassification: true,
          verifyYear: false,
          checkAvailability: false
        },
        retailersToCheck: []
      });

      return {
        intent: 'recommendation', // Default intent
        extractedInfo: enhancement.suggestedChanges,
        confidence: enhancement.confidence
      };

    } catch (error) {
      console.error('Error analyzing message:', error);
      return {
        intent: 'general',
        extractedInfo: {},
        confidence: 50
      };
    }
  }

  private updateConversationContext(conversation: AIConversation, analysis: any): void {
    // Update mentioned fragrances
    if (analysis.extractedInfo.fragrances) {
      conversation.context.mentionedFragrances.push(...analysis.extractedInfo.fragrances);
    }

    // Update preferences based on mentioned likes/dislikes
    if (analysis.extractedInfo.liked_notes) {
      conversation.context.preferences.notes.liked.push(...analysis.extractedInfo.liked_notes);
    }

    if (analysis.extractedInfo.disliked_notes) {
      conversation.context.preferences.notes.disliked.push(...analysis.extractedInfo.disliked_notes);
    }

    // Update topic
    conversation.context.currentTopic = analysis.intent || 'general_consultation';

    // Update stats
    conversation.context.sessionStats.questionsAsked++;
  }

  private async generateAIResponse(conversation: AIConversation, analysis: any): Promise<any> {
    try {
      // Build context for AI response
      const conversationHistory = conversation.messages.slice(-10); // Last 10 messages
      const responsePrompt = `${this.SYSTEM_PROMPT}

Conversation History:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

User Profile:
- Experience: ${conversation.context.userProfile.fragranceExperience}
- Preferred notes: ${conversation.context.preferences.notes.liked.join(', ')}
- Budget: $${conversation.context.preferences.budget?.[0] || 50}-${conversation.context.preferences.budget?.[1] || 200} AUD
- Favorite brands: ${conversation.context.preferences.brands.preferred.join(', ')}

Current Context:
- Topic: ${conversation.context.currentTopic}
- Intent: ${analysis.intent}
- Extracted info: ${JSON.stringify(analysis.extractedInfo)}

Generate a helpful, personalized response. If the user is asking for recommendations, provide specific fragrance suggestions with Australian pricing and availability.

Be conversational and friendly while being informative and helpful.`;

      const enhancement = await aiService.enhanceFragrance({
        fragmentId: 'ai-response',
        currentData: {
          prompt: responsePrompt,
          conversation_id: conversation.id
        },
        researchScope: {
          checkPricing: true,
          verifyPerfumer: false,
          enhanceNotes: false,
          updateClassification: false,
          verifyYear: false,
          checkAvailability: true
        },
        retailersToCheck: ['Chemist Warehouse', 'Priceline', 'David Jones']
      });

      // Extract response from AI enhancement
      const responseContent = this.extractResponseContent(enhancement);

      // Determine message type
      const messageType = this.determineMessageType(analysis.intent);

      // Get recommendations if needed
      let recommendations: FragranceRecommendation[] = [];
      if (analysis.intent === 'recommendation') {
        recommendations = await this.getRecommendations(conversation, analysis.extractedInfo);
      }

      return {
        content: responseContent,
        messageType,
        metadata: {
          confidence: enhancement.confidence,
          recommendations,
          cost: enhancement.costBreakdown?.estimatedCost || 0,
          tokensUsed: enhancement.costBreakdown?.tokensUsed || 0
        }
      };

    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        content: "I apologise for the technical difficulty. Let me help you with that in a different way. What specific type of fragrance are you looking for?",
        messageType: 'clarification',
        metadata: { confidence: 0 }
      };
    }
  }

  private addMessage(
    conversation: AIConversation,
    role: 'user' | 'assistant' | 'system',
    content: string,
    messageType?: string,
    metadata?: any
  ): AIMessage {
    const message: AIMessage = {
      id: this.generateMessageId(),
      role,
      content,
      timestamp: new Date(),
      metadata: {
        messageType,
        ...metadata
      }
    };

    conversation.messages.push(message);
    return message;
  }

  private buildSearchQuery(criteria: any, context: ConversationContext): string {
    const parts: string[] = [];

    if (criteria.occasion) {
      parts.push(`${criteria.occasion} occasion`);
    }

    if (criteria.season) {
      parts.push(`${criteria.season} season`);
    }

    if (criteria.notes?.length > 0) {
      parts.push(criteria.notes.join(' '));
    }

    if (criteria.budget) {
      parts.push(`under $${criteria.budget[1]} AUD`);
    }

    if (criteria.style) {
      parts.push(criteria.style);
    }

    if (context.preferences.notes.liked.length > 0) {
      parts.push(context.preferences.notes.liked.slice(0, 2).join(' '));
    }

    return parts.length > 0 ? parts.join(' ') : 'fragrance recommendations';
  }

  private extractResponseContent(enhancement: any): string {
    // Extract meaningful response from AI enhancement result
    if (enhancement.suggestedChanges && Object.keys(enhancement.suggestedChanges).length > 0) {
      const firstChange = Object.values(enhancement.suggestedChanges)[0] as any;
      return firstChange.suggested || firstChange.reasoning || "I'd be happy to help you find the perfect fragrance.";
    }

    return "I'd be happy to help you with your fragrance needs. What are you looking for today?";
  }

  private determineMessageType(intent: string): string {
    switch (intent) {
      case 'recommendation': return 'recommendation';
      case 'question': return 'question';
      case 'comparison': return 'question';
      default: return 'question';
    }
  }

  private async saveConversation(conversation: AIConversation): Promise<void> {
    try {
      const conversationData = {
        id: conversation.id,
        user_email: conversation.userEmail,
        session_type: 'consultation',
        conversation: JSON.stringify({
          messages: conversation.messages,
          context: conversation.context
        }),
        cost: conversation.context.sessionStats.costAccumulated,
        tokens_used: conversation.messages.reduce((sum, m) => sum + (m.metadata?.tokensUsed || 0), 0),
        created_at: conversation.startedAt.toISOString(),
        completed_at: conversation.status === 'completed' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('user_ai_sessions')
        .upsert(conversationData);

      if (error) {
        console.error('Error saving conversation:', error);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  private parseConversationFromDB(data: any): AIConversation {
    const conversationData = JSON.parse(data.conversation || '{}');

    return {
      id: data.id,
      messages: conversationData.messages || [],
      context: conversationData.context || this.createDefaultContext(),
      startedAt: new Date(data.created_at),
      lastActivity: new Date(data.completed_at || data.created_at),
      status: data.completed_at ? 'completed' : 'active',
      userEmail: data.user_email
    };
  }

  private parseProfileFromDB(data: any): UserFragranceProfile {
    const metadata = data.metadata || {};

    return {
      email: data.email,
      name: metadata.name,
      fragranceExperience: metadata.fragrance_experience || 'beginner',
      skinType: metadata.skin_type,
      preferences: metadata.preferences || this.createDefaultProfile(data.email).preferences,
      purchaseHistory: metadata.purchase_history || [],
      consultationHistory: metadata.consultation_history || [],
      lastActive: new Date(data.last_activity || data.created_at)
    };
  }

  private createDefaultContext(): ConversationContext {
    return {
      userProfile: this.createDefaultProfile(''),
      currentTopic: 'general',
      conversationGoals: [],
      mentionedFragrances: [],
      preferences: {
        budget: null,
        occasions: [],
        notes: { liked: [], disliked: [] },
        brands: { preferred: [], avoided: [] },
        concentration: [],
        performance: []
      },
      sessionStats: {
        questionsAsked: 0,
        recommendationsGiven: 0,
        searchesPerformed: 0,
        costAccumulated: 0
      }
    };
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
}

// Export singleton instance
export const aiAssistant = new PersonalAIAssistant();
export default aiAssistant;