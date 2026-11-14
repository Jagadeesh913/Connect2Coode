import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchUserProfile,
  fetchUserInfoThunk,
  saveUserInfoThunk,
} from '../redux/profileSlice';
import type { SaveUserInfoPayload } from '../../../core/types/domain';
import { getActionableErrorMessage } from '../../../core/validation/serverErrorMapper';

// Modals & Redux
import { EditAcademicModal } from '../components/modals/EditAcademicModal';
import { toast } from '@/shared/notifications/toast';
import { openAuthModal } from '../../auth/redux/authSlice';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { C2CSelect, type C2CSelectOption } from '../../../shared/components/ui/C2CSelect';
import { hydrateProgress } from '../../progress/redux/progressSlice';
import { fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import { ProfilePageSkeleton } from '../../../shared/components/ui/Skeleton';
import type { AcademicDetailsFormData } from '../../../core/validation';
import { useReferenceGroup } from '../../references/hooks/useReferenceGroup';

// Lucide Icons
import {
  Mail,
  GraduationCap,
  Lock,
  Pencil,
  Calendar,
  Hash,
  Building2,
  Bookmark,
  Clock,
  ArrowUpRight,
  Search,
  Flame,
  CheckCircle2,
  Code2,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface ActivityCell {
  key: string;
  label: string;
  attempts: number;
}

const buildActivityCells = (attempts: Array<{ submittedDate?: string }>): ActivityCell[] => {
  const counts = new Map<string, number>();
  attempts.forEach(({ submittedDate }) => {
    if (!submittedDate) return;
    const date = new Date(submittedDate);
    if (Number.isNaN(date.getTime())) return;
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() - 181);
  return Array.from({ length: 182 }, (_, offset) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + offset);
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    return {
      key,
      attempts: counts.get(key) || 0,
      label: date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  });
};

type ContentTab = 'solved' | 'attempted' | 'bookmarks';

const DIFFICULTY_OPTIONS: C2CSelectOption[] = [
  { value: 'ALL', label: 'All Levels' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

export const UserProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();

  const {
    profile,
    profileFetched,
    userInfo,
    loading: profileLoading,
    userInfoLoading: academicLoading,
    error: profileError,
    userInfoError: academicError,
  } = useAppSelector((state) => state.profile);
  const authUser = useAppSelector((state) => state.auth.user);
  const { items: genderReferences } = useReferenceGroup('GENDER');

  // Modals & Mutation State
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const mutationPendingRef = useRef(false);

  // Filter & Active Sub-Tab
  const [activeTab, setActiveTab] = useState<ContentTab>('solved');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');

  const {
    solvedItems,
    attemptedItems,
    loading: activityLoading,
    error: activityError,
  } = useAppSelector((state) => state.progress);

  const { bookmarks, loading: bookmarksLoading, error: bookmarksError } = useAppSelector(
    (state) => state.bookmarks
  );

  // Effective User ID from authenticated session (Must be numeric Long for backend APIs)
  const effectiveUserId = useMemo(() => {
    const parseNum = (val: any): number | null => {
      if (val === null || val === undefined) return null;
      const n = Number(val);
      return !isNaN(n) && n > 0 ? n : null;
    };

    const fromAuth = parseNum(authUser?.id) ?? parseNum((authUser as any)?.userId);
    if (fromAuth) return fromAuth;

    const fromProfile = parseNum(profile?.id);
    if (fromProfile) return fromProfile;

    const stored = tokenStorage.getUser();
    const fromStored = parseNum(stored?.id) ?? parseNum((stored as any)?.userId);
    if (fromStored) return fromStored;

    return null;
  }, [authUser, profile]);

  // Calculate Streak from submission history
  const calculateStreak = (submissions: Array<{ submittedDate?: string }>): number => {
    if (!submissions || !Array.isArray(submissions) || submissions.length === 0) return 0;

    const dateStrings = submissions
      .map((s) => {
        const raw = s.submittedDate || (s as any).createdAt || (s as any).submittedAt;
        if (!raw) return null;
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d.toDateString();
      })
      .filter((d): d is string => d !== null);

    if (dateStrings.length === 0) return 0;

    const uniqueTimestamps = Array.from(new Set(dateStrings))
      .map((d) => new Date(d).getTime())
      .sort((a, b) => b - a);

    if (uniqueTimestamps.length === 0) return 0;

    const today = new Date(new Date().toDateString()).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    let streak = 0;
    let expectedDate = today;

    if (uniqueTimestamps[0] === today) {
      streak = 1;
      expectedDate -= oneDay;
    } else if (uniqueTimestamps[0] === today - oneDay) {
      streak = 1;
      expectedDate = today - 2 * oneDay;
    } else {
      return 0;
    }

    for (let i = 1; i < uniqueTimestamps.length; i++) {
      if (uniqueTimestamps[i] === expectedDate) {
        streak++;
        expectedDate -= oneDay;
      } else {
        break;
      }
    }

    return streak;
  };

  const [sectionRetry, setSectionRetry] = useState(0);

  // Initial Data Fetching from real API
  useEffect(() => {
    void dispatch(fetchUserProfile());
    if (effectiveUserId) {
      try {
        localStorage.removeItem(`c2c_user_academic_${effectiveUserId}`);
      } catch {}
      const request = dispatch(
        fetchUserInfoThunk({ userId: effectiveUserId, force: sectionRetry > 0 })
      );
      const progressRequest = dispatch(
        hydrateProgress({ userId: effectiveUserId, force: sectionRetry > 0 })
      );
      const bookmarkRequest = dispatch(fetchBookmarks({ force: sectionRetry > 0 }));
      return () => {
        request.abort();
        progressRequest.abort();
        bookmarkRequest.abort();
      };
    }
  }, [dispatch, effectiveUserId, sectionRetry]);

  // Handle Academic Info Submit -> POST /api/v1/userInfo/{userId}
  const handleSaveAcademic = async (data: AcademicDetailsFormData) => {
    if (!effectiveUserId) {
      toast.error('Please log in to save academic details.');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }

    if (mutationPendingRef.current) return;
    mutationPendingRef.current = true;
    setSubmitting(true);
    try {
      const selectedGenderId = data.genderId ? Number(data.genderId) : null;
      const gender = selectedGenderId
        ? genderReferences.find((reference) => reference.id === selectedGenderId) ||
          (userInfo?.gender?.id === selectedGenderId ? userInfo.gender : null)
        : null;
      if (selectedGenderId && !gender) {
        throw new Error('The selected gender is no longer available. Refresh the page and try again.');
      }
      const trimmedFirstName = (data.firstName || '').trim();
      const trimmedLastName = (data.lastName || '').trim();
      const payload: SaveUserInfoPayload = {
        id: userInfo?.id !== undefined && userInfo?.id !== null ? Number(userInfo.id) : null,
        userId: Number(effectiveUserId),
        ...(trimmedFirstName ? { firstName: trimmedFirstName } : {}),
        ...(trimmedLastName ? { lastName: trimmedLastName } : {}),
        regNumber: (data.regNumber || '').trim(),
        joinedYear: Number(data.joinedYear),
        passedOutYear: Number(data.passedOutYear),
        college: (data.college || '').trim(),
        collegeName: (data.college || '').trim(),
        collegeId: data.collegeId ? Number(data.collegeId) : null,
        bio: (data.bio || '').trim(),
        gender,
        dob: data.dob?.trim() || null,
      };

      await dispatch(
        saveUserInfoThunk({
          userId: effectiveUserId,
          payload,
        })
      ).unwrap();

      toast.success('Profile details saved successfully.');
      setIsAcademicModalOpen(false);
    } catch (err: any) {
      const errorMsg = getActionableErrorMessage(
        err,
        'Unable to save academic details. Please try again.'
      );
      toast.error(errorMsg);
    } finally {
      mutationPendingRef.current = false;
      setSubmitting(false);
    }
  };

  // Deduplicate questions to show unique problems solved / attempted (latest submission per question)
  const uniqueSolvedItems = useMemo(() => {
    const map = new Map<number, (typeof solvedItems)[number]>();
    for (const item of solvedItems) {
      if (!item || item.questionId === undefined || item.questionId === null) continue;
      const existing = map.get(item.questionId);
      if (!existing) {
        map.set(item.questionId, item);
      } else {
        const existingTime = existing.submittedDate ? new Date(existing.submittedDate).getTime() : 0;
        const newTime = item.submittedDate ? new Date(item.submittedDate).getTime() : 0;
        if (newTime >= existingTime) {
          map.set(item.questionId, item);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.submittedDate ? new Date(a.submittedDate).getTime() : 0;
      const timeB = b.submittedDate ? new Date(b.submittedDate).getTime() : 0;
      return timeB - timeA;
    });
  }, [solvedItems]);

  const uniqueAttemptedItems = useMemo(() => {
    const map = new Map<number, (typeof attemptedItems)[number]>();
    for (const item of attemptedItems) {
      if (!item || item.questionId === undefined || item.questionId === null) continue;
      const existing = map.get(item.questionId);
      if (!existing) {
        map.set(item.questionId, item);
      } else {
        const existingTime = existing.submittedDate ? new Date(existing.submittedDate).getTime() : 0;
        const newTime = item.submittedDate ? new Date(item.submittedDate).getTime() : 0;
        if (newTime >= existingTime) {
          map.set(item.questionId, item);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.submittedDate ? new Date(a.submittedDate).getTime() : 0;
      const timeB = b.submittedDate ? new Date(b.submittedDate).getTime() : 0;
      return timeB - timeA;
    });
  }, [attemptedItems]);

  // Real live question statistics strictly from backend API
  const realSolvedCount = uniqueSolvedItems.length;
  const realAttemptedCount = uniqueAttemptedItems.length;
  const realStreak = calculateStreak(attemptedItems);

  // Live difficulty breakdown dynamically calculated from unique solved items
  const difficultyCounts = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    uniqueSolvedItems.forEach((item) => {
      const diff = (item.difficultyLevel || '').toLowerCase();
      if (diff.includes('easy')) easy++;
      else if (diff.includes('hard')) hard++;
      else medium++;
    });
    return { easy, medium, hard };
  }, [uniqueSolvedItems]);

  // Real User Profile Values (Driven strictly from session & API)
  const fullName =
    profile?.fullName ||
    (profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ''}`.trim()
      : userInfo?.firstName
        ? `${userInfo.firstName} ${userInfo.lastName || ''}`.trim()
        : authUser?.fullName || (authUser as any)?.username || 'User');

  const email = profile?.email || authUser?.email || '';

  const initials = useMemo(() => {
    if (fullName && fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  }, [fullName, email]);

  // Real academic values from userInfo API
  const regNumber = userInfo?.regNumber || '';
  const collegeName = userInfo?.college || '';
  const joinedYear = userInfo?.joinedYear;
  const passedOutYear = userInfo?.passedOutYear;
  const bio = userInfo?.bio || '';
  const genderName = userInfo?.gender?.refName || '';
  const dateOfBirth = userInfo?.dob || '';
  const activityCells = useMemo(() => buildActivityCells(attemptedItems), [attemptedItems]);
  const activitySummary = useMemo(() => {
    return activityCells.reduce(
      (summary, cell) => ({
        totalAttempts: summary.totalAttempts + cell.attempts,
        activeDays: summary.activeDays + (cell.attempts > 0 ? 1 : 0),
        peakAttempts: Math.max(summary.peakAttempts, cell.attempts),
      }),
      { totalAttempts: 0, activeDays: 0, peakAttempts: 0 }
    );
  }, [activityCells]);

  const genderOptions = useMemo(() => {
    const byId = new Map<number, typeof genderReferences[number]>();
    if (userInfo?.gender) byId.set(userInfo.gender.id, userInfo.gender);
    genderReferences.forEach((gender) => {
      if (gender.isActive) byId.set(gender.id, gender);
    });
    return [...byId.values()];
  }, [genderReferences, userInfo?.gender]);

  // Filtered lists for problem lists
  const filteredSolvedItems = useMemo(() => {
    return uniqueSolvedItems.filter((item) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.questionName.toLowerCase().includes(query) ||
        String(item.questionId).includes(query);
      const diff = (item.difficultyLevel || '').toUpperCase();
      const matchesDiff =
        selectedDifficulty === 'ALL' || diff.includes(selectedDifficulty);
      return matchesSearch && matchesDiff;
    });
  }, [uniqueSolvedItems, searchQuery, selectedDifficulty]);

  const filteredAttemptedItems = useMemo(() => {
    return uniqueAttemptedItems.filter((item) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        String(item.questionId).includes(query);
      const diff = (item.difficulty || '').toUpperCase();
      const matchesDiff =
        selectedDifficulty === 'ALL' || diff.includes(selectedDifficulty);
      return matchesSearch && matchesDiff;
    });
  }, [uniqueAttemptedItems, searchQuery, selectedDifficulty]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((item) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        String(item.itemId).includes(query);
      const diff = (item.difficulty || '').toUpperCase();
      const matchesDiff =
        selectedDifficulty === 'ALL' || diff.includes(selectedDifficulty);
      return matchesSearch && matchesDiff;
    });
  }, [bookmarks, searchQuery, selectedDifficulty]);

  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[65vh] font-sans bg-[#F8FAFC] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 px-4">
        <div className="text-center p-8 max-w-md w-full rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-neutral-900 shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Sign in to View Your Profile</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Log in with your Connect 2 Code account to view and update your academic details, institution affiliations, and coding progress.
          </p>
          <button
            onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/30 cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if ((profileLoading || (!profileFetched && !profileError)) && !profile) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#070A13] font-sans transition-colors duration-200 overflow-x-hidden pb-16">
        <ProfilePageSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#070A13] font-sans transition-colors duration-200 overflow-x-hidden pb-20 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Indicators */}
        <RequestStatus
          pending={profileLoading}
          error={profileError}
          onRetry={() => dispatch(fetchUserProfile({ force: true }))}
          label="Loading profile…"
        />
        <RequestStatus
          pending={academicLoading || activityLoading}
          error={academicError || activityError}
          onRetry={() => setSectionRetry((value) => value + 1)}
          label="Loading academic details and activity…"
        />

        {/* TWO-COLUMN IMPECCABLE PROFILE ARCHITECTURE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ============================================================== */}
          {/* LEFT SIDEBAR: IDENTITY & ACADEMIC DOSSIER                      */}
          {/* ============================================================== */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Identity Showcase Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Monogram Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-white dark:ring-neutral-800">
                    <span>{initials}</span>
                  </div>
                  <div
                    className="absolute bottom-0 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900"
                    title="Active Session"
                  />
                </div>

                {/* Name & Primary Contact */}
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {fullName}
                  </h1>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{email}</span>
                  </div>
                </div>

                {/* Academic Bio Quote */}
                {bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic px-2 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800/40 border-l-2 border-blue-500/60 leading-relaxed text-left w-full">
                    &ldquo;{bio}&rdquo;
                  </p>
                )}

                {/* Action CTA Button */}
                <div className="w-full pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAcademicModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{regNumber || collegeName ? 'Edit Academic Details' : 'Complete Academic Profile'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Academic Information Card */}
            <div
              id="academic-card"
              className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Academic Record
                  </h2>
                </div>
              </div>

              {/* Verified API-backed fields list */}
              <div className="space-y-3.5 text-xs">
                {/* Registration Number */}
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-neutral-800/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    Registration #
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {regNumber || '—'}
                  </span>
                </div>

                {/* College / Institute */}
                <div className="py-1 border-b border-slate-100 dark:border-neutral-800/60 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Institution
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-white text-xs leading-snug">
                    {collegeName || '—'}
                  </p>
                  {userInfo?.collegeId ? (
                    <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                      College ID: #{userInfo.collegeId}
                    </span>
                  ) : null}
                </div>

                {/* Academic Timeline */}
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-neutral-800/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Academic Years
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {joinedYear ? `${joinedYear} — ` : ''}{passedOutYear ? `${passedOutYear}` : '—'}
                  </span>
                </div>

                {/* Gender */}
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-neutral-800/60">
                  <span className="text-slate-500 dark:text-slate-400">Gender</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {genderName || '—'}
                  </span>
                </div>

                {/* Date of Birth */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Date of Birth</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {dateOfBirth || '—'}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: CODING HUD, HEATMAP & PRACTICE EXPLORER           */}
          {/* ============================================================== */}
          <main className="lg:col-span-8 space-y-6">

            {/* Performance Analytics HUD */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-neutral-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Coding Performance
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live verification data directly from evaluation servers
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200/60 dark:border-amber-800/40">
                    <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{realStreak} {realStreak === 1 ? 'Day Streak' : 'Days Streak'}</span>
                  </div>
                </div>
              </div>

              {/* Master Stats & Segmented Track */}
              <div className="pt-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {realSolvedCount}
                      </span>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Problems Solved
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Unique algorithmic problems successfully verified
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs font-medium flex-wrap">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-800/70 border border-slate-200/70 dark:border-neutral-700/60 text-slate-700 dark:text-slate-300 font-mono">
                      <strong className="text-slate-900 dark:text-white font-bold">{realAttemptedCount}</strong> Unique Attempted
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-800/70 border border-slate-200/70 dark:border-neutral-700/60 text-slate-700 dark:text-slate-300 font-mono">
                      <strong className="text-slate-900 dark:text-white font-bold">{attemptedItems.length}</strong> Total Submissions
                    </span>
                  </div>
                </div>

                {/* Segmented Multi-Color Progress Track */}
                <div className="space-y-2">
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-neutral-800 flex overflow-hidden gap-1 p-0.5">
                    {realSolvedCount > 0 ? (
                      <>
                        <div
                          style={{ width: `${(difficultyCounts.easy / realSolvedCount) * 100}%` }}
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          title={`Easy: ${difficultyCounts.easy} (${Math.round((difficultyCounts.easy / realSolvedCount) * 100)}%)`}
                        />
                        <div
                          style={{ width: `${(difficultyCounts.medium / realSolvedCount) * 100}%` }}
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          title={`Medium: ${difficultyCounts.medium} (${Math.round((difficultyCounts.medium / realSolvedCount) * 100)}%)`}
                        />
                        <div
                          style={{ width: `${(difficultyCounts.hard / realSolvedCount) * 100}%` }}
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          title={`Hard: ${difficultyCounts.hard} (${Math.round((difficultyCounts.hard / realSolvedCount) * 100)}%)`}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-200 dark:bg-neutral-800 rounded-full" />
                    )}
                  </div>
                </div>

                {/* 3 Difficulty Metric Cards (Responsive Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Easy Card */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between transition-all hover:border-emerald-200 dark:hover:border-emerald-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Easy
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        {realSolvedCount > 0 ? Math.round((difficultyCounts.easy / realSolvedCount) * 100) : 0}%
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950 dark:text-emerald-200">
                        {difficultyCounts.easy}
                      </span>
                      <span className="text-xs text-emerald-700/70 dark:text-emerald-400/70 ml-1.5 font-medium">
                        solved
                      </span>
                    </div>
                    <div className="mt-3 w-full bg-emerald-200/50 dark:bg-emerald-900/40 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${realSolvedCount > 0 ? (difficultyCounts.easy / realSolvedCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Medium Card */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex flex-col justify-between transition-all hover:border-amber-200 dark:hover:border-amber-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Medium
                      </span>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 font-mono">
                        {realSolvedCount > 0 ? Math.round((difficultyCounts.medium / realSolvedCount) * 100) : 0}%
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl sm:text-3xl font-extrabold text-amber-950 dark:text-amber-200">
                        {difficultyCounts.medium}
                      </span>
                      <span className="text-xs text-amber-700/70 dark:text-amber-400/70 ml-1.5 font-medium">
                        solved
                      </span>
                    </div>
                    <div className="mt-3 w-full bg-amber-200/50 dark:bg-amber-900/40 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${realSolvedCount > 0 ? (difficultyCounts.medium / realSolvedCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Hard Card */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex flex-col justify-between transition-all hover:border-rose-200 dark:hover:border-rose-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                        Hard
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 font-mono">
                        {realSolvedCount > 0 ? Math.round((difficultyCounts.hard / realSolvedCount) * 100) : 0}%
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl sm:text-3xl font-extrabold text-rose-950 dark:text-rose-200">
                        {difficultyCounts.hard}
                      </span>
                      <span className="text-xs text-rose-700/70 dark:text-rose-400/70 ml-1.5 font-medium">
                        solved
                      </span>
                    </div>
                    <div className="mt-3 w-full bg-rose-200/50 dark:bg-rose-900/40 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${realSolvedCount > 0 ? (difficultyCounts.hard / realSolvedCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connect2Code activity signal */}
            <section className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-xs dark:border-white/10 dark:bg-neutral-900">
              <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
                <aside className="relative overflow-hidden bg-[#111429] p-5 text-white sm:p-6 lg:min-h-[24rem]">
                  <div className="pointer-events-none absolute -right-14 -top-12 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-blue-500/25 blur-3xl" />
                  <img
                    src="/logo-mark-transparent.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 top-16 h-36 w-36 rotate-12 object-contain opacity-[0.07]"
                  />

                  <div className="relative flex h-full flex-col">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-violet-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.9)]" />
                        Practice signal
                      </div>
                      <h2 className="mt-4 max-w-48 text-xl font-extrabold leading-tight">
                        Build your trail, one mark at a time.
                      </h2>
                      <p className="mt-2 max-w-48 text-xs leading-relaxed text-slate-300">
                        A 26-week view of your recorded coding attempts.
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 lg:mt-auto lg:grid-cols-1" aria-label="Activity summary">
                      {[
                        { label: 'Attempts', value: activitySummary.totalAttempts, accent: 'text-violet-200' },
                        { label: 'Active days', value: activitySummary.activeDays, accent: 'text-blue-200' },
                        { label: 'Best day', value: activitySummary.peakAttempts, accent: 'text-fuchsia-200' },
                      ].map((metric) => (
                        <div
                          key={metric.label}
                          className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-2.5 backdrop-blur-sm lg:flex lg:items-center lg:justify-between"
                        >
                          <span className={`block text-xl font-black leading-none ${metric.accent}`}>
                            {metric.value}
                          </span>
                          <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400 lg:mt-0">
                            {metric.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>

                <div className="min-w-0 p-5 sm:p-6 lg:p-7">
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end dark:border-white/10">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
                        26-week activity trail
                      </span>
                      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {activityCells[0]?.label} — {activityCells[activityCells.length - 1]?.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg ring-1 ring-blue-400/70 dark:ring-blue-300/60">
                        <img src="/logo-mark-transparent.png" alt="" aria-hidden="true" className="h-[18px] w-[18px] object-contain" />
                      </span>
                      Today
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <div className="hidden w-7 shrink-0 grid-rows-7 gap-1.5 text-[9px] font-semibold text-slate-400 sm:grid" aria-hidden="true">
                      <span />
                      <span className="self-center">Mon</span>
                      <span />
                      <span className="self-center">Wed</span>
                      <span />
                      <span className="self-center">Fri</span>
                      <span />
                    </div>

                    <div
                      className="grid min-w-0 flex-1 grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto rounded-2xl bg-slate-50 p-3 pb-4 [scrollbar-color:theme(colors.violet.300)_transparent] dark:bg-black/20"
                      style={{ gridTemplateColumns: `repeat(${Math.ceil(activityCells.length / 7)}, minmax(1.25rem, 1fr))` }}
                      aria-label="Connect2Code practice activity heat map"
                    >
                      {activityCells.map((cell, index) => {
                        const markTone =
                          cell.attempts === 0
                            ? 'opacity-[0.12] grayscale dark:opacity-[0.18]'
                            : cell.attempts === 1
                            ? 'opacity-55'
                            : cell.attempts === 2
                            ? 'opacity-80 drop-shadow-[0_1px_2px_rgba(124,58,237,0.28)]'
                            : 'opacity-100 drop-shadow-[0_2px_4px_rgba(124,58,237,0.38)]';
                        const activityLabel = `${cell.label}: ${cell.attempts} ${cell.attempts === 1 ? 'attempt' : 'attempts'}`;
                        const isToday = index === activityCells.length - 1;
                        return (
                          <span
                            key={cell.key}
                            title={activityLabel}
                            aria-label={activityLabel}
                            tabIndex={cell.attempts > 0 ? 0 : -1}
                            className={`relative flex h-5 min-w-5 items-center justify-center rounded-md outline-hidden transition-transform hover:scale-125 focus-visible:scale-125 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-neutral-900 ${
                              isToday ? 'ring-1 ring-blue-400/70 dark:ring-blue-300/60' : ''
                            }`}
                          >
                            <img
                              src="/logo-mark-transparent.png"
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              decoding="async"
                              className={`h-[18px] w-[18px] object-contain transition-all ${markTone}`}
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
                    <span>Focus an active mark to read its date and attempt count.</span>
                    <div className="flex items-center gap-2" aria-hidden="true">
                      <span>Low</span>
                      {['opacity-[0.12] grayscale', 'opacity-55', 'opacity-80', 'opacity-100'].map((tone) => (
                        <img
                          key={tone}
                          src="/logo-mark-transparent.png"
                          alt=""
                          className={`h-4 w-4 object-contain ${tone}`}
                        />
                      ))}
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Practice & Submissions Explorer */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xs space-y-5">
              
              {/* Tab Selector & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
                {/* Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('solved')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'solved'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Solved ({uniqueSolvedItems.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('attempted')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'attempted'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Attempted ({uniqueAttemptedItems.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('bookmarks')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'bookmarks'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Bookmarks ({bookmarks.length})</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title or ID..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <C2CSelect
                    value={selectedDifficulty}
                    onChange={(val) => setSelectedDifficulty(val as 'ALL' | 'EASY' | 'MEDIUM' | 'HARD')}
                    options={DIFFICULTY_OPTIONS}
                    align="right"
                    ariaLabel="Filter problems by difficulty"
                    className="w-full sm:w-36 shrink-0"
                    buttonClassName="rounded-xl py-1.5 px-3 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:border-blue-500/50 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* TAB CONTENT: Solved Questions */}
              {activeTab === 'solved' && (
                filteredSolvedItems.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-slate-400">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {searchQuery ? 'No solved problems match your query' : 'No solved questions on record yet'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Solve algorithm problems in the practice arena to populate your solutions portfolio.
                    </p>
                    <Link
                      to="/practice"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors mt-2"
                    >
                      <span>Explore Practice Arena</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {filteredSolvedItems.map((item) => {
                      const diff = (item.difficultyLevel || 'Medium').toUpperCase();
                      const isEasy = diff.includes('EASY');
                      const isHard = diff.includes('HARD');
                      const diffTone = isEasy
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                        : isHard
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/50';

                      const date = item.submittedDate ? new Date(item.submittedDate) : null;
                      const formattedDate = date && !isNaN(date.getTime())
                        ? date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—';

                      return (
                        <div
                          key={`solved-${item.questionId}`}
                          className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-neutral-800/30 px-2.5 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                              ✓
                            </span>
                            <div className="min-w-0">
                              <Link
                                to={`/problems/${item.questionId}`}
                                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                              >
                                {item.questionName}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${diffTone}`}>
                                  {item.difficultyLevel || 'Medium'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  #{item.questionId}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {formattedDate}
                            </span>
                            <Link
                              to={`/problems/${item.questionId}`}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              <span>Solve</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* TAB CONTENT: Attempted Questions */}
              {activeTab === 'attempted' && (
                filteredAttemptedItems.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-slate-400">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {searchQuery ? 'No attempted problems match your query' : 'No problem attempts recorded'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Any code execution or test attempt on practice problems will be tracked here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {filteredAttemptedItems.map((item) => {
                      const diff = (item.difficulty || 'Medium').toUpperCase();
                      const isEasy = diff.includes('EASY');
                      const isHard = diff.includes('HARD');
                      const diffTone = isEasy
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                        : isHard
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/50';

                      const date = item.submittedDate ? new Date(item.submittedDate) : null;
                      const formattedDate = date && !isNaN(date.getTime())
                        ? date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—';

                      return (
                        <div
                          key={`attempted-${item.questionId}`}
                          className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-neutral-800/30 px-2.5 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                              #
                            </span>
                            <div className="min-w-0">
                              <Link
                                to={`/problems/${item.questionId}`}
                                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                              >
                                {item.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${diffTone}`}>
                                  {item.difficulty || 'Medium'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  #{item.questionId}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {formattedDate}
                            </span>
                            <Link
                              to={`/problems/${item.questionId}`}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                            >
                              <span>Resume</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* TAB CONTENT: Bookmarks */}
              {activeTab === 'bookmarks' && (
                filteredBookmarks.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-slate-400">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {searchQuery ? 'No bookmarks match your query' : 'No bookmarked challenges yet'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Click the bookmark icon on any problem or aptitude question to save it for quick revision.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                    <RequestStatus
                      pending={bookmarksLoading}
                      error={bookmarksError}
                      onRetry={() => dispatch(fetchBookmarks({ force: true }))}
                      label="Loading bookmarks…"
                    />
                    {filteredBookmarks.map((b) => (
                      <div
                        key={b.id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-neutral-800/30 px-2.5 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Bookmark className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <Link
                              to={b.type === 'PROBLEM' ? `/problems/${b.itemId}` : '/practice'}
                              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                            >
                              {b.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400">
                                {b.type}
                              </span>
                              {b.difficulty && (
                                <span className="text-[10px] font-semibold text-slate-500">
                                  {b.difficulty}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link
                          to={b.type === 'PROBLEM' ? `/problems/${b.itemId}` : '/practice'}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
                        >
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Edit Academic Details Modal */}
      <EditAcademicModal
        isOpen={isAcademicModalOpen}
        onClose={() => setIsAcademicModalOpen(false)}
        onSubmit={handleSaveAcademic}
        initialData={userInfo}
        defaultCollege={userInfo?.college || ''}
        genderOptions={genderOptions}
        submitting={submitting}
      />
    </div>
  );
};

export { UserProfilePage as ProfileSettings, UserProfilePage as UserProfile };
export default UserProfilePage;
