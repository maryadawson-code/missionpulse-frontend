-- T-GTM-2.1: Create pilot_engagement_scores table
-- MissionPulse Revenue Sprint

CREATE TABLE IF NOT EXISTS pilot_engagement_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  score               INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  daily_logins        INTEGER DEFAULT 0,
  ai_queries          INTEGER DEFAULT 0,
  proposals_created   INTEGER DEFAULT 0,
  compliance_matrices INTEGER DEFAULT 0,
  team_invites        INTEGER DEFAULT 0,
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pilot_engagement_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_view_engagement"
  ON pilot_engagement_scores FOR SELECT
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "service_role_manage_engagement"
  ON pilot_engagement_scores FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_pilot_engagement_scores_company
  ON pilot_engagement_scores(company_id, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_subscriptions_pilot_end
  ON company_subscriptions(pilot_end_date)
  WHERE pilot_end_date IS NOT NULL;
