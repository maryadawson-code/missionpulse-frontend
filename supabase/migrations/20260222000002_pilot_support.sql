-- Migration: Add pilot support to billing system.
-- Sprint GTM-2, Ticket T-GTM-2.1

-- Add 'pilot' and 'expired' to status values
-- (PostgreSQL doesn't enforce enum on text columns — this is documentation)
COMMENT ON COLUMN company_subscriptions.status IS 'active | past_due | canceled | trialing | pilot | expired';

-- Add pilot-specific columns
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS pilot_start_date timestamptz;
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS pilot_end_date timestamptz;
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS pilot_amount_cents integer;
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS pilot_converted boolean DEFAULT false;
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Index for finding active/expiring pilots
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_pilot
  ON company_subscriptions (status, pilot_end_date)
  WHERE status = 'pilot';

COMMENT ON COLUMN company_subscriptions.pilot_start_date IS 'When the 30-day pilot started';
COMMENT ON COLUMN company_subscriptions.pilot_end_date IS 'When the pilot expires (start + 30 days)';
COMMENT ON COLUMN company_subscriptions.pilot_amount_cents IS 'Amount paid for pilot (50% of annual)';
COMMENT ON COLUMN company_subscriptions.pilot_converted IS 'Whether pilot converted to paid annual';
COMMENT ON COLUMN company_subscriptions.metadata IS 'Flexible metadata: engagement_score, onboarding progress, etc.';
