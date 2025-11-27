/**
 * SubscriptionContext
 * 
 * Manages premium subscription state and feature gating.
 * Integrated with Outseta for authentication and billing.
 * 
 * @see docs/OUTSETA_INTEGRATION.md for full integration guide
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

// =============================================================================
// OUTSETA CONFIGURATION - LIVE VALUES
// =============================================================================

export const OUTSETA_CONFIG = {
  domain: 'scentswap.outseta.com',
  jwksUrl: 'https://scentswap.outseta.com/.well-known/jwks',
  
  // Plan UIDs from Outseta
  planUids: {
    FREE: 'z9MP7yQ4',
    PREMIUM: 'vW5RoJm4',
    ELITE: 'aWxr2rQV',
  },
  
  // Auth URLs
  urls: {
    signUp: 'https://scentswap.outseta.com/auth?widgetMode=register#o-anonymous',
    login: 'https://scentswap.outseta.com/auth?widgetMode=login#o-anonymous',
    profile: 'https://scentswap.outseta.com/profile#o-authenticated',
  },
  
  // Post-login redirect (set this in Outseta admin)
  postLoginUrl: 'https://www.scentswap.com.au/auth/callback',
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Premium feature flags
export type PremiumFeature = 
  | 'unlimited_listings'      // Free: 5, Premium: 25, Elite: Unlimited
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
  outsetaPlanUid: string;
  name: string;
  price: number; // AUD per month
  features: PremiumFeature[];
  maxListings: number;
  description: string;
}

// =============================================================================
// PLAN DEFINITIONS
// =============================================================================

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    outsetaPlanUid: OUTSETA_CONFIG.planUids.FREE,
    name: 'Free',
    price: 0,
    maxListings: 5,
    features: [],
    description: 'Get started with basic swapping',
  },
  premium: {
    tier: 'premium',
    outsetaPlanUid: OUTSETA_CONFIG.planUids.PREMIUM,
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
    outsetaPlanUid: OUTSETA_CONFIG.planUids.ELITE,
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

// Helper to get tier from Outseta plan UID
export function getTierFromPlanUid(planUid: string): SubscriptionTier {
  switch (planUid) {
    case OUTSETA_CONFIG.planUids.ELITE:
      return 'elite';
    case OUTSETA_CONFIG.planUids.PREMIUM:
      return 'premium';
    case OUTSETA_CONFIG.planUids.FREE:
    default:
      return 'free';
  }
}

// =============================================================================
// OUTSETA STATE INTERFACE
// =============================================================================

interface OutsetaUser {
  personUid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  accountUid: string;
  planUid: string;
  clientIdentifier?: string; // Our Supabase user ID
}

interface SubscriptionState {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: Date | null;
  // Outseta integration fields
  outsetaPersonUid?: string;
  outsetaAccountUid?: string;
  outsetaPlanUid?: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionState;
  outsetaUser: OutsetaUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasFeature: (feature: PremiumFeature) => boolean;
  canAddListing: (currentCount: number) => boolean;
  getMaxListings: () => number;
  getPlan: () => SubscriptionPlan;
  // Outseta auth methods
  openSignUp: () => void;
  openLogin: () => void;
  openProfile: () => void;
  logout: () => void;
  // Subscription methods
  upgradeToPremium: () => void;
  upgradeToElite: () => void;
  refreshSubscription: () => Promise<void>;
}

// =============================================================================
// CONTEXT
// =============================================================================

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    tier: 'free',
    isActive: true,
    expiresAt: null,
  });
  const [outsetaUser, setOutsetaUser] = useState<OutsetaUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize Outseta on mount (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      initializeOutseta();
    } else {
      // For mobile, we'll use a different auth flow
      setIsLoading(false);
    }
  }, []);

  const initializeOutseta = async () => {
    setIsLoading(true);
    
    try {
      // Check if Outseta script is loaded
      if (typeof (window as any).Outseta !== 'undefined') {
        const Outseta = (window as any).Outseta;
        
        // Try to get current user
        try {
          const user = await Outseta.getUser();
          if (user) {
            const jwtPayload = await Outseta.getJwtPayload();
            handleOutsetaUser(user, jwtPayload);
          }
        } catch (e) {
          // No user logged in
          console.log('No Outseta user session');
        }
        
        // Listen for auth changes
        Outseta.on('accessToken.set', async () => {
          const user = await Outseta.getUser();
          const jwtPayload = await Outseta.getJwtPayload();
          handleOutsetaUser(user, jwtPayload);
        });
        
        Outseta.on('accessToken.clear', () => {
          handleLogout();
        });
      } else {
        console.log('Outseta script not loaded yet');
      }
    } catch (error) {
      console.error('Error initializing Outseta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOutsetaUser = (user: any, jwtPayload: any) => {
    const planUid = jwtPayload?.['outseta:planUid'] || OUTSETA_CONFIG.planUids.FREE;
    const tier = getTierFromPlanUid(planUid);
    
    setOutsetaUser({
      personUid: user.Uid || jwtPayload?.sub,
      email: user.Email || jwtPayload?.email,
      firstName: user.FirstName,
      lastName: user.LastName,
      accountUid: jwtPayload?.['outseta:accountUid'],
      planUid: planUid,
      clientIdentifier: jwtPayload?.['outseta:accountClientIdentifier'],
    });
    
    setSubscription({
      tier,
      isActive: true,
      expiresAt: null,
      outsetaPersonUid: user.Uid || jwtPayload?.sub,
      outsetaAccountUid: jwtPayload?.['outseta:accountUid'],
      outsetaPlanUid: planUid,
    });
    
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setOutsetaUser(null);
    setSubscription({
      tier: 'free',
      isActive: true,
      expiresAt: null,
    });
    setIsAuthenticated(false);
  };

  // =============================================================================
  // FEATURE CHECKING
  // =============================================================================

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

  // =============================================================================
  // AUTH METHODS
  // =============================================================================

  const openSignUp = () => {
    if (Platform.OS === 'web') {
      window.location.href = OUTSETA_CONFIG.urls.signUp;
    } else {
      // For mobile, open in browser or webview
      console.log('Mobile sign up - implement with Linking or WebView');
    }
  };

  const openLogin = () => {
    if (Platform.OS === 'web') {
      window.location.href = OUTSETA_CONFIG.urls.login;
    } else {
      console.log('Mobile login - implement with Linking or WebView');
    }
  };

  const openProfile = () => {
    if (Platform.OS === 'web') {
      window.location.href = OUTSETA_CONFIG.urls.profile;
    } else {
      console.log('Mobile profile - implement with Linking or WebView');
    }
  };

  const logout = () => {
    if (Platform.OS === 'web' && typeof (window as any).Outseta !== 'undefined') {
      (window as any).Outseta.auth.logout();
    }
    handleLogout();
  };

  // =============================================================================
  // SUBSCRIPTION METHODS
  // =============================================================================

  const upgradeToPremium = () => {
    // Redirect to Outseta checkout with Premium plan
    if (Platform.OS === 'web') {
      // Outseta will handle the upgrade flow
      window.location.href = `https://${OUTSETA_CONFIG.domain}/auth?widgetMode=register&planUid=${OUTSETA_CONFIG.planUids.PREMIUM}#o-anonymous`;
    }
  };

  const upgradeToElite = () => {
    if (Platform.OS === 'web') {
      window.location.href = `https://${OUTSETA_CONFIG.domain}/auth?widgetMode=register&planUid=${OUTSETA_CONFIG.planUids.ELITE}#o-anonymous`;
    }
  };

  const refreshSubscription = async () => {
    if (Platform.OS === 'web' && typeof (window as any).Outseta !== 'undefined') {
      const Outseta = (window as any).Outseta;
      try {
        const user = await Outseta.getUser();
        const jwtPayload = await Outseta.getJwtPayload();
        if (user) {
          handleOutsetaUser(user, jwtPayload);
        }
      } catch (error) {
        console.error('Error refreshing subscription:', error);
      }
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        outsetaUser,
        isLoading,
        isAuthenticated,
        hasFeature,
        canAddListing,
        getMaxListings,
        getPlan,
        openSignUp,
        openLogin,
        openProfile,
        logout,
        upgradeToPremium,
        upgradeToElite,
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
