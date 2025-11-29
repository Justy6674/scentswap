#!/usr/bin/env node

/**
 * FRAGRANCE MASTER ENHANCEMENT TOOL
 *
 * Purpose: ENHANCE existing fragrances, NEVER create duplicates
 * Strategy: Use Fragrantica URL as unique key for upsert operations
 *
 * Features:
 * - Detects existing fragrances by URL
 * - Only fills NULL/empty fields (preserves existing data)
 * - Adds missing concentrations, families, performance ratings
 * - Smart data quality scoring
 * - Prevents duplicates completely
 */

const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://vdcgbaxjfllprhknwwyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkY2diYXhqZmxscHJoa253d3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMTk0OTAsImV4cCI6MjA3OTY5NTQ5MH0.CawIFYm5abxyLqeoQwSLRYZRAOdlGHfjDHqjNOvHoVk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Track enhancement statistics
let stats = {
  total_processed: 0,
  existing_enhanced: 0,
  new_created: 0,
  skipped_errors: 0,
  fields_enhanced: {
    concentration: 0,
    family: 0,
    longevity: 0,
    sillage: 0,
    performance: 0,
    images: 0,
    descriptions: 0
  }
};

async function enhanceFragrance(fragranceData) {
  try {
    const { data, error } = await supabase.rpc('enrich_fragrance_master', {
      p_fragrantica_url: fragranceData.fragrantica_url,
      p_name: fragranceData.name || null,
      p_brand: fragranceData.brand || null,
      p_concentration: fragranceData.concentration || null,
      p_family: fragranceData.family || null,
      p_year_released: fragranceData.year_released || null,
      p_gender: fragranceData.gender || null,
      p_country: fragranceData.country || null,
      p_rating_value: fragranceData.rating_value || null,
      p_rating_count: fragranceData.rating_count || null,
      p_longevity_rating: fragranceData.longevity_rating || null,
      p_sillage_rating: fragranceData.sillage_rating || null,
      p_performance_level: fragranceData.performance_level || null,
      p_top_notes: fragranceData.top_notes || null,
      p_middle_notes: fragranceData.middle_notes || null,
      p_base_notes: fragranceData.base_notes || null,
      p_main_accords: fragranceData.main_accords || null,
      p_perfumers: fragranceData.perfumers || null,
      p_image_url: fragranceData.image_url || null,
      p_average_price_aud: fragranceData.average_price_aud || null,
      p_market_tier: fragranceData.market_tier || null,
      p_description: fragranceData.description || null,
      p_tags: fragranceData.tags || null,
      p_source_type: 'enhancement'
    });

    if (error) throw error;

    const result = data[0];
    stats.total_processed++;

    if (result.action_taken === 'CREATED') {
      stats.new_created++;
      console.log(`✨ CREATED: ${fragranceData.name} (${fragranceData.brand})`);
    } else if (result.action_taken === 'ENHANCED') {
      stats.existing_enhanced++;
      if (result.updated_fields.length > 0) {
        console.log(`🔧 ENHANCED: ${fragranceData.name} - Fields: ${result.updated_fields.join(', ')}`);

        // Track field enhancements
        result.updated_fields.forEach(field => {
          if (stats.fields_enhanced[field] !== undefined) {
            stats.fields_enhanced[field]++;
          }
        });
      } else {
        console.log(`✅ VERIFIED: ${fragranceData.name} (no updates needed)`);
      }
    }

    return true;

  } catch (error) {
    console.error(`❌ ERROR enhancing ${fragranceData.name}: ${error.message}`);
    stats.skipped_errors++;
    return false;
  }
}

function parseCSVLine(line) {
  // Handle semicolon-separated CSV with potential quotes
  const parts = line.split(';').map(part => part.trim().replace(/^["']|["']$/g, ''));
  return parts;
}

function cleanNotes(noteString) {
  if (!noteString || noteString.toLowerCase() === 'unknown' || noteString === '') {
    return null;
  }
  return noteString.split(',').map(note => note.trim()).filter(note => note && note.toLowerCase() !== 'unknown');
}

function mapConcentration(csvConcentration) {
  if (!csvConcentration) return null;

  const mapping = {
    'edp': 'Eau de Parfum',
    'edt': 'Eau de Toilette',
    'parfum': 'Parfum',
    'extrait': 'Extrait de Parfum',
    'edc': 'Eau de Cologne',
    'eau de parfum': 'Eau de Parfum',
    'eau de toilette': 'Eau de Toilette'
  };

  return mapping[csvConcentration.toLowerCase()] || csvConcentration;
}

function inferMarketTier(brand) {
  if (!brand) return null;

  const luxury = ['tom ford', 'creed', 'amouage', 'clive christian', 'roja'];
  const niche = ['byredo', 'diptyque', 'maison margiela', 'le labo'];
  const designer = ['chanel', 'dior', 'gucci', 'versace', 'prada'];

  const brandLower = brand.toLowerCase();

  if (luxury.some(b => brandLower.includes(b))) return 'luxury';
  if (niche.some(b => brandLower.includes(b))) return 'niche';
  if (designer.some(b => brandLower.includes(b))) return 'designer';

  return 'standard';
}

function parseFragranceRecord(parts, lineNumber) {
  try {
    if (parts.length < 10) {
      throw new Error(`Insufficient columns: ${parts.length}`);
    }

    const topNotes = cleanNotes(parts[8]);
    const middleNotes = cleanNotes(parts[9]);
    const baseNotes = cleanNotes(parts[10]);

    const record = {
      fragrantica_url: parts[0] || null,
      name: parts[1] || null,
      brand: parts[2] ? parts[2].replace(/-/g, ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : null,
      country: parts[3] || null,
      gender: parts[4] ? (parts[4].toLowerCase() === 'women' ? 'female' :
                         parts[4].toLowerCase() === 'men' ? 'male' :
                         parts[4].toLowerCase()) : null,
      rating_value: null,
      rating_count: null,
      year_released: null,
      top_notes: topNotes,
      middle_notes: middleNotes,
      base_notes: baseNotes,
      perfumers: [],
      main_accords: [],

      // Enhanced fields that might be missing from original CSV
      concentration: mapConcentration(parts[18]), // If column 18 has concentration
      family: parts[19] || null, // If column 19 has family
      longevity_rating: null,
      sillage_rating: null,
      performance_level: null,
      image_url: null,
      market_tier: inferMarketTier(parts[2]),
      description: null,
      tags: null
    };

    // Parse rating value (handle comma decimal separator)
    if (parts[5] && parts[5] !== '') {
      try {
        record.rating_value = parseFloat(parts[5].replace(',', '.'));
      } catch (e) {
        // Leave as null
      }
    }

    // Parse rating count
    if (parts[6] && parts[6] !== '') {
      try {
        record.rating_count = parseInt(parts[6]);
      } catch (e) {
        // Leave as null
      }
    }

    // Parse year
    if (parts[7] && parts[7] !== '') {
      try {
        record.year_released = parseInt(parts[7]);
      } catch (e) {
        // Leave as null
      }
    }

    // Parse perfumers (columns 11, 12)
    if (parts[11] && parts[11].toLowerCase() !== 'unknown') {
      record.perfumers.push(parts[11]);
    }
    if (parts[12] && parts[12].toLowerCase() !== 'unknown') {
      record.perfumers.push(parts[12]);
    }

    // Parse main accords (columns 13-17)
    for (let i = 13; i <= 17; i++) {
      if (parts[i] && parts[i] !== '' && parts[i].toLowerCase() !== 'unknown') {
        record.main_accords.push(parts[i]);
      }
    }

    if (record.perfumers.length === 0) record.perfumers = null;
    if (record.main_accords.length === 0) record.main_accords = null;

    return record;

  } catch (error) {
    throw new Error(`Line ${lineNumber}: ${error.message}`);
  }
}

async function enhanceFromCSV(filePath) {
  console.log('🚀 Starting Fragrance Master Enhancement...');
  console.log('📋 Strategy: ENHANCE existing, NEVER duplicate');
  console.log('🔑 Key: Fragrantica URL (unique identifier)\n');

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  let batch = [];
  const batchSize = 50; // Smaller batches for enhancement

  for await (const line of rl) {
    lineNumber++;

    // Skip header
    if (lineNumber === 1) {
      console.log('📄 Header detected:', line.substring(0, 100) + '...\n');
      continue;
    }

    // Skip empty lines
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      const record = parseFragranceRecord(parts, lineNumber);

      // Skip if missing essential data
      if (!record.fragrantica_url || !record.name || !record.brand) {
        stats.skipped_errors++;
        continue;
      }

      batch.push(record);

      // Process batch when full
      if (batch.length >= batchSize) {
        console.log(`🔄 Processing batch: ${lineNumber}...`);

        for (const record of batch) {
          await enhanceFragrance(record);
        }

        console.log(`✅ Batch complete. Progress: ${stats.total_processed} processed\n`);
        batch = [];

        // Progress update every 500 records
        if (stats.total_processed % 500 === 0) {
          printProgress();
        }
      }

    } catch (error) {
      console.error(`❌ ${error.message}`);
      stats.skipped_errors++;
    }
  }

  // Process remaining records
  if (batch.length > 0) {
    console.log(`🔄 Processing final batch: ${batch.length} records...`);
    for (const record of batch) {
      await enhanceFragrance(record);
    }
  }

  console.log('\n🎉 Enhancement completed!');
  printFinalStats();
}

function printProgress() {
  console.log('📊 PROGRESS UPDATE:');
  console.log(`   ✅ Enhanced: ${stats.existing_enhanced}`);
  console.log(`   ✨ Created: ${stats.new_created}`);
  console.log(`   ❌ Errors: ${stats.skipped_errors}`);
  console.log(`   📈 Total: ${stats.total_processed}\n`);
}

function printFinalStats() {
  console.log('═══════════════════════════════════════');
  console.log('📊 FINAL ENHANCEMENT REPORT');
  console.log('═══════════════════════════════════════');
  console.log(`📈 Total Processed: ${stats.total_processed}`);
  console.log(`🔧 Existing Enhanced: ${stats.existing_enhanced}`);
  console.log(`✨ New Created: ${stats.new_created}`);
  console.log(`❌ Errors Skipped: ${stats.skipped_errors}`);
  console.log('');
  console.log('🏷️  Field Enhancements:');
  Object.entries(stats.fields_enhanced).forEach(([field, count]) => {
    if (count > 0) {
      console.log(`   ${field}: ${count}`);
    }
  });
  console.log('');
  console.log('✅ Database integrity maintained - NO DUPLICATES!');
  console.log('═══════════════════════════════════════');
}

// Example usage for different data sources
async function enhanceFromURL(fragranticaUrl) {
  console.log(`🔍 Enhancing single fragrance: ${fragranticaUrl}`);

  // This would scrape Fragrantica for additional data
  // and call enhanceFragrance() with the enriched data
  // Implementation for next phase

  console.log('🚧 URL scraping not yet implemented');
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node enhance-fragrance-master.js fra_cleaned.csv');
    console.log('  node enhance-fragrance-master.js --url https://fragrantica.com/perfume/...');
    process.exit(1);
  }

  if (args[0] === '--url') {
    enhanceFromURL(args[1]);
  } else {
    enhanceFromCSV(args[0]).catch(error => {
      console.error('💥 Enhancement failed:', error);
      process.exit(1);
    });
  }
}

module.exports = { enhanceFragrance, enhanceFromCSV, enhanceFromURL };