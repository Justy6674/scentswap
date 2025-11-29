# Architecture: Admin CSV Bulk Import

This document outlines the architecture of the Bulk CSV Import feature in the Admin Dashboard (`app/(tabs)/admin.tsx`), designed to handle large datasets (10k+ rows) without crashing the browser or database.

## Core Problem
Uploading 10,000+ rows of relational data (Fragrances linked to Brands, Notes, and Perfumers) naively creates 50,000+ individual database requests. This causes:
1.  **Browser Freeze**: The main thread locks up processing the loop.
2.  **Network Saturation**: Thousands of pending requests timeout.
3.  **Data Inconsistency**: Partial failures leave "zombie" records.

## The Solution: 4-Phase Bulk Process
We implemented an "ETL" (Extract, Transform, Load) pipeline that runs entirely on the client-side but uses batching to behave like a server job.

### 1. Phase 1: Parse & Analyze (InMemory)
*   **Input**: Raw CSV text from the clipboard or file.
*   **Action**:
    *   Reads the entire file into memory (safe up to ~50MB).
    *   Iterates *once* to extract unique sets of `Brands`, `Notes`, and `Perfumers`.
    *   Normalizes data (e.g., `Women` -> `female`, `Men` -> `male`).
*   **Output**: `Set<String>` for brands, notes, perfumers, and a `parsedRows` array.

### 2. Phase 2: Bulk Sync References (The "Upsert" Phase)
*   **Goal**: Ensure all foreign key dependencies exist *before* we try to insert fragrances.
*   **Action**:
    1.  **Bulk Fetch**: `SELECT * FROM brands WHERE name IN (...)`.
    2.  **Diff**: Calculate which names are missing.
    3.  **Bulk Insert**: `INSERT INTO brands (name) VALUES (...)` for the missing ones.
    4.  **Cache**: Build a `Map<Name, UUID>` for O(1) lookup.
*   **Result**: We now have IDs for every Brand, Note, and Perfumer referenced in the CSV.

### 3. Phase 3: Batched Fragrance Upload
*   **Goal**: Insert the main fragrance records efficiently.
*   **Action**:
    *   Process in chunks of **500 rows**.
    *   Map CSV rows to `batchFragrances` objects using the ID Maps from Phase 2.
    *   **Validation**: If a Brand ID is missing (rare), skip the row safely.
    *   **Insert**: `db.bulkCreateFragrances(batch)` (1 network request per 500 rows).
*   **Recursive Loop**: Uses `setTimeout(nextChunk, 0)` pattern to break the call stack, allowing the UI to repaint the progress bar between chunks.

### 4. Phase 4: Link Relations
*   **Goal**: Connect the new Fragrances to their Notes and Perfumers.
*   **Action**:
    *   After each batch of Fragrances is inserted, we get back their new UUIDs.
    *   We map these UUIDs back to the original CSV rows.
    *   We build massive junction arrays: `[{ fragrance_id: A, note_id: B, type: 'top' }, ...]`.
    *   **Insert**: `db.bulkCreateFragranceNotes(relations)` in one go.

## Key robustness Features
1.  **Recursive `setTimeout`**: Prevents "Page Unresponsive" errors by yielding to the event loop.
2.  **Clipboard Safety**: Checks for `navigator.clipboard` support and falls back gracefully.
3.  **Large Text Truncation**: If the pasted text is >100KB, the text box only shows a preview to prevent React rendering lag, but keeps the full data in a `useRef` for processing.
4.  **Empty Batch Handling**: Safely skips chunks that contain only invalid data instead of crashing the SQL query.
5.  **Auth Hydration Fix**: The component waits for `isMounted` to prevent Server/Client mismatch (Error #418).

## Database Functions Used
Located in `lib/database.ts`:
*   `bulkGetBrands`, `bulkCreateBrands`
*   `bulkGetNotes`, `bulkCreateNotes`
*   `bulkGetPerfumers`, `bulkCreatePerfumers`
*   `bulkCreateFragrances`
*   `bulkCreateFragranceNotes`, `bulkCreateFragrancePerfumers`

## Future Improvements (For Next Dev)
*   **Server-Side Processing**: For files >50MB, move Phase 1-4 to a Supabase Edge Function.
*   **Transactional Integrity**: Wrap batches in a transaction so a failed batch rolls back completely (currently row-level errors are skipped).
*   **Duplicate Detection**: Currently, it appends. Add a check for existing `fragrance.name + brand_id` to prevent duplicates.
