
import { aiService, FragranceEnhancementRequest } from '../lib/aiService';

async function testAIEnhancement() {
    console.log('Testing AI Enhancement...');

    const mockRequest: FragranceEnhancementRequest = {
        fragmentId: 'test-id',
        currentData: {
            name: 'Sauvage',
            brand: 'Dior',
            concentration: 'EDT',
            year_released: 2015,
            gender: 'male',
            family: 'Aromatic Fougere',
            top_notes: ['Bergamot', 'Pepper'],
            middle_notes: ['Sichuan Pepper', 'Lavender', 'Pink Pepper', 'Vetiver', 'Patchouli', 'Geranium', 'Elemi'],
            base_notes: ['Ambroxan', 'Cedar', 'Labdanum'],
            main_accords: ['Fresh Spicy', 'Amber', 'Citrus', 'Aromatic', 'Musky'],
            rating_value: 4.0,
            rating_count: 1000,
            average_price_aud: 150,
            market_tier: 'designer',
            performance_level: 'loud',
            data_quality_score: 80,
            verified: false
        },
        researchScope: {
            checkPricing: true,
            verifyPerfumer: true,
            enhanceNotes: true,
            updateClassification: true,
            verifyYear: true,
            checkAvailability: true
        },
        retailersToCheck: ['Chemist Warehouse', 'Myer', 'David Jones', 'Mecca', 'Libertine']
    };

    try {
        // Note: This will fail if API keys are not set in environment
        // But it verifies the code structure and types
        if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
            console.warn('No API keys found. Skipping actual API call.');
            return;
        }

        const result = await aiService.enhanceFragrance(mockRequest);
        console.log('Enhancement Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Enhancement Error:', error);
    }
}

testAIEnhancement();
