import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('shared UX interaction contracts', () => {
  it('shared buttons do not submit forms unless a caller explicitly opts in', async () => {
    const source = await readSource('src/shared/components/ui/Button.tsx');
    assert.match(source, /type = 'button'/);
    assert.match(source, /type=\{type\}/);
  });

  it('pagination can lock every navigation control while its request is pending', async () => {
    const source = await readSource('src/shared/components/ui/Pagination.tsx');
    assert.match(source, /disabled\?: boolean/);
    assert.match(source, /aria-busy=\{disabled\}/);
    assert.equal((source.match(/disabled=\{disabled \|\|/g) || []).length, 5);
  });

  it('confirmation dialogs use unique labels, safe initial focus, focus trapping, and restoration', async () => {
    const source = await readSource('src/shared/components/ui/ConfirmDialog.tsx');
    assert.match(source, /useId/);
    assert.match(source, /cancelButtonRef\.current\?\.focus/);
    assert.match(source, /e\.key === 'Tab'/);
    assert.match(source, /previouslyFocused\?\.focus/);
  });

  it('practice and aptitude filter choices expose pressed state to keyboard users', async () => {
    for (const path of [
      'src/features/problems/pages/PracticePage.tsx',
      'src/features/aptitude/pages/AptitudePrep.tsx',
    ]) {
      const source = await readSource(path);
      assert.doesNotMatch(source, /<label\s+[^>]*onClick=/s);
      assert.match(source, /aria-pressed=/);
    }
  });

  it('aptitude query transitions clear mismatched rows and expose a loading skeleton before requesting', async () => {
    const source = await readSource('src/features/aptitude/pages/AptitudePrep.tsx');
    assert.match(
      source,
      /const fetchQuestions = useCallback[\s\S]*?setLoading\(true\);\s*setError\(null\);\s*setQuestions\(\[\]\);/
    );
    assert.match(source, /const beginQuestionTransition = \(\) => \{[\s\S]*?setQuestions\(\[\]\);[\s\S]*?setLoading\(true\);/);
    assert.match(source, /loading \? \([\s\S]*?<AptitudeQuestionSkeleton/);
    assert.match(source, /useLayoutEffect\(\(\) => \{[\s\S]*?parseAptitudeSubjectCode/);
  });

  it('DSA admin requests cancel superseded section, link, and option loads', async () => {
    const source = await readSource('src/features/admin/pages/AdminDsaSheets.tsx');
    assert.match(source, /sectionsAbortRef\.current\?\.abort/);
    assert.match(source, /linksAbortRef\.current\?\.abort/);
    assert.match(source, /optionsAbortRef\.current\?\.abort/);
    assert.match(source, /getSections\(sheetId, controller\.signal\)/);
    assert.match(source, /getSectionQuestions\(sectionId, controller\.signal\)/);
    assert.match(source, /if \(submittingRef\.current\) return/);
    assert.match(source, /submittingRef\.current = true/);
    assert.match(source, /sheetError/);
    assert.match(source, /sectionsError/);
    assert.match(source, /linksError/);
    assert.match(source, /AdminListSkeleton/);
    assert.doesNotMatch(source, /Loading (?:sheets|sections|linked questions)…/);
  });

  it('DSA user questions cancel superseded requests and keep errors scoped to the failed section', async () => {
    const source = await readSource('src/features/dsaSheet/pages/DsaSheetPage.tsx');
    assert.match(source, /questionAbortRef\.current\?\.abort/);
    assert.match(source, /getSectionQuestions\(sectionId, controller\.signal\)/);
    assert.match(source, /questionErrors/);
    assert.match(source, /loadingQuestionSectionId === section\.id/);
    assert.match(source, /loadingQuestionSectionId === section\.id \? \([\s\S]*?<Skeleton/);
    assert.match(source, /sectionsError && sections\.length === 0 \? null/);
  });

  it('problem list URL transitions dispatch before paint to prevent one-frame stale rows', async () => {
    for (const path of [
      'src/features/problems/pages/PracticePage.tsx',
      'src/features/problems/pages/ProblemList.tsx',
    ]) {
      const source = await readSource(path);
      assert.match(source, /useLayoutEffect\(\(\) => \{[\s\S]*?dispatch\([\s\S]*?fetchProblems\(/);
    }
  });

  it('company catalog state is URL-backed and keyboard accessible', async () => {
    const list = await readSource('src/features/companies/pages/CompanyList.tsx');
    assert.match(list, /useSearchParams/);
    assert.match(list, /searchParams\.get\('q'\)/);
    assert.match(list, /searchParams\.get\('industry'\)/);
    assert.match(list, /searchParams\.get\('page'\)/);
    assert.match(list, /scrollIntoView/);
    assert.match(list, /role="group"/);
    assert.match(list, /<Link[\s\S]*?View Recruitment Exams/);

    const details = await readSource('src/features/companies/pages/CompanyDetails.tsx');
    const skeletonGuard = details.indexOf('isDetailsLoading && !company');
    const notFoundGuard = details.indexOf('if (!company)');
    assert.ok(skeletonGuard >= 0 && notFoundGuard > skeletonGuard);
  });

  it('clickable admin table rows expose keyboard activation', async () => {
    const source = await readSource('src/features/admin/components/AdminTable.tsx');
    assert.match(source, /\{loading \? Array\.from/);
    assert.doesNotMatch(source, /loading && data\.length === 0/);
    assert.match(source, /tabIndex=\{onRowClick \? 0 : undefined\}/);
    assert.match(source, /event\.key === 'Enter' \|\| event\.key === ' '/);
    assert.match(source, /focus-visible:ring/);
  });

  it('high-impact mutations use synchronous guards against duplicate submissions', async () => {
    const paths = [
      'src/features/admin/pages/AdminLanguages.tsx',
      'src/features/admin/pages/AdminQuestions.tsx',
      'src/features/admin/pages/AdminMcqs.tsx',
      'src/features/admin/pages/AdminInstitutions.tsx',
      'src/features/admin/pages/AdminCompanies.tsx',
      'src/features/admin/components/questions/TestCaseModal.tsx',
      'src/features/profile/pages/ProfileSettings.tsx',
      'src/features/auth/pages/Login.tsx',
    ];

    for (const path of paths) {
      const source = await readSource(path);
      assert.match(source, /(?:mutation|authAction)PendingRef\.current/);
      assert.match(source, /PendingRef\.current = true/);
      assert.match(source, /finally[\s\S]*?PendingRef\.current = false/);
    }
  });

  it('detail modals use skeletons while requested records are unavailable', async () => {
    for (const path of [
      'src/features/admin/components/companies/CompanyDetailsModal.tsx',
      'src/features/admin/components/institutions/InstitutionDetailsModal.tsx',
      'src/features/admin/components/questions/QuestionDetailsModal.tsx',
      'src/features/admin/components/questions/TestCaseModal.tsx',
    ]) {
      const source = await readSource(path);
      assert.match(source, /<Skeleton/);
    }

    const companyDetails = await readSource('src/features/admin/components/companies/CompanyDetailsModal.tsx');
    assert.match(companyDetails, /problemsLoading \? \([\s\S]*?Loading tagged questions[\s\S]*?<Skeleton/);
    assert.match(companyDetails, /examsLoading && exams\.length === 0 \? \([\s\S]*?Loading company exams[\s\S]*?<Skeleton/);
    assert.match(companyDetails, /detailsLoading \? \([\s\S]*?Loading exam roles and pattern[\s\S]*?<Skeleton/);
  });

  it('route-level fallback uses a geometry-preserving skeleton for every route', async () => {
    const source = await readSource('src/shared/components/ui/PageLoading.tsx');
    assert.doesNotMatch(source, />Loading page…</);
    assert.match(source, /else \{[\s\S]*?<Skeleton/);
  });
});
