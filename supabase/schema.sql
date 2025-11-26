-- ScentSwap Database Schema for Supabase
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  shipping_address JSONB,
  verification_tier VARCHAR(20) DEFAULT 'unverified' CHECK (verification_tier IN ('unverified', 'verified', 'trusted', 'elite')),
  id_verified BOOLEAN DEFAULT FALSE,
  address_verified BOOLEAN DEFAULT FALSE,
  total_swaps INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  positive_percentage DECIMAL(5,2) DEFAULT 0,
  member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fragrances reference table (optional, for autocomplete)
CREATE TABLE IF NOT EXISTS fragrances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  house VARCHAR(255) NOT NULL,
  concentration VARCHAR(50),
  year_released INTEGER,
  gender VARCHAR(20),
  top_notes TEXT[],
  middle_notes TEXT[],
  base_notes TEXT[],
  accords TEXT[],
  longevity_rating DECIMAL(3,2),
  sillage_rating DECIMAL(3,2),
  fragrantica_url TEXT,
  image_url TEXT,
  average_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  fragrance_id UUID REFERENCES fragrances(id),
  custom_name VARCHAR(255) NOT NULL,
  house VARCHAR(255),
  concentration VARCHAR(50) CHECK (concentration IN ('EDP', 'EDT', 'Parfum', 'EDC', 'Cologne', 'Other')),
  size_ml INTEGER NOT NULL,
  fill_percentage INTEGER CHECK (fill_percentage >= 0 AND fill_percentage <= 100),
  condition VARCHAR(50) CHECK (condition IN ('New', 'Like New', 'Good', 'Fair')),
  batch_code VARCHAR(100),
  description TEXT,
  photos TEXT[],
  swap_preferences JSONB,
  estimated_value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swaps table
CREATE TABLE IF NOT EXISTS swaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  initiator_listings UUID[] NOT NULL,
  recipient_listings UUID[] NOT NULL,
  status VARCHAR(50) DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'locked', 'shipped_initiator', 'shipped_recipient', 'shipped_both', 'delivered_initiator', 'delivered_recipient', 'completed', 'declined', 'cancelled', 'disputed')),
  fairness_score INTEGER CHECK (fairness_score >= 0 AND fairness_score <= 100),
  ai_assessment TEXT,
  initiator_tracking VARCHAR(100),
  recipient_tracking VARCHAR(100),
  initiator_shipped_at TIMESTAMP WITH TIME ZONE,
  recipient_shipped_at TIMESTAMP WITH TIME ZONE,
  initiator_received_at TIMESTAMP WITH TIME ZONE,
  recipient_received_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swap_id UUID REFERENCES swaps(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_ai_mediation BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swap_id UUID REFERENCES swaps(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  ratee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  accuracy_score INTEGER CHECK (accuracy_score >= 1 AND accuracy_score <= 5),
  packaging_score INTEGER CHECK (packaging_score >= 1 AND packaging_score <= 5),
  communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 5),
  timeliness_score INTEGER CHECK (timeliness_score >= 1 AND timeliness_score <= 5),
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(swap_id, rater_id)
);

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  fragrance_id UUID REFERENCES fragrances(id),
  fragrance_name VARCHAR(255),
  house VARCHAR(255),
  notes TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_concentration ON listings(concentration);
CREATE INDEX IF NOT EXISTS idx_swaps_initiator_id ON swaps(initiator_id);
CREATE INDEX IF NOT EXISTS idx_swaps_recipient_id ON swaps(recipient_id);
CREATE INDEX IF NOT EXISTS idx_swaps_status ON swaps(status);
CREATE INDEX IF NOT EXISTS idx_messages_swap_id ON messages(swap_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrances ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage own listings" ON listings FOR ALL USING (auth.uid() = user_id);

-- Swaps policies
CREATE POLICY "Users can view own swaps" ON swaps FOR SELECT USING (auth.uid() = initiator_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can create swaps" ON swaps FOR INSERT WITH CHECK (auth.uid() = initiator_id);
CREATE POLICY "Users can update own swaps" ON swaps FOR UPDATE USING (auth.uid() = initiator_id OR auth.uid() = recipient_id);

-- Messages policies
CREATE POLICY "Users can view swap messages" ON messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM swaps WHERE swaps.id = messages.swap_id AND (swaps.initiator_id = auth.uid() OR swaps.recipient_id = auth.uid())));
CREATE POLICY "Users can send swap messages" ON messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM swaps WHERE swaps.id = swap_id AND (swaps.initiator_id = auth.uid() OR swaps.recipient_id = auth.uid())));

-- Ratings policies
CREATE POLICY "Anyone can view ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Wishlists policies
CREATE POLICY "Users can manage own wishlists" ON wishlists FOR ALL USING (auth.uid() = user_id);

-- Fragrances policies (read-only for everyone)
CREATE POLICY "Anyone can view fragrances" ON fragrances FOR SELECT USING (true);

-- Function to update user rating after new rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET 
    rating = (SELECT AVG(overall_score) FROM ratings WHERE ratee_id = NEW.ratee_id),
    total_swaps = (SELECT COUNT(*) FROM ratings WHERE ratee_id = NEW.ratee_id)
  WHERE id = NEW.ratee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user rating
DROP TRIGGER IF EXISTS on_rating_created ON ratings;
CREATE TRIGGER on_rating_created
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_swaps_updated_at ON swaps;
CREATE TRIGGER update_swaps_updated_at BEFORE UPDATE ON swaps FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- AMPLIFIED SEARCH SCHEMA ADDITIONS
-- ==========================================

-- Fragrance Meta table (Reference library for auto-population)
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
CREATE POLICY "Anyone can view fragrance_meta" ON fragrance_meta FOR SELECT USING (true);

-- Add search facets to listings table
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

-- Create indexes for new search columns
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


-- ==========================================
-- SEARCH RPC FUNCTION
-- ==========================================

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
  image_url TEXT, -- From joined fragrances table or listings photos
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
        (filters->>'gender_marketing' = 'mens' AND l.gender_marketing = 'unisex') OR -- Example logic: Mens shows unisex too
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
  ORDER BY fl.created_at DESC -- Default sort
  LIMIT page_size OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;


