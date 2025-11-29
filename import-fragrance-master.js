#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, continue without it
}

// Supabase configuration - Load from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseCSVLine(line) {
  // Simple semicolon split - handle quoted fields if needed
  const parts = line.split(';').map(part => part.trim());
  return parts;
}

function cleanNotes(noteString) {
  if (!noteString || noteString.toLowerCase() === 'unknown' || noteString === '') {
    return [];
  }
  return noteString.split(',').map(note => note.trim()).filter(note => note && note.toLowerCase() !== 'unknown');
}

function parseFragranceRecord(parts, lineNumber) {
  try {
    if (parts.length < 10) {
      throw new Error(`Insufficient columns: ${parts.length}`);
    }

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
      top_notes: cleanNotes(parts[8]),
      middle_notes: cleanNotes(parts[9]),
      base_notes: cleanNotes(parts[10]),
      perfumers: [],
      main_accords: [],
      source_type: 'csv_import',
      data_quality_score: 75
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

    // Combine all notes
    record.all_notes = [...record.top_notes, ...record.middle_notes, ...record.base_notes];

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

    return record;

  } catch (error) {
    throw new Error(`Line ${lineNumber}: ${error.message}`);
  }
}

async function importBatch(records) {
  const { data, error } = await supabase
    .from('fragrance_master')
    .upsert(records, {
      onConflict: 'fragrantica_url',
      ignoreDuplicates: false
    });

  if (error) {
    throw error;
  }

  return data;
}

async function importCSV() {
  console.log('🚀 Starting CSV import to fragrance_master table...');

  const fileStream = fs.createReadStream('./fra_cleaned.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  let batch = [];
  const batchSize = 100;
  let totalProcessed = 0;
  let totalErrors = 0;
  const errors = [];

  for await (const line of rl) {
    lineNumber++;

    // Skip header
    if (lineNumber === 1) {
      console.log('📄 Header:', line.substring(0, 100) + '...');
      continue;
    }

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    try {
      const parts = parseCSVLine(line);
      const record = parseFragranceRecord(parts, lineNumber);

      // Skip if missing essential data
      if (!record.name || !record.brand || !record.fragrantica_url) {
        totalErrors++;
        errors.push(`Line ${lineNumber}: Missing essential data (name/brand/url)`);
        continue;
      }

      batch.push(record);

      // Process batch when full
      if (batch.length >= batchSize) {
        try {
          await importBatch(batch);
          totalProcessed += batch.length;
          console.log(`✅ Imported batch: ${totalProcessed} fragrances processed`);
        } catch (error) {
          totalErrors += batch.length;
          errors.push(`Batch at line ${lineNumber}: ${error.message}`);
          console.error(`❌ Batch error at line ${lineNumber}:`, error.message);
        }
        batch = [];
      }

    } catch (error) {
      totalErrors++;
      errors.push(error.message);
      console.error(`❌ ${error.message}`);
    }
  }

  // Process remaining records
  if (batch.length > 0) {
    try {
      await importBatch(batch);
      totalProcessed += batch.length;
      console.log(`✅ Final batch: ${totalProcessed} fragrances processed`);
    } catch (error) {
      totalErrors += batch.length;
      errors.push(`Final batch: ${error.message}`);
      console.error(`❌ Final batch error:`, error.message);
    }
  }

  console.log('\n🎉 Import completed!');
  console.log(`📊 Summary:`);
  console.log(`   ✅ Successfully imported: ${totalProcessed} fragrances`);
  console.log(`   ❌ Errors: ${totalErrors}`);

  if (errors.length > 0 && errors.length < 20) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(error => console.log(`   - ${error}`));
  }

  // Verify the import
  const { count, error: countError } = await supabase
    .from('fragrance_master')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`\n📈 Total records in fragrance_master: ${count}`);
  }
}

// Run the import
importCSV().catch(error => {
  console.error('💥 Import failed:', error);
  process.exit(1);
});