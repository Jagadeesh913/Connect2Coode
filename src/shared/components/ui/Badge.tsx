import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'easy' | 'medium' | 'hard' | 'success' | 'warning' | 'info' | 'neutral' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    easy: 'text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/60 font-semibold',
    medium: 'text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/60 font-semibold',
    hard: 'text-rose-700 bg-rose-50 border border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800/60 font-semibold',
    success: 'text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/60 font-semibold',
    warning: 'text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/60 font-semibold',
    info: 'text-blue-700 bg-blue-50 border border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800/60 font-semibold',
    neutral: 'text-slate-600 bg-slate-100 border border-slate-200 dark:text-slate-300 dark:bg-slate-800/80 dark:border-slate-700 font-medium',
    primary: 'text-blue-700 bg-blue-50 border border-blue-200 dark:text-blue-300 dark:bg-blue-900/40 dark:border-blue-700 font-semibold',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] rounded-full',
    md: 'px-3 py-1 text-xs rounded-full',
    lg: 'px-3.5 py-1.5 text-xs sm:text-sm rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center justify-center transition-colors shadow-2xs select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

