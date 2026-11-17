import React from 'react';
import { AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LocalDataControls } from '../components/LocalDataControls';
import { LEGAL_PAGE_LINKS, LEGAL_PAGES, type LegalPageId } from '../legalContent';

interface LegalPageProps {
  page: LegalPageId;
}

export const LegalPage: React.FC<LegalPageProps> = ({ page }) => {
  const content = LEGAL_PAGES[page];

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#070A13] dark:text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/" className="font-semibold hover:text-blue-600 dark:hover:text-sky-400">Home</Link>
          <ChevronRight aria-hidden="true" size={15} />
          <span aria-current="page">{content.title}</span>
        </nav>

        <header className="max-w-4xl border-b border-slate-200 pb-8 dark:border-slate-800">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/40 dark:text-sky-300">
            <ShieldCheck aria-hidden="true" size={15} />
            {content.eyebrow}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            {content.summary}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Last reviewed {content.lastReviewed}
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-[calc(var(--c2c-navbar-height)+1.5rem)]">
            <nav aria-label={`${content.title} sections`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0D1322]">
              <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">On this page</p>
              <ul className="space-y-1">
                {content.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="block rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-sky-300">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0 space-y-6">
            {page === 'data-rights' && <LocalDataControls />}

            {content.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0D1322] sm:p-7" aria-labelledby={`${section.id}-title`}>
                <h2 id={`${section.id}-title`} className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-sky-400" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.table && (
                  <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        <tr>
                          {section.table.headers.map((header) => (
                            <th key={header} scope="col" className="border-b border-slate-200 px-4 py-3 font-bold dark:border-slate-700">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row.join('|')} className="align-top even:bg-slate-50/60 dark:even:bg-slate-900/40">
                            {row.map((cell, index) => (
                              <td key={`${index}-${cell}`} className="border-b border-slate-100 px-4 py-3 leading-6 text-slate-600 last:border-b-0 dark:border-slate-800 dark:text-slate-300">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {section.notice && (
                  <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
                    <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={19} />
                    <p>{section.notice}</p>
                  </div>
                )}
              </section>
            ))}

            <nav aria-label="Related policies" className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-[#0D1322] sm:p-6">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Related policies and help</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {LEGAL_PAGE_LINKS.filter((link) => link.id !== page).map((link) => (
                  <Link key={link.id} to={link.path} className="inline-flex min-h-10 items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-sky-300">
                    {link.title}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

