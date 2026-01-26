-- MissionPulse Sprint 15 Migration
-- Tables: notifications, saved_filters
-- Run this in Supabase SQL Editor

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('due_soon', 'phase_stuck', 'p0_alert', 'assignment', 'comment_mention')),
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_opportunity_id ON notifications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE NOT dismissed;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy (allow all for now - update for production)
CREATE POLICY "Allow all notifications operations" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SAVED_FILTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_saved_filters_is_default ON saved_filters(is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- RLS Policy (allow all for now - update for production)
CREATE POLICY "Allow all saved_filters operations" ON saved_filters
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to ensure only one default filter
CREATE OR REPLACE FUNCTION ensure_single_default_filter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE saved_filters SET is_default = false WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for single default filter
DROP TRIGGER IF EXISTS trigger_ensure_single_default_filter ON saved_filters;
CREATE TRIGGER trigger_ensure_single_default_filter
  BEFORE INSERT OR UPDATE OF is_default ON saved_filters
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_filter();

-- ============================================================
-- SEED DATA: Built-in Quick Presets
-- ============================================================
INSERT INTO saved_filters (name, filters, is_default) VALUES
  ('Due This Week', '{"dueDateEnd": "7_days_from_now"}', false),
  ('High Priority', '{"priorities": ["P-0", "P-1"]}', false),
  ('Active Pipeline', '{"excludePhases": ["submitted", "awarded", "lost"]}', false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Check tables were created
SELECT 'notifications' as table_name, COUNT(*) as row_count FROM notifications
UNION ALL
SELECT 'saved_filters' as table_name, COUNT(*) as row_count FROM saved_filters;
