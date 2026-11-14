import React, { useMemo } from 'react';
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
  renderTitle?: (question: T) => React.ReactNode;
  renderAction?: (question: T) => React.ReactNode;
}

const difficultyNumberColor = (difficulty: string): string => {
  const normalized = difficulty.toLowerCase().trim();
  if (normalized.includes('easy')) return 'text-emerald-600 dark:text-emerald-400 font-bold';
  if (normalized.includes('medium')) return 'text-amber-500 dark:text-orange-400 font-bold';
  if (normalized.includes('hard')) return 'text-rose-600 dark:text-rose-400 font-bold';
  if (normalized.includes('basic') || normalized.includes('school')) return 'text-sky-500 dark:text-sky-400 font-bold';
  return 'text-slate-500 dark:text-slate-400 font-bold';
};

const normalizePlatform = (raw?: string | null): { name: string; website?: string } | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed || lower === 'unspecified' || lower === 'none' || lower === 'null') return null;

  if (lower.includes('leetcode')) {
    return { name: 'LeetCode', website: 'https://leetcode.com' };
  }
  if (lower.includes('hackerrank')) {
    return { name: 'HackerRank', website: 'https://hackerrank.com' };
  }
  if (lower.includes('geeks') || lower.includes('gfg')) {
    return { name: 'GeeksforGeeks', website: 'https://geeksforgeeks.org' };
  }
  if (lower.includes('codechef')) {
    return { name: 'CodeChef', website: 'https://codechef.com' };
  }
  if (lower.includes('tcs') || lower.includes('ion')) {
    return { name: 'TCS iON', website: 'https://learning.tcsionhub.in' };
  }
  if (lower.includes('aon')) {
    return { name: 'AON', website: 'https://assessment.aon.com' };
  }
  if (lower.includes('mettl')) {
    return { name: 'Mettl', website: 'https://mettl.com' };
  }
  if (lower.includes('connect')) {
    return { name: 'Connect 2 Code', website: 'https://connect2code.in' };
  }

  return { name: trimmed };
};

export const PlatformCircleBadge: React.FC<{ question: CodingQuestionListItem; logoUrl?: string | null }> = ({ question, logoUrl }) => {
  const raw =
    question.questionPlatform ||
    question.qpfRefName ||
    question.examPlatform ||
    question.platformName ||
    question.qpfRefCode;

  const platform = normalizePlatform(raw);
  if (!platform) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  const safeLogoUrl =
    getSafeRemoteImageUrl(logoUrl) ||
    getSafeRemoteImageUrl(question.platformLogoUrl) ||
    undefined;

  return (
    <div className="flex items-center gap-1.5 flex-nowrap" title={`Platform: ${platform.name}`}>
      <CompanyCircleBadge
        name={platform.name}
        logo={safeLogoUrl}
        website={platform.website}
      />
    </div>
  );
};

export const PlatformBadge = PlatformCircleBadge;

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
  renderTitle,
  renderAction,
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
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white min-w-[200px] text-sm">{renderTitle ? renderTitle(question) : <Link to={getQuestionPath(question)} className="inline-block leading-snug transition-colors hover:text-blue-600 dark:hover:text-blue-400">{question.title}</Link>}</td>
                  <td className="py-3 px-4 whitespace-nowrap"><PlatformCircleBadge question={question} logoUrl={question.platformLogoUrl} /></td>
                  <td className="py-3 px-4 whitespace-nowrap">{question.companies.length ? <div className="flex items-center gap-1.5 flex-nowrap" title={question.companies.length > 2 ? `Companies: ${question.companies.join(', ')}` : undefined}>{question.companies.slice(0, 2).map((name, index) => { const company = question.companyDetails?.find((item) => item.name.toLowerCase().trim() === name.toLowerCase().trim()) || companyMap.get(name.toLowerCase().trim()); return <CompanyCircleBadge key={`${name}-${index}`} name={name} logo={company?.logo} website={company?.website} />; })}</div> : <span className="text-slate-400 text-xs">—</span>}</td>
                  <td className="py-3 px-2 text-center">{onBookmark && <button type="button" onClick={(event) => onBookmark(question, event)} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark problem'} className={`rounded-md p-1 transition-colors ${bookmarked ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><i className={`fa-${bookmarked ? 'solid' : 'regular'} fa-bookmark text-xs`} /></button>}</td>
                  <td className="py-3 px-4 text-right">{renderAction ? renderAction(question) : solved ? <Link to={getQuestionPath(question)} className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-1 text-xs font-bold text-emerald-600 no-underline shadow-2xs transition-colors hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50"><span>Solved</span></Link> : <Link to={getQuestionPath(question)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1 text-xs font-bold text-blue-600 no-underline shadow-2xs transition-colors hover:bg-blue-50 dark:border-blue-800/60 dark:text-blue-400 dark:hover:bg-blue-950/50"><span>Solve</span><i className="fa-solid fa-arrow-right text-[9px]" /></Link>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
