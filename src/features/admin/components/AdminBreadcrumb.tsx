import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ShieldCheck } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Admin Console',
  dashboard: 'Overview',
  questions: 'DSA Problem Bank',
  mcqs: 'MCQ & Aptitude',
  companies: 'Hiring Companies',
  languages: 'Execution Languages',
  institutions: 'Partner Institutions',
};

export const AdminBreadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = pathnames.map((val, index) => {
    const path = `/${pathnames.slice(0, index + 1).join('/')}`;
    const formatted =
      ROUTE_LABELS[val.toLowerCase()] ||
      val.charAt(0).toUpperCase() + val.slice(1).replace(/-/g, ' ');
    return { label: formatted, path };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-sans">
      <Link
        to="/admin/dashboard"
        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>Admin</span>
      </Link>
      {breadcrumbs.length > 1 &&
        breadcrumbs.slice(1).map((item, idx) => {
          const isLast = idx === breadcrumbs.length - 2;
          return (
            <React.Fragment key={item.path}>
              <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-slate-900 dark:text-white truncate">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
    </nav>
  );
};
