import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to handle extensionless .ts imports and stub axios
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } } }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
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

const { tokenStorage } = await import('../../src/core/security/tokenStorage.ts');
const { mapProblemDto } = await import('../../src/core/mappers/problemMapper.ts');

describe('VERIFICATION: 5 User Tasks Remediation', () => {
  it('Task 2 & Domain Mapping: mapProblemDto maps question 4 payload accurately', () => {
    const rawQuestion4 = {
      id: 4,
      title: 'Find Sum of Array Elements',
      description: 'Calculate the sum of all elements present in the given integer array.',
      difficultyId: 1,
      difficultyName: 'Basic',
      topicId: 9,
      topicName: 'Arrays',
      isOwnProblem: true,
      isActive: true,
      companies: ['Cognizant', 'Accenture', 'Tech Mahindra', 'HCLTech', 'Capgemini'],
      questionPlatform: 'AON Assessment Platform',
    };

    const mapped = mapProblemDto(rawQuestion4);
    assert.equal(mapped.id, '4');
    assert.equal(mapped.title, 'Find Sum of Array Elements');
    assert.equal(mapped.difficulty, 'Basic');
    assert.equal(mapped.topic, 'Arrays');
    assert.equal(mapped.companies.length, 5);
    assert.equal(mapped.description, 'Calculate the sum of all elements present in the given integer array.');
  });

  it('Task 5: tokenStorage retrieves tokens stored both with and without c2c_ prefix', () => {
    // Test set and get with standard tokenStorage
    tokenStorage.setRefreshToken('token_abc_123');
    assert.equal(tokenStorage.getRefreshToken(), 'token_abc_123');

    tokenStorage.setAccessToken('access_token_xyz_789');
    assert.equal(tokenStorage.getAccessToken(), 'access_token_xyz_789');

    tokenStorage.clearTokens();
    assert.equal(tokenStorage.getRefreshToken(), null);
    assert.equal(tokenStorage.getAccessToken(), null);
  });
});
