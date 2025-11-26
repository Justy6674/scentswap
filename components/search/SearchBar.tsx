import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';

type SearchBarProps = {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit: () => void;
    isVibeMode: boolean;
    onVibeToggle: () => void;
    onFilterPress: () => void;
    activeFilterCount: number;
};

export function SearchBar({
    value,
    onChangeText,
    onSubmit,
    isVibeMode,
    onVibeToggle,
    onFilterPress,
    activeFilterCount,
}: SearchBarProps) {
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const placeholderColor = useThemeColor({}, 'tabIconDefault');
    const tintColor = useThemeColor({}, 'tint');
    const cardColor = useThemeColor({}, 'card');

    return (
        <View style={[styles.container, { backgroundColor: cardColor }]}>
            <View style={styles.inputContainer}>
                <Ionicons
                    name={isVibeMode ? "sparkles" : "search"}
                    size={20}
                    color={isVibeMode ? tintColor : placeholderColor}
                    style={styles.icon}
                />
                <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={isVibeMode ? "Tell us your vibe (e.g. loud woody clubbing)..." : "Search fragrances..."}
                    placeholderTextColor={placeholderColor}
                    onSubmitEditing={onSubmit}
                    returnKeyType="search"
                />
                {value.length > 0 && (
                    <TouchableOpacity onPress={() => onChangeText('')}>
                        <Ionicons name="close-circle" size={20} color={placeholderColor} />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={[styles.iconButton, isVibeMode && { backgroundColor: tintColor + '20' }]}
                onPress={onVibeToggle}
            >
                <Ionicons
                    name="sparkles-outline"
                    size={24}
                    color={isVibeMode ? tintColor : textColor}
                />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={onFilterPress}>
                <Ionicons name="options-outline" size={24} color={textColor} />
                {activeFilterCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: tintColor }]}>
                        <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
    },
    iconButton: {
        padding: 4,
        position: 'relative',
        borderRadius: 8,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
