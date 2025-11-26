import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SearchFilters } from '@/lib/ai';
import { Ionicons } from '@expo/vector-icons';

type FilterDrawerProps = {
    visible: boolean;
    onClose: () => void;
    filters: SearchFilters;
    onApplyFilters: (filters: SearchFilters) => void;
    onResetFilters: () => void;
};

export function FilterDrawer({ visible, onClose, filters, onApplyFilters, onResetFilters }: FilterDrawerProps) {
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    const [localFilters, setLocalFilters] = React.useState<SearchFilters>(filters);

    React.useEffect(() => {
        setLocalFilters(filters);
    }, [filters, visible]);

    const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
        setLocalFilters((prev) => {
            const current = (prev[key] as string[]) || [];
            const exists = current.includes(value);
            const updated = exists
                ? current.filter((item) => item !== value)
                : [...current, value];
            return { ...prev, [key]: updated };
        });
    };

    const setSingleFilter = (key: keyof SearchFilters, value: string | undefined) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
    };

    const renderChip = (label: string, selected: boolean, onPress: () => void) => (
        <TouchableOpacity
            style={[
                styles.chip,
                selected && { backgroundColor: tintColor },
                { borderColor: tintColor },
            ]}
            onPress={onPress}
        >
            <ThemedText style={[styles.chipText, selected && { color: '#fff' }]}>
                {label}
            </ThemedText>
        </TouchableOpacity>
    );

    const renderSection = (title: string, content: React.ReactNode) => (
        <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
            {content}
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <ThemedText>Cancel</ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="title" style={{ fontSize: 20 }}>Filters</ThemedText>
                    <TouchableOpacity onPress={() => {
                        onApplyFilters(localFilters);
                        onClose();
                    }}>
                        <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Apply</ThemedText>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {renderSection('Gender', (
                        <View style={styles.chipContainer}>
                            {['mens', 'womens', 'unisex', 'doesnt_matter'].map((g) => (
                                renderChip(
                                    g.replace('_', ' '),
                                    localFilters.gender_marketing === g,
                                    () => setSingleFilter('gender_marketing', localFilters.gender_marketing === g ? undefined : g)
                                )
                            ))}
                        </View>
                    ))}

                    {renderSection('Market Segment', (
                        <View style={styles.chipContainer}>
                            {['designer', 'niche', 'indie', 'clone'].map((s) => (
                                renderChip(
                                    s,
                                    localFilters.segment_type === s,
                                    () => setSingleFilter('segment_type', localFilters.segment_type === s ? undefined : s)
                                )
                            ))}
                        </View>
                    ))}

                    {renderSection('Family', (
                        <View style={styles.chipContainer}>
                            {['woody', 'floral', 'fresh', 'amber', 'fruity', 'gourmand', 'spicy', 'citrus', 'aquatic'].map((f) => (
                                renderChip(
                                    f,
                                    localFilters.family === f,
                                    () => setSingleFilter('family', localFilters.family === f ? undefined : f)
                                )
                            ))}
                        </View>
                    ))}

                    {renderSection('Performance', (
                        <View style={styles.chipContainer}>
                            {['soft', 'moderate', 'loud', 'beast_mode'].map((p) => (
                                renderChip(
                                    p.replace('_', ' '),
                                    localFilters.performance_level === p,
                                    () => setSingleFilter('performance_level', localFilters.performance_level === p ? undefined : p)
                                )
                            ))}
                        </View>
                    ))}

                    {renderSection('Occasion', (
                        <View style={styles.chipContainer}>
                            {['office', 'date_night', 'clubbing', 'gym', 'casual'].map((o) => (
                                renderChip(
                                    o.replace('_', ' '),
                                    (localFilters.occasion_tags || []).includes(o),
                                    () => toggleArrayFilter('occasion_tags', o)
                                )
                            ))}
                        </View>
                    ))}

                    <TouchableOpacity style={styles.resetButton} onPress={onResetFilters}>
                        <ThemedText style={{ color: 'red' }}>Reset All Filters</ThemedText>
                    </TouchableOpacity>
                    <View style={{ height: 50 }} />
                </ScrollView>
            </ThemedView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 8,
    },
    chipText: {
        fontSize: 14,
    },
    resetButton: {
        alignItems: 'center',
        padding: 16,
        marginTop: 20,
    }
});
