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
import { Platform } from 'react-native';
import { OUTSETA_CONFIG } from '@/contexts/SubscriptionContext';

declare global {
  interface Window {
    o_options: {
      domain: string;
      load: string;
      tokenStorage?: string;
      monitorDom?: boolean;
    };
    Outseta: {
      getUser: () => Promise<any>;
      getJwtPayload: () => Promise<any>;
      setAccessToken: (token: string) => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

export function OutsetaScript() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    // Check if already loaded
    if (window.Outseta) {
      console.log('Outseta already loaded');
      handlePostLoginToken();
      return;
    }

    // Set Outseta options - EXACT CONFIG FROM TELECHECK
    // tokenStorage: "local" is CRITICAL - without it, user completes payment but isn't logged in
    // monitorDom: "true" - scans for data-attributes on buttons (required for popup mode)
    // load: "nocode,auth,profile" - minimal set needed for subscription flow
    window.o_options = {
      domain: OUTSETA_CONFIG.domain,
      monitorDom: "true", // STRING not boolean - exactly as TeleCheck does it
      load: "nocode,auth,profile", // Minimal load - exactly as TeleCheck does it
      tokenStorage: "local", // CRITICAL: Stores JWT in localStorage after signup
    };

    // Create and inject script per documentation
    const script = document.createElement('script');
    script.src = 'https://cdn.outseta.com/outseta.min.js';
    script.setAttribute('data-options', 'o_options');
    script.async = true;
    
    script.onload = () => {
      console.log('Outseta script loaded successfully');
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
   * Per Outseta docs: "Outseta appends an access_token (JWT) in the URL query string"
   * The nocode module should handle this automatically, but we can assist
   * 
   * @see .cursor/rules/outseta.mdc Step 2
   */
  function handlePostLoginToken() {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    
    if (accessToken) {
      console.log('Access token found in URL');
      
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
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  return window.Outseta || null;
}

/**
 * Helper to check if Outseta is loaded
 */
export function isOutsetaLoaded(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }
  return typeof window.Outseta !== 'undefined';
}
