import React from 'react';

interface AdminEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center p-8 bg-neutral-900 border border-white/10 rounded-2xl my-4 font-sans">
      <div className="p-4 bg-neutral-800 border border-neutral-700 rounded-full text-neutral-300 mb-4">
        {icon || <i className="fa-solid fa-inbox text-2xl"></i>}
      </div>
      <h4 className="text-lg font-bold text-white font-heading tracking-tight mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
