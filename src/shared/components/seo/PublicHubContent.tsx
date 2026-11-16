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
      className="mx-auto flex min-h-[65vh] w-full max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8"
      aria-labelledby="public-hub-heading"
    >
      <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0D1322] sm:p-10">
        <header className="max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">
            Connect2Code placement preparation
          </p>
          <h1 id="public-hub-heading" className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {content.heading}
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            {content.introduction}
          </p>
        </header>

        <section className="mt-8" aria-labelledby={topicsId}>
          <h2 id={topicsId} className="text-lg font-bold text-slate-900 dark:text-white">
            What you can prepare
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {content.topics.map((topic) => (
              <li
                key={topic}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                {topic}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSignIn}
            disabled={signInDisabled}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
          >
            Sign in to continue
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Current catalogs, progress, and interactive workspaces require an account.
          </p>
        </div>

        <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-200 pt-6 text-sm dark:border-slate-800" aria-label="Public preparation pages">
          {PUBLIC_HUB_LINKS.filter((link) => link.path !== content.path).map((link) => (
            <Link key={link.path} to={link.path} className="font-semibold text-blue-600 hover:underline dark:text-sky-400">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </article>
  );
};
