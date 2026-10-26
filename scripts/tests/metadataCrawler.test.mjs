import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

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
const {
  renderCrawlerDocument,
  resolveMetadataOrigin,
} = await import('../../src/core/metadata/crawlerMetadata.ts');
const { default: socialHandler, resolveApiBackedMetadata } = await import('../../api/social.ts');

const count = (source, needle) => source.split(needle).length - 1;

test('crawler document renders one absolute, escaped metadata set for public and private routes', () => {
  const publicHtml = renderCrawlerDocument(resolvePageMetadata('/problems/two-sum/'), 'https://www.example.com');
  assert.match(publicHtml, /<title>Two Sum \| Connect2Code<\/title>/);
  assert.match(publicHtml, /<link rel="canonical" href="https:\/\/www\.example\.com\/problems\/two-sum">/);
  assert.match(publicHtml, /<meta property="og:image" content="https:\/\/www\.example\.com\/social-card\.png">/);
  assert.equal(count(publicHtml, 'rel="canonical"'), 1);
  assert.equal(count(publicHtml, 'property="og:title"'), 1);
  assert.equal(count(publicHtml, 'name="twitter:title"'), 1);

  const privateHtml = renderCrawlerDocument(resolvePageMetadata('/admin/dashboard'), 'https://www.example.com');
  assert.match(privateHtml, /name="robots" content="noindex, nofollow"/);

  const escapedHtml = renderCrawlerDocument({
    ...resolvePageMetadata('/problems/1'),
    title: '<script>alert(1)</script> & title',
    description: 'Safe <b>description</b> & text',
  }, 'https://www.example.com');
  assert.doesNotMatch(escapedHtml, /<script>/);
  assert.match(escapedHtml, /&amp; title/);
});

test('canonical origins prefer only a configured HTTPS production origin', () => {
  assert.equal(
    resolveMetadataOrigin('https://preview-123.vercel.app/problems/1', 'https://connect2code.example/'),
    'https://connect2code.example'
  );
  assert.equal(
    resolveMetadataOrigin('https://preview-123.vercel.app/problems/1', 'http://connect2code.example'),
    'https://preview-123.vercel.app'
  );
});

test('API-backed crawler metadata only uses a response that matches the requested dynamic route', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ data: { id: 42, title: 'Two Sum', description: 'Find two values.' } }),
  });

  try {
    const fallback = resolvePageMetadata('/problems/42');
    const metadata = await resolveApiBackedMetadata('/problems/42', fallback);
    assert.equal(metadata.title, 'Two Sum');
    assert.equal(metadata.description, 'Find two values.');

    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ data: { id: 99, title: 'Wrong problem' } }),
    });
    const rejected = await resolveApiBackedMetadata('/problems/42', fallback);
    assert.deepEqual(rejected, fallback);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('crawler endpoint returns noindex private markup and rejects non-GET requests', async () => {
  const output = { statusCode: 0, headers: {}, body: '' };
  const response = {
    status(code) {
      output.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      output.headers[name] = value;
      return this;
    },
    send(body) {
      output.body = body;
    },
  };

  await socialHandler({ method: 'GET', query: { path: 'admin/dashboard' }, headers: { host: 'www.example.com' } }, response);
  assert.equal(output.statusCode, 200);
  assert.equal(output.headers['x-robots-tag'], 'noindex, nofollow');
  assert.match(output.body, /name="robots" content="noindex, nofollow"/);

  await socialHandler({ method: 'POST', query: {}, headers: {} }, response);
  assert.equal(output.statusCode, 405);
  assert.equal(output.headers.allow, 'GET');
});

test('Vercel routes social crawlers to the renderer and sends noindex headers for private entry points', () => {
  const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
  assert.equal(config.rewrites[0].source, '/api/:path((?!social(?:/|$)).*)');
  assert.ok(config.rewrites.some((rule) => rule.destination === '/api/social?path=/:path*' && rule.has?.[0]?.key === 'user-agent'));

  const privatePaths = new Set(config.headers.map((rule) => rule.source));
  ['/oauth/callback', '/login', '/signup', '/forgot-password', '/dashboard', '/bookmarks', '/profile', '/settings', '/admin', '/admin/:path*', '/500']
    .forEach((path) => assert.ok(privatePaths.has(path), `${path} must have an X-Robots-Tag header`));
});
