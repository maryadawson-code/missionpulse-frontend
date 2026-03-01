/**
 * Shared Supabase mock fixtures for unit tests.
 *
 * Provides chainable query builder mocks that match the
 * Supabase client's fluent API (.from().select().eq().single()).
 *
 * v1.8 Sprint 50 T-50.3
 */
import { vi } from 'vitest'

/**
 * Create a chainable mock query builder.
 * All chain methods return `this` for fluent chaining.
 * Terminal methods (single, maybeSingle) resolve with configurable data.
 */
export function createMockQueryBuilder(defaultData: unknown = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: defaultData, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: defaultData, error: null }),
    then: undefined as unknown,
  }

  // Make the builder thenable so `await supabase.from('x').select('*')` works
  builder.then = (resolve: (value: { data: unknown; error: null }) => void) =>
    resolve({ data: defaultData, error: null })

  return builder
}

/**
 * Create a mock Supabase client with auth and from() methods.
 */
export function createMockSupabaseClient(options?: {
  user?: { id: string; email: string } | null
  queryData?: unknown
}) {
  const user = options?.user ?? null
  const queryBuilder = createMockQueryBuilder(options?.queryData)

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
      from: vi.fn(() => queryBuilder),
    },
    queryBuilder,
  }
}
