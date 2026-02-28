/**
 * Performance Monitor — lightweight instrumentation for key flows.
 *
 * Tracks timing for named operations, maintains a sliding window of
 * metrics, and provides p50/p95/p99 latency calculations.
 *
 * Server-only utility.
 */
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('perf')

// ─── Types ───────────────────────────────────────────────────

export interface PerfEntry {
  operation: string
  duration_ms: number
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface PerfSummary {
  operation: string
  count: number
  p50_ms: number
  p95_ms: number
  p99_ms: number
  avg_ms: number
  min_ms: number
  max_ms: number
}

// ─── Config ──────────────────────────────────────────────────

const MAX_ENTRIES_PER_OPERATION = 500 // sliding window
const P95_ALERT_THRESHOLD_MS = Number(
  process.env.PERF_P95_ALERT_THRESHOLD_MS ?? '2000'
)

// ─── Storage ─────────────────────────────────────────────────

const metricsStore = new Map<string, PerfEntry[]>()

// ─── Core API ────────────────────────────────────────────────

/**
 * Record a performance measurement.
 */
export function recordMetric(entry: PerfEntry): void {
  const entries = metricsStore.get(entry.operation) ?? []
  entries.push(entry)

  // Sliding window — trim old entries
  if (entries.length > MAX_ENTRIES_PER_OPERATION) {
    entries.splice(0, entries.length - MAX_ENTRIES_PER_OPERATION)
  }

  metricsStore.set(entry.operation, entries)

  // Log p95 alerts
  if (entries.length >= 10) {
    const sorted = entries.map((e) => e.duration_ms).sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p95 = sorted[p95Index]
    if (p95 > P95_ALERT_THRESHOLD_MS) {
      log.warn('P95 threshold exceeded', {
        operation: entry.operation,
        p95_ms: p95,
        threshold_ms: P95_ALERT_THRESHOLD_MS,
      })
    }
  }
}

/**
 * Time an async operation and record the metric automatically.
 *
 * Usage:
 *   const result = await withTiming('pipeline.list', () =>
 *     supabase.from('opportunities').select('*')
 *   )
 */
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const duration_ms = Math.round(performance.now() - start)
    recordMetric({
      operation,
      duration_ms,
      timestamp: new Date().toISOString(),
      metadata,
    })
  }
}

/**
 * Get performance summary for a specific operation.
 */
export function getOperationSummary(operation: string): PerfSummary | null {
  const entries = metricsStore.get(operation)
  if (!entries || entries.length === 0) return null

  return computeSummary(operation, entries)
}

/**
 * Get performance summaries for all tracked operations.
 */
export function getAllSummaries(): PerfSummary[] {
  const summaries: PerfSummary[] = []
  const storeEntries = Array.from(metricsStore.entries())

  for (const [operation, entries] of storeEntries) {
    if (entries.length > 0) {
      summaries.push(computeSummary(operation, entries))
    }
  }

  return summaries.sort((a, b) => b.p95_ms - a.p95_ms)
}

/**
 * Get raw entries for an operation (for detailed analysis).
 */
export function getEntries(operation: string): PerfEntry[] {
  return [...(metricsStore.get(operation) ?? [])]
}

/**
 * Clear all metrics (for testing).
 */
export function clearMetrics(): void {
  metricsStore.clear()
}

// ─── Helpers ─────────────────────────────────────────────────

function computeSummary(
  operation: string,
  entries: PerfEntry[]
): PerfSummary {
  const durations = entries
    .map((e) => e.duration_ms)
    .sort((a, b) => a - b)

  const count = durations.length
  const sum = durations.reduce((a, b) => a + b, 0)

  return {
    operation,
    count,
    p50_ms: percentile(durations, 0.5),
    p95_ms: percentile(durations, 0.95),
    p99_ms: percentile(durations, 0.99),
    avg_ms: Math.round(sum / count),
    min_ms: durations[0],
    max_ms: durations[count - 1],
  }
}

function percentile(sorted: number[], p: number): number {
  const index = Math.floor(sorted.length * p)
  return sorted[Math.min(index, sorted.length - 1)]
}
