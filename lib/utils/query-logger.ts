/**
 * Query Performance Logger — tracks slow Supabase queries.
 *
 * Wraps Supabase query execution with timing. Logs queries
 * that exceed the slow query threshold (default 500ms).
 *
 * Server-only utility.
 */
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('query')

// ─── Config ──────────────────────────────────────────────────

const SLOW_QUERY_THRESHOLD_MS = Number(
  process.env.SLOW_QUERY_THRESHOLD_MS ?? '500'
)

// ─── Types ───────────────────────────────────────────────────

interface QueryMetrics {
  table: string
  operation: string
  duration_ms: number
  row_count: number
  timestamp: string
}

// In-memory buffer for slow queries (flushed to logs)
const slowQueryBuffer: QueryMetrics[] = []
const MAX_BUFFER_SIZE = 100

// ─── Core ────────────────────────────────────────────────────

/**
 * Time a Supabase query and log if it exceeds the threshold.
 *
 * Usage:
 *   const { data } = await timedQuery('opportunities', 'select', () =>
 *     supabase.from('opportunities').select('*').order('updated_at', { ascending: false })
 *   )
 */
export async function timedQuery<T>(
  table: string,
  operation: string,
  queryFn: () => PromiseLike<{ data: T; error: { message: string } | null }>
): Promise<{ data: T; error: { message: string } | null; duration_ms: number }> {
  const start = performance.now()
  const result = await queryFn()
  const duration_ms = Math.round(performance.now() - start)

  if (duration_ms > SLOW_QUERY_THRESHOLD_MS) {
    const metrics: QueryMetrics = {
      table,
      operation,
      duration_ms,
      row_count: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0),
      timestamp: new Date().toISOString(),
    }

    // Buffer slow queries
    if (slowQueryBuffer.length < MAX_BUFFER_SIZE) {
      slowQueryBuffer.push(metrics)
    }

    log.warn('Slow query detected', {
      table,
      operation,
      duration_ms,
      threshold_ms: SLOW_QUERY_THRESHOLD_MS,
      row_count: metrics.row_count,
    })
  }

  return { ...result, duration_ms }
}

/**
 * Get buffered slow queries for monitoring/alerting.
 */
export function getSlowQueries(): QueryMetrics[] {
  return [...slowQueryBuffer]
}

/**
 * Clear the slow query buffer.
 */
export function clearSlowQueries(): void {
  slowQueryBuffer.length = 0
}

/**
 * Get summary statistics for slow queries.
 */
export function getQueryStats(): {
  total_slow_queries: number
  avg_duration_ms: number
  slowest_table: string | null
  slowest_duration_ms: number
} {
  if (slowQueryBuffer.length === 0) {
    return {
      total_slow_queries: 0,
      avg_duration_ms: 0,
      slowest_table: null,
      slowest_duration_ms: 0,
    }
  }

  const total = slowQueryBuffer.reduce((sum, q) => sum + q.duration_ms, 0)
  const slowest = slowQueryBuffer.reduce((max, q) =>
    q.duration_ms > max.duration_ms ? q : max
  )

  return {
    total_slow_queries: slowQueryBuffer.length,
    avg_duration_ms: Math.round(total / slowQueryBuffer.length),
    slowest_table: slowest.table,
    slowest_duration_ms: slowest.duration_ms,
  }
}
