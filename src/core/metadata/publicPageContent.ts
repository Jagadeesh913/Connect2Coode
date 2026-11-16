import rawPublicPageContent from './publicPageContent.json';

export interface PublicPageContent {
  path: string;
  title: string;
  description: string;
  heading: string;
  introduction: string;
  topics: string[];
}

export const PUBLIC_PAGE_CONTENT = rawPublicPageContent as PublicPageContent[];

export const getPublicPageContent = (path: string): PublicPageContent | null =>
  PUBLIC_PAGE_CONTENT.find((page) => page.path === path) ?? null;
