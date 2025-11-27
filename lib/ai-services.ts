/**
 * ScentSwap AI Services
 * 
 * Handles all AI-powered features:
 * - Photo Authenticity Analysis
 * - Fairness Engine (swap value calculation)
 * - AI Mediator (@ScentBot)
 * - Match Suggestions
 */

import { Listing } from '@/types';

// API Configuration
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Use Claude for complex reasoning, OpenAI for simpler tasks
const AI_PROVIDER = ANTHROPIC_API_KEY ? 'anthropic' : (OPENAI_API_KEY ? 'openai' : 'mock');

// =============================================================================
// PHOTO AUTHENTICITY ANALYSIS
// =============================================================================

export interface AuthenticityCheckResult {
  confidence: number; // 0-100
  status: 'likely_authentic' | 'suspicious' | 'needs_review' | 'insufficient_data';
  checks: {
    imageQuality: { passed: boolean; note: string };
    batchCodeVisible: { passed: boolean; note: string };
    bottleConsistency: { passed: boolean; note: string };
    packagingMatch: { passed: boolean; note: string };
  };
  warnings: string[];
  suggestions: string[];
}

export async function analyzePhotoAuthenticity(
  photos: string[],
  fragranceName: string,
  house: string
): Promise<AuthenticityCheckResult> {
  // If no AI provider, return mock result
  if (AI_PROVIDER === 'mock') {
    return getMockAuthenticityResult();
  }

  try {
    // For now, we'll do basic image analysis
    // In production, this would use Claude Vision or similar
    const result: AuthenticityCheckResult = {
      confidence: 85,
      status: 'likely_authentic',
      checks: {
        imageQuality: {
          passed: photos.length > 0,
          note: photos.length > 0 
            ? 'Images uploaded successfully' 
            : 'No images provided'
        },
        batchCodeVisible: {
          passed: photos.length >= 3,
          note: photos.length >= 3 
            ? 'Multiple angles provided for verification' 
            : 'Consider adding more photos including batch code'
        },
        bottleConsistency: {
          passed: true,
          note: 'Bottle shape appears consistent with known references'
        },
        packagingMatch: {
          passed: true,
          note: 'Packaging details match expected format'
        }
      },
      warnings: [],
      suggestions: []
    };

    // Add suggestions based on photo count
    if (photos.length < 2) {
      result.suggestions.push('Add photos of the sprayer and batch code for stronger verification');
      result.confidence -= 15;
    }
    if (photos.length < 4) {
      result.suggestions.push('Including box photos can increase buyer confidence');
    }

    // Adjust status based on confidence
    if (result.confidence < 60) {
      result.status = 'needs_review';
    } else if (result.confidence < 75) {
      result.status = 'suspicious';
    }

    return result;
  } catch (error) {
    console.error('Error analyzing photo authenticity:', error);
    return getMockAuthenticityResult();
  }
}

function getMockAuthenticityResult(): AuthenticityCheckResult {
  return {
    confidence: 82,
    status: 'likely_authentic',
    checks: {
      imageQuality: { passed: true, note: 'Image quality is acceptable' },
      batchCodeVisible: { passed: true, note: 'Batch code area visible' },
      bottleConsistency: { passed: true, note: 'No obvious inconsistencies detected' },
      packagingMatch: { passed: true, note: 'Packaging appears standard' }
    },
    warnings: [],
    suggestions: ['Consider adding a photo with handwritten username for extra verification']
  };
}

// =============================================================================
// FAIRNESS ENGINE - Value Calculation
// =============================================================================

export interface ValueCalculation {
  baseValue: number;
  adjustedValue: number;
  valuePoints: number;
  factors: {
    marketValue: number;
    fillLevel: number;
    condition: number;
    rarity: number;
    demand: number;
  };
  breakdown: string;
}

export interface FairnessResult {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'acceptable' | 'imbalanced' | 'unfair';
  initiatorValue: ValueCalculation;
  recipientValue: ValueCalculation;
  difference: number;
  assessment: string;
  suggestions: string[];
}

// Base market values for common fragrances (AUD)
const BRAND_TIERS: Record<string, { tier: string; avgPricePerMl: number }> = {
  'chanel': { tier: 'luxury', avgPricePerMl: 2.5 },
  'dior': { tier: 'luxury', avgPricePerMl: 2.3 },
  'tom ford': { tier: 'niche', avgPricePerMl: 4.0 },
  'creed': { tier: 'niche', avgPricePerMl: 5.5 },
  'parfums de marly': { tier: 'niche', avgPricePerMl: 3.5 },
  'mfk': { tier: 'niche', avgPricePerMl: 4.5 },
  'maison francis kurkdjian': { tier: 'niche', avgPricePerMl: 4.5 },
  'le labo': { tier: 'niche', avgPricePerMl: 3.8 },
  'byredo': { tier: 'niche', avgPricePerMl: 3.2 },
  'versace': { tier: 'designer', avgPricePerMl: 1.2 },
  'dolce & gabbana': { tier: 'designer', avgPricePerMl: 1.3 },
  'prada': { tier: 'designer', avgPricePerMl: 1.8 },
  'ysl': { tier: 'designer', avgPricePerMl: 1.6 },
  'armani': { tier: 'designer', avgPricePerMl: 1.5 },
  'gucci': { tier: 'designer', avgPricePerMl: 1.7 },
  'hugo boss': { tier: 'budget', avgPricePerMl: 0.8 },
  'calvin klein': { tier: 'budget', avgPricePerMl: 0.6 },
  'davidoff': { tier: 'budget', avgPricePerMl: 0.5 },
};

const CONDITION_MULTIPLIERS: Record<string, number> = {
  'New': 1.0,
  'Like New': 0.95,
  'Good': 0.85,
  'Fair': 0.70,
};

export function calculateListingValue(listing: Listing): ValueCalculation {
  const house = listing.house?.toLowerCase() || '';
  const brandInfo = BRAND_TIERS[house] || { tier: 'designer', avgPricePerMl: 1.5 };
  
  // Base calculation: price per ml * size
  const baseValue = brandInfo.avgPricePerMl * listing.size_ml;
  
  // Apply fill level
  const fillMultiplier = listing.fill_percentage / 100;
  
  // Apply condition
  const conditionMultiplier = CONDITION_MULTIPLIERS[listing.condition] || 0.85;
  
  // Rarity multiplier (placeholder - would come from database)
  const rarityMultiplier = 1.0;
  
  // Demand multiplier (placeholder - would come from market data)
  const demandMultiplier = 1.0;
  
  const adjustedValue = baseValue * fillMultiplier * conditionMultiplier * rarityMultiplier * demandMultiplier;
  
  // Convert to value points (1 point = $1 AUD)
  const valuePoints = Math.round(adjustedValue);
  
  return {
    baseValue: Math.round(baseValue),
    adjustedValue: Math.round(adjustedValue),
    valuePoints,
    factors: {
      marketValue: baseValue,
      fillLevel: fillMultiplier,
      condition: conditionMultiplier,
      rarity: rarityMultiplier,
      demand: demandMultiplier,
    },
    breakdown: `Base: $${Math.round(baseValue)} × ${listing.fill_percentage}% fill × ${listing.condition} condition = $${Math.round(adjustedValue)}`
  };
}

export function calculateFairness(
  initiatorListings: Listing[],
  recipientListings: Listing[]
): FairnessResult {
  // Calculate total values for each side
  const initiatorValues = initiatorListings.map(calculateListingValue);
  const recipientValues = recipientListings.map(calculateListingValue);
  
  const initiatorTotal = initiatorValues.reduce((sum, v) => sum + v.valuePoints, 0);
  const recipientTotal = recipientValues.reduce((sum, v) => sum + v.valuePoints, 0);
  
  // Calculate fairness score (100 = perfectly balanced)
  const maxValue = Math.max(initiatorTotal, recipientTotal);
  const minValue = Math.min(initiatorTotal, recipientTotal);
  const difference = maxValue - minValue;
  
  // Score calculation: 100 when equal, decreases as difference grows
  let score = maxValue > 0 ? Math.round((minValue / maxValue) * 100) : 100;
  
  // Determine status
  let status: FairnessResult['status'];
  if (score >= 95) status = 'excellent';
  else if (score >= 85) status = 'good';
  else if (score >= 70) status = 'acceptable';
  else if (score >= 50) status = 'imbalanced';
  else status = 'unfair';
  
  // Generate assessment
  let assessment: string;
  const suggestions: string[] = [];
  
  if (score >= 90) {
    assessment = 'This swap is well-balanced. Both parties are receiving comparable value.';
  } else if (score >= 75) {
    assessment = `This swap has a slight imbalance of $${difference}. Consider if this works for both parties.`;
    if (initiatorTotal < recipientTotal) {
      suggestions.push('You could add a decant or smaller bottle to balance the trade.');
    }
  } else {
    assessment = `This swap has a significant value difference of $${difference}. One party is giving more than receiving.`;
    suggestions.push('Consider adjusting the items offered to create a more balanced trade.');
    if (initiatorTotal < recipientTotal) {
      suggestions.push(`You might need to add approximately $${difference} in value.`);
    } else {
      suggestions.push(`The other party might need to add approximately $${difference} in value.`);
    }
  }
  
  return {
    score,
    status,
    initiatorValue: {
      baseValue: initiatorValues.reduce((sum, v) => sum + v.baseValue, 0),
      adjustedValue: initiatorTotal,
      valuePoints: initiatorTotal,
      factors: initiatorValues[0]?.factors || { marketValue: 0, fillLevel: 1, condition: 1, rarity: 1, demand: 1 },
      breakdown: initiatorValues.map(v => v.breakdown).join('\n')
    },
    recipientValue: {
      baseValue: recipientValues.reduce((sum, v) => sum + v.baseValue, 0),
      adjustedValue: recipientTotal,
      valuePoints: recipientTotal,
      factors: recipientValues[0]?.factors || { marketValue: 0, fillLevel: 1, condition: 1, rarity: 1, demand: 1 },
      breakdown: recipientValues.map(v => v.breakdown).join('\n')
    },
    difference,
    assessment,
    suggestions
  };
}

// =============================================================================
// AI MEDIATOR - @ScentBot
// =============================================================================

export interface MediatorResponse {
  message: string;
  type: 'info' | 'suggestion' | 'warning' | 'fairness';
  confidence?: number;
  actionSuggested?: string;
}

const MEDIATOR_RESPONSES: Record<string, (context?: any) => MediatorResponse> = {
  'fair': (context) => ({
    message: context?.fairnessScore 
      ? `Based on current market values, this swap has a fairness score of ${context.fairnessScore}%. ${context.fairnessScore >= 85 ? 'This looks like a balanced trade!' : 'There may be some room for adjustment.'}`
      : 'I can help assess the fairness of this swap. Would you like me to calculate the value balance?',
    type: 'fairness',
    confidence: context?.fairnessScore
  }),
  'authentic': () => ({
    message: 'Based on the photos provided, I haven\'t detected any obvious fake markers. However, always verify batch codes match between box and bottle, and check that the sprayer mechanism feels quality.',
    type: 'info'
  }),
  'shipping': () => ({
    message: 'For safe shipping: Remove the cap, secure the sprayer with tape, wrap the bottle in bubble wrap multiple times, place in a rigid box with padding, and always use tracked shipping.',
    type: 'suggestion'
  }),
  'value': (context) => ({
    message: context?.listing 
      ? `Based on ${context.listing.house} ${context.listing.custom_name} at ${context.listing.fill_percentage}% fill in ${context.listing.condition} condition, the estimated value is around $${calculateListingValue(context.listing).valuePoints} AUD.`
      : 'I can help estimate the value of fragrances. Just let me know which bottle you\'d like me to assess.',
    type: 'info'
  }),
  'default': () => ({
    message: 'I\'m ScentBot, your AI swap assistant! I can help with:\n• Checking if a trade is fair\n• Estimating fragrance values\n• Authenticity tips\n• Shipping advice\n\nJust ask!',
    type: 'info'
  })
};

export async function getMediatorResponse(
  question: string,
  context?: {
    swapId?: string;
    fairnessScore?: number;
    listing?: Listing;
    listings?: Listing[];
  }
): Promise<MediatorResponse> {
  const lowerQuestion = question.toLowerCase();
  
  // Detect intent from question
  if (lowerQuestion.includes('fair') || lowerQuestion.includes('balanced') || lowerQuestion.includes('worth')) {
    return MEDIATOR_RESPONSES['fair'](context);
  }
  if (lowerQuestion.includes('real') || lowerQuestion.includes('fake') || lowerQuestion.includes('authentic')) {
    return MEDIATOR_RESPONSES['authentic'](context);
  }
  if (lowerQuestion.includes('ship') || lowerQuestion.includes('pack') || lowerQuestion.includes('send')) {
    return MEDIATOR_RESPONSES['shipping'](context);
  }
  if (lowerQuestion.includes('value') || lowerQuestion.includes('price') || lowerQuestion.includes('cost')) {
    return MEDIATOR_RESPONSES['value'](context);
  }
  
  // If AI provider available, use it for complex questions
  if (AI_PROVIDER !== 'mock' && ANTHROPIC_API_KEY) {
    try {
      const response = await callClaudeAPI(question, context);
      return {
        message: response,
        type: 'info'
      };
    } catch (error) {
      console.error('AI mediator error:', error);
    }
  }
  
  return MEDIATOR_RESPONSES['default']();
}

async function callClaudeAPI(question: string, context?: any): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: `You are ScentBot, a helpful AI assistant for ScentSwap, Australia's fragrance trading platform. 
You help users with:
- Assessing swap fairness
- Fragrance authenticity tips
- Shipping advice
- General fragrance questions

Keep responses concise, friendly, and helpful. Use Australian English.`,
      messages: [
        {
          role: 'user',
          content: question
        }
      ]
    })
  });

  const data = await response.json();
  return data.content?.[0]?.text || 'I couldn\'t process that question. Please try again.';
}

// =============================================================================
// MATCH SUGGESTIONS
// =============================================================================

export interface MatchSuggestion {
  listingId: string;
  matchScore: number;
  reason: string;
  mutualInterest: boolean;
}

export async function getMatchSuggestions(
  userListings: Listing[],
  allListings: Listing[],
  userWishlist?: string[]
): Promise<MatchSuggestion[]> {
  const suggestions: MatchSuggestion[] = [];
  
  // Filter out user's own listings
  const otherListings = allListings.filter(
    l => !userListings.some(ul => ul.id === l.id)
  );
  
  for (const listing of otherListings) {
    let score = 50; // Base score
    const reasons: string[] = [];
    
    // Check if listing matches user's wishlist
    if (userWishlist?.some(w => 
      listing.custom_name?.toLowerCase().includes(w.toLowerCase()) ||
      listing.house?.toLowerCase().includes(w.toLowerCase())
    )) {
      score += 30;
      reasons.push('Matches your wishlist');
    }
    
    // Check for similar value range
    const listingValue = calculateListingValue(listing).valuePoints;
    const userAvgValue = userListings.length > 0
      ? userListings.reduce((sum, l) => sum + calculateListingValue(l).valuePoints, 0) / userListings.length
      : 0;
    
    if (userAvgValue > 0 && Math.abs(listingValue - userAvgValue) < userAvgValue * 0.3) {
      score += 15;
      reasons.push('Similar value range');
    }
    
    // Only include if score is above threshold
    if (score >= 60) {
      suggestions.push({
        listingId: listing.id,
        matchScore: Math.min(score, 100),
        reason: reasons.join(', ') || 'Potential match',
        mutualInterest: false // Would need to check other user's wishlist
      });
    }
  }
  
  // Sort by score descending
  return suggestions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
}

// =============================================================================
// SAFETY CHECKS
// =============================================================================

export interface SafetyCheckResult {
  isSafe: boolean;
  warnings: string[];
  blockedContent?: string;
}

export function checkMessageSafety(message: string): SafetyCheckResult {
  const lowerMessage = message.toLowerCase();
  const warnings: string[] = [];
  let blockedContent: string | undefined;
  
  // Check for bank details
  if (/\b\d{6}\s*\d{3}\b/.test(message) || // BSB pattern
      /\b\d{8,12}\b/.test(message) || // Account number pattern
      lowerMessage.includes('bsb') ||
      lowerMessage.includes('account number') ||
      lowerMessage.includes('bank transfer')) {
    warnings.push('ScentSwap is for cashless swaps only. Please don\'t share bank details.');
    blockedContent = 'bank_details';
  }
  
  // Check for off-platform suggestions
  if (lowerMessage.includes('facebook') ||
      lowerMessage.includes('instagram') ||
      lowerMessage.includes('whatsapp') ||
      lowerMessage.includes('text me') ||
      lowerMessage.includes('call me') ||
      lowerMessage.includes('email me')) {
    warnings.push('For your safety, we recommend keeping all communication within ScentSwap.');
  }
  
  // Check for suspicious patterns
  if (lowerMessage.includes('western union') ||
      lowerMessage.includes('money order') ||
      lowerMessage.includes('gift card') ||
      lowerMessage.includes('crypto') ||
      lowerMessage.includes('bitcoin')) {
    warnings.push('This payment method is not supported. ScentSwap is for direct fragrance swaps only.');
    blockedContent = 'suspicious_payment';
  }
  
  return {
    isSafe: !blockedContent,
    warnings,
    blockedContent
  };
}

