/**
 * Accessibility Audit — axe-core automated scanning.
 *
 * Runs against all major public pages.
 * Checks for critical and serious WCAG 2.1 AA violations.
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PUBLIC_PAGES = [
  { name: 'Login', path: '/login' },
  { name: 'Signup', path: '/signup' },
  { name: 'Forgot Password', path: '/forgot-password' },
  { name: 'Plans', path: '/plans' },
  { name: '8(a) Toolkit', path: '/8a-toolkit' },
  { name: 'Accessibility Statement', path: '/accessibility' },
]

for (const page of PUBLIC_PAGES) {
  test(`${page.name} (${page.path}) has no critical a11y violations`, async ({ page: pw }) => {
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
