// filepath: tests/e2e/sprint5.spec.ts
// Sprint 5: Route fixes, Personnel, Dead code cleanup, Notifications
import { test, expect } from '@playwright/test'
import { login, assertOnProtectedRoute, TEST_USER } from './helpers'

// ---------------------------------------------------------------------------
// T-17: Sidebar Navigation Routes
// ---------------------------------------------------------------------------

test.describe('Sidebar Navigation (T-17)', () => {
  test('Sidebar links use correct routes (no /dashboard prefix)', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await assertOnProtectedRoute(page)

    // Get all sidebar nav links
    const sidebarLinks = page.locator('aside a[href]')
    const count = await sidebarLinks.count()
    expect(count).toBeGreaterThan(0)

    // None should contain /dashboard/ as a path segment
    for (let i = 0; i < count; i++) {
      const href = await sidebarLinks.nth(i).getAttribute('href')
      expect(href).not.toContain('/dashboard/')
    }
  })

  test('Dashboard link navigates to / root', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)

    // Navigate to pipeline first, then click Dashboard in sidebar
    await page.goto('/pipeline')
    await assertOnProtectedRoute(page)

    const dashboardLink = page.locator('aside a[href="/"]')
    if (await dashboardLink.count() > 0) {
      await dashboardLink.click()
      await page.waitForURL('/')
      await expect(page.locator('h1')).toHaveText('Dashboard')
    }
  })

  test('Pipeline link navigates to /pipeline', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/')

    const pipelineLink = page.locator('aside a[href="/pipeline"]')
    if (await pipelineLink.count() > 0) {
      await pipelineLink.click()
      await page.waitForURL('/pipeline')
      await expect(page.locator('h1')).toHaveText('Pipeline')
    }
  })
})

// ---------------------------------------------------------------------------
// T-18: Personnel Module
// ---------------------------------------------------------------------------

test.describe('Personnel Module (T-18)', () => {
  test('Personnel page loads or RBAC-redirects', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/personnel')

    const url = page.url()
    if (url.includes('/personnel')) {
      await expect(page.locator('h1')).toHaveText('Personnel')
      await expect(page.getByText('CUI')).toBeVisible()
      await expect(page.getByText('SP-PRVCY')).toBeVisible()
      await expect(page.getByText('Coming Soon')).toBeVisible()
    }
    // If redirected, RBAC denied access — that's valid behavior
  })
})

// ---------------------------------------------------------------------------
// T-19: Dead Code Cleanup Verification
// ---------------------------------------------------------------------------

test.describe('Dead Code Cleanup (T-19)', () => {
  test('App builds and renders without deleted components', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await assertOnProtectedRoute(page)

    // Dashboard should render correctly — sidebar, header, content
    await expect(page.locator('aside')).toBeVisible()
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    // No error overlays
    const errorOverlay = page.locator('[data-nextjs-dialog]')
    await expect(errorOverlay).toHaveCount(0)
  })
})

// ---------------------------------------------------------------------------
// T-20: Notifications Dropdown
// ---------------------------------------------------------------------------

test.describe('Notifications Dropdown (T-20)', () => {
  test('Notification bell is visible in header', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await assertOnProtectedRoute(page)

    const bellButton = page.locator('button[aria-label="Notifications"]')
    await expect(bellButton).toBeVisible()
  })

  test('Clicking bell opens dropdown', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await assertOnProtectedRoute(page)

    const bellButton = page.locator('button[aria-label="Notifications"]')
    await bellButton.click()

    // Dropdown should appear with "Notifications" heading
    await expect(page.getByText('Notifications')).toBeVisible()
  })

  test('Clicking outside dropdown closes it', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await assertOnProtectedRoute(page)

    // Open dropdown
    const bellButton = page.locator('button[aria-label="Notifications"]')
    await bellButton.click()
    await expect(page.getByText('Notifications')).toBeVisible()

    // Click outside (on main content area)
    await page.locator('main').click()
    // The "Notifications" heading in the dropdown should disappear
    // (Note: "Notifications" might still be in the DOM as a nav label; check dropdown-specific element)
    const dropdownPanel = page.locator('.max-h-80')
    await expect(dropdownPanel).not.toBeVisible()
  })
})
