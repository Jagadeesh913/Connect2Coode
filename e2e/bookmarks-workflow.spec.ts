import { test, expect } from '@playwright/test';

test.describe('Bookmarks Page & API Integration Workflows', () => {
  test('redirects unauthenticated users from /bookmarks to landing page and stores return path', async ({ page }) => {
    // Intercept refresh to return 401 Unauthorized
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

    await page.goto('/bookmarks');

    // ProtectedRoute redirects unauthenticated users to '/'
    await expect(page).toHaveURL('/');

    // Verify post_auth_redirect was set in sessionStorage
    const redirectTarget = await page.evaluate(() => sessionStorage.getItem('post_auth_redirect'));
    expect(redirectTarget).toBe('/bookmarks');
  });

  test('displays API-driven bookmarks and handles search and removal', async ({ page }) => {
    // 1. Authenticate user
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

    // 2. Mock GET bookmarks
    let bookmarksList = [
      { questionId: 101, title: 'Two Sum Problem', difficulty: 'Easy' },
      { questionId: 102, title: 'LRU Cache Design', difficulty: 'Hard' },
    ];

    await page.route('**/api/v1/users/99/questions/bookmarks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'Bookmarks fetched',
          data: bookmarksList,
        }),
      });
    });

    // 3. Mock DELETE bookmark
    let deleteCalled = false;
    await page.route('**/api/v1/users/99/questions/101/bookmark', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        bookmarksList = bookmarksList.filter((b) => b.questionId !== 101);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 200,
            message: 'Bookmark removed successfully',
            data: null,
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/bookmarks');

    // Verify header and items
    await expect(page.locator('h1')).toContainText('Saved Bookmarks');

    const twoSumCard = page.locator('text=Two Sum Problem').first();
    const lruCard = page.locator('text=LRU Cache Design').first();
    await expect(twoSumCard).toBeVisible({ timeout: 10000 });
    await expect(lruCard).toBeVisible();

    // Verify search filtering
    const searchInput = page.getByPlaceholder(/Search by title or question ID/i);
    await searchInput.fill('LRU');
    await expect(twoSumCard).not.toBeVisible();
    await expect(lruCard).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(twoSumCard).toBeVisible();
    await expect(lruCard).toBeVisible();

    // Remove Two Sum bookmark
    const removeBtn = page.getByLabel('Remove Two Sum Problem bookmark');
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // Expect DELETE API call was made and item is removed
    await expect(page.locator('text=Two Sum Problem')).not.toBeVisible({ timeout: 5000 });
    expect(deleteCalled).toBe(true);
    await expect(lruCard).toBeVisible();
  });

  test('displays empty state when user has no bookmarked problems', async ({ page }) => {
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'Token Refreshed',
          data: {
            token: 'mock-valid-bearer-token',
            user: {
              id: 99,
              email: 'developer@connect2code.in',
              role: 'ROLE_USER',
            },
          },
        }),
      });
    });

    await page.route('**/api/v1/users/99/questions/bookmarks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'Bookmarks fetched',
          data: [],
        }),
      });
    });

    await page.goto('/bookmarks');

    const emptyTitle = page.locator('text=No bookmarks saved').first();
    await expect(emptyTitle).toBeVisible({ timeout: 10000 });

    const exploreBtn = page.getByRole('button', { name: /Explore Problems/i });
    await expect(exploreBtn).toBeVisible();
  });
});
