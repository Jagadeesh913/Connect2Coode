import React from 'react';

interface AdminCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-neutral-900 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col font-sans ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 pb-3.5 mb-4 border-b border-white/10">
          <div>
            {title && (
              <h3 className="text-base font-bold text-white tracking-tight font-heading">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
};
