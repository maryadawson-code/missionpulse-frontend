import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockGetUser, mockRpc, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockRpc = vi.fn()
  const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser }, rpc: mockRpc }
  return { mockFrom, mockGetUser, mockRpc, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn().mockResolvedValue(mockSupabase) }))

function makeChain(overrides: Record<string, unknown> = {}) {
  const c: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  }
  for (const k of Object.keys(c)) { if (!overrides[k]) c[k] = vi.fn().mockReturnValue(c) }
  Object.assign(c, overrides)
  return c
}

import { isSoloMode, getSoloPhaseConfig, getSoloGateStatus, approveSoloGate, getSoloModePermissions } from '@/lib/utils/solo-mode'

describe('isSoloMode', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns true from rpc', async () => {
    mockRpc.mockResolvedValue({ data: true })
    expect(await isSoloMode()).toBe(true)
  })
  it('returns false from rpc', async () => {
    mockRpc.mockResolvedValue({ data: false })
    expect(await isSoloMode()).toBe(false)
  })
  it('falls back when rpc throws', async () => {
    mockRpc.mockRejectedValue(new Error('no function'))
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { company_id: 'c1' }, error: null }) })
      return makeChain({ single: vi.fn().mockResolvedValue({ data: { max_users: 1, subscription_tier: 'solo' }, error: null }) })
    })
    expect(await isSoloMode()).toBe(true)
  })
  it('returns true when no user (fallback)', async () => {
    mockRpc.mockRejectedValue(new Error('no function'))
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await isSoloMode()).toBe(false)
  })
  it('returns true when no company', async () => {
    mockRpc.mockRejectedValue(new Error('no function'))
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }))
    expect(await isSoloMode()).toBe(true)
  })
})

describe('getSoloPhaseConfig', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns config array', async () => {
    mockFrom.mockReturnValue(makeChain({ order: vi.fn().mockResolvedValue({ data: [{ id: 'p1' }] }) }))
    expect(await getSoloPhaseConfig()).toEqual([{ id: 'p1' }])
  })
  it('returns empty when null', async () => {
    mockFrom.mockReturnValue(makeChain({ order: vi.fn().mockResolvedValue({ data: null }) }))
    expect(await getSoloPhaseConfig()).toEqual([])
  })
})

describe('getSoloGateStatus', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns gate statuses', async () => {
    mockFrom.mockReturnValue(makeChain({ order: vi.fn().mockResolvedValue({ data: [{ gate_id: 'g1' }] }) }))
    expect(await getSoloGateStatus('o1')).toEqual([{ gate_id: 'g1' }])
  })
  it('returns empty when null', async () => {
    mockFrom.mockReturnValue(makeChain({ order: vi.fn().mockResolvedValue({ data: null }) }))
    expect(await getSoloGateStatus('o1')).toEqual([])
  })
})

describe('approveSoloGate', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await approveSoloGate('o1', 'g1', 'Gate 1', 1)).toEqual({ success: false, error: 'Not authenticated' })
  })
  it('approves gate successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { company_id: 'c1' }, error: null }) })
      return makeChain({ upsert: vi.fn().mockResolvedValue({ error: null }) })
    })
    expect(await approveSoloGate('o1', 'g1', 'Gate 1', 1, 'Approved')).toEqual({ success: true })
  })
})

describe('getSoloModePermissions', () => {
  it('returns all modules with full access', () => {
    const perms = getSoloModePermissions()
    expect(Object.keys(perms).length).toBeGreaterThan(10)
    expect(perms.dashboard).toEqual({ shouldRender: true, canView: true, canEdit: true })
    expect(perms.pipeline).toEqual({ shouldRender: true, canView: true, canEdit: true })
    expect(perms.admin).toEqual({ shouldRender: true, canView: true, canEdit: true })
  })
})
