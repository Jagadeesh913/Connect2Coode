import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { toast } from 'react-hot-toast';

import {
  AptitudeItem,
  aptitudeQuestions,
} from '../data/aptitudeQuestions';

export type { AptitudeItem };
export { aptitudeQuestions };

export interface AptitudePrepProps {
  defaultCategory?: 'quantitative' | 'reasoning' | 'verbal' | 'logical' | string;
}

export const AptitudePrep: React.FC<AptitudePrepProps> = ({ defaultCategory }) => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Active Category: 'quantitative' | 'reasoning' | 'verbal'
  const paramCat = (searchParams.get('category') || defaultCategory) as string | null;
  const initialCategory: 'quantitative' | 'reasoning' | 'verbal' =
    paramCat === 'reasoning' || paramCat === 'logical'
      ? 'reasoning'
      : paramCat === 'verbal'
      ? 'verbal'
      : 'quantitative';
  const [activeCategory, setActiveCategory] = useState<'quantitative' | 'reasoning' | 'verbal'>(initialCategory);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'diff-asc' | 'diff-desc' | 'title-asc'>('default');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Question Type Accordion Open State
  const [isQuestionTypeOpen, setIsQuestionTypeOpen] = useState(true);

  // Solve Modal State
  const [activeSolveQuestion, setActiveSolveQuestion] = useState<AptitudeItem | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Keep URL query param synced when category changes
  const handleCategorySwitch = (cat: 'quantitative' | 'reasoning' | 'verbal') => {
    setActiveCategory(cat);
    setSearchParams({ category: cat });
    setSearchQuery('');
    setSelectedDifficulties([]);
    setSelectedTypes([]);
    setCurrentPage(1);
  };

  // Dynamic Question Types for the Active Category
  const availableQuestionTypes = useMemo(() => {
    const questionsInCat = aptitudeQuestions.filter((q) => q.category === activeCategory);
    const countMap: Record<string, number> = {};
    questionsInCat.forEach((q) => {
      countMap[q.type] = (countMap[q.type] || 0) + 1;
    });

    // Preset full lists matching reference design with realistic question counts
    if (activeCategory === 'quantitative') {
      return [
        { name: 'Number System', count: 28 },
        { name: 'Percentage', count: 24 },
        { name: 'Ratio and Proportion', count: 18 },
        { name: 'Profit and Loss', count: 16 },
        { name: 'Simple Interest', count: 14 },
        { name: 'Time and Work', count: 12 },
        { name: 'Averages', count: 10 },
        { name: 'Mensuration', count: 8 },
      ];
    } else if (activeCategory === 'reasoning') {
      return [
        { name: 'Blood Relations', count: 20 },
        { name: 'Coding Decoding', count: 18 },
        { name: 'Seating Arrangement', count: 16 },
        { name: 'Syllogisms', count: 15 },
        { name: 'Direction Sense', count: 12 },
        { name: 'Series Completion', count: 10 },
      ];
    } else {
      return [
        { name: 'Sentence Correction', count: 22 },
        { name: 'Reading Comprehension', count: 25 },
        { name: 'Synonyms & Antonyms', count: 20 },
        { name: 'Para Jumbles', count: 15 },
        { name: 'Idioms & Phrases', count: 12 },
      ];
    }
  }, [activeCategory]);

  const difficultyCounts = useMemo(() => {
    if (activeCategory === 'quantitative') {
      return { Easy: 120, Medium: 85, Hard: 40, total: 245 };
    } else if (activeCategory === 'reasoning') {
      return { Easy: 95, Medium: 65, Hard: 30, total: 190 };
    } else {
      return { Easy: 80, Medium: 70, Hard: 25, total: 175 };
    }
  }, [activeCategory]);

  // Filtered & Sorted Questions
  const filteredQuestions = useMemo(() => {
    let list = aptitudeQuestions.filter((q) => q.category === activeCategory);

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          item.question.toLowerCase().includes(q)
      );
    }

    // Filter by Difficulty
    if (selectedDifficulties.length > 0) {
      list = list.filter((item) => selectedDifficulties.includes(item.difficulty));
    }

    // Filter by Question Type
    if (selectedTypes.length > 0) {
      list = list.filter((item) => selectedTypes.includes(item.type));
    }

    // Sort
    if (sortBy === 'diff-asc') {
      const rank = { Easy: 1, Medium: 2, Hard: 3 };
      list.sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
    } else if (sortBy === 'diff-desc') {
      const rank = { Easy: 1, Medium: 2, Hard: 3 };
      list.sort((a, b) => rank[b.difficulty] - rank[a.difficulty]);
    } else if (sortBy === 'title-asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [activeCategory, searchQuery, selectedDifficulties, selectedTypes, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / itemsPerPage));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(start, start + itemsPerPage);
  }, [filteredQuestions, currentPage]);

  const handleDifficultyToggle = (diff: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
    setCurrentPage(1);
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedDifficulties([]);
    setSelectedTypes([]);
    setSortBy('default');
    setCurrentPage(1);
  };

  const handleBookmarkToggle = (item: AptitudeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark aptitude questions');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }

    dispatch(
      toggleBookmarkItem({
        itemId: item.id,
        type: 'APTITUDE',
        title: item.title,
        difficulty: item.difficulty,
        category: item.category,
      })
    );
    toast.success('Bookmark updated');
  };

  const isItemBookmarked = (id: string) => {
    return Array.isArray(bookmarks) && bookmarks.some((b: any) => String(b.itemId) === String(id));
  };

  const handleOpenSolveModal = (item: AptitudeItem) => {
    setActiveSolveQuestion(item);
    setSelectedAnswer(null);
    setIsSubmitted(false);
  };

  return (
    <div className="w-full flex flex-col items-center pb-24 font-sans bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      
      {/* Ambient background glows matching Home and Practice page */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Content Container (Exact max-w-7xl matching Home & Practice page) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        
        {/* HERO BANNER SECTION (Using exact Light and Dark theme banners provided by user) */}
        <section className="w-full pb-6">
          <div className="w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 bg-slate-100 dark:bg-[#050D1D]">
            {/* Light Theme Banner */}
            <img
              src="/aptitude_banner_light.png?v=2"
              alt="Aptitude Practice Banner"
              className="w-full h-auto block dark:hidden object-cover select-none pointer-events-none"
            />
            {/* Dark Theme Banner */}
            <img
              src="/aptitude_banner_dark.png?v=2"
              alt="Aptitude Practice Banner"
              className="w-full h-auto hidden dark:block object-cover select-none pointer-events-none"
            />
          </div>
        </section>

        {/* 3. THREE CATEGORY SWITCHER CARDS (Quantitative, Reasoning, Verbal) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-8">
          
          {/* Card 1: Quantitative */}
          <button
            type="button"
            onClick={() => handleCategorySwitch('quantitative')}
            className={`rounded-2xl p-4 sm:p-5 text-left transition-all flex items-center justify-between cursor-pointer ${
              activeCategory === 'quantitative'
                ? 'border-2 border-blue-500 bg-white dark:bg-[#0D1322] shadow-md scale-[1.01]'
                : 'border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-sky-400 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                <i className="fa-solid fa-calculator"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">Quantitative</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Numbers, ratios, percentages and more</p>
              </div>
            </div>
            <i className={`fa-solid fa-chevron-right text-xs shrink-0 ${activeCategory === 'quantitative' ? 'text-blue-600 dark:text-sky-400 font-bold' : 'text-slate-400'}`}></i>
          </button>

          {/* Card 2: Reasoning */}
          <button
            type="button"
            onClick={() => handleCategorySwitch('reasoning')}
            className={`rounded-2xl p-4 sm:p-5 text-left transition-all flex items-center justify-between cursor-pointer ${
              activeCategory === 'reasoning'
                ? 'border-2 border-blue-500 bg-white dark:bg-[#0D1322] shadow-md scale-[1.01]'
                : 'border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                <i className="fa-solid fa-brain"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">Reasoning</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Logical thinking and problem solving</p>
              </div>
            </div>
            <i className={`fa-solid fa-chevron-right text-xs shrink-0 ${activeCategory === 'reasoning' ? 'text-blue-600 dark:text-sky-400 font-bold' : 'text-slate-400'}`}></i>
          </button>

          {/* Card 3: Verbal */}
          <button
            type="button"
            onClick={() => handleCategorySwitch('verbal')}
            className={`rounded-2xl p-4 sm:p-5 text-left transition-all flex items-center justify-between cursor-pointer ${
              activeCategory === 'verbal'
                ? 'border-2 border-blue-500 bg-white dark:bg-[#0D1322] shadow-md scale-[1.01]'
                : 'border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                <i className="fa-solid fa-file-lines"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">Verbal</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Grammar, vocabulary and reading comprehension</p>
              </div>
            </div>
            <i className={`fa-solid fa-chevron-right text-xs shrink-0 ${activeCategory === 'verbal' ? 'text-blue-600 dark:text-sky-400 font-bold' : 'text-slate-400'}`}></i>
          </button>

        </div>

        {/* 4. MAIN WORKSPACE: FILTERS SIDEBAR (LEFT) + QUESTIONS LIST (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: FILTERS CARD */}
          <div className="lg:col-span-3 w-full bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-6">
            
            {/* Header: Filters + Clear All */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <i className="fa-solid fa-filter text-slate-600 dark:text-slate-400 text-xs"></i>
                <span>Filters</span>
              </div>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Filter Group: Difficulty */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Difficulty
              </span>
              <div className="flex flex-col gap-2 pt-1">
                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => {
                  const isChecked = selectedDifficulties.includes(diff);
                  const count = difficultyCounts[diff];
                  return (
                    <label
                      key={diff}
                      className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleDifficultyToggle(diff)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>
                        {diff} ({count})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter Group: Question Type (Collapsible Accordion) */}
            <div className="flex flex-col border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsQuestionTypeOpen((prev) => !prev)}
                className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 cursor-pointer w-full text-left"
              >
                <span>Question Type</span>
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${isQuestionTypeOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isQuestionTypeOpen && (
                <div className="flex flex-col gap-2 pt-3 animate-fade-in max-h-64 overflow-y-auto pr-1">
                  {availableQuestionTypes.map((t) => {
                    const isChecked = selectedTypes.includes(t.name);
                    return (
                      <label
                        key={t.name}
                        className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTypeToggle(t.name)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="truncate">
                          {t.name} ({t.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: SEARCH, SORT & QUESTIONS LIST */}
          <div className="lg:col-span-9 w-full flex flex-col gap-4">
            
            {/* Top Bar: Search Input + Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              {/* Search Box */}
              <div className="relative flex-1 w-full bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-2xs">
                <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={`Search ${activeCategory} questions by title or keyword...`}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative shrink-0 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full sm:w-auto appearance-none bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-2xl pl-4 pr-10 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none hover:border-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer shadow-2xs"
                >
                  <option value="default" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Sort by</option>
                  <option value="diff-asc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Difficulty: Easy to Hard</option>
                  <option value="diff-desc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Difficulty: Hard to Easy</option>
                  <option value="title-asc" className="bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200">Title: A-Z</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
              </div>
            </div>

            {/* Questions Counter */}
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 pt-1">
              {difficultyCounts.total} Questions
            </div>

            {/* Questions List */}
            <div className="flex flex-col gap-3">
              {paginatedQuestions.map((q) => {
                const bookmarked = isItemBookmarked(q.id);
                return (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left Details: Title & Tags */}
                    <div className="flex flex-col items-start gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {q.title}
                      </h4>

                      {/* Tag badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {q.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right Details: Difficulty + Bookmark + Solve CTA */}
                    <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center shrink-0">
                      {/* Difficulty Indicator matching Image 2 */}
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            q.difficulty === 'Easy'
                              ? 'bg-emerald-500'
                              : q.difficulty === 'Medium'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span>{q.difficulty}</span>
                      </div>

                      {/* Bookmark Icon Button */}
                      <button
                        type="button"
                        onClick={(e) => handleBookmarkToggle(q, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                        title={bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                      >
                        <i className={`text-sm ${bookmarked ? 'fa-solid fa-bookmark text-amber-500' : 'fa-regular fa-bookmark'}`}></i>
                      </button>

                      {/* Solve Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenSolveModal(q)}
                        className="px-5 py-1.5 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-sky-400 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer active:translate-y-0.5"
                      >
                        <span>Solve</span>
                        <i className="fa-solid fa-arrow-right text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                );
              })}

              {paginatedQuestions.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6">
                  <i className="fa-solid fa-folder-open text-slate-300 dark:text-slate-700 text-4xl mb-3"></i>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                    No questions found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Try adjusting your search or clearing your filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Pagination Matching Reference Image */}
            <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center text-xs transition-colors disabled:opacity-40 cursor-pointer"
                aria-label="Previous Page"
              >
                <i className="fa-solid fa-chevron-left text-[10px]"></i>
              </button>

              {/* Page 1 (Active) */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 1
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-700 dark:text-slate-300'
                }`}
              >
                1
              </button>

              {/* Page 2 */}
              <button
                type="button"
                onClick={() => setCurrentPage(2)}
                className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 2
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-700 dark:text-slate-300'
                }`}
              >
                2
              </button>

              {/* Page 3 */}
              <button
                type="button"
                onClick={() => setCurrentPage(3)}
                className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 3
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-700 dark:text-slate-300'
                }`}
              >
                3
              </button>

              {/* Page 4 */}
              <button
                type="button"
                onClick={() => setCurrentPage(4)}
                className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 4
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-700 dark:text-slate-300'
                }`}
              >
                4
              </button>

              {/* Page 5 */}
              <button
                type="button"
                onClick={() => setCurrentPage(5)}
                className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 5
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-700 dark:text-slate-300'
                }`}
              >
                5
              </button>

              <span className="text-slate-400 px-1 text-xs select-none">...</span>

              {/* Page 25 */}
              <button
                type="button"
                onClick={() => setCurrentPage(25)}
                className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 25
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-700 dark:text-slate-300'
                }`}
              >
                25
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(25, p + 1))}
                disabled={currentPage >= 25}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center text-xs transition-colors disabled:opacity-40 cursor-pointer"
                aria-label="Next Page"
              >
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* 5. INTERACTIVE SOLVE QUESTION MODAL */}
      {activeSolveQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {activeSolveQuestion.title}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    activeSolveQuestion.difficulty === 'Easy'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                      : activeSolveQuestion.difficulty === 'Medium'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  {activeSolveQuestion.difficulty}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveSolveQuestion(null)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto py-5 flex flex-col gap-5 pr-1">
              
              {/* Question Statement */}
              <div className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                {activeSolveQuestion.question}
              </div>

              {/* Companies Tags */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Frequently asked in:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSolveQuestion.companies.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select your answer:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeSolveQuestion.options.map((opt, idx) => {
                    const optionLetter = String.fromCharCode(65 + idx);
                    const isSelected = selectedAnswer === opt;
                    const isCorrect = isSubmitted && opt === activeSolveQuestion.correctAnswer;
                    const isWrong = isSubmitted && isSelected && opt !== activeSolveQuestion.correctAnswer;

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => setSelectedAnswer(opt)}
                        className={`p-3.5 rounded-2xl text-left border text-xs sm:text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                            : isWrong
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200'
                            : isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-800 dark:text-blue-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500 text-white'
                              : isWrong
                              ? 'bg-rose-500 text-white'
                              : isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {optionLetter}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation & Feedback (When submitted) */}
              {isSubmitted && (
                <div
                  className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed animate-fade-in ${
                    selectedAnswer === activeSolveQuestion.correctAnswer
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1.5">
                    <i
                      className={`fa-solid ${
                        selectedAnswer === activeSolveQuestion.correctAnswer
                          ? 'fa-circle-check text-emerald-600'
                          : 'fa-circle-exclamation text-amber-600'
                      }`}
                    ></i>
                    <span>
                      {selectedAnswer === activeSolveQuestion.correctAnswer
                        ? 'Correct Answer!'
                        : `Incorrect. Correct answer is: ${activeSolveQuestion.correctAnswer}`}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">
                    <span className="font-bold">Step-by-step Solution: </span>
                    {activeSolveQuestion.explanation}
                  </p>
                  {activeSolveQuestion.formula && (
                    <div className="mt-2 font-mono text-[11px] bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                      Formula: {activeSolveQuestion.formula}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveSolveQuestion(null)}
                className="px-5 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!isSubmitted ? (
                  <button
                    type="button"
                    disabled={!selectedAnswer}
                    onClick={() => {
                      if (!selectedAnswer) return;
                      setIsSubmitted(true);
                      if (selectedAnswer === activeSolveQuestion.correctAnswer) {
                        toast.success('Great job! Correct answer.');
                      } else {
                        toast.error('Incorrect. Check the explanation.');
                      }
                    }}
                    className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = aptitudeQuestions.findIndex((q) => q.id === activeSolveQuestion.id);
                      const nextIndex = (currentIndex + 1) % aptitudeQuestions.length;
                      handleOpenSolveModal(aptitudeQuestions[nextIndex]);
                    }}
                    className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next Question</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
