/**
 * OutsetaScript Component
 * 
 * Loads the Outseta script on web platforms.
 * Should be included in the root layout.
 * 
 * @see docs/OUTSETA_INTEGRATION.md
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
    Outseta: any;
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
      return;
    }

    // Set Outseta options
    window.o_options = {
      domain: OUTSETA_CONFIG.domain,
      load: 'auth,customForm,emailList,leadCapture,nocode,profile,support',
      tokenStorage: 'local', // Persist across tabs/refreshes
      monitorDom: true, // For SPA navigation
    };

    // Create and inject script
    const script = document.createElement('script');
    script.src = 'https://cdn.outseta.com/outseta.min.js';
    script.setAttribute('data-options', 'o_options');
    script.async = true;
    
    script.onload = () => {
      console.log('Outseta script loaded successfully');
      
      // Check for access_token in URL (post-login redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      
      if (accessToken && window.Outseta) {
        console.log('Access token found in URL, setting session...');
        // Outseta's nocode module should handle this automatically
        // But we can manually trigger if needed
        window.Outseta.setAccessToken(accessToken);
        
        // Clean up URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Outseta script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup not needed - script should persist
    };
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Hook to access Outseta instance
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

