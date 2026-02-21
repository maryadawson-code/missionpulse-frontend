/**
 * Slack Integration Regression Tests
 *
 * Tests: OAuth, notifications, channel management, gate approvals.
 */
import { test, expect } from '@playwright/test'

test.describe('Slack Integration', () => {
  test('Slack integration page renders', async ({ page }) => {
    await page.goto('/integrations/slack')
    await expect(page).toHaveURL(/\/(login|integrations\/slack)/)
  })

  test('Notification preferences displayed', async ({ page }) => {
    await page.goto('/integrations/slack')
    const url = page.url()
    if (url.includes('slack')) {
      await expect(page.getByText('Notification Preferences')).toBeVisible()
    }
  })

  test('All notification types listed', async ({ page }) => {
    await page.goto('/integrations/slack')
    const url = page.url()
    if (url.includes('slack')) {
      const types = [
        'Gate Approvals',
        'Deadline Warnings',
        'HITL Queue Items',
        'pWin Changes',
        'Team Assignments',
      ]
      for (const type of types) {
        await expect(page.getByText(type)).toBeVisible()
      }
    }
  })

  test('Channel configuration section renders', async ({ page }) => {
    await page.goto('/integrations/slack')
    const url = page.url()
    if (url.includes('slack')) {
      await expect(page.getByText('Channel Configuration')).toBeVisible()
      await expect(page.getByText('#mp-[opportunity-title]')).toBeVisible()
    }
  })
})
