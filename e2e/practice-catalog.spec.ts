import { test, expect } from '@playwright/test';

test.describe('Practice Problem Catalog & Authentication Gate', () => {
  test('renders public coding practice preview when unauthenticated', async ({ page }) => {
    await page.goto('/practice');

    // Title and brand
    await expect(page).toHaveTitle(/Connect2Code/i);

    // Public gateway article and headings
    const heading = page.getByRole('heading', { name: /Coding Practice for Placement Interviews/i });
    await expect(heading).toBeVisible();

    const whatYouCanPrepare = page.getByRole('heading', { name: /What you can prepare/i });
    await expect(whatYouCanPrepare).toBeVisible();

    // Verify sign in callout
    const signInPrompt = page.locator('text=/Sign in to continue|require an account/i').first();
    await expect(signInPrompt).toBeVisible();
  });

  test('opens authentication modal when clicking login from practice gateway', async ({ page }) => {
    await page.goto('/practice');

    // Click Login button in the navbar
    const loginButton = page.getByRole('button', { name: 'Login' }).first();
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // Verify modal appears with email and password fields
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });
});
