import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SearchFilters } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

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
    const borderColor = useThemeColor({}, 'border');

    const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
    const [brands, setBrands] = useState<string[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters, visible]);

    useEffect(() => {
        if (visible && brands.length === 0) {
            fetchBrands();
        }
    }, [visible]);

    const fetchBrands = async () => {
        setLoadingBrands(true);
        const { data, error } = await supabase
            .from('brands_ref')
            .select('brand_name')
            .order('brand_name');

        if (data) {
            setBrands(data.map(b => b.brand_name));
        }
        setLoadingBrands(false);
    };

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
                { borderColor: selected ? tintColor : borderColor },
                selected && { backgroundColor: tintColor },
            ]}
            onPress={onPress}
        >
            <ThemedText style={[styles.chipText, selected && { color: '#000', fontWeight: 'bold' }]}>
                {label}
            </ThemedText>
        </TouchableOpacity>
    );

    const renderSection = (title: string, content: React.ReactNode) => (
        <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: tintColor }]}>{title}</ThemedText>
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
            <ThemedView style={[styles.container, { backgroundColor }]}>
                <View style={[styles.header, { borderBottomColor: borderColor }]}>
                    <TouchableOpacity onPress={onClose}>
                        <ThemedText style={{ color: textColor }}>Cancel</ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="title" style={{ fontSize: 20, fontFamily: 'serif' }}>FILTERS</ThemedText>
                    <TouchableOpacity onPress={() => {
                        onApplyFilters(localFilters);
                        onClose();
                    }}>
                        <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>APPLY</ThemedText>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 50 }}>

                    {/* Brand Filter */}
                    {renderSection('BRAND', (
                        <View style={styles.chipContainer}>
                            {loadingBrands ? (
                                <ActivityIndicator color={tintColor} />
                            ) : (
                                brands.map((brand) => (
                                    renderChip(
                                        brand,
                                        (localFilters.brand_name || []).includes(brand),
                                        () => toggleArrayFilter('brand_name', brand)
                                    )
                                ))
                            )}
                        </View>
                    ))}

                    {/* Condition Filter */}
                    {renderSection('CONDITION', (
                        <View style={styles.chipContainer}>
                            {['New', 'Like New', 'Used', 'Partial', 'Vintage'].map((c) => (
                                renderChip(
                                    c,
                                    (localFilters.condition || []).includes(c),
                                    () => toggleArrayFilter('condition', c)
                                )
                            ))}
                        </View>
                    ))}

                    {renderSection('GENDER', (
                        <View style={styles.chipContainer}>
                            {['Mens', 'Womens', 'Unisex'].map((g) => (
                                renderChip(
                                    g,
                                    localFilters.gender_marketing === g.toLowerCase(),
                                    () => setSingleFilter('gender_marketing', localFilters.gender_marketing === g.toLowerCase() ? undefined : g.toLowerCase())
                                )
                            ))}
                        </View>
                    ))}

                    {renderSection('TIER', (
                        <View style={styles.chipContainer}>
                            {['Designer', 'Niche', 'Luxury Designer', 'Ultra Niche', 'Indie'].map((s) => (
                                renderChip(
                                    s,
                                    localFilters.segment_type === s,
                                    () => setSingleFilter('segment_type', localFilters.segment_type === s ? undefined : s)
                                )
                            ))}
                        </View>
                    ))}

                    {renderSection('OLFACTORY FAMILY', (
                        <View style={styles.chipContainer}>
                            {['Woody', 'Floral', 'Fresh', 'Amber', 'Fruity', 'Gourmand', 'Spicy', 'Citrus', 'Aquatic', 'Leather', 'Chypre'].map((f) => (
                                renderChip(
                                    f,
                                    localFilters.family === f.toLowerCase(),
                                    () => setSingleFilter('family', localFilters.family === f.toLowerCase() ? undefined : f.toLowerCase())
                                )
                            ))}
                        </View>
                    ))}

                    {renderSection('PERFORMANCE', (
                        <View style={styles.chipContainer}>
                            {['Soft', 'Moderate', 'Loud', 'Beast Mode'].map((p) => (
                                renderChip(
                                    p,
                                    localFilters.performance_level === p.toLowerCase().replace(' ', '_'),
                                    () => setSingleFilter('performance_level', localFilters.performance_level === p.toLowerCase().replace(' ', '_') ? undefined : p.toLowerCase().replace(' ', '_'))
                                )
                            ))}
                        </View>
                    ))}

                    <TouchableOpacity style={styles.resetButton} onPress={onResetFilters}>
                        <ThemedText style={{ color: Colors.light.error }}>RESET ALL FILTERS</ThemedText>
                    </TouchableOpacity>
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
        paddingTop: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        marginBottom: 16,
        fontSize: 14,
        letterSpacing: 1.5,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 4, // Sharper corners for luxury feel
        borderWidth: 1,
        marginBottom: 0,
    },
    chipText: {
        fontSize: 13,
        letterSpacing: 0.5,
    },
    resetButton: {
        alignItems: 'center',
        padding: 20,
        marginTop: 10,
        marginBottom: 40,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#333',
    }
});
