/**
 * Middleware Unit Tests
 *
 * Tests the Next.js middleware for:
 * - Landing page pass-through with security headers
 * - Auth gate (unauthenticated -> redirect, authenticated -> pass-through)
 * - Auth-only route redirect (authenticated -> /dashboard)
 * - CSP nonce generation
 * - Request ID correlation header
 * - Redis-backed rate limiting (429 on exceed)
 * - Missing env vars fallback
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks — MUST be declared before importing middleware
// ---------------------------------------------------------------------------

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}))

vi.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 30, remaining: 29, reset: 0 }),
  rateLimitHeaders: vi.fn().mockReturnValue({}),
  getTierForRoute: vi.fn().mockReturnValue(null),
  isAllowlisted: vi.fn().mockReturnValue(false),
}))

vi.mock('@/lib/security/brute-force', () => ({
  checkBruteForce: vi.fn().mockResolvedValue({ allowed: true }),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

// ---------------------------------------------------------------------------
// Import middleware AFTER mocks are registered
// ---------------------------------------------------------------------------
import { middleware, config } from '../middleware'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a NextRequest for a given path */
function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost${path}`))
}

/** Set Supabase env vars so the middleware can create a client */
function setSupabaseEnv(): void {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
}

/** Clear Supabase env vars to simulate missing configuration */
function clearSupabaseEnv(): void {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_ANON_KEY
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  setSupabaseEnv()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('middleware', () => {
  // 1. Landing page passes through
  it('passes through for landing page `/` with x-request-id header', async () => {
    const request = makeRequest('/')
    const response = await middleware(request)

    // Should NOT redirect
    expect(response.status).toBe(200)
    // Must have correlation ID
    expect(response.headers.get('x-request-id')).toBeTruthy()
  })

  // 2. Landing page has CSP header
  it('sets Content-Security-Policy header on landing page `/`', async () => {
    const request = makeRequest('/')
    const response = await middleware(request)

    const csp = response.headers.get('Content-Security-Policy')
    expect(csp).toBeTruthy()
    expect(csp).toContain("default-src 'self'")
  })

  // 3. Unauthenticated + protected route -> redirect to /login
  it('redirects unauthenticated users from /dashboard to /login', async () => {
    // Default mock already returns user: null
    const request = makeRequest('/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toBeTruthy()
    expect(new URL(location!).pathname).toBe('/login')
  })

  // 4. Authenticated + protected route -> passes through
  it('allows authenticated users to access /dashboard', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const request = makeRequest('/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(200)
  })

  // 5. Unauthenticated + public route -> passes through
  it('allows unauthenticated users to access public route /api/health', async () => {
    // Default mock returns user: null (unauthenticated)
    const request = makeRequest('/api/health')
    const response = await middleware(request)

    // Public route should not redirect
    expect(response.status).toBe(200)
  })

  // 6. Authenticated + auth-only route -> redirect to /dashboard
  it('redirects authenticated users from /login to /dashboard', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const request = makeRequest('/login')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toBeTruthy()
    expect(new URL(location!).pathname).toBe('/dashboard')
  })

  // 7. CSP header contains a nonce (unique per request)
  it('includes a nonce in the Content-Security-Policy header', async () => {
    const request = makeRequest('/')
    const response = await middleware(request)

    const csp = response.headers.get('Content-Security-Policy')
    expect(csp).toBeTruthy()
    // CSP should contain nonce-<base64> pattern
    expect(csp).toMatch(/nonce-[A-Za-z0-9+/=]+/)
  })

  // 8. Response has x-request-id header
  it('sets x-request-id correlation header on responses', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const request = makeRequest('/dashboard')
    const response = await middleware(request)

    expect(response.headers.get('x-request-id')).toBeTruthy()
    // Should be a UUID format
    expect(response.headers.get('x-request-id')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
  })

  // 9. Rate limiting: returns 429 when checkRateLimit returns { success: false }
  it('returns 429 when rate limit is exceeded', async () => {
    const { getTierForRoute, checkRateLimit } = await import('@/lib/security/rate-limiter')
    vi.mocked(getTierForRoute).mockReturnValue('standard')
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      limit: 30,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 60,
    })

    const request = makeRequest('/api/some-endpoint')
    const response = await middleware(request)

    expect(response.status).toBe(429)
  })

  // 10. Rate limiting: passes through when checkRateLimit succeeds
  it('passes through when rate limit is not exceeded', async () => {
    const { getTierForRoute, checkRateLimit } = await import('@/lib/security/rate-limiter')
    vi.mocked(getTierForRoute).mockReturnValue('standard')
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: 0,
    })

    // Need auth to pass through the auth check too
    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const request = makeRequest('/api/some-endpoint')
    const response = await middleware(request)

    // Should not be 429 — it either passes through (200) or some other non-429 status
    expect(response.status).not.toBe(429)
  })

  // 11. Missing env vars + protected route -> redirect to /login
  it('redirects to /login when Supabase env vars are missing and route is protected', async () => {
    clearSupabaseEnv()

    const request = makeRequest('/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toBeTruthy()
    expect(new URL(location!).pathname).toBe('/login')
  })
})

describe('config', () => {
  it('exports a matcher that excludes static assets', () => {
    expect(config).toBeDefined()
    expect(config.matcher).toBeDefined()
    expect(Array.isArray(config.matcher)).toBe(true)
    expect(config.matcher.length).toBeGreaterThan(0)
  })
})
