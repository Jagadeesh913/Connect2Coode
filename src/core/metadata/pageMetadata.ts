export const PRODUCT_NAME = 'Connect2Code';
export const DEFAULT_SOCIAL_IMAGE = '/social-card.png';

export type RobotsDirective = 'index, follow' | 'noindex, follow' | 'noindex, nofollow';

export interface PageMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  robots: RobotsDirective;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
}

const DEFAULT_DESCRIPTION =
  'Prepare for placements with coding problems, DSA sheets, aptitude practice, company exam patterns, and interview resources.';

const publicPage = (
  title: string,
  description: string,
  canonicalPath: string,
  overrides: Partial<PageMetadata> = {}
): PageMetadata => ({
  title,
  description,
  canonicalPath,
  robots: 'index, follow',
  image: DEFAULT_SOCIAL_IMAGE,
  imageAlt: 'Connect2Code placement and coding preparation platform',
  type: 'website',
  ...overrides,
});

const privatePage = (title: string, description: string, canonicalPath: string): PageMetadata => ({
  ...publicPage(title, description, canonicalPath),
  robots: 'noindex, nofollow',
});

const humanizeSegment = (value: string | undefined, fallback: string): string => {
  if (!value) return fallback;

  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();

  return decoded
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase()) || fallback;
};

const normalizePathname = (pathname: string): string => {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return normalized !== '/' ? normalized.replace(/\/+$/, '') : normalized;
};

export const formatPageTitle = (pageTitle: string): string =>
  `${pageTitle.trim()} | ${PRODUCT_NAME}`;

export const sanitizeMetadataText = (value: string, maxLength: number): string =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

export const resolvePageMetadata = (rawPathname: string): PageMetadata => {
  const pathname = normalizePathname(rawPathname);
  const segments = pathname.split('/').filter(Boolean);

  const exactPages: Record<string, PageMetadata> = {
    '/': publicPage(
      'Placement & Coding Preparation',
      DEFAULT_DESCRIPTION,
      '/'
    ),
    '/oauth/callback': privatePage(
      'Completing Sign In',
      'Complete secure authentication and return to your Connect2Code account.',
      '/oauth/callback'
    ),
    '/login': {
      ...publicPage('Log In', 'Log in to track coding progress, bookmarks, and placement preparation.', '/login'),
      robots: 'noindex, follow',
    },
    '/signup': {
      ...publicPage('Create Account', 'Create a Connect2Code account to save progress and prepare for placements.', '/signup'),
      robots: 'noindex, follow',
    },
    '/forgot-password': {
      ...publicPage('Reset Password', 'Recover access to your Connect2Code account securely.', '/forgot-password'),
      robots: 'noindex, follow',
    },
    '/practice': publicPage(
      'Coding Practice',
      'Practice curated coding problems by topic, difficulty, and company for placement interviews.',
      '/practice'
    ),
    '/problems': publicPage(
      'Coding Practice',
      'Practice curated coding problems by topic, difficulty, and company for placement interviews.',
      '/practice'
    ),
    '/dsa-sheet': publicPage(
      'DSA Sheet',
      'Follow a structured data structures and algorithms sheet for placement preparation.',
      '/dsa-sheet'
    ),
    '/companies': publicPage(
      'Company Preparation',
      'Explore company-specific placement exams, hiring patterns, aptitude topics, and coding questions.',
      '/companies'
    ),
    '/company-patterns': publicPage(
      'Company Preparation',
      'Explore company-specific placement exams, hiring patterns, aptitude topics, and coding questions.',
      '/companies'
    ),
    '/aptitude': publicPage(
      'Aptitude Practice',
      'Practice quantitative aptitude, logical reasoning, verbal ability, and pseudocode questions.',
      '/aptitude'
    ),
    '/logical': publicPage(
      'Logical Reasoning Practice',
      'Practice logical reasoning questions for placement assessments.',
      '/aptitude'
    ),
    '/verbal': publicPage(
      'Verbal Ability Practice',
      'Practice verbal ability questions for placement assessments.',
      '/aptitude'
    ),
    '/pseudocode': publicPage(
      'Pseudocode Practice',
      'Practice pseudocode and programming logic questions for placement assessments.',
      '/aptitude'
    ),
    '/progress': publicPage(
      'Aptitude Practice',
      'Practice aptitude questions and review your placement preparation.',
      '/aptitude'
    ),
    '/roadmaps': publicPage(
      'Learning Roadmaps',
      'Explore structured learning paths for coding and placement preparation.',
      '/aptitude'
    ),
    '/interviews': publicPage(
      'Interview Preparation',
      'Prepare for technical interviews with focused questions and practical guidance.',
      '/interviews'
    ),
    '/dashboard': privatePage(
      'Dashboard',
      'Continue your Connect2Code placement preparation.',
      '/practice'
    ),
    '/bookmarks': privatePage(
      'Saved Problems',
      'Review the coding problems saved to your Connect2Code account.',
      '/bookmarks'
    ),
    '/profile': privatePage(
      'Profile',
      'Manage your personal and academic Connect2Code profile.',
      '/profile'
    ),
    '/settings': privatePage(
      'Settings',
      'Manage your Connect2Code application preferences.',
      '/settings'
    ),
    '/admin': privatePage(
      'Admin Portal',
      'Connect2Code administration portal.',
      '/admin/dashboard'
    ),
    '/admin/dashboard': privatePage(
      'Admin Dashboard',
      'Monitor and manage the Connect2Code platform.',
      '/admin/dashboard'
    ),
    '/admin/questions': privatePage(
      'Manage Coding Questions',
      'Manage Connect2Code coding questions and test cases.',
      '/admin/questions'
    ),
    '/admin/mcqs': privatePage(
      'Manage MCQs',
      'Manage Connect2Code multiple-choice assessment questions.',
      '/admin/mcqs'
    ),
    '/admin/companies': privatePage(
      'Manage Companies',
      'Manage company preparation content and recruitment exams.',
      '/admin/companies'
    ),
    '/admin/languages': privatePage(
      'Manage Languages',
      'Manage supported programming languages.',
      '/admin/languages'
    ),
    '/admin/institutions': privatePage(
      'Manage Institutions',
      'Manage institutions available to Connect2Code students.',
      '/admin/institutions'
    ),
    '/admin/dsa-sheets': privatePage(
      'Manage DSA Sheets',
      'Manage structured DSA sheets, sections, and linked questions.',
      '/admin/dsa-sheets'
    ),
    '/500': privatePage(
      'Server Error',
      'Connect2Code encountered an unexpected server error.',
      '/500'
    ),
  };

  const exactMatch = exactPages[pathname];
  if (exactMatch) return exactMatch;

  if (segments[0] === 'problems' && segments.length === 2) {
    const problemName = humanizeSegment(segments[1], 'Coding Problem');
    return publicPage(
      problemName,
      `Solve ${problemName} with the Connect2Code coding workspace and test cases.`,
      pathname,
      { type: 'article' }
    );
  }

  if ((segments[0] === 'companies' || segments[0] === 'company-patterns') && segments.length === 2) {
    const companyName = humanizeSegment(segments[1], 'Company');
    return publicPage(
      `${companyName} Placement Preparation`,
      `Prepare for ${companyName} placement exams with hiring patterns, aptitude topics, and coding questions.`,
      `/companies/${segments[1]}`
    );
  }

  const isCompanyExam =
    segments[0] === 'companies' &&
    ((segments.length === 3 && segments[1] === 'exams') ||
      (segments.length === 4 && segments[2] === 'exams'));
  if (isCompanyExam) {
    const examId = segments.at(-1);
    const examName = humanizeSegment(examId, 'Company Exam');
    return publicPage(
      `${examName} Exam Pattern`,
      `Review the ${examName} placement exam pattern, sections, timing, roles, and preparation resources.`,
      pathname,
      { type: 'article' }
    );
  }

  if (segments[0] === 'roadmaps' && segments.length === 2) {
    const roadmapName = humanizeSegment(segments[1], 'Learning');
    return publicPage(
      `${roadmapName} Roadmap`,
      `Follow the ${roadmapName} learning roadmap for structured placement preparation.`,
      pathname,
      { type: 'article' }
    );
  }

  return privatePage(
    'Page Not Found',
    'The requested Connect2Code page could not be found.',
    pathname
  );
};
