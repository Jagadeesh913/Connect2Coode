import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AppRouterLayout } from '../layouts/AppRouterLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from '../core/guards/ProtectedRoute';
import { GuestRoute } from '../core/guards/GuestRoute';
import { AdminRoute } from '../core/guards/AdminRoute';
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { Skeleton } from '../shared/components/ui/Skeleton';

// Static imports for Auth (already shared via MainLayout)
import { Login } from '../features/auth/pages/Login';
import { Signup } from '../features/auth/pages/Signup';
import { ForgotPassword } from '../features/auth/pages/ForgotPassword';

// Lazy-loaded Pages for Production Code Splitting
const Landing = lazy(() => import('../features/landing/pages/Landing').then((m: any) => ({ default: m.Landing || m.default })));
const OAuthCallback = lazy(() => import('../features/auth/pages/OAuthCallback').then((m: any) => ({ default: m.OAuthCallback || m.default })));

const PracticePage = lazy(() => import('../features/problems/pages/PracticePage').then((m: any) => ({ default: m.PracticePage || m.default })));
const ProblemList = lazy(() => import('../features/problems/pages/ProblemList').then((m: any) => ({ default: m.ProblemList || m.default })));
const ProblemDetails = lazy(() => import('../features/problems/pages/ProblemDetails').then((m: any) => ({ default: m.ProblemDetails || m.default })));
const CompanyList = lazy(() => import('../features/companies/pages/CompanyList').then((m: any) => ({ default: m.CompanyList || m.default })));
const CompanyDetails = lazy(() => import('../features/companies/pages/CompanyDetails').then((m: any) => ({ default: m.CompanyDetails || m.default })));
const CompanyPatterns = lazy(() => import('../features/companies/pages/CompanyPatterns').then((m: any) => ({ default: m.CompanyPatterns || m.default })));
const CompanyPatternDetails = lazy(() => import('../features/companies/pages/CompanyPatternDetails').then((m: any) => ({ default: m.CompanyPatternDetails || m.default })));

const RoadmapList = lazy(() => import('../features/roadmaps/pages/RoadmapList').then((m: any) => ({ default: m.RoadmapList || m.default })));
const RoadmapDetails = lazy(() => import('../features/roadmaps/pages/RoadmapDetails').then((m: any) => ({ default: m.RoadmapDetails || m.default })));

const AptitudePrep = lazy(() => import('../features/aptitude/pages/AptitudePrep').then((m: any) => ({ default: m.AptitudePrep || m.default })));
const LogicalPrep = lazy(() => import('../features/logical/pages/LogicalPrep').then((m: any) => ({ default: m.LogicalPrep || m.default })));
const VerbalPrep = lazy(() => import('../features/verbal/pages/VerbalPrep').then((m: any) => ({ default: m.VerbalPrep || m.default })));
const InterviewPrep = lazy(() => import('../features/interviews/pages/InterviewPrep').then((m: any) => ({ default: m.InterviewPrep || m.default })));

const BookmarksList = lazy(() => import('../features/bookmarks/pages/BookmarksList').then((m: any) => ({ default: m.BookmarksList || m.default })));
const ProfileSettings = lazy(() => import('../features/profile/pages/ProfileSettings').then((m: any) => ({ default: m.ProfileSettings || m.default })));
const AppSettings = lazy(() => import('../features/settings/pages/AppSettings').then((m: any) => ({ default: m.AppSettings || m.default })));

// Admin Pages
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard').then((m: any) => ({ default: m.AdminDashboard || m.default })));
const AdminQuestions = lazy(() => import('../features/admin/pages/AdminQuestions').then((m: any) => ({ default: m.AdminQuestions || m.default })));
const AdminCompanies = lazy(() => import('../features/admin/pages/AdminCompanies').then((m: any) => ({ default: m.AdminCompanies || m.default })));
const AdminLanguages = lazy(() => import('../features/admin/pages/AdminLanguages').then((m: any) => ({ default: m.AdminLanguages || m.default })));
const AdminInstitutions = lazy(() => import('../features/admin/pages/AdminInstitutions').then((m: any) => ({ default: m.AdminInstitutions || m.default })));

const NotFound = lazy(() => import('../shared/components/errors/NotFound').then((m: any) => ({ default: m.NotFound || m.default })));
const ServerError = lazy(() => import('../shared/components/errors/ServerError').then((m: any) => ({ default: m.ServerError || m.default })));
const ComingSoon = lazy<React.ComponentType<any>>(() => import('../shared/components/ComingSoon').then((m: any) => ({ default: m.ComingSoon || m.default })));

const PageLoader: React.FC = () => (
  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 font-sans animate-fade-in">
    <div className="flex items-center justify-between">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
    <Skeleton className="h-56 w-full rounded-3xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
      <Skeleton className="h-44 w-full rounded-2xl" count={4} />
    </div>
  </div>
);

const withSuspense = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
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
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/signup', element: <Signup /> },
          { path: '/forgot-password', element: <ForgotPassword /> },
        ],
      },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      // All app features require authentication except the Home landing page
      {
        element: <ProtectedRoute />,
        children: [
          // Practice & Problems Pages
          { path: '/dsa-sheet', element: withSuspense(ProblemList) },
          { path: '/practice', element: withSuspense(PracticePage) },
          { path: '/problems', element: <Navigate to="/practice" replace /> },
          { path: '/problems/:slug', element: withSuspense(ProblemDetails) },

          // Companies Pages
          { path: '/companies', element: withSuspense(CompanyList) },
          { path: '/companies/:slug', element: withSuspense(CompanyDetails) },
          { path: '/company-patterns', element: renderFeature(CompanyPatterns, 'Company Exam Patterns') },
          { path: '/company-patterns/:slug', element: renderFeature(CompanyPatternDetails, 'Company Exam Patterns') },

          // Aptitude Practice Pages
          { path: '/aptitude', element: withSuspense(AptitudePrep) },
          { path: '/progress', element: <Navigate to="/aptitude" replace /> },
          { path: '/roadmaps', element: <Navigate to="/aptitude" replace /> },
          { path: '/roadmaps/:slug', element: renderFeature(RoadmapDetails, 'Roadmaps') },
          { path: '/logical', element: <Navigate to="/aptitude?category=reasoning" replace /> },
          { path: '/verbal', element: <Navigate to="/aptitude?category=verbal" replace /> },
          { path: '/interviews', element: renderFeature(InterviewPrep, 'Interview Questions') },

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
          { path: 'companies', element: withSuspense(AdminCompanies) },
          { path: 'languages', element: withSuspense(AdminLanguages) },
          { path: 'institutions', element: withSuspense(AdminInstitutions) },
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
    children: appRoutes,
  },
]);
