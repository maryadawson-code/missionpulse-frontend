// filepath: tests/e2e/pipeline.spec.ts
import { test, expect } from '@playwright/test'
import { login, TEST_USER } from './helpers'

test.describe('Pipeline Table (T-8)', () => {
  test.beforeEach(async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)
  })

  test('Pipeline page loads with table', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page.locator('h1')).toHaveText('Pipeline')
    // Table should render
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 })
    // Search input should be present
    await expect(page.locator('input[placeholder="Search pipeline..."]')).toBeVisible()
  })

  test('Sort by column header click', async ({ page }) => {
    await page.goto('/pipeline')
    await page.waitForSelector('table')

    // Click "Contract Value" header to sort
    const ceilingHeader = page.locator('th', { hasText: 'Contract Value' })
    await ceilingHeader.click()
    // Column should show active sort indicator (▲ for ascending)
    await expect(ceilingHeader).toContainText('▲')
    // Click again to reverse sort
    await ceilingHeader.click()
    await expect(ceilingHeader).toContainText('▼')
  })

  test('Filter by phase narrows results', async ({ page }) => {
    await page.goto('/pipeline')
    await page.waitForSelector('table')

    const countBefore = await page.locator('tbody tr').count()

    // Select a phase filter — the select has "All Phases" as first option
    const phaseSelect = page.locator('select').first()
    await phaseSelect.selectOption({ index: 1 }) // Pick first real phase
    await page.waitForTimeout(300) // Debounce

    const countAfter = await page.locator('tbody tr').count()
    // Result count should change or stay same (depending on data)
    expect(countAfter).toBeLessThanOrEqual(countBefore)
  })

  test('Search filters by title', async ({ page }) => {
    await page.goto('/pipeline')
    await page.waitForSelector('table')

    await page.fill('input[placeholder="Search pipeline..."]', 'DHA')
    await page.waitForTimeout(300) // Debounce

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

  test('New Opportunity button opens create modal', async ({ page }) => {
    await page.goto('/pipeline')
    // CreateOpportunityButton renders a modal, not a navigation link
    const newButton = page.getByRole('button', { name: /new opportunity/i })
      .or(page.locator('button', { hasText: 'New Opportunity' }))
    await expect(newButton.first()).toBeVisible({ timeout: 10_000 })
    await newButton.first().click()
    // Modal should appear with a title field
    await expect(
      page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i))
    ).toBeVisible({ timeout: 5_000 })
  })

  test('Delete shows confirmation modal', async ({ page }) => {
    await page.goto('/pipeline')
    await page.waitForSelector('table')

    const deleteButton = page.locator('button', { hasText: 'Delete' }).first()
    if (await deleteButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deleteButton.click()
      await expect(page.getByText('Delete Opportunity')).toBeVisible()
      await expect(page.getByText('This action cannot be undone')).toBeVisible()
      // Cancel should close modal
      await page.getByRole('button', { name: /cancel/i }).click()
      await expect(page.getByText('Delete Opportunity')).not.toBeVisible()
    }
  })
})
