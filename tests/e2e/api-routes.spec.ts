// filepath: tests/e2e/api-routes.spec.ts
// API route E2E tests — verifies public API endpoints respond correctly
// with proper status codes and JSON bodies.
import { test, expect } from '@playwright/test'

test.describe('API Routes', () => {
  test('GET /api/health returns 200 with status field', async ({ page }) => {
    const response = await page.request.get('/api/health')

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('status')
    expect(typeof body.status).toBe('string')
  })

  test('POST /api/newsletter with invalid email returns 400', async ({ page }) => {
    const response = await page.request.post('/api/newsletter', {
      data: { email: 'not-an-email' },
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('POST /api/newsletter with missing body returns 400', async ({ page }) => {
    const response = await page.request.post('/api/newsletter', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })
})
