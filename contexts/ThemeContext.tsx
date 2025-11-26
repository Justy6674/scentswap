import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    activeColorScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'scentswap_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useSystemColorScheme();
    const [theme, setTheme] = useState<Theme>('system');

    useEffect(() => {
        loadTheme();
    }, []);

    async function loadTheme() {
        try {
            let storedTheme: string | null = null;
            if (Platform.OS === 'web') {
                storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            } else {
                storedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
            }

            if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
                setTheme(storedTheme as Theme);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        }
    }

    const saveTheme = async (newTheme: Theme) => {
        setTheme(newTheme);
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(THEME_STORAGE_KEY, newTheme);
            } else {
                await SecureStore.setItemAsync(THEME_STORAGE_KEY, newTheme);
            }
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    const activeColorScheme = theme === 'system'
        ? (systemColorScheme ?? 'light')
        : theme;

    return (
        <ThemeContext.Provider value={{ theme, setTheme: saveTheme, activeColorScheme }}>
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
