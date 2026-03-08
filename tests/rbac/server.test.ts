/**
 * Tests for lib/rbac/server.ts — Server-side RBAC enforcement
 *
 * Mocks next/headers, @supabase/ssr, and next/navigation to isolate
 * the server RBAC functions from real infrastructure.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock: next/headers — cookies()
// ---------------------------------------------------------------------------
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

// ---------------------------------------------------------------------------
// Mock: next/navigation — redirect() throws like real Next.js
// ---------------------------------------------------------------------------
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

// ---------------------------------------------------------------------------
// Mock: @supabase/ssr — createServerClient returns a controllable client
// ---------------------------------------------------------------------------
const mockGetUser = vi.fn()
const mockMfaGetAAL = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      mfa: {
        getAuthenticatorAssuranceLevel: mockMfaGetAAL,
      },
    },
    from: mockFrom,
  })),
}))

// ---------------------------------------------------------------------------
// Import the module under test and the mocked redirect for assertions
// ---------------------------------------------------------------------------
import {
  getCurrentRole,
  requireModuleAccess,
  requireAdmin,
  requireSensitiveAccess,
  requireMFA,
} from '@/lib/rbac/server'
import { redirect } from 'next/navigation'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Set up the mock chain so supabase.from('profiles').select().eq().single() resolves. */
function mockProfileQuery(role: string | null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: role ? { role } : null, error: null }),
  }
  mockFrom.mockReturnValue(chain)
  return chain
}

/** Convenience: set up an authenticated user with a given DB role. */
function setupAuthenticatedUser(userId: string, dbRole: string | null) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  })
  mockProfileQuery(dbRole)
}

/** Extract the redirect URL from the thrown error. */
function redirectUrl(error: unknown): string {
  return (error as Error).message.replace('REDIRECT:', '')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lib/rbac/server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-apply the throwing behavior since clearAllMocks resets it
    vi.mocked(redirect).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`)
    })
  })

  // ── getCurrentRole ──────────────────────────────────────────────

  describe('getCurrentRole', () => {
    it('redirects to /login when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      await expect(getCurrentRole()).rejects.toThrow('REDIRECT:/login')
      expect(redirect).toHaveBeenCalledWith('/login')
    })

    it('returns correct ServerRoleInfo for an authenticated executive', async () => {
      setupAuthenticatedUser('user-123', 'executive')

      const info = await getCurrentRole()

      expect(info).toEqual({
        userId: 'user-123',
        dbRole: 'executive',
        role: 'executive',
        displayName: 'Executive / Admin',
        isInternal: true,
      })
    })

    it('defaults to viewer (resolves to partner) when profile has no role', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-no-profile' } },
        error: null,
      })
      mockProfileQuery(null)

      const info = await getCurrentRole()

      // dbRole defaults to 'viewer', resolveRole('viewer') -> 'partner'
      expect(info.dbRole).toBe('viewer')
      expect(info.role).toBe('partner')
      expect(info.displayName).toBe('Teaming Partner')
      expect(info.isInternal).toBe(false)
    })
  })

  // ── requireModuleAccess ─────────────────────────────────────────

  describe('requireModuleAccess', () => {
    it('returns role info when user has sufficient access', async () => {
      // Executive has admin: shouldRender=true, canView=true, canEdit=true
      setupAuthenticatedUser('admin-1', 'executive')

      const info = await requireModuleAccess('admin', 'view')
      expect(info.role).toBe('executive')
      expect(info.userId).toBe('admin-1')
    })

    it('redirects to /dashboard when user lacks access', async () => {
      // Partner has admin: shouldRender=false, canView=false, canEdit=false
      setupAuthenticatedUser('partner-1', 'partner')

      await expect(requireModuleAccess('admin', 'view')).rejects.toThrow('REDIRECT:/dashboard')
      expect(redirect).toHaveBeenCalledWith('/dashboard')
    })

    it('checks render level — allows when shouldRender is true', async () => {
      // Partner has proposals: shouldRender=true
      setupAuthenticatedUser('partner-2', 'partner')

      const info = await requireModuleAccess('proposals', 'render')
      expect(info.role).toBe('partner')
    })

    it('checks view level — requires shouldRender AND canView', async () => {
      // Partner has dashboard: shouldRender=false, canView=false
      setupAuthenticatedUser('partner-3', 'partner')

      await expect(requireModuleAccess('dashboard', 'view')).rejects.toThrow('REDIRECT:/dashboard')
    })

    it('checks edit level — requires shouldRender AND canView AND canEdit', async () => {
      // Executive has dashboard: shouldRender=true, canView=true, canEdit=false
      setupAuthenticatedUser('exec-2', 'executive')

      await expect(requireModuleAccess('dashboard', 'edit')).rejects.toThrow('REDIRECT:/dashboard')
    })

    it('allows edit when all three permission flags are true', async () => {
      // Executive has proposals: shouldRender=true, canView=true, canEdit=true
      setupAuthenticatedUser('exec-3', 'executive')

      const info = await requireModuleAccess('proposals', 'edit')
      expect(info.role).toBe('executive')
    })
  })

  // ── requireAdmin ────────────────────────────────────────────────

  describe('requireAdmin', () => {
    it('allows executive (has admin access)', async () => {
      setupAuthenticatedUser('exec-admin', 'executive')

      const info = await requireAdmin()
      expect(info.role).toBe('executive')
    })

    it('redirects non-admin roles to /dashboard', async () => {
      setupAuthenticatedUser('partner-admin', 'partner')

      await expect(requireAdmin()).rejects.toThrow('REDIRECT:/dashboard')
      expect(redirect).toHaveBeenCalledWith('/dashboard')
    })
  })

  // ── requireSensitiveAccess ──────────────────────────────────────

  describe('requireSensitiveAccess', () => {
    it('calls requireMFA after verifying module permission', async () => {
      // Executive has pricing: shouldRender=true, canView=true
      setupAuthenticatedUser('exec-sensitive', 'executive')
      mockMfaGetAAL.mockResolvedValue({
        data: { currentLevel: 'aal2', nextLevel: 'aal2' },
        error: null,
      })

      const info = await requireSensitiveAccess('pricing')

      expect(info.role).toBe('executive')
      expect(mockMfaGetAAL).toHaveBeenCalled()
    })

    it('redirects to /mfa if user only has aal1', async () => {
      setupAuthenticatedUser('exec-nomfa', 'executive')
      mockMfaGetAAL.mockResolvedValue({
        data: { currentLevel: 'aal1', nextLevel: 'aal2' },
        error: null,
      })

      await expect(requireSensitiveAccess('pricing')).rejects.toThrow('REDIRECT:/mfa')
    })

    it('redirects to /dashboard if user lacks module permission (before MFA check)', async () => {
      // Partner cannot access pricing
      setupAuthenticatedUser('partner-sens', 'partner')

      await expect(requireSensitiveAccess('pricing')).rejects.toThrow('REDIRECT:/dashboard')
      // MFA should NOT have been checked since module access was denied first
      expect(mockMfaGetAAL).not.toHaveBeenCalled()
    })
  })

  // ── requireMFA ──────────────────────────────────────────────────

  describe('requireMFA', () => {
    it('redirects to /mfa when currentLevel is aal1 and nextLevel is aal2', async () => {
      mockMfaGetAAL.mockResolvedValue({
        data: { currentLevel: 'aal1', nextLevel: 'aal2' },
        error: null,
      })

      await expect(requireMFA()).rejects.toThrow('REDIRECT:/mfa')
      expect(redirect).toHaveBeenCalledWith('/mfa')
    })

    it('passes when user is at aal2', async () => {
      mockMfaGetAAL.mockResolvedValue({
        data: { currentLevel: 'aal2', nextLevel: 'aal2' },
        error: null,
      })

      await expect(requireMFA()).resolves.toBeUndefined()
    })

    it('redirects to /mfa when MFA check returns an error', async () => {
      mockMfaGetAAL.mockResolvedValue({
        data: null,
        error: new Error('MFA service unavailable'),
      })

      await expect(requireMFA()).rejects.toThrow('REDIRECT:/mfa')
      expect(redirect).toHaveBeenCalledWith('/mfa')
    })
  })
})
