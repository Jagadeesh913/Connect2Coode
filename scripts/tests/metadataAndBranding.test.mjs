import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const pngDimensions = (path) => {
  const buffer = readFileSync(join(root, path));
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG', `${path} must be a PNG file`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

const listSourceFiles = (directory) => readdirSync(join(root, directory), { withFileTypes: true })
  .flatMap((entry) => {
    const relativePath = join(directory, entry.name);
    return entry.isDirectory() ? listSourceFiles(relativePath) : [relativePath];
  })
  .filter((path) => /\.(ts|tsx)$/.test(path));

test('HTML supplies one complete default metadata set without duplicate managed tags', () => {
  const html = read('index.html');
  const uniqueSelectors = [
    'name="description"',
    'name="robots"',
    'property="og:title"',
    'property="og:description"',
    'property="og:url"',
    'property="og:image"',
    'name="twitter:card"',
    'name="twitter:title"',
    'name="twitter:description"',
    'name="twitter:image"',
  ];

  uniqueSelectors.forEach((selector) => {
    assert.equal(html.split(selector).length - 1, 1, `${selector} must appear exactly once`);
  });
  assert.equal(html.split('rel="canonical"').length - 1, 1);
  assert.match(html, /<link rel="canonical" href="https:\/\/connect2code\.in\/"/);
  assert.match(html, /property="og:image" content="https:\/\/connect2code\.in\/social-card\.png"/);
  assert.match(read('src/core/metadata/RouteMetadata.tsx'), /upsertCanonical\(canonicalUrl\)/);
  assert.match(html, /<link rel="manifest" href="\/site\.webmanifest" \/>/);
  assert.match(html, /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png" \/>/);
});

test('manifest references present, correctly sized app icons', () => {
  const manifest = JSON.parse(read('public/site.webmanifest'));
  assert.equal(manifest.name, 'Connect2Code');
  assert.equal(manifest.display, 'standalone');

  const expectedDimensions = new Map([
    ['/app-icon-192.png', 192],
    ['/app-icon-512.png', 512],
    ['/app-icon-maskable-512.png', 512],
  ]);
  manifest.icons.forEach((icon) => {
    const expectedSize = expectedDimensions.get(icon.src);
    assert.ok(expectedSize, `unexpected manifest icon ${icon.src}`);
    assert.deepEqual(
      pngDimensions(`public${icon.src}`),
      { width: expectedSize, height: expectedSize }
    );
  });
  assert.deepEqual(pngDimensions('public/apple-touch-icon.png'), { width: 180, height: 180 });
  assert.deepEqual(pngDimensions('public/social-card.png'), { width: 1200, height: 630 });
});

test('central route metadata covers public, authenticated, admin, error, and dynamic routes', () => {
  const metadataSource = read('src/core/metadata/pageMetadata.ts');
  const exactPaths = [
    '/', '/oauth/callback', '/login', '/signup', '/forgot-password', '/practice',
    '/problems', '/dsa-sheet', '/companies', '/company-patterns', '/aptitude',
    '/logical', '/verbal', '/pseudocode', '/progress', '/roadmaps', '/interviews',
    '/dashboard', '/bookmarks', '/profile', '/settings', '/admin', '/admin/dashboard',
    '/admin/questions', '/admin/mcqs', '/admin/companies', '/admin/languages',
    '/admin/institutions', '/admin/dsa-sheets', '/500',
  ];

  exactPaths.forEach((path) => {
    assert.match(metadataSource, new RegExp(`['"]${path.replaceAll('/', '\\/')}['"]`));
  });
  assert.match(metadataSource, /segments\[0\] === 'problems'/);
  assert.match(metadataSource, /segments\[0\] === 'companies'/);
  assert.match(metadataSource, /segments\[0\] === 'roadmaps'/);
  assert.match(metadataSource, /'Page Not Found'/);
});

test('private, admin, callback, and error metadata is not indexable', () => {
  const metadataSource = read('src/core/metadata/pageMetadata.ts');
  assert.match(metadataSource, /robots: 'noindex, nofollow'/);
  assert.match(metadataSource, /robots: 'noindex, follow'/);
  assert.match(metadataSource, /'Admin Dashboard'[\s\S]*?privatePage/);
  assert.match(metadataSource, /'Page Not Found'[\s\S]*?privatePage|privatePage\([\s\S]*?'Page Not Found'/);
});

test('all document title writes are owned by the metadata manager', () => {
  const offenders = listSourceFiles('src')
    .filter((path) => !path.endsWith(join('core', 'metadata', 'RouteMetadata.tsx')))
    .filter((path) => read(path).includes('document.title'));
  assert.deepEqual(offenders, []);
});

test('dynamic detail pages register API-backed metadata overrides', () => {
  [
    'src/features/problems/pages/ProblemDetails.tsx',
    'src/features/companies/pages/CompanyDetails.tsx',
    'src/features/companies/pages/CompanyExamDetails.tsx',
  ].forEach((path) => {
    assert.match(read(path), /usePageMetadata\(/, `${path} must register dynamic metadata`);
  });
});
