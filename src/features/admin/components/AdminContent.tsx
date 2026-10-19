import React from 'react';

interface AdminContentProps {
  children?: React.ReactNode;
}

export const AdminContent: React.FC<AdminContentProps> = ({ children }) => {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto w-full">{children}</div>
    </main>
  );
};
