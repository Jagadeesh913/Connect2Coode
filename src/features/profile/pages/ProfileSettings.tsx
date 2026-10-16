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

// Modals
import { EditPersonalInfoModal } from '../components/modals/EditPersonalInfoModal';
import { EditInstitutionModal } from '../components/modals/EditInstitutionModal';
import { EditAcademicModal, AcademicFormData } from '../components/modals/EditAcademicModal';
import { UploadPhotoModal } from '../components/modals/UploadPhotoModal';
import { toast } from 'react-hot-toast';

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
    return authUser?.id || profile?.id;
  }, [authUser?.id, profile?.id]);

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

  // Handle Institution Info Submit
  const handleSaveInstitution = async (instData: Partial<Institution>) => {
    setSubmitting(true);
    try {
      await dispatch(
        updateUserProfile({
          collegeName: instData.name,
        })
      ).unwrap();

      if (instData.name || instData.id) {
        setInstitution((prev) => ({
          id: instData.id ?? prev?.id ?? 0,
          name: instData.name ?? prev?.name ?? '',
          institutionType: instData.institutionType ?? prev?.institutionType ?? 'COLLEGE',
          ...prev,
          ...instData,
        } as Institution));
      }

      // Sync college name to userInfo API if userId is available
      if (effectiveUserId && instData.name) {
        try {
          await dispatch(
            saveUserInfoThunk({
              userId: effectiveUserId,
              payload: {
                regNumber: userInfo?.regNumber || '',
                joinedYear: Number(userInfo?.joinedYear) || new Date().getFullYear(),
                passedOutYear: Number(userInfo?.passedOutYear) || new Date().getFullYear() + 2,
                college: instData.name.trim(),
                bio: userInfo?.bio || '',
              },
            })
          );
        } catch {}
      }

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
      return;
    }

    setSubmitting(true);
    try {
      const payload: SaveUserInfoPayload = {
        regNumber: data.regNumber.trim(),
        joinedYear: Number(data.joinedYear),
        passedOutYear: Number(data.passedOutYear),
        college: data.college.trim(),
        bio: data.bio.trim(),
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

      // Also sync degree/branch and college to base profile
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

            {/* Two-Column Responsive Layout */}
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
                {/* Profile Completion Donut Widget */}
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
