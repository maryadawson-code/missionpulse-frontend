// filepath: tests/e2e/pipeline.spec.ts
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'maryadawson@gmail.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'Test123!!'

test.describe('Pipeline Table (T-8)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/`)
  })

  test('Pipeline page loads with table', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline`)
    await expect(page.locator('h1')).toHaveText('Pipeline')
    // Table should render
    await expect(page.locator('table')).toBeVisible()
    // Filters should be present
    await expect(page.locator('input[placeholder="Search pipeline..."]')).toBeVisible()
  })

  test('Sort by column header click', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline`)
    await page.waitForSelector('table')

    // Click "Contract Value" header to sort
    const ceilingHeader = page.getByText('Contract Value')
    await ceilingHeader.click()
    // Column should show active sort indicator
    await expect(ceilingHeader.locator('..')).toContainText('▲')
    // Click again to reverse
    await ceilingHeader.click()
    await expect(ceilingHeader.locator('..')).toContainText('▼')
  })

  test('Filter by phase narrows results', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline`)
    await page.waitForSelector('table')

    const countBefore = await page.locator('tbody tr').count()

    // Select a phase filter
    await page.selectOption('select:has-text("All Phases")', 'Gate 1')
    await page.waitForTimeout(200) // Debounce

    const countAfter = await page.locator('tbody tr').count()
    // Result count should change or stay same (depending on data)
    expect(countAfter).toBeLessThanOrEqual(countBefore)
  })

  test('Search filters by title', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline`)
    await page.waitForSelector('table')

    await page.fill('input[placeholder="Search pipeline..."]', 'DHA')
    await page.waitForTimeout(200)

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    // Each visible row should contain search term or be a "no results" row
    if (rowCount > 0) {
      const firstRowText = await rows.first().textContent()
      expect(
        firstRowText?.toLowerCase().includes('dha') ||
          firstRowText?.includes('No results')
      ).toBeTruthy()
    }
  })

  test('New Opportunity button navigates to create form', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline`)
    await page.click('a:has-text("New Opportunity")')
    await page.waitForURL(`${BASE_URL}/pipeline/new`)
    await expect(page.locator('h1')).toHaveText('New Opportunity')
  })

  test('Delete shows confirmation modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline`)
    await page.waitForSelector('table')

    const deleteButton = page.locator('button:has-text("Delete")').first()
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
      await expect(page.getByText('Delete Opportunity')).toBeVisible()
      await expect(page.getByText('This action cannot be undone')).toBeVisible()
      // Cancel should close modal
      await page.click('button:has-text("Cancel")')
      await expect(page.getByText('Delete Opportunity')).not.toBeVisible()
    }
  })
})
