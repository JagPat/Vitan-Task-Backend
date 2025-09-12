-- Add onboarding and AI memory support
BEGIN;

-- Add onboarding_data and preferred_language to users
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';

-- Create simple user_memory table for AI sessions
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  message TEXT NOT NULL,
  intent VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_memory_email ON user_memory(user_email);

COMMIT;

