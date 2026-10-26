import {
  DEFAULT_SOCIAL_IMAGE,
  formatPageTitle,
  sanitizeMetadataText,
  type PageMetadata,
} from './pageMetadata';

const escapeHtml = (value: string): string =>
  value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);

const absoluteUrl = (pathOrUrl: string, origin: string): string => {
  try {
    return new URL(pathOrUrl, `${origin}/`).toString();
  } catch {
    return `${origin}/`;
  }
};

export const resolveMetadataOrigin = (requestUrl: string, configuredOrigin?: string): string => {
  if (configuredOrigin) {
    try {
      const configuredUrl = new URL(configuredOrigin);
      if (configuredUrl.protocol === 'https:') return configuredUrl.origin;
    } catch {
      // Invalid deployment configuration must not produce a malformed canonical URL.
    }
  }

  return new URL(requestUrl).origin;
};

export const renderCrawlerDocument = (metadata: PageMetadata, origin: string): string => {
  const title = formatPageTitle(sanitizeMetadataText(metadata.title, 70));
  const description = sanitizeMetadataText(metadata.description, 180);
  const canonicalUrl = absoluteUrl(metadata.canonicalPath, origin);
  const imageUrl = absoluteUrl(metadata.image || DEFAULT_SOCIAL_IMAGE, origin);
  const imageAlt = sanitizeMetadataText(
    metadata.imageAlt || 'Connect2Code placement and coding preparation platform',
    120
  );
  const type = metadata.type || 'website';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="${metadata.robots}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta property="og:site_name" content="Connect2Code">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:image" content="${escapeHtml(imageUrl)}">
    <meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
    <meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}">
  </head>
  <body><main><h1>${escapeHtml(metadata.title)}</h1><p>${escapeHtml(description)}</p></main></body>
</html>`;
};
