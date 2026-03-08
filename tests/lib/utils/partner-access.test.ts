import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockSupabase = {
    from: mockFrom,
    auth: { getUser: vi.fn() },
  }
  return { mockFrom, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

import {
  getPartnerAccess,
  checkAutoRevoke,
  revokePartnerAccess,
  getPartnerAllowedModules,
  PARTNER_BLOCKED_MODULES,
} from '@/lib/utils/partner-access'

function makeChain(singleResult: unknown = { data: null, error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(singleResult),
    update: vi.fn().mockReturnThis(),
  }
  return chain
}

describe('getPartnerAccess', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when profile not found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    expect(await getPartnerAccess('user-1', 'opp-1')).toBeNull()
  })

  it('returns null when role is not partner type', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { role: 'analyst', email: 'test@test.com' }, error: null }))
    expect(await getPartnerAccess('user-1', 'opp-1')).toBeNull()
  })

  it('returns null when no active partner_access found', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return makeChain({ data: { role: 'partner', email: 'test@test.com' }, error: null })
      }
      return makeChain({ data: null, error: null })
    })
    expect(await getPartnerAccess('user-1', 'opp-1')).toBeNull()
  })

  it('returns null when access is expired', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return makeChain({ data: { role: 'partner', email: 'test@test.com' }, error: null })
      }
      return makeChain({ data: { id: 'access-1', access_expires_at: pastDate }, error: null })
    })
    expect(await getPartnerAccess('user-1', 'opp-1')).toBeNull()
  })

  it('returns access record when valid', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString()
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return makeChain({ data: { role: 'partner', email: 'test@test.com' }, error: null })
      }
      return makeChain({ data: { id: 'access-1', access_expires_at: futureDate }, error: null })
    })
    const result = await getPartnerAccess('user-1', 'opp-1')
    expect(result).toEqual({ id: 'access-1', access_expires_at: futureDate })
  })
})

describe('checkAutoRevoke', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true when status is submitted', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { status: 'submitted' }, error: null }))
    expect(await checkAutoRevoke('opp-1')).toBe(true)
  })

  it('returns true when status is awarded', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { status: 'awarded' }, error: null }))
    expect(await checkAutoRevoke('opp-1')).toBe(true)
  })

  it('returns false for other statuses', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { status: 'active' }, error: null }))
    expect(await checkAutoRevoke('opp-1')).toBe(false)
  })
})

describe('revokePartnerAccess', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates partner_access to inactive', async () => {
    const chain = makeChain()
    let eqCount = 0
    chain.eq = vi.fn().mockImplementation(() => {
      eqCount++
      if (eqCount >= 2) return { error: null }
      return chain
    })
    mockFrom.mockReturnValue(chain)
    const result = await revokePartnerAccess('opp-1', 'user-1', 'submitted')
    expect(result.success).toBe(true)
  })
})

describe('getPartnerAllowedModules', () => {
  it('returns default modules when null', () => {
    expect(getPartnerAllowedModules(null)).toEqual(['pipeline', 'documents', 'proposals'])
  })
  it('returns default modules when empty', () => {
    expect(getPartnerAllowedModules([])).toEqual(['pipeline', 'documents', 'proposals'])
  })
  it('returns provided sections when not empty', () => {
    expect(getPartnerAllowedModules(['pipeline', 'compliance'])).toEqual(['pipeline', 'compliance'])
  })
})

describe('PARTNER_BLOCKED_MODULES', () => {
  it('contains expected blocked modules', () => {
    expect(PARTNER_BLOCKED_MODULES).toContain('pricing')
    expect(PARTNER_BLOCKED_MODULES).toContain('strategy')
    expect(PARTNER_BLOCKED_MODULES).toContain('blackhat')
    expect(PARTNER_BLOCKED_MODULES).toContain('admin')
    expect(PARTNER_BLOCKED_MODULES).toContain('analytics')
    expect(PARTNER_BLOCKED_MODULES).toContain('audit')
  })
})
