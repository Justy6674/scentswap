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
