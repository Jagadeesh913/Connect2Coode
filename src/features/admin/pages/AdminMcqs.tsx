import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTable, Column } from '../components/AdminTable';
import { AdminBadge } from '../components/AdminBadge';
import { AdminCard } from '../components/AdminCard';
import { AdminModal } from '../components/AdminModal';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { adminMcqService } from '../../../services/admin/adminMcqService';
import { referenceService, ReferenceItem } from '../../../services/referenceService';
import { companyService } from '../../../services/companyService';
import { CompanyBrandLogo } from '../../companies/components/CompanyBrandLogo';
import { toast } from 'react-hot-toast';
import { getActionableErrorMessage } from '../../../core/validation';
import type { McqQuestion, Company } from '../../../core/types/domain';

interface OptionFormState {
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
}

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
  const [topics, setTopics] = useState<ReferenceItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedMcq, setSelectedMcq] = useState<McqQuestion | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create Form State
  const [formSubjectRefCode, setFormSubjectRefCode] = useState<string>('APTITUDE');
  const [formTopicRefCode, setFormTopicRefCode] = useState<string>('ARRAY');
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

  // Load filter reference items on mount
  useEffect(() => {
    let isMounted = true;
    const loadReferences = async () => {
      try {
        const [subjRes, diffRes, topicRes, compRes] = await Promise.allSettled([
          referenceService.getByGroupCode('SUBJECT'),
          referenceService.getByGroupCode('DIFF'),
          referenceService.getByGroupCode('TOPIC'),
          companyService.getCompanies(),
        ]);
        if (!isMounted) return;

        if (subjRes.status === 'fulfilled' && subjRes.value?.data) {
          setSubjects(Array.isArray(subjRes.value.data) ? subjRes.value.data : []);
        }
        if (diffRes.status === 'fulfilled' && diffRes.value?.data) {
          setDifficulties(Array.isArray(diffRes.value.data) ? diffRes.value.data : []);
        }
        if (topicRes.status === 'fulfilled' && topicRes.value?.data) {
          setTopics(Array.isArray(topicRes.value.data) ? topicRes.value.data : []);
        }
        if (compRes.status === 'fulfilled' && compRes.value?.data) {
          setCompanies(Array.isArray(compRes.value.data) ? compRes.value.data : []);
        }
      } catch (err) {
        console.warn('Failed to load admin reference items:', err);
      }
    };

    loadReferences();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch MCQs list
  const fetchMcqs = useCallback(async () => {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setLoading(true);
    setError(null);

    // Resolve subject filter to numeric ID if selected
    let subjectIds: number[] = [];
    if (selectedSubject) {
      const match = subjects.find(
        (s) => String(s.refCode).toUpperCase() === selectedSubject.toUpperCase()
      );
      if (match?.id) subjectIds = [match.id];
    }

    try {
      const response = await adminMcqService.getMcqs(
        {
          subject: subjectIds,
          difficulty: selectedDifficulty ? [selectedDifficulty] : [],
          companies: [],
          topic: null,
          searchText: debouncedSearch,
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

      const pageData = response.data;
      if (pageData && Array.isArray(pageData.content)) {
        setMcqs(pageData.content);
        setTotalElements(pageData.totalElements ?? pageData.content.length);
        setTotalPages(Math.max(1, pageData.totalPages ?? 1));
      } else {
        setMcqs([]);
        setTotalElements(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      console.error('Failed to fetch admin MCQs:', err);
      setError(getActionableErrorMessage(err, 'Failed to fetch MCQ questions'));
      setMcqs([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedSubject, selectedDifficulty, debouncedSearch, pageNumber, pageSize, subjects]);

  useEffect(() => {
    fetchMcqs();
    return () => {
      searchAbortRef.current?.abort();
    };
  }, [fetchMcqs]);

  // Handle Create MCQ submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formQuestion.trim()) {
      toast.error('Question text is required');
      return;
    }

    // Verify options
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
      await adminMcqService.createMcq({
        subjectGroupCode: 'SUBJECT',
        subjectRefCode: formSubjectRefCode,
        topicGroupCode: 'TOPIC',
        topicRefCode: formTopicRefCode,
        difficultyGroupCode: 'DIFF',
        difficultyRefCode: formDifficultyRefCode,
        companyId: formCompanyId ? Number(formCompanyId) : null,
        question: formQuestion.trim(),
        explanation: formExplanation.trim() || undefined,
        options: filledOptions.map((o) => ({
          optionLabel: o.optionLabel,
          optionText: o.optionText.trim(),
          isCorrect: o.isCorrect,
        })),
      });

      toast.success('MCQ question created successfully');
      setIsCreateModalOpen(false);

      // Reset form
      setFormQuestion('');
      setFormExplanation('');
      setFormCompanyId('');
      setFormOptions([
        { optionLabel: 'A', optionText: '', isCorrect: true },
        { optionLabel: 'B', optionText: '', isCorrect: false },
        { optionLabel: 'C', optionText: '', isCorrect: false },
        { optionLabel: 'D', optionText: '', isCorrect: false },
      ]);

      fetchMcqs();
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to create MCQ question'));
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

  // Option handlers for Create Form
  const handleOptionChange = (idx: number, text: string) => {
    setFormOptions((prev) =>
      prev.map((opt, i) => (i === idx ? { ...opt, optionText: text } : opt))
    );
  };

  const handleCorrectRadio = (idx: number) => {
    setFormOptions((prev) =>
      prev.map((opt, i) => ({ ...opt, isCorrect: i === idx }))
    );
  };

  const handleAddOption = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextIdx = formOptions.length;
    const nextLabel = letters[nextIdx] || String.fromCharCode(65 + nextIdx);
    setFormOptions((prev) => [
      ...prev,
      { optionLabel: nextLabel, optionText: '', isCorrect: false },
    ]);
  };

  const handleRemoveOption = (idx: number) => {
    if (formOptions.length <= 2) {
      toast.error('An MCQ must have at least 2 options');
      return;
    }
    setFormOptions((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      // Ensure at least one is correct
      const stillHasCorrect = filtered.some((o) => o.isCorrect);
      if (!stillHasCorrect && filtered.length > 0) {
        filtered[0].isCorrect = true;
      }
      return filtered;
    });
  };

  // Table Columns
  const columns: Column<McqQuestion>[] = [
    {
      header: 'ID',
      cell: (row) => <span className="font-mono text-gray-400 font-bold">#{row.id}</span>,
      className: 'w-16',
    },
    {
      header: 'Question',
      cell: (row) => (
        <div className="flex flex-col gap-1 max-w-md">
          <span className="font-bold text-white line-clamp-2">{row.question}</span>
          {row.explanation && (
            <span className="text-[11px] text-gray-400 line-clamp-1 italic">
              Exp: {row.explanation}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Subject',
      cell: (row) => {
        const subj = row.subjectRefName || row.subjectRefCode || 'N/A';
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-violet-950/60 text-violet-300 border border-violet-800/60">
            {subj}
          </span>
        );
      },
    },
    {
      header: 'Topic',
      cell: (row) => (
        <span className="text-gray-300 font-medium">
          {row.topicRefName || row.topicRefCode || '—'}
        </span>
      ),
    },
    {
      header: 'Difficulty',
      cell: (row) => {
        const diff = String(row.difficultyRefName || row.difficultyRefCode || 'Medium').toUpperCase();
        const variant =
          diff.includes('EASY') || diff.includes('BASIC')
            ? 'success'
            : diff.includes('HARD')
            ? 'danger'
            : 'warning';
        return <AdminBadge variant={variant}>{diff}</AdminBadge>;
      },
    },
    {
      header: 'Target Company',
      cell: (row) =>
        row.companyName ? (
          <div className="flex items-center gap-1.5">
            <CompanyBrandLogo name={row.companyName} className="w-4 h-4 inline-block" />
            <span className="text-gray-300 text-xs font-semibold">{row.companyName}</span>
          </div>
        ) : (
          <span className="text-gray-500">—</span>
        ),
    },
    {
      header: 'Options',
      cell: (row) => (
        <span className="font-semibold text-gray-300">
          {Array.isArray(row.options) ? `${row.options.length} options` : '0'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setSelectedMcq(row);
              setIsViewModalOpen(true);
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="View Question Details"
          >
            <i className="fa-solid fa-eye text-xs"></i>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedMcq(row);
              setIsDeleteModalOpen(true);
            }}
            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
            title="Delete MCQ"
          >
            <i className="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      ),
      className: 'w-24 text-right',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <AdminPageHeader
        title="MCQs & Aptitude Bank"
        description="Manage Multiple Choice Questions across Aptitude, Pseudocode, Reasoning, Verbal, and technical topics"
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-white hover:bg-neutral-200 text-neutral-900 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shrink-0"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Create MCQ</span>
          </button>
        }
      />

      {/* Filter Toolbar */}
      <AdminCard>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input
              type="text"
              placeholder="Search by question text or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Subject Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setPageNumber(0);
              }}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500 transition-colors cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.refCode || s.id} value={s.refCode}>
                  {s.refName || s.refCode}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="w-full sm:w-40">
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                setPageNumber(0);
              }}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500 transition-colors cursor-pointer"
            >
              <option value="">All Difficulties</option>
              {difficulties.map((d) => (
                <option key={d.refCode || d.id} value={d.refCode}>
                  {d.refName || d.refCode}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {(selectedSubject || selectedDifficulty || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSubject('');
                setSelectedDifficulty('');
                setSearchTerm('');
                setPageNumber(0);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </AdminCard>

      {/* Main Table */}
      <AdminCard>
        {error && (
          <div className="p-4 mb-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchMcqs()}
              className="px-3 py-1 bg-rose-700 hover:bg-rose-600 rounded text-white font-bold"
            >
              Retry
            </button>
          </div>
        )}

        <AdminTable
          columns={columns}
          data={mcqs}
          loading={loading}
          keyExtractor={(row) => row.id}
          emptyTitle="No MCQs found"
          emptyDescription="There are currently no questions matching your query criteria."
        />

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-xs">
            <div className="text-gray-400">
              Showing page <span className="font-bold text-white">{pageNumber + 1}</span> of{' '}
              <span className="font-bold text-white">{totalPages}</span> ({totalElements} total)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pageNumber <= 0 || loading}
                onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={pageNumber >= totalPages - 1 || loading}
                onClick={() => setPageNumber((p) => Math.min(totalPages - 1, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </AdminCard>

      {/* CREATE MCQ MODAL */}
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create MCQ Question"
        subtitle="Add a new multiple-choice question to the question bank"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {/* Row 1: Subject & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-bold mb-1.5">Subject *</label>
              <select
                value={formSubjectRefCode}
                onChange={(e) => setFormSubjectRefCode(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-violet-500"
                required
              >
                {subjects.map((s) => (
                  <option key={s.refCode || s.id} value={s.refCode}>
                    {s.refName || s.refCode} ({s.refCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1.5">Topic *</label>
              <select
                value={formTopicRefCode}
                onChange={(e) => setFormTopicRefCode(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-violet-500"
                required
              >
                {topics.map((t) => (
                  <option key={t.refCode || t.id} value={t.refCode}>
                    {t.refName || t.refCode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Difficulty & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-bold mb-1.5">Difficulty *</label>
              <select
                value={formDifficultyRefCode}
                onChange={(e) => setFormDifficultyRefCode(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-violet-500"
                required
              >
                {difficulties.map((d) => (
                  <option key={d.refCode || d.id} value={d.refCode}>
                    {d.refName || d.refCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1.5">Target Company (Optional)</label>
              <select
                value={formCompanyId}
                onChange={(e) => setFormCompanyId(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-violet-500"
              >
                <option value="">No Company Tag</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id ?? ''}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">Question Text *</label>
            <textarea
              rows={3}
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              placeholder="Enter the complete question prompt..."
              className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500"
              required
            />
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">Explanation & Solution *</label>
            <textarea
              rows={2}
              value={formExplanation}
              onChange={(e) => setFormExplanation(e.target.value)}
              placeholder="Explain the step-by-step solution..."
              className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          {/* Options Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 font-bold">Options & Correct Answer *</label>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-violet-400 hover:text-violet-300 font-bold text-xs"
              >
                + Add Option
              </button>
            </div>

            <div className="space-y-2">
              {formOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2.5 bg-neutral-950 p-2 rounded-xl border border-white/5">
                  <input
                    type="radio"
                    name="correctOptionRadio"
                    checked={opt.isCorrect}
                    onChange={() => handleCorrectRadio(idx)}
                    title="Mark as correct answer"
                    className="w-4 h-4 text-violet-600 focus:ring-violet-500 cursor-pointer ml-1"
                  />
                  <span className="w-6 font-bold text-gray-400 text-center">{opt.optionLabel}</span>
                  <input
                    type="text"
                    value={opt.optionText}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${opt.optionLabel} text...`}
                    className="flex-1 bg-transparent border-none text-white text-xs outline-none"
                    required
                  />
                  {formOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-gray-500 hover:text-rose-400 p-1"
                    >
                      <i className="fa-solid fa-times text-xs"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              Select the radio button next to the option that is the correct answer.
            </p>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Question'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* VIEW MCQ DETAILS MODAL */}
      {selectedMcq && isViewModalOpen && (
        <AdminModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedMcq(null);
          }}
          title={`MCQ Details #${selectedMcq.id}`}
          subtitle={`${selectedMcq.subjectRefName || selectedMcq.subjectRefCode} • ${selectedMcq.difficultyRefName || selectedMcq.difficultyRefCode || 'Medium'}`}
          maxWidth="xl"
        >
          <div className="space-y-5 text-xs text-left">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Question
              </span>
              <p className="text-sm font-bold text-white leading-relaxed bg-neutral-950 p-4 rounded-xl border border-white/10">
                {selectedMcq.question}
              </p>
            </div>

            {selectedMcq.options && selectedMcq.options.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Options
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedMcq.options.map((opt, i) => (
                    <div
                      key={opt.id || i}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                        opt.isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold'
                          : 'bg-neutral-950 border-white/10 text-gray-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          opt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        {opt.optionLabel || String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt.optionText}</span>
                      {opt.isCorrect && (
                        <i className="fa-solid fa-check ml-auto text-emerald-400 text-xs"></i>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedMcq.explanation && (
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Explanation
                </span>
                <p className="text-gray-300 bg-neutral-950 p-3.5 rounded-xl border border-white/10 leading-relaxed">
                  {selectedMcq.explanation}
                </p>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMcq(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete MCQ Question"
        message={`Are you sure you want to permanently delete MCQ #${selectedMcq?.id}? This action cannot be undone.`}
        confirmText={submitting ? 'Deleting...' : 'Delete Question'}
        variant="danger"
      />
    </div>
  );
};
