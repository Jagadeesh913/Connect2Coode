import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'accent' | 'easy' | 'medium' | 'hard';

interface AdminBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    primary: 'bg-neutral-800 text-neutral-200 border-neutral-700',
    accent: 'bg-neutral-800 text-neutral-200 border-neutral-700',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    neutral: 'bg-white/5 text-gray-300 border-white/10',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide border ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {children}
    </span>
  );
};
