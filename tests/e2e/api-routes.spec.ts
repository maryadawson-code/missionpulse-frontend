// filepath: tests/e2e/api-routes.spec.ts
// API route E2E tests — verifies public and protected API endpoints respond
// correctly with proper status codes, JSON bodies, and auth gates.
import { test, expect } from '@playwright/test'

test.describe('API Routes — Public Endpoints', () => {
  // ─── /api/health ────────────────────────────────────────
  test('GET /api/health returns 200 with status field', async ({ request }) => {
    const response = await request.get('/api/health')

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('status')
    expect(typeof body.status).toBe('string')
    expect(body).toHaveProperty('timestamp')
    expect(body).toHaveProperty('version')
  })

  test('GET /api/health returns no-store cache control', async ({ request }) => {
    const response = await request.get('/api/health')
    const cacheControl = response.headers()['cache-control']

    expect(cacheControl).toBe('no-store')
  })

  // ─── /api/newsletter ───────────────────────────────────
  test('POST /api/newsletter with invalid email returns 400', async ({ request }) => {
    const response = await request.post('/api/newsletter', {
      data: { email: 'not-an-email' },
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toContain('email')
  })

  test('POST /api/newsletter with missing body returns 400', async ({ request }) => {
    const response = await request.post('/api/newsletter', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('POST /api/newsletter with empty email returns 400', async ({ request }) => {
    const response = await request.post('/api/newsletter', {
      data: { email: '' },
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(400)
  })

  test('DELETE /api/newsletter with invalid email returns 400', async ({ request }) => {
    const response = await request.delete('/api/newsletter', {
      data: { email: 'bad' },
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })
})

test.describe('API Routes — Auth-Gated Endpoints', () => {
  // ─── /api/metrics (admin only) ─────────────────────────
  test('GET /api/metrics without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/metrics')

    // Should be 401 Unauthorized (no session cookie)
    expect(response.status()).toBe(401)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  // ─── /api/health/detailed (admin only) ──────────────────
  test('GET /api/health/detailed without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/health/detailed')

    expect(response.status()).toBe(401)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  // ─── /api/section-versions ──────────────────────────────
  test('GET /api/section-versions without auth returns 401 or redirect', async ({ request }) => {
    const response = await request.get('/api/section-versions')

    // Auth-gated endpoints return 401 or redirect to login
    expect([401, 302, 307]).toContain(response.status())
  })
})

test.describe('API Routes — Cron Endpoint', () => {
  // ─── /api/cron/daily ────────────────────────────────────
  test('GET /api/cron/daily without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/cron/daily')

    expect(response.status()).toBe(401)

    const body = await response.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toBe('Unauthorized')
  })

  test('GET /api/cron/daily with invalid bearer token returns 401', async ({ request }) => {
    const response = await request.get('/api/cron/daily', {
      headers: {
        Authorization: 'Bearer invalid-secret-token',
      },
    })

    expect(response.status()).toBe(401)
  })
})

test.describe('API Routes — Stripe Webhook', () => {
  // ─── /api/webhooks/stripe ───────────────────────────────
  test('POST /api/webhooks/stripe without signature returns 400', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: JSON.stringify({ type: 'checkout.session.completed' }),
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toContain('signature')
  })

  test('POST /api/webhooks/stripe with invalid signature returns 400', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: JSON.stringify({ type: 'checkout.session.completed' }),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=1234567890,v1=invalid_signature_hash',
      },
    })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })
})
