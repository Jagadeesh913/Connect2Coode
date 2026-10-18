import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchUserProfile,
  updateUserProfile,
  saveUserInfoThunk,
} from '../redux/profileSlice';
import { profileService } from '../../../services/profileService';
import type {
  UserInfoData,
  Institution,
  SaveUserInfoPayload,
} from '../../../core/types/domain';
import { getActionableErrorMessage } from '../../../core/validation';

// Profile UI Components
import { ProfileSidebarNav } from '../components/ProfileSidebarNav';
import { ProfileHero } from '../components/ProfileHero';
import { ProfileTabs, ProfileTabType } from '../components/ProfileTabs';
import { PersonalInfoCard } from '../components/PersonalInfoCard';
import { ProfilePhotoCard } from '../components/ProfilePhotoCard';
import { InstitutionInfoCard } from '../components/InstitutionInfoCard';
import { AcademicDetailsCard } from '../components/AcademicDetailsCard';
import { ProfileCompletionCard } from '../components/ProfileCompletionCard';
import { ProfileActivityCard } from '../components/ProfileActivityCard';

import { EditPersonalInfoModal } from '../components/modals/EditPersonalInfoModal';
import { EditInstitutionModal } from '../components/modals/EditInstitutionModal';
import { EditAcademicModal, AcademicFormData } from '../components/modals/EditAcademicModal';
import { UploadPhotoModal } from '../components/modals/UploadPhotoModal';
import { toast } from 'react-hot-toast';
import { openAuthModal, generatePasswordResetOtpThunk } from '../../auth/redux/authSlice';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { decodeJwtPayload } from '../../../core/security/jwt';

export const UserProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile.profile);
  const reduxUserInfo = useAppSelector((state) => state.profile.userInfo);
  const authUser = useAppSelector((state) => state.auth.user);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ProfileTabType>('overview');

  // Modals state
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState<boolean>(false);
  const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState<boolean>(false);
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Local state for userInfo and institution (strictly populated from backend API)
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);

  const bookmarks = useAppSelector((state) => state.bookmarks.bookmarks);
  const solvedByProblemId = useAppSelector((state) => state.progress.solvedByProblemId);
  const attemptedByProblemId = useAppSelector((state) => state.progress.attemptedByProblemId);

  // Effective User ID from authenticated session
  const effectiveUserId = useMemo(() => {
    if (authUser?.id) return authUser.id;
    if ((authUser as any)?.userId) return (authUser as any).userId;
    if (profile?.id) return profile.id;
    const stored = tokenStorage.getUser();
    if (stored?.id) return stored.id;
    if ((stored as any)?.userId) return (stored as any).userId;
    const token = tokenStorage.getAccessToken();
    if (token) {
      const decoded = decodeJwtPayload(token);
      if (decoded) {
        return (decoded as any).userId || (decoded as any).id || (decoded as any).sub || null;
      }
    }
    return null;
  }, [authUser, profile]);

  // Refs to guarantee profile and user-info are only fetched once per user session
  const hasFetchedProfileRef = React.useRef(false);
  const fetchedUserIdRef = React.useRef<string | number | null>(null);

  // Initial Data Fetching from real API
  useEffect(() => {
    if (!hasFetchedProfileRef.current) {
      hasFetchedProfileRef.current = true;
      void dispatch(fetchUserProfile());
    }

    if (effectiveUserId && fetchedUserIdRef.current !== effectiveUserId) {
      fetchedUserIdRef.current = effectiveUserId;
      void (async () => {
        try {
          const res = await profileService.getUserInfo(effectiveUserId);
          if (res?.data) {
            setUserInfo(res.data);
          }
        } catch {
          // Silently handle if unauthenticated or new profile
        }
      })();
    }
  }, [dispatch, effectiveUserId]);

  // Synchronize Redux User Info when updated
  useEffect(() => {
    if (reduxUserInfo) {
      setUserInfo(reduxUserInfo);
    }
  }, [reduxUserInfo]);

  // Synchronize institution from profile if available
  useEffect(() => {
    if (profile?.institution) {
      setInstitution(profile.institution);
    }
  }, [profile?.institution]);

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
          const res = await dispatch(
            saveUserInfoThunk({
              userId: effectiveUserId,
              payload: {
                regNumber: userInfo?.regNumber || '',
                joinedYear: Number(userInfo?.joinedYear) || new Date().getFullYear(),
                passedOutYear: Number(userInfo?.passedOutYear) || new Date().getFullYear() + 2,
                college: userInfo?.college || '',
                bio: (data.bio !== undefined ? data.bio : userInfo?.bio) || '',
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
      const errorMsg = getActionableErrorMessage(err, 'Unable to save personal information. Please try again.');
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Institution Info Submit -> POST /api/v1/userInfo/{userId}
  const handleSaveInstitution = async (instData: Partial<Institution>) => {
    const collegeName = instData.name?.trim();
    if (!collegeName) {
      toast.error('Please enter a college or university name.');
      return;
    }

    if (!effectiveUserId) {
      toast.error('Please log in to link institution.');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }

    setSubmitting(true);
    try {
      const currentYear = new Date().getFullYear();
      const payload: SaveUserInfoPayload = {
        regNumber: userInfo?.regNumber || '',
        joinedYear: Number(userInfo?.joinedYear) || currentYear - 2,
        passedOutYear: Number(userInfo?.passedOutYear) || currentYear + 2,
        college: collegeName,
        bio: userInfo?.bio || '',
      };

      const result = await dispatch(
        saveUserInfoThunk({
          userId: effectiveUserId,
          payload,
        })
      ).unwrap();

      if (result) {
        setUserInfo(result);
      } else {
        setUserInfo((prev) => ({
          ...prev,
          ...payload,
        }));
      }

      setInstitution((prev) => ({
        id: instData.id ?? prev?.id ?? 0,
        name: collegeName,
        institutionType: instData.institutionType ?? prev?.institutionType ?? 'COLLEGE',
        ...prev,
        ...instData,
      } as Institution));

      await dispatch(
        updateUserProfile({
          collegeName,
        })
      );

      toast.success('Institution updated successfully.');
      setIsInstitutionModalOpen(false);
    } catch (err: any) {
      const errorMsg = getActionableErrorMessage(err, 'Unable to update institution. Please try again.');
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Academic Info Submit -> POST /api/v1/userInfo/{userId}
  const handleSaveAcademic = async (data: AcademicFormData) => {
    if (!effectiveUserId) {
      toast.error('Please log in to save academic details.');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }

    setSubmitting(true);
    try {
      const currentYear = new Date().getFullYear();
      const payload: SaveUserInfoPayload = {
        regNumber: (data.regNumber || '').trim(),
        joinedYear: Number(data.joinedYear) || currentYear - 2,
        passedOutYear: Number(data.passedOutYear) || currentYear + 2,
        college: (data.college || '').trim(),
        bio: (data.bio || '').trim(),
      };

      const result = await dispatch(
        saveUserInfoThunk({
          userId: effectiveUserId,
          payload,
        })
      ).unwrap();

      if (result) {
        setUserInfo(result);
      } else {
        setUserInfo((prev) => ({
          ...prev,
          ...payload,
        }));
      }

      if (payload.college) {
        setInstitution((prev) => ({
          id: prev?.id ?? 0,
          name: payload.college,
          institutionType: prev?.institutionType ?? 'COLLEGE',
          ...prev,
        } as Institution));
      }

      await dispatch(
        updateUserProfile({
          degree: data.degree,
          branch: data.branch,
          collegeName: data.college,
          bio: data.bio,
        })
      );

      toast.success('Academic details saved successfully.');
      setIsAcademicModalOpen(false);
    } catch (err: any) {
      const errorMsg = getActionableErrorMessage(err, 'Unable to save academic details. Please try again.');
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
      const errorMsg = getActionableErrorMessage(err, 'Unable to update profile photo. Please try again.');
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const solvedCount = Object.values(solvedByProblemId).filter(Boolean).length;
  const attemptedCount = Object.values(attemptedByProblemId).filter(Boolean).length;

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const token = tokenStorage.getAccessToken();

  if (!isAuthenticated && !token) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[65vh] font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 px-4">
        <div className="text-center p-8 max-w-md w-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 text-2xl">
            <i className="fa-solid fa-lock"></i>
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

  return (
    <div className="w-full min-h-screen bg-[#FFFFFF] dark:bg-[#070A13] font-sans transition-colors duration-200 overflow-x-hidden pb-16">
      {/* Ambient background glows */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Link
            to="/practice"
            className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
          >
            <i className="fa-solid fa-house text-[11px]"></i>
            <span>Home</span>
          </Link>
          <span className="text-gray-300 dark:text-neutral-700">/</span>
          <span className="text-gray-900 dark:text-gray-200 font-bold">User Profile</span>
        </nav>

        {/* Outer Flex Container: Left Navigation Sidebar + Main Content Area */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Navigation Sidebar */}
          <ProfileSidebarNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (
                tab === 'overview' ||
                tab === 'personal' ||
                tab === 'institution' ||
                tab === 'academic' ||
                tab === 'security'
              ) {
                setActiveTab(tab as ProfileTabType);
              }
            }}
          />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 space-y-6 w-full">
            {/* Hero Profile Banner */}
            <ProfileHero
              profile={profile}
              userInfo={userInfo}
              problemsSolved={solvedCount}
              onEditName={() => setIsPersonalModalOpen(true)}
              onUploadPhoto={() => setIsPhotoModalOpen(true)}
            />

            {/* Profile Navigation Tabs */}
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab-driven Content Rendering */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (Cards) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* 1. Personal Information & Profile Photo Cards (Side-by-side on desktop) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <PersonalInfoCard
                        profile={profile}
                        userInfo={userInfo}
                        onEdit={() => setIsPersonalModalOpen(true)}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <ProfilePhotoCard
                        profile={profile}
                        onUpload={() => setIsPhotoModalOpen(true)}
                      />
                    </div>
                  </div>

                  {/* 2. Institution Information Card */}
                  <InstitutionInfoCard
                    profile={profile}
                    institution={institution}
                    userInfo={userInfo}
                    onEdit={() => setIsInstitutionModalOpen(true)}
                  />

                  {/* 3. Academic Details Card (userInfo API) */}
                  <AcademicDetailsCard
                    profile={profile}
                    userInfo={userInfo}
                    onEdit={() => setIsAcademicModalOpen(true)}
                  />
                </div>

                {/* Right Column (Sidebar Widgets) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Profile Completion Widget */}
                  <ProfileCompletionCard
                    profile={profile}
                    userInfo={userInfo}
                    institution={institution}
                    onEditSection={(section) => {
                      if (section === 'personal') setIsPersonalModalOpen(true);
                      else if (section === 'institution') setIsInstitutionModalOpen(true);
                      else if (section === 'academic') setIsAcademicModalOpen(true);
                      else if (section === 'photo') setIsPhotoModalOpen(true);
                    }}
                  />

                  {/* Activity & Progress Statistics - Driven by real API */}
                  <ProfileActivityCard
                    problemsSolved={solvedCount}
                    problemsAttempted={attemptedCount}
                    bookmarksCount={bookmarks.length}
                    collegeName={userInfo?.college || institution?.name || profile?.collegeName}
                  />
                </div>
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="max-w-4xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <PersonalInfoCard
                      profile={profile}
                      userInfo={userInfo}
                      onEdit={() => setIsPersonalModalOpen(true)}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <ProfilePhotoCard
                      profile={profile}
                      onUpload={() => setIsPhotoModalOpen(true)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'institution' && (
              <div className="max-w-3xl">
                <InstitutionInfoCard
                  profile={profile}
                  institution={institution}
                  userInfo={userInfo}
                  onEdit={() => setIsInstitutionModalOpen(true)}
                />
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="max-w-3xl">
                <AcademicDetailsCard
                  profile={profile}
                  userInfo={userInfo}
                  onEdit={() => setIsAcademicModalOpen(true)}
                />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-3xl bg-white dark:bg-neutral-900/90 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm space-y-6 font-sans">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Account Security & Credentials</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage your authentication credentials and account protection.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70 dark:bg-neutral-950/60 border border-gray-200/70 dark:border-white/5">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Email Address</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{authUser?.email || profile?.email || '—'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      Primary
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70 dark:bg-neutral-950/60 border border-gray-200/70 dark:border-white/5">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Account Role</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{authUser?.role || profile?.role || 'STUDENT'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                      Active
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-neutral-950/60 border border-gray-200/70 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Reset Account Password</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receive a secure one-time password on your registered email to update your password.</p>
                    </div>
                    <button
                      onClick={async () => {
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
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
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

      {/* Edit Institution Modal */}
      <EditInstitutionModal
        isOpen={isInstitutionModalOpen}
        onClose={() => setIsInstitutionModalOpen(false)}
        onSubmit={handleSaveInstitution}
        initialData={institution}
        submitting={submitting}
      />

      {/* Edit Academic Details Modal */}
      <EditAcademicModal
        isOpen={isAcademicModalOpen}
        onClose={() => setIsAcademicModalOpen(false)}
        onSubmit={handleSaveAcademic}
        initialData={userInfo}
        defaultCollege={institution?.name || ''}
        defaultDegree={profile?.degree || ''}
        defaultBranch={profile?.branch || ''}
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
