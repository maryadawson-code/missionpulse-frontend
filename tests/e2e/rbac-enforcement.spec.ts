// filepath: tests/e2e/rbac-enforcement.spec.ts
// RBAC enforcement E2E tests — verifies route protection for authenticated
// and unauthenticated users across protected and public routes.
import { test, expect } from '@playwright/test'
import { login, assertOnLogin, assertOnProtectedRoute, TEST_USER } from './helpers'

test.describe('RBAC — Unauthenticated Access', () => {
  test('Unauthenticated user accessing /dashboard is redirected to /login', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/dashboard')
    await assertOnLogin(page)
  })

  test('Unauthenticated user accessing /pipeline is redirected to /login', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/pipeline')
    await assertOnLogin(page)
  })

  test('Unauthenticated user accessing /war-room is redirected to /login', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/war-room')
    await assertOnLogin(page)
  })

  test('Unauthenticated user accessing /compliance is redirected to /login', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/compliance')
    await assertOnLogin(page)
  })

  test('Unauthenticated user accessing /admin is redirected to /login', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/admin')
    await assertOnLogin(page)
  })
})

test.describe('RBAC — Authenticated Access', () => {
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

  test('Authenticated user can access /war-room', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await page.goto('/war-room')
    await assertOnProtectedRoute(page)
  })

  test('Authenticated user can access /compliance', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await page.goto('/compliance')
    await assertOnProtectedRoute(page)
  })

  test('Sidebar renders navigation links for authenticated user', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await page.goto('/dashboard')
    await assertOnProtectedRoute(page)

    // Sidebar should have at least some nav links visible
    const navLinks = page.locator('nav a[href]')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('RBAC — Public Routes', () => {
  test('Login page is accessible without auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')

    // Should stay on login page, not redirect
    expect(page.url()).toContain('/login')
  })

  test('Signup page is accessible without auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/signup')

    expect(page.url()).toContain('/signup')
  })
})
