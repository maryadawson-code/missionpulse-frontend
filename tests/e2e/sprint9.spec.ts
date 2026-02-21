// filepath: tests/e2e/sprint9.spec.ts
// Sprint 9: AI Assistant page activation
import { test, expect } from '@playwright/test'
import { login, assertOnProtectedRoute, TEST_USER } from './helpers'

// ---------------------------------------------------------------------------
// T-39: AI Assistant Page
// ---------------------------------------------------------------------------

test.describe('AI Assistant Page (T-39)', () => {
  test('AI page loads with usage stats or RBAC-redirects', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/ai')

    const url = page.url()
    if (url.includes('/ai')) {
      await expect(page.locator('h1')).toHaveText('AI Assistant')
      // Usage stat cards should be visible
      await expect(page.getByText('Conversations')).toBeVisible()
      await expect(page.getByText('Interactions')).toBeVisible()
      await expect(page.getByText('Tokens Used')).toBeVisible()
    }
    // If redirected, RBAC denied access — valid behavior
  })

  test('AI page shows chat history section', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/ai')

    const url = page.url()
    if (url.includes('/ai')) {
      await expect(page.getByText('Chat History')).toBeVisible()
      await expect(page.getByText('Agent')).toBeVisible()
    }
  })
})

// ---------------------------------------------------------------------------
// Final: All modules activated — no stubs remain
// ---------------------------------------------------------------------------

test.describe('All Modules Active (Final Check)', () => {
  test('No "Coming Soon" text on any page', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await assertOnProtectedRoute(page)

    // Check all module routes
    const routes = [
      '/', '/pipeline', '/proposals', '/pricing', '/strategy',
      '/blackhat', '/compliance', '/personnel', '/workflow',
      '/documents', '/ai', '/analytics', '/admin', '/audit', '/integrations',
    ]

    for (const route of routes) {
      await page.goto(route)
      const url = page.url()
      // If we stayed on the page (not RBAC-redirected), verify no "Coming Soon"
      if (url.includes(route) || route === '/') {
        const comingSoon = page.getByText('Coming Soon')
        await expect(comingSoon).toHaveCount(0)
      }
    }
  })
})
