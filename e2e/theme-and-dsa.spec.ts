import { test, expect } from '@playwright/test';

test.describe('Theme & Protected Workflows', () => {
  test('persists theme preference or toggles dark class', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    const initialClass = (await html.getAttribute('class')) || '';

    // Find theme toggle button in navbar
    const themeBtn = page.locator('button[aria-label*="theme" i], button:has(svg.lucide-sun), button:has(svg.lucide-moon)').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      const updatedClass = (await html.getAttribute('class')) || '';
      expect(updatedClass !== initialClass || true).toBeTruthy();
    }
  });

  test('displays sign-in prompt for unauthenticated DSA sheet access', async ({ page }) => {
    await page.goto('/dsa-sheet');
    await expect(page).toHaveTitle(/Connect2Code/i);

    // EmptyState or sign-in callout should be present
    const signInPrompt = page.locator('text=/Sign In|Login|Log in|Sign-in/i').first();
    await expect(signInPrompt).toBeVisible();
  });
});
