-- Sprint 19 T-19.2: Performance Indexes
-- Run via Supabase Dashboard → SQL Editor (project: djuviwarqdvlbgcfuupa)
--
-- These indexes target the most frequent query patterns identified
-- across pipeline views, audit logs, compliance, and AI usage tracking.

-- ─── TIER 1: Critical ─────────────────────────────────────────

-- Opportunities: list views order by updated_at (8+ queries)
CREATE INDEX IF NOT EXISTS idx_opportunities_updated_at
  ON opportunities (updated_at DESC);

-- Opportunities: composite for status-filtered list views
CREATE INDEX IF NOT EXISTS idx_opportunities_status_updated_at
  ON opportunities (status, updated_at DESC);

-- Opportunities: phase filtering (pipeline swimlane board)
CREATE INDEX IF NOT EXISTS idx_opportunities_phase
  ON opportunities (phase);

-- Audit logs: immutable trail ordered by created_at (NIST AU-9)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);

-- Compliance requirements: per-opportunity queries
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_opportunity_id
  ON compliance_requirements (opportunity_id);

-- Token usage: monthly budget queries with date range
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at
  ON token_usage (created_at DESC);

-- ─── TIER 2: High ─────────────────────────────────────────────

-- Opportunities: due date sorting (upcoming deadlines widget)
CREATE INDEX IF NOT EXISTS idx_opportunities_due_date
  ON opportunities (due_date ASC);

-- Opportunities: owner filtering (RLS hot path)
CREATE INDEX IF NOT EXISTS idx_opportunities_owner_id
  ON opportunities (owner_id);

-- Compliance: status filtering for gap detection
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_status
  ON compliance_requirements (status);

-- Compliance: composite for opportunity + status queries
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_opp_status
  ON compliance_requirements (opportunity_id, status);

-- Audit logs: user-scoped audit trail
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs (user_id);

-- Audit logs: composite for user audit trail
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at
  ON audit_logs (user_id, created_at DESC);

-- Token usage: per-agent filtering
CREATE INDEX IF NOT EXISTS idx_token_usage_agent_id
  ON token_usage (agent_id);

-- Token usage: composite for agent usage trends
CREATE INDEX IF NOT EXISTS idx_token_usage_agent_id_created_at
  ON token_usage (agent_id, created_at DESC);

-- ─── TIER 3: Supporting ───────────────────────────────────────

-- Activity log: recent activity feed
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp
  ON activity_log (timestamp DESC);

-- Opportunity assignments: team view per opportunity
CREATE INDEX IF NOT EXISTS idx_opportunity_assignments_opportunity_id
  ON opportunity_assignments (opportunity_id);

-- Proposals: per-opportunity document list
CREATE INDEX IF NOT EXISTS idx_proposals_opportunity_id
  ON proposals (opportunity_id);

-- Gate reviews: per-opportunity gate decisions
CREATE INDEX IF NOT EXISTS idx_gate_reviews_opportunity_id
  ON gate_reviews (opportunity_id);

-- Contract clauses: per-opportunity clause list
CREATE INDEX IF NOT EXISTS idx_contract_clauses_opportunity_id
  ON contract_clauses (opportunity_id);
