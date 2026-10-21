import { RequestStatus } from '../../../../shared/components/ui/RequestStatus';
import React, { useState, useEffect } from 'react';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import { QuestionPayload, QuestionTestCase } from '../../../../services/questionService';
import { referenceService, ReferenceItem } from '../../../../services/referenceService';
import { adminQuestionService } from '../../../../services/admin/adminQuestionService';
import { toast } from 'react-hot-toast';
import { FormFieldError } from '../../../../shared/components/ui/FormFieldError';
import { getActionableErrorMessage } from '../../../../core/validation';
import { extractTestCasesFromProblem } from '../../utils/testCaseUtils';
import { userScopedStorage } from '../../../../core/storage/userScopedStorage';
import {
  Layers,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

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
      typeRefCode: 'SAMPLE',
    },
  ]);

  const [fieldErrors, setFieldErrors] = useState<Record<number, { input?: string; expectedOutput?: string }>>({});
  const [testCaseTypes, setTestCaseTypes] = useState<ReferenceItem[]>([]);
  const [typesLoading, setTypesLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  // Fetch existing test cases & TESTCASETYPE Reference Library from backend on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setTypesLoading(true);
    setLoadError(null);

    const initModal = async () => {
      try {
        // 1. Fetch Reference Library TESTCASETYPE items dynamically from API
        let validTypes: ReferenceItem[] = [];
        try {
          const refRes = await referenceService.getByGroupCode('TESTCASETYPE');
          const refList = (refRes as any)?.data || (Array.isArray(refRes) ? refRes : []);
          if (Array.isArray(refList) && refList.length > 0) {
            validTypes = refList;
          }
        } catch {
          if (isMounted) setLoadError('Unable to load test case types. Retry before saving.');
        }

        if (isMounted) {
          setTestCaseTypes(validTypes);
        }

        // 2. Fetch existing test cases for the question
        let existingCases: QuestionTestCase[] = [];

        // Check question object first (e.g. from table or parsed from description)
        if (question) {
          existingCases = extractTestCasesFromProblem(question);
        }

        // Fallback to backend or local cache if questionId exists and existingCases is empty
        if (existingCases.length === 0 && questionId) {
          try {
            const fetched = await adminQuestionService.getTestCases(questionId);
            if (fetched && fetched.length > 0) {
              existingCases = fetched;
            }
          } catch {
            if (isMounted) setLoadError('Unable to load existing test cases. Retry before saving.');
          }
        }

        if (isMounted) {
          if (existingCases.length > 0) {
            setTestCases(existingCases);
          } else {
            const defaultType = validTypes.length > 0 ? validTypes[0].refCode : 'SAMPLE';
            setTestCases([
              {
                input: '',
                expectedOutput: '',
                explanation: '',
                isHidden: false,
                displayOrder: 1,
                typeRefGroupCode: 'TESTCASETYPE',
                typeRefCode: defaultType,
              },
            ]);
          }
        }
      } catch (err) {
        console.warn('Failed to load test case reference types:', err);
      } finally {
        if (isMounted) setTypesLoading(false);
      }
    };

    initModal();
    return () => {
      isMounted = false;
    };
  }, [isOpen, questionId, question, retry]);

  const handleAddTestCase = () => {
    const defaultType = testCaseTypes.length > 0 ? testCaseTypes[0].refCode : 'SAMPLE';
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

  const handleChange = (index: number, field: keyof QuestionTestCase, value: any) => {
    setTestCases((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

    if (field === 'input' || field === 'expectedOutput') {
      setFieldErrors((prev) => {
        if (!prev[index]) return prev;
        const current = { ...prev[index] };
        if (field === 'input' && value.trim()) delete current.input;
        if (field === 'expectedOutput' && value.trim()) delete current.expectedOutput;
        return { ...prev, [index]: current };
      });
    }
  };

  const handleSubmit = async () => {
    if (!questionId) {
      toast.error('No question targeted for test cases attachment.');
      return;
    }

    const errors: Record<number, { input?: string; expectedOutput?: string }> = {};
    let hasError = false;

    testCases.forEach((tc, idx) => {
      const err: { input?: string; expectedOutput?: string } = {};
      if (!tc.input?.trim()) {
        err.input = 'Input raw string is required';
        hasError = true;
      }
      if (!tc.expectedOutput?.trim()) {
        err.expectedOutput = 'Expected output raw string is required';
        hasError = true;
      }
      if (err.input || err.expectedOutput) {
        errors[idx] = err;
      }
    });

    if (hasError) {
      setFieldErrors(errors);
      toast.error('Please resolve missing required inputs/expected outputs.');
      return;
    }

    setSubmitting(true);
    const payload: QuestionTestCase[] = testCases.map((tc, idx) => ({
      id: tc.id,
      questionId: Number(questionId),
      input: tc.input.trim(),
      expectedOutput: tc.expectedOutput.trim(),
      explanation: tc.explanation ? tc.explanation.trim() : '',
      isHidden: tc.isHidden === true,
      displayOrder: idx + 1,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: tc.typeRefCode || (tc.isHidden ? 'NECESSARY' : 'SAMPLE'),
    }));

    try {
      await adminQuestionService.addTestCases(questionId, payload);
      try {
        userScopedStorage.setItem(`admin_test_cases_${questionId}`, JSON.stringify(payload));
      } catch {}

      toast.success(`Successfully saved ${payload.length} test cases for Question #${questionId}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      // If network fails, also cache locally so admin work is not lost
      try {
        userScopedStorage.setItem(`admin_test_cases_${questionId}`, JSON.stringify(payload));
        toast.success(`Saved ${payload.length} test cases locally for Question #${questionId}`);
        if (onSuccess) onSuccess();
        onClose();
        return;
      } catch {}
      toast.error(getActionableErrorMessage(err, 'Failed to save test cases.'));
    } finally {
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
              disabled={submitting || typesLoading || Boolean(loadError)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Saving Test Cases...' : `Save ${testCases.length} Test Cases`}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 font-sans text-left">
        <RequestStatus pending={typesLoading} error={loadError} onRetry={() => setRetry((value) => value + 1)} label="Loading test cases…" />
        {typesLoading ? (
          <div className="flex items-center justify-center p-8 text-slate-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading Test Case Types &amp; Existing Records...</span>
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
                    <select
                      value={tc.typeRefCode || ''}
                      onChange={(e) => handleChange(idx, 'typeRefCode', e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      {testCaseTypes.map((t) => (
                        <option key={t.id} value={t.refCode}>
                          {t.refName}
                        </option>
                      ))}
                      {testCaseTypes.length === 0 && (
                        <>
                          <option value="SAMPLE">Sample Test Case</option>
                          <option value="NECESSARY">Mandatory Test Case</option>
                        </>
                      )}
                    </select>

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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Raw Input String <span className="text-rose-500">*</span>
                    </label>
                    <textarea
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Expected Output String <span className="text-rose-500">*</span>
                    </label>
                    <textarea
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Test Case Explanation (Optional)
                  </label>
                  <input
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
