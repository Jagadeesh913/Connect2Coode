import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

import {
  PUBLIC_PRERENDER_ROUTES,
  SITE_ORIGIN,
  buildSitemapXml,
  generateSeoAssets,
  renderPrerenderedHtml,
} from '../generate-seo-assets.mjs';

const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return nextResolve(specifier + '.ts', context);
    }
    throw error;
  }
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));
const { resolvePageMetadata } = await import('../../src/core/metadata/pageMetadata.ts');

const root = process.cwd();
const sourceTemplate = readFileSync(join(root, 'index.html'), 'utf8');
const count = (source, needle) => source.split(needle).length - 1;

test('all indexable routes render meaningful, route-specific HTML without JavaScript', () => {
  for (const route of PUBLIC_PRERENDER_ROUTES) {
    const html = renderPrerenderedHtml(sourceTemplate, route);
    const canonical = new URL(route.path, `${SITE_ORIGIN}/`).toString();

    assert.match(html, new RegExp(`<h1>${route.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
    assert.ok(html.includes(route.introduction));
    assert.ok(html.includes(`<title>${route.title.replace('&', '&amp;')} | Connect2Code</title>`));
    assert.ok(html.includes(`content="${canonical}"`));
    assert.ok(html.includes('content="index, follow"'));
    assert.ok(html.includes('https://connect2code.in/social-card.png'));
    assert.equal(count(html, 'rel="canonical"'), 1);
    assert.equal(count(html, 'property="og:title"'), 1);
    assert.equal(count(html, 'name="twitter:title"'), 1);
  }
});

test('sitemap contains only canonical public hubs and no aliases, private routes, queries, or dynamic guesses', () => {
  const xml = buildSitemapXml();
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  assert.deepEqual(locations, PUBLIC_PRERENDER_ROUTES.map((route) => new URL(route.path, `${SITE_ORIGIN}/`).toString()));
  ['/login', '/admin', '/bookmarks', '/problems/1', '/companies/1', '/company-patterns']
    .forEach((value) => assert.ok(!xml.includes(value), `${value} must not appear in sitemap.xml`));
  locations.forEach((location) => assert.ok(!location.includes('?'), `${location} must not include a query`));
  locations.filter((location) => location !== `${SITE_ORIGIN}/`)
    .forEach((location) => assert.ok(!location.endsWith('/'), `${location} must not have a trailing slash`));
});

test('build generator emits public pages, a noindex app shell, a noindex 404, and sitemap', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'c2c-seo-'));
  try {
    await writeFile(join(directory, 'index.html'), sourceTemplate, 'utf8');
    await generateSeoAssets({ distDirectory: directory });

    const practice = await readFile(join(directory, 'practice.html'), 'utf8');
    const appShell = await readFile(join(directory, 'app.html'), 'utf8');
    const notFound = await readFile(join(directory, '404.html'), 'utf8');
    const sitemap = await readFile(join(directory, 'sitemap.xml'), 'utf8');

    assert.match(practice, /Coding Practice for Placement Interviews/);
    [appShell, notFound].forEach((html) => {
      assert.match(html, /name="robots" content="noindex, nofollow"/);
      assert.doesNotMatch(html, /rel="canonical"/);
      assert.doesNotMatch(html, /property="og:url"/);
    });
    assert.match(notFound, /Page Not Found \| Connect2Code/);
    assert.equal(sitemap, buildSitemapXml());
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('robots advertises the apex sitemap and does not hide pages from noindex headers', () => {
  const robots = readFileSync(join(root, 'public', 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/connect2code\.in\/sitemap\.xml$/m);
  ['/login', '/admin', '/bookmarks', '/profile'].forEach((path) => {
    assert.ok(!robots.includes(`Disallow: ${path}`), `${path} must remain crawlable so noindex can be observed`);
  });
});

test('authenticated API-backed, coming-soon, error, and unknown routes default to noindex', () => {
  [
    '/problems/42',
    '/companies/42',
    '/companies/42/exams/7',
    '/companies/exams/7',
    '/company-patterns/42',
    '/roadmaps/java',
    '/interviews',
    '/admin/dashboard',
    '/500',
    '/not-a-real-route',
  ].forEach((path) => {
    assert.equal(resolvePageMetadata(path).robots, 'noindex, nofollow', `${path} must not be indexable`);
  });
  assert.equal(resolvePageMetadata('/problems/not-real').title, 'Coding Problem');
  assert.equal(resolvePageMetadata('/companies/not-real').title, 'Company Placement Preparation');
});

test('Vercel preserves known deep links, removes bot-specific output, and leaves unknown routes as real 404s', () => {
  const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  const serialized = JSON.stringify(config);
  const rewrites = new Map(config.rewrites.map((rule) => [rule.source, rule.destination]));

  assert.equal(config.cleanUrls, true);
  assert.equal(config.trailingSlash, false);
  assert.equal(rewrites.get('/api/:path*'), 'https://api.connect2code.in/api/:path*');
  ['/problems/:slug', '/companies/:slug', '/companies/:companyId/exams/:examId', '/oauth/callback', '/admin/:path*']
    .forEach((path) => assert.equal(rewrites.get(path), '/app', `${path} must use the noindex app shell`));
  assert.ok(!config.rewrites.some((rule) => rule.source === '/(.*)' || rule.source === '/:path*'));
  assert.doesNotMatch(serialized, /user-agent|api\/social|Googlebot/i);

  const headerMap = new Map(config.headers.map((rule) => [rule.source, rule.headers]));
  ['/problems/:slug', '/companies/:slug', '/admin/:path*', '/500'].forEach((path) => {
    assert.ok(headerMap.get(path)?.some((header) => header.key === 'X-Robots-Tag' && header.value === 'noindex, nofollow'));
  });
});
