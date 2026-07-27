import { test, expect } from '@playwright/test';

/**
 * Backend-independent E2E for the Phase-6 city route. Without a live Supabase
 * (CI e2e job), we verify the route guard protects the city page. The full
 * authenticated city experience — map, list, selection, rename, zoom, unlock
 * banner, keyboard + dark mode + reduced motion — is covered by the component
 * tests and the seeded pgTAP database job (docs/city-testing.md).
 */

test('the city route is protected and redirects to login', async ({ page }) => {
  await page.goto('/city');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /Willkommen zurück/ })).toBeVisible();
});

test('a city deep link is also protected when unauthenticated', async ({ page }) => {
  await page.goto('/city?region=nature_reserve');
  await expect(page).toHaveURL(/\/login/);
  // The login form stays reachable (keyboard target present).
  await expect(page.getByLabel(/E-Mail/i)).toBeVisible();
});
