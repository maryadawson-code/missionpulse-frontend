import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockGetUser, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser } }
  return { mockFrom, mockGetUser, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn().mockResolvedValue(mockSupabase) }))

function makeChain(overrides: Record<string, unknown> = {}) {
  const c: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
  }
  for (const k of Object.keys(c)) { if (!overrides[k]) c[k] = vi.fn().mockReturnValue(c) }
  Object.assign(c, overrides)
  return c
}

import { isOnboardingComplete, completeOnboarding, resetOnboarding } from '@/lib/utils/onboarding'

describe('isOnboardingComplete', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns true when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await isOnboardingComplete()).toBe(true)
  })
  it('returns true when onboarding_complete is true', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: { preferences: { onboarding_complete: true } }, error: null }) }))
    expect(await isOnboardingComplete()).toBe(true)
  })
  it('returns false when onboarding_complete is false', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: { preferences: { onboarding_complete: false } }, error: null }) }))
    expect(await isOnboardingComplete()).toBe(false)
  })
  it('returns false when preferences null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: { preferences: null }, error: null }) }))
    expect(await isOnboardingComplete()).toBe(false)
  })
})

describe('completeOnboarding', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns false when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await completeOnboarding()).toEqual({ success: false })
  })
  it('completes onboarding', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { preferences: { theme: 'dark' } }, error: null }) })
      const c = makeChain(); c.eq = vi.fn().mockResolvedValue({ error: null }); return c
    })
    expect(await completeOnboarding()).toEqual({ success: true })
  })
})

describe('resetOnboarding', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns false when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await resetOnboarding()).toEqual({ success: false })
  })
  it('resets onboarding', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { preferences: { onboarding_complete: true } }, error: null }) })
      const c = makeChain(); c.eq = vi.fn().mockResolvedValue({ error: null }); return c
    })
    expect(await resetOnboarding()).toEqual({ success: true })
  })
})
