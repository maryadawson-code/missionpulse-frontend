/**
 * Supabase Query Utilities
 *
 * Helpers for parallel query execution and consistent error handling.
 * Prevents sequential waterfall patterns in Server Components.
 *
 * v1.4 Sprint 35 T-35.3
 */

/**
 * Resolve multiple Supabase queries with a single Promise.allSettled().
 * Each query that rejects returns { data: null, error }.
 * Fulfilled queries return { data, error: null }.
 *
 * Use when queries are independent and one failing shouldn't block others.
 */
export async function settledQueries<T extends readonly Promise<unknown>[]>(
  ...queries: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const results = await Promise.allSettled(queries)
  return results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : { data: null, error: { message: String(r.reason) }, count: null, status: 500, statusText: 'Error' }
  ) as { [K in keyof T]: Awaited<T[K]> }
}
