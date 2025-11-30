import { createClient } from '@supabase/supabase-js';
import { AIServiceManager, FragranceEnhancementRequest } from '../lib/aiService';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; // Or SERVICE_ROLE_KEY for admin privileges

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const aiService = new AIServiceManager();

// Configuration
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES_MS = 2000;
const MAX_ATTEMPTS = 3;

async function processQueue() {
    console.log('Starting bulk optimization process...');

    while (true) {
        // 1. Fetch pending items
        const { data: queueItems, error } = await supabase
            .from('fragrance_optimization_queue')
            .select('*, fragrance_master(*)')
            .eq('status', 'pending')
            .limit(BATCH_SIZE);

        if (error) {
            console.error('Error fetching queue:', error);
            break;
        }

        if (!queueItems || queueItems.length === 0) {
            console.log('Queue is empty. Waiting...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
        }

        console.log(`Processing batch of ${queueItems.length} items...`);

        // 2. Process each item
        for (const item of queueItems) {
            try {
                // Update status to processing
                await supabase
                    .from('fragrance_optimization_queue')
                    .update({ status: 'processing', attempts: item.attempts + 1 })
                    .eq('id', item.id);

                const fragrance = item.fragrance_master;

                // Prepare request
                const request: FragranceEnhancementRequest = {
                    fragmentId: fragrance.id,
                    currentData: {
                        name: fragrance.name,
                        brand: fragrance.brand,
                        concentration: fragrance.concentration,
                        year_released: fragrance.year_released,
                        gender: fragrance.gender,
                        family: fragrance.family,
                        top_notes: fragrance.top_notes ? fragrance.top_notes.split(',') : [],
                        middle_notes: fragrance.middle_notes ? fragrance.middle_notes.split(',') : [],
                        base_notes: fragrance.base_notes ? fragrance.base_notes.split(',') : [],
                    },
                    researchScope: {
                        checkPricing: false,
                        verifyPerfumer: true,
                        enhanceNotes: true,
                        updateClassification: true,
                        verifyYear: true,
                        checkAvailability: false
                    },
                    retailersToCheck: [],
                    preferredModel: item.model_used || 'gpt-4o-mini'
                };

                // Call AI Service
                const result = await aiService.enhanceFragrance(request);

                if (result.confidence > 0.6) {
                    // Update fragrance_master
                    const changes = result.suggestedChanges;
                    const updateData: any = {};
                    if (changes.concentration?.suggested) updateData.concentration = changes.concentration.suggested;
                    if (changes.year_released?.suggested) updateData.year_released = changes.year_released.suggested;
                    if (changes.top_notes?.suggested) updateData.top_notes = changes.top_notes.suggested.join(', ');
                    if (changes.middle_notes?.suggested) updateData.middle_notes = changes.middle_notes.suggested.join(', ');
                    if (changes.base_notes?.suggested) updateData.base_notes = changes.base_notes.suggested.join(', ');
                    if (changes.perfumer?.suggested) updateData.perfumer = changes.perfumer.suggested;
                    if (changes.gender?.suggested) updateData.gender = changes.gender.suggested;
                    if (changes.family?.suggested) updateData.family = changes.family.suggested;
                    if (changes.main_accords?.suggested) updateData.main_accords = changes.main_accords.suggested.join(', ');

                    updateData.last_ai_review = new Date().toISOString();
                    updateData.ai_changes = Object.keys(changes).filter(key => changes[key as keyof typeof changes]?.suggested).join(', ');

                    const { error: updateError } = await supabase
                        .from('fragrance_master')
                        .update(updateData)
                        .eq('id', fragrance.id);

                    if (updateError) throw updateError;

                    // Mark as completed
                    await supabase
                        .from('fragrance_optimization_queue')
                        .update({ status: 'completed', processed_at: new Date().toISOString() })
                        .eq('id', item.id);

                    console.log(`Successfully optimized: ${fragrance.name}`);
                } else {
                    // Low confidence, mark as failed (or manual review needed)
                    await supabase
                        .from('fragrance_optimization_queue')
                        .update({ status: 'failed', last_error: 'Low confidence score' })
                        .eq('id', item.id);
                    console.log(`Low confidence for: ${fragrance.name}`);
                }

            } catch (err: any) {
                console.error(`Error processing item ${item.id}:`, err);
                await supabase
                    .from('fragrance_optimization_queue')
                    .update({
                        status: item.attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
                        last_error: err.message
                    })
                    .eq('id', item.id);
            }
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
    }
}

processQueue().catch(console.error);
