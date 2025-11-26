import { useTheme } from '@/contexts/ThemeContext';

export function useColorScheme() {
    try {
        const { activeColorScheme } = useTheme();
        return activeColorScheme;
    } catch (e) {
        // Fallback if used outside provider (e.g. during initialization)
        return 'light';
    }
}
