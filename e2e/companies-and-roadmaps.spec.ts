import { test, expect } from '@playwright/test';

test.describe('Companies & Learning Roadmaps', () => {
  test('renders companies directory page', async ({ page }) => {
    await page.goto('/companies');
    await expect(page).toHaveTitle(/Connect2Code/i);

    // Main header or brand should be present
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('navigates to interview prep directory', async ({ page }) => {
    await page.goto('/interview-prep');
    await expect(page).toHaveTitle(/Connect2Code/i);
  });
});
