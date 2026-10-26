import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Lock,
  Search,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { openAuthModal } from '../../auth/redux/authSlice';
import { DsaSheetHeroBanner } from '../components/DsaSheetHeroBanner';
import {
  fetchDsaSections,
  fetchDsaSheets,
  fetchSectionQuestions,
  selectSheet,
  toggleSection,
} from '../redux/dsaSheetSlice';
import type { DsaSheet } from '../types';

const difficultyVariant = (difficulty: string): 'easy' | 'medium' | 'hard' | 'neutral' => {
  const normalized = difficulty.toLowerCase();
  if (normalized === 'basic' || normalized === 'easy') return 'easy';
  if (normalized === 'medium') return 'medium';
  if (normalized === 'hard') return 'hard';
  return 'neutral';
};

export const DsaSheetPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading: authLoading } = useAppSelector((state) => state.auth);
  const solvedByProblemId = useAppSelector((state) => state.progress.solvedByProblemId);
  const {
    sheets,
    selectedSheetId,
    sections,
    expandedSectionId,
    questionsBySection,
    loadingSheets,
    loadingSections,
    loadingQuestionSectionId,
    sheetError,
    sectionsError,
    questionErrors,
  } = useAppSelector((state) => state.dsaSheet);

  const [search, setSearch] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const promise = dispatch(fetchDsaSheets());
      return () => {
        promise.abort();
      };
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (selectedSheetId) {
      const promise = dispatch(fetchDsaSections({ sheetId: selectedSheetId }));
      return () => {
        promise.abort();
      };
    }
  }, [dispatch, selectedSheetId]);

  useEffect(() => {
    if (expandedSectionId && questionsBySection[expandedSectionId] === undefined) {
      const promise = dispatch(fetchSectionQuestions({ sectionId: expandedSectionId }));
      return () => {
        promise.abort();
      };
    }
  }, [dispatch, expandedSectionId, questionsBySection]);

  // Group sheets into pairs so exactly two sheet options are displayed at a time
  const sheetSlides = useMemo<DsaSheet[][]>(() => {
    if (sheets.length <= 2) {
      return sheets.length > 0 ? [sheets] : [];
    }
    // For 3 sheets, sliding window pairs ensure 2 options are always visible on each transition
    if (sheets.length === 3) {
      return [
        [sheets[0], sheets[1]],
        [sheets[1], sheets[2]],
        [sheets[2], sheets[0]],
      ];
    }
    const result: DsaSheet[][] = [];
    for (let i = 0; i < sheets.length; i += 2) {
      const chunk = sheets.slice(i, i + 2);
      if (chunk.length === 1 && sheets.length > 1) {
        chunk.push(sheets[0]);
      }
      result.push(chunk);
    }
    return result;
  }, [sheets]);

  // Keep activeSlide within bounds if sheets change
  useEffect(() => {
    if (activeSlide >= sheetSlides.length && sheetSlides.length > 0) {
      setActiveSlide(0);
    }
  }, [activeSlide, sheetSlides.length]);

  // Automatic right-to-left slide transition (2.6s interval, paused on hover)
  useEffect(() => {
    if (sheetSlides.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sheetSlides.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [isHovered, sheetSlides.length]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? sheetSlides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % sheetSlides.length);
  };

  const selectedSheet = sheets.find((sheet) => sheet.id === selectedSheetId) ?? null;
  const normalizedSearch = search.trim().toLowerCase();

  return (
    <div className="relative w-full flex flex-col items-center bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-x-hidden min-h-screen pb-20">
      {/* Ambient glowing blobs matching Practice page */}
      <div className="hidden dark:block fixed top-20 -left-48 w-96 h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="hidden dark:block fixed top-[45%] -right-48 w-[450px] h-[550px] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="hidden dark:block fixed bottom-20 -left-40 w-96 h-[500px] bg-purple-900/20 rounded-full blur-[130px] pointer-events-none -z-10" />

      <DsaSheetHeroBanner />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {authLoading || (loadingSheets && isAuthenticated) ? (
          <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
        ) : !isAuthenticated && sheets.length === 0 ? (
          <div className="my-12">
            <EmptyState
              title="Sign in to explore DSA Sheet"
              description="Log in with your Connect 2 Code account to browse curated DSA learning sheets, track your progress, and practice problems."
              actionText="Sign In"
              onAction={() => dispatch(openAuthModal({ mode: 'login' }))}
              icon={<Lock className="w-12 h-12 text-blue-500" />}
            />
          </div>
        ) : sheetError && sheets.length === 0 ? (
          <EmptyState icon={<BookOpenCheck className="w-8 h-8" />} title="Unable to load DSA sheets" description={sheetError} actionText="Retry" onAction={() => void dispatch(fetchDsaSheets({ force: true }))} />
        ) : sheets.length === 0 ? (
          <EmptyState icon={<BookOpenCheck className="w-8 h-8" />} title="No active DSA sheet yet" description="The preparation sheet is being curated. Please check back soon." actionText="Try again" onAction={() => void dispatch(fetchDsaSheets({ force: true }))} />
        ) : (
          <>
            {/* Centered DSA Sheet Selector Carousel (Animates right-to-left, showing two sheets at a time) */}
            <div className="w-full flex flex-col items-center justify-center mb-8">
              <div
                className="relative flex items-center justify-center gap-2 sm:gap-3 w-full max-w-2xl mx-auto"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Left Arrow Button */}
                {sheetSlides.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:scale-105 transition-all z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="Previous sheet slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                {/* Carousel Viewport: Smooth Right-to-Left Slide Transition */}
                <div
                  aria-label="DSA sheets"
                  role="group"
                  className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5 dark:border-slate-800 dark:bg-slate-900/70 shadow-xs"
                >
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                  >
                    {sheetSlides.map((slide, slideIdx) => (
                      <div
                        key={slideIdx}
                        className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-2"
                      >
                        {slide.map((sheet, itemIdx) => {
                          const isSelected = sheet.id === selectedSheetId;
                          return (
                            <button
                              key={`${slideIdx}-${sheet.id}-${itemIdx}`}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => {
                                if (sheet.id === selectedSheetId) return;
                                dispatch(selectSheet(sheet.id));
                              }}
                              className={`min-w-0 rounded-xl px-4 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0D1322] ${
                                isSelected
                                  ? 'bg-white text-slate-950 shadow-sm dark:bg-[#0D1322] dark:text-white ring-1 ring-slate-900/5 dark:ring-white/10'
                                  : 'text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'
                              }`}
                            >
                              <span className="block truncate text-sm font-bold">{sheet.sheetName}</span>
                              {sheet.sheetCode && (
                                <span className="mt-0.5 block truncate text-xs font-medium text-slate-400 dark:text-slate-500">
                                  {sheet.sheetCode}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Arrow Button */}
                {sheetSlides.length > 1 && (
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:scale-105 transition-all z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="Next sheet slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Slider Indicators / Dots */}
              {sheetSlides.length > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-3">
                  {sheetSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        activeSlide === idx
                          ? 'w-5 bg-blue-600 dark:bg-sky-400'
                          : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Selected Sheet Description */}
              {selectedSheet?.description && (
                <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto px-4">
                  {selectedSheet.description}
                </p>
              )}
            </div>

            {/* Overview & Search Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {sections.length > 0 && (
                  <span>
                    {sections.length} {sections.length === 1 ? 'Section' : 'Sections'} Available
                  </span>
                )}
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search loaded questions"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1322] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {sectionsError && (
              <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                <span>{sectionsError}</span>
                <Button size="sm" variant="ghost" onClick={() => selectedSheetId && void dispatch(fetchDsaSections({ sheetId: selectedSheetId, force: true }))}>Retry</Button>
              </div>
            )}

            {loadingSections ? (
              <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
            ) : sectionsError && sections.length === 0 ? null : sections.length === 0 ? (
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
                        onClick={() => {
                          dispatch(toggleSection(section.id));
                        }}
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
                          ) : questionErrors[section.id] ? (
                            <div role="alert" className="flex flex-col items-center gap-3 px-5 py-8 text-center text-sm text-rose-600 dark:text-rose-300">
                              <span>{questionErrors[section.id]}</span>
                              <Button size="sm" variant="outline" onClick={() => void dispatch(fetchSectionQuestions({ sectionId: section.id, force: true }))}>Retry</Button>
                            </div>
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
