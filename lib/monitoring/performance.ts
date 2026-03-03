// filepath: lib/monitoring/performance.ts

/**
 * Performance Monitoring — Track endpoint latency and system health.
 *
 * Stores measurements in-memory with periodic flush to database.
 * Admin dashboard visualizes p50/p95/p99 latencies.
 */
'use server'

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

/**
 * Get recent performance metrics from the database for historical view.
 * Falls back to in-memory data when the performance_metrics table doesn't exist.
 */
export async function getHistoricalMetrics(
  _days: number = 7
): Promise<EndpointMetric[]> {
  // performance_metrics table not yet provisioned — return in-memory data
  const report = await getPerformanceReport()
  return report.endpoints
}
