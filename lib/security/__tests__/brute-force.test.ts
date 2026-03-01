/**
 * Brute Force Protection — Unit Tests
 *
 * Mocks Redis via getRedis() to test lockout detection,
 * fail-open behavior, and key cleanup on successful login.
 */
vi.mock('@/lib/cache/redis', () => ({
  getRedis: vi.fn(),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

import { getRedis } from '@/lib/cache/redis'
import {
  checkBruteForce,
  recordSuccessfulLogin,
} from '../brute-force'

const mockedGetRedis = vi.mocked(getRedis)

// Helper to build a mock Redis instance with vi.fn() stubs
function createMockRedis(overrides: Record<string, unknown> = {}) {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(true),
    ttl: vi.fn().mockResolvedValue(600),
    ...overrides,
  }
}

// ─── checkBruteForce ────────────────────────────────────────

describe('checkBruteForce', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns { allowed: true } when Redis is unavailable (fail-open)', async () => {
    mockedGetRedis.mockReturnValue(null as unknown as ReturnType<typeof getRedis>)

    const result = await checkBruteForce('127.0.0.1', 'user@example.com')

    expect(result).toEqual({ allowed: true })
  })

  it('returns allowed with delayMs: 0 when no lockout and no prior attempts', async () => {
    const redis = createMockRedis()
    mockedGetRedis.mockReturnValue(redis as unknown as ReturnType<typeof getRedis>)

    const result = await checkBruteForce('10.0.0.1', 'new@example.com')

    expect(result.allowed).toBe(true)
    expect(result.delayMs).toBe(0)
  })

  it('returns { allowed: false, reason: "ip_locked" } when IP is locked', async () => {
    const redis = createMockRedis({
      get: vi.fn().mockImplementation((key: string) => {
        if (key.startsWith('brute:ip:lock:')) return Promise.resolve('1')
        return Promise.resolve(null)
      }),
      ttl: vi.fn().mockResolvedValue(1200),
    })
    mockedGetRedis.mockReturnValue(redis as unknown as ReturnType<typeof getRedis>)

    const result = await checkBruteForce('10.0.0.1', 'test@example.com')

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('ip_locked')
    expect(result.lockoutExpiresAt).toBeDefined()
  })

  it('returns { allowed: false, reason: "account_locked" } when account is locked', async () => {
    const redis = createMockRedis({
      get: vi.fn().mockImplementation((key: string) => {
        // IP is NOT locked
        if (key.startsWith('brute:ip:lock:')) return Promise.resolve(null)
        // Account IS locked
        if (key.startsWith('brute:acct:lock:')) return Promise.resolve('1')
        return Promise.resolve(null)
      }),
      ttl: vi.fn().mockResolvedValue(3000),
    })
    mockedGetRedis.mockReturnValue(redis as unknown as ReturnType<typeof getRedis>)

    const result = await checkBruteForce('10.0.0.1', 'locked@example.com')

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('account_locked')
    expect(result.lockoutExpiresAt).toBeDefined()
  })
})

// ─── recordSuccessfulLogin ──────────────────────────────────

describe('recordSuccessfulLogin', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clears the IP attempt key and IP lock key', async () => {
    const redis = createMockRedis()
    mockedGetRedis.mockReturnValue(redis as unknown as ReturnType<typeof getRedis>)

    await recordSuccessfulLogin('10.0.0.1')

    // Should delete both the IP counter and the IP lock
    expect(redis.del).toHaveBeenCalledTimes(2)
    expect(redis.del).toHaveBeenCalledWith('brute:ip:10.0.0.1')
    expect(redis.del).toHaveBeenCalledWith('brute:ip:lock:10.0.0.1')
  })
})
