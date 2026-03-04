// filepath: lib/monitoring/performance.ts

/**
 * Performance Monitoring — Track endpoint latency and system health.
 *
 * Stores measurements in-memory with periodic flush to database.
 * Admin dashboard visualizes p50/p95/p99 latencies.
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────

export interface EndpointMetric {
  endpoint: string
  p50: number
  p95: number
  p99: number
  sampleCount: number
  avgMs: number
  maxMs: number
  timestamp: string
}

export interface PerformanceReport {
  endpoints: EndpointMetric[]
  generatedAt: string
  healthStatus: 'healthy' | 'degraded' | 'critical'
}

// ─── In-Memory Buffer ───────────────────────────────────────

const measurements = new Map<string, number[]>()

/**
 * Record an endpoint timing measurement.
 */
export async function trackEndpoint(
  endpoint: string,
  durationMs: number
): Promise<void> {
  const existing = measurements.get(endpoint) ?? []
  existing.push(durationMs)

  // Keep last 1000 measurements per endpoint
  if (existing.length > 1000) {
    existing.splice(0, existing.length - 1000)
  }

  measurements.set(endpoint, existing)
}

/**
 * Get performance report for all tracked endpoints.
 */
export async function getPerformanceReport(): Promise<PerformanceReport> {
  const endpoints: EndpointMetric[] = []
  let worstP95 = 0

  for (const [endpoint, times] of Array.from(measurements.entries())) {
    if (times.length === 0) continue

    const sorted = [...times].sort((a, b) => a - b)
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0
    const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0
    const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)
    const max = sorted[sorted.length - 1] ?? 0

    if (p95 > worstP95) worstP95 = p95

    endpoints.push({
      endpoint,
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      sampleCount: sorted.length,
      avgMs: avg,
      maxMs: Math.round(max),
      timestamp: new Date().toISOString(),
    })
  }

  // Sort by p95 descending (slowest first)
  endpoints.sort((a, b) => b.p95 - a.p95)

  const healthStatus =
    worstP95 > 5000
      ? ('critical' as const)
      : worstP95 > 2000
        ? ('degraded' as const)
        : ('healthy' as const)

  return {
    endpoints,
    generatedAt: new Date().toISOString(),
    healthStatus,
  }
}

function classifyHealth(p95: number): 'healthy' | 'degraded' | 'critical' {
  if (p95 > 5000) return 'critical'
  if (p95 > 2000) return 'degraded'
  return 'healthy'
}

/**
 * Flush current in-memory metrics to the performance_metrics table.
 * Call periodically (e.g., from a cron or after a batch of requests).
 */
export async function flushMetrics(): Promise<void> {
  const report = await getPerformanceReport()
  if (report.endpoints.length === 0) return

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const rows = report.endpoints.map((ep) => ({
      metric_type: 'endpoint' as const,
      name: ep.endpoint,
      p50_ms: ep.p50,
      p95_ms: ep.p95,
      p99_ms: ep.p99,
      avg_ms: ep.avgMs,
      min_ms: 0,
      max_ms: ep.maxMs,
      sample_count: ep.sampleCount,
      health_status: classifyHealth(ep.p95),
      measured_at: now,
    }))

    await supabase.from('performance_metrics').insert(rows)
  } catch (err) {
    console.error('[perf] flushMetrics failed:', err)
  }
}

/**
 * Get historical performance metrics from the database.
 * Falls back to in-memory data if no DB records exist.
 */
export async function getHistoricalMetrics(
  days: number = 7
): Promise<EndpointMetric[]> {
  try {
    const supabase = await createClient()
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await supabase
      .from('performance_metrics')
      .select('name, p50_ms, p95_ms, p99_ms, avg_ms, max_ms, sample_count, measured_at')
      .eq('metric_type', 'endpoint')
      .gte('measured_at', since.toISOString())
      .order('measured_at', { ascending: false })
      .limit(200)

    if (error || !data || data.length === 0) {
      const report = await getPerformanceReport()
      return report.endpoints
    }

    return data.map((row) => ({
      endpoint: row.name,
      p50: row.p50_ms,
      p95: row.p95_ms,
      p99: row.p99_ms,
      sampleCount: row.sample_count,
      avgMs: row.avg_ms,
      maxMs: row.max_ms,
      timestamp: row.measured_at,
    }))
  } catch {
    const report = await getPerformanceReport()
    return report.endpoints
  }
}
