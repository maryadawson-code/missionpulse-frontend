-- Migration: Add provider column to token_usage table for per-provider cost tracking.
-- Sprint GTM-1, Ticket T-GTM-1.3

-- Add provider column (nullable for backward compatibility with existing rows)
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS provider text;

-- Add index for analytics queries filtering by provider
CREATE INDEX IF NOT EXISTS idx_token_usage_provider ON token_usage (provider);

-- Comment
COMMENT ON COLUMN token_usage.provider IS 'AI provider ID: asksage, anthropic, openai. Added by T-GTM-1.3.';
