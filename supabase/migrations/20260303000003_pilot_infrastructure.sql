-- Migration: Extended pilot infrastructure for GTM-2.1
-- Adds pilot_kpi and pilot_credit_applied to company_subscriptions.
-- The base pilot columns (pilot_start_date, pilot_end_date, pilot_amount_cents,
-- pilot_converted) were added in 20260222_pilot_support.sql.

ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS pilot_kpi jsonb DEFAULT '{}';
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS pilot_credit_applied boolean DEFAULT false;

COMMENT ON COLUMN company_subscriptions.pilot_kpi IS 'Target KPIs agreed upon at pilot start';
COMMENT ON COLUMN company_subscriptions.pilot_credit_applied IS 'Whether 50% pilot credit was applied to annual conversion';

-- Partial index for quickly finding expired pilots that haven't been processed
CREATE INDEX IF NOT EXISTS idx_pilot_expired_unprocessed
  ON company_subscriptions (pilot_end_date)
  WHERE status = 'pilot' AND pilot_converted = false;
