import { test, expect } from '@playwright/test';

test.describe('Connect2Code Core Navigation & Layout', () => {
  test('loads landing page successfully with title and brand', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Connect2Code/i);
    const brand = page.locator('text=Connect2Code').first();
    await expect(brand).toBeVisible();
  });

  test('navigates to practice page with question workspace', async ({ page }) => {
    await page.goto('/practice');
    await expect(page).toHaveTitle(/Connect2Code/i);
  });

  test('renders 404 not found page gracefully on unknown route', async ({ page }) => {
    await page.goto('/non-existent-route-404');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });
});
