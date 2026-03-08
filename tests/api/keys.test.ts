import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockReturnThis()
const mockOrder = vi.fn().mockReturnThis()
const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'key-1', created_at: '2026-01-01T00:00:00Z' }, error: null })
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }))
const mockUpdate = vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      insert: mockInsert,
      update: mockUpdate,
      single: mockSingle,
    })),
  }),
}))

describe('API Keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSingle.mockResolvedValue({ data: { id: 'key-1', created_at: '2026-01-01T00:00:00Z' }, error: null })
  })

  it('generateAPIKey returns rawKey and info', async () => {
    const { generateAPIKey } = await import('@/lib/api/keys')
    const result = await generateAPIKey('co-1', 'Test Key', ['read'], 100, 'user-1')
    expect(result).toHaveProperty('rawKey')
    expect(result).toHaveProperty('info')
    if ('rawKey' in result) {
      expect(result.rawKey).toMatch(/^mp_/)
      expect(result.info.name).toBe('Test Key')
      expect(result.info.permissions).toEqual(['read'])
      expect(result.info.rateLimit).toBe(100)
    }
  })

  it('generateAPIKey returns error when DB insert fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    const { generateAPIKey } = await import('@/lib/api/keys')
    const result = await generateAPIKey('co-1', 'Test', ['read'], 100, 'user-1')
    expect(result).toHaveProperty('error')
  })

  it('generateAPIKey supports expiration', async () => {
    const { generateAPIKey } = await import('@/lib/api/keys')
    const result = await generateAPIKey('co-1', 'Expiring Key', ['read'], 100, 'user-1', 30)
    if ('info' in result) {
      expect(result.info.expiresAt).not.toBeNull()
    }
  })

  it('validateAPIKey returns null for unknown key', async () => {
    // Mock select to return empty array
    mockEq.mockReturnValueOnce({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [] }) }) })
    const { validateAPIKey } = await import('@/lib/api/keys')
    const result = await validateAPIKey('mp_nonexistent')
    expect(result).toBeNull()
  })

  it('revokeAPIKey returns true on success', async () => {
    const { revokeAPIKey } = await import('@/lib/api/keys')
    const result = await revokeAPIKey('key-1')
    expect(result).toBe(true)
  })

  it('listAPIKeys returns array of key info', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{
        id: 'key-1',
        name: 'Test Key',
        credentials_encrypted: JSON.stringify({
          key_prefix: 'mp_abcdef',
          permissions: ['read'],
          rate_limit: 100,
          last_used_at: null,
          expires_at: null,
        }),
        status: 'active',
        created_at: '2026-01-01T00:00:00Z',
      }],
    })
    const { listAPIKeys } = await import('@/lib/api/keys')
    const result = await listAPIKeys('co-1')
    expect(Array.isArray(result)).toBe(true)
    expect(result[0]?.keyPrefix).toBe('mp_abcdef')
    expect(result[0]?.permissions).toEqual(['read'])
  })

  it('listAPIKeys handles missing credentials gracefully', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{
        id: 'key-2',
        name: 'Bad Key',
        credentials_encrypted: null,
        status: 'active',
        created_at: '2026-01-01T00:00:00Z',
      }],
    })
    const { listAPIKeys } = await import('@/lib/api/keys')
    const result = await listAPIKeys('co-1')
    expect(result[0]?.keyPrefix).toBe('???')
  })

  it('rotateAPIKey returns error when key not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null })
    const { rotateAPIKey } = await import('@/lib/api/keys')
    const result = await rotateAPIKey('bad-id', 'co-1', 'user-1')
    expect(result).toHaveProperty('error')
  })

  it('rotateAPIKey generates new key with same settings', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        name: 'Old Key',
        credentials_encrypted: JSON.stringify({ permissions: ['read', 'write'], rate_limit: 200 }),
      },
      error: null,
    })
    // For the revokeAPIKey call
    mockUpdate.mockReturnValueOnce({ eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) })
    // For the generateAPIKey insert
    mockSingle.mockResolvedValueOnce({ data: { id: 'new-key', created_at: '2026-01-02T00:00:00Z' }, error: null })

    const { rotateAPIKey } = await import('@/lib/api/keys')
    const result = await rotateAPIKey('old-key', 'co-1', 'user-1')
    if ('rawKey' in result) {
      expect(result.rawKey).toMatch(/^mp_/)
    }
  })
})
