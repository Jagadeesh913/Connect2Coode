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
    assert.match(source, /subsectionControllersRef\.current\.get\(sectionId\)\?\.abort/);
    assert.match(source, /getSections\(sheetId, controller\.signal\)/);
    assert.match(source, /getSectionQuestions\(sectionId, controller\.signal\)/);
    assert.match(source, /if \(submittingRef\.current\) return/);
    assert.match(source, /submittingRef\.current = true/);
    assert.match(source, /sheetError/);
    assert.match(source, /sectionsError/);
    assert.match(source, /linksError/);
    assert.match(source, /AdminListSkeleton/);
    assert.doesNotMatch(source, /Loading (?:sheets|sections|linked questions)…/);
    assert.match(source, /openEditSheet/);
    assert.match(source, /openEditSection/);
    assert.match(source, /openEditLink/);
    assert.match(source, /editingSheet \? \{ id: editingSheet\.id/);
    assert.match(source, /id: editingLink\?\.id \?\? null/);
    assert.match(source, /dispatch\(invalidateDsaSheetCache\(\)\)/);
    assert.match(source, /const hierarchyPath: number\[\] = \[\]/);
    assert.match(source, /for \(const hierarchySectionId of hierarchyPath\)/);
  });

  it('DSA user questions cancel superseded requests and keep errors scoped to the failed section', async () => {
    const pageSource = await readSource('src/features/dsaSheet/pages/DsaSheetPage.tsx');
    const sliceSource = await readSource('src/features/dsaSheet/redux/dsaSheetSlice.ts');
    assert.match(pageSource, /dispatch\(fetchSectionQuestions\(/);
    assert.match(pageSource, /expandedSectionQuestions !== undefined\) return/);
    assert.match(pageSource, /expandedSectionSubsections !== undefined\) return/);
    assert.equal(
      (pageSource.match(/return \(\) => request\.abort\(\)/g) || []).length >= 2,
      true,
      'question and subsection requests must have independent abort lifecycles'
    );
    assert.match(sliceSource, /learningSheetService\.getSectionQuestions\(sectionId, signal\)/);
    assert.match(pageSource, /questionErrors/);
    assert.match(pageSource, /loadingQuestionSectionIds\[sectionId\] \|\| loadingQuestionSectionId === sectionId/);
    assert.match(pageSource, /fetchDsaSubsections/);
    assert.match(pageSource, /subsectionErrors/);
    assert.match(pageSource, /sectionsError && sections\.length === 0 \? null/);
    assert.match(pageSource, /getDsaQuestionProblemPath\(link\)/);
  });

  it('DSA carousel exposes pause controls and stops motion for focus, reduced motion, and hidden tabs', async () => {
    const source = await readSource('src/features/dsaSheet/pages/DsaSheetPage.tsx');
    assert.match(source, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
    assert.match(source, /document\.addEventListener\('visibilitychange'/);
    assert.match(source, /onFocusCapture=/);
    assert.match(source, /onBlurCapture=/);
    assert.match(source, /className="w-full flex flex-col items-center justify-center mb-8"\s*onMouseEnter/);
    assert.match(source, /isCarouselPaused/);
    assert.match(source, /!isDocumentVisible/);
    assert.match(source, /prefersReducedMotion\s*\? 'Automatic sheet slides disabled by reduced-motion settings'/);
    assert.match(source, /: isCarouselPaused\s*\? 'Resume automatic sheet slides'/);
    assert.match(source, /aria-hidden=\{slideIdx !== activeSlide\}/);
    assert.match(source, /inert=\{slideIdx !== activeSlide\}/);
    assert.match(source, /tabIndex=\{slideIdx === activeSlide \? 0 : -1\}/);
  });

  it('aptitude options keep long mobile text and result icons top-aligned', async () => {
    const source = await readSource('src/features/aptitude/pages/AptitudePrep.tsx');
    assert.match(source, /transition-all flex items-start justify-between gap-3/);
    assert.match(source, /<div className="flex items-start gap-3 min-w-0">/);
    assert.match(source, /className="min-w-0 leading-snug break-words"/);
    assert.match(source, /import \{ Check, Lock, X \} from 'lucide-react'/);
    assert.match(source, /<Check aria-hidden="true"[^>]*shrink-0 mt-0\.5/);
    assert.match(source, /<X aria-hidden="true"[^>]*shrink-0 mt-0\.5/);
    assert.doesNotMatch(source, /fa-solid fa-check text-emerald/);
    assert.doesNotMatch(source, /fa-solid fa-xmark text-rose/);
  });

  it('problem list URL transitions dispatch before paint to prevent one-frame stale rows', async () => {
    for (const path of [
      'src/features/problems/pages/PracticePage.tsx',
    ]) {
      const source = await readSource(path);
      assert.match(source, /useLayoutEffect\(\(\) => \{[\s\S]*?dispatch\([\s\S]*?fetchProblems\(/);
    }
  });

  it('company catalog pagination is URL-backed, server-owned, and keyboard accessible', async () => {
    const list = await readSource('src/features/companies/pages/CompanyList.tsx');
    assert.match(list, /useSearchParams/);
    assert.match(list, /searchParams\.get\('page'\)/);
    assert.match(list, /getCompaniesPaginated\(/);
    assert.match(list, /\{ pageNumber, pageSize, sortBy: 'id', sortDirection: 'ASC' \}/);
    assert.doesNotMatch(list, /getAllCompanies\(/);
    assert.doesNotMatch(list, /filteredCompanies\.slice/);
    assert.match(list, /scrollIntoView/);
    assert.match(list, /role="group"/);
    assert.match(list, /<Link[\s\S]*?View Recruitment Exams/);

    const details = await readSource('src/features/companies/pages/CompanyDetails.tsx');
    const skeletonGuard = details.indexOf('isDetailsLoading && !company');
    const notFoundGuard = details.indexOf('if (!company)');
    assert.ok(skeletonGuard >= 0 && notFoundGuard > skeletonGuard);
    assert.match(details, /getCompanyProblemsPaginated\(/);
    assert.match(details, /searchText: debouncedQuestionSearch/);
    assert.match(details, /difficultyReferences\.map\(\(difficulty\) =>/);
    assert.match(details, /value=\{difficulty\.id\}/);
    assert.doesNotMatch(details, /<option value="Easy"/);
    assert.equal(
      (details.match(/pageNumber: questionPage - 1/g) || []).length,
      2,
      'coding and MCQ requests must both translate the 1-based UI page to the 0-based API page'
    );
    assert.doesNotMatch(details, /list = list\.filter/);
  });

  it('practice filters and page controls dispatch the canonical server query', async () => {
    const source = await readSource('src/features/problems/pages/PracticePage.tsx');
    assert.match(source, /fetchProblems\(\{[\s\S]*?page: currentPage/);
    assert.match(source, /searchText: searchInputParam/);
    assert.match(source, /difficulty: difficultyIds/);
    assert.match(source, /topic: topicIds/);
    assert.match(source, /companies: companyIds/);
    assert.doesNotMatch(source, /platform: platformIds/);
    assert.doesNotMatch(source, /fetchReferenceGroup\('QPF'\)/);
    assert.match(source, /const hasUnresolvedFilters = useMemo/);
    assert.match(source, /dispatch\(invalidateCompanyList\(\)\)/);
    assert.match(
      source,
      /if \(hasPendingFilterResolution \|\| hasUnresolvedFilters\) \{\s*return;/,
      'unresolved legacy filters must never degrade into an unfiltered request'
    );
    assert.match(source, /!hasPendingFilterResolution[\s\S]*?!hasUnresolvedFilters[\s\S]*?<Pagination/);
    assert.match(source, /const totalMatching = serverPagination\.total/);
    assert.doesNotMatch(source, /filteredProblems\.slice/);
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

  it('profile settings expose only API-backed profile fields and account actions', async () => {
    const source = await readSource('src/features/profile/pages/ProfileSettings.tsx');
    const themeSource = await readSource('src/shared/context/ThemeContext.tsx');
    assert.doesNotMatch(source, /email_notifications|theme_pref|languagePreference/);
    assert.doesNotMatch(source, /Email Notifications|Theme Preference|Choose your interface language/);
    assert.doesNotMatch(
      source,
      /profile\?\.(?:institution|collegeName|regNumber|joinedYear|graduationYear|passedOutYear|bio|gender|dob)/
    );
    assert.doesNotMatch(source, /profile\.(?:regNumber|collegeName|institutionId|joinedYear|graduationYear|passedOutYear|bio|dob)/);
    assert.match(source, /bio: userInfo\?\.bio/);
    assert.match(source, /gender: userInfo\?\.gender/);
    assert.match(source, /dob: userInfo\?\.dob/);
    assert.match(source, /fullName,\s*firstName: profile\?\.firstName \|\| authUser\?\.firstName,\s*email,/);
    assert.match(source, /defaultCollege=\{userInfo\?\.college \|\| userInfo\?\.collegeName \|\| ''\}/);
    assert.match(source, /Account Security/);
    assert.match(source, /generatePasswordResetOtpThunk/);
    assert.match(source, /saveUserInfoThunk/);
    assert.match(themeSource, /const loadScopedThemePreference = \(\): ThemePreference =>/);
    assert.match(themeSource, /userScopedStorage\.getItem\('theme_pref'\)/);
    assert.match(themeSource, /localStorage\.getItem\(LEGACY_THEME_KEY\)/);
    assert.match(themeSource, /userScopedStorage\.setItem\('theme_pref', migratedPreference\)/);
    assert.match(themeSource, /const scopedUser = tokenStorage\.getUser\(\)/);
    assert.match(themeSource, /if \(hasAccountScope\(\)\) removeLegacyTheme\(\)/);
    assert.match(themeSource, /localStorage\.removeItem\(LEGACY_THEME_KEY\)/);
    assert.match(themeSource, /\}, \[authStatus, isAuthenticated, scopeKey\]\)/);
    assert.match(themeSource, /preference === 'system'/);
    assert.match(themeSource, /mediaQuery\.addEventListener\('change', applyPreference\)/);
    assert.match(themeSource, /email:\$\{String\(user\.email\)\.trim\(\)\.toLowerCase\(\)\}/);
    assert.match(themeSource, /const updateTheme = useCallback/);
    assert.match(themeSource, /userScopedStorage\.setItem\('theme_pref', nextPreference\)/);
    assert.match(themeSource, /const setTheme = useCallback[\s\S]*?updateTheme\(nextPreference\)/);
    assert.match(themeSource, /updateTheme\(theme === 'dark' \? 'light' : 'dark'\)/);
    assert.doesNotMatch(themeSource, /localStorage\.setItem\(LEGACY_THEME_KEY/);
  });

  it('admin dashboard separates primary metrics from reference-dependent difficulty requests', async () => {
    const source = await readSource('src/features/admin/pages/AdminDashboard.tsx');
    assert.match(source, /const fetchDashboardData = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/);
    assert.match(source, /const fetchDifficultyCounts = useCallback/);
    assert.match(source, /difficultyRequestRef\.current\?\.abort/);
    assert.match(source, /if \(difficultiesLoading\) \{\s*setDifficultyMetricsLoading\(false\)/);
    assert.match(source, /if \(difficultyReferences\.length === 0\)[\s\S]*?easyCount: null[\s\S]*?setDifficultyMetricsError/);
    assert.match(source, /const dashboardError = \[error, difficultiesError, difficultyMetricsError\]/);
    assert.match(source, /difficultiesError \? null : 'Difficulty references are unavailable/);
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

  it('auth dialog focus is stable while typing and starts in the email field', async () => {
    const dialogHook = await readSource('src/shared/hooks/useAccessibleDialog.ts');
    const login = await readSource('src/features/auth/pages/Login.tsx');

    assert.match(dialogHook, /const onCloseRef = useRef\(onClose\)/);
    assert.match(dialogHook, /onCloseRef\.current\(\)/);
    assert.match(dialogHook, /\[dialogRef, isOpen\]/);
    assert.doesNotMatch(
      dialogHook,
      /\[dialogRef, isOpen, onClose\]/,
      'Changing callback identities must not rerun initial focus and steal password input focus'
    );
    assert.match(dialogHook, /\[data-dialog-initial-focus\]/);
    assert.match(login, /id="login-email"\s+data-dialog-initial-focus/);
  });

  it('problem drafts are user-scoped, editor clipboard is isolated, and admin routes stay unrestricted', async () => {
    const problemDetails = await readSource('src/features/problems/pages/ProblemDetails.tsx');
    const integrityHook = await readSource('src/shared/hooks/useAssessmentIntegrity.ts');
    const appLayout = await readSource('src/layouts/AppRouterLayout.tsx');
    const globalStyles = await readSource('src/index.css');

    assert.match(problemDetails, /userScopedStorage\.getItem/);
    assert.match(problemDetails, /userScopedStorage\.setItem/);
    assert.match(problemDetails, /data-assessment-clipboard="internal"/);
    assert.match(problemDetails, /connect2code-internal-paste/);
    assert.match(problemDetails, /Developer Tools remain available/);
    assert.doesNotMatch(problemDetails, /developer-tool shortcuts are restricted/);
    assert.doesNotMatch(problemDetails, /navigator\.clipboard/);
    assert.match(integrityHook, /INTERNAL_CLIPBOARD_SELECTOR/);
    assert.match(integrityHook, /obscureOnFocusLoss/);
    assert.match(integrityHook, /window\.addEventListener\('blur'/);
    assert.match(integrityHook, /requestFullscreen/);
    assert.match(integrityHook, /keyboardLock: 'browser'/);
    assert.match(integrityHook, /fullscreenchange/);
    assert.match(appLayout, /c2c-protected-surface/);
    assert.match(appLayout, /location\.pathname === '\/admin'/);
    assert.match(appLayout, /location\.pathname\.startsWith\('\/admin\/'\)/);
    assert.match(appLayout, /enabled: !isAdminRoute/);
    assert.match(appLayout, /className=\{isAdminRoute \? 'contents' : 'c2c-protected-surface contents'\}/);
    assert.match(appLayout, /document\.exitFullscreen/);
    assert.doesNotMatch(appLayout, /c2c-security-watermark/);
    assert.match(appLayout, /Assessment content protected/);
    assert.match(appLayout, /Enter secure mode/);
    assert.match(globalStyles, /\.c2c-protected-surface::before/);
    assert.doesNotMatch(globalStyles, /body > \*/);
  });

  it('ships deployment-level browser hardening headers', async () => {
    const deploymentConfig = await readSource('vercel.json');
    assert.match(deploymentConfig, /Content-Security-Policy/);
    assert.match(deploymentConfig, /default-src 'self'/);
    assert.match(deploymentConfig, /script-src 'self'/);
    assert.match(deploymentConfig, /connect-src 'self' https:\/\/api\.connect2code\.in/);
    assert.match(deploymentConfig, /worker-src 'self' blob:/);
    assert.match(deploymentConfig, /frame-ancestors 'none'/);
    assert.match(deploymentConfig, /display-capture=\(\)/);
    assert.match(deploymentConfig, /X-Frame-Options/);
    assert.match(deploymentConfig, /Strict-Transport-Security/);
  });

  it('unauthenticated users on dsa-sheet page are presented with the sign-in EmptyState', async () => {
    const dsaSheetSource = await readSource('src/features/dsaSheet/pages/DsaSheetPage.tsx');
    assert.match(dsaSheetSource, /openAuthModal/);
    assert.match(dsaSheetSource, /!isAuthenticated && sheets\.length === 0/);
    assert.match(dsaSheetSource, /title="Sign in to explore DSA Sheet"/);
    assert.match(dsaSheetSource, /actionText="Sign In"/);
    assert.match(dsaSheetSource, /onAction=\{\(\) => dispatch\(openAuthModal\(\{ mode: 'login' \}\)\)\}/);
    assert.match(dsaSheetSource, /icon=\{<Lock className="w-12 h-12 text-blue-500" \/>\}/);
  });

  it('gates feature routes before their API-owning page components mount', async () => {
    const routes = await readSource('src/routes/appRoutes.tsx');
    const gate = await readSource('src/features/auth/components/AuthenticatedFeatureGate.tsx');

    for (const path of ['/practice', '/problems/:slug', '/dsa-sheet', '/companies', '/aptitude']) {
      const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assert.match(routes, new RegExp(`path: '${escapedPath}', element: requireFeatureSession`));
    }
    assert.match(gate, /status === 'LOADING'/);
    assert.match(gate, /status === 'RECOVERY_REQUIRED'/);
    assert.match(gate, /if \(!isAuthenticated\)/);
    assert.match(gate, /<EmptyState/);
    assert.match(gate, /actionText="Sign In"/);
    assert.match(gate, /openAuthModal\(\{ mode: 'login' \}\)/);
    assert.match(gate, /return <>\{children\}<\/>/);
  });

  it('positions global toast notifications below the responsive sticky navbar', async () => {
    const app = await readSource('src/App.tsx');
    const styles = await readSource('src/index.css');
    assert.match(app, /top: 'calc\(var\(--c2c-navbar-height\) \+ 0\.75rem \+ env\(safe-area-inset-top, 0px\)\)'/);
    assert.match(app, /zIndex: 60/);
    assert.match(styles, /--c2c-navbar-height: 4rem/);
    assert.match(styles, /@media \(min-width: 640px\)[\s\S]*?--c2c-navbar-height: 5rem/);
  });
});

