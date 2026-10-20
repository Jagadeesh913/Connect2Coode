import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  to?: string;
  variant?: 'lockup' | 'mark' | 'image';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = true,
  to = '/',
  variant = 'lockup',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const imageHeights = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const taglineSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[11px]',
  };

  if (variant === 'image') {
    const imgContent = (
      <img
        src="/logo-horizontal.png"
        alt="Connect to Code"
        className={`${imageHeights[size]} w-auto object-contain shrink-0 ${className}`}
      />
    );
    if (to) {
      return (
        <Link to={to} className="inline-flex items-center text-inherit no-underline">
          {imgContent}
        </Link>
      );
    }
    return imgContent;
  }

  if (variant === 'mark') {
    const markContent = (
      <img
        src="/logo-mark.png"
        alt="Connect to Code"
        className={`${iconSizes[size]} object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(139,92,246,0.35)] ${className}`}
      />
    );
    if (to) {
      return (
        <Link to={to} className="inline-flex items-center text-inherit no-underline">
          {markContent}
        </Link>
      );
    }
    return markContent;
  }

  const content = (
    <div className={`flex items-center gap-2.5 group cursor-pointer select-none ${className}`}>
      {/* 3D Ribbon Logo Mark */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <img
          src="/logo-mark.png"
          alt="Connect to Code Mark"
          className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(139,92,246,0.35)] transition-transform group-hover:scale-105 duration-200"
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <span
          className={`font-black tracking-tight leading-none text-slate-900 dark:text-white transition-colors ${titleSizes[size]}`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          connect<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500">2</span>code
        </span>
        {showTagline && (
          <span
            className={`hidden sm:inline-block font-semibold tracking-[0.16em] uppercase text-slate-500 dark:text-slate-400 mt-0.5 leading-none ${taglineSizes[size]}`}
          >
            CODE TOGETHER CONNECT FOREVER
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center text-inherit no-underline">
        {content}
      </Link>
    );
  }

  return content;
};
