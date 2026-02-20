// filepath: tests/e2e/helpers.ts
import { type Page, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Test user credentials
// Use a dedicated test account to avoid polluting production data.
// These match the Supabase auth record for maryadawson@gmail.com.
// Override via env: E2E_TEST_EMAIL, E2E_TEST_PASSWORD
// ---------------------------------------------------------------------------

export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL ?? 'maryadawson@gmail.com',
  password: process.env.E2E_TEST_PASSWORD ?? '',
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** Fill in login form and submit. Does NOT assert redirect. */
export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
}

/** Login and wait for dashboard redirect */
export async function login(page: Page, email?: string, password?: string) {
  const e = email ?? TEST_USER.email
  const p = password ?? TEST_USER.password

  if (!p) {
    throw new Error(
      'E2E_TEST_PASSWORD not set. Run: E2E_TEST_PASSWORD=yourpass npx playwright test'
    )
  }

  await fillLoginForm(page, e, p)
  // Wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 })
}

/** Click sign out and wait for redirect to /login */
export async function logout(page: Page) {
  // Try the sidebar sign out button first
  const signOutBtn = page.getByRole('button', { name: /sign out/i })
  if (await signOutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await signOutBtn.click()
  } else {
    // Fallback: navigate to a sign-out action URL if one exists
    await page.goto('/login')
  }
  await page.waitForURL('**/login', { timeout: 10_000 })
}

/** Assert the page is on a protected route (not /login, /signup, /forgot-password) */
export async function assertOnProtectedRoute(page: Page) {
  const path = new URL(page.url()).pathname
  expect(path).not.toContain('/login')
  expect(path).not.toContain('/signup')
  expect(path).not.toContain('/forgot-password')
}

/** Assert the page was redirected to /login */
export async function assertOnLogin(page: Page) {
  await expect(page).toHaveURL(/\/login/)
}
