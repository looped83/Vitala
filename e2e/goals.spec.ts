import { test, expect } from '@playwright/test';

/**
 * Backend-independent E2E for the Phase-4 routes (goals, review, today).
 * Without a live Supabase (CI e2e job), we verify the route guards protect the
 * new surfaces. The full authenticated flows (create goal from template, pause,
 * complete a ritual, morning/evening check-in, weekly/monthly review) are
 * covered by the component tests + the seeded pgTAP database job and the
 * live-DB validation of the RPC write path.
 */

test('the goals route is protected and redirects to login', async ({ page }) => {
  await page.goto('/goals');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /Willkommen zurück/ })).toBeVisible();
});

test('the review route is protected and redirects to login', async ({ page }) => {
  await page.goto('/review');
  await expect(page).toHaveURL(/\/login/);
});

test('the today route is protected and redirects to login', async ({ page }) => {
  await page.goto('/today');
  await expect(page).toHaveURL(/\/login/);
});
