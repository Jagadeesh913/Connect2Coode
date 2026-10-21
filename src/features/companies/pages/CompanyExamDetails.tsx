import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { openAuthModal } from '../../auth/redux/authSlice';
import { companyService } from '../../../services/companyService';
import type {
  CompanyExamDetailsData,
  CompanyExamSectionItem,
  CompanyExamItem,
} from '../types/companyExam';
import type { Company } from '../../../core/types/domain';
import { CompanyBrandLogo } from '../components/CompanyBrandLogo';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import {
  ArrowLeft,
  Clock,
  FileText,
  Award,
  ExternalLink,
  Briefcase,
  Layers,
  Code2,
  Database,
  CheckCircle2,
  Calendar,
  Sparkles,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';

export const CompanyExamDetails: React.FC = () => {
  const { companyId, examId, slug } = useParams<{
    companyId?: string;
    examId?: string;
    slug?: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Resolve target examId and companyId
  const effectiveExamId = examId || slug;
  const effectiveCompanyId = companyId;

  const [details, setDetails] = useState<CompanyExamDetailsData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [siblingExams, setSiblingExams] = useState<CompanyExamItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadExamDetails() {
      if (!effectiveExamId) {
        setError('Exam ID not specified');
        setLoading(false);
        return;
      }

      setLoading(true);
      setDetails(null);
      setCompany(null);
      setSiblingExams([]);
      setError(null);

      try {
        const res = await companyService.getCompanyExamDetails(
          effectiveExamId,
          controller.signal
        );
        if (!isMounted) return;
        setDetails(res.data);
        setLoading(false);

        // Load associated company information and sibling exams
        const compId = effectiveCompanyId || res.data?.exam?.companyId;
        if (compId) {
          try {
            const compRes = await companyService.getCompanyBySlug(
              String(compId),
              controller.signal
            );
            if (isMounted) {
              setCompany(compRes.data);
            }
          } catch {
            // Non-critical if company details fail
          }

          try {
            const examsListRes = await companyService.getCompanyExamsList(
              compId,
              { pageNumber: 0, pageSize: 20, sortBy: 'year', sortDirection: 'DESC' },
              controller.signal
            );
            if (isMounted && Array.isArray(examsListRes?.data?.content)) {
              setSiblingExams(examsListRes.data.content);
            }
          } catch {
            // Non-critical if sibling exams fail
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        const errMsg = err?.response?.data?.message || err?.message || 'Failed to load company exam details';
        setError(errMsg);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadExamDetails();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [effectiveExamId, effectiveCompanyId, retry]);

  // Find another edition of this exam (if available) for comparison
  const alternativeExam = useMemo(() => {
    if (!details?.exam || siblingExams.length <= 1) return null;
    return siblingExams.find((e) => e.id !== details.exam.id) || null;
  }, [details, siblingExams]);

  // Helper for question type styling
  const getQuestionTypeBadge = (code?: string, name?: string) => {
    const normalized = (code || name || '').toUpperCase();
    if (normalized.includes('CODING')) {
      return {
        icon: <Code2 className="w-3.5 h-3.5" />,
        label: name || 'Coding',
        className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
      };
    }
    if (normalized.includes('SQL')) {
      return {
        icon: <Database className="w-3.5 h-3.5" />,
        label: name || 'SQL',
        className: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
      };
    }
    if (normalized.includes('MCQ')) {
      return {
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        label: name || 'MCQ',
        className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
      };
    }
    return {
      icon: <Sparkles className="w-3.5 h-3.5" />,
      label: name || 'Mixed',
      className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    };
  };

  const companyResolvedId = company?.id || effectiveCompanyId || details?.exam?.companyId;

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans bg-[#FFFFFF] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200 overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-24 -left-48 w-96 h-[400px] bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-40 -right-48 w-96 h-[500px] bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* 1. TOP BREADCRUMB & BACK ACTION */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            <Link
              to="/companies"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Company Prep
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            {companyResolvedId ? (
              <Link
                to={`/companies/${companyResolvedId}`}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold text-slate-700 dark:text-slate-300"
              >
                {company?.name || 'Company'}
              </Link>
            ) : (
              <span>Company</span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {details?.exam?.examName || 'Exam Details'}
            </span>
          </nav>

          <button
            onClick={() => {
              if (companyResolvedId) {
                navigate(`/companies/${companyResolvedId}`);
              } else {
                navigate('/companies');
              }
            }}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 hover:border-blue-500 px-3.5 py-1.5 rounded-xl shadow-2xs transition-all hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {company?.name ? `${company.name} Exams` : 'Exams'}</span>
          </button>
        </div>

        {/* 2. LOADING STATE */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="w-full h-56 bg-slate-100 dark:bg-[#0D1322] rounded-3xl border border-slate-200 dark:border-slate-800" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-100 dark:bg-[#0D1322] rounded-2xl border border-slate-200 dark:border-slate-800" />
              ))}
            </div>
            <div className="w-full h-80 bg-slate-100 dark:bg-[#0D1322] rounded-3xl border border-slate-200 dark:border-slate-800" />
          </div>
        )}

        {/* 3. ERROR & AUTH REQUIRED STATE */}
        {!loading && error && (
          <div className="my-12">
            {!isAuthenticated ? (
              <EmptyState
                title="Sign in to view recruitment exam details"
                description="Log in with your Connect 2 Code account to browse hiring company exam patterns, section syllabus breakdowns, and role packages."
                actionText="Sign In"
                onAction={() => dispatch(openAuthModal({ mode: 'login' }))}
                icon={<Lock className="w-12 h-12 text-blue-500" />}
              />
            ) : (
              <EmptyState
                title="Unable to load exam details"
                description={error}
                actionText="Retry"
                onAction={() => setRetry((value) => value + 1)}
                icon={<HelpCircle className="w-12 h-12 text-rose-500" />}
              />
            )}
          </div>
        )}

        {/* 4. EXAM DETAILS CONTENT */}
        {!loading && details && details.exam && (
          <div className="space-y-8">
            
            {/* HERO BANNER CARD */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 lg:p-10 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-5">
                  {/* Company Logo */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700/80 p-2.5 flex items-center justify-center shrink-0 shadow-sm">
                    <CompanyBrandLogo
                      name={company?.name || details.exam.examName}
                      logo={company?.logo || company?.logoUrl || undefined}
                      website={company?.website || company?.websiteUrl || undefined}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div>
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <Calendar className="w-3 h-3" />
                        {details.exam.year} Edition
                      </span>
                      {company?.name && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60">
                          {company.name}
                        </span>
                      )}
                      {details.exam.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/70">
                          <CheckCircle2 className="w-3 h-3" />
                          Active Recruitment
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Archived Edition
                        </span>
                      )}
                    </div>

                    {/* Exam Name */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {details.exam.examName}
                    </h1>

                    {/* Description */}
                    {details.exam.description && (
                      <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                        {details.exam.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column: Portal Link & Sibling Editions Switcher */}
                <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3">
                  {details.exam.sourceUrl && (
                    <a
                      href={details.exam.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500 hover:border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:text-blue-400 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Sibling Exam Edition Switcher */}
                  {siblingExams.length > 1 && (
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#111A2E] rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2">
                        Edition:
                      </span>
                      {siblingExams.map((sibling) => (
                        <Link
                          key={sibling.id}
                          to={`/companies/${companyResolvedId}/exams/${sibling.id}`}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            sibling.id === details.exam.id
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {sibling.year}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4 KPI METRIC CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-800/70 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Total Duration
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {details.exam.totalDurationMinutes} Minutes
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-800/70 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Total Questions
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {details.exam.totalQuestions} Questions
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-800/70 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Total Marks
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {details.exam.totalMarks} Marks
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-800/70 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Offered Roles
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {details.roles && details.roles.length > 0
                        ? `${details.roles.length} Hiring Profiles`
                        : 'To Be Announced'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 1: ROLES & SALARY PACKAGES */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Hiring Roles &amp; Compensation (CTC)
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Eligible recruitment roles, packages, and criteria for {details.exam.examName} ({details.exam.year})
                  </p>
                </div>
              </div>

              {details.roles && details.roles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {details.roles.map((role) => (
                    <div
                      key={role.id || role.roleName}
                      className="group relative bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Role Name & Code */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {role.roleName}
                          </h3>
                          {role.roleCode && (
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {role.roleCode}
                            </span>
                          )}
                        </div>

                        {/* Salary Banner */}
                        {role.salary && (
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 mb-3">
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                              Package / Salary
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                              {role.salary}
                            </span>
                          </div>
                        )}

                        {/* Description */}
                        {role.description && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Information Card when roles are awaiting official publication */
                <div className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Info className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          Role Profiles Pending Official {details.exam.year} Announcement
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/70">
                          Awaiting Release
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                        Official compensation tiers and role requirements for the {details.exam.year} drive are being published by {company?.name || details.exam.examName}. Hiring traditionally targets roles like Digital, Ninja, and Prime.
                      </p>
                    </div>
                  </div>

                  {alternativeExam && (
                    <Link
                      to={`/companies/${companyResolvedId}/exams/${alternativeExam.id}`}
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white dark:bg-blue-950/40 dark:hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white font-semibold text-xs sm:text-sm transition-all"
                    >
                      <span>View {alternativeExam.year} Roles</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* SECTION 2: EXAM PATTERN & ROUNDS PIPELINE */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Assessment Pattern &amp; Rounds
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Assessment stages, test sections, timing, and question types for {details.exam.examName} ({details.exam.year})
                  </p>
                </div>
              </div>

              {details.pattern && details.pattern.length > 0 ? (
                <div className="space-y-5">
                  {details.pattern.map((round: CompanyExamSectionItem, roundIdx: number) => {
                    const roundTypeBadge = getQuestionTypeBadge(
                      round.questionType?.refCode,
                      round.questionType?.refName
                    );

                    return (
                      <div
                        key={round.id || `round-${roundIdx}`}
                        className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                      >
                        {/* Parent Round Header */}
                        <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-[#111A2E]/80 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-sm">
                              {round.sequenceNumber || roundIdx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                  {round.sectionName}
                                </h3>
                                {round.sectionType?.refName && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                    {round.sectionType.refName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Round Metrics Badges */}
                          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                            {round.durationMinutes && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                {round.durationMinutes} Minutes
                              </span>
                            )}
                            {round.questionCount !== null && round.questionCount !== undefined && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                {round.questionCount} Questions
                              </span>
                            )}
                            {round.totalMarks !== null && round.totalMarks !== undefined && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                                <Award className="w-3.5 h-3.5 text-amber-500" />
                                {round.totalMarks} Marks
                              </span>
                            )}
                            {round.questionType && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${roundTypeBadge.className}`}
                              >
                                {roundTypeBadge.icon}
                                {roundTypeBadge.label}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Nested Sections inside this Round */}
                        {round.sections && round.sections.length > 0 ? (
                          <div className="p-4 sm:p-6 divide-y divide-slate-200/80 dark:divide-slate-800/80">
                            {round.sections.map((sec, secIdx) => {
                              const secBadge = getQuestionTypeBadge(
                                sec.questionType?.refCode,
                                sec.questionType?.refName
                              );

                              return (
                                <div
                                  key={sec.id || `sec-${secIdx}`}
                                  className={`py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    secIdx === 0 ? 'pt-1' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                                      {sec.sequenceNumber || secIdx + 1}
                                    </span>
                                    <div>
                                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                        {sec.sectionName}
                                      </h4>
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {sec.sectionType?.refName || 'Sub-section'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap sm:justify-end pl-9 sm:pl-0">
                                    {/* Question Type Badge */}
                                    {sec.questionType && (
                                      <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${secBadge.className}`}
                                      >
                                        {secBadge.icon}
                                        {secBadge.label}
                                      </span>
                                    )}

                                    {/* Section Duration */}
                                    {sec.durationMinutes !== null && sec.durationMinutes !== undefined && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#111A2E] text-slate-700 dark:text-slate-300">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {sec.durationMinutes}m
                                      </span>
                                    )}

                                    {/* Section Question Count */}
                                    {sec.questionCount !== null && sec.questionCount !== undefined && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#111A2E] text-slate-700 dark:text-slate-300">
                                        <FileText className="w-3 h-3 text-slate-400" />
                                        {sec.questionCount} Qs
                                      </span>
                                    )}

                                    {/* Section Marks */}
                                    {sec.totalMarks !== null && sec.totalMarks !== undefined && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#111A2E] text-slate-700 dark:text-slate-300">
                                        <Award className="w-3 h-3 text-slate-400" />
                                        {sec.totalMarks} Marks
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 sm:p-5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Single-stage comprehensive assessment round</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Information Card when detailed pattern is awaiting release */
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                          {details.exam.year} Examination Blueprint &amp; Structure
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/70">
                          Published Specs
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        The overall assessment parameters are configured. Section-wise timing allocation is awaiting release.
                      </p>
                    </div>

                    {alternativeExam && (
                      <Link
                        to={`/companies/${companyResolvedId}/exams/${alternativeExam.id}`}
                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20"
                      >
                        <span>Explore {alternativeExam.year} Detailed Pattern</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>

                  {/* High level specifications grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200/70 dark:border-slate-800/60">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Total Test Duration
                      </span>
                      <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                        {details.exam.totalDurationMinutes} Minutes
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200/70 dark:border-slate-800/60">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Question Volume
                      </span>
                      <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {details.exam.totalQuestions} Questions
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200/70 dark:border-slate-800/60">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Maximum Marks
                      </span>
                      <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                        {details.exam.totalMarks} Marks
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 3: SUMMARY & PRACTICE ACTION */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/60 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200/90 dark:border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Ready to prepare for {details.exam.examName}?
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                  Practice past coding problems, quantitative aptitude, reasoning, and technical questions tailored to this company.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {companyResolvedId && (
                  <Link
                    to={`/companies/${companyResolvedId}`}
                    className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 text-center"
                  >
                    Solve Company Questions
                  </Link>
                )}
                <Link
                  to="/companies"
                  className="py-2.5 px-4 rounded-xl bg-white dark:bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-all shadow-2xs text-center"
                >
                  Explore Other Companies
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
