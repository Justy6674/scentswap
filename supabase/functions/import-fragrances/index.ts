import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Papa from 'https://esm.sh/papaparse@5.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get File from Request (assume direct text body or JSON with fileKey)
    // For simplicity, let's accept raw text body up to 10MB (Deno limit) or JSON with storage key
    let csvText = '';
    
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
        const { fileKey, text } = await req.json();
        if (text) {
            csvText = text;
        } else if (fileKey) {
            // Download from storage
            const { data, error } = await supabase.storage
                .from('admin-imports')
                .download(fileKey);
            if (error) throw error;
            csvText = await data.text();
        }
    } else {
        csvText = await req.text();
    }

    if (!csvText) throw new Error('No CSV data provided');

    // 2. Parse CSV
    // Using PapaParse for reliability
    const parseResult = Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        delimiter: ";", // As per user format
    });

    const rows = parseResult.data as string[][];
    console.log(`Parsed ${rows.length} rows`);

    // 3. Phase 1: Extract Unique Entities
    const brands = new Set<string>();
    const notes = new Set<string>();
    const perfumers = new Set<string>();
    
    const processedRows = [];

    for (const row of rows) {
        // Format: url;Perfume;Brand;Country;...
        // Index: 0=url, 1=Name, 2=Brand, 3=Country, 7=Year, 8=Top, 9=Mid, 10=Base, 11-12=Perfumers, 13-17=Accords
        
        if (row.length < 3) continue;
        if (row[1]?.toLowerCase() === 'perfume' && row[2]?.toLowerCase() === 'brand') continue; // Header

        const brandName = row[2]?.trim();
        if (brandName) brands.add(brandName);

        // Extract Notes
        [row[8], row[9], row[10]].forEach(section => {
            if (!section) return;
            section.split(',').forEach(n => {
                const trimmed = n.trim();
                if (trimmed && trimmed.toLowerCase() !== 'unknown') notes.add(trimmed);
            });
        });

        // Extract Perfumers
        [row[11], row[12]].forEach(p => {
            if (p && p.trim().toLowerCase() !== 'unknown') perfumers.add(p.trim());
        });

        processedRows.push({
            original: row,
            brandName
        });
    }

    // 4. Phase 2: Bulk Sync References
    // Helper to upsert and return map
    const syncEntities = async (table: string, names: Set<string>) => {
        if (names.size === 0) return new Map();
        const nameArray = Array.from(names);
        const map = new Map<string, string>(); // name -> id

        // Chunking reads (Supabase limit ~1000 in filter)
        const READ_CHUNK = 500;
        for (let i = 0; i < nameArray.length; i += READ_CHUNK) {
            const chunk = nameArray.slice(i, i + READ_CHUNK);
            const { data } = await supabase.from(table).select('id, name').in('name', chunk);
            data?.forEach(d => map.set(d.name.toLowerCase(), d.id));
        }

        // Find missing
        const missing = nameArray.filter(n => !map.has(n.toLowerCase()));
        
        // Bulk Insert missing
        if (missing.length > 0) {
            // Insert in chunks
            for (let i = 0; i < missing.length; i += READ_CHUNK) {
                const insertChunk = missing.slice(i, i + READ_CHUNK).map(n => ({ name: n }));
                const { data, error } = await supabase.from(table).insert(insertChunk).select('id, name');
                if (error) throw error;
                data?.forEach(d => map.set(d.name.toLowerCase(), d.id));
            }
        }
        return map;
    };

    const [brandMap, noteMap, perfumerMap] = await Promise.all([
        syncEntities('brands', brands), // Note: brands creates might fail if country missing, but schema says nullable
        syncEntities('notes', notes),
        syncEntities('perfumers', perfumers)
    ]);

    // 5. Phase 3: Bulk Insert Fragrances
    const FRAG_BATCH_SIZE = 100; // Conservative for Edge Functions
    let successCount = 0;

    for (let i = 0; i < processedRows.length; i += FRAG_BATCH_SIZE) {
        const batch = processedRows.slice(i, i + FRAG_BATCH_SIZE);
        const fragInserts = [];
        
        for (const item of batch) {
            const row = item.original;
            const brandId = brandMap.get(item.brandName.toLowerCase());
            if (!brandId) continue;

            const gender = row[4]?.toLowerCase().includes('women') ? 'female' : 
                           row[4]?.toLowerCase().includes('men') ? 'male' : 'unisex';
            const year = parseInt(row[7]);

            fragInserts.push({
                name: row[1]?.trim(),
                brand_id: brandId,
                concentration: 'edp', // Default
                gender,
                launch_year: isNaN(year) ? null : year,
                description: `Imported. URL: ${row[0]}`,
                image_url: '',
                fragrantica_url: row[0],
                // accords: row.slice(13, 18).filter(a => a) // If column exists
            });
        }

        if (fragInserts.length === 0) continue;

        const { data: createdFrags, error: fragError } = await supabase
            .from('fragrances')
            .insert(fragInserts)
            .select('id, name, brand_id'); // Need these to map back

        if (fragError) {
            console.error('Fragrance Batch Error:', fragError);
            continue;
        }

        // 6. Phase 4: Link Relations (InMemory Map for this batch)
        const relationInsertsNotes = [];
        const relationInsertsPerfumers = [];

        for (let j = 0; j < createdFrags.length; j++) {
            const frag = createdFrags[j];
            // Match back to original row by name/brand (simplified)
            // In strict implementation we would use a Map or index alignment
            // Assuming sequential insert:
            const originalItem = batch[j]; // V8 preserves order? Mostly.
            // Safer:
            if (originalItem.original[1]?.trim() !== frag.name) continue; // Mismatch safeguard

            const row = originalItem.original;

            // Notes
            const processSection = (text: string, type: string) => {
                if (!text) return;
                text.split(',').forEach(n => {
                    const nid = noteMap.get(n.trim().toLowerCase());
                    if (nid) relationInsertsNotes.push({ fragrance_id: frag.id, note_id: nid, type });
                });
            };
            processSection(row[8], 'top');
            processSection(row[9], 'middle');
            processSection(row[10], 'base');

            // Perfumers
            [row[11], row[12]].forEach(p => {
                if (!p) return;
                const pid = perfumerMap.get(p.trim().toLowerCase());
                if (pid) relationInsertsPerfumers.push({ fragrance_id: frag.id, perfumer_id: pid });
            });
        }

        if (relationInsertsNotes.length > 0) 
            await supabase.from('fragrance_notes').insert(relationInsertsNotes);
        if (relationInsertsPerfumers.length > 0) 
            await supabase.from('fragrance_perfumers').insert(relationInsertsPerfumers);

        successCount += createdFrags.length;
    }

    return new Response(
      JSON.stringify({ success: true, imported: successCount, message: 'Import completed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

