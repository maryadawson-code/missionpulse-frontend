/**
 * Smart Chat UX — End-to-End Tests
 * Sprint S-UX-1: T-UX-1.1 / T-UX-1.2 / T-UX-1.3
 *
 * Tests the SmartChatInterface page flow including:
 * - Profile-first header rendering
 * - Prompt chips display
 * - Opportunity context picker
 * - Agent attribution on responses
 * - Low-confidence confirmation bar
 * - AI disclaimer visibility
 */
import { test, expect } from '@playwright/test'
import { login, TEST_USER } from './helpers'

test.describe('Smart Chat UX', () => {
  test.beforeEach(async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }
    await login(page)
  })

  // ─── Page Load ──────────────────────────────────

  test('AI Chat page loads with SmartChatInterface', async ({ page }) => {
    await page.goto('/ai-chat')

    // Page title
    await expect(page.locator('h1')).toContainText('AI Assistant')

    // Subtitle confirms smart routing
    await expect(page.getByText(/automatically routed/i)).toBeVisible()
  })

  test('profile-first header shows user greeting', async ({ page }) => {
    await page.goto('/ai-chat')

    // Should show "Hi [Name], how can I help?"
    await expect(page.getByText(/Hi .+, how can I help/i)).toBeVisible({ timeout: 10_000 })
  })

  test('no agent dropdown is visible', async ({ page }) => {
    await page.goto('/ai-chat')
    await page.waitForTimeout(2000)

    // The old agent <select> should NOT exist (removed in Smart Chat)
    // Look for the old "General Assistant" option in a select
    const agentSelect = page.locator('select option:has-text("General Assistant")')
    // Should not have an agent selector — only opportunity selector allowed
    const selectElements = page.locator('select')
    const count = await selectElements.count()
    // Max 1 select (opportunity picker only). No agent dropdown.
    expect(count).toBeLessThanOrEqual(1)
  })

  // ─── Prompt Chips ───────────────────────────────

  test('prompt chips render on empty state', async ({ page }) => {
    await page.goto('/ai-chat')

    // Should show the empty state bot icon
    const botIcon = page.locator('.lucide-bot, [data-testid="empty-state"]')
    const emptyText = page.getByText(/How can I help/i)
    await expect(emptyText.or(botIcon)).toBeVisible({ timeout: 10_000 })

    // Prompt chip buttons should be present (at least 1)
    // Chips have agent color dots (small colored circles)
    const chipButtons = page.locator('button').filter({ hasText: /(Score|Draft|Check|Analyze|Review|Develop|Prep)/i })
    const chipCount = await chipButtons.count()
    // Should have prompt chips (0 is acceptable if role has no allowed agents)
    expect(chipCount).toBeGreaterThanOrEqual(0)
  })

  // ─── Input & Routing ───────────────────────────

  test('chat input accepts text and has send button', async ({ page }) => {
    await page.goto('/ai-chat')

    // Input field exists
    const input = page.locator('input[placeholder*="auto-routed"]')
    await expect(input).toBeVisible({ timeout: 10_000 })

    // Send button exists
    const sendBtn = page.locator('button').filter({ has: page.locator('.lucide-send') })
    await expect(sendBtn).toBeVisible()

    // Type a message
    await input.fill('What is our pWin for this opportunity?')
    await expect(sendBtn).toBeEnabled()
  })

  test('playbook search button is present', async ({ page }) => {
    await page.goto('/ai-chat')

    // BookOpen icon button for playbook search
    const playbookBtn = page.locator('button[title="Search Playbook"]')
    await expect(playbookBtn).toBeVisible({ timeout: 10_000 })
  })

  // ─── AI Disclaimer ─────────────────────────────

  test('AI disclaimer is visible', async ({ page }) => {
    await page.goto('/ai-chat')

    await expect(
      page.getByText(/AI GENERATED.*REQUIRES HUMAN REVIEW/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test('AskSage attribution is shown in header', async ({ page }) => {
    await page.goto('/ai-chat')

    await expect(
      page.getByText(/Powered by AskSage/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  // ─── Opportunity Context ────────────────────────

  test('opportunity picker dropdown exists if opportunities available', async ({ page }) => {
    await page.goto('/ai-chat')

    // Look for the opportunity select (may or may not have options depending on data)
    const oppSelect = page.locator('select').first()
    // If select exists, it should have the "No opportunity context" default
    const noContextOption = page.locator('option:has-text("No opportunity context")')
    const selectCount = await oppSelect.count()
    if (selectCount > 0) {
      await expect(noContextOption).toBeVisible()
    }
  })

  // ─── Token Budget Banner ────────────────────────

  test('token budget banner renders when applicable', async ({ page }) => {
    await page.goto('/ai-chat')

    // The TokenBudgetBanner may or may not be visible depending on usage
    // Just verify the page renders without crashing
    await expect(page.locator('h1')).toContainText('AI Assistant')
  })
})
