import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export const AdminBreadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbs: BreadcrumbItem[] = pathnames.map((value, index) => {
    const path = `/${pathnames.slice(0, index + 1).join('/')}`;
    const formattedLabel = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
    return { label: formattedLabel, path };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 font-sans">
      <Link to="/admin/dashboard" className="hover:text-white transition-colors">
        Admin
      </Link>
      {breadcrumbs.length > 1 &&
        breadcrumbs.slice(1).map((item, idx) => (
          <React.Fragment key={item.path}>
            <span className="text-gray-600">/</span>
            {idx === breadcrumbs.length - 2 ? (
              <span className="font-semibold text-white truncate">{item.label}</span>
            ) : (
              <Link to={item.path} className="hover:text-white transition-colors truncate">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        ))}
    </nav>
  );
};
