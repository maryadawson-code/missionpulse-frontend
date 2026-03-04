-- Performance metrics persistence — stores periodic endpoint/operation latency snapshots
-- Enables historical trending across days/weeks in the admin performance dashboard

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type text NOT NULL CHECK (metric_type IN ('endpoint', 'operation')),
  name text NOT NULL,
  p50_ms integer NOT NULL,
  p95_ms integer NOT NULL,
  p99_ms integer NOT NULL,
  avg_ms integer NOT NULL,
  min_ms integer NOT NULL DEFAULT 0,
  max_ms integer NOT NULL,
  sample_count integer NOT NULL,
  health_status text NOT NULL CHECK (health_status IN ('healthy', 'degraded', 'critical')),
  measured_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view performance metrics"
  ON public.performance_metrics FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role can insert performance metrics"
  ON public.performance_metrics FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_performance_metrics_measured_at
  ON public.performance_metrics (measured_at DESC);
CREATE INDEX idx_performance_metrics_type_name
  ON public.performance_metrics (metric_type, name);
