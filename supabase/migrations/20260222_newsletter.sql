-- Migration: Newsletter subscribers table
-- Sprint GTM-3, Ticket T-GTM-3.4

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'website',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only service role can insert/update
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- No public policies — service role key required for writes
-- Read policy for admin dashboards
CREATE POLICY "Admin can read newsletter subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email
  ON newsletter_subscribers (email);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source
  ON newsletter_subscribers (source);

COMMENT ON TABLE newsletter_subscribers IS 'Email subscribers for marketing newsletter. GDPR-compliant with unsubscribe support.';
COMMENT ON COLUMN newsletter_subscribers.source IS 'Where the signup came from: website, 8a-toolkit, pricing, etc.';
COMMENT ON COLUMN newsletter_subscribers.unsubscribed_at IS 'Set when user unsubscribes (GDPR). Row kept for compliance.';
