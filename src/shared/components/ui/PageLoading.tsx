import React from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton, CompanyCardSkeleton, CompanyDetailsSkeleton, ProfilePageSkeleton, AptitudeQuestionSkeleton, BookmarkItemSkeleton } from './Skeleton';

/** Shared by route chunks and session guards, with the destination's content geometry. */
export const PageLoading: React.FC = () => {
  const { pathname } = useLocation();
  let content: React.ReactNode;
  if (/\/problems\/[^/]+/.test(pathname)) {
    content = <><Skeleton className="h-10 w-80" /><div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[740px]"><Skeleton className="lg:col-span-5 min-h-80" /><Skeleton className="lg:col-span-7 min-h-96" /></div></>;
  } else if (pathname.includes('/companies/')) {
    content = <CompanyDetailsSkeleton />;
  } else if (pathname.includes('profile')) {
    content = <ProfilePageSkeleton />;
  } else if (pathname === '/companies') {
    content = <><Skeleton className="h-40 w-full" /><Skeleton className="h-12 w-full" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"><CompanyCardSkeleton /></div></>;
  } else if (/aptitude|logical|verbal|pseudocode/.test(pathname)) {
    content = <><Skeleton className="h-40 w-full" /><div className="grid lg:grid-cols-[260px_1fr] gap-6"><Skeleton className="hidden lg:block h-96 w-full" /><AptitudeQuestionSkeleton count={3} /></div></>;
  } else if (pathname.includes('bookmarks')) {
    content = <><Skeleton className="h-40 w-full" /><BookmarkItemSkeleton /></>;
  } else if (/practice|dsa-sheet|admin/.test(pathname)) {
    content = <><Skeleton className="h-32 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-14 w-full" count={10} /></>;
  } else {
    content = <><Skeleton className="h-10 w-64" /><Skeleton className="h-40 w-full" /><Skeleton className="h-20 w-full" count={4} /></>;
  }
  return <div role="status" aria-label="Loading page" aria-busy="true" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">{content}</div>;
};
