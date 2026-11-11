/* eslint-disable react-refresh/only-export-components -- route modules intentionally define lazy components beside the router */
import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AppRouterLayout } from '../layouts/AppRouterLayout';
import { ProtectedRoute } from '../core/guards/ProtectedRoute';
import { GuestRoute } from '../core/guards/GuestRoute';
import { AdminRoute } from '../core/guards/AdminRoute';
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { PageLoading } from '../shared/components/ui/PageLoading';
import { AuthenticatedFeatureGate } from '../features/auth/components/AuthenticatedFeatureGate';
import { RouteErrorBoundary } from '../shared/components/errors/RouteErrorBoundary';

// Lazy-loaded Pages for Production Code Splitting
const Landing = lazy(() => import('../features/landing/pages/Landing').then(({ Landing }) => ({ default: Landing })));
const OAuthCallback = lazy(() => import('../features/auth/pages/OAuthCallback').then(({ OAuthCallback }) => ({ default: OAuthCallback })));

const PracticePage = lazy(() => import('../features/problems/pages/PracticePage').then(({ PracticePage }) => ({ default: PracticePage })));
const DsaSheetPage = lazy(() => import('../features/dsaSheet/pages/DsaSheetPage').then(({ DsaSheetPage }) => ({ default: DsaSheetPage })));
const ProblemDetails = lazy(() => import('../features/problems/pages/ProblemDetails').then(({ ProblemDetails }) => ({ default: ProblemDetails })));
const CompanyList = lazy(() => import('../features/companies/pages/CompanyList').then(({ CompanyList }) => ({ default: CompanyList })));
const CompanyDetails = lazy(() => import('../features/companies/pages/CompanyDetails').then(({ CompanyDetails }) => ({ default: CompanyDetails })));
const CompanyExamDetails = lazy(() => import('../features/companies/pages/CompanyExamDetails').then(({ CompanyExamDetails }) => ({ default: CompanyExamDetails })));
const RoadmapDetails = lazy(() => import('../features/roadmaps/pages/RoadmapDetails').then(({ RoadmapDetails }) => ({ default: RoadmapDetails })));

const AptitudePrep = lazy(() => import('../features/aptitude/pages/AptitudePrep').then(({ AptitudePrep }) => ({ default: AptitudePrep })));
const InterviewPrep = lazy(() => import('../features/interviews/pages/InterviewPrep').then(({ InterviewPrep }) => ({ default: InterviewPrep })));

const BookmarksList = lazy(() => import('../features/bookmarks/pages/BookmarksList').then(({ BookmarksList }) => ({ default: BookmarksList })));
const ProfileSettings = lazy(() => import('../features/profile/pages/ProfileSettings').then(({ ProfileSettings }) => ({ default: ProfileSettings })));
const AppSettings = lazy(() => import('../features/settings/pages/AppSettings').then(({ AppSettings }) => ({ default: AppSettings })));

// Admin Pages
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard').then(({ AdminDashboard }) => ({ default: AdminDashboard })));
const AdminQuestions = lazy(() => import('../features/admin/pages/AdminQuestions').then(({ AdminQuestions }) => ({ default: AdminQuestions })));
const AdminCompanies = lazy(() => import('../features/admin/pages/AdminCompanies').then(({ AdminCompanies }) => ({ default: AdminCompanies })));
const AdminLanguages = lazy(() => import('../features/admin/pages/AdminLanguages').then(({ AdminLanguages }) => ({ default: AdminLanguages })));
const AdminInstitutions = lazy(() => import('../features/admin/pages/AdminInstitutions').then(({ AdminInstitutions }) => ({ default: AdminInstitutions })));
const AdminMcqs = lazy(() => import('../features/admin/pages/AdminMcqs').then(({ AdminMcqs }) => ({ default: AdminMcqs })));
const AdminDsaSheets = lazy(() => import('../features/admin/pages/AdminDsaSheets').then(({ AdminDsaSheets }) => ({ default: AdminDsaSheets })));
const AdminReferences = lazy(() => import('../features/admin/pages/AdminReferences').then(({ AdminReferences }) => ({ default: AdminReferences })));

const NotFound = lazy(() => import('../shared/components/errors/NotFound').then(({ NotFound }) => ({ default: NotFound })));
const ServerError = lazy(() => import('../shared/components/errors/ServerError').then(({ ServerError }) => ({ default: ServerError })));
const ComingSoon = lazy(() => import('../shared/components/ComingSoon').then(({ ComingSoon }) => ({ default: ComingSoon })));

const PageLoader = PageLoading;

const withSuspense = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const requireFeatureSession = (
  element: React.ReactNode,
  title: string,
  description: string
) => (
  <AuthenticatedFeatureGate title={title} description={description}>
    {element}
  </AuthenticatedFeatureGate>
);

// Feature toggle to route to the native Coming Soon UI while preserving all existing implementations (F-020).
// Defaults to true preserving existing baseline; can be disabled via VITE_SHOW_COMING_SOON=false.
const SHOW_COMING_SOON = import.meta.env.VITE_SHOW_COMING_SOON !== 'false';

const renderFeature = (Component: React.LazyExoticComponent<React.FC>, featureName: string) => {
  if (SHOW_COMING_SOON) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ComingSoon featureName={featureName} />
      </Suspense>
    );
  }
  return withSuspense(Component);
};

const appRoutes = [
  {
    path: '/',
    element: withSuspense(Landing),
  },
  {
    path: '/oauth/callback',
    element: withSuspense(OAuthCallback),
  },
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <Navigate to="/" replace /> },
      { path: '/signup', element: <Navigate to="/" replace /> },
      { path: '/forgot-password', element: <Navigate to="/" replace /> },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      // Company Prep routes keep stable URLs but mount API content only after sign-in.
      { path: '/companies', element: requireFeatureSession(withSuspense(CompanyList), 'Sign in to explore Company Prep', 'Log in with your Connect 2 Code account to browse hiring companies, recruitment patterns, and interview questions.') },
      { path: '/companies/:slug', element: requireFeatureSession(withSuspense(CompanyDetails), 'Sign in to view Company Prep', 'Log in to view company interview questions, practice problem sets, and recruitment details.') },
      { path: '/companies/:companyId/exams/:examId', element: requireFeatureSession(withSuspense(CompanyExamDetails), 'Sign in to view Company Prep', 'Log in to view company assessment rounds, exam sections, and preparation resources.') },
      { path: '/companies/exams/:examId', element: requireFeatureSession(withSuspense(CompanyExamDetails), 'Sign in to view Company Prep', 'Log in to view company assessment rounds, exam sections, and preparation resources.') },
      { path: '/company-patterns', element: <Navigate to="/companies" replace /> },
      { path: '/company-patterns/:slug', element: requireFeatureSession(withSuspense(CompanyDetails), 'Sign in to view Company Prep', 'Log in to view company interview questions, practice problem sets, and recruitment details.') },

      // Practice routes show the shared sign-in state before mounting API-owning pages.
      { path: '/dsa-sheet', element: requireFeatureSession(withSuspense(DsaSheetPage), 'Sign in to explore DSA Sheet', 'Log in with your Connect 2 Code account to browse curated DSA learning sheets, track your progress, and practice problems.') },
      { path: '/practice', element: requireFeatureSession(withSuspense(PracticePage), 'Sign in to explore Problem Bank', 'Log in with your Connect 2 Code account to browse coding problems, track your submissions, and practice algorithms.') },
      { path: '/problems', element: <Navigate to="/practice" replace /> },
      { path: '/problems/:slug', element: requireFeatureSession(withSuspense(ProblemDetails), 'Sign in to solve coding problems', 'Log in to open the coding workspace, run solutions, submit code, and track your progress.') },

      // Aptitude routes show the shared sign-in state before mounting API-owning pages.
      { path: '/aptitude', element: requireFeatureSession(withSuspense(AptitudePrep), 'Sign in to explore Aptitude Bank', 'Log in with your Connect 2 Code account to access quantitative, reasoning, verbal, and pseudocode practice.') },
      { path: '/progress', element: <Navigate to="/aptitude" replace /> },
      { path: '/roadmaps', element: <Navigate to="/aptitude" replace /> },
      { path: '/roadmaps/:slug', element: renderFeature(RoadmapDetails, 'Roadmaps') },
      { path: '/logical', element: <Navigate to="/aptitude?category=reasoning" replace /> },
      { path: '/verbal', element: <Navigate to="/aptitude?category=verbal" replace /> },
      { path: '/pseudocode', element: <Navigate to="/aptitude?category=pseudocode" replace /> },
      { path: '/interviews', element: renderFeature(InterviewPrep, 'Interview Questions') },

      // Account-management routes redirect confirmed signed-out users to the login page.
      {
        element: <ProtectedRoute />,
        children: [
          // Active User Features
          { path: '/dashboard', element: <Navigate to="/practice" replace /> },
          { path: '/bookmarks', element: withSuspense(BookmarksList) },
          { path: '/profile', element: withSuspense(ProfileSettings) },
          { path: '/settings', element: withSuspense(AppSettings) },
        ],
      },
    ],
  },
  // ADMIN FRONTEND ROUTE BRANCH
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { path: '', element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: withSuspense(AdminDashboard) },
          { path: 'questions', element: withSuspense(AdminQuestions) },
          { path: 'mcqs', element: withSuspense(AdminMcqs) },
          { path: 'companies', element: withSuspense(AdminCompanies) },
          { path: 'languages', element: withSuspense(AdminLanguages) },
          { path: 'institutions', element: withSuspense(AdminInstitutions) },
          { path: 'dsa-sheets', element: withSuspense(AdminDsaSheets) },
          { path: 'references', element: withSuspense(AdminReferences) },
        ],
      },
    ],
  },
  {
    path: '/500',
    element: withSuspense(ServerError),
  },
  {
    path: '*',
    element: withSuspense(NotFound),
  },
];

export const router = createBrowserRouter([
  {
    element: <AppRouterLayout />,
    errorElement: <RouteErrorBoundary />,
    children: appRoutes,
  },
]);
