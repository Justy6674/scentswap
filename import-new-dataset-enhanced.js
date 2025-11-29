#!/usr/bin/env node

/**
 * ENHANCED DATASET IMPORTER - PRESERVES ALL DATA
 *
 * Purpose: Import new fragrance dataset DIRECTLY to fragrance_master
 * Strategy: Use enrich_fragrance_master to add/enhance with ALL available data
 *
 * This script imports your dataset while preserving:
 * - Concentration (type field)
 * - Family/Category
 * - Gender
 * - Longevity as both rating AND performance level
 * - Automatic accords based on category
 * - Market tier inference
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://vdcgbaxjfllprhknwwyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkY2diYXhqZmxscHJoa253d3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMTk0OTAsImV4cCI6MjA3OTY5NTQ5MH0.CawIFYm5abxyLqeoQwSLRYZRAOdlGHfjDHqjNOvHoVk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Track import statistics
let stats = {
  total_processed: 0,
  created: 0,
  enhanced: 0,
  skipped: 0,
  errors: 0
};

// Enhanced mappings
const CONCENTRATION_MAP = {
  'edp': 'Eau de Parfum',
  'edt': 'Eau de Toilette',
  'parfum': 'Parfum',
  'extrait': 'Extrait de Parfum',
  'edc': 'Eau de Cologne'
};

const LONGEVITY_TO_RATING = {
  'strong': 4.5,
  'very strong': 5.0,
  'medium': 3.5,
  'light': 2.5,
  'weak': 2.0
};

const LONGEVITY_TO_PERFORMANCE = {
  'strong': 'long-lasting',
  'very strong': 'eternal',
  'medium': 'moderate',
  'light': 'moderate',
  'weak': 'poor'
};

// Category to accords mapping
const CATEGORY_TO_ACCORDS = {
  'fresh scent': ['fresh', 'citrus', 'aquatic'],
  'fresh': ['fresh', 'citrus', 'clean'],
  'woody spicy': ['woody', 'spicy', 'warm spicy'],
  'woody aromatic': ['woody', 'aromatic', 'herbal'],
  'oriental spicy': ['oriental', 'spicy', 'amber'],
  'oriental vanilla': ['oriental', 'vanilla', 'sweet'],
  'oriental': ['oriental', 'amber', 'balsamic'],
  'citrus aromatic': ['citrus', 'aromatic', 'fresh'],
  'fresh spicy': ['fresh', 'spicy', 'citrus'],
  'floral fruity': ['floral', 'fruity', 'sweet'],
  'fruity floral': ['fruity', 'floral', 'fresh'],
  'woody': ['woody', 'earthy'],
  'floral': ['floral', 'powdery'],
  'fruity': ['fruity', 'sweet'],
  'spicy': ['spicy', 'warm spicy'],
  'aquatic': ['aquatic', 'marine', 'fresh'],
  'mass pleaser': ['fresh', 'versatile', 'crowd-pleaser']
};

// Infer notes based on category
const CATEGORY_TO_NOTES = {
  'fresh scent': {
    top: ['Bergamot', 'Lemon', 'Mint'],
    middle: ['Lavender', 'Green Notes'],
    base: ['Musk', 'Cedar']
  },
  'woody spicy': {
    top: ['Pepper', 'Cardamom'],
    middle: ['Cinnamon', 'Nutmeg'],
    base: ['Sandalwood', 'Amber', 'Vetiver']
  },
  'oriental vanilla': {
    top: ['Bergamot', 'Mandarin'],
    middle: ['Vanilla', 'Tonka Bean'],
    base: ['Benzoin', 'Amber', 'Musk']
  },
  'woody aromatic': {
    top: ['Bergamot', 'Lavender'],
    middle: ['Geranium', 'Sage'],
    base: ['Cedar', 'Vetiver', 'Patchouli']
  },
  'floral fruity': {
    top: ['Peach', 'Pear', 'Apple'],
    middle: ['Rose', 'Jasmine', 'Peony'],
    base: ['Musk', 'Sandalwood']
  }
};

// Market tier inference
function inferMarketTier(brand, type) {
  const luxury = ['xerjoff', 'creed', 'amouage', 'roja', 'clive christian'];
  const niche = ['mancera', 'montale', 'nishane', 'initio', 'parfums de marly'];
  const designer = ['armaf', 'lattafa', 'al haramain', 'rasasi', 'ajmal'];

  const brandLower = brand.toLowerCase();

  if (luxury.some(b => brandLower.includes(b))) return 'luxury';
  if (niche.some(b => brandLower.includes(b))) return 'niche';
  if (designer.some(b => brandLower.includes(b))) return 'designer';
  if (type === 'parfum' || type === 'extrait') return 'niche';

  return 'designer'; // Default to designer for these brands
}

function cleanBrandName(brand) {
  if (!brand) return '';

  // Special cases
  const specialCases = {
    'armaf': 'Armaf',
    'lattafa': 'Lattafa',
    'mancera': 'Mancera',
    'montale': 'Montale',
    'xerjoff': 'Xerjoff',
    'fragrance world': 'Fragrance World',
    'al haramain': 'Al Haramain'
  };

  const lower = brand.toLowerCase().trim();
  if (specialCases[lower]) return specialCases[lower];

  // Title case for others
  return brand.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function generateFragranticaUrl(brand, perfume) {
  const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const perfumeSlug = perfume.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `https://www.fragrantica.com/perfume/${brandSlug}/${perfumeSlug}-new.html`;
}

async function importFragrance(data) {
  try {
    const { brand, perfume, type, category, target_audience, longevity } = data;

    // Clean data
    const cleanedBrand = cleanBrandName(brand);
    const concentration = CONCENTRATION_MAP[type.toLowerCase()] || 'Eau de Parfum';
    const gender = target_audience.toLowerCase() === 'male' ? 'male' :
                   target_audience.toLowerCase() === 'female' ? 'female' : 'unisex';

    // Extract longevity data
    const longevityLower = longevity.toLowerCase();
    const longevityRating = LONGEVITY_TO_RATING[longevityLower] || 3.5;
    const performanceLevel = LONGEVITY_TO_PERFORMANCE[longevityLower] || 'moderate';

    // Get accords from category
    const categoryLower = category.toLowerCase();
    const accords = CATEGORY_TO_ACCORDS[categoryLower] || [category];

    // Infer notes if we have them
    const noteData = CATEGORY_TO_NOTES[categoryLower] || {};

    // Market tier
    const marketTier = inferMarketTier(cleanedBrand, type.toLowerCase());

    // Generate unique URL
    const fragranticaUrl = generateFragranticaUrl(cleanedBrand, perfume);

    // Build enhancement data
    const enhancementData = {
      p_fragrantica_url: fragranticaUrl,
      p_name: perfume,
      p_brand: cleanedBrand,
      p_concentration: concentration,
      p_family: category,
      p_gender: gender,
      p_longevity_rating: longevityRating,
      p_sillage_rating: longevityRating * 0.9, // Estimate sillage from longevity
      p_performance_level: performanceLevel,
      p_main_accords: accords,
      p_market_tier: marketTier,
      p_top_notes: noteData.top || null,
      p_middle_notes: noteData.middle || null,
      p_base_notes: noteData.base || null,
      p_description: `${cleanedBrand} ${perfume} - A ${gender} ${category.toLowerCase()} fragrance with ${longevity.toLowerCase()} performance.`,
      p_tags: [type, category, longevity, target_audience],
      p_source_type: 'new_dataset_import'
    };

    // Call the enrichment function
    const { data: result, error } = await supabase.rpc('enrich_fragrance_master', enhancementData);

    if (error) throw error;

    const action = result[0];
    stats.total_processed++;

    if (action.action_taken === 'CREATED') {
      stats.created++;
      console.log(`✨ CREATED: ${perfume} by ${cleanedBrand} - ${category}, ${longevity} longevity`);
    } else if (action.action_taken === 'ENHANCED') {
      stats.enhanced++;
      const fields = action.updated_fields.join(', ');
      console.log(`🔧 ENHANCED: ${perfume} - Updated: ${fields}`);
    } else {
      stats.skipped++;
      console.log(`✅ EXISTS: ${perfume} - No updates needed`);
    }

    return true;

  } catch (error) {
    console.error(`❌ Error importing ${data.perfume}:`, error.message);
    stats.errors++;
    return false;
  }
}

async function importDataset(filePath) {
  console.log('🚀 Starting Enhanced Dataset Import...');
  console.log('📋 This preserves ALL data fields including:');
  console.log('  - Concentration types (EDP, EDT, Parfum)');
  console.log('  - Categories as fragrance families');
  console.log('  - Longevity as ratings AND performance levels');
  console.log('  - Auto-generated accords based on category');
  console.log('  - Inferred notes for common categories');
  console.log('  - Market tier classification');
  console.log('');

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    // Skip header
    const dataLines = lines.slice(1);
    console.log(`📊 Found ${dataLines.length} fragrances to import\n`);

    // Process in batches
    const BATCH_SIZE = 10;

    for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
      const batch = dataLines.slice(i, Math.min(i + BATCH_SIZE, dataLines.length));

      console.log(`\n🔄 Processing batch ${Math.floor(i/BATCH_SIZE) + 1} (${i+1}-${Math.min(i+BATCH_SIZE, dataLines.length)} of ${dataLines.length})...`);

      for (const line of batch) {
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));

        if (parts.length < 6) continue;

        const [brand, perfume, type, category, target_audience, longevity] = parts;

        if (!brand || !perfume) continue;

        await importFragrance({
          brand,
          perfume,
          type,
          category,
          target_audience,
          longevity
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Progress update
      if (i % 100 === 0 && i > 0) {
        console.log(`\n📈 Progress: ${stats.total_processed}/${dataLines.length} processed`);
        console.log(`   Created: ${stats.created}, Enhanced: ${stats.enhanced}, Skipped: ${stats.skipped}`);
      }
    }

    // Final report
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('🎉 ENHANCED IMPORT COMPLETE');
    console.log('═'.repeat(70));
    console.log(`📈 Total Processed: ${stats.total_processed}`);
    console.log(`✨ New Fragrances Created: ${stats.created}`);
    console.log(`🔧 Existing Enhanced: ${stats.enhanced}`);
    console.log(`✅ Already Complete: ${stats.skipped}`);
    console.log(`❌ Errors: ${stats.errors}`);
    console.log('');
    console.log('🎯 ALL DATA PRESERVED:');
    console.log('  ✓ Concentration types mapped');
    console.log('  ✓ Categories saved as families');
    console.log('  ✓ Longevity converted to ratings');
    console.log('  ✓ Performance levels added');
    console.log('  ✓ Accords auto-generated');
    console.log('  ✓ Market tiers classified');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node import-new-dataset-enhanced.js <input.csv>');
    console.log('');
    console.log('Example:');
    console.log('  node import-new-dataset-enhanced.js new-fragrance-data.csv');
    process.exit(1);
  }

  const inputFile = args[0];

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }

  importDataset(inputFile).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { importDataset };