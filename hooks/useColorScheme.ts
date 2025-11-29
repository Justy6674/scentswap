import { useTheme } from '@/contexts/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
    // ThemeContext now handles SSR safety - always returns 'dark' during SSR
    const { activeColorScheme } = useTheme();
    return activeColorScheme;
}
