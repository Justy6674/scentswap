-- ==========================================
-- AMPLIFIED SEARCH MIGRATION
-- Run this script to add search features to an existing database
-- ==========================================

-- 1. Create Fragrance Meta table
CREATE TABLE IF NOT EXISTS fragrance_meta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  gender_marketing VARCHAR(50),
  family VARCHAR(100),
  accords TEXT[],
  notes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on fragrance_meta
ALTER TABLE fragrance_meta ENABLE ROW LEVEL SECURITY;

-- Safely create policy for fragrance_meta
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'fragrance_meta' 
        AND policyname = 'Anyone can view fragrance_meta'
    ) THEN
        CREATE POLICY "Anyone can view fragrance_meta" ON fragrance_meta FOR SELECT USING (true);
    END IF;
END
$$;

-- 2. Add search facets to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS segment_type VARCHAR(50) CHECK (segment_type IN ('designer', 'niche', 'indie', 'clone', 'oil', 'decant')),
ADD COLUMN IF NOT EXISTS gender_marketing VARCHAR(50) CHECK (gender_marketing IN ('mens', 'womens', 'unisex', 'doesnt_matter')),
ADD COLUMN IF NOT EXISTS family VARCHAR(100),
ADD COLUMN IF NOT EXISTS accords TEXT[],
ADD COLUMN IF NOT EXISTS notes TEXT[],
ADD COLUMN IF NOT EXISTS performance_level VARCHAR(50) CHECK (performance_level IN ('soft', 'moderate', 'loud', 'beast_mode')),
ADD COLUMN IF NOT EXISTS season_tags TEXT[],
ADD COLUMN IF NOT EXISTS occasion_tags TEXT[],
ADD COLUMN IF NOT EXISTS value_points INTEGER,
ADD COLUMN IF NOT EXISTS state VARCHAR(100);

-- 3. Create indexes for new search columns
CREATE INDEX IF NOT EXISTS idx_listings_segment_type ON listings(segment_type);
CREATE INDEX IF NOT EXISTS idx_listings_gender_marketing ON listings(gender_marketing);
CREATE INDEX IF NOT EXISTS idx_listings_family ON listings(family);
CREATE INDEX IF NOT EXISTS idx_listings_accords ON listings USING GIN(accords);
CREATE INDEX IF NOT EXISTS idx_listings_notes ON listings USING GIN(notes);
CREATE INDEX IF NOT EXISTS idx_listings_performance_level ON listings(performance_level);
CREATE INDEX IF NOT EXISTS idx_listings_season_tags ON listings USING GIN(season_tags);
CREATE INDEX IF NOT EXISTS idx_listings_occasion_tags ON listings USING GIN(occasion_tags);
CREATE INDEX IF NOT EXISTS idx_listings_value_points ON listings(value_points);
CREATE INDEX IF NOT EXISTS idx_listings_state ON listings(state);

-- 4. Create Search RPC Function
CREATE OR REPLACE FUNCTION search_listings(
  query_text TEXT DEFAULT NULL,
  filters JSONB DEFAULT '{}'::JSONB,
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  custom_name VARCHAR,
  house VARCHAR,
  concentration VARCHAR,
  size_ml INTEGER,
  fill_percentage INTEGER,
  condition VARCHAR,
  estimated_value DECIMAL,
  segment_type VARCHAR,
  gender_marketing VARCHAR,
  family VARCHAR,
  accords TEXT[],
  notes TEXT[],
  performance_level VARCHAR,
  image_url TEXT,
  total_count BIGINT
) AS $$
DECLARE
  offset_val INTEGER;
BEGIN
  offset_val := (page_number - 1) * page_size;

  RETURN QUERY
  WITH filtered_listings AS (
    SELECT 
      l.*,
      f.image_url as frag_image_url
    FROM listings l
    LEFT JOIN fragrances f ON l.fragrance_id = f.id
    WHERE 
      l.is_active = true
      -- Text Search
      AND (
        query_text IS NULL OR query_text = '' OR
        to_tsvector('english', 
          coalesce(l.custom_name, '') || ' ' || 
          coalesce(l.house, '') || ' ' || 
          coalesce(l.description, '') || ' ' ||
          array_to_string(coalesce(l.notes, ARRAY[]::text[]), ' ')
        ) @@ plainto_tsquery('english', query_text)
      )
      -- Filters
      AND (
        (filters->>'segment_type') IS NULL OR 
        l.segment_type = (filters->>'segment_type')
      )
      AND (
        (filters->>'gender_marketing') IS NULL OR 
        l.gender_marketing = (filters->>'gender_marketing') OR
        (filters->>'gender_marketing' = 'mens' AND l.gender_marketing = 'unisex') OR 
        (filters->>'gender_marketing' = 'womens' AND l.gender_marketing = 'unisex')
      )
      AND (
        (filters->>'family') IS NULL OR 
        l.family = (filters->>'family')
      )
      AND (
        (filters->>'performance_level') IS NULL OR 
        l.performance_level = (filters->>'performance_level')
      )
      AND (
        (filters->>'min_value') IS NULL OR 
        l.estimated_value >= (filters->>'min_value')::DECIMAL
      )
      AND (
        (filters->>'max_value') IS NULL OR 
        l.estimated_value <= (filters->>'max_value')::DECIMAL
      )
      -- Array Filters (Overlap)
      AND (
        (filters->'accords') IS NULL OR jsonb_array_length(filters->'accords') = 0 OR
        l.accords && (SELECT array_agg(x)::text[] FROM jsonb_array_elements_text(filters->'accords') t(x))
      )
      AND (
        (filters->'notes') IS NULL OR jsonb_array_length(filters->'notes') = 0 OR
        l.notes && (SELECT array_agg(x)::text[] FROM jsonb_array_elements_text(filters->'notes') t(x))
      )
      AND (
        (filters->'occasion_tags') IS NULL OR jsonb_array_length(filters->'occasion_tags') = 0 OR
        l.occasion_tags && (SELECT array_agg(x)::text[] FROM jsonb_array_elements_text(filters->'occasion_tags') t(x))
      )
      AND (
        (filters->'season_tags') IS NULL OR jsonb_array_length(filters->'season_tags') = 0 OR
        l.season_tags && (SELECT array_agg(x)::text[] FROM jsonb_array_elements_text(filters->'season_tags') t(x))
      )
  ),
  total AS (
    SELECT COUNT(*) as count FROM filtered_listings
  )
  SELECT 
    fl.id,
    fl.custom_name,
    fl.house,
    fl.concentration,
    fl.size_ml,
    fl.fill_percentage,
    fl.condition,
    fl.estimated_value,
    fl.segment_type,
    fl.gender_marketing,
    fl.family,
    fl.accords,
    fl.notes,
    fl.performance_level,
    COALESCE(fl.photos[1], fl.frag_image_url) as image_url,
    t.count
  FROM filtered_listings fl
  CROSS JOIN total t
  ORDER BY fl.created_at DESC
  LIMIT page_size OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;
