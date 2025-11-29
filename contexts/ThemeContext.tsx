import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Track hydration state
    const [isHydrated, setIsHydrated] = useState(false);
    const [theme, setThemeState] = useState<Theme>('system');
    
    // Only call useSystemColorScheme on client to avoid SSR issues
    // During SSR, this will be undefined, and we use 'dark' as default
    const systemColorScheme = useSystemColorScheme();

    useEffect(() => {
        // Mark as hydrated immediately
        setIsHydrated(true);
        loadTheme();
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
