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
  provider: 'anthropic' | 'openai' | 'gemini' | 'deepseek' | 'google';
  costPer1k: number;
  maxTokens: number;
  capabilities: string[];
  recommended: boolean;
}

export const AI_MODELS: AIModel[] = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', costPer1k: 0.0002, maxTokens: 128000, capabilities: ['text', 'fast-processing'], recommended: true },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', costPer1k: 0.005, maxTokens: 128000, capabilities: ['text', 'vision', 'reasoning'], recommended: false },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', costPer1k: 0.00025, maxTokens: 200000, capabilities: ['text', 'fast-processing'], recommended: true },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', costPer1k: 0.003, maxTokens: 200000, capabilities: ['text', 'vision', 'reasoning'], recommended: false },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', costPer1k: 0.015, maxTokens: 200000, capabilities: ['text', 'vision', 'complex-reasoning'], recommended: false },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', costPer1k: 0.0005, maxTokens: 32768, capabilities: ['text', 'vision'], recommended: false },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', costPer1k: 0.0002, maxTokens: 128000, capabilities: ['text', 'fast-processing'], recommended: false }
];

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
    url?: string;
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
  preferredModel?: string;
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

interface AIProviderResult extends Partial<FragranceEnhancementResult> {
  tokensUsed: number;
  estimatedCost: number;
}

export class AIServiceManager {
  private anthropic: any | null = null;
  private openai: any | null = null; // Keep for client-side fallback
  private defaultModel: string;
  private usageStats: AIUsageStats;
  private availableModels: AIModel[];
  private static instance: AIServiceManager;

  private constructor() {
    this.defaultModel = process.env.EXPO_PUBLIC_DEFAULT_AI_MODEL || 'gpt-4o-mini';
    this.usageStats = this.createNewUsageStats();
    this.availableModels = [];

    // Initialize SDKs and then initialize clients
    initializeSDKs().then(() => {
      this.initializeClients();
      this.availableModels = this.getAvailableModels();
    });

    if (typeof window !== 'undefined') {
      this.loadUsageStats();
    }
  }

  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
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
      // OpenAI and DeepSeek clients are initialized dynamically within enhanceWithOpenAI
    } catch (error) {
      console.error('AI Service initialization error:', error);
    }
  }

  private loadUsageStats(): void {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('aiUsageStats');
        if (saved) {
          const stats = JSON.parse(saved);
          const currentMonth = new Date().toISOString().slice(0, 7);
          const statsMonth = stats.lastResetDate.slice(0, 7);

          if (currentMonth !== statsMonth) {
            this.usageStats = this.createNewUsageStats();
          } else {
            this.usageStats = stats;
          }
        } else {
          this.usageStats = this.createNewUsageStats();
        }
      }
    } catch (error) {
      console.error('Failed to load AI stats:', error);
      this.usageStats = this.createNewUsageStats();
    }
  }

  private createNewUsageStats(): AIUsageStats {
    return {
      totalTokensUsed: 0,
      totalCost: 0,
      enhancementsCompleted: 0,
      monthlyBudget: parseFloat(process.env.EXPO_PUBLIC_MONTHLY_AI_BUDGET || '5.00'),
      remainingBudget: parseFloat(process.env.EXPO_PUBLIC_MONTHLY_AI_BUDGET || '5.00'),
      lastResetDate: new Date().toISOString()
    };
  }

  private saveUsageStats() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('aiUsageStats', JSON.stringify(this.usageStats));
      }
    } catch (error) {
      console.error('Error saving usage stats:', error);
    }
  }

  public getAvailableModels(): AIModel[] {
    return AI_MODELS.filter(model => {
      switch (model.provider) {
        case 'anthropic':
          return this.anthropic !== null;
        case 'openai':
          return !!process.env.EXPO_PUBLIC_OPENAI_API_KEY;
        case 'gemini':
        case 'google':
          return !!process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        case 'deepseek':
          return !!process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
        default:
          return false;
      }
    });
  }

  public getCurrentModel(): AIModel {
    return this.availableModels.find(m => m.id === this.defaultModel) || AI_MODELS[0];
  }

  public setModel(modelId: string): boolean {
    if (this.availableModels.some(m => m.id === modelId)) {
      this.defaultModel = modelId;
      return true;
    }
    return false;
  }

  public getUsageStats(): AIUsageStats {
    return { ...this.usageStats };
  }

  public estimateCost(tokensEstimate: number, modelId?: string): number {
    const model = this.availableModels.find(m => m.id === (modelId || this.defaultModel));
    if (!model) return 0;
    return (tokensEstimate / 1000) * model.costPer1k;
  }

  public canAffordEnhancement(tokensEstimate: number = 4000, modelId?: string): boolean {
    const estimatedCost = this.estimateCost(tokensEstimate, modelId);
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

    // Use Client-Side Enhancement (Edge Function not deployed)
    const modelId = request.preferredModel || this.defaultModel;
    const model = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];

    if (!this.canAffordEnhancement(4000, model.id)) {
      throw new Error('Monthly AI budget exceeded. Please increase budget or wait for next month.');
    }

    try {
      let result: AIProviderResult;

      if (model.provider === 'anthropic' && this.anthropic) {
        result = await this.enhanceWithAnthropic(request, model);
      } else if ((model.provider === 'openai' || model.provider === 'deepseek') && process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
        result = await this.enhanceWithOpenAI(request, model);
      } else {
        throw new Error(`Provider ${model.provider} not available or not configured.`);
      }

      const processingTime = Date.now() - startTime;

      // Update usage statistics
      this.updateUsageStats(result.tokensUsed, result.estimatedCost);

      return {
        ...result,
        fragmentId: result.fragmentId || request.fragmentId,
        confidence: result.confidence || 0,
        suggestedChanges: result.suggestedChanges || {},
        researchSources: result.researchSources || {
          officialSources: [],
          retailerPricing: [],
          communityData: [],
          industryData: []
        },
        costBreakdown: {
          tokensUsed: result.tokensUsed,
          estimatedCost: result.estimatedCost,
          model: model.name
        },
        warnings: result.warnings || [],
        processingTime
      };

    } catch (error: any) {
      console.error('AI Enhancement error:', error);
      throw new Error(`AI enhancement failed: ${error.message}`);
    }
  }

  private async enhanceWithAnthropic(request: FragranceEnhancementRequest, model: AIModel): Promise<AIProviderResult> {
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

  private async enhanceWithOpenAI(request: FragranceEnhancementRequest, model: AIModel): Promise<AIProviderResult> {
    const prompt = this.buildEnhancementPrompt(request);

    const isDeepSeek = model.provider === 'deepseek';
    const baseURL = isDeepSeek ? 'https://api.deepseek.com/v1' : 'https://api.openai.com/v1';
    const apiKey = isDeepSeek ? process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY : process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    console.log(`[AI Service] Using provider: ${model.provider}`);
    console.log(`[AI Service] Key loaded: ${apiKey ? 'YES' : 'NO'}`);
    if (apiKey) {
      console.log(`[AI Service] Key start: ${apiKey.substring(0, 7)}...`);
      console.log(`[AI Service] Key end: ...${apiKey.substring(apiKey.length - 4)}`);
      console.log(`[AI Service] Key length: ${apiKey.length}`);
    }

    if (!apiKey) throw new Error(`${model.provider} API key not found`);

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      dangerouslyAllowBrowser: true
    });

    const response = await openai.chat.completions.create({
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
    } catch (error: any) {
      console.error('Error parsing AI response:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }
}

// Export singleton instance
export const aiService = AIServiceManager.getInstance();
export default aiService;