// filepath: tests/e2e/sprint8.spec.ts
// Sprint 8: Black Hat, Compliance, Workflow, Personnel, Pricing
import { test, expect } from '@playwright/test'
import { login, TEST_USER } from './helpers'

// ---------------------------------------------------------------------------
// T-32: Black Hat Page
// ---------------------------------------------------------------------------

test.describe('Black Hat Page (T-32)', () => {
  test('Black Hat page loads with competitor table or RBAC-redirects', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/blackhat')

    const url = page.url()
    if (url.includes('/blackhat')) {
      await expect(page.locator('h1')).toHaveText('Black Hat Review')
      await expect(page.getByText('OPSEC')).toBeVisible()
      await expect(page.getByText('Competitor')).toBeVisible()
      await expect(page.getByText('Threat')).toBeVisible()
    }
  })
})

// ---------------------------------------------------------------------------
// T-33: Compliance Page
// ---------------------------------------------------------------------------

test.describe('Compliance Page (T-33)', () => {
  test('Compliance page loads with summary cards or RBAC-redirects', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/compliance')

    const url = page.url()
    if (url.includes('/compliance')) {
      await expect(page.locator('h1')).toHaveText('Compliance')
      await expect(page.getByText('Total Requirements')).toBeVisible()
      await expect(page.getByText('Compliance Score')).toBeVisible()
      await expect(page.getByText('Requirement')).toBeVisible()
    }
  })
})

// ---------------------------------------------------------------------------
// T-34: Workflow Page
// ---------------------------------------------------------------------------

test.describe('Workflow Page (T-34)', () => {
  test('Workflow page loads with status cards or RBAC-redirects', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/workflow')

    const url = page.url()
    if (url.includes('/workflow')) {
      await expect(page.locator('h1')).toHaveText('Workflow Board')
      await expect(page.getByText('To Do')).toBeVisible()
      await expect(page.getByText('In Progress')).toBeVisible()
      await expect(page.getByText('Completed')).toBeVisible()
    }
  })
})

// ---------------------------------------------------------------------------
// T-35: Personnel Page
// ---------------------------------------------------------------------------

test.describe('Personnel Page (T-35)', () => {
  test('Personnel page loads with table or RBAC-redirects', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/personnel')

    const url = page.url()
    if (url.includes('/personnel')) {
      await expect(page.locator('h1')).toHaveText('Personnel')
      await expect(page.getByText('SP-PRVCY')).toBeVisible()
      await expect(page.getByText('Total Personnel')).toBeVisible()
      await expect(page.getByText('Clearance')).toBeVisible()
    }
  })
})

// ---------------------------------------------------------------------------
// T-36: Pricing Page
// ---------------------------------------------------------------------------

test.describe('Pricing Page (T-36)', () => {
  test('Pricing page loads with models and items or RBAC-redirects', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/pricing')

    const url = page.url()
    if (url.includes('/pricing')) {
      await expect(page.locator('h1')).toHaveText('Pricing')
      await expect(page.getByText('SP-PROPIN')).toBeVisible()
      await expect(page.getByText('Pricing Models')).toBeVisible()
      await expect(page.getByText('Pricing Line Items')).toBeVisible()
    }
  })
})
