// filepath: lib/cache/__tests__/semantic-cache.test.ts
/**
 * Semantic Cache — company isolation tests (CMMC SC-4).
 * Verifies that different companyIds produce different cache keys,
 * preventing cross-tenant data leakage.
 * v1.6 T-43.3
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'

// ─── Mock Redis ──────────────────────────────────────────────────
const mockGet = vi.fn()
const mockSet = vi.fn()
const mockHincrby = vi.fn()

vi.mock('@/lib/cache/redis', () => ({
  getRedis: vi.fn(() => ({
    get: mockGet,
    set: mockSet,
    hincrby: mockHincrby,
  })),
}))

import {
  getCachedResponse,
  setCachedResponse,
  type CacheKeyInput,
} from '../semantic-cache'

beforeEach(() => {
  vi.clearAllMocks()
  mockGet.mockResolvedValue(null)
  mockSet.mockResolvedValue('OK')
  mockHincrby.mockResolvedValue(1)
})

// ─── Helper ──────────────────────────────────────────────────────

function makeInput(overrides: Partial<CacheKeyInput> = {}): CacheKeyInput {
  return {
    companyId: overrides.companyId ?? 'company-001',
    prompt: overrides.prompt ?? 'Analyze win themes',
    model: overrides.model ?? 'claude-sonnet-4-5',
    classification: overrides.classification ?? 'UNCLASSIFIED',
    taskType: overrides.taskType ?? 'strategy',
    systemPrompt: overrides.systemPrompt,
  }
}

// Replicate key generation for assertions
function expectedKey(input: CacheKeyInput): string {
  const normalized = [
    input.companyId,
    input.prompt.trim().toLowerCase(),
    input.model,
    input.classification,
    input.taskType,
    input.systemPrompt?.trim().toLowerCase() ?? '',
  ].join('|')
  const hash = createHash('sha256').update(normalized).digest('hex')
  return `mp:ai:cache:${input.companyId}:${input.taskType}:${hash}`
}

// ─── Company Isolation Tests ─────────────────────────────────────

describe('semantic-cache company isolation (CMMC SC-4)', () => {
  it('different companyIds produce different cache keys', async () => {
    const inputA = makeInput({ companyId: 'company-AAA' })
    const inputB = makeInput({ companyId: 'company-BBB' })

    // Both calls with same prompt but different company
    await getCachedResponse(inputA)
    await getCachedResponse(inputB)

    // Redis.get should have been called with different keys
    const keyA = mockGet.mock.calls[0][0] as string
    const keyB = mockGet.mock.calls[1][0] as string

    expect(keyA).not.toBe(keyB)
    expect(keyA).toContain('company-AAA')
    expect(keyB).toContain('company-BBB')
  })

  it('same companyId + same prompt produces same cache key', async () => {
    const input = makeInput({ companyId: 'company-001' })

    await getCachedResponse(input)
    await getCachedResponse(input)

    const key1 = mockGet.mock.calls[0][0] as string
    const key2 = mockGet.mock.calls[1][0] as string

    expect(key1).toBe(key2)
  })

  it('cache key includes companyId in the prefix', async () => {
    const input = makeInput({ companyId: 'tenant-xyz' })
    await getCachedResponse(input)

    const key = mockGet.mock.calls[0][0] as string
    expect(key).toMatch(/^mp:ai:cache:tenant-xyz:strategy:/)
  })

  it('set stores response under company-scoped key', async () => {
    const input = makeInput({ companyId: 'company-secure' })
    await setCachedResponse(input, {
      content: 'Strategy analysis result',
      model_used: 'claude-sonnet-4-5',
      confidence: 'high',
    })

    const key = mockSet.mock.calls[0][0] as string
    expect(key).toContain('company-secure')
    expect(key).toBe(expectedKey(input))
  })

  it('tracks metrics on cache hit', async () => {
    const cachedEntry = {
      content: 'Cached result',
      model_used: 'claude-sonnet-4-5',
      confidence: 'high' as const,
      cached_at: new Date().toISOString(),
    }
    mockGet.mockResolvedValueOnce(cachedEntry)

    const result = await getCachedResponse(makeInput())

    expect(result).not.toBeNull()
    expect(result?.content).toBe('Cached result')
    expect(mockHincrby).toHaveBeenCalledWith(
      expect.stringContaining('mp:ai:metrics:'),
      'hits',
      1
    )
  })

  it('tracks metrics on cache miss', async () => {
    mockGet.mockResolvedValueOnce(null)

    const result = await getCachedResponse(makeInput())

    expect(result).toBeNull()
    expect(mockHincrby).toHaveBeenCalledWith(
      expect.stringContaining('mp:ai:metrics:'),
      'misses',
      1
    )
  })

  it('returns null when Redis is unavailable', async () => {
    const { getRedis } = await import('@/lib/cache/redis')
    vi.mocked(getRedis).mockReturnValueOnce(null)

    const result = await getCachedResponse(makeInput())
    expect(result).toBeNull()
  })

  it('setCachedResponse is a no-op when Redis is unavailable', async () => {
    const { getRedis } = await import('@/lib/cache/redis')
    vi.mocked(getRedis).mockReturnValueOnce(null)

    await setCachedResponse(makeInput(), {
      content: 'test',
      model_used: 'test',
      confidence: 'low',
    })

    expect(mockSet).not.toHaveBeenCalled()
  })
})
