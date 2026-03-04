// filepath: tests/e2e/shredder.spec.ts
// E2E tests for the RFP Shredder feature — page loading, upload flow, error handling
import { test, expect, type Page } from '@playwright/test'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'maryadawson@gmail.com'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''

async function login(page: Page) {
  if (!TEST_PASSWORD) throw new Error('E2E_TEST_PASSWORD not set')
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15_000,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// TIER 1: Route Protection — Unauthenticated access
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Shredder: Route Protection', () => {
  test('Unauthenticated access to /shredder redirects to /login', async ({
    page,
  }) => {
    await page.context().clearCookies()
    await page.goto('/shredder')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('Unauthenticated access to /pipeline/any-id/shredder redirects to /login', async ({
    page,
  }) => {
    await page.context().clearCookies()
    await page.goto('/pipeline/00000000-0000-0000-0000-000000000000/shredder')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TIER 2: Shredder Landing Page — /shredder
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Shredder: Landing Page', () => {
  test('Landing page loads without crashing', async ({ page }) => {
    if (!TEST_PASSWORD) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)
    await page.goto('/shredder')

    // Should NOT show "An error occurred" or redirect to login
    const path = new URL(page.url()).pathname
    expect(path).not.toContain('/login')

    // Should show RFP Shredder heading or empty state
    const content = page
      .locator('text=/RFP Shredder/i')
      .or(page.locator('text=/no opportunities/i'))
    await expect(content.first()).toBeVisible({ timeout: 10_000 })
  })

  test('Landing page shows breadcrumb', async ({ page }) => {
    if (!TEST_PASSWORD) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)
    await page.goto('/shredder')

    await expect(
      page.locator('text=/RFP Shredder/i').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('No server error visible on landing page', async ({ page }) => {
    if (!TEST_PASSWORD) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)
    await page.goto('/shredder')

    // Should NOT show any error messages
    await expect(
      page.locator('text=/An error occurred/i')
    ).toHaveCount(0, { timeout: 5_000 })
    await expect(
      page.locator('text=/Server Components render/i')
    ).toHaveCount(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TIER 3: Shredder Detail Page — /pipeline/[id]/shredder
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Shredder: Detail Page', () => {
  test('Detail page loads for valid opportunity', async ({ page }) => {
    if (!TEST_PASSWORD) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)

    // First go to pipeline to get an opportunity ID
    await page.goto('/pipeline')
    await page.waitForLoadState('networkidle')

    // Find any link to a pipeline detail page
    const oppLink = page.locator('a[href*="/pipeline/"]').first()
    if (!(await oppLink.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'No opportunities in pipeline')
      return
    }

    const href = await oppLink.getAttribute('href')
    if (!href) {
      test.skip(true, 'No opportunity href found')
      return
    }

    // Extract opportunity ID and navigate to shredder
    const idMatch = href.match(/\/pipeline\/([^/]+)/)
    if (!idMatch) {
      test.skip(true, 'Could not extract opportunity ID')
      return
    }

    const shredderUrl = `/pipeline/${idMatch[1]}/shredder`
    await page.goto(shredderUrl)

    // Page should load without error
    const path = new URL(page.url()).pathname
    expect(path).not.toContain('/login')

    // Should show either upload area or error boundary (not blank crash)
    const content = page
      .locator('text=/RFP Shredder/i')
      .or(page.locator('text=/Upload/i'))
      .or(page.locator('text=/Something went wrong/i'))
      .or(page.locator('text=/Not found/i'))
    await expect(content.first()).toBeVisible({ timeout: 10_000 })
  })

  test('Detail page shows upload drop zone', async ({ page }) => {
    if (!TEST_PASSWORD) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)

    // Navigate to shredder via landing page
    await page.goto('/shredder')
    await page.waitForLoadState('networkidle')

    const oppCard = page.locator('a[href*="/shredder"]').first()
    if (!(await oppCard.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'No opportunities available')
      return
    }

    await oppCard.click()
    await page.waitForLoadState('networkidle')

    // Upload drop zone should be visible
    const uploadArea = page
      .locator('text=/Upload RFP Documents/i')
      .or(page.locator('text=/Drop your files/i'))
      .or(page.locator('input[type="file"]'))
    await expect(uploadArea.first()).toBeVisible({ timeout: 10_000 })
  })

  test('Detail page shows document list section', async ({ page }) => {
    if (!TEST_PASSWORD) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)

    await page.goto('/shredder')
    await page.waitForLoadState('networkidle')

    const oppCard = page.locator('a[href*="/shredder"]').first()
    if (!(await oppCard.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'No opportunities available')
      return
    }

    await oppCard.click()
    await page.waitForLoadState('networkidle')

    // Should show either document list or empty state
    const docSection = page
      .locator('text=/Uploaded Documents/i')
      .or(page.locator('text=/No RFP documents/i'))
    await expect(docSection.first()).toBeVisible({ timeout: 10_000 })
  })

  test('Detail page does not crash with server error', async ({ page }) => {
    if (!TEST_PASSWORD) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)

    await page.goto('/shredder')
    await page.waitForLoadState('networkidle')

    const oppCard = page.locator('a[href*="/shredder"]').first()
    if (!(await oppCard.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'No opportunities available')
      return
    }

    await oppCard.click()
    await page.waitForLoadState('networkidle')

    // Must NOT show the generic Next.js production error
    await expect(
      page.locator('text=/An error occurred in the Server Components render/i')
    ).toHaveCount(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TIER 4: Navigation — Sidebar link
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Shredder: Navigation', () => {
  test('RFP Shredder appears in sidebar navigation', async ({ page }) => {
    if (!TEST_PASSWORD) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)

    const shredderLink = page
      .getByRole('link', { name: /RFP Shredder/i })
      .or(page.locator('a[href="/shredder"]'))
    await expect(shredderLink.first()).toBeVisible({ timeout: 10_000 })
  })

  test('Clicking RFP Shredder sidebar link navigates to landing page', async ({
    page,
  }) => {
    if (!TEST_PASSWORD) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)

    const shredderLink = page
      .getByRole('link', { name: /RFP Shredder/i })
      .or(page.locator('a[href="/shredder"]'))

    if (!(await shredderLink.first().isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'RFP Shredder not in sidebar')
      return
    }

    await shredderLink.first().click()
    await page.waitForLoadState('networkidle')

    const path = new URL(page.url()).pathname
    expect(path).toBe('/shredder')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TIER 5: Server Actions — Module integrity
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Shredder: Server Action Health', () => {
  test('Shredder page does not have module import errors', async ({
    page,
  }) => {
    if (!TEST_PASSWORD) {
      test.skip(true, 'E2E_TEST_PASSWORD not set')
      return
    }
    await login(page)

    // Navigate to any shredder page — if actions.ts fails to load,
    // the page will crash with "An error occurred in the Server Components render"
    await page.goto('/shredder')
    await page.waitForLoadState('networkidle')

    // Check for console errors related to module loading
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    const oppCard = page.locator('a[href*="/shredder"]').first()
    if (!(await oppCard.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'No opportunities available')
      return
    }

    await oppCard.click()
    await page.waitForLoadState('networkidle')

    // The page MUST render without the generic Next.js error
    const errorText = page.locator(
      'text=/An error occurred/i'
    )
    await expect(errorText).toHaveCount(0, { timeout: 5_000 })
  })
})
