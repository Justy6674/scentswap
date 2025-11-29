/**
 * SubscriptionContext
 * 
 * Manages premium subscription state and feature gating.
 * Integrated with Outseta for authentication and billing.
 * 
 * @see docs/OUTSETA_INTEGRATION.md for full integration guide
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isAdmin as checkIsAdmin } from '@/lib/admin';

// SSR-safe platform check
const isWeb = typeof window !== 'undefined';

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
  isAdmin: boolean;
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
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize Outseta on mount (web only)
  // CRITICAL: Keep isLoading=true until auth check completes (like TeleCheck)
  useEffect(() => {
    if (isWeb && typeof window !== 'undefined') {
      // Keep loading true until we've checked for existing session
      initializeOutseta().finally(() => {
        setIsLoading(false);
      });
    } else {
      // For mobile, we'll use a different auth flow
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize Outseta using only approved methods from documentation:
   * - Outseta.getUser() - Get current user profile
   * - Outseta.getJwtPayload() - Get decoded JWT payload
   * - Outseta.setAccessToken(token) - Set access token
   * 
   * @see .cursor/rules/outseta.mdc
   */
  const initializeOutseta = async () => {
    try {
      // Wait for Outseta script to load (non-blocking for UI)
      await waitForOutseta();
      
      const Outseta = (window as any).Outseta;
      
      if (!Outseta) {
        return;
      }

      // Some browsers/nocodes store the JWT under ...settings; extract if present
      const restoredToken = extractTokenFromSettings();
      if (restoredToken && Outseta.setAccessToken) {
        Outseta.setAccessToken(restoredToken);
      }
      
      // Try to get current user using approved method: Outseta.getUser()
      // Add timeout because getUser() can hang if no session exists
      try {
        // Race between getUser() and a timeout
        const userPromise = Outseta.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        const user = await Promise.race([userPromise, timeoutPromise]);
        
        if (user) {
          // Get JWT payload using approved method: Outseta.getJwtPayload()
          const jwtPayload = await Outseta.getJwtPayload();
          handleOutsetaUser(user, jwtPayload);
        }
      } catch (e: any) {
        // No user logged in or timeout - this is expected for unauthenticated users
      }
      
      // Listen for auth changes using Outseta's event system
      // Per Outseta docs: https://go.outseta.com/support/kb/articles/6Dmw7qm4/access-user-info-client-side-with-javascript
      // The accessToken.set event receives the decoded JWT payload as a parameter
      if (Outseta.on) {
        // Per docs: Outseta.on('accessToken.set', (payload) => { ... })
        // The payload IS the decoded JWT - no need to call getJwtPayload()
        Outseta.on('accessToken.set', async (payload: any) => {
          try {
            // Get full user profile (has more data than JWT payload)
            const user = await Outseta.getUser();
            handleOutsetaUser(user, payload);
          } catch (e) {
            console.error('Error handling accessToken.set:', e);
            // Even if getUser fails, we have the JWT payload
            if (payload && payload.email) {
              handleOutsetaUser({ Email: payload.email, Uid: payload.sub }, payload);
            }
          }
        });
        
        Outseta.on('accessToken.clear', () => {
          handleLogout();
        });
      }
    } catch (error) {
      console.error('Error initializing Outseta:', error);
    }
  };

  /**
   * Wait for Outseta script to be available
   * Reduced wait time to not block for too long
   */
  const waitForOutseta = async (maxAttempts = 10): Promise<void> => {
    for (let i = 0; i < maxAttempts; i++) {
      if (typeof window !== 'undefined' && (window as any).Outseta) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    // Don't throw - just continue without Outseta
  };

  const extractTokenFromSettings = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const storageKey = `outseta.auth--${OUTSETA_CONFIG.domain}.settings`;
      const raw = window.localStorage?.getItem(storageKey) || window.sessionStorage?.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return (
        parsed?.accessToken ||
        parsed?.AccessToken ||
        parsed?.token ||
        parsed?.auth?.accessToken ||
        null
      );
    } catch (error) {
      return null;
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
    
    // Check admin status based on email
    const userEmail = user.Email || jwtPayload?.email;
    setIsAdmin(checkIsAdmin(userEmail));
  };

  // Removed syncWithSupabase function - not needed for basic auth flow

  const handleLogout = () => {
    setOutsetaUser(null);
    setSubscription({
      tier: 'free',
      isActive: true,
      expiresAt: null,
    });
    setIsAuthenticated(false);
    setIsAdmin(false);
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
  // AUTH METHODS - Using only Outseta-approved URL redirects
  // =============================================================================

  /**
   * Open sign up page - redirect to Outseta hosted registration
   * This is the Outseta-approved method per documentation
   */
  const openSignUp = () => {
    const signUpUrl = OUTSETA_CONFIG.urls.signUp;
    
    if (isWeb) {
      window.location.href = signUpUrl;
    } else {
      // Mobile - use React Native Linking
      import('react-native').then(({ Linking }) => {
        Linking.openURL(signUpUrl);
      });
    }
  };

  /**
   * Open login page - redirect to Outseta hosted login
   * This is the Outseta-approved method per documentation
   */
  const openLogin = () => {
    const loginUrl = OUTSETA_CONFIG.urls.login;
    
    if (isWeb) {
      window.location.href = loginUrl;
    } else {
      import('react-native').then(({ Linking }) => {
        Linking.openURL(loginUrl);
      });
    }
  };

  /**
   * Open profile page - redirect to Outseta hosted profile
   * This is the Outseta-approved method per documentation
   */
  const openProfile = () => {
    const profileUrl = OUTSETA_CONFIG.urls.profile;
    
    if (isWeb) {
      window.location.href = profileUrl;
    } else {
      import('react-native').then(({ Linking }) => {
        Linking.openURL(profileUrl);
      });
    }
  };

  /**
   * Logout - clear local state and redirect to clear Outseta session
   * Per Outseta docs, logging out removes the token
   */
  const logout = () => {
    // Clear local state first
    handleLogout();
    
    // Clear Outseta token if available
    if (isWeb && typeof window !== 'undefined') {
      // Clear localStorage token that Outseta uses
      try {
        localStorage.removeItem('outseta-access-token');
      } catch (e) {
        // localStorage might not be available
      }
      
      // Redirect to home page after logout
      window.location.href = '/';
    }
  };

  // =============================================================================
  // SUBSCRIPTION METHODS - Using only Outseta-approved URL redirects
  // =============================================================================

  /**
   * Upgrade to Premium - redirect to Outseta registration with Premium plan
   * URL format per Outseta docs: /auth?widgetMode=register&planUid=[planUid]#o-anonymous
   */
  const upgradeToPremium = () => {
    const upgradeUrl = `https://${OUTSETA_CONFIG.domain}/auth?widgetMode=register&planUid=${OUTSETA_CONFIG.planUids.PREMIUM}#o-anonymous`;
    
    if (isWeb) {
      window.location.href = upgradeUrl;
    } else {
      import('react-native').then(({ Linking }) => {
        Linking.openURL(upgradeUrl);
      });
    }
  };

  /**
   * Upgrade to Elite - redirect to Outseta registration with Elite plan
   */
  const upgradeToElite = () => {
    const upgradeUrl = `https://${OUTSETA_CONFIG.domain}/auth?widgetMode=register&planUid=${OUTSETA_CONFIG.planUids.ELITE}#o-anonymous`;
    
    if (isWeb) {
      window.location.href = upgradeUrl;
    } else {
      import('react-native').then(({ Linking }) => {
        Linking.openURL(upgradeUrl);
      });
    }
  };

  /**
   * Refresh subscription status using approved Outseta methods:
   * - Outseta.getUser()
   * - Outseta.getJwtPayload()
   */
  const refreshSubscription = async () => {
    if (!isWeb || typeof window === 'undefined') {
      return;
    }
    
    const Outseta = (window as any).Outseta;
    
    if (!Outseta) {
      console.log('Outseta not available for refresh');
      return;
    }
    
    try {
      // Use approved methods: getUser() and getJwtPayload()
      const user = await Outseta.getUser();
      const jwtPayload = await Outseta.getJwtPayload();
      
      if (user) {
        handleOutsetaUser(user, jwtPayload);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
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
        isAdmin,
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
