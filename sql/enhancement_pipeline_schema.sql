-- Enhancement Pipeline Database Schema
-- Tables for automated fragrance enhancement and job management

-- Enhancement Jobs Table
CREATE TABLE IF NOT EXISTS enhancement_jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_fragrances TEXT[] NOT NULL,
  research_scope JSONB NOT NULL DEFAULT '{}',
  batch_size INTEGER NOT NULL DEFAULT 10,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
  progress JSONB NOT NULL DEFAULT '{"total": 0, "completed": 0, "failed": 0, "skipped": 0}',
  settings JSONB NOT NULL DEFAULT '{}',
  schedule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhancement Results Table
CREATE TABLE IF NOT EXISTS enhancement_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES enhancement_jobs(id) ON DELETE CASCADE,
  fragment_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'skipped')),
  result JSONB,
  error TEXT,
  cost DECIMAL(10,4) DEFAULT 0,
  processing_time INTEGER DEFAULT 0, -- milliseconds
  quality_improvement INTEGER DEFAULT 0, -- 0-100 score
  changes_applied TEXT[] DEFAULT '{}',
  retailers_checked TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Add foreign key to fragrances table
  FOREIGN KEY (fragment_id) REFERENCES fragrances(id) ON DELETE CASCADE
);

-- Enhancement Analytics Table
CREATE TABLE IF NOT EXISTS enhancement_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT REFERENCES enhancement_jobs(id),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  metric_unit TEXT,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User AI Sessions Table (for search and consultation tracking)
CREATE TABLE IF NOT EXISTS user_ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('search', 'recommendation', 'consultation', 'enhancement')),
  conversation JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '{}',
  user_feedback JSONB DEFAULT '{}',
  cost DECIMAL(10,4) DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Index for user lookups
  INDEX idx_user_ai_sessions_user_email (user_email),
  INDEX idx_user_ai_sessions_type_date (session_type, created_at)
);

-- Search Intelligence Table
CREATE TABLE IF NOT EXISTS search_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  parsed_intent JSONB DEFAULT '{}',
  applied_filters JSONB DEFAULT '{}',
  search_strategy TEXT,
  results_returned INTEGER DEFAULT 0,
  user_interactions JSONB DEFAULT '{}',
  success_score DECIMAL(3,2) DEFAULT 0, -- 0-100
  response_time INTEGER DEFAULT 0, -- milliseconds
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for analytics
  INDEX idx_search_intelligence_query (query),
  INDEX idx_search_intelligence_user_date (user_email, created_at),
  INDEX idx_search_intelligence_strategy (search_strategy)
);

-- Fragrance Enhancements History Table
CREATE TABLE IF NOT EXISTS fragrance_enhancements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fragment_id TEXT NOT NULL,
  enhancement_type TEXT NOT NULL,
  ai_model TEXT,
  ai_confidence DECIMAL(5,2) DEFAULT 0,
  changes_applied JSONB DEFAULT '{}',
  original_values JSONB DEFAULT '{}',
  sources JSONB DEFAULT '{}',
  cost DECIMAL(10,4) DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  processing_time INTEGER DEFAULT 0, -- milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  verified_by TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Foreign key to fragrances table
  FOREIGN KEY (fragment_id) REFERENCES fragrances(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_fragrance_enhancements_fragment (fragment_id),
  INDEX idx_fragrance_enhancements_type (enhancement_type),
  INDEX idx_fragrance_enhancements_date (created_at)
);

-- AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  ai_provider TEXT NOT NULL CHECK (ai_provider IN ('anthropic', 'openai', 'gemini', 'deepseek')),
  model_used TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('search', 'enhancement', 'recommendation', 'consultation')),
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10,4) NOT NULL DEFAULT 0,
  request_data JSONB DEFAULT '{}',
  response_data JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for usage analytics
  INDEX idx_ai_usage_user_date (user_email, created_at),
  INDEX idx_ai_usage_provider_model (ai_provider, model_used),
  INDEX idx_ai_usage_operation (operation_type)
);

-- Australian Market Intelligence Table
CREATE TABLE IF NOT EXISTS australian_market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fragment_id TEXT NOT NULL,
  retailer_name TEXT NOT NULL,
  price_aud DECIMAL(10,2),
  original_price_aud DECIMAL(10,2),
  discount_percent DECIMAL(5,2),
  in_stock BOOLEAN DEFAULT false,
  product_url TEXT,
  shipping_options TEXT[] DEFAULT '{}',
  trust_score DECIMAL(3,1) DEFAULT 5.0, -- 1-10 scale
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key to fragrances table
  FOREIGN KEY (fragment_id) REFERENCES fragrances(id) ON DELETE CASCADE,

  -- Unique constraint per fragrance/retailer
  UNIQUE(fragment_id, retailer_name),

  -- Indexes
  INDEX idx_australian_market_fragment (fragment_id),
  INDEX idx_australian_market_retailer (retailer_name),
  INDEX idx_australian_market_price (price_aud),
  INDEX idx_australian_market_stock (in_stock),
  INDEX idx_australian_market_updated (last_checked)
);

-- Pipeline Performance Metrics Table
CREATE TABLE IF NOT EXISTS pipeline_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'summary')),
  tags JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Index for time-series queries
  INDEX idx_pipeline_metrics_name_time (metric_name, recorded_at),
  INDEX idx_pipeline_metrics_type (metric_type)
);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to enhancement_jobs
CREATE TRIGGER update_enhancement_jobs_updated_at
    BEFORE UPDATE ON enhancement_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies

-- Enable RLS on sensitive tables
ALTER TABLE enhancement_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for enhancement_jobs
CREATE POLICY "Users can view their own jobs" ON enhancement_jobs
  FOR SELECT USING (auth.jwt() ->> 'email' = created_by);

CREATE POLICY "Users can create their own jobs" ON enhancement_jobs
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = created_by);

CREATE POLICY "Users can update their own jobs" ON enhancement_jobs
  FOR UPDATE USING (auth.jwt() ->> 'email' = created_by);

-- Policies for user_ai_sessions
CREATE POLICY "Users can view their own sessions" ON user_ai_sessions
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can create their own sessions" ON user_ai_sessions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Policies for ai_usage_tracking
CREATE POLICY "Users can view their own usage" ON ai_usage_tracking
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Admin policies (for users in admin list)
CREATE POLICY "Admins can view all jobs" ON enhancement_jobs
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'downscale@icloud.com'
    )
  );

CREATE POLICY "Admins can view all sessions" ON user_ai_sessions
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'downscale@icloud.com'
    )
  );

-- Create views for common queries

-- Job Statistics View
CREATE OR REPLACE VIEW enhancement_job_stats AS
SELECT
  status,
  COUNT(*) as job_count,
  AVG((progress->>'total')::integer) as avg_total_items,
  AVG((progress->>'completed')::integer) as avg_completed,
  AVG(CASE WHEN status = 'completed' THEN
    EXTRACT(EPOCH FROM (completed_at - started_at))/3600
    ELSE NULL END) as avg_duration_hours
FROM enhancement_jobs
GROUP BY status;

-- User Activity View
CREATE OR REPLACE VIEW user_ai_activity AS
SELECT
  user_email,
  COUNT(*) as total_sessions,
  SUM(cost) as total_cost,
  SUM(tokens_used) as total_tokens,
  AVG(cost) as avg_cost_per_session,
  MAX(created_at) as last_activity
FROM user_ai_sessions
GROUP BY user_email
ORDER BY total_cost DESC;

-- Market Price Analysis View
CREATE OR REPLACE VIEW market_price_analysis AS
SELECT
  f.brand,
  f.name,
  COUNT(amd.retailer_name) as retailer_count,
  MIN(amd.price_aud) as min_price,
  MAX(amd.price_aud) as max_price,
  AVG(amd.price_aud) as avg_price,
  STDDEV(amd.price_aud) as price_variance,
  SUM(CASE WHEN amd.in_stock THEN 1 ELSE 0 END) as in_stock_count
FROM fragrances f
LEFT JOIN australian_market_data amd ON f.id = amd.fragment_id
WHERE amd.last_checked > NOW() - INTERVAL '7 days'
GROUP BY f.id, f.brand, f.name
HAVING COUNT(amd.retailer_name) > 0
ORDER BY avg_price DESC;

-- Performance Metrics View
CREATE OR REPLACE VIEW enhancement_performance AS
SELECT
  DATE_TRUNC('day', er.created_at) as date,
  COUNT(*) as total_enhancements,
  AVG(er.cost) as avg_cost,
  AVG(er.processing_time) as avg_processing_time_ms,
  AVG(er.quality_improvement) as avg_quality_improvement,
  COUNT(CASE WHEN er.status = 'completed' THEN 1 END) as successful_count,
  COUNT(CASE WHEN er.status = 'failed' THEN 1 END) as failed_count,
  ROUND(COUNT(CASE WHEN er.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM enhancement_results er
WHERE er.created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', er.created_at)
ORDER BY date DESC;

-- Price Alerts Table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  fragment_id TEXT NOT NULL,
  target_price DECIMAL(10,2) NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('below', 'discount', 'back_in_stock')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_triggered TIMESTAMP WITH TIME ZONE,

  -- Foreign key to fragrances table
  FOREIGN KEY (fragment_id) REFERENCES fragrances(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_price_alerts_user (user_email),
  INDEX idx_price_alerts_fragment (fragment_id),
  INDEX idx_price_alerts_active (is_active),
  INDEX idx_price_alerts_type (alert_type)
);

-- Price Alerts RLS Policies
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view their own price alerts" ON price_alerts
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can create their own alerts
CREATE POLICY "Users can create their own price alerts" ON price_alerts
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can update their own alerts
CREATE POLICY "Users can update their own price alerts" ON price_alerts
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- Users can delete their own alerts
CREATE POLICY "Users can delete their own price alerts" ON price_alerts
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Admins can view all alerts
CREATE POLICY "Admins can view all price alerts" ON price_alerts
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'downscale@icloud.com'
    )
  );

-- Vector Database Tables for Fragrance DNA and Similarity Matching

-- Fragrance Vectors Table
CREATE TABLE IF NOT EXISTS fragrance_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fragment_id TEXT NOT NULL UNIQUE,
  dna_data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key to fragrances table
  FOREIGN KEY (fragment_id) REFERENCES fragrances(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_fragrance_vectors_fragment (fragment_id),
  INDEX idx_fragrance_vectors_updated (last_updated)
);

-- User Preference Vectors Table
CREATE TABLE IF NOT EXISTS user_preference_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,
  vector_data JSONB NOT NULL,
  confidence INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  INDEX idx_user_preference_vectors_email (user_email),
  INDEX idx_user_preference_vectors_confidence (confidence),
  INDEX idx_user_preference_vectors_updated (last_updated)
);

-- Fragrance Clusters Table
CREATE TABLE IF NOT EXISTS fragrance_clusters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  centroid JSONB NOT NULL,
  member_fragrances TEXT[] DEFAULT '{}',
  characteristics TEXT[] DEFAULT '{}',
  average_price DECIMAL(10,2) DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  INDEX idx_fragrance_clusters_name (name),
  INDEX idx_fragrance_clusters_popularity (popularity),
  INDEX idx_fragrance_clusters_price (average_price)
);

-- Similarity Cache Table (for performance)
CREATE TABLE IF NOT EXISTS similarity_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_fragment_id TEXT NOT NULL,
  target_fragment_id TEXT NOT NULL,
  similarity_score DECIMAL(5,4) NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('notes', 'semantic', 'hybrid', 'user_preference')),
  explanation TEXT,
  confidence INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign keys
  FOREIGN KEY (source_fragment_id) REFERENCES fragrances(id) ON DELETE CASCADE,
  FOREIGN KEY (target_fragment_id) REFERENCES fragrances(id) ON DELETE CASCADE,

  -- Unique constraint to prevent duplicates
  UNIQUE(source_fragment_id, target_fragment_id, match_type),

  -- Indexes
  INDEX idx_similarity_cache_source (source_fragment_id),
  INDEX idx_similarity_cache_target (target_fragment_id),
  INDEX idx_similarity_cache_score (similarity_score),
  INDEX idx_similarity_cache_type (match_type),
  INDEX idx_similarity_cache_confidence (confidence)
);

-- Recommendation History Table
CREATE TABLE IF NOT EXISTS recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  fragment_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('similar', 'trending', 'seasonal', 'personalised', 'price_match', 'discovery')),
  confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
  reason TEXT,
  presented TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clicked BOOLEAN DEFAULT false,
  purchased BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  -- Foreign key to fragrances table
  FOREIGN KEY (fragment_id) REFERENCES fragrances(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_recommendation_history_user (user_email),
  INDEX idx_recommendation_history_fragment (fragment_id),
  INDEX idx_recommendation_history_type (recommendation_type),
  INDEX idx_recommendation_history_presented (presented),
  INDEX idx_recommendation_history_interaction (clicked, purchased)
);

-- Vector Database RLS Policies
ALTER TABLE fragrance_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;

-- Public read access for fragrance vectors (for similarity search)
CREATE POLICY "Public can read fragrance vectors" ON fragrance_vectors
  FOR SELECT TO public
  USING (true);

-- Users can view their own preference vectors
CREATE POLICY "Users can view their own preference vectors" ON user_preference_vectors
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can update their own preference vectors
CREATE POLICY "Users can update their own preference vectors" ON user_preference_vectors
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can update their own preference vectors
CREATE POLICY "Users can modify their own preference vectors" ON user_preference_vectors
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- Users can view their own recommendation history
CREATE POLICY "Users can view their own recommendation history" ON recommendation_history
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can create their own recommendation history
CREATE POLICY "Users can create their own recommendation history" ON recommendation_history
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Admins can manage all vector data
CREATE POLICY "Admins can manage fragrance vectors" ON fragrance_vectors
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'downscale@icloud.com'
    )
  );

CREATE POLICY "Admins can view all preference vectors" ON user_preference_vectors
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'downscale@icloud.com'
    )
  );

CREATE POLICY "Admins can view all recommendation history" ON recommendation_history
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'downscale@icloud.com'
    )
  );