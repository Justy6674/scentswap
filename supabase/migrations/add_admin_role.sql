-- Add admin role to users table
-- Run this in Supabase SQL Editor

-- Add is_admin column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add admin_notes column for admin-only notes
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create index for admin lookup
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Set your email as admin (CHANGE THIS TO YOUR EMAIL)
UPDATE users 
SET is_admin = true 
WHERE email = 'downscaleweightloss@gmail.com';

-- Create admin_actions audit log table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- 'user', 'listing', 'swap', etc.
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_actions
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin actions
CREATE POLICY "Admins can view all admin actions" ON admin_actions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- Only admins can insert admin actions
CREATE POLICY "Admins can insert admin actions" ON admin_actions 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE id = user_id AND is_admin = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin stats view
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
  (SELECT COUNT(*) FROM listings WHERE is_active = true) as active_listings,
  (SELECT COUNT(*) FROM listings WHERE created_at > NOW() - INTERVAL '7 days') as new_listings_7d,
  (SELECT COUNT(*) FROM swaps) as total_swaps,
  (SELECT COUNT(*) FROM swaps WHERE status = 'proposed') as pending_swaps,
  (SELECT COUNT(*) FROM swaps WHERE status = 'completed') as completed_swaps,
  (SELECT COUNT(*) FROM swaps WHERE status = 'disputed') as disputed_swaps,
  (SELECT COUNT(*) FROM swaps WHERE created_at > NOW() - INTERVAL '7 days') as new_swaps_7d,
  (SELECT COUNT(*) FROM users WHERE verification_tier = 'verified') as verified_users,
  (SELECT COUNT(*) FROM users WHERE subscription_plan = 'premium') as premium_users,
  (SELECT COUNT(*) FROM users WHERE subscription_plan = 'elite') as elite_users;

-- Grant access to admin stats view
GRANT SELECT ON admin_stats TO authenticated;

