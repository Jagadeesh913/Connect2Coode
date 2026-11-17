import { expect, test, type Page } from '@playwright/test';

const legalPages = [
  ['/privacy', 'Privacy Policy'],
  ['/cookies', 'Cookie & Storage Policy'],
  ['/terms', 'Terms & Conditions'],
  ['/disclaimer', 'Disclaimer'],
  ['/accessibility', 'Accessibility Statement'],
  ['/support', 'Contact & Support'],
  ['/data-rights', 'Data & Account Rights'],
  ['/copyright', 'Copyright & Trademark Notice'],
] as const;

const trackingHostPattern = /(?:google-analytics|googletagmanager|doubleclick|segment|mixpanel|hotjar|clarity|facebook|connect\.facebook)\./i;

async function stubSignedOutSession(page: Page) {
  await page.route('**/api/v1/auth/refresh', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ statusCode: 401, message: 'No test session' }),
  }));
}

test.describe('public legal and compliance experience', () => {
  test.beforeEach(async ({ page }) => {
    await stubSignedOutSession(page);
  });

  for (const [path, heading] of legalPages) {
    test(`${path} renders its public document and footer links`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.getByRole('navigation', { name: `${heading} sections` })).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible();
      await expect(page.locator('main')).toContainText('Last reviewed');
    });
  }

  test('footer exposes every legal, help, and rights route', async ({ page }) => {
    await page.goto('/privacy');
    const footer = page.getByRole('contentinfo');

    for (const [path] of legalPages) {
      await expect(footer.locator(`a[href="${path}"]`)).toHaveCount(1);
    }

    await footer.locator('a[href="/support"]').click();
    await expect(page).toHaveURL(/\/support$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Contact & Support' })).toBeVisible();
  });

  test('legal pages remain within the viewport on mobile and desktop', async ({ page }) => {
    for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      for (const [path] of legalPages) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} at ${viewport.width}px`).toBeLessThanOrEqual(1);
      }
    }
  });

  test('theme control provides light and dark legal-page rendering', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();

    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('keyboard focus reaches policy navigation and the local-data control', async ({ page }) => {
    await page.goto('/data-rights');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Data & Account Rights' })).toBeVisible();
    await expect(page.getByText('Sign in to target an account-specific browser scope.')).toBeVisible();
  });

  test('runtime makes no analytics or advertising requests and creates no tracking cookie', async ({ page }) => {
    const requestedUrls: string[] = [];
    page.on('request', (request) => requestedUrls.push(request.url()));
    await page.route('https://**/*', (route) => route.abort());

    await page.goto('/cookies');
    await expect(page.getByRole('heading', { level: 1, name: 'Cookie & Storage Policy' })).toBeVisible();

    expect(requestedUrls.filter((url) => trackingHostPattern.test(new URL(url).hostname))).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).toBe('');
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys.every((key) => key.startsWith('c2c:user:'))).toBe(true);
  });
});

test('authenticated local-data clearing removes only the active browser scope', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      statusCode: 200,
      data: { token: 'test-access-token', id: 42, role: 'USER', email: 'test@example.com' },
    }),
  }));
  await page.route('**/api/v1/users/42/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ statusCode: 200, data: [] }),
  }));
  await page.addInitScript(() => {
    localStorage.setItem('c2c:user:v2:id%3A42:theme_pref', 'dark');
    localStorage.setItem('c2c:user:v2:id%3A42:problem_progress', '{"solved":[1]}');
    localStorage.setItem('c2c:user:v2:id%3A42:code_draft:two-sum:java', 'class Main {}');
    localStorage.setItem('c2c:user:v2:id%3A99:theme_pref', 'light');
  });

  await page.goto('/settings');
  const privacySection = page.getByRole('region', { name: 'Privacy, data, and support' });
  for (const path of ['/privacy', '/cookies', '/data-rights', '/support']) {
    await expect(privacySection.locator(`a[href="${path}"]`)).toHaveCount(1);
  }

  await page.goto('/data-rights');
  await page.getByRole('button', { name: 'Review and clear local data' }).click();
  await page.getByRole('button', { name: 'Clear local data' }).click();
  await expect(page.getByRole('status')).toContainText('Local data for this account was cleared');

  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.some((key) => key.startsWith('c2c:user:v2:id%3A42:'))).toBe(false);
  expect(keys).toContain('c2c:user:v2:id%3A99:theme_pref');
});
