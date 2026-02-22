// filepath: tests/mocks/supabase.ts
/**
 * Mock Supabase Client for Testing
 * v1.3 Sprint 31
 *
 * Provides a chainable mock Supabase client that mimics the real
 * Supabase PostgREST API surface. Returns empty data by default.
 * Test files can extend this mock to return specific data.
 *
 * Usage:
 *   import { createMockSupabaseClient } from '@/tests/mocks/supabase'
 *   const client = createMockSupabaseClient()
 *   const { data } = await client.from('table').select('*').eq('id', '1').single()
 */

export function createMockSupabaseClient() {
  return {
    from: (_table: string) => ({
      select: (_cols?: string) => ({
        eq: (_col: string, _val: unknown) => ({
          single: async () => ({ data: null, error: null }),
          order: (_col2: string, _opts?: { ascending?: boolean }) => ({
            limit: (_n: number) => ({
              single: async () => ({ data: null, error: null }),
            }),
            data: [],
            error: null,
          }),
          limit: (_n: number) => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
        in: (_col: string, _vals: unknown[]) => ({
          data: [],
          error: null,
        }),
        order: (_col: string, _opts?: { ascending?: boolean }) => ({
          limit: (_n: number) => ({
            single: async () => ({ data: null, error: null }),
          }),
          data: [],
          error: null,
        }),
        neq: (_col: string, _val: unknown) => ({
          data: [],
          error: null,
        }),
      }),
      insert: (_data: unknown) => ({
        select: (_cols?: string) => ({
          single: async () => ({ data: null, error: null }),
        }),
        data: null,
        error: null,
      }),
      update: (_data: unknown) => ({
        eq: (_col: string, _val: unknown) => ({
          data: null,
          error: null,
        }),
      }),
      delete: () => ({
        eq: (_col: string, _val: unknown) => ({
          data: null,
          error: null,
        }),
      }),
    }),
    auth: {
      getUser: async () => ({
        data: { user: { id: 'test-user-id', email: 'test@missionpulse.io' } },
        error: null,
      }),
      getSession: async () => ({
        data: {
          session: {
            access_token: 'mock-access-token',
            user: { id: 'test-user-id', email: 'test@missionpulse.io' },
          },
        },
        error: null,
      }),
    },
    storage: {
      from: (_bucket: string) => ({
        upload: async (_path: string, _file: unknown) => ({
          data: { path: `mock/${_path}` },
          error: null,
        }),
        download: async (_path: string) => ({
          data: new Blob(['mock file content']),
          error: null,
        }),
        getPublicUrl: (_path: string) => ({
          data: { publicUrl: `https://mock.supabase.co/storage/v1/${_path}` },
        }),
        remove: async (_paths: string[]) => ({
          data: _paths.map((p) => ({ name: p })),
          error: null,
        }),
      }),
    },
    channel: (_name: string) => ({
      on: (_event: string, _opts: unknown, _callback: unknown) => ({
        subscribe: () => ({ status: 'SUBSCRIBED' }),
      }),
      unsubscribe: async () => {},
    }),
  }
}

/**
 * Create a mock Supabase client that returns specific data for a table.
 * Useful for testing functions that expect certain rows.
 */
export function createMockSupabaseClientWithData(
  tableData: Record<string, unknown[]>
) {
  return {
    from: (table: string) => {
      const data = tableData[table] ?? []
      return {
        select: (_cols?: string) => ({
          eq: (_col: string, _val: unknown) => ({
            single: async () => ({
              data: data.length > 0 ? data[0] : null,
              error: data.length > 0 ? null : { message: 'Not found' },
            }),
            order: (_col2: string, _opts?: { ascending?: boolean }) => ({
              limit: (_n: number) => ({
                single: async () => ({
                  data: data.length > 0 ? data[0] : null,
                  error: null,
                }),
              }),
              data,
              error: null,
            }),
            limit: (_n: number) => ({
              single: async () => ({
                data: data.length > 0 ? data[0] : null,
                error: null,
              }),
            }),
          }),
          in: (_col: string, _vals: unknown[]) => ({
            data,
            error: null,
          }),
          order: (_col: string, _opts?: { ascending?: boolean }) => ({
            limit: (_n: number) => ({
              single: async () => ({
                data: data.length > 0 ? data[0] : null,
                error: null,
              }),
            }),
            data,
            error: null,
          }),
          neq: (_col: string, _val: unknown) => ({
            data,
            error: null,
          }),
        }),
        insert: (_data: unknown) => ({
          select: (_cols?: string) => ({
            single: async () => ({ data: { id: 'mock-inserted-id' }, error: null }),
          }),
          data: null,
          error: null,
        }),
        update: (_data: unknown) => ({
          eq: (_col: string, _val: unknown) => ({ data: null, error: null }),
        }),
        delete: () => ({
          eq: (_col: string, _val: unknown) => ({ data: null, error: null }),
        }),
      }
    },
    auth: {
      getUser: async () => ({
        data: { user: { id: 'test-user-id', email: 'test@missionpulse.io' } },
        error: null,
      }),
    },
  }
}
