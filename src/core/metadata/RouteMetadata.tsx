import React, {
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_SOCIAL_IMAGE,
  formatPageTitle,
  resolvePageMetadata,
  sanitizeMetadataText,
  type PageMetadata,
} from './pageMetadata';
import { MetadataContext, type MetadataOverride } from './MetadataContext';

const upsertMeta = (selector: string, attributes: Record<string, string>): HTMLMetaElement => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.dataset.c2cManaged = 'true';
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
  return element;
};

const upsertCanonical = (href: string): void => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    element.dataset.c2cManaged = 'true';
    document.head.appendChild(element);
  }
  element.href = href;
};

const resolveSiteOrigin = (): string => {
  const configuredOrigin = import.meta.env.VITE_SITE_URL?.trim();
  if (configuredOrigin) {
    try {
      const url = new URL(configuredOrigin);
      if (url.protocol === 'https:' || (import.meta.env.DEV && url.protocol === 'http:')) {
        return url.origin;
      }
    } catch {
      // Fall through to the browser origin when deployment configuration is invalid.
    }
  }
  return window.location.origin;
};

const absoluteUrl = (pathOrUrl: string, origin: string): string => {
  try {
    return new URL(pathOrUrl, `${origin}/`).toString();
  } catch {
    return `${origin}/`;
  }
};

const applyMetadata = (metadata: PageMetadata): void => {
  const origin = resolveSiteOrigin();
  const title = formatPageTitle(sanitizeMetadataText(metadata.title, 70));
  const description = sanitizeMetadataText(metadata.description, 180);
  const canonicalUrl = absoluteUrl(metadata.canonicalPath, origin);
  const imageUrl = absoluteUrl(metadata.image || DEFAULT_SOCIAL_IMAGE, origin);
  const imageAlt = sanitizeMetadataText(
    metadata.imageAlt || 'Connect2Code placement and coding preparation platform',
    120
  );

  document.title = title;
  upsertCanonical(canonicalUrl);
  upsertMeta('meta[name="description"]', { name: 'description', content: description });
  upsertMeta('meta[name="robots"]', { name: 'robots', content: metadata.robots });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: metadata.type || 'website' });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
  upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: imageAlt });
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Connect2Code' });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });
  upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: imageAlt });
};

export const RouteMetadata: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const [override, setOverride] = useState<MetadataOverride | null>(null);
  const baseMetadata = useMemo(
    () => resolvePageMetadata(location.pathname),
    [location.pathname]
  );
  const effectiveMetadata = useMemo(
    () =>
      override?.locationKey === location.key
        ? { ...baseMetadata, ...override.value }
        : baseMetadata,
    [baseMetadata, location.key, override]
  );

  useLayoutEffect(() => {
    applyMetadata(effectiveMetadata);
  }, [effectiveMetadata]);

  return (
    <MetadataContext.Provider value={setOverride}>
      {children}
    </MetadataContext.Provider>
  );
};
