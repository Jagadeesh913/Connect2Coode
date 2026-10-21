import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTable, Column } from '../components/AdminTable';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminErrorState } from '../components/AdminErrorState';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { adminMcqService } from '../../../services/admin/adminMcqService';
import { referenceService, ReferenceItem } from '../../../services/referenceService';
import { companyService } from '../../../services/companyService';
import { toast } from 'react-hot-toast';
import { getActionableErrorMessage } from '../../../core/validation';
import type { McqQuestion, Company, AdminCreateMcqPayload } from '../../../core/types/domain';
import { cleanQuestionText, synthesizeMcqOptions } from '../../aptitude/utils/mcqUtils';
import {
  Plus,
  RotateCw,
  Search,
  Eye,
  Trash2,
  HelpCircle,
  Check,
  Edit3,
} from 'lucide-react';

interface OptionFormState {
  id?: number;
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
}

interface SubjectTopicItem {
  id: number;
  refCode: string;
  refName: string;
}

// Resolves the Reference Library group code for a given subject dynamically from API structure
const resolveTopicGroupCode = (subjectCode: string): string => {
  const upper = (subjectCode || '').toUpperCase().trim();
  if (['APTITUDE', 'REASONING', 'VERBAL', 'PSEUDOCODE'].includes(upper)) {
    return upper;
  }
  return 'TOPIC';
};

export const AdminMcqs: React.FC = () => {
  const [mcqs, setMcqs] = useState<McqQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Reference options
  const [subjects, setSubjects] = useState<ReferenceItem[]>([]);
  const [difficulties, setDifficulties] = useState<ReferenceItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Subject-specific topics for the create/edit form
  const [subjectTopics, setSubjectTopics] = useState<SubjectTopicItem[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedMcq, setSelectedMcq] = useState<McqQuestion | null>(null);
  const [editingMcq, setEditingMcq] = useState<McqQuestion | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formSubjectRefCode, setFormSubjectRefCode] = useState<string>('APTITUDE');
  const [formTopicRefCode, setFormTopicRefCode] = useState<string>('');
  const [formDifficultyRefCode, setFormDifficultyRefCode] = useState<string>('EASY');
  const [formCompanyId, setFormCompanyId] = useState<string>('');
  const [formQuestion, setFormQuestion] = useState<string>('');
  const [formExplanation, setFormExplanation] = useState<string>('');
  const [formOptions, setFormOptions] = useState<OptionFormState[]>([
    { optionLabel: 'A', optionText: '', isCorrect: true },
    { optionLabel: 'B', optionText: '', isCorrect: false },
    { optionLabel: 'C', optionText: '', isCorrect: false },
    { optionLabel: 'D', optionText: '', isCorrect: false },
  ]);

  const searchAbortRef = useRef<AbortController | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPageNumber(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load filter reference items on mount directly from live API
  useEffect(() => {
    let isMounted = true;
    const loadReferences = async () => {
      try {
        const [subjRes, diffRes, compRes] = await Promise.allSettled([
          referenceService.getByGroupCode('SUBJECT'),
          referenceService.getByGroupCode('DIFF'),
          companyService.getCompanies(),
        ]);
        if (!isMounted) return;

        if (subjRes.status === 'fulfilled' && subjRes.value?.data) {
          const raw = (subjRes.value.data as any)?.data || subjRes.value.data;
          const list = Array.isArray(raw) ? raw : [];
          setSubjects(list);
          if (list.length > 0) {
            setFormSubjectRefCode((prev) => prev || list[0].refCode);
          }
        }
        if (diffRes.status === 'fulfilled' && diffRes.value?.data) {
          const raw = (diffRes.value.data as any)?.data || diffRes.value.data;
          setDifficulties(Array.isArray(raw) ? raw : []);
        }
        if (compRes.status === 'fulfilled' && compRes.value?.data) {
          const raw = (compRes.value.data as any)?.data || compRes.value.data;
          setCompanies(Array.isArray(raw) ? raw : []);
        }
      } catch (err) {
        console.warn('Failed to load MCQ filter references from API:', err);
      }
    };
    loadReferences();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamically load subject-specific topics from API whenever formSubjectRefCode changes
  useEffect(() => {
    let isMounted = true;
    const topicGroup = resolveTopicGroupCode(formSubjectRefCode);

    referenceService
      .getByGroupCode(topicGroup)
      .then((res) => {
        if (!isMounted) return;
        const raw = (res as any)?.data?.data || (res as any)?.data || res;
        const items = Array.isArray(raw) ? raw : [];
        const mapped: SubjectTopicItem[] = items.map((it: any) => ({
          id: Number(it.id),
          refCode: it.refCode || '',
          refName: it.refName || it.refCode || '',
        }));
        setSubjectTopics(mapped);
        setFormTopicRefCode((prev) => {
          const exists = mapped.some((m) => m.refCode.toUpperCase() === prev.toUpperCase());
          return exists ? prev : (mapped[0]?.refCode || '');
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn(`Failed to fetch topics from API for ${topicGroup}:`, err);
        setSubjectTopics([]);
      });

    return () => {
      isMounted = false;
    };
  }, [formSubjectRefCode]);

  // Fetch MCQs from POST /api/v1/mcq
  const fetchMcqs = useCallback(async () => {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setLoading(true);
    setError(null);

    let subjectIds: number[] = [];
    if (selectedSubject) {
      const match = subjects.find(
        (s) => String(s.refCode).toUpperCase() === selectedSubject.toUpperCase()
      );
      if (match?.id) subjectIds = [match.id];
    }

    let difficultyIds: number[] = [];
    if (selectedDifficulty) {
      const diffMatch = difficulties.find(
        (d) => String(d.refCode).toUpperCase() === selectedDifficulty.toUpperCase()
      );
      if (diffMatch?.id) difficultyIds = [diffMatch.id];
    }

    try {
      const response = await adminMcqService.getMcqs(
        {
          subject: subjectIds,
          difficulty: difficultyIds,
          companies: [],
          topic: null,
          searchText: debouncedSearch || undefined,
          pageRequest: {
            pageNumber,
            pageSize,
            sortBy: 'createdAt',
            sortDirection: 'DESC',
          },
        },
        controller.signal
      );

      if (controller.signal.aborted) return;

      const rawData: any = (response?.data as any)?.data || response?.data || response;
      const contentList: McqQuestion[] = Array.isArray(rawData?.content)
        ? rawData.content
        : Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

      const total = typeof rawData?.totalElements === 'number'
        ? rawData.totalElements
        : typeof rawData?.total === 'number'
        ? rawData.total
        : contentList.length;

      const computedPages = typeof rawData?.totalPages === 'number' && rawData.totalPages > 0
        ? rawData.totalPages
        : Math.max(1, Math.ceil(total / pageSize));

      setMcqs((prev) => {
        const existingMap = new Map(prev.map((item) => [item.id, item]));
        return contentList.map((item) => {
          const localItem = existingMap.get(item.id);
          // If the fetched item from catalog has no options but local state has options, preserve local options
          if ((!item.options || item.options.length === 0) && localItem?.options && localItem.options.length > 0) {
            return { ...item, options: localItem.options };
          }
          // If the fetched item has options, ensure optionText is populated from optionValue if needed
          if (Array.isArray(item.options) && item.options.length > 0) {
            const normalizedOpts = item.options.map((opt: any, idx: number) => {
              const localOpt = localItem?.options?.[idx];
              const resolvedText = String(
                opt.optionText ??
                opt.optionValue ??
                opt.value ??
                opt.text ??
                opt.option ??
                localOpt?.optionText ??
                ''
              );
              return {
                ...opt,
                optionText: resolvedText,
                optionValue: resolvedText,
              };
            });
            return { ...item, options: normalizedOpts };
          }
          return item;
        });
      });
      setTotalElements(total);
      setTotalPages(computedPages);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setError(getActionableErrorMessage(err, 'Failed to fetch MCQ questions'));

    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedSubject, selectedDifficulty, debouncedSearch, pageNumber, pageSize, subjects, difficulties]);

  useEffect(() => {
    fetchMcqs();
    return () => {
      searchAbortRef.current?.abort();
    };
  }, [fetchMcqs]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingMcq(null);
    const initialSubject = subjects[0]?.refCode || 'APTITUDE';
    setFormSubjectRefCode(initialSubject);
    setFormTopicRefCode('');
    setFormDifficultyRefCode('EASY');
    setFormCompanyId('');
    setFormQuestion('');
    setFormExplanation('');
    setFormOptions([
      { optionLabel: 'A', optionText: '', isCorrect: true },
      { optionLabel: 'B', optionText: '', isCorrect: false },
      { optionLabel: 'C', optionText: '', isCorrect: false },
      { optionLabel: 'D', optionText: '', isCorrect: false },
    ]);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (mcq: McqQuestion) => {
    setEditingMcq(mcq);
    const subj = mcq.subjectRefCode?.toUpperCase() || subjects[0]?.refCode || 'APTITUDE';
    setFormSubjectRefCode(subj);
    setFormTopicRefCode(mcq.topicRefCode || '');
    setFormDifficultyRefCode(mcq.difficultyRefCode || 'EASY');
    setFormCompanyId(mcq.companyId ? String(mcq.companyId) : '');
    setFormQuestion(cleanQuestionText(mcq.question) || mcq.question || '');
    setFormExplanation(mcq.explanation || '');

    let optionsToUse = Array.isArray(mcq.options) && mcq.options.length > 0 ? mcq.options : [];

    // If options are missing on the row item, asynchronously fetch the full MCQ details by ID from the API
    if (optionsToUse.length === 0) {
      try {
        const detailRes = await adminMcqService.getMcqById(mcq.id);
        const detailData: any = (detailRes?.data as any)?.data || detailRes?.data;
        if (detailData && Array.isArray(detailData.options) && detailData.options.length > 0) {
          optionsToUse = detailData.options;
        }
      } catch (err) {
        console.warn('Could not load detailed options for MCQ #' + mcq.id, err);
      }
    }

    if (optionsToUse.length > 0) {
      const hasAnyCorrect = optionsToUse.some(
        (o: any) => o.isCorrect === true || o.is_correct === true || o.correct === true
      );
      setFormOptions(
        optionsToUse.map((o: any, idx: number) => ({
          id: o.id || o.optionId ? Number(o.id || o.optionId) : undefined,
          optionLabel: o.optionLabel || String.fromCharCode(65 + idx),
          optionText: String(
            o.optionText ?? o.optionValue ?? o.value ?? o.text ?? o.option ?? ''
          ),
          isCorrect: hasAnyCorrect
            ? Boolean(o.isCorrect || o.is_correct || o.correct)
            : idx === 0,
        }))
      );
    } else {
      setFormOptions([
        { optionLabel: 'A', optionText: '', isCorrect: true },
        { optionLabel: 'B', optionText: '', isCorrect: false },
        { optionLabel: 'C', optionText: '', isCorrect: false },
        { optionLabel: 'D', optionText: '', isCorrect: false },
      ]);
    }
    setIsCreateModalOpen(true);
  };

  // Handle Create or Update MCQ submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formQuestion.trim()) {
      toast.error('Question text is required');
      return;
    }

    const filledOptions = formOptions.filter((o) => o.optionText.trim() !== '');
    if (filledOptions.length < 2) {
      toast.error('Please provide at least 2 options for the MCQ');
      return;
    }

    const hasCorrect = filledOptions.some((o) => o.isCorrect === true);
    if (!hasCorrect) {
      toast.error('Please mark at least one option as the correct answer');
      return;
    }

    setSubmitting(true);
    try {
      const topicGroupCode = resolveTopicGroupCode(formSubjectRefCode);
      const mappedOptions = filledOptions.map((o) => {
        const textVal = o.optionText.trim();
        return {
          ...(o.id ? { id: Number(o.id), optionId: Number(o.id) } : {}),
          optionLabel: o.optionLabel,
          optionText: textVal,
          optionValue: textVal,
          value: textVal,
          text: textVal,
          option: textVal,
          isCorrect: Boolean(o.isCorrect),
          correct: Boolean(o.isCorrect),
        };
      });

      const payload: AdminCreateMcqPayload = {
        ...(editingMcq ? { id: Number(editingMcq.id) } : {}),
        subjectGroupCode: 'SUBJECT',
        subjectRefCode: formSubjectRefCode,
        topicGroupCode,
        topicRefCode: formTopicRefCode,
        difficultyGroupCode: 'DIFF',
        difficultyRefCode: formDifficultyRefCode,
        companyId: formCompanyId ? Number(formCompanyId) : null,
        question: formQuestion.trim(),
        explanation: formExplanation.trim() || undefined,
        isActive: true,
        options: mappedOptions,
      };

      if (editingMcq) {
        const res = await adminMcqService.updateMcq(editingMcq.id, payload);
        const updatedRaw: any = (res?.data as any)?.data || res?.data;
        const targetId =
          typeof updatedRaw === 'object' && updatedRaw?.id ? updatedRaw.id : editingMcq.id;

        const rawOpts =
          typeof updatedRaw === 'object' && Array.isArray(updatedRaw?.options) && updatedRaw.options.length > 0
            ? updatedRaw.options
            : mappedOptions;

        const normalizedOptions = rawOpts.map((o: any, idx: number) => {
          const resolvedText = String(
            o.optionText ?? o.optionValue ?? o.value ?? o.text ?? mappedOptions[idx]?.optionText ?? ''
          );
          return {
            id: o.id || o.optionId || mappedOptions[idx]?.id,
            optionLabel: o.optionLabel || mappedOptions[idx]?.optionLabel || String.fromCharCode(65 + idx),
            optionText: resolvedText,
            optionValue: resolvedText,
            isCorrect: Boolean(o.isCorrect ?? o.correct ?? mappedOptions[idx]?.isCorrect),
          };
        });

        const updatedItem: McqQuestion = {
          ...editingMcq,
          ...payload,
          ...(typeof updatedRaw === 'object' && updatedRaw !== null ? updatedRaw : {}),
          id: targetId,
          options: normalizedOptions,
        };

        setMcqs((prev) =>
          prev.map((item) => (item.id === editingMcq.id ? { ...item, ...updatedItem } : item))
        );
        toast.success('MCQ question updated successfully');
      } else {
        await adminMcqService.createMcq(payload);
        toast.success('MCQ question created successfully');
      }

      setIsCreateModalOpen(false);
      setEditingMcq(null);
      await fetchMcqs();
    } catch (err: any) {
      toast.error(
        getActionableErrorMessage(
          err,
          editingMcq ? 'Failed to update MCQ question' : 'Failed to create MCQ question'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete MCQ
  const handleDeleteConfirm = async () => {
    if (!selectedMcq) return;

    setSubmitting(true);
    try {
      await adminMcqService.deleteMcq(selectedMcq.id);
      toast.success(`MCQ #${selectedMcq.id} deleted successfully`);
      setIsDeleteModalOpen(false);
      setSelectedMcq(null);
      fetchMcqs();
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to delete MCQ'));
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyVariant = (diff?: string | null) => {
    const d = (diff || '').toUpperCase();
    if (d.includes('EASY') || d.includes('BASIC')) return 'easy';
    if (d.includes('MED')) return 'medium';
    if (d.includes('HARD')) return 'hard';
    return 'neutral';
  };

  const columns: Column<McqQuestion>[] = [
    {
      header: 'Identifier',
      accessorKey: 'id',
      className: 'w-20 font-mono text-slate-400 font-semibold',
      cell: (row) => <span>#{row.id}</span>,
    },
    {
      header: 'Question Statement',
      className: 'min-w-[280px]',
      cell: (row) => {
        const cleanStatement = cleanQuestionText(row.question);
        return (
          <div className="flex flex-col gap-1 max-w-xl">
            <span className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
              {cleanStatement}
            </span>
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
              {row.subjectRefName && (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {row.subjectRefName}
                </span>
              )}
              {row.topicRefName && (
                <>
                  <span>•</span>
                  <span>{row.topicRefName}</span>
                </>
              )}
              {row.companyName && (
                <>
                  <span>•</span>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {row.companyName}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Difficulty',
      className: 'w-28',
      cell: (row) => (
        <AdminBadge variant={getDifficultyVariant(row.difficultyRefName || row.difficultyRefCode)} size="sm">
          {row.difficultyRefName || row.difficultyRefCode || 'Standard'}
        </AdminBadge>
      ),
    },
    {
      header: 'Correct Answer',
      className: 'w-48',
      cell: (row) => {
        const options = synthesizeMcqOptions(row);
        const correctOpt = options.find((o) => o.isCorrect);
        if (correctOpt && correctOpt.optionText) {
          return (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                {correctOpt.optionLabel}
              </span>
              <span className="truncate max-w-[130px]" title={correctOpt.optionText}>
                {correctOpt.optionText}
              </span>
            </div>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            No options configured
          </span>
        );
      },
    },
    {
      header: 'Actions',
      className: 'w-28 text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={async () => {
              setSelectedMcq(row);
              setIsViewModalOpen(true);
              if (!row.options || row.options.length === 0) {
                try {
                  const detailRes = await adminMcqService.getMcqById(row.id);
                  const detailData: any = (detailRes?.data as any)?.data || detailRes?.data;
                  if (detailData && Array.isArray(detailData.options) && detailData.options.length > 0) {
                    setSelectedMcq((prev) => (prev?.id === row.id ? { ...prev, ...detailData } : prev));
                  }
                } catch (err) {
                  console.warn('Failed to load detailed options for viewing MCQ #' + row.id, err);
                }
              }
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-2xs cursor-pointer"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-2xs cursor-pointer"
            title="Edit MCQ"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setSelectedMcq(row);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-400 transition-colors shadow-2xs cursor-pointer"
            title="Delete MCQ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      <RequestStatus error={mcqs.length ? error : null} onRetry={fetchMcqs} />
      {/* Page Header */}
      <AdminPageHeader
        title="MCQ & Aptitude Bank"
        description="Manage aptitude questions, technical interview MCQs, and corporate assessment options."
        badge={
          <AdminBadge variant="primary">
            {totalElements} Questions
          </AdminBadge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create MCQ</span>
            </button>
            <button
              onClick={fetchMcqs}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by question text or topic..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setPageNumber(0);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.refCode}>
                {s.refName}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPageNumber(0);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulties</option>
            {difficulties.map((d) => (
              <option key={d.id} value={d.refCode}>
                {d.refName}
              </option>
            ))}
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageNumber(0);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && mcqs.length === 0 && <AdminErrorState message={error} onRetry={fetchMcqs} />}

      {/* MCQs Table */}
      {(!error || mcqs.length > 0) && (
        <div className="space-y-4">
          <AdminTable<McqQuestion>
            columns={columns}
            data={mcqs}
            loading={loading}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => {
              setSelectedMcq(row);
              setIsViewModalOpen(true);
            }}
            emptyTitle="No MCQs Found"
            emptyDescription="There are currently no multiple choice questions matching your active filters."
            emptyAction={
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New MCQ</span>
              </button>
            }
          />

          {/* Pagination */}
          {totalElements > 0 && (
            <Pagination
              currentPage={pageNumber + 1}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={(p) => setPageNumber(p - 1)}
            />
          )}
        </div>
      )}

      {/* View MCQ Modal */}
      <AdminModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedMcq ? `MCQ #${selectedMcq.id}` : 'Question Details'}
        subtitle="Question statement, answer options, and explanation"
        icon={<HelpCircle className="w-5 h-5" />}
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => {
                const target = selectedMcq;
                setIsViewModalOpen(false);
                if (target) {
                  handleOpenEditModal(target);
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Question</span>
            </button>
            <button
              type="button"
              onClick={() => setIsViewModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedMcq && (
          <div className="space-y-5 font-sans text-xs">
            {/* Meta Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <AdminBadge variant="primary">
                {selectedMcq.subjectRefName || selectedMcq.subjectRefCode || 'Subject'}
              </AdminBadge>
              {selectedMcq.topicRefName && (
                <AdminBadge variant="neutral">
                  {selectedMcq.topicRefName}
                </AdminBadge>
              )}
              <AdminBadge
                variant={getDifficultyVariant(selectedMcq.difficultyRefName || selectedMcq.difficultyRefCode)}
              >
                {selectedMcq.difficultyRefName || selectedMcq.difficultyRefCode || 'Medium'}
              </AdminBadge>
              {selectedMcq.companyName && (
                <AdminBadge variant="purple">
                  {selectedMcq.companyName}
                </AdminBadge>
              )}
            </div>

            {/* Question Text */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Question Statement
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                {cleanQuestionText(selectedMcq.question)}
              </p>
            </div>

            {/* Options List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Answer Options
              </span>
              {synthesizeMcqOptions(selectedMcq).length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {synthesizeMcqOptions(selectedMcq).map((opt, i) => (
                    <div
                      key={opt.optionLabel || i}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        opt.isCorrect
                          ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            opt.isCorrect
                              ? 'bg-emerald-500 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {opt.optionLabel}
                        </span>
                        <span className="font-medium">{opt.optionText}</span>
                      </div>
                      {opt.isCorrect && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          Correct Answer
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-xs">
                  <p className="font-semibold">No options configured in database for this question.</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    Click <strong>Edit Question</strong> to configure multiple-choice options (A, B, C, D) and assign the correct answer.
                  </p>
                </div>
              )}
            </div>

            {/* Explanation */}
            {selectedMcq.explanation && (
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Detailed Explanation
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedMcq.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* Create / Edit MCQ Modal */}
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingMcq(null);
        }}
        title={editingMcq ? `Edit MCQ #${editingMcq.id}` : 'Create MCQ Assessment Question'}
        subtitle={
          editingMcq
            ? 'Update question statement, multiple choice options, and explanation'
            : 'Configure question statement, multiple choice options, and explanation'
        }
        icon={editingMcq ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingMcq(null);
              }}
              disabled={submitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting
                ? editingMcq
                  ? 'Updating...'
                  : 'Creating...'
                : editingMcq
                ? 'Update Question'
                : 'Create Question'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 font-sans text-left">
          {/* Classification Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={formSubjectRefCode}
                onChange={(e) => setFormSubjectRefCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.refCode}>
                    {s.refName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Topic <span className="text-rose-500">*</span>
              </label>
              <select
                value={formTopicRefCode}
                onChange={(e) => setFormTopicRefCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {subjectTopics.map((t) => (
                  <option key={t.id || t.refCode} value={t.refCode}>
                    {t.refName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Difficulty <span className="text-rose-500">*</span>
              </label>
              <select
                value={formDifficultyRefCode}
                onChange={(e) => setFormDifficultyRefCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {difficulties.map((d) => (
                  <option key={d.id} value={d.refCode}>
                    {d.refName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Company Tag */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Associate Hiring Company (Optional)
            </label>
            <select
              value={formCompanyId}
              onChange={(e) => setFormCompanyId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- None (General Practice) --</option>
              {companies.map((c) => (
                <option key={c.id ?? c.name} value={c.id ?? ''}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Question Statement <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              rows={3}
              placeholder="Enter the clean multiple-choice question..."
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Options A, B, C, D */}
          <div className="space-y-2.5 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Options &amp; Correct Answer Selection
            </label>
            {formOptions.map((opt, index) => (
              <div key={opt.optionLabel} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 text-slate-700 dark:text-slate-300">
                  {opt.optionLabel}
                </div>
                <input
                  type="text"
                  value={opt.optionText}
                  onChange={(e) => {
                    const newOpts = [...formOptions];
                    newOpts[index].optionText = e.target.value;
                    setFormOptions(newOpts);
                  }}
                  placeholder={`Option ${opt.optionLabel} text...`}
                  className="flex-1 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newOpts = formOptions.map((o, idx) => ({
                      ...o,
                      isCorrect: idx === index,
                    }));
                    setFormOptions(newOpts);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    opt.isCorrect
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {opt.isCorrect ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </>
                  ) : (
                    <span>Set Correct</span>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Explanation (Optional)
            </label>
            <textarea
              value={formExplanation}
              onChange={(e) => setFormExplanation(e.target.value)}
              rows={2}
              placeholder="Why is this option correct? Include formulas or rationale..."
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Delete MCQ Question"
        message={`Are you sure you want to delete MCQ #${selectedMcq?.id}? This action permanently removes it from user aptitude assessments.`}
        confirmText={submitting ? 'Deleting...' : 'Delete Question'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMcq(null);
        }}
      />
    </div>
  );
};

export default AdminMcqs;
