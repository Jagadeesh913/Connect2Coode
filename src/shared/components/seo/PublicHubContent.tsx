import React from 'react';
import { Link } from 'react-router-dom';
import type { PublicPageContent } from '../../../core/metadata/publicPageContent';

interface PublicHubContentProps {
  content: PublicPageContent;
  onSignIn: () => void;
  signInDisabled?: boolean;
}

const PUBLIC_HUB_LINKS = [
  { path: '/practice', label: 'Coding Practice' },
  { path: '/dsa-sheet', label: 'DSA Sheet' },
  { path: '/companies', label: 'Company Preparation' },
  { path: '/aptitude', label: 'Aptitude Practice' },
];

export const PublicHubContent: React.FC<PublicHubContentProps> = ({
  content,
  onSignIn,
  signInDisabled = false,
}) => {
  const topicsId = `public-topics-${content.path.slice(1).replace(/[^a-z0-9]+/gi, '-')}`;

  return (
    <article
      data-c2c-public-hub={content.path}
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
      aria-labelledby="public-hub-heading"
    >
      <header className="grid gap-8 border-b border-slate-200 pb-8 dark:border-slate-800 lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className="lg:col-span-8">
          <p className="mb-3 text-sm font-semibold text-blue-700 dark:text-sky-400">{content.title}</p>
          <h1 id="public-hub-heading" className="max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
            {content.heading}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            {content.introduction}
          </p>
        </div>
        <div className="border-l-2 border-blue-600 pl-4 dark:border-sky-400 lg:col-span-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Sign in to access the live catalog</p>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Your account keeps practice, progress, and workspace activity in one place.</p>
        </div>
      </header>

      <div className="grid gap-10 py-10 lg:grid-cols-12 lg:py-12">
        <section className="lg:col-span-8" aria-labelledby={topicsId}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 id={topicsId} className="text-lg font-bold text-slate-900 dark:text-white">
              Explore this area
            </h2>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{content.topics.length} focus areas</span>
          </div>
          <ul className="mt-4 grid border-y border-slate-200 dark:border-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-slate-200 dark:sm:divide-slate-800">
            {content.topics.map((topic) => (
              <li
                key={topic}
                className="flex min-h-16 items-center gap-3 border-b border-slate-200 px-1 py-4 text-sm font-medium text-slate-700 last:border-b-0 dark:border-slate-800 dark:text-slate-200 sm:px-5 sm:[&:nth-last-child(-n+2)]:border-b-0"
              >
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{String(content.topics.indexOf(topic) + 1).padStart(2, '0')}</span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col justify-between border-l border-slate-200 pl-0 dark:border-slate-800 lg:col-span-4 lg:pl-8">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Ready when you are</p>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Sign in to continue with the current platform content and save your activity.</p>
          </div>
          <button
            type="button"
            onClick={onSignIn}
            disabled={signInDisabled}
            className="mt-6 inline-flex min-h-11 w-fit items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-70"
          >
            Sign in to continue
          </button>
        </aside>
      </div>

      <nav className="flex flex-wrap items-baseline gap-x-6 gap-y-3 border-t border-slate-200 pt-6 text-sm dark:border-slate-800" aria-label="Public preparation pages">
        <span className="font-medium text-slate-500 dark:text-slate-400">Explore more</span>
        {PUBLIC_HUB_LINKS.filter((link) => link.path !== content.path).map((link) => (
          <Link key={link.path} to={link.path} className="font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-sky-400">
            {link.label}
          </Link>
        ))}
      </nav>
    </article>
  );
};
