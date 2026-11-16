import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

export const SITE_ORIGIN = 'https://www.connect2code.in';
export const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}/social-card.png`;

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = join(scriptDirectory, '..');
const publicContentPath = join(projectDirectory, 'src', 'core', 'metadata', 'publicPageContent.json');

export const PUBLIC_PRERENDER_ROUTES = Object.freeze(
  JSON.parse(readFileSync(publicContentPath, 'utf8'))
);

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
})[character]);

const escapeXml = escapeHtml;
const pageTitle = (title) => `${title} | Connect2Code`;
const canonicalUrl = (path) => new URL(path, `${SITE_ORIGIN}/`).toString();
const serializeJsonLd = (value) => JSON.stringify(value)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026');

const buildWebPageSchema = (route) => {
  const canonical = canonicalUrl(route.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: pageTitle(route.title),
    description: route.description,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    inLanguage: 'en-IN',
  };
};

const replaceJsonLdScript = (html, id, value) => {
  const expression = new RegExp(`<script\\s+id="${id}"\\s+type="application/ld\\+json">[\\s\\S]*?<\\/script>`, 'i');
  if (!expression.test(html)) throw new Error(`Built HTML is missing JSON-LD script: ${id}`);
  return html.replace(expression, `<script id="${id}" type="application/ld+json">${serializeJsonLd(value)}</script>`);
};

const replaceHeadTag = (html, selector, replacement) => {
  const expression = new RegExp(`<meta(?=[^>]*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})[^>]*>`, 'i');
  if (!expression.test(html)) throw new Error(`Built HTML is missing metadata tag: ${selector}`);
  return html.replace(expression, replacement);
};

export const buildHomeMarkdown = (route = PUBLIC_PRERENDER_ROUTES[0]) => `# ${route.heading}

${route.introduction}

## What you can prepare

${route.topics.map((topic) => `- ${topic}`).join('\n')}

## Public preparation pages

${PUBLIC_PRERENDER_ROUTES
  .filter((candidate) => candidate.path !== route.path)
  .map((candidate) => `- [${candidate.title}](${canonicalUrl(candidate.path)})`)
  .join('\n')}
`;

export const buildLlmsTxt = () => `# Connect2Code

> Connect2Code is a placement-preparation platform with coding practice, DSA learning sheets, aptitude practice, and company-preparation resources.

## Public preparation hubs

${PUBLIC_PRERENDER_ROUTES.map((route) => `- [${route.title}](${canonicalUrl(route.path)}): ${route.description}`).join('\n')}

## Access boundary

Interactive problem catalogs, progress, company details, and coding workspaces require sign-in and are not published as public crawl targets.
`;

export const renderPrerenderedHtml = (template, route, renderedApp) => {
  if (typeof renderedApp !== 'string' || !renderedApp.trim()) {
    throw new Error(`React prerender returned no markup for ${route.path}`);
  }
  const canonical = canonicalUrl(route.path);
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle(route.title))}</title>`);
  html = replaceHeadTag(html, 'name="description"', `<meta name="description" content="${escapeHtml(route.description)}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'name="robots"', '<meta name="robots" content="index, follow" data-c2c-managed="true" />');
  html = replaceHeadTag(html, 'property="og:title"', `<meta property="og:title" content="${escapeHtml(pageTitle(route.title))}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'property="og:description"', `<meta property="og:description" content="${escapeHtml(route.description)}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'property="og:url"', `<meta property="og:url" content="${escapeHtml(canonical)}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'property="og:image"', `<meta property="og:image" content="${SOCIAL_IMAGE_URL}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'name="twitter:title"', `<meta name="twitter:title" content="${escapeHtml(pageTitle(route.title))}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'name="twitter:description"', `<meta name="twitter:description" content="${escapeHtml(route.description)}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'name="twitter:image"', `<meta name="twitter:image" content="${SOCIAL_IMAGE_URL}" data-c2c-managed="true" />`);
  html = html.replace(/<link[^>]+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" data-c2c-managed="true" />`);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root" data-c2c-ssr="true">${renderedApp}</div>`
  );
  if (route.path !== '/') {
    html = html.replace(/\s*<link[^>]+rel="alternate"[^>]+type="text\/markdown"[^>]*>/i, '');
  }
  html = replaceJsonLdScript(html, 'c2c-webpage-schema', buildWebPageSchema(route));
  if (!html.includes('data-c2c-ssr="true"')) {
    throw new Error('Built HTML is missing the server-rendered React root.');
  }
  return html;
};

export const buildSitemapXml = (routes = PUBLIC_PRERENDER_ROUTES) => {
  const locations = routes.map((route) => `  <url><loc>${escapeXml(canonicalUrl(route.path))}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations}\n</urlset>\n`;
};

const renderNonIndexableShell = (template, { title, heading, description }) => {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle(title))}</title>`);
  html = replaceHeadTag(html, 'name="description"', `<meta name="description" content="${escapeHtml(description)}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'name="robots"', '<meta name="robots" content="noindex, nofollow" data-c2c-managed="true" />');
  html = replaceHeadTag(html, 'property="og:title"', `<meta property="og:title" content="${escapeHtml(pageTitle(title))}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'property="og:description"', `<meta property="og:description" content="${escapeHtml(description)}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'name="twitter:title"', `<meta name="twitter:title" content="${escapeHtml(pageTitle(title))}" data-c2c-managed="true" />`);
  html = replaceHeadTag(html, 'name="twitter:description"', `<meta name="twitter:description" content="${escapeHtml(description)}" data-c2c-managed="true" />`);
  html = html.replace(/\s*<link[^>]+rel="canonical"[^>]*>/i, '');
  html = html.replace(/\s*<meta[^>]+property="og:url"[^>]*>/i, '');
  html = html.replace(/\s*<script\s+id="c2c-webpage-schema"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, '');
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"></div>\n    <noscript data-c2c-prerender="true"><main><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p></main></noscript>`
  );
  return html;
};

export const createPublicRouteRenderer = async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'c2c-seo-ssr-'));
  try {
    await build({
      root: projectDirectory,
      configFile: join(projectDirectory, 'vite.config.ts'),
      publicDir: false,
      logLevel: 'error',
      ssr: { noExternal: true },
      build: {
        ssr: join(projectDirectory, 'src', 'entry-server.tsx'),
        outDir: outputDirectory,
        emptyOutDir: true,
        rollupOptions: {
          output: { entryFileNames: 'entry-server.mjs' },
        },
      },
    });

    const serverEntry = join(outputDirectory, 'entry-server.mjs');
    const serverModule = await import(`${pathToFileURL(serverEntry).href}?v=${Date.now()}`);
    if (typeof serverModule.renderPublicRoute !== 'function') {
      throw new Error('SSR bundle does not export renderPublicRoute.');
    }

    return {
      renderRoute: serverModule.renderPublicRoute,
      cleanup: () => rm(outputDirectory, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(outputDirectory, { recursive: true, force: true });
    throw error;
  }
};

export const generateSeoAssets = async ({ distDirectory, renderRoute } = {}) => {
  const outputDirectory = distDirectory || join(scriptDirectory, '..', 'dist');
  const template = await readFile(join(outputDirectory, 'index.html'), 'utf8');
  const renderer = renderRoute ? null : await createPublicRouteRenderer();
  const render = renderRoute || renderer.renderRoute;

  try {
    for (const route of PUBLIC_PRERENDER_ROUTES) {
      const outputPath = route.path === '/'
        ? join(outputDirectory, 'index.html')
        : join(outputDirectory, `${route.path.slice(1)}.html`);
      const renderedApp = await render(route.path);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, renderPrerenderedHtml(template, route, renderedApp), 'utf8');
    }

    await writeFile(join(outputDirectory, 'app.html'), renderNonIndexableShell(template, {
      title: 'Connect2Code Application',
      heading: 'Connect2Code',
      description: 'This route loads current application data in the browser and is not available for search indexing.',
    }), 'utf8');
    await writeFile(join(outputDirectory, '404.html'), renderNonIndexableShell(template, {
      title: 'Page Not Found',
      heading: 'Page Not Found',
      description: 'The requested Connect2Code page could not be found.',
    }), 'utf8');
    await writeFile(join(outputDirectory, 'sitemap.xml'), buildSitemapXml(), 'utf8');
    await writeFile(join(outputDirectory, 'index.md'), buildHomeMarkdown(), 'utf8');
    await writeFile(join(outputDirectory, 'llms.txt'), buildLlmsTxt(), 'utf8');
  } finally {
    await renderer?.cleanup();
  }
};

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  await generateSeoAssets();
  console.log(`Generated ${PUBLIC_PRERENDER_ROUTES.length} prerendered public pages and sitemap.xml for ${SITE_ORIGIN}.`);
}
