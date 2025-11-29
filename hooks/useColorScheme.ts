import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';

export function useColorScheme(): 'light' | 'dark' | null {
    // Track if we're mounted (client-side)
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    try {
        const { activeColorScheme } = useTheme();
        // Return null during SSR to signal "not yet known"
        // This allows components to render a stable loading state
        if (!isMounted) {
            return null;
        }
        return activeColorScheme;
    } catch (e) {
        // Fallback if used outside provider (e.g. during initialization)
        return isMounted ? 'dark' : null;
    }
}
