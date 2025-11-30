-- Add optimization fields to fragrance_master table
ALTER TABLE fragrance_master 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS perfumer VARCHAR(255),
ADD COLUMN IF NOT EXISTS market_tier VARCHAR(50),
ADD COLUMN IF NOT EXISTS performance_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS season_tags TEXT[],
ADD COLUMN IF NOT EXISTS occasion_tags TEXT[],
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS last_optimized_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_optimized_at TIMESTAMP WITH TIME ZONE;

-- Create index for optimization status
CREATE INDEX IF NOT EXISTS idx_fragrance_master_last_optimized_by ON fragrance_master(last_optimized_by);
