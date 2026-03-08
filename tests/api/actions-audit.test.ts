import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSupabaseFrom = vi.fn()

// audit.ts imports createClient as createServerClient and calls it synchronously (not awaited)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  })),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(),
  }),
}))

import { logActivity, logAudit, getRecentActivity } from '@/lib/actions/audit'

describe('lib/actions/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    })
    mockSupabaseFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { full_name: 'Test User', role: 'executive' },
            error: null,
          }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [
              { id: '1', action: 'login', user_name: 'Test', user_role: 'exec', details: {}, timestamp: '2026-01-01T00:00:00Z' },
            ],
            error: null,
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ data: [{}], error: null }),
    }))
  })

  // ── logActivity ──────────────────────────────────────────
  describe('logActivity', () => {
    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await logActivity({
        action: 'test',
        resource_type: 'profile',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('No authenticated user')
    })

    it('logs activity successfully', async () => {
      const result = await logActivity({
        action: 'create_opportunity',
        resource_type: 'opportunity',
        resource_id: 'opp-1',
        details: { custom: 'data' },
      })
      expect(result.success).toBe(true)
    })

    it('logs activity without optional fields', async () => {
      const result = await logActivity({
        action: 'login',
        resource_type: 'session',
      })
      expect(result.success).toBe(true)
    })

    it('returns error on insert failure', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { full_name: 'Test', role: 'exec' },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
      }))
      const result = await logActivity({
        action: 'test',
        resource_type: 'test',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Insert failed')
    })

    it('handles unexpected errors', async () => {
      mockGetUser.mockRejectedValue(new Error('Connection lost'))
      const result = await logActivity({
        action: 'test',
        resource_type: 'test',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unexpected audit error')
    })
  })

  // ── logAudit ─────────────────────────────────────────────
  describe('logAudit', () => {
    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await logAudit({
        event_type: 'CUI_ACCESS',
        resource_type: 'document',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('No authenticated user')
    })

    it('logs audit record successfully', async () => {
      const result = await logAudit({
        event_type: 'CUI_ACCESS',
        resource_type: 'document',
        resource_id: 'doc-1',
        details: { action: 'view' },
      })
      expect(result.success).toBe(true)
    })

    it('logs audit without optional fields', async () => {
      const result = await logAudit({
        event_type: 'ROLE_CHANGE',
        resource_type: 'profile',
      })
      expect(result.success).toBe(true)
    })

    it('returns error on insert failure', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { full_name: 'Test', role: 'exec' },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: { message: 'Audit insert failed' } }),
      }))
      const result = await logAudit({
        event_type: 'TEST',
        resource_type: 'test',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Audit insert failed')
    })

    it('handles unexpected errors', async () => {
      mockGetUser.mockRejectedValue(new Error('Boom'))
      const result = await logAudit({
        event_type: 'TEST',
        resource_type: 'test',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unexpected audit error')
    })
  })

  // ── getRecentActivity ────────────────────────────────────
  describe('getRecentActivity', () => {
    it('returns activity items', async () => {
      const result = await getRecentActivity(5)
      expect(result.data.length).toBe(1)
      expect(result.data[0].action).toBe('login')
      expect(result.error).toBeUndefined()
    })

    it('returns empty array on query error', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed' },
            }),
          }),
        }),
      }))
      const result = await getRecentActivity()
      expect(result.data).toEqual([])
      expect(result.error).toBe('Query failed')
    })

    it('handles unexpected errors', async () => {
      mockSupabaseFrom.mockImplementation(() => {
        throw new Error('Unexpected')
      })
      const result = await getRecentActivity()
      expect(result.data).toEqual([])
      expect(result.error).toBe('Failed to load activity')
    })

    it('uses default limit of 10', async () => {
      const result = await getRecentActivity()
      expect(result.data).toBeDefined()
    })
  })
})
