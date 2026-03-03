/**
 * Performance Timing Middleware — lightweight request duration tracking.
 *
 * Records request duration for dashboard routes only (not static assets).
 * Integrates with the performance monitoring system.
 *
 * Usage: Call `startTiming()` at request start, `endTiming()` at response.
 * The middleware.ts in the app root handles the actual interception.
 */

import { trackEndpoint } from './performance'

// Only instrument these route prefixes
const INSTRUMENTED_PREFIXES = [
  '/dashboard',
  '/pipeline',
  '/ai-chat',
  '/proposals',
  '/compliance',
  '/analytics',
  '/admin',
  '/api/',
]

/**
 * Check if a pathname should be instrumented.
 */
export function shouldInstrument(pathname: string): boolean {
  return INSTRUMENTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Record a request timing measurement.
 * Call this with the pathname and duration in milliseconds.
 */
export async function recordTiming(
  pathname: string,
  durationMs: number
): Promise<void> {
  if (!shouldInstrument(pathname)) return

  // Normalize dynamic segments: /pipeline/abc-123 → /pipeline/[id]
  const normalized = pathname
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
      '/[id]'
    )
    .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/[id]')

  await trackEndpoint(normalized, durationMs)
}
