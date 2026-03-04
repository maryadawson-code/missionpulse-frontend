// filepath: tests/e2e/session-edge-cases.spec.ts
// Session edge case E2E tests — verifies direct URL navigation and page
// refresh behavior for authenticated users on protected routes.
import { test, expect } from '@playwright/test'
import { login, assertOnProtectedRoute, TEST_USER } from './helpers'

test.describe('Session Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }
    await login(page)
  })

  test('Direct URL navigation to /pipeline while logged in loads correctly', async ({ page }) => {
    await page.goto('/pipeline')
    await assertOnProtectedRoute(page)

    // Pipeline page should render with recognizable content
    await expect(
      page.locator('h1').or(page.locator('table')).or(page.locator('text=Pipeline'))
    ).toBeVisible({ timeout: 10_000 })
  })

  test('Direct URL navigation to /dashboard while logged in loads correctly', async ({ page }) => {
    await page.goto('/dashboard')
    await assertOnProtectedRoute(page)

    // Dashboard should render with recognizable content
    await expect(page.locator('body')).not.toBeEmpty()
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)
  })

  test('Page refresh on protected route stays authenticated', async ({ page }) => {
    // Navigate to a protected route
    await page.goto('/pipeline')
    await assertOnProtectedRoute(page)

    // Reload the page (simulates browser refresh / F5)
    await page.reload()

    // Should still be on a protected route, not bounced to /login
    await assertOnProtectedRoute(page)

    // Content should still be present after refresh
    await expect(
      page.locator('h1').or(page.locator('table')).or(page.locator('text=Pipeline'))
    ).toBeVisible({ timeout: 10_000 })
  })
})
