#!/usr/bin/env node

const fs = require('fs');
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

async function importCSV() {
  console.log('🚀 Starting CSV import of 24,064 fragrances...');

  try {
    // Read CSV file
    const csvContent = fs.readFileSync('./fra_cleaned.csv', 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    console.log(`📄 Found ${lines.length} total lines`);

    // Parse CSV (skip header)
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';').map(col => col.trim());
      if (cols.length >= 10 && cols[1] && cols[2]) { // Has perfume name and brand
        rows.push(cols);
      }
    }

    console.log(`✅ Parsed ${rows.length} valid fragrance rows`);

    // PHASE 1: Extract unique brands
    console.log('\n🏢 Phase 1: Processing brands...');
    const uniqueBrands = [...new Set(rows.map(cols => cols[2]))];
    console.log(`Found ${uniqueBrands.size} unique brands`);

    // Check existing brands
    const { data: existingBrands } = await supabase
      .from('brands')
      .select('id, name');

    const existingBrandMap = new Map();
    existingBrands?.forEach(b => existingBrandMap.set(b.name.toLowerCase(), b.id));

    // Create missing brands in batches
    const newBrands = uniqueBrands.filter(brand =>
      !existingBrandMap.has(brand.toLowerCase())
    );

    console.log(`Creating ${newBrands.length} new brands...`);

    if (newBrands.length > 0) {
      const brandData = newBrands.map(name => ({
        name: name.split('-').map(part =>
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join('-'),
        created_at: new Date().toISOString()
      }));

      const BATCH_SIZE = 100;
      for (let i = 0; i < brandData.length; i += BATCH_SIZE) {
        const batch = brandData.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('brands')
          .insert(batch)
          .select('id, name');

        if (error) {
          console.error('Brand batch error:', error);
          continue;
        }

        data?.forEach(b => existingBrandMap.set(b.name.toLowerCase(), b.id));
        console.log(`✅ Created brands batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(brandData.length/BATCH_SIZE)}`);
      }
    }

    // PHASE 2: Extract and create notes
    console.log('\n🌸 Phase 2: Processing notes...');
    const uniqueNotes = new Set();

    rows.forEach(cols => {
      // Top notes (col 8), Middle notes (col 9), Base notes (col 10)
      [cols[8], cols[9], cols[10]].forEach(noteStr => {
        if (noteStr) {
          noteStr.split(',')
            .map(n => n.trim())
            .filter(n => n && n.toLowerCase() !== 'unknown')
            .forEach(n => uniqueNotes.add(n));
        }
      });
    });

    console.log(`Found ${uniqueNotes.size} unique notes`);

    const { data: existingNotes } = await supabase
      .from('notes')
      .select('id, name');

    const existingNoteMap = new Map();
    existingNotes?.forEach(n => existingNoteMap.set(n.name.toLowerCase(), n.id));

    const newNotes = [...uniqueNotes].filter(note =>
      !existingNoteMap.has(note.toLowerCase())
    );

    console.log(`Creating ${newNotes.length} new notes...`);

    if (newNotes.length > 0) {
      const noteData = newNotes.map(name => ({
        name: name,
        created_at: new Date().toISOString()
      }));

      const NOTES_BATCH_SIZE = 100;
      for (let i = 0; i < noteData.length; i += NOTES_BATCH_SIZE) {
        const batch = noteData.slice(i, i + NOTES_BATCH_SIZE);
        const { data, error } = await supabase
          .from('notes')
          .insert(batch)
          .select('id, name');

        if (error) {
          console.error('Notes batch error:', error);
          continue;
        }

        data?.forEach(n => existingNoteMap.set(n.name.toLowerCase(), n.id));
        console.log(`✅ Created notes batch ${Math.floor(i/NOTES_BATCH_SIZE) + 1}/${Math.ceil(noteData.length/NOTES_BATCH_SIZE)}`);
      }
    }

    // PHASE 3: Create fragrances
    console.log('\n🧴 Phase 3: Creating fragrances...');

    const fragranceData = rows.map(cols => {
      const brandId = existingBrandMap.get(cols[2].toLowerCase());
      if (!brandId) {
        console.warn(`Skipping fragrance - no brand ID for: ${cols[2]}`);
        return null;
      }

      let gender = (cols[4] || 'unisex').toLowerCase();
      if (gender === 'women') gender = 'female';
      if (gender === 'men') gender = 'male';

      return {
        name: cols[1],
        brand_id: brandId,
        concentration: 'Eau de Parfum',
        gender: gender,
        launch_year: cols[7] ? parseInt(cols[7]) : null,
        description: `From ${cols[3] || 'Unknown country'}. Rating: ${cols[5] || 'N/A'}`,
        fragrantica_url: cols[0],
        created_at: new Date().toISOString()
      };
    }).filter(Boolean);

    console.log(`Creating ${fragranceData.length} fragrances...`);

    const createdFragrances = [];
    const FRAG_BATCH_SIZE = 100;

    for (let i = 0; i < fragranceData.length; i += FRAG_BATCH_SIZE) {
      const batch = fragranceData.slice(i, i + FRAG_BATCH_SIZE);

      const { data, error } = await supabase
        .from('fragrances')
        .insert(batch)
        .select('id, name');

      if (error) {
        console.error(`Fragrance batch ${Math.floor(i/FRAG_BATCH_SIZE) + 1} error:`, error);
        continue;
      }

      if (data) {
        createdFragrances.push(...data);
      }

      console.log(`✅ Created fragrances batch ${Math.floor(i/FRAG_BATCH_SIZE) + 1}/${Math.ceil(fragranceData.length/FRAG_BATCH_SIZE)}`);
    }

    // PHASE 4: Link fragrance notes
    console.log('\n🔗 Phase 4: Linking fragrance notes...');

    const noteRelations = [];

    for (let i = 0; i < Math.min(rows.length, createdFragrances.length); i++) {
      const cols = rows[i];
      const fragrance = createdFragrances[i];

      if (!fragrance) continue;

      // Process each note type
      [
        { notes: cols[8], type: 'top' },
        { notes: cols[9], type: 'heart' },  // middle -> heart
        { notes: cols[10], type: 'base' }
      ].forEach(({ notes, type }) => {
        if (notes) {
          notes.split(',')
            .map(n => n.trim())
            .filter(n => n && n.toLowerCase() !== 'unknown')
            .forEach(noteName => {
              const noteId = existingNoteMap.get(noteName.toLowerCase());
              if (noteId) {
                noteRelations.push({
                  fragrance_id: fragrance.id,
                  note_id: noteId,
                  note_type: type,
                  created_at: new Date().toISOString()
                });
              }
            });
        }
      });
    }

    console.log(`Creating ${noteRelations.length} note relations...`);

    const REL_BATCH_SIZE = 500;
    for (let i = 0; i < noteRelations.length; i += REL_BATCH_SIZE) {
      const batch = noteRelations.slice(i, i + REL_BATCH_SIZE);

      const { error } = await supabase
        .from('fragrance_notes')
        .insert(batch);

      if (error) {
        console.error(`Note relations batch ${Math.floor(i/REL_BATCH_SIZE) + 1} error:`, error);
        continue;
      }

      console.log(`✅ Created note relations batch ${Math.floor(i/REL_BATCH_SIZE) + 1}/${Math.ceil(noteRelations.length/REL_BATCH_SIZE)}`);
    }

    console.log('\n🎉 Import completed successfully!');
    console.log(`📊 Final counts:`);
    console.log(`   - Brands: ${existingBrandMap.size}`);
    console.log(`   - Notes: ${existingNoteMap.size}`);
    console.log(`   - Fragrances: ${createdFragrances.length}`);
    console.log(`   - Note Relations: ${noteRelations.length}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importCSV();