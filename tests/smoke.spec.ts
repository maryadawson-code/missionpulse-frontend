import { test, expect } from '@playwright/test';

test.describe('MissionPulse Smoke Tests', () => {
  test('login page loads with correct Supabase', async ({ page }) => {
    await page.goto('/login.html');
    await expect(page).toHaveTitle(/MissionPulse/i);
    const html = await page.content();
    expect(html).toContain('djuviwarqdvlbgcfuupa');
    expect(html).not.toContain('qdrtpnpnhkxvfmvfziop');
  });

  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    await page.goto('/dashboard.html');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('login');
  });

  test('pipeline kanban uses correct schema', async ({ page }) => {
    await page.goto('/pipeline-kanban.html');
    const html = await page.content();
    expect(html).toContain('djuviwarqdvlbgcfuupa');
    expect(html).toContain('identified');
    expect(html).toContain('gate_1');
  });

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup.html');
    await expect(page.locator('form, input[type="email"], #email')).toBeVisible({ timeout: 5000 });
  });

  test('no stale Supabase on index', async ({ page }) => {
    await page.goto('/index.html');
    const html = await page.content();
    expect(html).not.toContain('qdrtpnpnhkxvfmvfziop');
  });

  test('404 page exists', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.locator('body')).toContainText(/not found|404|back/i);
  });
});
