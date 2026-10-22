import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { register } from 'node:module';

// Register ESM loader hook to handle extensionless .ts imports
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return await nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}
`;
register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');

// Import company logo registry
const {
  COMPANY_LOGO_DEFINITIONS,
  resolveCompanyLogo,
  normalizeCompanySearchKey,
  getCompanyFallback,
} = await import('../../src/features/companies/utils/companyLogoRegistry.ts');

describe('PRODUCTION COMPANY LOGO SYSTEM TEST SUITE', () => {

  describe('1. WorldVectorLogo Local Asset Presence & Integrity', () => {
    it('all registered company logo definitions have existing local assets on disk', () => {
      assert.ok(COMPANY_LOGO_DEFINITIONS.length >= 40, 'Should have at least 40 top company definitions');

      for (const def of COMPANY_LOGO_DEFINITIONS) {
        const localRelPath = def.assetPath.replace(/^\//, '');
        const fullDiskPath = path.join(rootDir, 'public', localRelPath);
        assert.ok(
          fs.existsSync(fullDiskPath),
          `Asset file for ${def.displayName} must exist on disk: ${fullDiskPath}`
        );

        const content = fs.readFileSync(fullDiskPath, 'utf8');
        if (def.assetPath.endsWith('.svg')) {
          assert.ok(
            content.includes('<svg') && content.includes('</svg>'),
            `SVG file for ${def.displayName} must contain valid SVG root element`
          );
          assert.ok(
            content.includes('viewBox'),
            `SVG file for ${def.displayName} must specify viewBox for scalable aspect ratio`
          );
        }
      }
    });
  });

  describe('2. Canonical Name & Alias Normalization', () => {
    it('resolves exact company slugs and common names', () => {
      const topCompanies = [
        'Google',
        'Amazon',
        'Microsoft',
        'Meta',
        'Apple',
        'Netflix',
        'TCS',
        'Infosys',
        'Wipro',
        'Accenture',
        'Cognizant',
        'Capgemini',
        'Tech Mahindra',
        'HCLTech',
        'IBM',
        'Oracle',
        'Deloitte',
        'EY',
        'KPMG',
        'PwC',
        'Zoho',
        'Freshworks',
        'ServiceNow',
        'Salesforce',
        'Adobe',
        'Cisco',
        'Dell',
        'Intel',
        'NVIDIA',
        'PayPal',
        'JPMorgan Chase',
        'Goldman Sachs',
        'Morgan Stanley',
        'Wells Fargo',
        'Uber',
        'Ola',
        'Swiggy',
        'Zomato',
        'Razorpay',
        'PhonePe',
        'Paytm',
        'Flipkart',
        'Walmart',
        'LinkedIn',
        'Samsung',
      ];

      for (const comp of topCompanies) {
        const resolved = resolveCompanyLogo(comp);
        assert.ok(resolved !== null, `Failed to resolve canonical company: ${comp}`);
        assert.ok(resolved.assetPath.startsWith('/companies/'), `Asset path must be local for ${comp}`);
      }
    });

    it('resolves variations, enterprise acronyms, and suffixes', () => {
      const variations = [
        { input: 'Tata Consultancy Services', expectedSlug: 'tcs' },
        { input: 'TCS iON', expectedSlug: 'tcs' },
        { input: 'TCS NQT Assessment', expectedSlug: 'tcs' },
        { input: 'Infosys Limited', expectedSlug: 'infosys' },
        { input: 'Infy', expectedSlug: 'infosys' },
        { input: 'Accenture Solutions Pvt Ltd', expectedSlug: 'accenture' },
        { input: 'Cognizant Technology Solutions', expectedSlug: 'cognizant' },
        { input: 'CTS', expectedSlug: 'cognizant' },
        { input: 'Wipro Technologies', expectedSlug: 'wipro' },
        { input: 'TechMahindra', expectedSlug: 'tech-mahindra' },
        { input: 'HCL Technologies', expectedSlug: 'hcl' },
        { input: 'Ernst & Young', expectedSlug: 'ey' },
        { input: 'Ernst and Young', expectedSlug: 'ey' },
        { input: 'PricewaterhouseCoopers', expectedSlug: 'pwc' },
        { input: 'JPMorgan', expectedSlug: 'jpmorgan' },
        { input: 'JP Morgan Chase', expectedSlug: 'jpmorgan' },
        { input: 'Goldman Sachs & Co', expectedSlug: 'goldman-sachs' },
        { input: 'Amazon Web Services', expectedSlug: 'amazon' },
        { input: 'Google Cloud Platform', expectedSlug: 'google' },
      ];

      for (const { input, expectedSlug } of variations) {
        const resolved = resolveCompanyLogo(input);
        assert.ok(resolved !== null, `Should resolve variation: "${input}"`);
        assert.equal(
          resolved.slug,
          expectedSlug,
          `Variation "${input}" should resolve to slug "${expectedSlug}", got "${resolved?.slug}"`
        );
      }
    });

    it('sanitizes legal noise words correctly', () => {
      assert.equal(normalizeCompanySearchKey('Google Inc.'), 'google');
      assert.equal(normalizeCompanySearchKey('Wipro Limited'), 'wipro');
      assert.equal(normalizeCompanySearchKey('TCS Pvt Ltd'), 'tcs');
      assert.equal(normalizeCompanySearchKey('Accenture Solutions'), 'accenture');
    });
  });

  describe('3. Deterministic Monogram Fallback Handling', () => {
    it('provides consistent initial and gradient class for unknown companies', () => {
      const fallback1 = getCompanyFallback('Acme Corporation');
      const fallback2 = getCompanyFallback('Acme Corporation');
      assert.deepEqual(fallback1, fallback2, 'Fallback must be strictly deterministic for identical inputs');
      assert.ok(fallback1.initial.length >= 1, 'Initial must not be empty');
      assert.ok(fallback1.gradientClass.startsWith('from-'), 'Must provide tailwind gradient');

      // Empty or missing name
      const emptyFallback = getCompanyFallback('');
      assert.equal(emptyFallback.initial, 'C');

      const nullFallback = getCompanyFallback(null);
      assert.equal(nullFallback.initial, 'C');
    });

    it('returns null on resolveCompanyLogo for unknown companies to trigger UI fallback', () => {
      assert.equal(resolveCompanyLogo('Unknown Startup 123XYZ'), null);
      assert.equal(resolveCompanyLogo(''), null);
      assert.equal(resolveCompanyLogo(undefined), null);
    });
  });

  describe('4. Zero Backend Logo URL Dependency', () => {
    it('resolution functions ignore backend URLs completely', () => {
      // Regardless of what URL is passed in, resolving by name alone works
      const res = resolveCompanyLogo('Google');
      assert.equal(res?.assetPath, '/companies/google.svg');
      assert.ok(!res?.assetPath.includes('http'), 'Resolved asset path must be local relative path');
    });
  });
});
