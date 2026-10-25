import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Circle,
  Code2,
  Layers3,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { getActionableErrorMessage } from '../../../core/validation/serverErrorMapper';
import { learningSheetService } from '../../../services/learningSheetService';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import type { DsaSheet, DsaSheetQuestionLink, DsaSheetSection } from '../types';

const difficultyVariant = (difficulty: string): 'easy' | 'medium' | 'hard' | 'neutral' => {
  const normalized = difficulty.toLowerCase();
  if (normalized === 'basic' || normalized === 'easy') return 'easy';
  if (normalized === 'medium') return 'medium';
  if (normalized === 'hard') return 'hard';
  return 'neutral';
};

export const DsaSheetPage: React.FC = () => {
  const solvedByProblemId = useAppSelector((state) => state.progress.solvedByProblemId);
  const [sheets, setSheets] = useState<DsaSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [sections, setSections] = useState<DsaSheetSection[]>([]);
  const [expandedSectionId, setExpandedSectionId] = useState<number | null>(null);
  const [questionsBySection, setQuestionsBySection] = useState<Record<number, DsaSheetQuestionLink[]>>({});
  const [loadingSheets, setLoadingSheets] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingQuestionSectionId, setLoadingQuestionSectionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadSheets = useCallback(async (signal?: AbortSignal) => {
    setLoadingSheets(true);
    setError(null);
    try {
      const result = await learningSheetService.getSheets(signal);
      const activeSheets = result.filter((sheet) => sheet.isActive);
      setSheets(activeSheets);
      setSelectedSheetId((current) =>
        current && activeSheets.some((sheet) => sheet.id === current)
          ? current
          : activeSheets[0]?.id ?? null
      );
    } catch (requestError) {
      if (!signal?.aborted) setError(getActionableErrorMessage(requestError, 'Unable to load DSA sheets.'));
    } finally {
      if (!signal?.aborted) setLoadingSheets(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSheets(controller.signal);
    return () => controller.abort();
  }, [loadSheets]);

  const loadSections = useCallback(async (sheetId: number, signal?: AbortSignal) => {
    setLoadingSections(true);
    setError(null);
    setExpandedSectionId(null);
    setQuestionsBySection({});
    try {
      const result = await learningSheetService.getSections(sheetId, signal);
      const activeSections = result.filter((section) => section.isActive);
      setSections(activeSections);
      setExpandedSectionId(activeSections[0]?.id ?? null);
    } catch (requestError) {
      if (!signal?.aborted) {
        setError(getActionableErrorMessage(requestError, 'Unable to load DSA sheet sections.'));
      }
    } finally {
      if (!signal?.aborted) setLoadingSections(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSheetId) {
      setSections([]);
      return;
    }
    const controller = new AbortController();
    void loadSections(selectedSheetId, controller.signal);
    return () => controller.abort();
  }, [loadSections, selectedSheetId]);

  const retryCurrentView = useCallback(() => {
    if (!selectedSheetId) {
      void loadSheets();
      return;
    }
    if (expandedSectionId && sections.length > 0) {
      setQuestionsBySection((current) => {
        const next = { ...current };
        delete next[expandedSectionId];
        return next;
      });
      return;
    }
    void loadSections(selectedSheetId);
  }, [expandedSectionId, loadSections, loadSheets, sections.length, selectedSheetId]);

  const loadQuestions = useCallback(async (sectionId: number) => {
    setLoadingQuestionSectionId(sectionId);
    setError(null);
    try {
      const result = await learningSheetService.getSectionQuestions(sectionId);
      setQuestionsBySection((current) => ({
        ...current,
        [sectionId]: result.filter((link) => link.isActive && link.question.isActive),
      }));
    } catch (requestError) {
      setError(getActionableErrorMessage(requestError, 'Unable to load section questions.'));
    } finally {
      setLoadingQuestionSectionId((current) => (current === sectionId ? null : current));
    }
  }, []);

  useEffect(() => {
    if (expandedSectionId && questionsBySection[expandedSectionId] === undefined) {
      void loadQuestions(expandedSectionId);
    }
  }, [expandedSectionId, loadQuestions, questionsBySection]);

  const selectedSheet = sheets.find((sheet) => sheet.id === selectedSheetId) ?? null;
  const visibleQuestionCount = useMemo(
    () => Object.values(questionsBySection).reduce((total, questions) => total + questions.length, 0),
    [questionsBySection]
  );
  const solvedVisibleCount = useMemo(
    () =>
      Object.values(questionsBySection).reduce(
        (total, questions) =>
          total + questions.filter((link) => Boolean(solvedByProblemId[String(link.question.id)])).length,
        0
      ),
    [questionsBySection, solvedByProblemId]
  );
  const normalizedSearch = search.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans">
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0A1020]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.12),transparent_40%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800/70 bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Structured DSA preparation
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              DSA Sheet
            </h1>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
              Follow a focused, section-by-section path and solve the most useful coding problems in the right order.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
            {[
              { label: 'Sections', value: sections.length, icon: Layers3 },
              { label: 'Loaded problems', value: visibleQuestionCount, icon: Code2 },
              { label: 'Solved', value: solvedVisibleCount, icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/70 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 backdrop-blur px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" /> {label}
                </div>
                <p className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {loadingSheets ? (
          <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
        ) : sheets.length === 0 ? (
          <EmptyState icon={<BookOpenCheck className="w-8 h-8" />} title="No active DSA sheet yet" description="The preparation sheet is being curated. Please check back soon." actionText="Try again" onAction={() => void loadSheets()} />
        ) : (
          <>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
              <div>
                <label htmlFor="dsa-sheet-selector" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Learning path</label>
                <select
                  id="dsa-sheet-selector"
                  value={selectedSheetId ?? ''}
                  onChange={(event) => setSelectedSheetId(Number(event.target.value))}
                  className="min-w-72 max-w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1322] px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sheets.map((sheet) => <option key={sheet.id} value={sheet.id}>{sheet.sheetName}</option>)}
                </select>
                {selectedSheet && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{selectedSheet.description}</p>}
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search loaded questions"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1322] pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                <span>{error}</span>
                <Button size="sm" variant="ghost" onClick={retryCurrentView} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Retry</Button>
              </div>
            )}

            {loadingSections ? (
              <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
            ) : sections.length === 0 ? (
              <EmptyState title="No sections published" description="This DSA sheet does not have any active sections yet." />
            ) : (
              <div className="space-y-4">
                {sections.map((section, sectionIndex) => {
                  const isExpanded = expandedSectionId === section.id;
                  const questions = questionsBySection[section.id] ?? [];
                  const filteredQuestions = normalizedSearch
                    ? questions.filter(({ question }) => [question.title, question.topicName, question.difficultyName, ...question.companies].some((value) => value.toLowerCase().includes(normalizedSearch)))
                    : questions;
                  const solvedCount = questions.filter(({ question }) => Boolean(solvedByProblemId[String(question.id)])).length;
                  return (
                    <section key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] shadow-sm">
                      <button
                        type="button"
                        onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                        aria-expanded={isExpanded}
                        className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-extrabold">{String(sectionIndex + 1).padStart(2, '0')}</span>
                          <div className="min-w-0">
                            <h2 className="font-bold text-slate-950 dark:text-white truncate">{section.sectionName}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{questions.length ? `${solvedCount} of ${questions.length} solved` : 'Open to load problems'}</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-200 dark:border-slate-800">
                          {loadingQuestionSectionId === section.id ? (
                            <div className="p-5 space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
                          ) : filteredQuestions.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">{normalizedSearch && questions.length ? 'No loaded questions match your search.' : 'No active questions are linked to this section.'}</div>
                          ) : (
                            <ol className="divide-y divide-slate-100 dark:divide-slate-800/80">
                              {filteredQuestions.map((link, questionIndex) => {
                                const solved = Boolean(solvedByProblemId[String(link.question.id)]);
                                return (
                                  <li key={link.id}>
                                    <Link to={`/problems/${link.question.id}`} className="group flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                      <div className="pt-0.5 text-slate-400">{solved ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}</div>
                                      <span className="w-7 pt-0.5 text-xs font-mono font-bold text-slate-400">{String(questionIndex + 1).padStart(2, '0')}</span>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{link.question.title}</h3>
                                          <Badge size="sm" variant={difficultyVariant(link.question.difficultyName)}>{link.question.difficultyName}</Badge>
                                          <Badge size="sm">{link.question.topicName}</Badge>
                                        </div>
                                        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{link.question.description}</p>
                                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                                          {link.question.questionPlatform && <span>{link.question.questionPlatform}</span>}
                                          {link.question.companies.slice(0, 3).map((company) => <span key={company}>• {company}</span>)}
                                        </div>
                                      </div>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DsaSheetPage;
