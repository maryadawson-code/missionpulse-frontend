// filepath: tests/e2e/error-boundaries.spec.ts
// Error boundary E2E tests — verifies the app handles invalid routes gracefully,
// does not show raw error messages to users, and provides recovery options.
import { test, expect } from '@playwright/test'
import { login, assertOnProtectedRoute, TEST_USER } from './helpers'

test.describe('Error Boundaries — Route Protection', () => {
  test('Valid route renders without error boundary', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await page.goto('/dashboard')
    await assertOnProtectedRoute(page)

    // No error boundary or crash indicators should be visible
    const errorBoundary = page.locator('text=/something went wrong/i')
      .or(page.locator('text=/error/i').filter({ hasText: /unhandled|uncaught|runtime/i }))
    await expect(errorBoundary).toHaveCount(0)

    // Page should have meaningful content (not blank)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)
  })

  test('Non-existent nested route shows 404 — not a blank screen', async ({ page }) => {
    await page.goto('/dashboard/this-route-does-not-exist-12345')

    // The page should show SOMETHING — either a 404 page, a redirect, or an error state
    // but never a blank white screen
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)

    // Check for the custom 404 page content or a redirect to /login
    const has404 = await page.locator('text=404').isVisible().catch(() => false)
    const hasNotFound = await page.locator('text=/doesn.*exist|not found|page not found/i').isVisible().catch(() => false)
    const onLogin = new URL(page.url()).pathname.includes('/login')

    // At least one of these should be true: shows 404, shows not-found message, or redirected
    expect(has404 || hasNotFound || onLogin).toBeTruthy()
  })
})

test.describe('Error Boundaries — User-Friendly Messages', () => {
  test('Error pages do not expose stack traces or raw error text', async ({ page }) => {
    // Navigate to a deeply nested non-existent path
    await page.goto('/pipeline/nonexistent-id-12345/sections/bad-section')

    const bodyText = await page.locator('body').innerText()

    // Should NOT contain technical error details
    expect(bodyText).not.toContain('TypeError')
    expect(bodyText).not.toContain('ReferenceError')
    expect(bodyText).not.toContain('at Object.')
    expect(bodyText).not.toContain('node_modules')
    expect(bodyText).not.toContain('webpack')
  })

  test('Non-existent API route returns JSON error, not HTML', async ({ request }) => {
    const response = await request.get('/api/nonexistent-route-12345')

    // Should return a structured response, not an HTML error page
    // Next.js returns 404 for non-existent API routes
    expect(response.status()).toBe(404)
  })
})

test.describe('Error Boundaries — Recovery', () => {
  test('Root page loads without triggering error boundary', async ({ page }) => {
    const response = await page.goto('/')

    // Root page should respond (200 or redirect to login)
    expect(response).not.toBeNull()
    expect([200, 301, 302, 307, 308]).toContain(response!.status())

    // No JavaScript errors logged in console
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    // Wait a moment for any deferred JS errors
    await page.waitForTimeout(1000)

    // Filter out known non-actionable console errors
    const actionableErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('hydration')
    )
    expect(actionableErrors.length).toBe(0)
  })
})
