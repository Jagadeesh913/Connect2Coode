import { renderCrawlerDocument, resolveMetadataOrigin } from '../src/core/metadata/crawlerMetadata';
import { resolvePageMetadata, type PageMetadata } from '../src/core/metadata/pageMetadata';

interface VercelRequestLike {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponseLike {
  status: (statusCode: number) => VercelResponseLike;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
}

const API_BASE_URL = (process.env.VITE_API_BASE_URL || 'https://api.connect2code.in/api/v1').replace(/\/+$/, '');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const getString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const unwrapData = (value: unknown): Record<string, unknown> | null => {
  if (!isRecord(value)) return null;
  return isRecord(value.data) ? value.data : value;
};

const matchesRouteIdentifier = (entity: Record<string, unknown>, identifier: string): boolean => {
  const slug = getString(entity.slug);
  const id = getString(entity.id) || (typeof entity.id === 'number' ? String(entity.id) : null);
  const normalizedIdentifier = decodeURIComponent(identifier).trim().toLowerCase();
  return slug?.toLowerCase() === normalizedIdentifier || id === normalizedIdentifier;
};

const fetchEntity = async (path: string): Promise<Record<string, unknown> | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    return unwrapData(await response.json());
  } catch {
    return null;
  }
};

export const resolveApiBackedMetadata = async (
  pathname: string,
  fallback: PageMetadata
): Promise<PageMetadata> => {
  if (fallback.robots !== 'index, follow') return fallback;
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] === 'problems' && segments.length === 2) {
    const entity = await fetchEntity(`/question/${encodeURIComponent(segments[1])}`);
    const title = entity && getString(entity.title);
    if (entity && title && matchesRouteIdentifier(entity, segments[1])) {
      return { ...fallback, title, description: getString(entity.description) || fallback.description };
    }
  }

  if ((segments[0] === 'companies' || segments[0] === 'company-patterns') && segments.length === 2) {
    const entity = await fetchEntity(`/company/${encodeURIComponent(segments[1])}`);
    const name = entity && getString(entity.name);
    if (entity && name && matchesRouteIdentifier(entity, segments[1])) {
      return {
        ...fallback,
        title: `${name} Placement Preparation`,
        description: getString(entity.description) || fallback.description,
      };
    }
  }

  const isExamRoute =
    segments[0] === 'companies' &&
    ((segments.length === 3 && segments[1] === 'exams') ||
      (segments.length === 4 && segments[2] === 'exams'));
  if (isExamRoute) {
    const examId = segments.at(-1);
    const payload = examId ? await fetchEntity(`/company/exams/${encodeURIComponent(examId)}`) : null;
    const exam = payload && (isRecord(payload.exam) ? payload.exam : payload);
    const examName = exam && getString(exam.examName);
    if (exam && examName && examId && matchesRouteIdentifier(exam, examId)) {
      return {
        ...fallback,
        title: `${examName} Exam Pattern`,
        description: getString(exam.description) || fallback.description,
      };
    }
  }

  return fallback;
};

const getRoutePath = (query: VercelRequestLike['query']): string => {
  const rawPath = query.path;
  const path = Array.isArray(rawPath) ? rawPath.join('/') : rawPath || '';
  return `/${path}`.replace(/\/{2,}/g, '/');
};

const getRequestOrigin = (request: VercelRequestLike): string => {
  const host = Array.isArray(request.headers.host) ? request.headers.host[0] : request.headers.host;
  const forwardedProtocol = Array.isArray(request.headers['x-forwarded-proto'])
    ? request.headers['x-forwarded-proto'][0]
    : request.headers['x-forwarded-proto'];
  return `${forwardedProtocol === 'http' ? 'http' : 'https'}://${host || 'localhost'}`;
};

export default async function handler(request: VercelRequestLike, response: VercelResponseLike): Promise<void> {
  if (request.method !== 'GET') {
    response.status(405);
    response.setHeader('allow', 'GET');
    response.send('Method Not Allowed');
    return;
  }

  const pathname = getRoutePath(request.query);
  const metadata = await resolveApiBackedMetadata(pathname, resolvePageMetadata(pathname));
  const origin = resolveMetadataOrigin(getRequestOrigin(request), process.env.VITE_SITE_URL);

  response.setHeader('content-type', 'text/html; charset=utf-8');
  response.setHeader('cache-control', 'public, s-maxage=600, stale-while-revalidate=60');
  response.setHeader('vary', 'User-Agent');
  response.setHeader('x-robots-tag', metadata.robots);
  response.status(200).send(renderCrawlerDocument(metadata, origin));
}
