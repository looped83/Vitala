import { test, expect } from '@playwright/test';

/**
 * Backend-independent E2E for the Phase-3 capture routes. Without a live
 * Supabase (CI e2e job), we verify the route guards protect the new capture and
 * history pages. The full authenticated capture flow (create / edit / delete /
 * filter) is covered by the component tests + the seeded pgTAP database job.
 */

test('the capture route is protected and redirects to login', async ({ page }) => {
  await page.goto('/capture');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /Willkommen zurück/ })).toBeVisible();
});

test('the history route is protected and redirects to login', async ({ page }) => {
  await page.goto('/history');
  await expect(page).toHaveURL(/\/login/);
});
