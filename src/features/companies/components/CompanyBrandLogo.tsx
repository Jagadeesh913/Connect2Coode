import React, { useMemo, useState } from 'react';
import {
  getCompanyFallback,
  getCompanyLogoCandidates,
  resolveCompanyLogo,
} from '../utils/companyLogoRegistry';

export interface CompanyBrandLogoProps {
  name: string;
  logo?: string;
  website?: string;
  className?: string;
  watermark?: boolean;
  loading?: 'lazy' | 'eager';
  alt?: string;
}

/**
 * Renders the backend-owned company logo after validating its remote URL.
 * A bundled/domain-derived cascade and deterministic monogram keep the UI
 * useful when a record has no logo or an image host is unavailable.
 */
export const CompanyBrandLogo: React.FC<CompanyBrandLogoProps> = ({
  name,
  logo,
  website,
  className = 'w-10 h-10',
  watermark = false,
  loading = 'lazy',
  alt,
}) => {
  const apiLogo = logo;
  const sourceKey = `${name}\u0000${apiLogo || ''}\u0000${website || ''}`;
  const [failureState, setFailureState] = useState({ sourceKey, index: 0 });
  const candidateIndex = failureState.sourceKey === sourceKey ? failureState.index : 0;
  const fallback = getCompanyFallback(name);
  const definition = resolveCompanyLogo(name);
  const candidates = useMemo(
    () => getCompanyLogoCandidates(name, website, import.meta.env.VITE_BRANDFETCH_CLIENT_ID, apiLogo),
    [apiLogo, name, website]
  );
  const candidate = candidates[candidateIndex];
  const advanceCandidate = () => {
    setFailureState((current) => ({
      sourceKey,
      index: current.sourceKey === sourceKey ? current.index + 1 : 1,
    }));
  };

  if (candidate) {
    const isDarkInvert = candidate.source === 'local' && Boolean(definition?.darkInvert);
    const imageClassName = watermark
      ? `${className} object-contain grayscale brightness-0 dark:invert`
      : `w-full h-full object-contain drop-shadow-[0_1px_1px_rgba(15,23,42,0.12)] ${isDarkInvert ? 'dark:brightness-0 dark:invert transition-all' : ''}`;

    if (watermark) {
      return (
        <img
          key={candidate.src}
          src={candidate.src}
          alt=""
          className={imageClassName}
          loading={loading}
          decoding="async"
          aria-hidden="true"
          referrerPolicy="no-referrer"
          onError={advanceCandidate}
        />
      );
    }

    return (
      <div
        className={`${className} relative flex items-center justify-center overflow-hidden shrink-0`}
        data-logo-source={candidate.source}
      >
        <img
          key={candidate.src}
          src={candidate.src}
          alt={alt || `${definition?.displayName || name} logo`}
          className={imageClassName}
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={advanceCandidate}
        />
      </div>
    );
  }

  if (watermark) {
    return (
      <div className={`${className} flex items-center justify-center font-black text-6xl select-none opacity-60`} aria-hidden="true">
        {fallback.initial}
      </div>
    );
  }

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
  logo?: string;
  website?: string;
  className?: string;
  sizeClassName?: string;
  loading?: 'lazy' | 'eager';
}

export const CompanyCircleBadge: React.FC<CompanyCircleBadgeProps> = ({
  name,
  logo,
  website,
  className = '',
  sizeClassName = 'w-7 h-7',
  loading = 'lazy',
}) => (
  <div
    className={`${sizeClassName} rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-2xs hover:scale-105 hover:z-20 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${className}`}
    title={name}
    role="img"
    aria-label={name ? `${name} badge` : 'Company badge'}
  >
    <CompanyBrandLogo
      name={name}
      logo={logo}
      website={website}
      className="h-full w-full"
      loading={loading}
      alt={name ? `${name} icon` : 'Company icon'}
    />
  </div>
);

export default CompanyBrandLogo;
