-- Drop existing function first
DROP FUNCTION IF EXISTS public.search_listings;

-- Recreate with new parameters
CREATE OR REPLACE FUNCTION public.search_listings(
  search_query TEXT DEFAULT NULL,
  filter_segment_type TEXT DEFAULT NULL,
  filter_gender_marketing TEXT DEFAULT NULL,
  filter_family TEXT DEFAULT NULL,
  filter_performance_level TEXT DEFAULT NULL,
  filter_min_price NUMERIC DEFAULT NULL,
  filter_max_price NUMERIC DEFAULT NULL,
  filter_brands TEXT[] DEFAULT NULL,
  filter_condition TEXT[] DEFAULT NULL,
  filter_main_notes TEXT[] DEFAULT NULL
)
RETURNS SETOF public.listings
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM public.listings l
  WHERE 
    -- Keyword Search
    (search_query IS NULL OR 
     l.title ILIKE '%' || search_query || '%' OR
     l.description ILIKE '%' || search_query || '%' OR
     l.brand ILIKE '%' || search_query || '%')
    
    -- Faceted Filters
    AND (filter_segment_type IS NULL OR l.segment_type = filter_segment_type)
    AND (filter_gender_marketing IS NULL OR l.gender_marketing = filter_gender_marketing)
    AND (filter_family IS NULL OR l.family = filter_family)
    AND (filter_performance_level IS NULL OR l.performance_level = filter_performance_level)
    
    -- Price/Value Range (if applicable, assuming price column exists or using value logic)
    -- For now, we'll skip price as it's a swap platform, but keep the placeholder if needed for value estimation
    
    -- Brand Filter (Array)
    AND (filter_brands IS NULL OR l.brand = ANY(filter_brands))
    
    -- Condition Filter (Array)
    AND (filter_condition IS NULL OR l.condition = ANY(filter_condition))
    
    -- Main Notes Filter (Array overlap)
    -- Assuming main_notes is a text array column in listings
    AND (filter_main_notes IS NULL OR l.main_notes && filter_main_notes);
END;
$$;
