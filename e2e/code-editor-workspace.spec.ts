import { test, expect } from '@playwright/test';

test.describe('Code Editor Workspace & Authentication Boundaries', () => {
  test('displays session recovery when auth refresh encounters a network failure', async ({ page }) => {
    // Abort network request to simulate offline / unreachable auth server
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/problems/1');

    // Should display the defensive SessionRecoveryState
    const recoveryHeading = page.getByRole('heading', { name: /Can’t reach the server/i });
    await expect(recoveryHeading).toBeVisible({ timeout: 10000 });

    const tryAgainBtn = page.getByRole('button', { name: /Try again/i });
    await expect(tryAgainBtn).toBeVisible();
  });

  test('displays authentication gate on problem detail page when definitively unauthenticated (401)', async ({ page }) => {
    // Intercept refresh returning 401 Unauthorized
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 401,
          message: 'No active session or refresh token expired',
        }),
      });
    });

    await page.goto('/problems/1');

    await expect(page).toHaveTitle(/Connect2Code/i);

    // Verify the authentication gate heading and description are presented
    const gateTitle = page.locator('text=Sign in to solve coding problems').first();
    await expect(gateTitle).toBeVisible({ timeout: 10000 });

    const gateDesc = page.locator('text=Log in to open the coding workspace').first();
    await expect(gateDesc).toBeVisible();

    // Verify Sign In CTA button is visible
    const signInBtn = page.getByRole('button', { name: /Sign in to continue|Log In|Sign In/i }).first();
    await expect(signInBtn).toBeVisible();
  });

  test('opens auth modal from problem detail gate when unauthenticated', async ({ page }) => {
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 401,
          message: 'No active session',
        }),
      });
    });

    await page.goto('/problems/1');

    const signInBtn = page.getByRole('button', { name: /Sign in to continue|Log In|Sign In/i }).first();
    await expect(signInBtn).toBeVisible({ timeout: 10000 });
    await signInBtn.click();

    // Verify modal appears with email and password input fields
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

  test('loads problem workspace and editor when authenticated via session refresh', async ({ page }) => {
    // Intercept auth refresh to simulate an authenticated active session
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'Token Refreshed Successfully',
          data: {
            token: 'mock-valid-bearer-token',
            user: {
              id: 99,
              email: 'developer@connect2code.in',
              firstName: 'Test',
              lastName: 'Engineer',
              role: 'ROLE_USER',
            },
          },
        }),
      });
    });

    // Intercept question detail
    await page.route('**/api/v1/question/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'Question Fetched Successfully',
          data: {
            id: 1,
            title: 'Two Sum',
            description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            difficulty: 'Easy',
            topic: 'Arrays',
            testCases: [
              {
                id: 1,
                input: '[2,7,11,15]\n9',
                expectedOutput: '[0,1]',
                isHidden: false,
              },
            ],
          },
        }),
      });
    });

    // Intercept languages
    await page.route('**/api/v1/languages/list', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'Languages Fetched Successfully',
          data: [
            { id: 1, name: 'Java', referenceId: 62, isActive: true },
            { id: 2, name: 'Python', referenceId: 71, isActive: true },
            { id: 3, name: 'C++', referenceId: 54, isActive: true },
          ],
        }),
      });
    });

    // Intercept user progress
    await page.route('**/api/v1/**/getSubmiteedQuestionIds', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 200, data: [] }),
      });
    });

    await page.route('**/api/v1/**/getAPttemptedQuestionIds', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 200, data: [] }),
      });
    });

    await page.goto('/problems/1');

    // Problem title should now be rendered in the authenticated workspace
    const problemTitle = page.locator('text=Two Sum').first();
    await expect(problemTitle).toBeVisible({ timeout: 15000 });

    // Run Code and Submit buttons should be visible
    const runBtn = page.getByRole('button', { name: /Run/i }).first();
    await expect(runBtn).toBeVisible();

    const submitBtn = page.getByRole('button', { name: /Submit/i }).first();
    await expect(submitBtn).toBeVisible();
  });
});
