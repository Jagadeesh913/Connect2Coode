import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchUserProfile,
  fetchUserInfoThunk,
  saveUserInfoThunk,
} from '../redux/profileSlice';
import type { SaveUserInfoPayload } from '../../../core/types/domain';
import { getActionableErrorMessage } from '../../../core/validation';

// Modals
import { EditAcademicModal } from '../components/modals/EditAcademicModal';
import { toast } from '@/shared/notifications/toast';
import { openAuthModal, generatePasswordResetOtpThunk } from '../../auth/redux/authSlice';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { hydrateProgress } from '../../progress/redux/progressSlice';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import { ProfilePageSkeleton } from '../../../shared/components/ui/Skeleton';
import type { AcademicDetailsFormData } from '../../../core/validation';
import { useReferenceGroup } from '../../references/hooks/useReferenceGroup';

// Lucide Icons
import {
  Mail,
  SquareCode,
  TrendingUp,
  Star,
  Flame,
  GraduationCap,
  Settings,
  Lock,
  Pencil,
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
    const key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() - 181);
  return Array.from({ length: 182 }, (_, offset) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + offset);
    const key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    return {
      key,
      attempts: counts.get(key) || 0,
      label: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    };
  });
};

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
  // Modals state
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const mutationPendingRef = useRef(false);

  const {
    solvedItems,
    attemptedItems,
    loading: activityLoading,
    error: activityError,
  } = useAppSelector((state) => state.progress);

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
        // Remove the legacy browser cache: academic records are server-owned.
        localStorage.removeItem(`c2c_user_academic_${effectiveUserId}`);
      } catch {}
      const request = dispatch(
        fetchUserInfoThunk({ userId: effectiveUserId, force: sectionRetry > 0 })
      );
      const progressRequest = dispatch(
        hydrateProgress({ userId: effectiveUserId, force: sectionRetry > 0 })
      );
      return () => {
        request.abort();
        progressRequest.abort();
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
      const selectedGenderId = data.genderId ?? null;
      const gender = selectedGenderId
        ? genderReferences.find((reference) => reference.id === selectedGenderId) ||
          (userInfo?.gender?.id === selectedGenderId ? userInfo.gender : null)
        : null;
      if (selectedGenderId && !gender) {
        throw new Error('The selected gender is no longer available. Refresh the page and try again.');
      }
      const payload: SaveUserInfoPayload = {
        id: userInfo?.id !== undefined && userInfo?.id !== null ? Number(userInfo.id) : null,
        userId: Number(effectiveUserId),
        regNumber: (data.regNumber || '').trim(),
        joinedYear: Number(data.joinedYear),
        passedOutYear: Number(data.passedOutYear),
        college: (data.college || '').trim(),
        collegeId: data.collegeId ?? null,
        bio: (data.bio || '').trim(),
        gender,
        dob: data.dob?.trim() || null,
      };

      // Direct unwrap: any backend error throws directly into catch block
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

  // Password reset handler
  const handleChangePassword = async () => {
    const targetEmail = authUser?.email || profile?.email;
    if (!targetEmail) {
      toast.error('Email not found. Please log in again.');
      return;
    }
    try {
      await dispatch(generatePasswordResetOtpThunk(targetEmail)).unwrap();
      toast.success(`Password reset OTP sent to ${targetEmail}`);
      dispatch(openAuthModal({ mode: 'forgot' }));
    } catch (err: any) {
      toast.error(err || 'Failed to send reset OTP');
    }
  };

  // Theme switch handler
  // Real live question statistics strictly from backend API (no mockups / fake fallbacks)
  const realSolvedCount = solvedItems.length;
  const realAttemptedCount = attemptedItems.length;
  const realAccuracy =
    realAttemptedCount > 0 ? Math.round((realSolvedCount / realAttemptedCount) * 100) : 0;
  const realStreak = calculateStreak(attemptedItems);

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
  const genderOptions = useMemo(() => {
    const byId = new Map<number, typeof genderReferences[number]>();
    if (userInfo?.gender) byId.set(userInfo.gender.id, userInfo.gender);
    genderReferences.forEach((gender) => {
      if (gender.isActive) byId.set(gender.id, gender);
    });
    return [...byId.values()];
  }, [genderReferences, userInfo?.gender]);
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
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#070A13] font-sans transition-colors duration-200 overflow-x-hidden pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <RequestStatus pending={profileLoading} error={profileError} onRetry={() => dispatch(fetchUserProfile({ force: true }))} label="Loading profile…" />
        <RequestStatus pending={academicLoading || activityLoading} error={academicError || activityError} onRetry={() => setSectionRetry((value) => value + 1)} label="Loading academic details and activity…" />
        {/* Top Profile Banner Card */}
        <div className="relative bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-xs overflow-hidden">
          {/* Right Decorative Pastel Gradient Wave */}
          <div
            className="absolute top-0 right-0 h-full w-2/5 pointer-events-none opacity-80"
            style={{
              background:
                'radial-gradient(ellipse at 100% 50%, rgba(220, 215, 254, 0.45) 0%, rgba(238, 242, 255, 0.25) 50%, transparent 80%)',
            }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Left: Avatar + User Details */}
            <div className="flex items-center gap-5 sm:gap-6">
              {/* Session identity is display-only until a verified avatar API exists. */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#DCEBFF] dark:bg-blue-950/70 text-[#1E40AF] dark:text-blue-300 font-bold text-2xl sm:text-3xl flex items-center justify-center overflow-hidden shadow-inner ring-4 ring-white dark:ring-neutral-800">
                  <span>{initials}</span>
                </div>
              </div>

              {/* User Identity Info */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {fullName}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{email}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 4 KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Problems Solved */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EAFBF3] dark:bg-emerald-950/40 text-[#10B981] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <SquareCode className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Problems Solved</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                {realSolvedCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Solved questions
              </p>
            </div>
          </div>

          {/* 2. Total Attempts */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F4EFFE] dark:bg-purple-950/40 text-[#9333EA] dark:text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Attempts</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                {realAttemptedCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Attempted questions
              </p>
            </div>
          </div>

          {/* 3. Accuracy */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FEF6E7] dark:bg-amber-950/40 text-[#F59E0B] dark:text-amber-400 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Accuracy</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                {realAccuracy}%
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Solved / Attempted
              </p>
            </div>
          </div>

          {/* 4. Current Streak */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EAF4FE] dark:bg-blue-950/40 text-[#3B82F6] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 fill-blue-500 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current Streak</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                {realStreak} {realStreak === 1 ? 'day' : 'days'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Consecutive active days
              </p>
            </div>
          </div>
        </div>

        <section className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Practice activity</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Your recorded practice attempts over the last 26 weeks.</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {attemptedItems.length} {attemptedItems.length === 1 ? 'recorded attempt' : 'recorded attempts'}
            </span>
          </div>
          <div
            className="mt-5 grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1"
            style={{ gridTemplateColumns: `repeat(${Math.ceil(activityCells.length / 7)}, minmax(0, 1fr))` }}
            aria-label="Practice activity heat map"
          >
            {activityCells.map((cell) => {
              const tone = cell.attempts === 0
                ? 'bg-slate-100 dark:bg-slate-800'
                : cell.attempts === 1
                  ? 'bg-emerald-200 dark:bg-emerald-800'
                  : cell.attempts === 2
                    ? 'bg-emerald-400 dark:bg-emerald-600'
                    : 'bg-emerald-600 dark:bg-emerald-400';
              return (
                <span
                  key={cell.key}
                  title={`${cell.label}: ${cell.attempts} ${cell.attempts === 1 ? 'attempt' : 'attempts'}`}
                  aria-label={`${cell.label}: ${cell.attempts} ${cell.attempts === 1 ? 'attempt' : 'attempts'}`}
                  className={`h-3.5 min-w-3.5 rounded-[3px] ${tone}`}
                />
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-500 dark:text-slate-400" aria-hidden="true">
            <span>Less</span>
            <i className="h-3 w-3 rounded-[3px] bg-slate-100 dark:bg-slate-800" />
            <i className="h-3 w-3 rounded-[3px] bg-emerald-200 dark:bg-emerald-800" />
            <i className="h-3 w-3 rounded-[3px] bg-emerald-400 dark:bg-emerald-600" />
            <i className="h-3 w-3 rounded-[3px] bg-emerald-600 dark:bg-emerald-400" />
            <span>More</span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* User-info API details */}
          <div
            id="academic-card"
            className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-xs space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Profile details
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAcademicModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>{regNumber || collegeName ? 'Edit' : 'Add Info'}</span>
              </button>
            </div>

            {/* API-backed user-info rows */}
            <div className="space-y-0 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-white/5">
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">Registration Number</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono font-bold flex-1 text-left min-w-0 break-words">
                  {regNumber || '—'}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">College / Institute</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium flex-1 text-left min-w-0 break-words">
                  {collegeName || '—'}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">Joined Year</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium flex-1 text-left min-w-0">
                  {joinedYear || '—'}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">Graduation Year</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium flex-1 text-left min-w-0">
                  {passedOutYear || '—'}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">Gender</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium flex-1 text-left min-w-0">
                  {genderName || '—'}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">Date of birth</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium flex-1 text-left min-w-0">
                  {dateOfBirth || '—'}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0 pt-0.5">Academic Bio</span>
                <span className="text-slate-700 dark:text-slate-300 flex-1 text-left italic text-xs leading-relaxed min-w-0 break-words">
                  {bio || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Account security */}
          <div
            id="preferences-card"
            className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-xs space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Account Security
                </h2>
              </div>
            </div>

            {/* API-backed account action */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Password reset uses the authentication API. */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Password
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-slate-700 dark:text-slate-300 tracking-widest text-sm">
                    ••••••••
                  </span>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>

            </div>
          </div>
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
