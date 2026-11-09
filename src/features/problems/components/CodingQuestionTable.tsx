import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Company, Problem } from '../../../core/types/domain';
import { getSafeRemoteImageUrl } from '../../../core/security/externalUrl';
import { CompanyCircleBadge } from '../../companies/components/CompanyBrandLogo';
import { TableRowSkeleton } from '../../../shared/components/ui/Skeleton';

export type CodingQuestionListItem = Pick<
  Problem,
  | 'id'
  | 'questionId'
  | 'slug'
  | 'title'
  | 'difficulty'
  | 'topic'
  | 'category'
  | 'companies'
  | 'companyDetails'
  | 'questionPlatform'
  | 'qpfRefName'
  | 'qpfRefCode'
  | 'examPlatform'
  | 'platformName'
  | 'platformLogoUrl'
>;

interface CodingQuestionTableProps<T extends CodingQuestionListItem> {
  questions: T[];
  companies?: Company[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  statusContent?: React.ReactNode;
  isSolved?: (question: T) => boolean;
  isBookmarked?: (question: T) => boolean;
  onBookmark?: (question: T, event: React.MouseEvent<HTMLButtonElement>) => void;
  getQuestionPath?: (question: T) => string;
}

const difficultyNumberColor = (difficulty: string): string => {
  const normalized = difficulty.toLowerCase().trim();
  if (normalized.includes('easy')) return 'text-emerald-600 dark:text-emerald-400 font-bold';
  if (normalized.includes('medium')) return 'text-amber-500 dark:text-orange-400 font-bold';
  if (normalized.includes('hard')) return 'text-rose-600 dark:text-rose-400 font-bold';
  if (normalized.includes('basic') || normalized.includes('school')) return 'text-sky-500 dark:text-sky-400 font-bold';
  return 'text-slate-500 dark:text-slate-400 font-bold';
};

const PlatformBadge: React.FC<{ question: CodingQuestionListItem; logoUrl?: string | null }> = ({ question, logoUrl }) => {
  const raw = question.questionPlatform || question.qpfRefName || question.examPlatform || question.platformName || question.qpfRefCode;
  const normalized = (raw || 'Unspecified').toLowerCase();
  const safeLogoUrl = getSafeRemoteImageUrl(logoUrl);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  let className = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60';
  let label = raw || 'Unspecified';
  let icon = 'fa-solid fa-laptop-code';

  if (normalized.includes('leetcode')) {
    className = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60';
    label = 'LeetCode';
    icon = 'fa-solid fa-code';
  } else if (normalized.includes('hackerrank')) {
    className = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60';
    label = 'HackerRank';
    icon = 'fa-solid fa-code';
  } else if (normalized.includes('geeks') || normalized.includes('gfg')) {
    className = 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200/80 dark:border-green-800/60';
    label = 'GeeksforGeeks';
    icon = 'fa-solid fa-code';
  } else if (normalized.includes('tcs') || normalized.includes('ion')) {
    className = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60';
    label = 'TCS iON';
  } else if (normalized.includes('aon')) {
    className = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60';
    label = 'AON';
    icon = 'fa-solid fa-shield-halved';
  } else if (normalized.includes('mettl')) {
    className = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60';
    label = 'Mettl';
    icon = 'fa-solid fa-laptop-file';
  } else if (normalized.includes('connect')) {
    label = 'Connect 2 Code';
    icon = 'fa-solid fa-code';
  }

  const renderLogo = Boolean(safeLogoUrl && failedLogoUrl !== safeLogoUrl);
  return <span title={label} className={`inline-flex h-7 w-9 items-center justify-center rounded-md border ${className}`}><span className="sr-only">{label}</span>{renderLogo ? <img src={safeLogoUrl!} alt="" className="h-5 max-w-6 object-contain" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedLogoUrl(safeLogoUrl)} /> : <i aria-hidden="true" className={`${icon} text-[11px]`} />}</span>;
};

export const CodingQuestionTable = <T extends CodingQuestionListItem>({
  questions,
  companies = [],
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No coding problems found',
  emptyDescription = 'Try adjusting your filters or search term.',
  statusContent,
  isSolved = () => false,
  isBookmarked = () => false,
  onBookmark,
  getQuestionPath = (question) => `/problems/${question.slug || question.id}`,
}: CodingQuestionTableProps<T>) => {
  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    companies.forEach((company) => {
      if (company.name) map.set(company.name.toLowerCase().trim(), company);
      if (company.slug) map.set(company.slug.toLowerCase().trim(), company);
    });
    return map;
  }, [companies]);
  return (
    <div className="bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
              <th className="py-3 px-4 w-16 text-center shrink-0">#</th>
              <th className="py-3 px-4 min-w-[200px]">Title</th>
              <th className="py-3 px-4 w-28 whitespace-nowrap">Platform</th>
              <th className="py-3 px-4 w-28 whitespace-nowrap">Companies</th>
              <th className="py-3 px-2 w-10 text-center shrink-0"><span className="sr-only">Bookmark</span></th>
              <th className="py-3 px-4 w-28 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {statusContent ? (
              <tr><td colSpan={6}>{statusContent}</td></tr>
            ) : loading ? (
              <TableRowSkeleton rows={8} showTopic={false} showDifficulty={false} />
            ) : error ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400"><div className="flex flex-col items-center gap-3"><span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Unable to load coding questions</span><span className="max-w-md text-xs text-slate-400">{error}</span>{onRetry && <button type="button" onClick={onRetry} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700">Retry</button>}</div></td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400"><div className="flex flex-col items-center gap-2"><i className="fa-solid fa-code text-2xl text-slate-300 dark:text-slate-600" /><span className="font-semibold text-sm">{emptyTitle}</span><span className="text-xs text-slate-400">{emptyDescription}</span></div></td></tr>
            ) : questions.map((question) => {
              const bookmarked = isBookmarked(question);
              const solved = isSolved(question);
              const questionId = question.questionId || question.id;
              return (
                <tr key={question.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className={`py-3 px-4 text-center font-mono text-xs font-semibold shrink-0 ${difficultyNumberColor(question.difficulty || '')}`} title={`Question ID: ${questionId} • Difficulty: ${question.difficulty || 'Unknown'}`}>{questionId}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white min-w-[200px] text-sm"><Link to={getQuestionPath(question)} className="inline-block leading-snug transition-colors hover:text-blue-600 dark:hover:text-blue-400">{question.title}</Link></td>
                  <td className="py-3 px-4"><PlatformBadge question={question} logoUrl={question.platformLogoUrl} /></td>
                  <td className="py-3 px-4 whitespace-nowrap">{question.companies.length ? <div className="flex items-center gap-1.5 flex-nowrap" title={question.companies.length > 2 ? `Companies: ${question.companies.join(', ')}` : undefined}>{question.companies.slice(0, 2).map((name, index) => { const company = question.companyDetails?.find((item) => item.name.toLowerCase().trim() === name.toLowerCase().trim()) || companyMap.get(name.toLowerCase().trim()); return <CompanyCircleBadge key={`${name}-${index}`} name={name} logo={company?.logo} website={company?.website} />; })}</div> : <span className="text-slate-400 text-xs">—</span>}</td>
                  <td className="py-3 px-2 text-center">{onBookmark && <button type="button" onClick={(event) => onBookmark(question, event)} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark problem'} className={`rounded-md p-1 transition-colors ${bookmarked ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><i className={`fa-${bookmarked ? 'solid' : 'regular'} fa-bookmark text-xs`} /></button>}</td>
                  <td className="py-3 px-4 text-right">{solved ? <Link to={getQuestionPath(question)} className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-1 text-xs font-bold text-emerald-600 no-underline shadow-2xs transition-colors hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50"><span>Solved</span></Link> : <Link to={getQuestionPath(question)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1 text-xs font-bold text-blue-600 no-underline shadow-2xs transition-colors hover:bg-blue-50 dark:border-blue-800/60 dark:text-blue-400 dark:hover:bg-blue-950/50"><span>Solve</span><i className="fa-solid fa-arrow-right text-[9px]" /></Link>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
