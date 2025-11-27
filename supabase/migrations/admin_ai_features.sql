-- Create AI Configuration Table
CREATE TABLE IF NOT EXISTS ai_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create Token Usage Table
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id), -- Use auth.users for consistency with other tables if possible, or public.users if using custom auth
    feature TEXT NOT NULL, -- e.g., 'assessment', 'authenticity_check'
    tokens_used INTEGER NOT NULL,
    model_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Admin Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'listing', 'user', 'config'
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Admin Verified fields to Listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_assessment_override JSONB; -- To store manual overrides of AI data

-- Insert default AI Configs
INSERT INTO ai_configs (key, value, description) VALUES
('assessment_prompts', '{
    "authenticity": "Analyze the provided images for signs of authenticity. Focus on batch codes, packaging quality, and bottle shape.",
    "condition": "Assess the fill level and general condition of the bottle based on the images."
}', 'System prompts for AI assessment'),
('criteria_weights', '{
    "authenticity": 0.5,
    "condition": 0.3,
    "fill_level": 0.2
}', 'Weighting for fairness score calculation'),
('model_settings', '{
    "default_model": "gpt-3.5-turbo",
    "premium_model": "gpt-4o",
    "provider": "openai"
}', 'Model selection settings');

-- Enable RLS
ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Only admins can read/write ai_configs
CREATE POLICY "Admins can manage ai_configs" ON ai_configs
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id =auth.uid() AND is_admin = true));

-- Users can read their own token usage, Admins can read all
CREATE POLICY "Users read own token usage" ON token_usage
    FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Admins can read/write admin logs
CREATE POLICY "Admins manage logs" ON admin_logs
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

