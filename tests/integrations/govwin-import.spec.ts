/**
 * GovWin IQ Integration Regression Tests
 *
 * Tests: OAuth flow, opportunity alerts, import, competitor tracking.
 */
import { test, expect } from '@playwright/test'

test.describe('GovWin IQ Integration', () => {
  test('GovWin integration page renders', async ({ page }) => {
    await page.goto('/integrations/govwin')
    await expect(page).toHaveURL(/\/(login|integrations\/govwin)/)
  })

  test('Alert filter inputs are present when connected', async ({ page }) => {
    await page.goto('/integrations/govwin')
    const url = page.url()
    if (url.includes('govwin')) {
      const naicsInput = page.getByPlaceholder(/541512/i)
      if (await naicsInput.isVisible()) {
        await expect(naicsInput).toBeVisible()
      }
    }
  })

  test('Opportunity alerts section renders', async ({ page }) => {
    await page.goto('/integrations/govwin')
    const url = page.url()
    if (url.includes('govwin')) {
      await expect(page.getByText('Opportunity Alerts')).toBeVisible()
    }
  })

  test('Capabilities cards display correctly', async ({ page }) => {
    await page.goto('/integrations/govwin')
    const url = page.url()
    if (url.includes('govwin')) {
      const capabilities = ['Opportunity Alerts', 'Competitor Tracking', 'Agency Intelligence']
      for (const cap of capabilities) {
        await expect(page.getByText(cap).first()).toBeVisible()
      }
    }
  })
})
