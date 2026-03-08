import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSupabaseFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  }),
}))

vi.mock('@/lib/rbac/config', () => ({
  resolveRole: vi.fn((role: string) => role ?? 'author'),
  hasPermission: vi.fn((role: string, _section: string, _action: string) => role === 'executive'),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(),
  }),
}))

const mockAdminUnlockAccount = vi.fn()
vi.mock('@/lib/security/brute-force', () => ({
  adminUnlockAccount: (...args: unknown[]) => mockAdminUnlockAccount(...args),
}))

vi.mock('@/lib/api/schemas', () => {
  const { z } = require('zod')
  return {
    updateUserRoleSchema: z.object({
      targetUserId: z.string().uuid('Invalid user ID'),
      newRole: z.string().min(1),
    }),
  }
})

vi.mock('@/lib/utils/validation', () => {
  const { z } = require('zod')
  return {
    emailSchema: z.string().email(),
  }
})

import { updateUserRole, unlockUserAccount } from '@/lib/actions/admin'

describe('lib/actions/admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1', email: 'admin@test.com' } },
      error: null,
    })
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'executive', full_name: 'Admin User' },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [{}], error: null }),
          }),
        }
      }
      // audit_logs, activity_log
      return {
        insert: vi.fn().mockResolvedValue({ data: [{}], error: null }),
      }
    })
  })

  // ── updateUserRole ───────────────────────────────────────
  describe('updateUserRole', () => {
    it('returns error for invalid targetUserId', async () => {
      const result = await updateUserRole('not-a-uuid', 'executive')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid')
    })

    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await updateUserRole('550e8400-e29b-41d4-a716-446655440000', 'executive')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })

    it('returns error when caller lacks admin permission', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: 'author', full_name: 'Regular User' },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { insert: vi.fn().mockResolvedValue({ data: [], error: null }) }
      })
      const result = await updateUserRole('550e8400-e29b-41d4-a716-446655440000', 'executive')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient permissions')
    })

    it('updates role successfully', async () => {
      const result = await updateUserRole('550e8400-e29b-41d4-a716-446655440000', 'operations')
      expect(result.success).toBe(true)
    })

    it('returns error when profile update fails', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: 'executive', full_name: 'Admin' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
            }),
          }
        }
        return { insert: vi.fn().mockResolvedValue({ data: [], error: null }) }
      })
      const result = await updateUserRole('550e8400-e29b-41d4-a716-446655440000', 'operations')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  // ── unlockUserAccount ────────────────────────────────────
  describe('unlockUserAccount', () => {
    it('returns error for invalid email', async () => {
      const result = await unlockUserAccount('not-an-email')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email address')
    })

    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await unlockUserAccount('user@test.com')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })

    it('returns error when caller lacks admin permission', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: 'author', full_name: 'Nobody' },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { insert: vi.fn().mockResolvedValue({ data: [], error: null }) }
      })
      const result = await unlockUserAccount('user@test.com')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient permissions')
    })

    it('returns error when Redis unlock fails', async () => {
      mockAdminUnlockAccount.mockResolvedValue(false)
      const result = await unlockUserAccount('user@test.com')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Redis')
    })

    it('unlocks account successfully', async () => {
      mockAdminUnlockAccount.mockResolvedValue(true)
      const result = await unlockUserAccount('user@test.com')
      expect(result.success).toBe(true)
    })
  })
})
