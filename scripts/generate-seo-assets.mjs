import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE_ORIGIN = 'https://connect2code.in';
export const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}/social-card.png`;

export const PUBLIC_PRERENDER_ROUTES = Object.freeze([
  {
    path: '/',
    title: 'Placement & Coding Preparation',
    description: 'Prepare for placements with coding problems, DSA sheets, aptitude practice, company exam patterns, and interview resources.',
    heading: 'Code Today For A Brighter Tomorrow',
    introduction: 'Build placement skills with structured coding practice, data structures and algorithms, aptitude preparation, and company-focused resources.',
    topics: ['Coding practice by topic and difficulty', 'Structured DSA preparation', 'Aptitude and reasoning practice', 'Company placement resources'],
  },
  {
    path: '/practice',
    title: 'Coding Practice',
    description: 'Practice curated coding problems by topic, difficulty, and company for placement interviews.',
    heading: 'Coding Practice for Placement Interviews',
    introduction: 'Explore the coding catalog, filter problems by topic and difficulty, and use the Connect2Code workspace to build consistent problem-solving skills.',
    topics: ['Topic-based problem discovery', 'Difficulty and company filters', 'Browser coding workspace', 'Progress available after sign-in'],
  },
  {
    path: '/dsa-sheet',
    title: 'DSA Sheet',
    description: 'Follow a structured data structures and algorithms sheet for placement preparation.',
    heading: 'Structured Data Structures and Algorithms Sheet',
    introduction: 'Work through placement-focused data structures and algorithms in a guided sequence, from core foundations to advanced problem-solving topics.',
    topics: ['Arrays and strings', 'Linked lists, stacks, and queues', 'Trees and graphs', 'Dynamic programming'],
  },
  {
    path: '/companies',
    title: 'Company Preparation',
    description: 'Explore company-specific placement exams, hiring patterns, aptitude topics, and coding questions.',
    heading: 'Company Placement Preparation',
    introduction: 'Use company-focused preparation resources to understand recruitment assessments, practice relevant topics, and organize placement study.',
    topics: ['Recruitment exam patterns', 'Company-focused coding practice', 'Aptitude and reasoning topics', 'Authenticated access to current catalog data'],
  },
  {
    path: '/aptitude',
    title: 'Aptitude Practice',
    description: 'Practice quantitative aptitude, logical reasoning, verbal ability, and pseudocode questions.',
    heading: 'Aptitude Practice for Placement Assessments',
    introduction: 'Prepare for common placement assessment sections with focused quantitative, reasoning, verbal, and programming-logic practice.',
    topics: ['Quantitative aptitude', 'Logical reasoning', 'Verbal ability', 'Pseudocode and code tracing'],
  },
]);

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

const replaceHeadTag = (html, selector, replacement) => {
  const expression = new RegExp(`<meta(?=[^>]*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})[^>]*>`, 'i');
  if (!expression.test(html)) throw new Error(`Built HTML is missing metadata tag: ${selector}`);
  return html.replace(expression, replacement);
};

const renderPrerenderedContent = (route) => `
      <main data-c2c-prerender="true" aria-label="${escapeHtml(route.heading)}">
        <article>
          <header>
            <p>Connect2Code placement preparation</p>
            <h1>${escapeHtml(route.heading)}</h1>
            <p>${escapeHtml(route.introduction)}</p>
          </header>
          <section aria-labelledby="page-topics">
            <h2 id="page-topics">What you can prepare</h2>
            <ul>${route.topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join('')}</ul>
          </section>
          <nav aria-label="Public preparation pages">
            <a href="/practice">Coding Practice</a>
            <a href="/dsa-sheet">DSA Sheet</a>
            <a href="/companies">Company Preparation</a>
            <a href="/aptitude">Aptitude Practice</a>
          </nav>
        </article>
      </main>`;

export const renderPrerenderedHtml = (template, route) => {
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
  html = html.replace('<div id="root"></div>', `<div id="root">${renderPrerenderedContent(route)}\n    </div>`);
  if (!html.includes('data-c2c-prerender="true"')) throw new Error('Built HTML is missing the empty React root expected by the prerenderer.');
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
  html = html.replace('<div id="root"></div>', `<div id="root">
      <main data-c2c-prerender="true"><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p></main>
    </div>`);
  return html;
};

export const generateSeoAssets = async ({ distDirectory } = {}) => {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const outputDirectory = distDirectory || join(scriptDirectory, '..', 'dist');
  const template = await readFile(join(outputDirectory, 'index.html'), 'utf8');

  for (const route of PUBLIC_PRERENDER_ROUTES) {
    const outputPath = route.path === '/'
      ? join(outputDirectory, 'index.html')
      : join(outputDirectory, `${route.path.slice(1)}.html`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, renderPrerenderedHtml(template, route), 'utf8');
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
};

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  await generateSeoAssets();
  console.log(`Generated ${PUBLIC_PRERENDER_ROUTES.length} prerendered public pages and sitemap.xml for ${SITE_ORIGIN}.`);
}
