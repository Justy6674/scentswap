/**
 * SubscriptionContext
 * 
 * Manages premium subscription state and feature gating.
 * Designed to be easily integrated with Outseta.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Premium feature flags
export type PremiumFeature = 
  | 'unlimited_listings'      // Free: 5, Premium: Unlimited
  | 'priority_matching'       // AI prioritizes premium users in suggestions
  | 'advanced_analytics'      // Detailed swap history, value tracking
  | 'instant_messaging'       // Real-time chat (vs delayed for free)
  | 'photo_verification'      // AI-powered authenticity checks
  | 'no_ads'                  // Ad-free experience
  | 'early_access'            // New features first
  | 'premium_badge'           // Special profile badge
  | 'bulk_upload'             // Upload multiple listings at once
  | 'export_data';            // Export swap history

// Subscription tiers
export type SubscriptionTier = 'free' | 'premium' | 'elite';

interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number; // AUD per month
  features: PremiumFeature[];
  maxListings: number;
  description: string;
}

// Plan definitions
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    maxListings: 5,
    features: [],
    description: 'Get started with basic swapping',
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    price: 9.99,
    maxListings: 25,
    features: [
      'unlimited_listings',
      'priority_matching',
      'photo_verification',
      'no_ads',
      'premium_badge',
    ],
    description: 'Enhanced swapping experience',
  },
  elite: {
    tier: 'elite',
    name: 'Elite',
    price: 19.99,
    maxListings: -1, // Unlimited
    features: [
      'unlimited_listings',
      'priority_matching',
      'advanced_analytics',
      'instant_messaging',
      'photo_verification',
      'no_ads',
      'early_access',
      'premium_badge',
      'bulk_upload',
      'export_data',
    ],
    description: 'The ultimate collector experience',
  },
};

interface SubscriptionState {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: Date | null;
  // Outseta integration fields (to be populated later)
  outsetaSubscriptionId?: string;
  outsetaPlanId?: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionState;
  isLoading: boolean;
  hasFeature: (feature: PremiumFeature) => boolean;
  canAddListing: (currentCount: number) => boolean;
  getMaxListings: () => number;
  getPlan: () => SubscriptionPlan;
  // Placeholder methods for Outseta integration
  upgradeToPremium: () => Promise<void>;
  upgradeToElite: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>({
    tier: 'free',
    isActive: true,
    expiresAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription({ tier: 'free', isActive: true, expiresAt: null });
      setIsLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with Outseta API call
      // For now, check if user has premium_tier field in database
      // This will be replaced with Outseta subscription check
      
      // Mock implementation - defaults to free
      // In production, this would call Outseta API:
      // const outsetaSubscription = await outseta.getSubscription(user.email);
      
      setSubscription({
        tier: 'free',
        isActive: true,
        expiresAt: null,
      });
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription({ tier: 'free', isActive: true, expiresAt: null });
    } finally {
      setIsLoading(false);
    }
  };

  const hasFeature = (feature: PremiumFeature): boolean => {
    const plan = SUBSCRIPTION_PLANS[subscription.tier];
    return plan.features.includes(feature);
  };

  const canAddListing = (currentCount: number): boolean => {
    const maxListings = getMaxListings();
    if (maxListings === -1) return true; // Unlimited
    return currentCount < maxListings;
  };

  const getMaxListings = (): number => {
    return SUBSCRIPTION_PLANS[subscription.tier].maxListings;
  };

  const getPlan = (): SubscriptionPlan => {
    return SUBSCRIPTION_PLANS[subscription.tier];
  };

  // Placeholder methods for Outseta integration
  const upgradeToPremium = async () => {
    // TODO: Implement Outseta checkout
    // window.location.href = 'https://your-outseta-domain.outseta.com/checkout/premium';
    console.log('Upgrade to Premium - Outseta integration pending');
  };

  const upgradeToElite = async () => {
    // TODO: Implement Outseta checkout
    console.log('Upgrade to Elite - Outseta integration pending');
  };

  const cancelSubscription = async () => {
    // TODO: Implement Outseta cancellation
    console.log('Cancel subscription - Outseta integration pending');
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        hasFeature,
        canAddListing,
        getMaxListings,
        getPlan,
        upgradeToPremium,
        upgradeToElite,
        cancelSubscription,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

