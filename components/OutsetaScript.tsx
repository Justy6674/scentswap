/**
 * OutsetaScript Component
 * 
 * Loads the Outseta script on web platforms using only approved methods.
 * Should be included in the root layout.
 * 
 * Approved Outseta methods used:
 * - Outseta.getUser() - Get current user profile
 * - Outseta.getJwtPayload() - Get decoded JWT payload
 * - Outseta.setAccessToken(token) - Set access token
 * 
 * @see docs/OUTSETA_INTEGRATION.md
 * @see .cursor/rules/outseta.mdc
 */

import { useEffect } from 'react';
import { OUTSETA_CONFIG } from '@/contexts/SubscriptionContext';

// SSR-safe platform check
const isWeb = typeof window !== 'undefined';

declare global {
  interface Window {
    o_options: {
      domain: string;
      load: string;
      tokenStorage?: string;
      monitorDom?: boolean | string;
    };
    Outseta: {
      getUser: () => Promise<any>;
      getJwtPayload: () => Promise<any>;
      getAccessToken: () => string | null;
      setAccessToken: (token: string | null) => void;
      on: (event: string, callback: (payload?: any) => void) => void;
      off: (event: string, callback: () => void) => void;
      auth?: { open: () => void };
      profile?: { open: () => void };
    };
  }
}

export function OutsetaScript() {
  useEffect(() => {
    if (!isWeb) {
      return;
    }

    // Check if already loaded
    if (window.Outseta) {
      handlePostLoginToken();
      return;
    }

    // Set Outseta options per official documentation
    // tokenStorage: "local" - CRITICAL: Persists JWT in localStorage across sessions
    // monitorDom: true - Monitors DOM for SPA navigation (React/Vue/etc)
    // load: "auth" - Minimal modules needed
    window.o_options = {
      domain: OUTSETA_CONFIG.domain,
      monitorDom: 'true', // Outseta docs recommend string "true" for SPA monitoring
      load: 'auth,customForm,emailList,leadCapture,nocode,profile,support',
      tokenStorage: 'local', // CRITICAL: Stores JWT in localStorage
    };

    // Create and inject script per documentation
    const script = document.createElement('script');
    script.src = 'https://cdn.outseta.com/outseta.min.js';
    script.setAttribute('data-options', 'o_options');
    script.async = true;
    
    script.onload = () => {
      handlePostLoginToken();
    };
    
    script.onerror = () => {
      console.error('Failed to load Outseta script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup not needed - script should persist
    };
  }, []);

  /**
   * Handle post-login redirect token
   * Per Outseta docs: "Outseta appends an access_token (JWT) in the URL"
   * The nocode module should handle this automatically, but we can assist
   * 
   * Token can be in:
   * - Query string: ?access_token=xxx
   * - Hash: #access_token=xxx
   * 
   * @see .cursor/rules/outseta.mdc Step 2
   */
  function handlePostLoginToken() {
    if (typeof window === 'undefined') return;
    
    // Check query string first
    const urlParams = new URLSearchParams(window.location.search);
    let accessToken = urlParams.get('access_token');
    
    // Also check hash (Outseta sometimes uses hash-based tokens)
    if (!accessToken && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      accessToken = hashParams.get('access_token');
    }
    
    if (accessToken) {
      // Per docs: "Outseta's nocode module will grab the token from the URL and store it"
      // The script should handle this automatically, but if Outseta is ready, we can set it
      if (window.Outseta && window.Outseta.setAccessToken) {
        // Use approved method: Outseta.setAccessToken(token)
        window.Outseta.setAccessToken(accessToken);
      }
      
      // Clean up URL per docs recommendation
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  return null; // This component doesn't render anything
}

/**
 * Hook to access Outseta instance
 * Only use approved methods: getUser(), getJwtPayload(), setAccessToken()
 */
export function useOutseta() {
  if (!isWeb) {
    return null;
  }
  return window.Outseta || null;
}

/**
 * Helper to check if Outseta is loaded
 */
export function isOutsetaLoaded(): boolean {
  if (!isWeb) {
    return false;
  }
  return typeof window.Outseta !== 'undefined';
}
