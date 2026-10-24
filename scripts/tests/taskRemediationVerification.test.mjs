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
    assert.equal(mapped.qpfRefName, 'AON Assessment Platform');
    assert.equal(mapped.questionPlatform, 'AON Assessment Platform');
    assert.equal(mapped.examPlatform, undefined);
  });

  it('preserves and resolves visible sample test cases for Question 3 (Reverse an Array)', () => {
    const rawQuestion3 = {
      id: 3,
      title: 'Reverse an Array',
      description: 'Given an array, reverse its elements in-place and print the resulting array.',
      difficultyId: 1,
      difficultyName: 'Basic',
      topicId: 9,
      topicName: 'Arrays',
      isOwnProblem: true,
      isActive: true,
      companies: ['Cognizant', 'Wipro', 'Accenture', 'Tech Mahindra', 'Capgemini'],
      questionPlatform: 'GeeksforGeeks',
    };

    const mapped = mapProblemDto(rawQuestion3);
    assert.equal(mapped.id, '3');
    assert.equal(mapped.title, 'Reverse an Array');
    assert.ok(Array.isArray(mapped.testCases), 'testCases must be present for Question 3');
    assert.ok(mapped.testCases.length > 0, 'testCases must not be empty');
    assert.equal(mapped.testCases[0].isHidden, false, 'Sample test case must not be hidden');
    assert.equal(mapped.testCases[0].typeRefCode, 'SAMPLE');
    assert.match(mapped.testCases[0].input, /1 4 3 2 6 5|1 2 3 4 5/);
  });

  it('preserves explicitly supplied API test cases and constraints', () => {
    const explicitCases = [
      {
        id: 101,
        input: '10',
        expectedOutput: '20',
        explanation: 'Doubled',
        isHidden: false,
        displayOrder: 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
      },
    ];

    const mapped = mapProblemDto({
      id: 99,
      title: 'Custom Problem',
      constraints: '1 <= N <= 10^5',
      testCases: explicitCases,
    });

    assert.equal(mapped.id, '99');
    assert.equal(mapped.constraints, '1 <= N <= 10^5');
    assert.deepEqual(mapped.testCases, explicitCases);
  });

  it('does not invent a platform when the API omits platform fields', () => {
    const mapped = mapProblemDto({ id: 2, title: 'API-owned question' });
    assert.equal(mapped.qpfRefCode, undefined);
    assert.equal(mapped.qpfRefName, undefined);
    assert.equal(mapped.examPlatform, undefined);
  });

  it('Task 5: tokenStorage keeps session tokens in the canonical cookie/memory contract', () => {
    tokenStorage.setRefreshToken('token_abc_123');
    assert.equal(tokenStorage.getRefreshToken(), 'token_abc_123');

    tokenStorage.setAccessToken('access_token_xyz_789');
    assert.equal(tokenStorage.getAccessToken(), 'access_token_xyz_789');

    tokenStorage.clearTokens();
    assert.equal(tokenStorage.getRefreshToken(), null);
    assert.equal(tokenStorage.getAccessToken(), null);
  });

  it('AdminDashboard and DashboardCodeRunner avoid pageSize: 1000 and match AdminQuestions pagination contract', async () => {
    const fs = await import('node:fs');
    const adminDashboardSource = fs.readFileSync('src/features/admin/pages/AdminDashboard.tsx', 'utf-8');
    const dashboardCodeRunnerSource = fs.readFileSync('src/features/admin/components/dashboard/DashboardCodeRunner.tsx', 'utf-8');

    // Neither file should request pageSize 1000 which causes backend HTTP 500
    assert.equal(
      adminDashboardSource.includes('pageSize: 1000'),
      false,
      'AdminDashboard.tsx must never use pageSize: 1000'
    );
    assert.equal(
      dashboardCodeRunnerSource.includes('pageSize: 1000'),
      false,
      'DashboardCodeRunner.tsx must never use pageSize: 1000'
    );

    // Both should use pageSize: 10 matching AdminQuestions
    assert.ok(
      adminDashboardSource.includes('pageSize: 10'),
      'AdminDashboard.tsx must use pageSize: 10 matching /admin/questions'
    );
    assert.ok(
      dashboardCodeRunnerSource.includes('pageSize: 10'),
      'DashboardCodeRunner.tsx must use pageSize: 10 matching /admin/questions'
    );
  });

  it('AdminQuestions and AdminMcqs combine Identifier + Difficulty into # column and style inactive items in red', async () => {
    const fs = await import('node:fs');
    const adminQuestionsSource = fs.readFileSync('src/features/admin/pages/AdminQuestions.tsx', 'utf-8');
    const adminMcqsSource = fs.readFileSync('src/features/admin/pages/AdminMcqs.tsx', 'utf-8');

    // Both should define getDifficultyNumberColor
    assert.ok(adminQuestionsSource.includes('getDifficultyNumberColor'), 'AdminQuestions must define getDifficultyNumberColor');
    assert.ok(adminMcqsSource.includes('getDifficultyNumberColor'), 'AdminMcqs must define getDifficultyNumberColor');

    // Both should have # as the combined column header
    assert.ok(adminQuestionsSource.includes("header: '#'"), 'AdminQuestions must have # column header');
    assert.ok(adminMcqsSource.includes("header: '#'"), 'AdminMcqs must have # column header');

    // Inactive styling (red rounded border container & Inactive badge, without bold red text)
    assert.ok(
      adminQuestionsSource.includes('border-rose-400') && adminQuestionsSource.includes('rounded-xl') && adminQuestionsSource.includes('isInactive'),
      'AdminQuestions must highlight inactive problems with a red rounded border container'
    );
    assert.ok(
      adminMcqsSource.includes('border-rose-400') && adminMcqsSource.includes('rounded-xl') && adminMcqsSource.includes('isInactive'),
      'AdminMcqs must highlight inactive questions with a red rounded border container'
    );
  });

  it('admin editors require authoritative details and surface partial question-save failures', async () => {
    const fs = await import('node:fs');
    const adminQuestionsSource = fs.readFileSync('src/features/admin/pages/AdminQuestions.tsx', 'utf-8');
    const adminMcqsSource = fs.readFileSync('src/features/admin/pages/AdminMcqs.tsx', 'utf-8');

    assert.match(adminQuestionsSource, /handleEditClick[\s\S]*getQuestionById\(question\.id\)/);
    assert.match(adminQuestionsSource, /Question saved, but its test cases were not attached/);
    assert.doesNotMatch(adminQuestionsSource, /Backend rejected test case attachment/);
    assert.match(adminMcqsSource, /Unable to load complete MCQ data for editing/);
    assert.match(adminMcqsSource, /has no editable options in its detail response/);
    assert.match(adminMcqsSource, /handleOpenViewModal[\s\S]*getMcqById\(mcq\.id\)/);
    assert.match(adminMcqsSource, /Unable to load complete MCQ details/);
  });

  it('shared pagination buttons cannot submit surrounding forms and expose the current page', async () => {
    const fs = await import('node:fs');
    const paginationSource = fs.readFileSync('src/shared/components/ui/Pagination.tsx', 'utf-8');
    const buttonCount = (paginationSource.match(/<button/g) || []).length;
    const explicitButtonTypes = (paginationSource.match(/type="button"/g) || []).length;
    assert.equal(explicitButtonTypes, buttonCount);
    assert.match(paginationSource, /aria-current=\{isActive \? 'page' : undefined\}/);
  });
});
