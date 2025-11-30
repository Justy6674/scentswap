// Dynamic imports for web compatibility
let Anthropic: any = null;
let OpenAI: any = null;

// Initialize SDK clients only when needed
const initializeSDKs = async () => {
  if (!Anthropic && typeof window !== 'undefined') {
    try {
      const anthropicModule = await import('@anthropic-ai/sdk');
      Anthropic = anthropicModule.default;
    } catch (error) {
      console.warn('Anthropic SDK not available:', error);
    }
  }

  if (!OpenAI && typeof window !== 'undefined') {
    try {
      const openaiModule = await import('openai');
      OpenAI = openaiModule.default;
    } catch (error) {
      console.warn('OpenAI SDK not available:', error);
    }
  }
};

// AI Model Types and Configurations
export interface AIModel {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'gemini' | 'deepseek';
  costPer1000Tokens: number;
  maxTokens: number;
  capabilities: string[];
  recommended: boolean;
}

export const AI_MODELS: Record<string, AIModel> = {
  'claude-3-haiku-20240307': {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    costPer1000Tokens: 0.001, // $1 per million tokens
    maxTokens: 200000,
    capabilities: ['text', 'fast-processing'],
    recommended: true
  },
  'claude-3-opus-20240229': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    costPer1000Tokens: 0.015, // $15 per million tokens
    maxTokens: 200000,
    capabilities: ['text', 'vision', 'complex-reasoning'],
    recommended: false
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4 Omni',
    provider: 'openai',
    costPer1000Tokens: 0.005, // $5 per million tokens
    maxTokens: 128000,
    capabilities: ['text', 'vision', 'reasoning'],
    recommended: false
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4 Omni Mini',
    provider: 'openai',
    costPer1000Tokens: 0.0002, // $0.2 per million tokens
    maxTokens: 128000,
    capabilities: ['text', 'fast-processing'],
    recommended: false
  },
  'gemini-2.0-flash-001': {
    id: 'gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    costPer1000Tokens: 0.0005, // $0.5 per million tokens (estimated)
    maxTokens: 1048576,
    capabilities: ['text', 'vision', 'fast-processing'],
    recommended: false
  }
};

export interface AIUsageStats {
  totalTokensUsed: number;
  totalCost: number;
  enhancementsCompleted: number;
  monthlyBudget: number;
  remainingBudget: number;
  lastResetDate: string;
}

export interface FragranceEnhancementRequest {
  fragmentId: string;
  currentData: {
    name?: string;
    brand?: string;
    house?: string;
    concentration?: string;
    year_released?: number;
    gender?: string;
    family?: string;
    perfumers?: string[];
    top_notes?: string[];
    middle_notes?: string[];
    base_notes?: string[];
    main_accords?: string[];
    rating_value?: number;
    rating_count?: number;
    average_price_aud?: number;
    market_tier?: string;
    performance_level?: string;
    data_quality_score?: number;
    verified?: boolean;
  };
  researchScope: {
    checkPricing: boolean;
    verifyPerfumer: boolean;
    enhanceNotes: boolean;
    updateClassification: boolean;
    verifyYear: boolean;
    checkAvailability: boolean;
  };
  retailersToCheck: string[];
}

export interface FragranceEnhancementResult {
  fragmentId: string;
  confidence: number;
  suggestedChanges: {
    [key: string]: {
      current: any;
      suggested: any;
      confidence: number;
      sources: string[];
      reasoning: string;
    };
  };
  researchSources: {
    officialSources: string[];
    retailerPricing: Array<{
      retailer: string;
      price: number;
      currency: string;
      url: string;
      inStock: boolean;
    }>;
    communityData: string[];
    industryData: string[];
  };
  costBreakdown: {
    tokensUsed: number;
    estimatedCost: number;
    model: string;
  };
  warnings: string[];
  processingTime: number;
}

class AIServiceManager {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private currentModel: string;
  private usageStats: AIUsageStats;

  constructor() {
    this.currentModel = process.env.EXPO_PUBLIC_DEFAULT_AI_MODEL || 'claude-3-5-sonnet-20241022';
    this.usageStats = this.loadUsageStats();
    // Initialize SDKs and then initialize clients
    initializeSDKs().then(() => {
      this.initializeClients();
    });
  }

  private initializeClients() {
    try {
      // Initialize Anthropic
      const anthropicKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
      if (anthropicKey && anthropicKey !== 'your-anthropic-key-here') {
        this.anthropic = new Anthropic({
          apiKey: anthropicKey,
          dangerouslyAllowBrowser: true
        });
      }

      // Initialize OpenAI
      const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (openaiKey) {
        this.openai = new OpenAI({
          apiKey: openaiKey,
          dangerouslyAllowBrowser: true
        });
      }
    } catch (error) {
      console.error('AI Service initialization error:', error);
    }
  }

  private loadUsageStats(): AIUsageStats {
    try {
      const saved = localStorage.getItem('aiUsageStats');
      if (saved) {
        const stats = JSON.parse(saved);
        // Reset if new month
        const currentMonth = new Date().toISOString().substring(0, 7);
        const statsMonth = stats.lastResetDate?.substring(0, 7);

        if (currentMonth !== statsMonth) {
          return this.createNewUsageStats();
        }
        return stats;
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
    return this.createNewUsageStats();
  }

  private createNewUsageStats(): AIUsageStats {
    return {
      totalTokensUsed: 0,
      totalCost: 0,
      enhancementsCompleted: 0,
      monthlyBudget: parseFloat(process.env.EXPO_PUBLIC_MONTHLY_AI_BUDGET || '100'),
      remainingBudget: parseFloat(process.env.EXPO_PUBLIC_MONTHLY_AI_BUDGET || '100'),
      lastResetDate: new Date().toISOString()
    };
  }

  private saveUsageStats() {
    try {
      localStorage.setItem('aiUsageStats', JSON.stringify(this.usageStats));
    } catch (error) {
      console.error('Error saving usage stats:', error);
    }
  }

  public getAvailableModels(): AIModel[] {
    const models = Object.values(AI_MODELS);

    // Filter models based on available API keys
    return models.filter(model => {
      switch (model.provider) {
        case 'anthropic':
          return this.anthropic !== null;
        case 'openai':
          return this.openai !== null;
        case 'gemini':
          return !!process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        case 'deepseek':
          return !!process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
        default:
          return false;
      }
    });
  }

  public getCurrentModel(): AIModel {
    return AI_MODELS[this.currentModel];
  }

  public setModel(modelId: string): boolean {
    if (AI_MODELS[modelId]) {
      this.currentModel = modelId;
      return true;
    }
    return false;
  }

  public getUsageStats(): AIUsageStats {
    return { ...this.usageStats };
  }

  public estimateCost(tokensEstimate: number, modelId?: string): number {
    const model = AI_MODELS[modelId || this.currentModel];
    return (tokensEstimate / 1000) * model.costPer1000Tokens;
  }

  public canAffordEnhancement(tokensEstimate: number = 4000): boolean {
    const estimatedCost = this.estimateCost(tokensEstimate);
    return this.usageStats.remainingBudget >= estimatedCost;
  }

  private updateUsageStats(tokensUsed: number, cost: number) {
    this.usageStats.totalTokensUsed += tokensUsed;
    this.usageStats.totalCost += cost;
    this.usageStats.enhancementsCompleted += 1;
    this.usageStats.remainingBudget = Math.max(0, this.usageStats.monthlyBudget - this.usageStats.totalCost);
    this.saveUsageStats();
  }

  public async enhanceFragrance(request: FragranceEnhancementRequest): Promise<FragranceEnhancementResult> {
    const startTime = Date.now();

    if (!this.canAffordEnhancement()) {
      throw new Error('Monthly AI budget exceeded. Please increase budget or wait for next month.');
    }

    const model = this.getCurrentModel();

    try {
      let result: any;

      if (model.provider === 'anthropic' && this.anthropic) {
        result = await this.enhanceWithAnthropic(request, model);
      } else if (model.provider === 'openai' && this.openai) {
        result = await this.enhanceWithOpenAI(request, model);
      } else {
        throw new Error(`Provider ${model.provider} not available or not configured.`);
      }

      const processingTime = Date.now() - startTime;

      // Update usage statistics
      this.updateUsageStats(result.tokensUsed, result.estimatedCost);

      return {
        ...result,
        processingTime,
        costBreakdown: {
          tokensUsed: result.tokensUsed,
          estimatedCost: result.estimatedCost,
          model: model.name
        }
      };

    } catch (error) {
      console.error('AI Enhancement error:', error);
      throw new Error(`AI enhancement failed: ${error.message}`);
    }
  }

  private async enhanceWithAnthropic(request: FragranceEnhancementRequest, model: AIModel): Promise<Partial<FragranceEnhancementResult>> {
    const prompt = this.buildEnhancementPrompt(request);

    const response = await this.anthropic!.messages.create({
      model: model.id,
      max_tokens: parseInt(process.env.EXPO_PUBLIC_AI_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.EXPO_PUBLIC_AI_TEMPERATURE || '0.3'),
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Anthropic');
    }

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    const estimatedCost = this.estimateCost(tokensUsed, model.id);

    // Parse the AI response
    const parsed = this.parseAIResponse(content.text);

    return {
      ...parsed,
      tokensUsed,
      estimatedCost
    };
  }

  private async enhanceWithOpenAI(request: FragranceEnhancementRequest, model: AIModel): Promise<Partial<FragranceEnhancementResult>> {
    const prompt = this.buildEnhancementPrompt(request);

    const response = await this.openai!.chat.completions.create({
      model: model.id,
      max_tokens: parseInt(process.env.EXPO_PUBLIC_AI_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.EXPO_PUBLIC_AI_TEMPERATURE || '0.3'),
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    const estimatedCost = this.estimateCost(tokensUsed, model.id);

    // Parse the AI response
    const parsed = this.parseAIResponse(content);

    return {
      ...parsed,
      tokensUsed,
      estimatedCost
    };
  }

  private buildEnhancementPrompt(request: FragranceEnhancementRequest): string {
    return `You are a professional fragrance industry researcher specializing in Australian market data. Research and enhance the following fragrance record with accurate, verified information.

FRAGRANCE TO ENHANCE:
${JSON.stringify(request.currentData, null, 2)}

RESEARCH REQUIREMENTS:
${Object.entries(request.researchScope).map(([key, value]) => `- ${key}: ${value ? 'YES' : 'NO'}`).join('\n')}

AUSTRALIAN RETAILERS TO CHECK:
${request.retailersToCheck.join(', ')}

INSTRUCTIONS:
1. Research the fragrance thoroughly using official brand sources, Australian retailers, and industry databases
2. Provide confidence scores (0-100%) for each suggested change
3. Include source URLs and reasoning for each suggestion
4. Focus on Australian market pricing (AUD) and availability
5. Use Australian English spelling throughout
6. Be conservative with changes - only suggest updates with high confidence

RESPONSE FORMAT (JSON):
{
  "confidence": 85,
  "suggestedChanges": {
    "field_name": {
      "current": "current_value",
      "suggested": "new_value",
      "confidence": 90,
      "sources": ["url1", "url2"],
      "reasoning": "Explanation of why this change is recommended"
    }
  },
  "researchSources": {
    "officialSources": ["brand_website_urls"],
    "retailerPricing": [
      {
        "retailer": "Chemist Warehouse",
        "price": 165,
        "currency": "AUD",
        "url": "product_url",
        "inStock": true
      }
    ],
    "communityData": ["fragrantica_url"],
    "industryData": ["press_release_url"]
  },
  "warnings": ["Any issues or concerns about the data"]
}

Begin your research now:`;
  }

  private parseAIResponse(response: string): Partial<FragranceEnhancementResult> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        return {
          fragmentId: '',
          confidence: parsed.confidence || 0,
          suggestedChanges: parsed.suggestedChanges || {},
          researchSources: parsed.researchSources || {
            officialSources: [],
            retailerPricing: [],
            communityData: [],
            industryData: []
          },
          warnings: parsed.warnings || []
        };
      }

      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }
}

// Export singleton instance
export const aiService = new AIServiceManager();
export default aiService;