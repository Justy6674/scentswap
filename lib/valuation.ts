import { Listing } from '@/types';

const USED_FACTOR = 0.90; // 10% deduction for open items

// Penalties
const PENALTY_NO_BOX = 0.05; // 5%
const PENALTY_NO_CAP = 0.05;
const PENALTY_UNKNOWN_STORAGE = 0.10;

// Rarity Multipliers
const RARITY_MULTIPLIERS = {
  'common': 1.0,
  'discontinued_recent': 1.1, // < 2 years
  'discontinued_rare': 1.25, // 2-5 years
  'vintage': 1.4, // 5+ years
};

/**
 * Calculate the fair trade value of a listing
 */
export function calculateTradeValue(listing: Listing, basePrice: number, rarity: keyof typeof RARITY_MULTIPLIERS = 'common'): { value: number; breakdown: string[] } {
  const breakdown: string[] = [];
  let multiplier = 1.0;

  // 1. Base Price (Discounted Retail)
  breakdown.push(`Base Price: $${basePrice.toFixed(2)}`);

  // 2. Remaining Volume
  const percentageRemaining = (listing.fill_percentage || 100) / 100;
  multiplier *= percentageRemaining;
  breakdown.push(`Remaining Volume: ${listing.fill_percentage}%`);

  // 3. Used Factor
  if (listing.condition !== 'New') {
    multiplier *= USED_FACTOR;
    breakdown.push(`Used Factor: 90%`);
  }

  // 4. Rarity
  const rarityMult = RARITY_MULTIPLIERS[rarity];
  if (rarityMult > 1.0) {
    multiplier *= rarityMult;
    breakdown.push(`Rarity Premium: x${rarityMult}`);
  }

  // 5. Condition Penalties
  let penalty = 0;
  if (listing.has_box === false) { // Explicitly false
    penalty += PENALTY_NO_BOX;
    breakdown.push(`Missing Box: -5%`);
  }
  if (listing.has_cap === false) {
    penalty += PENALTY_NO_CAP;
    breakdown.push(`Missing Cap: -5%`);
  }
  if (listing.storage_history === 'unknown') {
    penalty += PENALTY_UNKNOWN_STORAGE;
    breakdown.push(`Unknown Storage: -10%`);
  }

  // Apply penalties to the multiplier (additive penalty)
  multiplier -= penalty;
  
  // Ensure multiplier doesn't go below 10%
  multiplier = Math.max(0.10, multiplier);

  const finalValue = basePrice * multiplier;
  
  return {
    value: Math.round(finalValue * 100) / 100,
    breakdown
  };
}

/**
 * Calculate variance between two trade offers
 */
export function calculateVariance(offerAValue: number, offerBValue: number): { 
  diff: number; 
  isBalanced: boolean; 
  suggestion: string 
} {
  const diff = offerAValue - offerBValue;
  const absDiff = Math.abs(diff);
  
  let isBalanced = false;
  let suggestion = '';

  if (absDiff < 5) {
    isBalanced = true;
    suggestion = 'Balanced Trade';
  } else if (absDiff <= 20) {
    isBalanced = false;
    suggestion = 'Minor imbalance. Suggest adding a sample.';
  } else {
    isBalanced = false;
    suggestion = 'Significant imbalance. Requires top-up or explicit acceptance.';
  }

  return { diff, isBalanced, suggestion };
}
