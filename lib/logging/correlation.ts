/**
 * Correlation ID Management
 *
 * Uses AsyncLocalStorage to propagate request-scoped correlation IDs
 * through the Node.js call stack without explicit threading.
 *
 * Middleware sets the ID at request entry; all downstream code reads it
 * via getCorrelationId().
 */
import { AsyncLocalStorage } from 'node:async_hooks'
import { headers } from 'next/headers'

const correlationStore = new AsyncLocalStorage<string>()

/**
 * Get the current correlation ID.
 * Priority: AsyncLocalStorage → x-request-id header → undefined.
 */
export function getCorrelationId(): string | undefined {
  const stored = correlationStore.getStore()
  if (stored) return stored

  try {
    const hdrs = headers()
    return hdrs.get('x-request-id') ?? undefined
  } catch {
    // headers() only works in server component/action context
    return undefined
  }
}

/**
 * Generate a new correlation ID (crypto.randomUUID).
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID()
}

/**
 * Run a function within a correlation context.
 * Used by middleware to set the ID for the request lifecycle.
 */
export function withCorrelationId<T>(id: string, fn: () => T): T {
  return correlationStore.run(id, fn)
}
