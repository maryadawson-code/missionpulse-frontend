// filepath: lib/rbac/__tests__/hooks.test.ts
/**
 * Tests for RBAC React hooks — useRole, useModuleAccess, useVisibleNav.
 * Verifies fail-closed loading states, role resolution, and permission gating.
 * v1.6 T-43.2
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ─── Mock Supabase browser client ────────────────────────────────
const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: mockSingle,
}))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

import { useRole } from '../hooks'
import { useModuleAccess } from '../hooks'
import { useVisibleNav } from '../hooks'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Helper: set up mocks for a specific role ────────────────────
function mockUser(userId: string, role: string) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } })
  mockSingle.mockResolvedValue({ data: { role } })
}

function mockNoUser() {
  mockGetUser.mockResolvedValue({ data: { user: null } })
}

// ─── useRole ─────────────────────────────────────────────────────

describe('useRole()', () => {
  it('returns loading=true initially and fail-closed defaults', () => {
    // Never resolve — keeps hook in loading state
    mockGetUser.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useRole())

    expect(result.current.loading).toBe(true)
    expect(result.current.dbRole).toBeNull()
    expect(result.current.role).toBe('partner') // resolveRole(null)
  })

  it('resolves executive role after fetch', async () => {
    mockUser('user-001', 'executive')

    const { result } = renderHook(() => useRole())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.dbRole).toBe('executive')
    expect(result.current.role).toBe('executive')
    expect(result.current.displayName).toBe('Executive / Admin')
    expect(result.current.isInternal).toBe(true)
  })

  it('resolves partner role (external) correctly', async () => {
    mockUser('user-002', 'partner')

    const { result } = renderHook(() => useRole())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.role).toBe('partner')
    expect(result.current.isInternal).toBe(false)
  })

  it('falls back to partner when no user is authenticated', async () => {
    mockNoUser()

    const { result } = renderHook(() => useRole())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.dbRole).toBeNull()
    expect(result.current.role).toBe('partner')
  })

  it('resolves legacy "ceo" role to executive', async () => {
    mockUser('user-003', 'ceo')

    const { result } = renderHook(() => useRole())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.dbRole).toBe('ceo')
    expect(result.current.role).toBe('executive')
  })
})

// ─── useModuleAccess ─────────────────────────────────────────────

describe('useModuleAccess()', () => {
  it('returns fail-closed permissions while loading', () => {
    mockGetUser.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useModuleAccess('pipeline'))

    expect(result.current.loading).toBe(true)
    expect(result.current.shouldRender).toBe(false)
    expect(result.current.canView).toBe(false)
    expect(result.current.canEdit).toBe(false)
  })

  it('executive has full pipeline access', async () => {
    mockUser('user-001', 'executive')

    const { result } = renderHook(() => useModuleAccess('pipeline'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.shouldRender).toBe(true)
    expect(result.current.canView).toBe(true)
    expect(result.current.canEdit).toBe(true)
  })

  it('partner has no pipeline access (invisible RBAC)', async () => {
    mockUser('user-002', 'partner')

    const { result } = renderHook(() => useModuleAccess('pipeline'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.shouldRender).toBe(false)
    expect(result.current.canView).toBe(false)
    expect(result.current.canEdit).toBe(false)
  })

  it('partner has scoped proposal access', async () => {
    mockUser('user-002', 'partner')

    const { result } = renderHook(() => useModuleAccess('proposals'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.shouldRender).toBe(true)
    expect(result.current.canView).toBe(true)
    expect(result.current.canEdit).toBe(true)
    expect(result.current.scopeRestriction).toBe('assigned_sections_only')
  })
})

// ─── useVisibleNav ───────────────────────────────────────────────

describe('useVisibleNav()', () => {
  it('returns empty arrays while loading (fail-closed nav)', () => {
    mockGetUser.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useVisibleNav())

    expect(result.current.loading).toBe(true)
    expect(result.current.primary).toEqual([])
    expect(result.current.secondary).toEqual([])
    expect(result.current.admin).toEqual([])
  })

  it('executive sees admin nav items', async () => {
    mockUser('user-001', 'executive')

    const { result } = renderHook(() => useVisibleNav())

    await waitFor(() => expect(result.current.loading).toBe(false))

    const adminModules = result.current.admin.map((i) => i.module)
    expect(adminModules).toContain('admin')
    expect(adminModules).toContain('audit_log')
  })

  it('partner sees NO admin nav items', async () => {
    mockUser('user-002', 'partner')

    const { result } = renderHook(() => useVisibleNav())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.admin).toHaveLength(0)
  })

  it('executive has primary nav items for core modules', async () => {
    mockUser('user-001', 'executive')

    const { result } = renderHook(() => useVisibleNav())

    await waitFor(() => expect(result.current.loading).toBe(false))

    const primaryModules = result.current.primary.map((i) => i.module)
    expect(primaryModules).toContain('dashboard')
    expect(primaryModules).toContain('pipeline')
    expect(primaryModules).toContain('proposals')
  })
})
