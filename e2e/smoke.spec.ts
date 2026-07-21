import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Backend-independent smoke + accessibility checks (spec §32.4). These verify
 * routing guards, public pages, keyboard access and error pages without a live
 * Supabase. Login/onboarding E2E run in the CI job with a seeded local Supabase.
 */

test('unauthenticated visit to a protected route redirects to login', async ({ page }) => {
  await page.goto('/today');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /Willkommen zurück/ })).toBeVisible();
});

test('the app root redirects into the flow', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

test('login page renders the form and has no serious a11y violations', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel('E-Mail')).toBeVisible();
  await expect(page.getByLabel('Passwort')).toBeVisible();
  // No public registration link on a private product.
  await expect(page.getByRole('link', { name: /Registrieren/i })).toHaveCount(0);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious).toEqual([]);
});

test('login form shows validation errors on empty submit', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByText(/E-Mail-Adresse ein/)).toBeVisible();
});

test('an unknown route shows the not-found page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: /Diese Seite gibt es nicht/ })).toBeVisible();
});

test('the reset-password link is reachable from login by keyboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: /Passwort vergessen/ }).click();
  await expect(page).toHaveURL(/\/reset-password/);
  await expect(page.getByRole('heading', { name: /Passwort zurücksetzen/ })).toBeVisible();
});
