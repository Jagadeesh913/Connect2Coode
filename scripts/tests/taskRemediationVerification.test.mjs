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

  it('does not invent sample test cases when the API and description omit examples', () => {
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
    assert.deepEqual(mapped.testCases ?? [], []);
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

  it('Task 5: tokenStorage keeps only the access token and profile in memory', () => {
    assert.equal('setRefreshToken' in tokenStorage, false);
    assert.equal('getRefreshToken' in tokenStorage, false);
    tokenStorage.setAccessToken('access_token_xyz_789');
    assert.equal(tokenStorage.getAccessToken(), 'access_token_xyz_789');

    tokenStorage.clearTokens();
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
    assert.equal(
      dashboardCodeRunnerSource.includes('pagesToFetch'),
      false,
      'DashboardCodeRunner must not fan out requests for every remaining question page'
    );
    assert.equal(
      dashboardCodeRunnerSource.includes('subPageResults'),
      false,
      'DashboardCodeRunner must load additional questions through on-demand search'
    );
    assert.match(
      dashboardCodeRunnerSource,
      /searchText: searchFilter\.trim\(\)/,
      'DashboardCodeRunner must retain backend search for questions beyond the initial page'
    );
    assert.match(dashboardCodeRunnerSource, /const loadNextQuestionPage = async/);
    assert.match(dashboardCodeRunnerSource, /pageNumber: nextPage/);
    assert.match(dashboardCodeRunnerSource, /Load more problems/);
    assert.match(dashboardCodeRunnerSource, /selectedQuestionIdRef\.current/);
  });

  it('DashboardCodeRunner ignores stale page responses and never promotes catalog rows to details', async () => {
    const fs = await import('node:fs');
    const source = fs.readFileSync('src/features/admin/components/dashboard/DashboardCodeRunner.tsx', 'utf-8');
    assert.equal(source.includes('questionsRef'), false);
    assert.equal(source.includes("difficultyRefGroupCode: 'DIFF'"), false);
    assert.equal(source.includes('SAMPLE_WORKING_SOLUTIONS'), false);
    assert.match(source, /setQuestionDetailsError\(message\)/);
    assert.match(source, /\}, \[selectedQuestionId\]\);/);
    assert.match(source, /const pageGenerationRef = useRef\(0\)/);
    assert.match(source, /const generation = \+\+pageGenerationRef\.current/);
    assert.match(source, /if \(generation !== pageGenerationRef\.current\) return/);
    assert.match(source, /setResourcesLoading\(true\);[\s\S]*?setIsSearchingBackend\(false\)/);
    assert.match(source, /setIsSearchingBackend\(true\);[\s\S]*?setResourcesLoading\(false\)/);
    assert.match(source, /item\.difficulty \|\| item\.difficultyRefName \|\| item\.difficultyName/);
    assert.match(source, /item\.topicRefName \|\| item\.topicName/);
    assert.match(source, /const matchDescription = \(item\.description \|\| ''\)\.toLowerCase\(\)\.includes\(query\)/);
    assert.match(source, /matchTopic \|\| matchDescription/);
    assert.match(
      source,
      /if \(list\.length > 0\) \{\s*setQuestionPage\(0\);\s*setQuestionTotalPages\(res\.data\.totalPages \?\? 1\);\s*setQuestionPageSearch\(searchText\)/
    );
  });

  it('F-09: preserves code drafts independently for every question and language', async () => {
    const fs = await import('node:fs');
    const source = fs.readFileSync('src/features/admin/components/dashboard/DashboardCodeRunner.tsx', 'utf-8');
    assert.match(source, /const \[_codeDrafts, setCodeDrafts\] = useState<Record<string, string>>\(\{\}\)/);
    assert.match(source, /const key = `\$\{selectedQuestionId\}_\$\{selectedLanguageId\}`/);
    assert.match(source, /setCodeDrafts\(\(prev\) => \{\s*if \(prev\[key\] !== undefined\) \{\s*setSourceCode\(prev\[key\]\)/);
    assert.match(source, /setCodeDrafts\(\(prev\) => \(\{ \.\.\.prev, \[key\]: val \}\)\)/);
  });

  it('keeps manual question selection synchronized without nested state updates', async () => {
    const fs = await import('node:fs');
    const source = fs.readFileSync('src/features/admin/components/dashboard/DashboardCodeRunner.tsx', 'utf-8');
    assert.match(
      source,
      /const selectQuestionId = useCallback\(\(questionId: number\) => \{\s*selectedQuestionIdRef\.current = questionId;\s*setSelectedQuestionId\(questionId\)/
    );
    assert.match(
      source,
      /if \(uniqueList\.length > 0 && selectedQuestionIdRef\.current === null\) \{\s*const initialQuestionId = uniqueList\[0\]\.id;\s*selectQuestionId\(initialQuestionId\);\s*setManualQuestionId\(String\(initialQuestionId\)\)/
    );
    assert.doesNotMatch(source, /setSelectedQuestionId\(\(prev\)[\s\S]*?setManualQuestionId/);
    assert.match(source, /selectQuestionId\(qId\);\s*setManualQuestionId\(String\(qId\)\)/);
    assert.match(source, /selectQuestionId\(num\)/);
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

    assert.match(adminQuestionsSource, /handleEditClick[\s\S]*getQuestionById\(question\.id/);
    assert.match(adminQuestionsSource, /Question saved, but its test cases were not attached/);
    assert.doesNotMatch(adminQuestionsSource, /Backend rejected test case attachment/);
    assert.match(adminMcqsSource, /Unable to load complete MCQ data for editing/);
    assert.match(adminMcqsSource, /has no editable options in its detail response/);
    assert.match(adminMcqsSource, /handleOpenViewModal[\s\S]*getMcqById\(mcq\.id/);
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

  it('does not cancel the initial unfiltered MCQ query when reference groups hydrate', async () => {
    const fs = await import('node:fs');
    const aptitudeSource = fs.readFileSync('src/features/aptitude/pages/AptitudePrep.tsx', 'utf-8');
    const adminMcqsSource = fs.readFileSync('src/features/admin/pages/AdminMcqs.tsx', 'utf-8');

    assert.match(aptitudeSource, /if \(appliedDifficulties\.length === 0\) return EMPTY_REFERENCE_IDS/);
    assert.match(adminMcqsSource, /if \(!selectedSubject\) return EMPTY_FILTER_IDS/);
    assert.match(adminMcqsSource, /if \(!selectedDifficulty\) return EMPTY_FILTER_IDS/);
    assert.match(
      adminMcqsSource,
      /\}, \[debouncedSearch, pageNumber, pageSize, selectedDifficultyIds, selectedSubjectIds\]\);/
    );
  });

  it('CR Audit Fixes: pagination supports itemLabel and CompanyDetails uses examTotal', async () => {
    const fs = await import('node:fs');
    const paginationSource = fs.readFileSync('src/shared/components/ui/Pagination.tsx', 'utf-8');
    const adminCompaniesSource = fs.readFileSync('src/features/admin/pages/AdminCompanies.tsx', 'utf-8');
    const companyDetailsSource = fs.readFileSync('src/features/companies/pages/CompanyDetails.tsx', 'utf-8');
    const authSliceSource = fs.readFileSync('src/features/auth/redux/authSlice.ts', 'utf-8');
    const oauthCallbackSource = fs.readFileSync('src/features/auth/pages/OAuthCallback.tsx', 'utf-8');
    const practicePageSource = fs.readFileSync('src/features/problems/pages/PracticePage.tsx', 'utf-8');
    const problemServiceSource = fs.readFileSync('src/services/problemService.ts', 'utf-8');
    const profileSettingsSource = fs.readFileSync('src/features/profile/pages/ProfileSettings.tsx', 'utf-8');

    // Pagination itemLabel check
    assert.match(paginationSource, /itemLabel\s*=\s*'problems'/);
    assert.match(paginationSource, /\{totalElements\}<\/strong>\s*\{itemLabel\}/);
    assert.match(adminCompaniesSource, /itemLabel="companies"/);
    assert.match(adminCompaniesSource, /const \[availableCompanies, setAvailableCompanies\] = useState<CompanyItem\[]>\(\[\]\)/);
    assert.match(adminCompaniesSource, /adminCompanyService\.getCompanies\(controller\.signal\)/);
    assert.match(adminCompaniesSource, /availableCompanies=\{availableCompanies\}/);

    // CompanyDetails examTotal & section totals check
    assert.match(companyDetailsSource, /examTotal > 0/);
    assert.doesNotMatch(companyDetailsSource, /exams\.length > 0[\s\S]*?\{exams\.length\}/);
    assert.match(companyDetailsSource, /setSectionTotals/);
    assert.match(companyDetailsSource, /useLayoutEffect\(\(\) => \{[\s\S]*?activeSection !== 'coding'[\s\S]*?setCodingLoading\(false\)/);
    assert.match(companyDetailsSource, /if \(!debouncedQuestionSearch && !selectedDifficultyId\) \{\s*setSectionTotals/);
    assert.doesNotMatch(companyDetailsSource, /sectionTotals\.coding \?\? questionTotal/);
    assert.match(companyDetailsSource, /itemLabel="exams"/);
    assert.match(companyDetailsSource, /itemLabel="questions"/);
    assert.match(companyDetailsSource, /codingError \? \([\s\S]*?<td colSpan=\{6\}><RequestStatus error=\{codingError\}/);

    // Auth slice & OAuth callback check
    assert.match(authSliceSource, /return await executeRefreshToken\(\)/);
    assert.doesNotMatch(oauthCallbackSource, /setUnauthenticatedSession/);

    // PracticePage clamp and filter race condition checks
    assert.match(practicePageSource, /hasPendingFilterResolution/);
    assert.match(practicePageSource, /fulfilledKey !== currentRequestKey/);
    assert.match(practicePageSource, /const difficultyIdsKey = Array\.from\(resolvedDifficultyIds\)\.join\(','\)/);
    assert.match(practicePageSource, /difficultyIdsKey \? difficultyIdsKey\.split\(','\)\.map\(Number\) : \[\]/);

    // ProblemService degraded object check
    assert.match(problemServiceSource, /Number\(\(data as Record<string, unknown>\)\.id\) === numericId/);

    // ProfileSettings memoized initialData check
    assert.match(profileSettingsSource, /personalInfoInitialData = useMemo/);
    assert.match(profileSettingsSource, /initialData=\{personalInfoInitialData\}/);
    assert.match(profileSettingsSource, /useEffect\(\(\) => \{\s*void dispatch\(fetchUserProfile\(\)\);\s*if \(effectiveUserId\)/);
  });
});
