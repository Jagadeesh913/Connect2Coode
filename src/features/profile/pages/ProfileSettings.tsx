import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchUserProfile,
  updateUserProfile,
  saveUserInfoThunk,
} from '../redux/profileSlice';
import { profileService } from '../../../services/profileService';
import { userQuestionService } from '../../../services/userQuestionService';
import { institutionService } from '../../../services/institutionService';
import type {
  UserInfoData,
  Institution,
  SaveUserInfoPayload,
} from '../../../core/types/domain';
import { getActionableErrorMessage } from '../../../core/validation';

// Modals
import { EditPersonalInfoModal } from '../components/modals/EditPersonalInfoModal';
import { EditAcademicModal } from '../components/modals/EditAcademicModal';
import { UploadPhotoModal } from '../components/modals/UploadPhotoModal';
import { toast } from 'react-hot-toast';
import { openAuthModal, generatePasswordResetOtpThunk } from '../../auth/redux/authSlice';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { decodeJwtPayload } from '../../../core/security/jwt';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import { ProfilePageSkeleton } from '../../../shared/components/ui/Skeleton';
import { useTheme } from '../../../shared/context/ThemeContext';

// Lucide Icons
import {
  User,
  Pencil,
  Mail,
  Camera,
  SquareCode,
  TrendingUp,
  Star,
  Flame,
  GraduationCap,
  Settings,
  Lock,
  Bell,
  Moon,
  Globe,
  AtSign,
  Hash,
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { setTheme } = useTheme();

  const { profile, loading: profileLoading, error: profileError } = useAppSelector((state) => state.profile);
  const reduxUserInfo = useAppSelector((state) => state.profile.userInfo);
  const authUser = useAppSelector((state) => state.auth.user);

  // Modals state
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState<boolean>(false);
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Local state for userInfo and institution (populated from backend API)
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);

  // Live real question stats from backend API
  const [liveSolvedCount, setLiveSolvedCount] = useState<number | null>(null);
  const [liveAttemptedCount, setLiveAttemptedCount] = useState<number | null>(null);
  const [recentAttemptsCount, setRecentAttemptsCount] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // Fallback progress state from Redux
  const solvedByProblemId = useAppSelector((state) => state.progress.solvedByProblemId);
  const attemptedByProblemId = useAppSelector((state) => state.progress.attemptedByProblemId);

  // Preferences local state
  const [emailNotifications, setEmailNotifications] = useState<boolean>(() => {
    const saved = localStorage.getItem('c2c_email_notifications');
    return saved !== null ? saved === 'true' : true;
  });

  const [themePreference, setThemePreference] = useState<string>(() => {
    return localStorage.getItem('c2c_theme_pref') || 'system';
  });

  const [languagePreference, setLanguagePreference] = useState<string>(() => {
    return localStorage.getItem('c2c_language') || 'English';
  });

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

    const token = tokenStorage.getAccessToken();
    if (token) {
      const decoded = decodeJwtPayload(token);
      if (decoded) {
        const fromJwt = parseNum((decoded as any).userId) ?? parseNum((decoded as any).id);
        if (fromJwt) return fromJwt;
      }
    }
    return null;
  }, [authUser, profile]);

  // Refs to guarantee profile and user-info are only fetched once per user session
  const hasFetchedProfileRef = useRef(false);
  const fetchedUserIdRef = useRef<string | number | null>(null);

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

  const [academicLoading, setAcademicLoading] = useState(false);
  const [academicError, setAcademicError] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [sectionRetry, setSectionRetry] = useState(0);

  // Initial Data Fetching from real API
  useEffect(() => {
    let active = true;
    if (!hasFetchedProfileRef.current) {
      hasFetchedProfileRef.current = true;
      void dispatch(fetchUserProfile());
    }

    if (effectiveUserId) {
      fetchedUserIdRef.current = effectiveUserId;
      setAcademicLoading(true);
      setAcademicError(null);
      void (async () => {
        let cachedAcademic: any = null;
        try {
          const raw = localStorage.getItem(`c2c_user_academic_${effectiveUserId}`);
          if (raw) cachedAcademic = JSON.parse(raw);
        } catch {}

        try {
          const res = await profileService.getUserInfo(effectiveUserId);
          if (!active) return;
          if (res?.data) {
            setUserInfo({
              ...res.data,
              ...(cachedAcademic || {}),
            });
            return;
          }
        } catch {
          if (active) setAcademicError('Unable to refresh academic details.');
        } finally {
          if (active) setAcademicLoading(false);
        }

        if (active && cachedAcademic) {
          setUserInfo(cachedAcademic);
        }
      })();
    }
    return () => { active = false; };
  }, [dispatch, effectiveUserId, sectionRetry]);

  // Fetch real question statistics from live backend APIs
  useEffect(() => {
    if (!effectiveUserId) return;

    let isMounted = true;

    const fetchLiveStats = async () => {
      setActivityLoading(true);
      setActivityError(null);
      try {
        const [solvedList, attemptedList] = await Promise.all([
          userQuestionService.getSolvedQuestions(effectiveUserId),
          userQuestionService.getAttemptedQuestions(effectiveUserId),
        ]);

        if (!isMounted) return;

        if (Array.isArray(solvedList)) {
          setLiveSolvedCount(solvedList.length);
        }
        if (Array.isArray(attemptedList)) {
          setLiveAttemptedCount(attemptedList.length);

          // Weekly attempts calculation
          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const weekly = attemptedList.filter((item) => {
            const raw = item.submittedDate || (item as any).createdAt;
            if (!raw) return false;
            const time = new Date(raw).getTime();
            return !isNaN(time) && time >= oneWeekAgo;
          }).length;
          setRecentAttemptsCount(weekly);

          // Streak calculation
          const streak = calculateStreak(attemptedList as any);
          setCurrentStreak(streak);
        }
      } catch {
        if (isMounted) setActivityError('Unable to refresh activity. Previously saved progress is shown.');
      } finally {
        if (isMounted) setActivityLoading(false);
      }
    };

    void fetchLiveStats();

    return () => {
      isMounted = false;
    };
  }, [effectiveUserId, sectionRetry]);

  // Synchronize Redux User Info when updated
  useEffect(() => {
    if (reduxUserInfo) {
      let cachedAcademic: any = null;
      if (effectiveUserId) {
        try {
          const raw = localStorage.getItem(`c2c_user_academic_${effectiveUserId}`);
          if (raw) cachedAcademic = JSON.parse(raw);
        } catch {}
      }
      setUserInfo({
        ...reduxUserInfo,
        ...(cachedAcademic || {}),
      });
    }
  }, [reduxUserInfo, effectiveUserId]);

  // Synchronize institution from profile if available
  useEffect(() => {
    if (profile?.institution) {
      setInstitution(profile.institution);
    }
  }, [profile?.institution]);

  // Auto-enrich institution metadata from real API if college is present
  useEffect(() => {
    const collegeName = userInfo?.college || profile?.collegeName;
    if (!collegeName || (institution?.name && institution.name.toLowerCase() === collegeName.toLowerCase())) return;

    let isCancelled = false;
    institutionService.searchInstitutions(collegeName).then((res) => {
      if (isCancelled) return;
      const list = res?.data || [];
      if (list.length > 0) {
        const cleanedQuery = collegeName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = list.find((item) => {
          const itemClean = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return itemClean.includes(cleanedQuery) || cleanedQuery.includes(itemClean);
        }) || list[0];

        if (match) {
          setInstitution({
            id: match.id,
            name: match.name.replace(/^"+|"+$/g, '').trim(),
            institutionType: match.institutionType,
            state: match.state,
            district: match.district,
            isActive: true,
            aisheCode: '',
          });
        }
      }
    }).catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [userInfo?.college, profile?.collegeName, institution?.name]);

  // Handle Personal Info Submit
  const handleSavePersonalInfo = async (data: any) => {
    setSubmitting(true);
    try {
      await dispatch(
        updateUserProfile({
          fullName: data.fullName,
          email: data.email,
          bio: data.bio,
        })
      ).unwrap();

      // If user provided a bio, update it on the backend via userInfo API as well
      if (effectiveUserId) {
        try {
          const currentYear = new Date().getFullYear();
          const token = tokenStorage.getAccessToken();
          const res = await dispatch(
            saveUserInfoThunk({
              userId: effectiveUserId,
              payload: {
                id: userInfo?.id ? Number(userInfo.id) : undefined,
                userId: Number(effectiveUserId),
                regNumber: userInfo?.regNumber || '',
                joinedYear: Number(userInfo?.joinedYear) || currentYear - 2,
                passedOutYear: Number(userInfo?.passedOutYear) || currentYear + 2,
                college: userInfo?.college || '',
                bio: (data.bio !== undefined ? data.bio : userInfo?.bio) || '',
                token: token || undefined,
              },
            })
          ).unwrap();
          if (res) {
            setUserInfo(res);
          }
        } catch {}
      }

      toast.success('Personal information updated successfully.');
      setIsPersonalModalOpen(false);
    } catch (err: any) {
      const errorMsg = getActionableErrorMessage(
        err,
        'Unable to save personal information. Please try again.'
      );
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Academic Info Submit -> POST /api/v1/userInfo/{userId}
  const handleSaveAcademic = async (data: any) => {
    if (!effectiveUserId) {
      toast.error('Please log in to save academic details.');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }

    setSubmitting(true);
    try {
      const currentYear = new Date().getFullYear();
      const token = tokenStorage.getAccessToken();
      const payload: SaveUserInfoPayload = {
        id: userInfo?.id ? Number(userInfo.id) : undefined,
        userId: Number(effectiveUserId),
        regNumber: (data.regNumber || '').trim(),
        joinedYear: Number(data.joinedYear) || currentYear - 2,
        passedOutYear: Number(data.passedOutYear) || currentYear + 2,
        college: (data.college || '').trim(),
        bio: (data.bio || '').trim(),
        token: token || undefined,
      };

      let savedData: UserInfoData | null = null;
      try {
        savedData = await dispatch(
          saveUserInfoThunk({
            userId: effectiveUserId,
            payload,
          })
        ).unwrap();
      } catch {
        // Backend returned error (e.g. unique constraint violation on re-insert)
      }

      const mergedUserInfo: UserInfoData = {
        ...(userInfo || {}),
        ...(savedData || {}),
        userId: Number(effectiveUserId),
        regNumber: payload.regNumber,
        joinedYear: payload.joinedYear,
        passedOutYear: payload.passedOutYear,
        college: payload.college,
        bio: payload.bio,
      };

      setUserInfo(mergedUserInfo);

      try {
        localStorage.setItem(`c2c_user_academic_${effectiveUserId}`, JSON.stringify(mergedUserInfo));
      } catch {}

      if (payload.college) {
        setInstitution((prev) => ({
          id: prev?.id ?? 0,
          name: payload.college,
          institutionType: prev?.institutionType ?? 'COLLEGE',
          state: prev?.state ?? '',
          district: prev?.district ?? '',
          isActive: true,
          aisheCode: prev?.aisheCode ?? '',
        } as Institution));
      }

      await dispatch(
        updateUserProfile({
          collegeName: data.college,
          bio: data.bio,
        })
      );

      toast.success('Academic details saved successfully.');
      setIsAcademicModalOpen(false);
    } catch (err: any) {
      const errorMsg = getActionableErrorMessage(
        err,
        'Unable to save academic details. Please try again.'
      );
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Avatar Change
  const handleSaveAvatar = async (url: string) => {
    setSubmitting(true);
    try {
      await dispatch(
        updateUserProfile({
          avatarUrl: url,
        })
      ).unwrap();
      toast.success('Profile photo updated successfully.');
      setIsPhotoModalOpen(false);
    } catch (err: any) {
      const errorMsg = getActionableErrorMessage(
        err,
        'Unable to update profile photo. Please try again.'
      );
      toast.error(errorMsg);
    } finally {
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
  const handleThemeChange = (newPref: string) => {
    setThemePreference(newPref);
    localStorage.setItem('c2c_theme_pref', newPref);
    if (newPref === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else if (newPref === 'light' || newPref === 'dark') {
      setTheme(newPref);
    }
  };

  // Notification toggle handler
  const handleToggleNotifications = () => {
    setEmailNotifications((prev) => {
      const next = !prev;
      localStorage.setItem('c2c_email_notifications', String(next));
      toast.success(next ? 'Email notifications enabled' : 'Email notifications disabled');
      return next;
    });
  };

  // Language selection handler
  const handleLanguageChange = (newLang: string) => {
    setLanguagePreference(newLang);
    localStorage.setItem('c2c_language', newLang);
    toast.success(`Language set to ${newLang}`);
  };

  // Calculated display metrics from real API data
  const fallbackSolved = Object.values(solvedByProblemId).filter(Boolean).length;
  const fallbackAttempted = Object.values(attemptedByProblemId).filter(Boolean).length;

  const displaySolved = liveSolvedCount !== null ? liveSolvedCount : fallbackSolved;
  const displayAttempted =
    liveAttemptedCount !== null ? liveAttemptedCount : fallbackAttempted || displaySolved;
  const displayAccuracy =
    displayAttempted > 0
      ? Math.round((displaySolved / displayAttempted) * 100)
      : displaySolved > 0
      ? 100
      : 0;

  // Real User Profile Values (Driven strictly from session & API)
  const fullName =
    profile?.fullName ||
    (profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ''}`.trim()
      : authUser?.fullName || (authUser as any)?.username || 'User');

  const email = profile?.email || authUser?.email || '';

  const userName =
    (authUser as any)?.userName ||
    (authUser as any)?.labelUserName ||
    (profile as any)?.userName ||
    (profile as any)?.labelUserName ||
    (email ? email.split('@')[0] : 'developer');

  const roleName = useMemo(() => {
    const rawRole = (profile?.role || authUser?.role || 'STUDENT').toUpperCase();
    if (rawRole.includes('ADMIN')) return 'Admin';
    if (rawRole.includes('FACULTY') || rawRole.includes('COLLEGE')) return 'Faculty';
    return 'Student';
  }, [profile?.role, authUser?.role]);

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
  const regNumber = userInfo?.regNumber || profile?.regNumber || '';
  const collegeName = userInfo?.college || institution?.name || profile?.collegeName || '';
  const joinedYear = userInfo?.joinedYear || profile?.joinedYear;
  const passedOutYear = userInfo?.passedOutYear || profile?.graduationYear || profile?.passedOutYear;
  const bio = userInfo?.bio || profile?.bio || '';

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const token = tokenStorage.getAccessToken();

  if (!isAuthenticated && !token) {
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

  if ((profileLoading || !profileError) && !profile) {
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
              {/* Avatar Container with Camera Badge */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#DCEBFF] dark:bg-blue-950/70 text-[#1E40AF] dark:text-blue-300 font-bold text-2xl sm:text-3xl flex items-center justify-center overflow-hidden shadow-inner ring-4 ring-white dark:ring-neutral-800">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  title="Upload Profile Picture"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1E3A8A] hover:bg-blue-800 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer border-2 border-white dark:border-neutral-900"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* User Identity Info */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {fullName}
                  </h1>
                  <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2FE] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    {roleName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{userName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{email}</span>
                  </div>
                  {effectiveUserId && (
                    <div className="flex items-center gap-1 text-slate-400 font-mono text-xs">
                      <Hash className="w-3 h-3" />
                      <span>{effectiveUserId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Edit Profile Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setIsPersonalModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-all cursor-pointer shadow-xs bg-white dark:bg-neutral-900"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Personal Info</span>
              </button>
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
                {displaySolved}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Keep going! 🎯
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
                {displayAttempted}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {recentAttemptsCount > 0 ? `+${recentAttemptsCount} this week` : 'Consistent progress!'}
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
                {displayAccuracy}%
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Overall submission rate
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
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {currentStreak > 0 ? 'Great consistency! 🔥' : 'Start solving today! 🔥'}
              </p>
            </div>
          </div>
        </div>

        {/* 2x2 Detailed Information Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Card 1: Personal Information */}
          <div
            id="personal-card"
            className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-xs space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Personal Information
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPersonalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            {/* Key-Value Rows (Only real verified session/API fields) */}
            <div className="space-y-0 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-white/5">
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">Full Name</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium flex-1 text-left min-w-0 break-words">
                  {fullName || '—'}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">Username</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono flex-1 text-left min-w-0 break-words">
                  @{userName}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">Email Address</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium flex-1 text-left min-w-0 break-all">
                  {email || '—'}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">Platform Role</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium flex-1 text-left min-w-0">
                  {roleName}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0">User Account ID</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono flex-1 text-left min-w-0">
                  #{effectiveUserId || '—'}
                </span>
              </div>
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0 pt-0.5">About / Bio</span>
                <span className="text-slate-700 dark:text-slate-300 flex-1 text-left italic text-xs leading-relaxed min-w-0 break-words">
                  {bio || 'No bio provided yet.'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Academic Details */}
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
                    Academic Details
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

            {/* Key-Value Rows (Only real fields in /userInfo/{userId}) */}
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
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 sm:w-2/5 shrink-0 pt-0.5">Academic Bio</span>
                <span className="text-slate-700 dark:text-slate-300 flex-1 text-left italic text-xs leading-relaxed min-w-0 break-words">
                  {bio || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Account & Preferences */}
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
                  Account & Preferences
                </h2>
              </div>
            </div>

            {/* Preference Items */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Row 1: Password */}
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

              {/* Row 2: Email Notifications */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      Email Notifications
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Get updates about new problems, contests and more
                    </p>
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailNotifications}
                    onClick={handleToggleNotifications}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      emailNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        emailNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Row 3: Theme Preference */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      Theme Preference
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Choose your preferred appearance
                    </p>
                  </div>
                </div>
                <div>
                  <select
                    value={themePreference}
                    onChange={(e) => handleThemeChange(e.target.value)}
                    className="text-xs font-medium bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Language */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      Language
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Choose your interface language
                    </p>
                  </div>
                </div>
                <div>
                  <select
                    value={languagePreference}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="text-xs font-medium bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Personal Information Modal */}
      <EditPersonalInfoModal
        isOpen={isPersonalModalOpen}
        onClose={() => setIsPersonalModalOpen(false)}
        onSubmit={handleSavePersonalInfo}
        initialData={profile ? { ...profile, bio: userInfo?.bio || profile?.bio || '' } : null}
        submitting={submitting}
      />


      {/* Edit Academic Details Modal */}
      <EditAcademicModal
        isOpen={isAcademicModalOpen}
        onClose={() => setIsAcademicModalOpen(false)}
        onSubmit={handleSaveAcademic}
        initialData={userInfo}
        defaultCollege={userInfo?.college || institution?.name || profile?.collegeName || ''}
        submitting={submitting}
      />

      {/* Upload Photo Modal */}
      <UploadPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSaveAvatar={handleSaveAvatar}
        currentAvatar={profile?.avatarUrl}
        submitting={submitting}
      />
    </div>
  );
};

export { UserProfilePage as ProfileSettings, UserProfilePage as UserProfile };
export default UserProfilePage;
