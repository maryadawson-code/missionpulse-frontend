// filepath: tests/e2e/error-boundaries.spec.ts
// Error boundary E2E tests — verifies the app handles invalid routes gracefully
// and does not show a blank white screen on errors.
import { test, expect } from '@playwright/test'
import { login, assertOnProtectedRoute, TEST_USER } from './helpers'

test.describe('Error Boundaries', () => {
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
