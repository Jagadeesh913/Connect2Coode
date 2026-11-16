import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Search,
  Trash2,
  ArrowRight,
  ChevronLeft,
  Lock,
  Loader2,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchBookmarks,
  toggleBookmarkItem,
} from '../redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Badge } from '../../../shared/components/ui/Badge';
import { BookmarkItemSkeleton } from '../../../shared/components/ui/Skeleton';
import { C2CSelect, type C2CSelectOption } from '../../../shared/components/ui/C2CSelect';
import { toast } from '@/shared/notifications/toast';

const DIFFICULTY_OPTIONS: C2CSelectOption[] = [
  { value: 'ALL', label: 'All Difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const SORT_OPTIONS: C2CSelectOption[] = [
  { value: 'DEFAULT', label: 'Default Order' },
  { value: 'ID_ASC', label: 'Question ID (Asc)' },
  { value: 'ID_DESC', label: 'Question ID (Desc)' },
  { value: 'TITLE_ASC', label: 'Title (A-Z)' },
];

const getDifficultyBadgeVariant = (
  difficulty?: string
): 'easy' | 'medium' | 'hard' | 'neutral' => {
  const norm = (difficulty || '').toLowerCase().trim();
  if (norm.includes('easy')) return 'easy';
  if (norm.includes('medium')) return 'medium';
  if (norm.includes('hard')) return 'hard';
  return 'neutral';
};

export const BookmarksList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { bookmarks, loading, error, pendingToggleKeys } = useAppSelector(
    (state) => state.bookmarks
  );

  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('DEFAULT');

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const req = dispatch(fetchBookmarks());
      req
        .unwrap()
        .catch(() => {})
        .finally(() => {
          setHasFetchedOnce(true);
        });
    } else {
      setHasFetchedOnce(true);
    }
  }, [dispatch, isAuthenticated, user?.id]);

  const isBookmarksLoading =
    isAuthenticated && (loading || !hasFetchedOnce) && bookmarks.length === 0;

  const handleRemove = (itemId: string) => {
    if (pendingToggleKeys[`PROBLEM:${itemId}`]) return;
    dispatch(toggleBookmarkItem({ itemId, type: 'PROBLEM' }))
      .unwrap()
      .then(() => {
        toast.success('Bookmark removed');
      })
      .catch((err: unknown) => {
        toast.error(typeof err === 'string' ? err : 'Failed to remove bookmark');
      });
  };

  const filteredBookmarks = useMemo(() => {
    let result = [...bookmarks];

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (bm) =>
          bm.title.toLowerCase().includes(query) ||
          String(bm.itemId).includes(query) ||
          (bm.category && bm.category.toLowerCase().includes(query))
      );
    }

    if (selectedDifficulty !== 'ALL') {
      result = result.filter((bm) => {
        const diff = (bm.difficulty || '').toUpperCase();
        return diff.includes(selectedDifficulty);
      });
    }

    if (selectedSort === 'ID_ASC') {
      result.sort((a, b) => Number(a.itemId) - Number(b.itemId));
    } else if (selectedSort === 'ID_DESC') {
      result.sort((a, b) => Number(b.itemId) - Number(a.itemId));
    } else if (selectedSort === 'TITLE_ASC') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [bookmarks, searchQuery, selectedDifficulty, selectedSort]);

  const isFilterActive = searchQuery.trim() !== '' || selectedDifficulty !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('ALL');
    setSelectedSort('DEFAULT');
  };

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      {/* Ambient background glows matching Practice and Companies page */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Breadcrumb Navigation */}
      <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          to="/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Practice</span>
        </Link>
      </div>

      {/* Hero Header Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 flex flex-col items-start sm:items-center sm:text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-[#0F1D38] border border-blue-200 dark:border-blue-700/60 text-blue-600 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
          <Bookmark className="w-3.5 h-3.5 fill-blue-600 dark:fill-sky-300" />
          <span>BOOKMARKED CHALLENGES</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-3">
          Your Saved{' '}
          <span className="text-blue-600 dark:text-[#38BDF8]">
            Bookmarks
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
          Quick access to your saved coding challenges for revision and interview preparation.
        </p>
      </section>

      {/* Main Content Container */}
      <main className="w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        {!isAuthenticated ? (
          /* Sign-in prompt for unauthenticated users */
          <div className="w-full flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center p-8 sm:p-10 max-w-md w-full rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1322] shadow-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Sign in to View Bookmarks
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Log in with your Connect 2 Code account to access and practice your saved challenges across all your devices.
              </p>
              <button
                type="button"
                onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/30 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Search & Filter Toolbar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or question ID…"
                  className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  aria-label="Search bookmarked questions"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Difficulty filter */}
              <div className="w-full sm:w-44 shrink-0">
                <C2CSelect
                  id="bookmarks-difficulty-filter"
                  value={selectedDifficulty}
                  options={DIFFICULTY_OPTIONS}
                  onChange={setSelectedDifficulty}
                  aria-label="Filter by difficulty"
                  placeholder="Difficulty"
                  leading={<SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />}
                />
              </div>

              {/* Sort by */}
              <div className="w-full sm:w-48 shrink-0">
                <C2CSelect
                  id="bookmarks-sort-filter"
                  value={selectedSort}
                  options={SORT_OPTIONS}
                  onChange={setSelectedSort}
                  aria-label="Sort bookmarks"
                  placeholder="Sort by"
                />
              </div>
            </div>

            {/* Results counter & clear filters */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>
                Showing <strong className="font-semibold text-slate-700 dark:text-slate-200">{filteredBookmarks.length}</strong> of{' '}
                <strong className="font-semibold text-slate-700 dark:text-slate-200">{bookmarks.length}</strong> bookmarked {bookmarks.length === 1 ? 'problem' : 'problems'}
              </span>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Request status banner */}
            <RequestStatus
              pending={loading}
              error={error}
              onRetry={() => dispatch(fetchBookmarks({ force: true }))}
            />

            {/* Bookmarks List Content */}
            {isBookmarksLoading ? (
              <BookmarkItemSkeleton count={4} />
            ) : error && bookmarks.length === 0 ? (
              <EmptyState
                title="Unable to load bookmarks"
                description={error}
                actionText="Retry"
                onAction={() => dispatch(fetchBookmarks({ force: true }))}
              />
            ) : bookmarks.length === 0 ? (
              <EmptyState
                title="No bookmarks saved"
                description="Bookmark coding challenges while practicing to easily find and revisit them later."
                icon={<Bookmark className="w-8 h-8 text-amber-500 fill-amber-400" />}
                actionText="Explore Problems"
                onAction={() => navigate('/practice')}
              />
            ) : filteredBookmarks.length === 0 ? (
              <EmptyState
                title="No matching bookmarks"
                description="No bookmarked challenges match your search or filter criteria."
                icon={<Search className="w-8 h-8 text-slate-400" />}
                actionText="Clear Filters"
                onAction={clearFilters}
              />
            ) : (
              <div className="flex flex-col gap-3.5">
                {filteredBookmarks.map((bm) => {
                  const isRemoving = Boolean(
                    pendingToggleKeys[`PROBLEM:${bm.itemId}`]
                  );
                  return (
                    <div
                      key={bm.id}
                      className="p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1322] hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-2xl flex items-center justify-between gap-4 transition-all shadow-xs group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-500 shrink-0">
                          <Bookmark className="w-5 h-5 fill-amber-400 text-amber-500" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                              #{bm.itemId}
                            </span>
                            <Badge variant={getDifficultyBadgeVariant(bm.difficulty)}>
                              {bm.difficulty || 'Medium'}
                            </Badge>
                            {bm.category && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                • {bm.category}
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/problems/${bm.itemId}`}
                            className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block tracking-tight"
                          >
                            {bm.title}
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                          to={`/problems/${bm.itemId}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-2xs shadow-blue-600/30"
                          title="Solve challenge"
                        >
                          <span>Solve</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemove(bm.itemId)}
                          disabled={isRemoving}
                          aria-busy={isRemoving}
                          aria-label={`Remove ${bm.title} bookmark`}
                          className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          title="Remove bookmark"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookmarksList;
