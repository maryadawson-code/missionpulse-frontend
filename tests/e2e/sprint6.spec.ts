// filepath: tests/e2e/sprint6.spec.ts
// Sprint 6: Audit Log, PipelineTable, Header Search, Proposals
import { test, expect } from '@playwright/test'
import { login, assertOnProtectedRoute, TEST_USER } from './helpers'

// ---------------------------------------------------------------------------
// T-22: Audit Log Page
// ---------------------------------------------------------------------------

test.describe('Audit Log (T-22)', () => {
  test('Audit page loads with data table or RBAC-redirects', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/audit')

    const url = page.url()
    if (url.includes('/audit')) {
      await expect(page.locator('h1')).toHaveText('Audit Log')
      // Should have a table with audit headers
      await expect(page.getByText('Timestamp')).toBeVisible()
      await expect(page.getByText('Action')).toBeVisible()
      // NIST footer
      await expect(page.getByText('NIST 800-53 AU-9')).toBeVisible()
    }
    // If redirected, RBAC denied access — valid behavior
  })
})

// ---------------------------------------------------------------------------
// T-23: Pipeline Table Component
// ---------------------------------------------------------------------------

test.describe('Pipeline Table (T-23)', () => {
  test('Pipeline page renders sortable table', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/pipeline')
    await assertOnProtectedRoute(page)

    await expect(page.locator('h1')).toHaveText('Pipeline')
    // Table headers from PipelineTable component
    await expect(page.getByText('Title')).toBeVisible()
    await expect(page.getByText('Agency')).toBeVisible()
    await expect(page.getByText('Contract Value')).toBeVisible()
    await expect(page.getByText('Win Probability')).toBeVisible()
    await expect(page.getByText('Phase')).toBeVisible()
    await expect(page.getByText('Due Date')).toBeVisible()
  })

  test('Pipeline table has filter dropdowns', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/pipeline')
    await assertOnProtectedRoute(page)

    // Filter dropdowns
    await expect(page.getByText('All Phases')).toBeVisible()
    await expect(page.getByText('All Statuses')).toBeVisible()
    await expect(page.getByText('All Set-Asides')).toBeVisible()
  })

  test('Pipeline search input filters results', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/pipeline')
    await assertOnProtectedRoute(page)

    const searchInput = page.getByPlaceholder('Search pipeline...')
    await expect(searchInput).toBeVisible()

    // Type a search query — results should update (client-side)
    await searchInput.fill('nonexistent-xyz-query')
    await expect(page.getByText('No results match your filters.')).toBeVisible()
  })

  test('New Opportunity button links to /pipeline/new', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/pipeline')
    await assertOnProtectedRoute(page)

    const newBtn = page.getByText('+ New Opportunity')
    await expect(newBtn).toBeVisible()
    await expect(newBtn).toHaveAttribute('href', '/pipeline/new')
  })
})

// ---------------------------------------------------------------------------
// T-24: Header Search
// ---------------------------------------------------------------------------

test.describe('Header Search (T-24)', () => {
  test('Header search input is visible', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await assertOnProtectedRoute(page)

    const headerSearch = page.locator('header input[type="text"]')
    await expect(headerSearch).toBeVisible()
    await expect(headerSearch).toHaveAttribute('placeholder', /search/i)
  })

  test('Header search navigates to /pipeline?q=term', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/')
    await assertOnProtectedRoute(page)

    const headerSearch = page.locator('header input[type="text"]')
    await headerSearch.fill('test-query')
    await headerSearch.press('Enter')

    await page.waitForURL(/\/pipeline\?q=test-query/)
    await expect(page.locator('h1')).toHaveText('Pipeline')
  })
})

// ---------------------------------------------------------------------------
// T-25: Proposals Page
// ---------------------------------------------------------------------------

test.describe('Proposals Page (T-25)', () => {
  test('Proposals page loads with data table or RBAC-redirects', async ({ page }) => {
    if (!TEST_USER.password) { test.skip(); return }

    await login(page)
    await page.goto('/proposals')

    const url = page.url()
    if (url.includes('/proposals')) {
      await expect(page.locator('h1')).toHaveText('Proposals')
      // Should have a table with proposal document headers
      await expect(page.getByText('Title')).toBeVisible()
      await expect(page.getByText('Type')).toBeVisible()
      await expect(page.getByText('Status')).toBeVisible()
    }
    // If redirected, RBAC denied access — valid behavior
  })
})
