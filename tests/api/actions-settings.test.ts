import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSupabaseFrom = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  }),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(),
  }),
}))

vi.mock('@/lib/security/sanitize', () => ({
  sanitizePlainText: vi.fn((s: string) => s),
}))

vi.mock('@/lib/api/schemas', () => {
  const { z } = require('zod')
  return {
    updateNotificationPreferencesSchema: z.array(
      z.object({
        notification_type: z.string().min(1),
        email_enabled: z.boolean(),
        in_app_enabled: z.boolean(),
        push_enabled: z.boolean(),
      })
    ),
  }
})

import { updateProfile, updatePassword, updateNotificationPreferences } from '@/lib/actions/settings'

describe('lib/actions/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    })
    mockSupabaseFrom.mockImplementation(() => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [{}], error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ data: [{}], error: null }),
      upsert: vi.fn().mockResolvedValue({ data: [{}], error: null }),
    }))
  })

  // ── updateProfile ────────────────────────────────────────
  describe('updateProfile', () => {
    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const fd = new FormData()
      fd.set('full_name', 'Test')
      const result = await updateProfile(fd)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })

    it('updates profile successfully', async () => {
      const fd = new FormData()
      fd.set('full_name', 'John Doe')
      fd.set('company', 'Test Corp')
      fd.set('phone', '555-1234')
      fd.set('avatar_url', 'https://example.com/avatar.png')
      const result = await updateProfile(fd)
      expect(result.success).toBe(true)
    })

    it('handles null form values', async () => {
      const fd = new FormData()
      const result = await updateProfile(fd)
      expect(result.success).toBe(true)
    })

    it('returns error when update fails', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
        }),
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      }))
      const fd = new FormData()
      fd.set('full_name', 'Fail')
      const result = await updateProfile(fd)
      expect(result.success).toBe(false)
      expect(result.error).toBe('DB error')
    })
  })

  // ── updatePassword ───────────────────────────────────────
  describe('updatePassword', () => {
    it('returns error for short password', async () => {
      const fd = new FormData()
      fd.set('new_password', 'short')
      const result = await updatePassword(fd)
      expect(result.success).toBe(false)
      expect(result.error).toContain('at least 8')
    })

    it('returns error for missing password', async () => {
      const fd = new FormData()
      const result = await updatePassword(fd)
      expect(result.success).toBe(false)
    })

    it('updates password successfully', async () => {
      mockUpdateUser.mockResolvedValue({ error: null })
      const fd = new FormData()
      fd.set('new_password', 'a-secure-password-123')
      const result = await updatePassword(fd)
      expect(result.success).toBe(true)
    })

    it('returns error when auth update fails', async () => {
      mockUpdateUser.mockResolvedValue({ error: { message: 'Auth error' } })
      const fd = new FormData()
      fd.set('new_password', 'a-secure-password-123')
      const result = await updatePassword(fd)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Auth error')
    })
  })

  // ── updateNotificationPreferences ────────────────────────
  describe('updateNotificationPreferences', () => {
    it('returns error for invalid input', async () => {
      const result = await updateNotificationPreferences([
        { notification_type: '', email_enabled: true, in_app_enabled: true, push_enabled: true },
      ])
      expect(result.success).toBe(false)
    })

    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await updateNotificationPreferences([
        { notification_type: 'email', email_enabled: true, in_app_enabled: true, push_enabled: false },
      ])
      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })

    it('saves preferences successfully', async () => {
      const result = await updateNotificationPreferences([
        { notification_type: 'email', email_enabled: true, in_app_enabled: true, push_enabled: false },
        { notification_type: 'push', email_enabled: false, in_app_enabled: true, push_enabled: true },
      ])
      expect(result.success).toBe(true)
    })

    it('returns error when upsert fails', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        upsert: vi.fn().mockResolvedValue({ error: { message: 'Upsert error' } }),
      }))
      const result = await updateNotificationPreferences([
        { notification_type: 'email', email_enabled: true, in_app_enabled: true, push_enabled: false },
      ])
      expect(result.success).toBe(false)
      expect(result.error).toBe('Upsert error')
    })
  })
})
