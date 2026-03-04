-- Monitoring events table for storing health check results
CREATE TABLE IF NOT EXISTS monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('health_check', 'deploy', 'error_spike', 'uptime', 'stripe_alert', 'ssl_check', 'dependency_alert')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  detail JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent unresolved events
CREATE INDEX IF NOT EXISTS idx_monitoring_events_unresolved
  ON monitoring_events (severity, resolved, created_at DESC) WHERE NOT resolved;
CREATE INDEX IF NOT EXISTS idx_monitoring_events_type
  ON monitoring_events (event_type, created_at DESC);

-- Daily health snapshots for trend tracking
CREATE TABLE IF NOT EXISTS health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  health_status TEXT NOT NULL,
  response_time_ms INTEGER,
  subsystem_checks JSONB NOT NULL DEFAULT '{}',
  deploy_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_date)
);

-- RLS: service role only (monitoring is internal)
ALTER TABLE monitoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_snapshots ENABLE ROW LEVEL SECURITY;

-- Only admin roles can read monitoring data
DO $$ BEGIN
CREATE POLICY "Admin read monitoring_events" ON monitoring_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('executive', 'operations')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Service role full access monitoring_events" ON monitoring_events FOR ALL
  USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Admin read health_snapshots" ON health_snapshots FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('executive', 'operations')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Service role full access health_snapshots" ON health_snapshots FOR ALL
  USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
