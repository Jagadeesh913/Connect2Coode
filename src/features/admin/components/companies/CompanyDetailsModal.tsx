import { RequestStatus } from '../../../../shared/components/ui/RequestStatus';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import { CompanyItem, adminCompanyService } from '../../../../services/admin/adminCompanyService';
import { companyService } from '../../../../services/companyService';
import { CompanyBrandLogo } from '../../../companies/components/CompanyBrandLogo';
import { Skeleton } from '../../../../shared/components/ui/Skeleton';
import {
  CompanyExamFormModal,
  CompanyExamFormData,
} from './CompanyExamFormModal';
import {
  CompanyRoleFormModal,
  CompanyRoleFormData,
} from './CompanyRoleFormModal';
import {
  ExamSectionFormModal,
  ExamSectionFormData,
} from './ExamSectionFormModal';
import type {
  CompanyExamItem,
  CompanyRoleItem,
  CompanyExamSectionItem,
  CompanyExamDetailsData,
} from '../../../companies/types/companyExam';
import { toast } from 'react-hot-toast';
import { getActionableErrorMessage } from '../../../../core/validation';
import {
  Building2,
  ExternalLink,
  Globe,
  Hash,
  Code2,
  FileText,
  GraduationCap,
  Plus,
  Edit3,
  Clock,
  Award,
  Briefcase,
  ListTree,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  RotateCw,
} from 'lucide-react';

interface CompanyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyItem | null;
  loading?: boolean;
  initialTab?: 'overview' | 'exams';
}

export const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({
  isOpen,
  onClose,
  company,
  loading = false,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'exams'>(initialTab);

  // Tagged DSA Questions State
  const [problems, setProblems] = useState<any[]>([]);
  const [problemsLoading, setProblemsLoading] = useState<boolean>(false);

  // Recruitment Exams State
  const [exams, setExams] = useState<CompanyExamItem[]>([]);
  const [examsLoading, setExamsLoading] = useState<boolean>(false);
  const [expandedExamId, setExpandedExamId] = useState<number | null>(null);
  const [examDetailsMap, setExamDetailsMap] = useState<Record<number, CompanyExamDetailsData>>({});
  const [examDetailsLoadingMap, setExamDetailsLoadingMap] = useState<Record<number, boolean>>({});

  // Sub-modal states
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<CompanyExamItem | null>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [activeExamForRole, setActiveExamForRole] = useState<{ id: number; name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<CompanyRoleItem | null>(null);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [activeExamForSection, setActiveExamForSection] = useState<{ id: number; name: string } | null>(null);
  const [selectedSection, setSelectedSection] = useState<CompanyExamSectionItem | null>(null);
  const [activeExamSections, setActiveExamSections] = useState<CompanyExamSectionItem[]>([]);

  const [savingAction, setSavingAction] = useState(false);

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const readEpoch = useRef(0);
  const invalidateReads = useCallback(() => {
    readEpoch.current += 1;
  }, []);
  const [problemsError, setProblemsError] = useState<string | null>(null);
  const [examsError, setExamsError] = useState<string | null>(null);
  const [examErrors, setExamErrors] = useState<Record<number, string>>({});

  // Load tagged DSA problems
  const fetchProblems = useCallback(async () => {
    if (!company?.id) return;
    const epoch = readEpoch.current;
    setProblemsLoading(true);
    setProblemsError(null);
    try {
      const res = await adminCompanyService.getCompanyProblems(company.id);
      if (epoch !== readEpoch.current) return;
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setProblems(list);
      }
    } catch {
      if (epoch === readEpoch.current) setProblemsError('Unable to load tagged questions.');
    } finally {
      if (epoch === readEpoch.current) setProblemsLoading(false);
    }
  }, [company?.id]);

  // Load recruitment exams
  const fetchExams = useCallback(async () => {
    if (!company?.id) return;
    const epoch = readEpoch.current;
    setExamsLoading(true);
    setExamsError(null);
    try {
      const res = await companyService.getCompanyExamsList(company.id, {
        pageSize: 50,
        pageNumber: 0,
      });
      if (epoch !== readEpoch.current) return;
      const content = res?.data?.content || (Array.isArray(res?.data) ? res.data : []);
      setExams(content);
    } catch {
      if (epoch === readEpoch.current) setExamsError('Unable to load company exams.');
    } finally {
      if (epoch === readEpoch.current) setExamsLoading(false);
    }
  }, [company?.id]);

  // Load specific exam details (roles & pattern sections)
  const fetchExamDetails = useCallback(async (examId: number) => {
    const epoch = readEpoch.current;
    setExamErrors((prev) => ({ ...prev, [examId]: '' }));
    setExamDetailsLoadingMap((prev) => ({ ...prev, [examId]: true }));
    try {
      const res = await companyService.getCompanyExamDetails(examId);
      if (epoch !== readEpoch.current) return;
      if (res?.data) {
        setExamDetailsMap((prev) => ({ ...prev, [examId]: res.data }));
      }
    } catch {
      if (epoch === readEpoch.current) setExamErrors((prev) => ({ ...prev, [examId]: 'Unable to load exam details.' }));
    } finally {
      if (epoch === readEpoch.current) setExamDetailsLoadingMap((prev) => ({ ...prev, [examId]: false }));
    }
  }, []);

  useEffect(() => {
    readEpoch.current++;
    setExamDetailsMap({});
    setExamDetailsLoadingMap({});
    setExamErrors({});
    setProblems([]);
    setExams([]);
    if (!isOpen || !company?.id) {
      setProblems([]);
      setExams([]);
      setExpandedExamId(null);
      return;
    }

    fetchProblems();
    fetchExams();
    return invalidateReads;
  }, [isOpen, company?.id, fetchProblems, fetchExams, invalidateReads]);

  const toggleExpandExam = (examId: number) => {
    if (expandedExamId === examId) {
      setExpandedExamId(null);
    } else {
      setExpandedExamId(examId);
      if (!examDetailsMap[examId]) {
        fetchExamDetails(examId);
      }
    }
  };

  // --- Handlers: Company Exam CRUD ---
  const handleOpenCreateExam = () => {
    setSelectedExam(null);
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam: CompanyExamItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExam(exam);
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (formData: CompanyExamFormData) => {
    if (!company?.id) return;
    setSavingAction(true);
    try {
      await adminCompanyService.saveOrUpdateCompanyExam({
        id: formData.id,
        companyId: Number(company.id),
        examName: formData.examName,
        year: formData.year,
        description: formData.description,
        totalDurationMinutes: formData.totalDurationMinutes,
        totalQuestions: formData.totalQuestions,
        totalMarks: formData.totalMarks,
        sourceUrl: formData.sourceUrl,
        isActive: formData.isActive,
      });
      toast.success(formData.id ? 'Company Exam updated successfully' : 'Company Exam created successfully');
      setIsExamModalOpen(false);
      await fetchExams();
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to save company exam.'));
    } finally {
      setSavingAction(false);
    }
  };

  // --- Handlers: Company Role CRUD ---
  const handleOpenCreateRole = (examId: number, examName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveExamForRole({ id: examId, name: examName });
    setSelectedRole(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (
    examId: number,
    examName: string,
    role: CompanyRoleItem,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setActiveExamForRole({ id: examId, name: examName });
    setSelectedRole(role);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (formData: CompanyRoleFormData) => {
    if (!activeExamForRole) return;
    setSavingAction(true);
    try {
      await adminCompanyService.saveOrUpdateCompanyRole({
        id: formData.id,
        companyExamId: activeExamForRole.id,
        roleName: formData.roleName,
        roleCode: formData.roleCode,
        salary: formData.salary,
        description: formData.description,
      });
      toast.success(formData.id ? 'Company Role updated successfully' : 'Company Role added successfully');
      setIsRoleModalOpen(false);
      await fetchExamDetails(activeExamForRole.id);
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to save company role.'));
    } finally {
      setSavingAction(false);
    }
  };

  // --- Handlers: Exam Section CRUD ---
  const handleOpenCreateSection = (
    examId: number,
    examName: string,
    existingSections: CompanyExamSectionItem[],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setActiveExamForSection({ id: examId, name: examName });
    setActiveExamSections(existingSections);
    setSelectedSection(null);
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (
    examId: number,
    examName: string,
    section: CompanyExamSectionItem,
    existingSections: CompanyExamSectionItem[],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setActiveExamForSection({ id: examId, name: examName });
    setActiveExamSections(existingSections);
    setSelectedSection(section);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (formData: ExamSectionFormData) => {
    if (!activeExamForSection) return;
    setSavingAction(true);
    try {
      await adminCompanyService.saveOrUpdateExamSection({
        id: formData.id,
        companyExamId: activeExamForSection.id,
        parentSectionId: formData.parentSectionId,
        sectionName: formData.sectionName,
        sectionTypeId: formData.sectionTypeId,
        questionTypeId: formData.questionTypeId,
        questionCount: formData.questionCount,
        durationMinutes: formData.durationMinutes,
        totalMarks: formData.totalMarks,
        sequenceNumber: formData.sequenceNumber,
      });
      toast.success(formData.id ? 'Exam Section updated successfully' : 'Exam Section created successfully');
      setIsSectionModalOpen(false);
      await fetchExamDetails(activeExamForSection.id);
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to save exam section.'));
    } finally {
      setSavingAction(false);
    }
  };

  if (!company && !loading) return null;

  return (
    <>
      <AdminModal
        isOpen={isOpen}
        onClose={onClose}
        title={company?.name ? company.name : 'Company Management'}
        subtitle="Manage entity profile, recruitment exams, hiring roles, and pattern sections"
        icon={<Building2 className="w-5 h-5 text-blue-600" />}
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-mono text-slate-400">
              Company ID: #{company?.id}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans shadow-xs"
            >
              Close
            </button>
          </div>
        }
      >
        {loading ? (
          <div role="status" aria-label="Loading company information" className="space-y-4 p-2">
            <div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
          </div>
        ) : company ? (
          <div className="flex flex-col gap-4 font-sans text-xs">
            {/* Header Banner */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 p-2.5 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
                <CompanyBrandLogo
                  name={company.name}
                  logo={company.logo}
                  website={company.website}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                      {company.name}
                    </h3>
                    <AdminBadge
                      variant={company.isActive !== false ? 'success' : 'neutral'}
                      dot
                      size="sm"
                    >
                      {company.isActive !== false ? 'Active' : 'Inactive'}
                    </AdminBadge>
                  </div>

                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono truncate flex items-center gap-1 shrink-0"
                    >
                      <span>{company.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </div>

                {company.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {company.description}
                  </p>
                )}
              </div>
            </div>

            {/* TAB SELECTOR: Overview & DSA vs Recruitment Exams */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Overview & Tagged DSA</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {problems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('exams')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'exams'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Recruitment Exams & Patterns</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {exams.length}
                </span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & TAGGED DSA */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Hash className="w-3 h-3 text-purple-500" /> Database Identifier
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      #{company.id}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-500" /> Web Presence
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5">
                      {company.website || 'No official URL configured'}
                    </span>
                  </div>
                </div>

                {/* Tagged Problems Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <Code2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tagged DSA Questions ({problems.length})</span>
                    </div>
                    <RequestStatus error={problemsError} onRetry={fetchProblems} />
                  </div>

                  {problemsLoading ? (
                    <div role="status" aria-label="Loading tagged questions" className="space-y-2">
                      <Skeleton className="h-12 w-full rounded-xl" count={3} />
                    </div>
                  ) : problems.length === 0 && !problemsError ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-slate-500 italic text-xs text-center">
                      No DSA questions currently tagged to this company.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                      {problems.map((p: any, idx: number) => (
                        <div
                          key={p.id || idx}
                          className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2 font-sans min-w-0">
                            <span className="font-mono text-slate-400 text-[11px] shrink-0">#{p.id}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {p.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {p.difficultyName || p.difficulty ? (
                              <AdminBadge variant="neutral" size="sm">
                                {p.difficultyName || p.difficulty}
                              </AdminBadge>
                            ) : null}
                            {p.topicName || p.topic ? (
                              <AdminBadge variant="primary" size="sm">
                                {p.topicName || p.topic}
                              </AdminBadge>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: RECRUITMENT EXAMS, ROLES & SECTIONS */}
            {activeTab === 'exams' && (
              <div className="space-y-4">
                {/* Action Bar */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Company Recruitment Exams ({exams.length})
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Configure drive blueprints, CTC packages, and section-wise syllabus.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchExams}
                      disabled={examsLoading}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                      title="Refresh Exams"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${examsLoading ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCreateExam}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Exam</span>
                    </button>
                  </div>
                </div>

                {/* Exams List */}
                <RequestStatus error={examsError} onRetry={fetchExams} />
                {examsLoading && exams.length === 0 ? (
                  <div role="status" aria-label="Loading company exams" className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-2xl" count={3} />
                  </div>
                ) : examsError && exams.length === 0 ? null : exams.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                    <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      No recruitment exams published for {company.name} yet.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreateExam}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create First Recruitment Exam</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {exams.map((exam) => {
                      const isExpanded = expandedExamId === exam.id;
                      const details = examDetailsMap[exam.id];
                      const detailsLoading = examDetailsLoadingMap[exam.id];
                      const roles = details?.roles || [];
                      const rounds = details?.pattern || [];
                      const flatSections: CompanyExamSectionItem[] = [];
                      rounds.forEach((r) => {
                        flatSections.push(r);
                        if (r.sections) {
                          r.sections.forEach((s) => flatSections.push(s));
                        }
                      });

                      return (
                        <div
                          key={exam.id}
                          className="rounded-2xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
                        >
                          {/* Exam Card Header */}
                          <div
                            onClick={() => toggleExpandExam(exam.id)}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {exam.year || '2026'}
                              </span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    {exam.examName}
                                  </h5>
                                  <AdminBadge
                                    variant={exam.isActive !== false ? 'success' : 'neutral'}
                                    dot
                                    size="sm"
                                  >
                                    {exam.isActive !== false ? 'Active' : 'Inactive'}
                                  </AdminBadge>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                  <span className="flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {exam.totalDurationMinutes} mins
                                  </span>
                                  <span className="flex items-center gap-1 font-mono">
                                    <FileText className="w-3 h-3 text-slate-400" />
                                    {exam.totalQuestions} questions
                                  </span>
                                  <span className="flex items-center gap-1 font-mono">
                                    <Award className="w-3 h-3 text-slate-400" />
                                    {exam.totalMarks} marks
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditExam(exam, e)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer"
                                title="Edit Exam Specifications"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleExpandExam(exam.id)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                              >
                                <span>{isExpanded ? 'Hide Structure' : 'Manage Roles & Pattern'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Nested Manager: Roles & Sections */}
                          {isExpanded && (
                            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-5">
                              <RequestStatus error={examErrors[exam.id]} onRetry={() => fetchExamDetails(exam.id)} />
                              {detailsLoading ? (
                                <div role="status" aria-label="Loading exam roles and pattern" className="space-y-3 py-2">
                                  <Skeleton className="h-16 w-full rounded-xl" />
                                  <Skeleton className="h-28 w-full rounded-xl" />
                                </div>
                              ) : examErrors[exam.id] && !details ? null : (
                                <>
                                  {/* 1. ROLES MANAGER */}
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                        <span>Associated Roles & CTC Packages ({roles.length})</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenCreateRole(exam.id, exam.examName, e)}
                                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-600 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add Role</span>
                                      </button>
                                    </div>

                                    {roles.length === 0 ? (
                                      <div className="p-3 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 italic text-center">
                                        No roles added to this recruitment exam yet.
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {roles.map((role) => (
                                          <div
                                            key={role.id}
                                            className="p-3 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start justify-between gap-2"
                                          >
                                            <div className="space-y-0.5 min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-extrabold text-slate-900 dark:text-white">
                                                  {role.roleName}
                                                </span>
                                                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono font-bold">
                                                  {role.roleCode}
                                                </span>
                                              </div>
                                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <IndianRupee className="w-2.5 h-2.5" />
                                                {role.salary || 'Package details awaited'}
                                              </span>
                                              {role.description && (
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                                  {role.description}
                                                </p>
                                              )}
                                            </div>

                                            <button
                                              type="button"
                                              onClick={(e) => handleOpenEditRole(exam.id, exam.examName, role, e)}
                                              className="p-1 rounded-md text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                              title="Edit Role"
                                            >
                                              <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* 2. EXAM PATTERN & SECTIONS MANAGER */}
                                  <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        <ListTree className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        <span>Exam Rounds & Syllabus Sections ({flatSections.length})</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenCreateSection(exam.id, exam.examName, flatSections, e)}
                                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600 border border-blue-200 dark:border-blue-800 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add Section / Round</span>
                                      </button>
                                    </div>

                                    {rounds.length === 0 ? (
                                      <div className="p-3 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 italic text-center">
                                        No assessment rounds or sections configured yet.
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {rounds.map((round, rIdx) => (
                                          <div
                                            key={round.id || `r-${rIdx}`}
                                            className="rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200/90 dark:border-slate-800 p-3 space-y-2 shadow-2xs"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                                                  {round.sequenceNumber || rIdx + 1}
                                                </span>
                                                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                                  {round.sectionName}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                  ({round.sectionType?.refName || 'Round'})
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-2">
                                                {round.durationMinutes && (
                                                  <span className="text-[10px] text-slate-500 font-mono">
                                                    {round.durationMinutes}m
                                                  </span>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={(e) => handleOpenEditSection(exam.id, exam.examName, round, flatSections, e)}
                                                  className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                                  title="Edit Round"
                                                >
                                                  <Edit3 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Nested Sub-sections */}
                                            {round.sections && round.sections.length > 0 && (
                                              <div className="pl-6 space-y-1.5 border-l-2 border-blue-500/30">
                                                {round.sections.map((sub, sIdx) => (
                                                  <div
                                                    key={sub.id || `sub-${sIdx}`}
                                                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/60 flex items-center justify-between text-[11px]"
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {sub.sectionName}
                                                      </span>
                                                      {sub.questionType && (
                                                        <span className="px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-200/60 dark:border-blue-900/40">
                                                          {sub.questionType.refName || sub.questionType.refCode}
                                                        </span>
                                                      )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                      {sub.durationMinutes && (
                                                        <span className="text-slate-500 font-mono text-[10px]">
                                                          {sub.durationMinutes}m
                                                        </span>
                                                      )}
                                                      {sub.questionCount && (
                                                        <span className="text-slate-500 font-mono text-[10px]">
                                                          {sub.questionCount} Qs
                                                        </span>
                                                      )}
                                                      {sub.totalMarks && (
                                                        <span className="text-slate-500 font-mono text-[10px]">
                                                          {sub.totalMarks} M
                                                        </span>
                                                      )}
                                                      <button
                                                        type="button"
                                                        onClick={(e) => handleOpenEditSection(exam.id, exam.examName, sub, flatSections, e)}
                                                        className="p-0.5 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                                        title="Edit Sub-section"
                                                      >
                                                        <Edit3 className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </AdminModal>

      {/* Sub-Modal: Create / Edit Company Exam */}
      {company?.id && (
        <CompanyExamFormModal
          isOpen={isExamModalOpen}
          onClose={() => setIsExamModalOpen(false)}
          onSubmit={handleSaveExam}
          companyId={Number(company.id)}
          companyName={company.name}
          initialData={selectedExam}
          submitting={savingAction}
        />
      )}

      {/* Sub-Modal: Create / Edit Company Role */}
      {activeExamForRole && (
        <CompanyRoleFormModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          onSubmit={handleSaveRole}
          companyExamId={activeExamForRole.id}
          examName={activeExamForRole.name}
          initialData={selectedRole}
          submitting={savingAction}
        />
      )}

      {/* Sub-Modal: Create / Edit Exam Section / Round */}
      {activeExamForSection && (
        <ExamSectionFormModal
          isOpen={isSectionModalOpen}
          onClose={() => setIsSectionModalOpen(false)}
          onSubmit={handleSaveSection}
          companyExamId={activeExamForSection.id}
          examName={activeExamForSection.name}
          existingSections={activeExamSections}
          initialData={selectedSection}
          submitting={savingAction}
        />
      )}
    </>
  );
};
