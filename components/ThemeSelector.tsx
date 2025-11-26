import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const tintColor = useThemeColor({}, 'tint');
    const borderColor = useThemeColor({}, 'border');

    const options = [
        { value: 'light', label: 'Light', icon: 'sunny-outline' },
        { value: 'dark', label: 'Dark', icon: 'moon-outline' },
        { value: 'system', label: 'System', icon: 'settings-outline' },
    ] as const;

    return (
        <View style={styles.container}>
            <ThemedText style={styles.label}>Appearance</ThemedText>
            <View style={[styles.selector, { borderColor }]}>
                {options.map((option) => {
                    const isActive = theme === option.value;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.option,
                                isActive && { backgroundColor: tintColor },
                            ]}
                            onPress={() => setTheme(option.value)}
                        >
                            <Ionicons
                                name={option.icon}
                                size={18}
                                color={isActive ? '#FFF' : '#666'}
                            />
                            <ThemedText
                                style={[
                                    styles.optionText,
                                    isActive && { color: '#FFF', fontWeight: '600' }
                                ]}
                            >
                                {option.label}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    label: {
        marginBottom: 8,
        fontSize: 14,
        opacity: 0.7,
    },
    selector: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    option: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    optionText: {
        fontSize: 14,
    },
});
