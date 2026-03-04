-- ═══════════════════════════════════════════════════════════════
-- Sprint 20 — Token Budget Enforcement & Billing
-- T-20.1: Subscription Plans, Company Subscriptions, Token Ledger
--
-- Amendment A-1: Pricing at $149/$499/$2,500 monthly
-- Amendment A-2: 17% annual discount
-- Amendment A-3: annual_price column on subscription_plans
-- ═══════════════════════════════════════════════════════════════

-- ─── subscription_plans ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL UNIQUE,
  slug            text NOT NULL UNIQUE,
  monthly_price   numeric(10,2) NOT NULL DEFAULT 0,
  annual_price    numeric(10,2) NOT NULL DEFAULT 0,
  monthly_token_limit bigint NOT NULL DEFAULT 0,
  overage_rate_per_mtok numeric(6,2) NOT NULL DEFAULT 0,
  max_users       int NOT NULL DEFAULT 5,
  max_opportunities int NOT NULL DEFAULT 10,
  features        jsonb NOT NULL DEFAULT '{}',
  stripe_monthly_price_id text,
  stripe_annual_price_id  text,
  display_order   int NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read plans (public pricing)
CREATE POLICY "plans_read_all" ON subscription_plans
  FOR SELECT USING (true);

-- Only service role can modify plans
CREATE POLICY "plans_admin_write" ON subscription_plans
  FOR ALL USING (auth.role() = 'service_role');

-- ─── company_subscriptions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id            uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id               uuid NOT NULL REFERENCES subscription_plans(id),
  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','past_due','canceled','trialing')),
  billing_interval      text NOT NULL DEFAULT 'monthly'
                          CHECK (billing_interval IN ('monthly','annual')),
  current_period_start  timestamptz NOT NULL DEFAULT now(),
  current_period_end    timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  stripe_subscription_id text,
  stripe_customer_id    text,
  auto_overage_enabled  boolean NOT NULL DEFAULT false,
  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;

-- Company members can read their own subscription
CREATE POLICY "sub_read_own" ON company_subscriptions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only admins/executives can modify
CREATE POLICY "sub_admin_write" ON company_subscriptions
  FOR ALL USING (
    company_id IN (
      SELECT p.company_id FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','executive','CEO','COO')
    )
  );

-- ─── token_ledger ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_ledger (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_start      timestamptz NOT NULL,
  period_end        timestamptz NOT NULL,
  tokens_allocated  bigint NOT NULL DEFAULT 0,
  tokens_consumed   bigint NOT NULL DEFAULT 0,
  tokens_purchased  bigint NOT NULL DEFAULT 0,
  overage_tokens_used bigint NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, period_start)
);

ALTER TABLE token_ledger ENABLE ROW LEVEL SECURITY;

-- Company members can read their own ledger
CREATE POLICY "ledger_read_own" ON token_ledger
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role and admin can modify
CREATE POLICY "ledger_admin_write" ON token_ledger
  FOR ALL USING (
    auth.role() = 'service_role'
    OR company_id IN (
      SELECT p.company_id FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','executive','CEO','COO')
    )
  );

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_company_subscriptions_company ON company_subscriptions(company_id);
CREATE INDEX idx_company_subscriptions_stripe ON company_subscriptions(stripe_customer_id);
CREATE INDEX idx_token_ledger_company ON token_ledger(company_id);
CREATE INDEX idx_token_ledger_period ON token_ledger(company_id, period_start DESC);

-- ─── Seed Data (Amendment A-1, A-2, A-3) ────────────────────
-- Pricing: $149/$499/$2,500 monthly | 17% annual discount
-- Annual = monthly * 12 * 0.83

INSERT INTO subscription_plans (name, slug, monthly_price, annual_price, monthly_token_limit, overage_rate_per_mtok, max_users, max_opportunities, features, display_order)
VALUES
  (
    'Starter',
    'starter',
    149.00,
    1484.04,
    500000,
    0.80,
    5,
    10,
    '{"ai_chat": true, "playbook": true, "document_gen": true, "integrations": false, "fine_tuning": false, "knowledge_graph": false}'::jsonb,
    1
  ),
  (
    'Professional',
    'professional',
    499.00,
    4970.04,
    2000000,
    0.60,
    25,
    50,
    '{"ai_chat": true, "playbook": true, "document_gen": true, "integrations": true, "fine_tuning": false, "knowledge_graph": true}'::jsonb,
    2
  ),
  (
    'Enterprise',
    'enterprise',
    2500.00,
    24900.00,
    10000000,
    0.40,
    -1,
    -1,
    '{"ai_chat": true, "playbook": true, "document_gen": true, "integrations": true, "fine_tuning": true, "knowledge_graph": true, "priority_support": true, "custom_models": true}'::jsonb,
    3
  )
ON CONFLICT (slug) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  monthly_token_limit = EXCLUDED.monthly_token_limit,
  overage_rate_per_mtok = EXCLUDED.overage_rate_per_mtok,
  max_users = EXCLUDED.max_users,
  max_opportunities = EXCLUDED.max_opportunities,
  features = EXCLUDED.features,
  updated_at = now();

-- ─── Updated_at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscription_plans_updated
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_company_subscriptions_updated
  BEFORE UPDATE ON company_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_token_ledger_updated
  BEFORE UPDATE ON token_ledger
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
