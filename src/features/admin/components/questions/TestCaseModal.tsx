import { RequestStatus } from '../../../../shared/components/ui/RequestStatus';
import React, { useState, useEffect, useRef } from 'react';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import { C2CSelect } from '../../../../shared/components/ui/C2CSelect';
import { QuestionPayload, QuestionTestCase } from '../../../../services/questionService';
import { adminQuestionService } from '../../../../services/admin/adminQuestionService';
import { toast } from '@/shared/notifications/toast';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { Skeleton } from '../../../../shared/components/ui/Skeleton';
import { getActionableErrorMessage } from '../../../../core/validation';
import {
  extractTestCasesFromProblem,
  resolveTestCaseType,
  reconcileTestCasesWithReferenceTypes,
  validateTestCase,
} from '../../utils/testCaseUtils';
import {
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import { useReferenceGroup } from '../../../references/hooks/useReferenceGroup';

interface TestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: number | string | null;
  questionTitle?: string;
  question?: QuestionPayload | null;
  onSuccess?: () => void;
}

export const TestCaseModal: React.FC<TestCaseModalProps> = ({
  isOpen,
  onClose,
  questionId,
  questionTitle,
  question,
  onSuccess,
}) => {
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

  const [fieldErrors, setFieldErrors] = useState<Record<number, { input?: string; expectedOutput?: string; typeRefCode?: string }>>({});
  const {
    items: testCaseTypes,
    loading: typesLoading,
    error: typesError,
    retry: retryTypes,
  } = useReferenceGroup('TESTCASETYPE', isOpen);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const mutationPendingRef = useRef(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [casesLoading, setCasesLoading] = useState<boolean>(false);
  const testCaseTypesRef = useRef(testCaseTypes);

  useEffect(() => {
    testCaseTypesRef.current = testCaseTypes;
  }, [testCaseTypes]);

  // Fetch existing test cases from backend or problem on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadError(null);

    const initModal = async () => {
      setCasesLoading(true);
      try {
        let existingCases: QuestionTestCase[] = [];

        // 1. Authoritative cases already supplied on the question object (e.g. from handleManageTestCases)
        if (Array.isArray(question?.testCases) && question.testCases.length > 0) {
          existingCases = question.testCases;
        }

        // 2. Only fetch when the caller did not supply an authoritative detail.
        if (!question && questionId) {
          try {
            const fetched = await adminQuestionService.getTestCases(questionId);
            if (fetched && fetched.length > 0) {
              existingCases = fetched;
            }
          } catch {
            if (isMounted) setLoadError('Unable to load existing test cases. Retry before saving.');
          }
        }

        // 3. Fallback: extract visible examples from problem description only when backend returns no records
        if (existingCases.length === 0 && question) {
          existingCases = extractTestCasesFromProblem(question, testCaseTypesRef.current);
        }

        if (isMounted) {
          if (existingCases.length > 0) {
            setTestCases(
              testCaseTypesRef.current.length > 0
                ? reconcileTestCasesWithReferenceTypes(existingCases, testCaseTypesRef.current)
                : existingCases
            );
          } else {
            const defaultType = resolveTestCaseType(testCaseTypesRef.current, false);
            setTestCases([
              {
                input: '',
                expectedOutput: '',
                explanation: '',
                isHidden: false,
                displayOrder: 1,
                typeRefGroupCode: defaultType?.refGroupCode || 'TESTCASETYPE',
                typeRefCode: defaultType?.refCode || '',
                typeRefName: defaultType?.refName || '',
              },
            ]);
          }
        }
      } catch {
      } finally {
        if (isMounted) setCasesLoading(false);
      }
    };

    initModal();
    return () => {
      isMounted = false;
    };
  }, [isOpen, questionId, question, retry]);

  // Reconcile unresolved test-case types when API reference taxonomy options arrive asynchronously
  useEffect(() => {
    if (testCaseTypes.length === 0) return;
    setTestCases((prev) => {
      const hasUnresolved = prev.some((tc) => !tc.typeRefCode || !tc.typeRefCode.trim());
      if (!hasUnresolved) return prev;
      return reconcileTestCasesWithReferenceTypes(prev, testCaseTypes);
    });
  }, [testCaseTypes]);

  const handleAddTestCase = () => {
    const defaultType = resolveTestCaseType(testCaseTypes, false);
    setTestCases((prev) => [
      ...prev,
      {
        input: '',
        expectedOutput: '',
        explanation: '',
        isHidden: false,
        displayOrder: prev.length + 1,
        typeRefGroupCode: defaultType?.refGroupCode || 'TESTCASETYPE',
        typeRefCode: defaultType?.refCode || '',
        typeRefName: defaultType?.refName || '',
      },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length <= 1) {
      toast.error('Question must maintain at least one test case.');
      return;
    }
    setTestCases((prev) => prev.filter((_, i) => i !== index));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleChange = <K extends keyof QuestionTestCase>(index: number, field: K, value: QuestionTestCase[K]) => {
    setTestCases((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };

      if (field === 'typeRefCode') {
        const matched = testCaseTypes.find((t) => t.refCode === value);
        target.typeRefCode = (value as string) || '';
        target.typeRefGroupCode = matched?.refGroupCode || 'TESTCASETYPE';
        target.typeRefName = matched?.refName || '';
        if (matched?.refCode === 'SAMPLE' || matched?.refCode.toLowerCase().includes('sample')) {
          target.isHidden = false;
        } else if (
          matched?.refCode === 'NECESSARY' ||
          matched?.refCode.toLowerCase().includes('necessary') ||
          matched?.refCode.toLowerCase().includes('hidden')
        ) {
          target.isHidden = true;
        }
      }

      if (field === 'isHidden') {
        const isHidden = Boolean(value);
        target.isHidden = isHidden;
        const currentCode = target.typeRefCode?.toUpperCase();
        const isCurrentlySample = currentCode === 'SAMPLE';
        const isCurrentlyHidden = currentCode === 'NECESSARY' || currentCode === 'HIDDEN';
        if (isHidden && isCurrentlySample) {
          const hiddenOption = resolveTestCaseType(testCaseTypes, true);
          if (hiddenOption) {
            target.typeRefCode = hiddenOption.refCode;
            target.typeRefGroupCode = hiddenOption.refGroupCode || 'TESTCASETYPE';
            target.typeRefName = hiddenOption.refName;
          }
        } else if (!isHidden && isCurrentlyHidden) {
          const sampleOption = resolveTestCaseType(testCaseTypes, false);
          if (sampleOption) {
            target.typeRefCode = sampleOption.refCode;
            target.typeRefGroupCode = sampleOption.refGroupCode || 'TESTCASETYPE';
            target.typeRefName = sampleOption.refName;
          }
        }
      }

      next[index] = target;
      return next;
    });

    if (field === 'input' || field === 'expectedOutput' || field === 'typeRefCode') {
      setFieldErrors((prev) => {
        if (!prev[index]) return prev;
        const current = { ...prev[index] };
        if (field === 'input' && typeof value === 'string' && value.trim()) delete current.input;
        if (field === 'expectedOutput' && typeof value === 'string' && value.trim()) delete current.expectedOutput;
        if (field === 'typeRefCode' && typeof value === 'string' && value.trim()) delete current.typeRefCode;
        return { ...prev, [index]: current };
      });
    }
  };

  const handleSubmit = async () => {
    if (!questionId) {
      toast.error('No question targeted for test cases attachment.');
      return;
    }
    if (typesError || testCaseTypes.length === 0) {
      toast.error('Test case taxonomy options are loading or unavailable. Please retry.');
      return;
    }

    const errors: Record<number, { input?: string; expectedOutput?: string; typeRefCode?: string }> = {};
    let hasError = false;

    testCases.forEach((tc, idx) => {
      const tcErr = validateTestCase(tc, testCaseTypes);
      if (tcErr) {
        errors[idx] = tcErr;
        hasError = true;
      }
    });

    if (hasError) {
      setFieldErrors(errors);
      toast.error('Please resolve missing or invalid test case fields before saving.');
      return;
    }

    if (mutationPendingRef.current) return;
    mutationPendingRef.current = true;
    setSubmitting(true);
    const payload: QuestionTestCase[] = testCases.map((tc, idx) => {
      const matched = testCaseTypes.find((t) => t.refCode === tc.typeRefCode);
      return {
        id: tc.id,
        questionId: Number(questionId),
        input: tc.input.trim(),
        expectedOutput: tc.expectedOutput.trim(),
        explanation: tc.explanation ? tc.explanation.trim() : '',
        isHidden: tc.isHidden === true,
        displayOrder: idx + 1,
        typeRefGroupCode: matched?.refGroupCode || tc.typeRefGroupCode || 'TESTCASETYPE',
        typeRefCode: tc.typeRefCode.trim(),
        typeRefName: matched?.refName || tc.typeRefName || '',
      };
    });

    try {
      await adminQuestionService.addTestCases(questionId, payload);
      toast.success(`Successfully saved ${payload.length} test cases for Question #${questionId}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(getActionableErrorMessage(err, 'Failed to save test cases.'));
    } finally {
      mutationPendingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={questionTitle ? `Manage Test Cases — ${questionTitle}` : 'Attach Question Test Cases'}
      subtitle={`Question ID #${questionId || 'N/A'} • Add visible sample cases and hidden verification test cases`}
      icon={<Layers className="w-5 h-5" />}
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleAddTestCase}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Case</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || typesLoading || casesLoading || Boolean(typesError) || Boolean(loadError) || testCaseTypes.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Saving Test Cases...' : `Save ${testCases.length} Test Cases`}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 font-sans text-left">
        <RequestStatus
          pending={typesLoading || casesLoading}
          error={typesError || loadError}
          onRetry={() => {
            void retryTypes();
            setRetry((value) => value + 1);
          }}
          label="Loading test cases…"
        />
        {typesLoading || casesLoading ? (
          <div role="status" aria-label="Loading test cases" className="space-y-4">
            {[0, 1].map((item) => <div key={item} className="space-y-3 rounded-2xl border border-slate-200/80 p-5 dark:border-slate-800/80"><Skeleton className="h-7 w-32" /><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div></div>)}
          </div>
        ) : (
          <div className="space-y-4">
            {testCases.map((tc, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-xs"
              >
                {/* Header row: Index, Hidden toggle, Type selector, Delete */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Test Case #{idx + 1}
                    </span>
                    <AdminBadge variant={tc.isHidden ? 'neutral' : 'success'} size="sm">
                      {tc.isHidden ? 'Hidden Evaluation' : 'Visible Sample'}
                    </AdminBadge>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Hidden Toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) => handleChange(idx, 'isHidden', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Hidden Case</span>
                    </label>

                    {/* Test Case Type */}
                    <div className="flex flex-col">
                      <C2CSelect
                        id={`test-case-type-${idx}`}
                        value={tc.typeRefCode || ''}
                        onChange={(val) => handleChange(idx, 'typeRefCode', val)}
                        disabled={testCaseTypes.length === 0}
                        options={testCaseTypes.map((t) => ({ value: t.refCode, label: t.refName || t.refCode }))}
                        placeholder={testCaseTypes.length === 0 ? 'No API types available' : 'Select Type'}
                        ariaLabel={`Test case ${idx + 1} type`}
                        className="w-36"
                        buttonClassName={`rounded-xl px-2.5 py-1.5 text-xs font-semibold border ${
                          fieldErrors[idx]?.typeRefCode
                            ? 'border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        } text-slate-900 dark:text-white`}
                      />
                      {fieldErrors[idx]?.typeRefCode && (
                        <span className="text-[11px] text-rose-500 font-medium mt-0.5">
                          {fieldErrors[idx]?.typeRefCode}
                        </span>
                      )}
                    </div>

                    {/* Remove button */}
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(idx)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
                        title="Remove Test Case"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Raw Input and Expected Output Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor={`test-case-input-${idx}`} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Raw Input String <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id={`test-case-input-${idx}`}
                      rows={3}
                      value={tc.input}
                      onChange={(e) => handleChange(idx, 'input', e.target.value)}
                      placeholder="e.g. 5\n1 2 3 4 5"
                      className={`w-full px-3.5 py-2.5 text-xs font-mono font-medium rounded-xl border ${
                        fieldErrors[idx]?.input
                          ? 'border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                    />
                    <FormFieldError error={fieldErrors[idx]?.input} />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor={`test-case-output-${idx}`} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Expected Output String <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id={`test-case-output-${idx}`}
                      rows={3}
                      value={tc.expectedOutput}
                      onChange={(e) => handleChange(idx, 'expectedOutput', e.target.value)}
                      placeholder="e.g. 5"
                      className={`w-full px-3.5 py-2.5 text-xs font-mono font-medium rounded-xl border ${
                        fieldErrors[idx]?.expectedOutput
                          ? 'border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                    />
                    <FormFieldError error={fieldErrors[idx]?.expectedOutput} />
                  </div>
                </div>

                {/* Explanation */}
                <div className="space-y-1.5">
                  <label htmlFor={`test-case-explanation-${idx}`} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Test Case Explanation (Optional)
                  </label>
                  <input
                    id={`test-case-explanation-${idx}`}
                    type="text"
                    value={tc.explanation || ''}
                    onChange={(e) => handleChange(idx, 'explanation', e.target.value)}
                    placeholder="Explanation for user solution walkthrough..."
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminModal>
  );
};
