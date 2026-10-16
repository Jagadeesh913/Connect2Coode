import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminModal } from '../AdminModal';
import { QuestionPayload, QuestionHint, QuestionTestCase } from '../../../../services/questionService';
import { referenceService, ReferenceItem } from '../../../../services/referenceService';
import { adminCompanyService, CompanyItem } from '../../../../services/admin/adminCompanyService';
import { toast } from 'react-hot-toast';
import { adminQuestionSchema, AdminQuestionFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';

export type QuestionFormData = AdminQuestionFormData & {
  questionHints?: QuestionHint[];
  testCases?: QuestionTestCase[];
  companies?: CompanyItem[];
};

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  initialData?: QuestionPayload | null;
  submitting?: boolean;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  submitting = false,
}) => {
  const isEditing = Boolean(initialData?.id);
  const [activeTab, setActiveTab] = useState<'METADATA' | 'TESTCASES'>('METADATA');

  // Dynamic Reference Libraries fetched from REAL Backend API
  const [difficulties, setDifficulties] = useState<ReferenceItem[]>([]);
  const [topics, setTopics] = useState<ReferenceItem[]>([]);
  const [qpfs, setQpfs] = useState<ReferenceItem[]>([]);
  const [testCaseTypes, setTestCaseTypes] = useState<ReferenceItem[]>([]);
  const [allCompanies, setAllCompanies] = useState<CompanyItem[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyItem[]>([]);

  const [refLoading, setRefLoading] = useState<boolean>(false);
  const [refError, setRefError] = useState<string | null>(null);

  // Question Hints State
  const [hints, setHints] = useState<QuestionHint[]>([]);

  // Inline Test Cases State for Own Problems
  const [testCases, setTestCases] = useState<QuestionTestCase[]>([
    {
      input: '',
      expectedOutput: '',
      explanation: '',
      isHidden: false,
      displayOrder: 1,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: '',
    },
  ]);
  const [testCaseErrors, setTestCaseErrors] = useState<Record<number, { input?: string; expectedOutput?: string }>>({});

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(adminQuestionSchema) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      id: null,
      difficultyRefGroupCode: 'DIFF',
      difficultyRefCode: '',
      difficultyRefName: '',
      topicRefGroupCode: 'TOPIC',
      topicRefCode: '',
      topicRefName: '',
      qpfRefGroupCode: 'QPF',
      qpfRefCode: '',
      qpfRefName: '',
      isOwnProblem: true,
      isActive: true,
      askedDate: '',
    },
  });

  // Fetch Reference Libraries and Companies from REAL backend API when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadReferenceData = async () => {
      setRefLoading(true);
      setRefError(null);
      try {
        const [diffRes, topicRes, qpfRes, tcTypeRes, compRes] = await Promise.all([
          referenceService.getByGroupCode('DIFF'),
          referenceService.getByGroupCode('TOPIC'),
          referenceService.getByGroupCode('QPF'),
          referenceService.getByGroupCode('TESTCASETYPE'),
          adminCompanyService.getCompanies(),
        ]);

        if (!isMounted) return;

        const diffList = diffRes?.data || (Array.isArray(diffRes) ? diffRes : []);
        const topicList = topicRes?.data || (Array.isArray(topicRes) ? topicRes : []);
        const qpfList = qpfRes?.data || (Array.isArray(qpfRes) ? qpfRes : []);
        const tcTypeList = tcTypeRes?.data || (Array.isArray(tcTypeRes) ? tcTypeRes : []);
        const compList = compRes?.data || (Array.isArray(compRes) ? compRes : []);

        const validDiffs = Array.isArray(diffList) ? diffList : [];
        const validTopics = Array.isArray(topicList) ? topicList : [];
        const validQpfs = Array.isArray(qpfList) ? qpfList : [];
        const validTcTypes = Array.isArray(tcTypeList) ? tcTypeList : [];
        const validCompanies = Array.isArray(compList) ? compList : [];

        setDifficulties(validDiffs);
        setTopics(validTopics);
        setQpfs(validQpfs);
        setTestCaseTypes(validTcTypes);
        setAllCompanies(validCompanies);

        if (validTcTypes.length > 0) {
          setTestCases((prev) =>
            prev.map((tc) => ({
              ...tc,
              typeRefCode: tc.typeRefCode || validTcTypes[0].refCode,
            }))
          );
        }

        // If creating a new question, populate defaults from API list
        if (!initialData) {
          if (validDiffs.length > 0 && !watch('difficultyRefCode')) {
            setValue('difficultyRefGroupCode', validDiffs[0].refGroupCode || 'DIFF');
            setValue('difficultyRefCode', validDiffs[0].refCode);
            setValue('difficultyRefName', validDiffs[0].refName);
          }
          if (validTopics.length > 0 && !watch('topicRefCode')) {
            setValue('topicRefGroupCode', validTopics[0].refGroupCode || 'TOPIC');
            setValue('topicRefCode', validTopics[0].refCode);
            setValue('topicRefName', validTopics[0].refName);
          }
          if (validQpfs.length > 0 && !watch('qpfRefCode')) {
            setValue('qpfRefGroupCode', validQpfs[0].refGroupCode || 'QPF');
            setValue('qpfRefCode', validQpfs[0].refCode);
            setValue('qpfRefName', validQpfs[0].refName);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setRefError(err?.message || 'Failed to load reference options from server');
        }
      } finally {
        if (isMounted) {
          setRefLoading(false);
        }
      }
    };

    loadReferenceData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveTab('METADATA');
    if (initialData) {
      const formattedAskedDate = initialData.askedDate
        ? initialData.askedDate.split('T')[0]
        : '';
      reset({
        id: initialData.id ?? null,
        title: initialData.title || '',
        description: initialData.description || '',
        difficultyRefGroupCode: initialData.difficultyRefGroupCode || 'DIFF',
        difficultyRefCode: initialData.difficultyRefCode || '',
        difficultyRefName: initialData.difficultyRefName || '',
        topicRefGroupCode: initialData.topicRefGroupCode || 'TOPIC',
        topicRefCode: initialData.topicRefCode || '',
        topicRefName: initialData.topicRefName || '',
        qpfRefGroupCode: initialData.qpfRefGroupCode || 'QPF',
        qpfRefCode: initialData.qpfRefCode || '',
        qpfRefName: initialData.qpfRefName || '',
        leetCodeUrl: initialData.leetCodeUrl || '',
        gfgUrl: initialData.gfgUrl || '',
        hackerRankUrl: initialData.hackerRankUrl || '',
        isOwnProblem: initialData.isOwnProblem ?? true,
        isActive: initialData.isActive ?? true,
        askedDate: formattedAskedDate,
      });
      setHints(
        Array.isArray(initialData.questionHints)
          ? initialData.questionHints.map((h) => ({ id: h.id ?? null, hintText: h.hintText }))
          : []
      );
      setSelectedCompanies(Array.isArray(initialData.companies) ? initialData.companies : []);
      if (Array.isArray(initialData.testCases) && initialData.testCases.length > 0) {
        setTestCases(initialData.testCases);
      }
    } else {
      reset({
        id: null,
        title: '',
        description: '',
        difficultyRefGroupCode: 'DIFF',
        difficultyRefCode: '',
        difficultyRefName: '',
        topicRefGroupCode: 'TOPIC',
        topicRefCode: '',
        topicRefName: '',
        qpfRefGroupCode: 'QPF',
        qpfRefCode: '',
        qpfRefName: '',
        leetCodeUrl: '',
        gfgUrl: '',
        hackerRankUrl: '',
        isOwnProblem: true,
        isActive: true,
        askedDate: '',
      });
      setHints([]);
      setSelectedCompanies([]);
      setTestCases([
        {
          input: '',
          expectedOutput: '',
          explanation: '',
          isHidden: false,
          displayOrder: 1,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: testCaseTypes.length > 0 ? testCaseTypes[0].refCode : 'NECESSARY',
        },
      ]);
    }
  }, [initialData, reset]);

  const handleDifficultySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const match = difficulties.find((d) => d.refCode === selectedCode);
    if (match) {
      setValue('difficultyRefGroupCode', match.refGroupCode || 'DIFF');
      setValue('difficultyRefCode', match.refCode);
      setValue('difficultyRefName', match.refName);
    }
  };

  const handleTopicSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const match = topics.find((t) => t.refCode === selectedCode);
    if (match) {
      setValue('topicRefGroupCode', match.refGroupCode || 'TOPIC');
      setValue('topicRefCode', match.refCode);
      setValue('topicRefName', match.refName);
    }
  };

  const handleQpfSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const match = qpfs.find((q) => q.refCode === selectedCode);
    if (match) {
      setValue('qpfRefGroupCode', match.refGroupCode || 'QPF');
      setValue('qpfRefCode', match.refCode);
      setValue('qpfRefName', match.refName);
    }
  };

  const handleAddHint = () => {
    setHints((prev) => [...prev, { id: null, hintText: '' }]);
  };

  const handleRemoveHint = (index: number) => {
    setHints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHintChange = (index: number, text: string) => {
    setHints((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], hintText: text };
      return updated;
    });
  };

  // Target Companies Dropdown & Multiselect Handlers
  const handleSelectCompanyFromDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const match = allCompanies.find((c) => String(c.id) === val || c.name.toLowerCase() === val.toLowerCase());
    if (match && !selectedCompanies.some((c) => (c.id && c.id === match.id) || c.name.toLowerCase() === match.name.toLowerCase())) {
      setSelectedCompanies((prev) => [...prev, match]);
    }
  };

  const handleClearAllCompanies = () => {
    setSelectedCompanies([]);
  };

  const handleRemoveCompany = (companyName: string) => {
    setSelectedCompanies(selectedCompanies.filter((c) => c.name !== companyName));
  };

  // Test Case Management Handlers
  const handleAddTestCase = () => {
    const defaultType = testCaseTypes.length > 0 ? testCaseTypes[0].refCode : 'NECESSARY';
    setTestCases((prev) => [
      ...prev,
      {
        input: '',
        expectedOutput: '',
        explanation: '',
        isHidden: false,
        displayOrder: prev.length + 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: defaultType,
      },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length === 1) {
      toast.error('At least one test case is required for your own problem');
      return;
    }
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index: number, field: keyof QuestionTestCase, value: any) => {
    setTestCases((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === 'typeRefCode') {
        const matched = testCaseTypes.find((t) => t.refCode === value);
        if (matched) {
          target.typeRefGroupCode = 'TESTCASETYPE';
          target.typeRefName = matched.refName;
        }
      }
      if (field === 'isHidden') {
        if (value === true && target.typeRefCode === 'SAMPLE') {
          target.typeRefCode = 'NECESSARY';
          target.typeRefName = testCaseTypes.find((t) => t.refCode === 'NECESSARY')?.refName || 'Mandatory Test Case';
        } else if (value === false && target.typeRefCode === 'NECESSARY') {
          target.typeRefCode = 'SAMPLE';
          target.typeRefName = testCaseTypes.find((t) => t.refCode === 'SAMPLE')?.refName || 'Visible Sample Test Case';
        }
      }

      updated[index] = target;
      return updated;
    });

    if (testCaseErrors[index]) {
      setTestCaseErrors((prev) => {
        const current = { ...prev[index] };
        if (field === 'input' && value.trim()) delete current.input;
        if (field === 'expectedOutput' && value.trim()) delete current.expectedOutput;
        if (Object.keys(current).length === 0) {
          const next = { ...prev };
          delete next[index];
          return next;
        }
        return { ...prev, [index]: current };
      });
    }
  };

  const handleFormSubmit = (data: QuestionFormData) => {
    const isNew = !data.id;
    const finalIsActive = isNew ? (data.isActive !== false) : (data.isActive ?? true);
    const isOwn = data.isOwnProblem === true;

    // Validate inline test cases for own problems
    if (isOwn) {
      if (testCases.length === 0) {
        toast.error('At least one Test Case is required for your own problem.');
        setActiveTab('TESTCASES');
        return;
      }
      const newErrors: Record<number, { input?: string; expectedOutput?: string }> = {};
      let hasError = false;
      for (let i = 0; i < testCases.length; i++) {
        const tcErrors: { input?: string; expectedOutput?: string } = {};
        if (!testCases[i].input.trim()) {
          tcErrors.input = 'Input raw string is required.';
          hasError = true;
        }
        if (!testCases[i].expectedOutput.trim()) {
          tcErrors.expectedOutput = 'Expected output raw string is required.';
          hasError = true;
        }
        if (tcErrors.input || tcErrors.expectedOutput) {
          newErrors[i] = tcErrors;
        }
      }
      if (hasError) {
        setTestCaseErrors(newErrors);
        setActiveTab('TESTCASES');
        toast.error('Please enter required inputs and outputs for all test cases.');
        return;
      }
    }

    const sanitizedTestCases: QuestionTestCase[] = testCases.map((tc, idx) => {
      const typeCode = tc.typeRefCode || (tc.isHidden ? 'NECESSARY' : 'SAMPLE');
      const matched = testCaseTypes.find((t) => t.refCode === typeCode);
      return {
        ...tc,
        displayOrder: idx + 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: typeCode,
        typeRefName: matched?.refName || tc.typeRefName || (tc.isHidden ? 'Mandatory Test Case' : 'Visible Sample Test Case'),
      };
    });

    onSubmit({
      ...data,
      isOwnProblem: isOwn,
      isActive: finalIsActive,
      askedDate: isOwn && data.askedDate && data.askedDate.trim() !== '' ? data.askedDate.trim() : null,
      leetCodeUrl: !isOwn && data.leetCodeUrl ? data.leetCodeUrl.trim() : '',
      gfgUrl: !isOwn && data.gfgUrl ? data.gfgUrl.trim() : '',
      hackerRankUrl: !isOwn && data.hackerRankUrl ? data.hackerRankUrl.trim() : '',
      questionHints: hints.filter((h) => h.hintText.trim() !== ''),
      testCases: isOwn ? sanitizedTestCases : [],
      companies: selectedCompanies,
    });
  };

  const isOwnProblem = watch('isOwnProblem') === true;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit DSA Problem #${initialData?.id}` : 'Create New DSA Problem'}
      subtitle="Author problem metadata, companies, hints, and testcase assertions"
      maxWidth="4xl"
    >
      <div className="space-y-6 font-sans text-left">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('METADATA')}
            className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'METADATA'
                ? 'border-neutral-600 text-neutral-300'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-file-pen" />
            <span>Problem Details &amp; Metadata</span>
          </button>

          {isOwnProblem && (
            <button
              type="button"
              onClick={() => setActiveTab('TESTCASES')}
              className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === 'TESTCASES'
                  ? 'border-neutral-600 text-neutral-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-vials" />
              <span>Test Cases &amp; Assertions ({testCases.length})</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-5">
          {refError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              {refError}
            </div>
          )}

          {/* TAB 1: METADATA & PROBLEM STATEMENT */}
          {activeTab === 'METADATA' ? (
            <div className="space-y-4">
              {/* Question Title */}
              <div className="space-y-1">
                <label htmlFor="question-title-input" className="block text-xs font-semibold text-gray-300">Problem Title *</label>
                <input
                  id="question-title-input"
                  type="text"
                  placeholder="e.g. Two Sum, Binary Search"
                  aria-invalid={errors.title ? 'true' : 'false'}
                  aria-describedby={errors.title ? 'question-title-error' : undefined}
                  className={`w-full bg-neutral-950 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border transition-all focus:outline-none focus:ring-1 ${
                    errors.title ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-neutral-600 focus:ring-neutral-500'
                  }`}
                  {...register('title')}
                />
                <FormFieldError error={errors.title?.message} id="question-title-error" />
              </div>

              {/* Problem Ownership Selection (Radio Buttons) */}
              <div className="p-4 bg-neutral-950 backdrop-blur-md border border-white/10 rounded-2xl space-y-2">
                <label className="block text-xs font-semibold text-gray-300">Is this your own problem? *</label>
                <div className="flex items-center gap-6 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white">
                    <input
                      type="radio"
                      name="isOwnProblemRadio"
                      className="w-4 h-4 text-neutral-300 focus:ring-neutral-500 bg-neutral-950 border-white/20 cursor-pointer"
                      checked={isOwnProblem}
                      onChange={() => setValue('isOwnProblem', true, { shouldValidate: true, shouldDirty: true })}
                    />
                    <span>( ) Yes — My Own Problem</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white">
                    <input
                      type="radio"
                      name="isOwnProblemRadio"
                      className="w-4 h-4 text-neutral-300 focus:ring-neutral-500 bg-neutral-950 border-white/20 cursor-pointer"
                      checked={!isOwnProblem}
                      onChange={() => setValue('isOwnProblem', false, { shouldValidate: true, shouldDirty: true })}
                    />
                    <span>( ) No — External Problem</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Reference Library Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Difficulty Dropdown */}
                <div className="space-y-1">
                  <label htmlFor="question-difficulty-select" className="block text-xs font-semibold text-gray-300">Difficulty Level *</label>
                  <div className="relative">
                    <select
                      id="question-difficulty-select"
                      disabled={refLoading || difficulties.length === 0}
                      className="w-full appearance-none bg-neutral-950 text-gray-100 rounded-xl px-3.5 pr-8 py-2.5 text-xs font-semibold border border-white/10 hover:border-white/20 focus:border-blue-500 transition-all focus:outline-none cursor-pointer disabled:opacity-50"
                      value={watch('difficultyRefCode') || ''}
                      onChange={handleDifficultySelect}
                    >
                      {refLoading ? (
                        <option value="">Loading difficulties...</option>
                      ) : difficulties.length === 0 ? (
                        <option value="">No options available</option>
                      ) : (
                        difficulties.map((item) => (
                          <option key={item.id || item.refCode} value={item.refCode}>
                            {item.refName} ({item.refCode})
                          </option>
                        ))
                      )}
                    </select>
                    <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  </div>
                  <FormFieldError error={errors.difficultyRefCode?.message} />
                </div>

                {/* Topic Dropdown */}
                <div className="space-y-1">
                  <label htmlFor="question-topic-select" className="block text-xs font-semibold text-gray-300">DSA Topic / Category *</label>
                  <div className="relative">
                    <select
                      id="question-topic-select"
                      disabled={refLoading || topics.length === 0}
                      className="w-full appearance-none bg-neutral-950 text-gray-100 rounded-xl px-3.5 pr-8 py-2.5 text-xs font-semibold border border-white/10 hover:border-white/20 focus:border-blue-500 transition-all focus:outline-none cursor-pointer disabled:opacity-50"
                      value={watch('topicRefCode') || ''}
                      onChange={handleTopicSelect}
                    >
                      {refLoading ? (
                        <option value="">Loading topics...</option>
                      ) : topics.length === 0 ? (
                        <option value="">No options available</option>
                      ) : (
                        topics.map((item) => (
                          <option key={item.id || item.refCode} value={item.refCode}>
                            {item.refName} ({item.refCode})
                          </option>
                        ))
                      )}
                    </select>
                    <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  </div>
                  <FormFieldError error={errors.topicRefCode?.message} />
                </div>

                {/* Question Exam Platform / QPF Dropdown */}
                <div className="space-y-1">
                  <label htmlFor="question-qpf-select" className="block text-xs font-semibold text-gray-300">Exam Platform (QPF) *</label>
                  <div className="relative">
                    <select
                      id="question-qpf-select"
                      disabled={refLoading || qpfs.length === 0}
                      className="w-full appearance-none bg-neutral-950 text-gray-100 rounded-xl px-3.5 pr-8 py-2.5 text-xs font-semibold border border-white/10 hover:border-white/20 focus:border-blue-500 transition-all focus:outline-none cursor-pointer disabled:opacity-50"
                      value={watch('qpfRefCode') || ''}
                      onChange={handleQpfSelect}
                    >
                      {refLoading ? (
                        <option value="">Loading platforms...</option>
                      ) : qpfs.length === 0 ? (
                        <option value="">No options available</option>
                      ) : (
                        qpfs.map((item) => (
                          <option key={item.id || item.refCode} value={item.refCode}>
                            {item.refName} ({item.refCode})
                          </option>
                        ))
                      )}
                    </select>
                    <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  </div>
                  <FormFieldError error={errors.qpfRefCode?.message} />
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-1">
                <label htmlFor="question-description-input" className="block text-xs font-semibold text-gray-300">Problem Description *</label>
                <textarea
                  id="question-description-input"
                  rows={4}
                  placeholder="Describe the problem statement, inputs, constraints, and expected output format..."
                  aria-invalid={errors.description ? 'true' : 'false'}
                  aria-describedby={errors.description ? 'question-desc-error' : undefined}
                  className={`w-full bg-neutral-950 text-gray-100 placeholder-gray-500 rounded-xl p-3.5 text-xs border transition-all focus:outline-none leading-relaxed ${
                    errors.description ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-neutral-600'
                  }`}
                  {...register('description')}
                />
                <FormFieldError error={errors.description?.message} id="question-desc-error" />
              </div>

              {/* Active Status & Conditional Asked Date Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                {/* Active Status Toggle - Temporarily Commented Out
                <div className="flex items-center gap-3 p-3.5 bg-neutral-950 backdrop-blur-md border border-white/10 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    className="w-4 h-4 rounded bg-neutral-950 border-white/10 text-neutral-300 focus:ring-neutral-500 cursor-pointer"
                    checked={watch('isActive') !== false}
                    onChange={(e) => setValue('isActive', e.target.checked, { shouldValidate: true, shouldDirty: true })}
                  />
                  <label htmlFor="isActiveToggle" className="text-xs font-semibold text-gray-300 cursor-pointer select-none">
                    Active Problem (Published to users)
                  </label>
                </div>
                */}

                {/* Conditional Field: Originally Asked Date (ONLY when isOwnProblem === true) */}
                {isOwnProblem && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-300">
                      Originally Asked Date
                    </label>
                    <input
                      type="date"
                      onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                      className="w-full bg-neutral-950 text-white rounded-xl px-4 py-2.5 text-xs border border-white/10 transition-all focus:outline-none focus:border-neutral-600 font-sans cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                      {...register('askedDate')}
                    />
                  </div>
                )}
              </div>

              {/* Conditional Field: External Platform URLs (LeetCode, GeeksforGeeks, HackerRank) - Temporarily Commented Out */}
              {/*
              {!isOwnProblem && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-400">LeetCode URL</label>
                    <input
                      type="text"
                      placeholder="https://leetcode.com/..."
                      className="w-full bg-neutral-950 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 transition-all focus:outline-none focus:border-neutral-600"
                      {...register('leetCodeUrl')}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-400">GeeksforGeeks URL</label>
                    <input
                      type="text"
                      placeholder="https://geeksforgeeks.org/..."
                      className="w-full bg-neutral-950 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 transition-all focus:outline-none focus:border-neutral-600"
                      {...register('gfgUrl')}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-400">HackerRank URL</label>
                    <input
                      type="text"
                      placeholder="https://hackerrank.com/..."
                      className="w-full bg-neutral-950 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 transition-all focus:outline-none focus:border-neutral-600"
                      {...register('hackerRankUrl')}
                    />
                  </div>
                </div>
              )}
              */}

              {/* Tagged Hiring Companies Multiselect Dropdown */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-300">
                    Tagged Hiring Companies <span className="text-gray-500 font-normal">(Select multiple)</span>
                  </label>
                  {selectedCompanies.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllCompanies}
                      className="text-[11px] text-gray-400 hover:text-rose-400 cursor-pointer transition-colors"
                    >
                      Clear All ({selectedCompanies.length})
                    </button>
                  )}
                </div>

                {/* Dropdown Selector containing all added companies */}
                <div className="relative">
                  <select
                    value=""
                    onChange={handleSelectCompanyFromDropdown}
                    className="w-full appearance-none bg-neutral-950 text-gray-100 rounded-xl px-4 pr-8 py-2.5 text-xs border border-white/10 hover:border-white/20 focus:border-blue-500 transition-all focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>-- Select a hiring company from list --</option>
                    {allCompanies.map((c) => {
                      const isSelected = selectedCompanies.some(
                        (sc) => (sc.id && sc.id === c.id) || sc.name.toLowerCase() === c.name.toLowerCase()
                      );
                      return (
                        <option key={c.id || c.name} value={String(c.id || c.name)} disabled={isSelected} className="bg-neutral-900 text-white">
                          {isSelected ? `✓ ${c.name} (Tagged)` : c.name}
                        </option>
                      );
                    })}
                  </select>
                  <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>

                {/* Tagged Companies Chips List */}
                {selectedCompanies.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {selectedCompanies.map((c) => (
                      <span
                        key={c.id || c.name}
                        className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white flex items-center gap-2 font-medium shadow-xs"
                      >
                        <i className="fa-solid fa-building text-[10px] text-neutral-300"></i>
                        <span>{c.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCompany(c.name)}
                          className="text-gray-400 hover:text-rose-400 cursor-pointer ml-1 text-xs font-bold"
                          title="Remove company tag"
                        >
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 italic">No companies tagged yet. Select one or more from the dropdown above.</p>
                )}
              </div>

              {/* Problem Hints Section */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-300">Problem Hints</label>
                  <button
                    type="button"
                    onClick={handleAddHint}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 font-sans"
                  >
                    + Add Hint
                  </button>
                </div>
                {hints.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No hints added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {hints.map((hint, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder={`Hint #${idx + 1}...`}
                          value={hint.hintText}
                          onChange={(e) => handleHintChange(idx, e.target.value)}
                          className="flex-1 bg-neutral-950 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 focus:outline-none focus:border-neutral-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveHint(idx)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                        >
                          <i className="fa-solid fa-trash text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: TEST CASES & ASSERTIONS */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white font-heading">Test Cases &amp; Assertions</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Configure sample test cases and hidden evaluation cases for your problem.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="px-3.5 py-2 bg-neutral-950 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                >
                  + Add Test Case
                </button>
              </div>

              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {testCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-neutral-950 backdrop-blur-md border border-white/10 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-neutral-300 font-mono">Case #{idx + 1}</span>
                        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!tc.isHidden}
                            onChange={(e) => handleTestCaseChange(idx, 'isHidden', !e.target.checked)}
                            className="rounded bg-neutral-950 border-white/10 text-neutral-300 focus:ring-neutral-500 cursor-pointer"
                          />
                          <span>Public Example</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Reference Library Type Selector */}
                        <div className="relative">
                          <select
                            value={tc.typeRefCode || 'NECESSARY'}
                            onChange={(e) => handleTestCaseChange(idx, 'typeRefCode', e.target.value)}
                            className="appearance-none bg-neutral-950 text-gray-200 text-xs rounded-xl pl-3 pr-8 py-1.5 border border-white/10 focus:outline-none focus:border-neutral-500 cursor-pointer shadow-2xs transition-colors"
                          >
                            {testCaseTypes.length > 0 ? (
                              testCaseTypes.map((t) => (
                                <option key={t.refCode} value={t.refCode} className="bg-neutral-900 text-white">
                                  {t.refName || t.refCode}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="NECESSARY" className="bg-neutral-900 text-white">Mandatory Case (NECESSARY)</option>
                                <option value="CORNER" className="bg-neutral-900 text-white">Edge Case (CORNER)</option>
                                <option value="TLE" className="bg-neutral-900 text-white">Time Limit (TLE)</option>
                              </>
                            )}
                          </select>
                          <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(idx)}
                          className="text-gray-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        >
                          <i className="fa-solid fa-trash-can text-xs" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor={`modal-tc-input-${idx}`} className="block text-[11px] font-semibold text-gray-400">
                          Standard Input Raw String *
                        </label>
                        <textarea
                          id={`modal-tc-input-${idx}`}
                          rows={3}
                          value={tc.input}
                          aria-invalid={testCaseErrors[idx]?.input ? 'true' : 'false'}
                          aria-describedby={testCaseErrors[idx]?.input ? `modal-tc-input-error-${idx}` : undefined}
                          onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                          placeholder="Raw stdin input..."
                          className={`w-full bg-neutral-950 font-mono text-emerald-400 text-xs p-2.5 rounded-xl border transition-colors focus:outline-none ${
                            testCaseErrors[idx]?.input ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-neutral-600'
                          }`}
                        />
                        <FormFieldError error={testCaseErrors[idx]?.input} id={`modal-tc-input-error-${idx}`} />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={`modal-tc-output-${idx}`} className="block text-[11px] font-semibold text-gray-400">
                          Expected Output Raw String *
                        </label>
                        <textarea
                          id={`modal-tc-output-${idx}`}
                          rows={3}
                          value={tc.expectedOutput}
                          aria-invalid={testCaseErrors[idx]?.expectedOutput ? 'true' : 'false'}
                          aria-describedby={testCaseErrors[idx]?.expectedOutput ? `modal-tc-output-error-${idx}` : undefined}
                          onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                          placeholder="Expected stdout output..."
                          className={`w-full bg-neutral-950 font-mono text-neutral-300 text-xs p-2.5 rounded-xl border transition-colors focus:outline-none ${
                            testCaseErrors[idx]?.expectedOutput ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-neutral-600'
                          }`}
                        />
                        <FormFieldError error={testCaseErrors[idx]?.expectedOutput} id={`modal-tc-output-error-${idx}`} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-400">
                        Explanation (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Why this case is expected..."
                        value={tc.explanation || ''}
                        onChange={(e) => handleTestCaseChange(idx, 'explanation', e.target.value)}
                        className="w-full bg-neutral-950 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-xs border border-white/10 focus:outline-none focus:border-neutral-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Action Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-950 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-sm font-semibold transition-all cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || refLoading}
              className="px-5 py-2 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-black font-extrabold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg  disabled:opacity-50 font-sans"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? 'Save Question Changes' : 'Create Problem'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminModal>
  );
};
