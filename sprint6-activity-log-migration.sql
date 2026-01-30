-- ============================================================
-- MISSIONPULSE SPRINT 6: Activity Log Table Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'phase_changed', 'deleted')),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  user_id TEXT DEFAULT 'system', -- Placeholder for future auth
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by opportunity
CREATE INDEX IF NOT EXISTS idx_activity_log_opportunity_id ON activity_log(opportunity_id);

-- Create index for faster lookups by timestamp (descending for recent first)
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (adjust for your auth requirements)
CREATE POLICY "Allow public read access on activity_log"
  ON activity_log
  FOR SELECT
  USING (true);

-- Create policy for public insert access (adjust for your auth requirements)
CREATE POLICY "Allow public insert access on activity_log"
  ON activity_log
  FOR INSERT
  WITH CHECK (true);

-- Create policy for public delete access (for cleanup)
CREATE POLICY "Allow public delete access on activity_log"
  ON activity_log
  FOR DELETE
  USING (true);

-- ============================================================
-- VERIFICATION QUERIES (Run these to verify the migration)
-- ============================================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'activity_log';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'activity_log';

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- INSERT INTO activity_log (opportunity_id, action, field_changed, old_value, new_value)
-- SELECT id, 'created', NULL, NULL, NULL
-- FROM opportunities
-- LIMIT 3;

-- ============================================================
-- CLEANUP (Only run if you need to reset)
-- ============================================================

-- DROP POLICY IF EXISTS "Allow public read access on activity_log" ON activity_log;
-- DROP POLICY IF EXISTS "Allow public insert access on activity_log" ON activity_log;
-- DROP POLICY IF EXISTS "Allow public delete access on activity_log" ON activity_log;
-- DROP TABLE IF EXISTS activity_log;
