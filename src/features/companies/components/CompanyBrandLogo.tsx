import React, { useMemo, useState } from 'react';
import {
  resolveCompanyLogo,
  getCompanyFallback,
  getCompanyLogoCandidates,
} from '../utils/companyLogoRegistry';

export interface CompanyBrandLogoProps {
  name: string;
  logo?: string;
  logoUrl?: string;
  website?: string;
  className?: string;
  watermark?: boolean;
  loading?: 'lazy' | 'eager';
  alt?: string;
}

/**
 * Production-Quality Company Brand Logo Component
 *
 * Guarantees:
 * - Ignores untrusted backend logoUrl/logo values
 * - Prefers reviewed local assets, then domain-derived/reviewed providers
 * - Preserves exact aspect ratio via object-fit: contain
 * - Responsive, accessible, and supports dark-mode
 * - Deterministic, elegant monogram fallback on missing or failed assets
 */
export const CompanyBrandLogo: React.FC<CompanyBrandLogoProps> = ({
  name,
  website,
  className = 'w-10 h-10',
  watermark = false,
  loading = 'lazy',
  alt,
}) => {
  const sourceKey = `${name}\u0000${website || ''}`;
  const [failureState, setFailureState] = useState({ sourceKey, index: 0 });
  const candidateIndex = failureState.sourceKey === sourceKey ? failureState.index : 0;
  const def = resolveCompanyLogo(name);
  const fallback = getCompanyFallback(name);
  const norm = (name || '').toLowerCase().trim();
  const candidates = useMemo(
    () => getCompanyLogoCandidates(name, website, import.meta.env.VITE_BRANDFETCH_CLIENT_ID),
    [name, website]
  );
  const candidate = candidates[candidateIndex];
  const advanceCandidate = () => {
    setFailureState((current) => ({
      sourceKey,
      index: current.sourceKey === sourceKey ? current.index + 1 : 1,
    }));
  };

  // --------------------------------------------------------------------------
  // 1. Watermark Silhouette Rendering (Uses currentColor for seamless blending)
  // --------------------------------------------------------------------------
  if (watermark) {
    if (def && candidateIndex === 0) {
      return (
        <img
          src={def.assetPath}
          alt=""
          className={`${className} object-contain grayscale brightness-0 dark:invert`}
          loading={loading}
          decoding="async"
          aria-hidden="true"
          onError={advanceCandidate}
        />
      );
    }
    if (norm.includes('google')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
      );
    }
    if (norm.includes('amazon')) {
      return (
        <svg viewBox="0 0 48 48" className={className} fill="currentColor" aria-hidden="true">
          <path d="M38 33c-8 6-22 6-32 0-.3-.2-.5.2-.2.4 8 6 24 6 32 0 .4-.2.2-.6-.2-.4z" />
          <path d="M39 31l1.5 4-4 .5z" />
        </svg>
      );
    }
    if (norm.includes('microsoft')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M11 0H0v11h11V0zm13 0H13v11h11V0zM11 13H0v11h11V13zm13 0H13v11h11V13z" />
        </svg>
      );
    }
    if (norm.includes('meta') || norm.includes('facebook')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M12 7.2c-2.4 0-4.3 1.5-5.5 3.5-1.1-1.9-3-3.5-5.3-3.5C.5 7.2 0 8.1 0 10.4c0 3.2 2.7 6.4 5.9 6.4 2.3 0 4.2-1.5 5.3-3.5 1.1 2 3.1 3.5 5.5 3.5 3.2 0 5.9-3.2 5.9-6.4 0-2.3-.5-3.2-1.2-3.2-2.3 0-4.2 1.6-5.3 3.5-1.2-2-3.1-3.5-4.1-3.5z" />
        </svg>
      );
    }
    if (norm.includes('apple')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.64-.78 1.08-1.87.96-2.96-.93.04-2.06.62-2.73 1.4-.58.68-1.1 1.77-.96 2.84 1.04.08 2.09-.5 2.73-1.28" />
        </svg>
      );
    }
    if (norm.includes('accenture')) {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M4 2.5l14 9.5-14 9.5v-4.5l7.5-5-7.5-5z" />
        </svg>
      );
    }
    if (norm.includes('tcs') || norm.includes('tata')) {
      return (
        <div className={`${className} flex items-center justify-center font-black text-6xl tracking-tighter select-none opacity-80`} aria-hidden="true">
          tcs
        </div>
      );
    }
    if (norm.includes('infosys')) {
      return (
        <div className={`${className} flex items-center justify-center font-bold text-4xl tracking-tight italic select-none opacity-70`} aria-hidden="true">
          Infosys
        </div>
      );
    }
    if (norm.includes('cognizant')) {
      return (
        <div className={`${className} flex items-center justify-center font-black text-5xl tracking-tighter select-none opacity-80`} aria-hidden="true">
          C
        </div>
      );
    }
    if (norm.includes('ibm')) {
      return (
        <div className={`${className} flex items-center justify-center font-black text-6xl tracking-widest font-mono select-none opacity-70`} aria-hidden="true">
          IBM
        </div>
      );
    }
    if (norm.includes('intel')) {
      return (
        <div className={`${className} flex items-center justify-center font-black text-5xl tracking-tight select-none opacity-80`} aria-hidden="true">
          intel
        </div>
      );
    }
    if (norm.includes('nvidia')) {
      return (
        <div className={`${className} flex items-center justify-center font-black text-4xl tracking-widest select-none opacity-70`} aria-hidden="true">
          NVIDIA
        </div>
      );
    }
    if (norm.includes('uber')) {
      return (
        <div className={`${className} flex items-center justify-center font-black text-5xl tracking-tight select-none opacity-70`} aria-hidden="true">
          Uber
        </div>
      );
    }

    return (
      <div className={`${className} flex items-center justify-center font-black text-6xl select-none opacity-60`} aria-hidden="true">
        {fallback.initial}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. Local-first logo cascade, followed by reviewed domain/CDN sources.
  // --------------------------------------------------------------------------
  if (candidate) {
    const isDarkInvert = candidate.source === 'local' && Boolean(def?.darkInvert);

    return (
      <div
        className={`${className} relative flex items-center justify-center overflow-hidden shrink-0`}
        data-logo-source={candidate.source}
      >
        <img
          key={candidate.src}
          src={candidate.src}
          alt={alt || `${def?.displayName || name} logo`}
          className={`w-full h-full object-contain drop-shadow-[0_1px_1px_rgba(15,23,42,0.12)] ${isDarkInvert ? 'dark:brightness-0 dark:invert transition-all' : ''}`}
          loading={loading}
          decoding="async"
          referrerPolicy="strict-origin-when-cross-origin"
          onError={advanceCandidate}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 3. Fallback Monogram Badge with Deterministic Brand Gradient
  // --------------------------------------------------------------------------
  return (
    <div
      className={`relative isolate overflow-hidden rounded-[28%] bg-gradient-to-br ${fallback.gradientClass} text-white font-black flex items-center justify-center text-sm shadow-[0_6px_18px_-8px_rgba(15,23,42,0.75)] ring-1 ring-white/25 select-none shrink-0 ${className}`}
      title={name}
      role="img"
      aria-label={name ? `${name} logo` : 'Company logo'}
      data-logo-source="monogram"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.32),transparent_36%)]" aria-hidden="true" />
      <span className="relative tracking-[-0.08em] drop-shadow-sm">{fallback.initial}</span>
    </div>
  );
};

export interface CompanyCircleBadgeProps {
  name: string;
  logoUrl?: string;
  website?: string;
  className?: string;
  sizeClassName?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Compact circular company icon badge for table rows, cards, and avatar groups.
 * Preserves exact logo proportions with object-fit: contain.
 */
export const CompanyCircleBadge: React.FC<CompanyCircleBadgeProps> = ({
  name,
  website,
  className = '',
  sizeClassName = 'w-7 h-7',
  loading = 'lazy',
}) => {
  return (
    <div
      className={`${sizeClassName} rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-2xs hover:scale-105 hover:z-20 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${className}`}
      title={name}
      role="img"
      aria-label={name ? `${name} badge` : 'Company badge'}
    >
      <CompanyBrandLogo
        name={name}
        website={website}
        className="h-full w-full"
        loading={loading}
        alt={name ? `${name} icon` : 'Company icon'}
      />
    </div>
  );
};

export default CompanyBrandLogo;
