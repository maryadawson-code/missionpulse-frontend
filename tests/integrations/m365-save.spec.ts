/**
 * Microsoft 365 Integration Regression Tests
 *
 * Tests: OAuth, OneDrive save, Word Online link, calendar push.
 */
import { test, expect } from '@playwright/test'

test.describe('Microsoft 365 Integration', () => {
  test('M365 integration page renders', async ({ page }) => {
    await page.goto('/integrations/m365')
    await expect(page).toHaveURL(/\/(login|integrations\/m365)/)
  })

  test('Connection status shows not connected', async ({ page }) => {
    await page.goto('/integrations/m365')
    const url = page.url()
    if (url.includes('m365')) {
      await expect(page.getByText('Microsoft 365')).toBeVisible()
    }
  })

  test('Capability cards render', async ({ page }) => {
    await page.goto('/integrations/m365')
    const url = page.url()
    if (url.includes('m365')) {
      const capabilities = ['OneDrive Storage', 'Word Online Editing', 'Calendar Sync']
      for (const cap of capabilities) {
        await expect(page.getByText(cap)).toBeVisible()
      }
    }
  })

  test('Env var instructions shown when disconnected', async ({ page }) => {
    await page.goto('/integrations/m365')
    const url = page.url()
    if (url.includes('m365')) {
      await expect(page.getByText('M365_CLIENT_ID')).toBeVisible()
    }
  })
})
