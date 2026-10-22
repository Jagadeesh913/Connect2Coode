import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to stub uninstalled dependencies (axios) and resolve extensionless imports
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: (cfg) => ({ defaults: { baseURL: cfg?.baseURL }, baseURL: cfg?.baseURL, getUri: (reqCfg) => ((reqCfg?.baseURL || cfg?.baseURL || "").replace(new RegExp("/+$"), "") + "/" + (reqCfg?.url || "").replace(new RegExp("^/+"), "")), interceptors: { request: { use: () => {} }, response: { use: () => {} } } }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
    };
  }
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

// Import real apiClient implementation
const apiClientModule = await import('../../src/core/api/apiClient.ts');
const { resolveApiBaseUrl, BASE_URL } = apiClientModule;

describe('BATCH-1: Network Transport & API Client Base URL Resolution (F-005, F-006)', () => {
  it('F-006: supports relative API base paths starting with "/" and trims trailing slashes', () => {
    assert.equal(resolveApiBaseUrl('/api/v1'), '/api/v1');
    assert.equal(resolveApiBaseUrl('/api/v1/'), '/api/v1');
    assert.equal(resolveApiBaseUrl('/api/custom/endpoint///'), '/api/custom/endpoint');
  });

  it('F-006: normalizes relative API base paths without leading slash', () => {
    assert.equal(resolveApiBaseUrl('api/v1'), '/api/v1');
    assert.equal(resolveApiBaseUrl('api/v1/'), '/api/v1');
  });

  it('preserves explicitly configured absolute HTTP and HTTPS URLs', () => {
    assert.equal(
      resolveApiBaseUrl('http://localhost:8080/api/v1'),
      'http://localhost:8080/api/v1'
    );
    assert.equal(
      resolveApiBaseUrl('http://localhost:8080/api/v1/'),
      'http://localhost:8080/api/v1'
    );
    assert.equal(
      resolveApiBaseUrl('https://api.production.example.com/api/v1'),
      'https://api.production.example.com/api/v1'
    );
    assert.equal(
      resolveApiBaseUrl('https://api.production.example.com/api/v1///'),
      'https://api.production.example.com/api/v1'
    );
  });

  it('defaults to production backend URL when env variable is unconfigured (undefined)', () => {
    const result = resolveApiBaseUrl(undefined);
    assert.equal(result, 'https://api.connect2code.in/api/v1');
  });

  it('empty or whitespace-only env variable defaults to production backend URL', () => {
    assert.equal(resolveApiBaseUrl(''), 'https://api.connect2code.in/api/v1');
    assert.equal(resolveApiBaseUrl('   '), 'https://api.connect2code.in/api/v1');
  });

  it('invalid protocol safely falls back to production backend URL', () => {
    const result = resolveApiBaseUrl('ftp://invalid-server/api');
    assert.equal(result, 'https://api.connect2code.in/api/v1');
  });

  it('exported BASE_URL defaults to production backend URL in test/unconfigured environment', () => {
    assert.equal(BASE_URL, 'https://api.connect2code.in/api/v1');
  });

  describe('Deployed / Development Environment URL Guarantees', () => {
    const { resolveDeploymentApiBaseUrl, apiClient } = apiClientModule;

    it('strictly resolves to live backend URL in local development mode without local proxy', () => {
      assert.equal(resolveDeploymentApiBaseUrl(undefined, true), 'https://api.connect2code.in/api/v1');
      assert.equal(resolveDeploymentApiBaseUrl('https://custom.backend.com/api/v1', true), 'https://custom.backend.com/api/v1');
      assert.equal(resolveDeploymentApiBaseUrl('http://localhost:5173/api/v1', true), 'https://api.connect2code.in/api/v1');
      assert.equal(resolveDeploymentApiBaseUrl('/api/v1', true), 'https://api.connect2code.in/api/v1');
    });

    it('strictly enforces backend URL and rejects localhost in deployed production', () => {
      assert.equal(
        resolveDeploymentApiBaseUrl('http://localhost:8080/api/v1', false),
        'https://api.connect2code.in/api/v1'
      );
      assert.equal(
        resolveDeploymentApiBaseUrl('http://127.0.0.1:8080/api/v1', false),
        'https://api.connect2code.in/api/v1'
      );
      assert.equal(
        resolveDeploymentApiBaseUrl('http://localhost:3000', false),
        'https://api.connect2code.in/api/v1'
      );
    });

    it('strictly falls back to live backend if relative URL is passed in deployed production', () => {
      assert.equal(
        resolveDeploymentApiBaseUrl('/api/v1', false),
        'https://api.connect2code.in/api/v1'
      );
    });

    it('defaults to live backend when env variable is unconfigured in deployed production', () => {
      assert.equal(
        resolveDeploymentApiBaseUrl(undefined, false),
        'https://api.connect2code.in/api/v1'
      );
    });

    it('preserves valid production HTTPS URL in deployed production', () => {
      assert.equal(
        resolveDeploymentApiBaseUrl('https://api.connect2code.in/api/v1', false),
        'https://api.connect2code.in/api/v1'
      );
    });

    it('REGRESSION: login request URL resolves to https://api.connect2code.in/api/v1/auth/login and preserves /api/v1 prefix exactly once', () => {
      const loginUrl = apiClient.getUri({ url: '/auth/login' });
      assert.equal(loginUrl, 'https://api.connect2code.in/api/v1/auth/login');
      assert.ok(!loginUrl.includes('/api/v1/api/v1'), 'Must not duplicate /api/v1 prefix');
      assert.ok(!loginUrl.includes('localhost'), 'Must not target localhost origin');
    });
  });
});

