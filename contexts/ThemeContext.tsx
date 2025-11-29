import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
// Only import useColorScheme on native platforms to avoid SSR issues
// On web, we'll use window.matchMedia instead
import * as SecureStore from 'expo-secure-store';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    activeColorScheme: 'light' | 'dark';
    isHydrated: boolean;
}

// SSR-safe default context - always returns 'dark' to prevent hydration mismatch
const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => {},
    activeColorScheme: 'dark',
    isHydrated: false,
});

const THEME_STORAGE_KEY = 'scentswap_theme';

// Web-safe way to get system color scheme
function getSystemColorScheme(): 'light' | 'dark' | null {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return null; // SSR
    }
    // For native, we'd use useColorScheme hook but that causes SSR issues
    // Return null and let the component handle it
    return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Track hydration state
    const [isHydrated, setIsHydrated] = useState(false);
    const [theme, setThemeState] = useState<Theme>('system');
    const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark' | null>(null);

    useEffect(() => {
        // Mark as hydrated immediately
        setIsHydrated(true);
        // Get system color scheme on client
        setSystemColorScheme(getSystemColorScheme());
        loadTheme();
        
        // Listen for system color scheme changes on web
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e: MediaQueryListEvent) => {
                setSystemColorScheme(e.matches ? 'dark' : 'light');
            };
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, []);

    async function loadTheme() {
        try {
            let storedTheme: string | null = null;
            if (Platform.OS === 'web') {
                // Only access localStorage on client
                if (typeof window !== 'undefined') {
                    storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
                }
            } else {
                storedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
            }

            if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
                setThemeState(storedTheme as Theme);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        }
    }

    const saveTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
                }
            } else {
                await SecureStore.setItemAsync(THEME_STORAGE_KEY, newTheme);
            }
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    // During SSR or before hydration, always use 'dark' for consistency
    // After hydration, use the actual theme
    const activeColorScheme: 'light' | 'dark' = !isHydrated 
        ? 'dark' 
        : theme === 'system'
            ? (systemColorScheme ?? 'dark')
            : theme;

    return (
        <ThemeContext.Provider value={{ theme, setTheme: saveTheme, activeColorScheme, isHydrated }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
