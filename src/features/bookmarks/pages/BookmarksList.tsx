import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchBookmarks, toggleBookmarkItem } from '../redux/bookmarkSlice';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Badge } from '../../../shared/components/ui/Badge';
import { toast } from 'react-hot-toast';

export const BookmarksList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const [filterType, setFilterType] = useState<'ALL' | 'PROBLEM' | 'APTITUDE' | 'COMPANY'>('ALL');

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, [dispatch]);

  const handleRemove = (itemId: string) => {
    dispatch(toggleBookmarkItem({ itemId }))
      .unwrap()
      .then(() => {
        toast.success('Bookmark removed');
      })
      .catch((err: any) => {
        toast.error(typeof err === 'string' ? err : 'Failed to remove bookmark');
      });
  };

  const filteredBookmarks = bookmarks.filter((bm) => {
    if (filterType === 'ALL') return true;
    return bm.type === filterType;
  });

  const getTargetUrl = (bm: any) => {
    if (bm.type === 'PROBLEM') return `/problems/${bm.itemId}`;
    if (bm.type === 'APTITUDE') return `/aptitude`;
    if (bm.type === 'COMPANY') return `/companies/${bm.itemId}`;
    return '/practice';
  };

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      {/* Ambient background glows matching Practice and Companies page */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Header Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-[#0F1D38] border border-blue-200 dark:border-blue-700/60 text-blue-600 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
          <i className="fa-solid fa-bookmark text-[10px]"></i>
          <span>SAVED BOOKMARKS</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-3">
          Your Saved{' '}
          <span className="text-blue-600 dark:text-[#38BDF8]">
            Bookmarks
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed mb-6">
          Quick access to your saved DSA problems, aptitude questions, and company guides for easy revision.
        </p>

        {/* Filter Type Tabs */}
        <div className="flex items-center justify-center gap-1.5 bg-white dark:bg-[#0D1322] p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex-wrap">
          {(['ALL', 'PROBLEM', 'APTITUDE', 'COMPANY'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t === 'ALL' ? 'All Saved' : t === 'PROBLEM' ? 'DSA Problems' : t === 'APTITUDE' ? 'Aptitude' : 'Companies'}
            </button>
          ))}
        </div>
      </section>

      {/* Bookmarks List Container */}
      <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 mt-2">
        {filteredBookmarks.length === 0 ? (
          <EmptyState
            title="No bookmarks saved"
            description="Click the star bookmark icon on any problem, aptitude, or company page to save it for quick revision."
            icon={<i className="fa-solid fa-star text-2xl text-amber-400"></i>}
          />
        ) : (
          <div className="flex flex-col gap-3.5">
            {filteredBookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1322] hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-2xl flex items-center justify-between gap-4 transition-all shadow-xs group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-500 dark:text-amber-400 rounded-xl shrink-0">
                    <i className="fa-solid fa-star text-sm"></i>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={getTargetUrl(bm)}
                        className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate tracking-tight"
                      >
                        {bm.title}
                      </Link>
                      <Badge variant="primary">{bm.type}</Badge>
                    </div>
                    {bm.difficulty && (
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 block truncate">
                        Category: {bm.category || 'General'} • Level: {bm.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={getTargetUrl(bm)}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                    title="Open"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </Link>
                  <button
                    onClick={() => handleRemove(bm.itemId)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-sm cursor-pointer"
                    title="Remove bookmark"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
