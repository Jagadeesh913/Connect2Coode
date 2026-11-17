import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

test('public legal, support, accessibility, and data-rights routes are reachable from the router and footer', () => {
  const routes = read('src/routes/appRoutes.tsx');
  const footer = read('src/shared/components/ui/Footer.tsx');
  const requiredPaths = [
    '/privacy',
    '/cookies',
    '/terms',
    '/disclaimer',
    '/accessibility',
    '/support',
    '/data-rights',
    '/copyright',
  ];

  requiredPaths.forEach((path) => {
    assert.match(routes, new RegExp(`path: ['"]${path.replaceAll('/', '\\/')}['"]`));
    assert.match(footer, new RegExp(`to=['"]${path.replaceAll('/', '\\/')}['"]`));
  });
});

test('privacy disclosures match the source-visible data and preserve unknown backend facts', () => {
  const content = read('src/features/legal/legalContent.ts');

  assert.match(content, /email address, name, password submitted to the API/);
  assert.match(content, /registration number, joining and passing years/);
  assert.match(content, /code, selected language, custom input, submissions/);
  assert.match(content, /backend’s retention periods[\s\S]*not defined/);
  assert.match(content, /legal entity operating the service[\s\S]*must be approved and published/);
  assert.match(content, /no verified account deletion, complete data export, or privacy-request endpoint/);
  assert.doesNotMatch(content, /we delete all data within \d+ days/i);
  assert.doesNotMatch(content, /GDPR compliant|DPDP compliant/i);
});

test('cookie policy avoids unnecessary consent UI while no optional tracking exists', () => {
  const content = read('src/features/legal/legalContent.ts');
  const app = read('src/App.tsx');
  const packageJson = read('package.json');

  assert.match(content, /does not install analytics, advertising, social-pixel, or behavior-tracking tools/);
  assert.match(content, /A consent banner is therefore not shown/);
  assert.match(content, /If optional analytics, advertising, or other non-essential storage is introduced/);
  assert.match(content, /exact name unverified/);
  assert.doesNotMatch(app, /CookieBanner|ConsentBanner|AnalyticsProvider/);
  assert.doesNotMatch(packageJson, /google-analytics|gtag|segment|mixpanel|hotjar|clarity|facebook-pixel/i);
});

test('data-rights control distinguishes browser clearing from backend account deletion', () => {
  const controls = read('src/features/legal/components/LocalDataControls.tsx');
  const content = read('src/features/legal/legalContent.ts');

  assert.match(controls, /userScopedStorage\.clearForUser\(user\)/);
  assert.match(controls, /It does not delete your account, bookmarks, submissions, profile, or other server records/);
  assert.match(content, /Backend dependency: implement authenticated account deletion and export\/request workflows/);
});

test('admin question details apply the shared final URL boundary to legacy API records', () => {
  const modal = read('src/features/admin/components/questions/QuestionDetailsModal.tsx');

  assert.match(modal, /getSafeExternalUrl\(question\?\.leetCodeUrl\)/);
  assert.match(modal, /getSafeExternalUrl\(question\?\.gfgUrl\)/);
  assert.match(modal, /getSafeExternalUrl\(question\?\.hackerRankUrl\)/);
  assert.match(modal, /getSafeRemoteImageUrl\(platformSummary\?\.logoUrl\)/);
  assert.match(modal, /referrerPolicy="no-referrer"/);
  assert.doesNotMatch(modal, /href=\{question\.(?:leetCodeUrl|gfgUrl|hackerRankUrl)\}/);
});

test('admin reference logos use the strict remote-image boundary for stored and preview values', () => {
  const references = read('src/features/admin/pages/AdminReferences.tsx');

  assert.match(references, /getSafeRemoteImageUrl\(item\.logoUrl\)/);
  assert.match(references, /getSafeRemoteImageUrl\(watch\('logoUrl'\)\)/);
  assert.match(references, /referrerPolicy="no-referrer"/);
  assert.doesNotMatch(references, /src=\{item\.logoUrl\}/);
});

test('legal routes have metadata and prerender entries', () => {
  const metadata = read('src/core/metadata/pageMetadata.ts');
  const publicRoutes = read('src/core/metadata/publicPageContent.json');
  const requiredPaths = ['/privacy', '/cookies', '/terms', '/disclaimer', '/accessibility', '/support', '/data-rights', '/copyright'];

  requiredPaths.forEach((path) => {
    assert.match(metadata, new RegExp(`['"]${path.replaceAll('/', '\\/')}['"]`));
    assert.match(publicRoutes, new RegExp(`"path": "${path.replaceAll('/', '\\/')}"`));
  });
});

