import { RequestStatus } from '../../../../shared/components/ui/RequestStatus';
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import { QuestionPayload, QuestionHint, QuestionTestCase } from '../../../../services/questionService';
import { referenceService, ReferenceItem } from '../../../../services/referenceService';
import { adminCompanyService, CompanyItem } from '../../../../services/admin/adminCompanyService';
import { adminQuestionService } from '../../../../services/admin/adminQuestionService';
import { toast } from 'react-hot-toast';
import { adminQuestionSchema, AdminQuestionFormData } from '../../../../core/validation';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { extractTestCasesFromProblem, extractConstraintsFromDescription } from '../../utils/testCaseUtils';
import { Code2, Building2, Plus, Trash2, X } from 'lucide-react';

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

  // Question Hints State
  const [hints, setHints] = useState<QuestionHint[]>([]);

  // Inline Test Cases State
  const [testCases, setTestCases] = useState<QuestionTestCase[]>([
    {
      input: '',
      expectedOutput: '',
      explanation: '',
      isHidden: false,
      displayOrder: 1,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'SAMPLE',
      typeRefName: 'Visible Sample Test Case',
    },
  ]);
  const [testCaseErrors, setTestCaseErrors] = useState<Record<number, { input?: string; expectedOutput?: string }>>({});

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
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

  const [referenceLoading, setReferenceLoading] = useState(true);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [referenceRetry, setReferenceRetry] = useState(0);

  // Fetch Reference Libraries and Companies from REAL backend API
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setReferenceLoading(true);
    setReferenceError(null);
    const loadReferenceData = async () => {
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

        setDifficulties(Array.isArray(diffList) ? diffList : []);
        setTopics(Array.isArray(topicList) ? topicList : []);
        setQpfs(Array.isArray(qpfList) ? qpfList : []);
        setTestCaseTypes(Array.isArray(tcTypeList) ? tcTypeList : []);
        setAllCompanies(Array.isArray(compList) ? compList : []);
      } catch {
        if (isMounted) setReferenceError('Unable to load form options. Retry before saving.');
      } finally {
        if (isMounted) setReferenceLoading(false);
      }
    };

    loadReferenceData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, referenceRetry]);

  const initializedFormIdentity = useRef<string | null>(null);

  // Initialize once per modal session. Reference retries must never reset dirty fields.
  useEffect(() => {
    if (!isOpen) {
      initializedFormIdentity.current = null;
      return;
    }
    const formIdentity = initialData?.id == null ? 'create' : `edit:${initialData.id}`;
    if (initializedFormIdentity.current === formIdentity) return;
    initializedFormIdentity.current = formIdentity;

    if (initialData) {
      const diffName = (
        initialData.difficultyRefName ||
        (initialData as any).difficultyName ||
        (initialData as any).difficulty ||
        ''
      ).toLowerCase();
      const matchedDiff = difficulties.find(
        (d) =>
          (initialData.difficultyRefCode && d.refCode === initialData.difficultyRefCode) ||
          (initialData as any).difficultyId === d.id ||
          (diffName && d.refName.toLowerCase() === diffName) ||
          (diffName && d.refCode.toLowerCase() === diffName)
      );

      const topicName = (
        initialData.topicRefName ||
        (initialData as any).topicName ||
        (initialData as any).category ||
        (initialData as any).topic ||
        ''
      ).toLowerCase();
      const matchedTopic = topics.find(
        (t) =>
          (initialData.topicRefCode && t.refCode === initialData.topicRefCode) ||
          (initialData as any).topicId === t.id ||
          (topicName && t.refName.toLowerCase() === topicName) ||
          (topicName && t.refCode.toLowerCase() === topicName)
      );

      const qpfName = (
        initialData.qpfRefName ||
        (initialData as any).questionPlatform ||
        (initialData as any).platformName ||
        (initialData as any).platform ||
        ''
      ).toLowerCase().trim();
      const matchedQpf = qpfs.find(
        (q) =>
          (initialData.qpfRefCode && q.refCode.toUpperCase() === initialData.qpfRefCode.toUpperCase()) ||
          (qpfName && q.refName.toLowerCase() === qpfName) ||
          (qpfName && q.refCode.toLowerCase() === qpfName) ||
          (qpfName && (qpfName.includes(q.refName.toLowerCase()) || q.refName.toLowerCase().includes(qpfName)))
      );

      reset({
        id: initialData.id,
        title: initialData.title || '',
        description: initialData.description || '',
        constraints: initialData.constraints || extractConstraintsFromDescription(initialData.description),
        difficultyRefGroupCode: matchedDiff?.refGroupCode || initialData.difficultyRefGroupCode || 'DIFF',
        difficultyRefCode: matchedDiff?.refCode || initialData.difficultyRefCode || '',
        difficultyRefName: matchedDiff?.refName || initialData.difficultyRefName || '',
        topicRefGroupCode: matchedTopic?.refGroupCode || initialData.topicRefGroupCode || 'TOPIC',
        topicRefCode: matchedTopic?.refCode || initialData.topicRefCode || '',
        topicRefName: matchedTopic?.refName || initialData.topicRefName || '',
        qpfRefGroupCode: matchedQpf?.refGroupCode || initialData.qpfRefGroupCode || 'QPF',
        qpfRefCode: matchedQpf?.refCode || initialData.qpfRefCode || '',
        qpfRefName: matchedQpf?.refName || initialData.qpfRefName || (initialData as any).questionPlatform || '',
        leetCodeUrl: initialData.leetCodeUrl || '',
        gfgUrl: initialData.gfgUrl || '',
        hackerRankUrl: initialData.hackerRankUrl || '',
        isOwnProblem: initialData.isOwnProblem ?? true,
        isActive: initialData.isActive ?? true,
        askedDate: initialData.askedDate ? initialData.askedDate.split('T')[0] : '',
      });

      setHints(
        Array.isArray(initialData.questionHints) && initialData.questionHints.length > 0
          ? initialData.questionHints.map((h: any) => ({
              id: h.id ?? null,
              hintText: h.hintText || h.hint || '',
            }))
          : []
      );

      if (Array.isArray(initialData.companies)) {
        const mapped = initialData.companies
          .map((c: any) => {
            const cName = typeof c === 'object' && c !== null ? c.name || c.companyName || '' : String(c).trim();
            if (!cName) return null;
            const found = allCompanies.find((ac) => ac.name.toLowerCase() === cName.toLowerCase());
            return (
              found || {
                id: typeof c === 'object' && c?.id ? c.id : null,
                name: cName,
              }
            );
          })
          .filter((c): c is { id?: any; name: string } => c !== null);
        setSelectedCompanies(mapped);
      } else {
        setSelectedCompanies([]);
      }

      const resolvedTestCases = extractTestCasesFromProblem(initialData);
      if (resolvedTestCases.length > 0) {
        setTestCases(resolvedTestCases);
      } else if (initialData.id) {
        adminQuestionService
          .getTestCases(initialData.id)
          .then((cases) => {
            if (cases && cases.length > 0) {
              setTestCases(cases);
            }
          })
          .catch(() => {});
      }
    } else {
      const defaultDiff = difficulties[0];
      const defaultTopic = topics[0];
      const defaultQpf = qpfs[0];

      reset({
        id: null,
        title: '',
        description: '',
        constraints: '',
        difficultyRefGroupCode: defaultDiff?.refGroupCode || 'DIFF',
        difficultyRefCode: defaultDiff?.refCode || '',
        difficultyRefName: defaultDiff?.refName || '',
        topicRefGroupCode: defaultTopic?.refGroupCode || 'TOPIC',
        topicRefCode: defaultTopic?.refCode || '',
        topicRefName: defaultTopic?.refName || '',
        qpfRefGroupCode: defaultQpf?.refGroupCode || 'QPF',
        qpfRefCode: defaultQpf?.refCode || '',
        qpfRefName: defaultQpf?.refName || '',
        leetCodeUrl: '',
        gfgUrl: '',
        hackerRankUrl: '',
        isOwnProblem: true,
        isActive: true,
        askedDate: '',
      });
      setHints([]);
      setSelectedCompanies([]);
      const defaultCreateType =
        testCaseTypes.find((t) => t.refCode === 'SAMPLE')?.refCode || testCaseTypes[0]?.refCode || 'SAMPLE';
      const defaultCreateTypeName =
        testCaseTypes.find((t) => t.refCode === defaultCreateType)?.refName || 'Visible Sample Test Case';
      setTestCases([
        {
          input: '',
          expectedOutput: '',
          explanation: '',
          isHidden: false,
          displayOrder: 1,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: defaultCreateType,
          typeRefName: defaultCreateTypeName,
        },
      ]);
    }
    setActiveTab('METADATA');
  }, [isOpen, initialData, difficulties, topics, qpfs, allCompanies, testCaseTypes, reset]);

  // Fill unresolved reference fields after options arrive without touching user-entered content.
  useEffect(() => {
    if (!isOpen) return;

    const resolveReference = (
      options: ReferenceItem[],
      codeField: 'difficultyRefCode' | 'topicRefCode' | 'qpfRefCode',
      groupField: 'difficultyRefGroupCode' | 'topicRefGroupCode' | 'qpfRefGroupCode',
      nameField: 'difficultyRefName' | 'topicRefName' | 'qpfRefName',
      fallbackName: string,
      defaultGroup: string
    ) => {
      if (getValues(codeField) || options.length === 0) return;
      const normalized = fallbackName.toLowerCase().trim();
      const match = options.find((item) =>
        normalized && (item.refName.toLowerCase() === normalized || item.refCode.toLowerCase() === normalized)
      ) || (!initialData ? options[0] : undefined);
      if (!match) return;
      setValue(groupField, match.refGroupCode || defaultGroup, { shouldDirty: false });
      setValue(codeField, match.refCode, { shouldDirty: false });
      setValue(nameField, match.refName, { shouldDirty: false });
    };

    resolveReference(
      difficulties,
      'difficultyRefCode',
      'difficultyRefGroupCode',
      'difficultyRefName',
      initialData?.difficultyRefName || (initialData as any)?.difficultyName || (initialData as any)?.difficulty || '',
      'DIFF'
    );
    resolveReference(
      topics,
      'topicRefCode',
      'topicRefGroupCode',
      'topicRefName',
      initialData?.topicRefName || (initialData as any)?.topicName || (initialData as any)?.topic || '',
      'TOPIC'
    );
    resolveReference(
      qpfs,
      'qpfRefCode',
      'qpfRefGroupCode',
      'qpfRefName',
      initialData?.qpfRefName || (initialData as any)?.questionPlatform || (initialData as any)?.platformName || '',
      'QPF'
    );

    if (allCompanies.length > 0) {
      setSelectedCompanies((current) => current.map((selected) =>
        allCompanies.find((company) => company.name.toLowerCase() === selected.name.toLowerCase()) || selected
      ));
    }
    if (testCaseTypes.length > 0) {
      setTestCases((current) =>
        current.map((testCase) => {
          if (testCase.typeRefCode) {
            const matched = testCaseTypes.find((t) => t.refCode === testCase.typeRefCode);
            if (matched && !testCase.typeRefName) {
              return { ...testCase, typeRefName: matched.refName };
            }
            return testCase;
          }
          const matched = testCase.isHidden
            ? testCaseTypes.find((t) => t.refCode === 'NECESSARY') || testCaseTypes[0]
            : testCaseTypes.find((t) => t.refCode === 'SAMPLE') || testCaseTypes[0];
          return {
            ...testCase,
            typeRefCode: matched.refCode,
            typeRefName: matched.refName,
          };
        })
      );
    }
  }, [isOpen, initialData, difficulties, topics, qpfs, allCompanies, testCaseTypes, getValues, setValue]);

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

  const handleSelectCompanyFromDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const match = allCompanies.find((c) => String(c.id) === val || c.name.toLowerCase() === val.toLowerCase());
    if (match && !selectedCompanies.some((c) => (c.id && c.id === match.id) || c.name.toLowerCase() === match.name.toLowerCase())) {
      setSelectedCompanies((prev) => [...prev, match]);
    }
    e.target.value = '';
  };

  const handleRemoveCompany = (companyName: string) => {
    setSelectedCompanies(selectedCompanies.filter((c) => c.name.toLowerCase() !== companyName.toLowerCase()));
  };

  const handleAddTestCase = () => {
    const defaultType =
      testCaseTypes.find((t) => t.refCode === 'SAMPLE')?.refCode || testCaseTypes[0]?.refCode || 'SAMPLE';
    const defaultTypeName =
      testCaseTypes.find((t) => t.refCode === defaultType)?.refName || 'Visible Sample Test Case';
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
        typeRefName: defaultTypeName,
      },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length === 1) {
      toast.error('At least one testcase is required.');
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
        target.typeRefCode = value;
        target.typeRefGroupCode = 'TESTCASETYPE';
        target.typeRefName =
          matched?.refName || (value === 'NECESSARY' ? 'Mandatory Test Case' : 'Visible Sample Test Case');
        if (value === 'SAMPLE') {
          target.isHidden = false;
        } else if (value === 'NECESSARY') {
          target.isHidden = true;
        }
      }
      if (field === 'isHidden') {
        target.isHidden = Boolean(value);
        if (value === true && target.typeRefCode === 'SAMPLE') {
          target.typeRefCode = 'NECESSARY';
          target.typeRefName =
            testCaseTypes.find((t) => t.refCode === 'NECESSARY')?.refName || 'Mandatory Test Case';
        } else if (value === false && target.typeRefCode === 'NECESSARY') {
          target.typeRefCode = 'SAMPLE';
          target.typeRefName =
            testCaseTypes.find((t) => t.refCode === 'SAMPLE')?.refName || 'Visible Sample Test Case';
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

    // Validate any test cases that have partial input/output
    const newErrors: Record<number, { input?: string; expectedOutput?: string }> = {};
    let hasError = false;
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const hasInput = Boolean(tc.input?.trim());
      const hasOutput = Boolean(tc.expectedOutput?.trim());

      // If either input or output is provided, or if isOwn is true, require both
      if (hasInput || hasOutput || isOwn) {
        const tcErrors: { input?: string; expectedOutput?: string } = {};
        if (!hasInput) {
          tcErrors.input = 'Input raw string is required.';
          hasError = true;
        }
        if (!hasOutput) {
          tcErrors.expectedOutput = 'Expected output raw string is required.';
          hasError = true;
        }
        if (tcErrors.input || tcErrors.expectedOutput) {
          newErrors[i] = tcErrors;
        }
      }
    }

    if (hasError) {
      setTestCaseErrors(newErrors);
      setActiveTab('TESTCASES');
      toast.error('Please enter required inputs and outputs for all test cases.');
      return;
    }

    const sanitizedTestCases: QuestionTestCase[] = testCases
      .filter((tc) => tc.input?.trim() && tc.expectedOutput?.trim())
      .map((tc, idx) => {
        const typeCode = tc.typeRefCode || (tc.isHidden ? 'NECESSARY' : 'SAMPLE');
        const matched = testCaseTypes.find((t) => t.refCode === typeCode);
        return {
          ...tc,
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          explanation: tc.explanation ? tc.explanation.trim() : '',
          displayOrder: idx + 1,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: typeCode,
          typeRefName:
            matched?.refName || tc.typeRefName || (tc.isHidden ? 'Mandatory Test Case' : 'Visible Sample Test Case'),
        };
      });

    const resolvedCompanies = selectedCompanies.map((c) => {
      const match = allCompanies.find((ac) => ac.name.toLowerCase() === c.name.toLowerCase());
      return {
        id: c.id || match?.id || null,
        name: c.name,
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
      testCases: sanitizedTestCases,
      companies: resolvedCompanies,
    });
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Problem #${initialData?.id}` : 'Create New Problem'}
      subtitle="Configure problem statement, metadata, constraints, hints, and testcase assertions"
      icon={<Code2 className="w-5 h-5" />}
      maxWidth="4xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('METADATA')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                activeTab === 'METADATA'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1. Metadata &amp; Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TESTCASES')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                activeTab === 'TESTCASES'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2. Test Cases ({testCases.length})
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || referenceLoading || Boolean(referenceError)}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={submitting}
              className="flex-1 sm:flex-initial px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-center"
            >
              {submitting ? 'Saving Problem...' : isEditing ? 'Update Problem' : 'Create Problem'}
            </button>
          </div>
        </div>
      }
    >
      <form aria-busy={referenceLoading || submitting} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 font-sans text-left">
        <RequestStatus pending={referenceLoading} error={referenceError} onRetry={() => setReferenceRetry((value) => value + 1)} label="Loading form options…" />
        {activeTab === 'METADATA' && (
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Problem Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Two Sum, Reverse Linked List"
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border ${
                  errors.title
                    ? 'border-rose-500 bg-rose-50/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all`}
              />
              <FormFieldError error={errors.title?.message} />
            </div>

            {/* Classification: Difficulty, Topic, Platform */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Difficulty <span className="text-rose-500">*</span>
                </label>
                <select
                  value={watch('difficultyRefCode') || ''}
                  onChange={handleDifficultySelect}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Difficulty</option>
                  {difficulties.map((d) => (
                    <option key={d.id} value={d.refCode}>
                      {d.refName}
                    </option>
                  ))}
                </select>
                <FormFieldError error={errors.difficultyRefCode?.message} />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Category / Topic <span className="text-rose-500">*</span>
                </label>
                <select
                  value={watch('topicRefCode') || ''}
                  onChange={handleTopicSelect}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.refCode}>
                      {t.refName}
                    </option>
                  ))}
                </select>
                <FormFieldError error={errors.topicRefCode?.message} />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Platform Origin <span className="text-rose-500">*</span>
                </label>
                <select
                  value={watch('qpfRefCode') || ''}
                  onChange={handleQpfSelect}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Platform</option>
                  {qpfs.map((q) => (
                    <option key={q.id} value={q.refCode}>
                      {q.refName}
                    </option>
                  ))}
                </select>
                <FormFieldError error={errors.qpfRefCode?.message} />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Problem Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                {...register('description')}
                placeholder="Full problem statement with input/output format, examples..."
                className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                  errors.description
                    ? 'border-rose-500 bg-rose-50/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all`}
              />
              <FormFieldError error={errors.description?.message} />
            </div>

            {/* Constraints */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Constraints (e.g. 1 &lt;= N &lt;= 10^5)
              </label>
              <textarea
                rows={2}
                {...register('constraints')}
                placeholder="1 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9"
                className="w-full px-3.5 py-2.5 text-xs font-mono font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Company Tagging */}
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Hiring Companies
                </label>
                <select
                  onChange={handleSelectCompanyFromDropdown}
                  defaultValue=""
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">+ Associate Company</option>
                  {allCompanies.map((c) => (
                    <option key={c.id ?? c.name} value={c.id ?? ''}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCompanies.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">
                  No company tags added. Use the dropdown above to associate hiring partners.
                </p>
              ) : (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {selectedCompanies.map((c) => (
                    <span
                      key={c.id || c.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold"
                    >
                      <Building2 className="w-3 h-3" />
                      <span>{c.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompany(c.name)}
                        className="text-purple-400 hover:text-purple-700 dark:hover:text-purple-100 ml-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Hints Section */}
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Problem Hints ({hints.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddHint}
                  className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Hint</span>
                </button>
              </div>

              {hints.map((hint, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400 w-12 shrink-0">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={hint.hintText}
                    onChange={(e) => handleHintChange(idx, e.target.value)}
                    placeholder="Enter progressive hint guidance..."
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHint(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Configuration Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  {...register('isOwnProblem')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Internal Native Problem</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Active &amp; Published</span>
              </label>

              <div>
                <input
                  type="date"
                  {...register('askedDate')}
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'TESTCASES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Test Case Assertions
                </h4>
                <p className="text-[11px] text-slate-500">
                  Provide at least one test case. Visible sample cases help user sandbox verification; hidden cases evaluate correctness on submission.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTestCase}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test Case</span>
              </button>
            </div>

            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
              {testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        Assertion #{idx + 1}
                      </span>
                      <AdminBadge variant={tc.isHidden ? 'neutral' : 'success'} size="sm">
                        {tc.isHidden ? 'Hidden Evaluation' : 'Visible Sample'}
                      </AdminBadge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Test Case Type Selection Option */}
                      <div className="flex items-center gap-1.5">
                        <label
                          htmlFor={`tc-type-${idx}`}
                          className="text-[11px] font-bold text-slate-500 dark:text-slate-400"
                        >
                          Type:
                        </label>
                        <select
                          id={`tc-type-${idx}`}
                          aria-label={`Test Case #${idx + 1} Type`}
                          value={tc.typeRefCode || (tc.isHidden ? 'NECESSARY' : 'SAMPLE')}
                          onChange={(e) => handleTestCaseChange(idx, 'typeRefCode', e.target.value)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {testCaseTypes.map((t) => (
                            <option key={t.id || t.refCode} value={t.refCode}>
                              {t.refName || t.refCode}
                            </option>
                          ))}
                          {testCaseTypes.length === 0 && (
                            <>
                              <option value="SAMPLE">Sample Test Case</option>
                              <option value="NECESSARY">Mandatory Test Case</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Hidden Case Toggle */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={(e) => handleTestCaseChange(idx, 'isHidden', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Hidden Test Case</span>
                      </label>

                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove Test Case"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Input Raw String <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={tc.input}
                        onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                        placeholder="e.g. 5&#10;1 2 3 4 5"
                        className={`w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border ${
                          testCaseErrors[idx]?.input
                            ? 'border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                      />
                      <FormFieldError error={testCaseErrors[idx]?.input} />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Expected Output <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={tc.expectedOutput}
                        onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                        placeholder="e.g. 5"
                        className={`w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border ${
                          testCaseErrors[idx]?.expectedOutput
                            ? 'border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                      />
                      <FormFieldError error={testCaseErrors[idx]?.expectedOutput} />
                    </div>
                  </div>

                  {/* Test Case Explanation */}
                  <div className="space-y-1">
                    <label
                      htmlFor={`tc-explanation-${idx}`}
                      className="block text-[11px] font-bold text-slate-600 dark:text-slate-400"
                    >
                      Test Case Explanation (Optional)
                    </label>
                    <input
                      id={`tc-explanation-${idx}`}
                      type="text"
                      value={tc.explanation || ''}
                      onChange={(e) => handleTestCaseChange(idx, 'explanation', e.target.value)}
                      placeholder="e.g. Because nums[0] + nums[1] == 9, we return [0, 1]..."
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </AdminModal>
  );
};
