import { useEffect, useState } from 'react';

/**
 * Web-specific implementation that avoids react-native's useColorScheme
 * which causes SSR issues with "Cannot access before initialization"
 */
export function useColorScheme(): 'light' | 'dark' {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
    
    // Get initial system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorScheme(isDark ? 'dark' : 'light');
      
      // Listen for changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        setColorScheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Return 'dark' during SSR for consistency
  if (!hasHydrated) {
    return 'dark';
  }

  return colorScheme;
}
