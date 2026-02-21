// filepath: tests/e2e/rbac.spec.ts
// PHASE_2_RULES §6 Tests #3, #4, and #5
import { test, expect } from '@playwright/test'
import { login, assertOnLogin, assertOnProtectedRoute, TEST_USER } from './helpers'

// ---------------------------------------------------------------------------
// Test #3: Route guard
// No session → /pipeline → redirect to /login
// ---------------------------------------------------------------------------

test.describe('Route Guards', () => {
  test('#3 — Unauthenticated user is redirected to /login from protected routes', async ({
    page,
  }) => {
    // Clear any existing cookies to ensure clean state
    await page.context().clearCookies()

    // Try to access protected routes directly
    // Note: '/' is now the public landing page, not a protected route
    const protectedRoutes = ['/pipeline', '/war-room/test-id', '/settings']

    for (const route of protectedRoutes) {
      await page.goto(route)
      await assertOnLogin(page)
    }
  })

  test('#3b — Auth pages (login, signup) are accessible without session', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    // Should NOT redirect away
    await expect(page.getByLabel(/email/i)).toBeVisible()

    await page.goto('/signup')
    await expect(page).toHaveURL(/\/signup/)
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Test #4: RBAC nav
// CEO sees all nav items. Restricted roles hide Pricing/Black Hat.
// NOTE: With single test user (CEO role), we verify CEO sees everything.
// Full multi-role testing requires additional test accounts.
// ---------------------------------------------------------------------------

test.describe('RBAC Navigation', () => {
  test('#4 — CEO role sees full navigation including CUI modules', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await assertOnProtectedRoute(page)

    // CEO/executive should see these nav items
    const expectedNavItems = [
      'Dashboard',
      'Pipeline',
      'Black Hat',
      'Pricing',
      'Agent Hub',
      'Settings',
    ]

    for (const label of expectedNavItems) {
      await expect(
        page.getByRole('link', { name: label }).or(page.locator(`text=${label}`))
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test('#4b — CUI badges render on sensitive modules', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await assertOnProtectedRoute(page)

    // Black Hat and Pricing should have CUI badges in the sidebar
    const cuiBadges = page.locator('text=CUI')
    const badgeCount = await cuiBadges.count()

    // At minimum, Pricing and Black Hat should show CUI badges
    expect(badgeCount).toBeGreaterThanOrEqual(2)
  })

  test('#4c — Invisible RBAC: no "Access Denied" text anywhere', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await assertOnProtectedRoute(page)

    // Core design principle: "Access Denied" should NEVER appear in the DOM
    const accessDenied = page.locator('text=/access denied/i')
    await expect(accessDenied).toHaveCount(0)

    const forbidden = page.locator('text=/forbidden/i')
    await expect(forbidden).toHaveCount(0)

    const unauthorized = page.locator('text=/unauthorized/i')
    await expect(unauthorized).toHaveCount(0)
  })
})

// ---------------------------------------------------------------------------
// Test #5: RLS sanity
// Authenticated internal user sees opportunities. Verifies data loads.
// ---------------------------------------------------------------------------

test.describe('RLS Sanity', () => {
  test('#5 — Authenticated user can load pipeline data', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)

    // Navigate to pipeline
    await page.goto('/pipeline')
    await assertOnProtectedRoute(page)

    // Pipeline should render — look for table or opportunity cards
    // With 5 opportunities in the DB, we should see content
    const pipelineContent = page
      .locator('table')
      .or(page.locator('[data-testid="opportunity-card"]'))
      .or(page.locator('[data-testid="pipeline-table"]'))
      .or(page.locator('text=/Gate/i')) // Shipley phases show "Gate"

    await expect(pipelineContent.first()).toBeVisible({ timeout: 10_000 })
  })

  test('#5b — Pipeline page does not expose raw DB column names', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await page.goto('/pipeline')
    await assertOnProtectedRoute(page)

    // Plain language labels should be used, not raw DB columns
    // These raw column names should NOT appear in visible text
    const rawColumns = ['pwin', 'owner_id', 'company_id', 'ceiling']

    for (const col of rawColumns) {
      // Check visible text only (not attributes/data)
      const visibleText = await page.locator('body').innerText()
      // pwin might appear as part of a larger word, so check exact boundaries
      const regex = new RegExp(`\\b${col}\\b`)
      expect(visibleText).not.toMatch(regex)
    }
  })
})
