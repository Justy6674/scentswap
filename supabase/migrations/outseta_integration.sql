-- Outseta Integration Migration
-- Adds columns to users table for Outseta user sync
-- Run this migration in your Supabase SQL editor

-- Add Outseta columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS outseta_person_uid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS outseta_account_uid TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Create index for faster lookups by Outseta ID
CREATE INDEX IF NOT EXISTS idx_users_outseta_person_uid 
ON users(outseta_person_uid) 
WHERE outseta_person_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_outseta_account_uid 
ON users(outseta_account_uid) 
WHERE outseta_account_uid IS NOT NULL;

-- Add constraint to ensure valid subscription plans
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS valid_subscription_plan;

ALTER TABLE users 
ADD CONSTRAINT valid_subscription_plan 
CHECK (subscription_plan IN ('free', 'premium', 'elite'));

-- Add constraint for subscription status
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS valid_subscription_status;

ALTER TABLE users 
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'paused'));

-- Comment on columns for documentation
COMMENT ON COLUMN users.outseta_person_uid IS 'Outseta Person UID - unique identifier from Outseta';
COMMENT ON COLUMN users.outseta_account_uid IS 'Outseta Account UID - links to billing account';
COMMENT ON COLUMN users.subscription_plan IS 'Current subscription tier: free, premium, or elite';
COMMENT ON COLUMN users.subscription_status IS 'Subscription status: active, canceled, past_due, trialing, paused';

-- Create RLS policy for users to only see their own data
-- (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'users_own_data'
  ) THEN
    CREATE POLICY users_own_data ON users
      FOR ALL
      USING (
        id = auth.uid() 
        OR outseta_person_uid = (auth.jwt() ->> 'sub')
      );
  END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO anon;

