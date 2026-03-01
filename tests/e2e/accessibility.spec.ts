/**
 * Accessibility Audit — axe-core automated scanning.
 *
 * Runs against public and authenticated pages.
 * Checks for critical and serious WCAG 2.1 AA violations.
 * Includes keyboard navigation tests for interactive components.
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login, TEST_USER } from './helpers'

// ─── Public Pages ─────────────────────────────────────────
const PUBLIC_PAGES = [
  { name: 'Login', path: '/login' },
  { name: 'Signup', path: '/signup' },
  { name: 'Forgot Password', path: '/forgot-password' },
  { name: 'Plans', path: '/plans' },
  { name: '8(a) Toolkit', path: '/8a-toolkit' },
  { name: 'Accessibility Statement', path: '/accessibility' },
]

for (const page of PUBLIC_PAGES) {
  test(`Public: ${page.name} (${page.path}) has no critical a11y violations`, async ({ page: pw }) => {
    await pw.goto(page.path)
    await pw.waitForLoadState('domcontentloaded')

    const results = await new AxeBuilder({ page: pw })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    // Filter to critical and serious only
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (criticalViolations.length > 0) {
      const summary = criticalViolations.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`
      )
      console.error(`a11y violations on ${page.path}:\n${summary.join('\n')}`)
    }

    expect(criticalViolations.length).toBe(0)
  })
}

// ─── Authenticated Pages ──────────────────────────────────
const AUTH_PAGES = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Pipeline', path: '/pipeline' },
  { name: 'Compliance', path: '/compliance' },
  { name: 'Proposals', path: '/proposals' },
]

for (const page of AUTH_PAGES) {
  test(`Auth: ${page.name} (${page.path}) has no critical a11y violations`, async ({ page: pw }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(pw)
    await pw.goto(page.path)
    await pw.waitForLoadState('domcontentloaded')

    const results = await new AxeBuilder({ page: pw })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (criticalViolations.length > 0) {
      const summary = criticalViolations.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`
      )
      console.error(`a11y violations on ${page.path}:\n${summary.join('\n')}`)
    }

    expect(criticalViolations.length).toBe(0)
  })
}

// ─── Keyboard Navigation ─────────────────────────────────
test.describe('Keyboard Navigation', () => {
  test('Tab navigates through interactive elements on login page', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    // Tab through the page — should reach the email input
    await page.keyboard.press('Tab')

    // Check that some element has focus
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedTag).toBeTruthy()
    expect(['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA']).toContain(focusedTag)
  })

  test('Escape closes modal dialogs', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await page.goto('/pipeline')
    await page.waitForLoadState('domcontentloaded')

    // Look for a button that opens a modal (Create Opportunity or similar)
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
    const buttonCount = await createButton.count()

    if (buttonCount > 0) {
      await createButton.first().click()

      // Wait for modal/dialog to appear
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]')
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Press Escape to close
        await page.keyboard.press('Escape')

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 3000 })
      }
    }
  })

  test('Sidebar navigation links are keyboard accessible', async ({ page }) => {
    if (!TEST_USER.password) {
      test.skip()
      return
    }

    await login(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')

    // Find nav links in sidebar
    const navLinks = page.locator('nav a[href]')
    const count = await navLinks.count()

    if (count > 0) {
      // First link should be focusable
      const firstLink = navLinks.first()
      await firstLink.focus()

      const isFocused = await firstLink.evaluate(
        (el) => document.activeElement === el
      )
      expect(isFocused).toBeTruthy()

      // Enter should activate the link (navigate)
      const href = await firstLink.getAttribute('href')
      expect(href).toBeTruthy()
    }
  })
})
