// filepath: tests/e2e/rbac-enforcement.spec.ts
// RBAC enforcement E2E tests — verifies route protection for authenticated
// and unauthenticated users across protected routes.
import { test, expect } from '@playwright/test'
import { login, assertOnLogin, assertOnProtectedRoute, TEST_USER } from './helpers'

test.describe('RBAC Enforcement', () => {
  test('Unauthenticated user accessing /dashboard is redirected to /login', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()

    await page.goto('/dashboard')
    await assertOnLogin(page)
  })

  test('Authenticated user can access /dashboard', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await page.goto('/dashboard')
    await assertOnProtectedRoute(page)

    // Verify meaningful content loaded (not a blank page)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('Authenticated user can access /pipeline', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await page.goto('/pipeline')
    await assertOnProtectedRoute(page)

    // Verify the pipeline page rendered with recognizable content
    await expect(page.locator('h1').or(page.locator('table'))).toBeVisible({ timeout: 10_000 })
  })
})
