import { useExecutionRequest } from '../../../problems/hooks/useExecutionRequest';
import { RequestStatus } from '../../../../shared/components/ui/RequestStatus';
import { Skeleton } from '../../../../shared/components/ui/Skeleton';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { AdminCard } from '../AdminCard';
import { AdminBadge } from '../AdminBadge';
import { adminQuestionService } from '../../../../services/admin/adminQuestionService';
import { ExecutionResultData } from '../../../../services/executionService';
import { useTheme } from '../../../../shared/context/ThemeContext';
import { toast } from 'react-hot-toast';
import {
  Play,
  Send,
  Terminal,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import { fetchLanguages } from '../../../languages/redux/languageSlice';

const DEFAULT_STARTER_CODES: Record<string, string> = {
  Java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            int max = Integer.MIN_VALUE;
            for (int i = 0; i < n; i++) {
                if (sc.hasNextInt()) {
                    max = Math.max(max, sc.nextInt());
                }
            }
            System.out.println(max);
        }
    }
}`,
  Python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    nums = [int(x) for x in lines[1:n+1]]
    if nums:
        print(max(nums))

if __name__ == '__main__':
    main()
`,
  'C++': `#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        int maxVal = INT_MIN;
        for (int i = 0; i < n; i++) {
            int val;
            cin >> val;
            maxVal = max(maxVal, val);
        }
        cout << maxVal << endl;
    }
    return 0;
}
`,
  JavaScript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, n + 1).map(Number);
    if (nums.length > 0) {
        console.log(Math.max(...nums));
    }
}

solve();
`,
};
export const DashboardCodeRunner: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();

  // Question options & selection
  const [questions, setQuestions] = useState<Array<{ id: number; title: string; difficulty?: string }>>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [manualQuestionId, setManualQuestionId] = useState<string>('');

  // Languages from GET /api/v1/language/dropdown
  const { languages: languageRegistry, loading: languagesLoading, error: languagesError } =
    useAppSelector((state) => state.languages);
  const languages = useMemo(
    () => languageRegistry.filter((language) => language.isActive !== false),
    [languageRegistry]
  );
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);

  // Editor code
  const [sourceCode, setSourceCode] = useState<string>('');

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [executionMode, setExecutionMode] = useState<'run' | 'submit' | null>(null);
  const [result, setResult] = useState<ExecutionResultData | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string>('');
  const resultsRef = useRef<HTMLDivElement>(null);

  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [resourcesRetry, setResourcesRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setResourcesLoading(true);
    setResourcesError(null);
    void dispatch(fetchLanguages(resourcesRetry > 0 ? { force: true } : undefined));
    Promise.allSettled([
      adminQuestionService.getQuestions({ level: null, companies: null, topic: null, searchText: null, pageRequest: { pageNumber: 0, pageSize: 50, sortBy: 'id', sortDirection: 'ASC' } }),
    ]).then(([questionResult]) => {
      if (!active) return;
      const failures: string[] = [];
      if (questionResult.status === 'fulfilled') {
        const raw: any = questionResult.value?.data || questionResult.value;
        const list = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
        setQuestions(list);
        if (list[0]) { setSelectedQuestionId(list[0].id); setManualQuestionId(String(list[0].id)); }
      } else failures.push('Unable to load question options.');
      setResourcesError(failures.join(' ') || null);
      setResourcesLoading(false);
    });
    return () => { active = false; };
  }, [dispatch, resourcesRetry]);

  useEffect(() => {
    setSelectedLanguageId((previous) =>
      languages.some((language) => language.id === previous)
        ? previous
        : languages[0]?.id ?? null
    );
    setSourceCode((code) => code || DEFAULT_STARTER_CODES[languages[0]?.name] || '');
  }, [languages]);

  const combinedResourcesLoading = resourcesLoading || languagesLoading;
  const combinedResourcesError = resourcesError || languagesError ||
    (!languagesLoading && languages.length === 0 ? 'No execution languages are configured.' : null);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    setSelectedLanguageId(newId);
    const langObj = languages.find((l) => l.id === newId);
    if (langObj && DEFAULT_STARTER_CODES[langObj.name]) {
      setSourceCode(DEFAULT_STARTER_CODES[langObj.name]);
    }
    setResult(null);
  };

  const handleQuestionSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const qId = Number(e.target.value);
    setSelectedQuestionId(qId);
    setManualQuestionId(String(qId));
    setResult(null);
  };

  const handleManualQuestionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualQuestionId(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setSelectedQuestionId(num);
    }
  };

  const selectedLangObj = languages.find((l) => l.id === selectedLanguageId) || languages[0];
  const monacoLang =
    selectedLangObj?.name?.toLowerCase() === 'c++'
      ? 'cpp'
      : selectedLangObj?.name?.toLowerCase() === 'python'
      ? 'python'
      : selectedLangObj?.name?.toLowerCase() === 'javascript'
      ? 'javascript'
      : selectedLangObj?.name?.toLowerCase() === 'java'
      ? 'java'
      : 'plaintext';

  const executionRequest = useExecutionRequest('dashboard');
  useEffect(() => { setIsRunning(false); setIsSubmitting(false); setResult(null); setExecutionMessage(''); }, []);

  // 1. Admin TEST CODE (POST /api/v1/admin/testCode)
  const handleRunSampleCases = async () => {
    if (combinedResourcesLoading || !languages.length || !sourceCode.trim()) return;
    const qId = Number(manualQuestionId || selectedQuestionId);
    if (!qId || isNaN(qId) || selectedLanguageId === null || languages.length === 0) {
      toast.error('Please select or enter a valid Question ID');
      return;
}
    const controller = executionRequest.begin();
    if (!controller) return;
    setIsRunning(true);
    setExecutionMode('run');
    setResult(null);
    setExecutionMessage('');

    try {
      const res = await adminQuestionService.adminTestCode({
        questionId: qId,
        languageId: selectedLangObj?.referenceId ?? selectedLanguageId,
        sourceCode,
      }, controller.signal);
      if (controller.signal.aborted) return;

      const data = (res as any)?.data || res;
      setResult(data);
      setExecutionMessage((res as any)?.message || 'Executed Sample Test Cases Successfully');
      if (data.failedTestCases === 0 && data.passedTestCases > 0) {
        toast.success('All sample test cases passed.');
      } else {
        toast.error(`${data.failedTestCases} sample test case(s) failed.`);
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg = detail && detail !== err?.message ? `${err?.message || 'Admin testCode execution failed'}: ${detail}` : (err?.message || 'Admin testCode execution failed');
      toast.error(msg);
      setExecutionMessage(msg);
      setResult(null);
    } finally {
      if (executionRequest.finish(controller)) setIsRunning(false);
    }
  };

  // 2. Admin SUBMIT CODE (POST /api/v1/admin/submitCode)
  const handleSubmitAllCases = async () => {
    if (combinedResourcesLoading || !languages.length || !sourceCode.trim()) return;
    const qId = Number(manualQuestionId || selectedQuestionId);
    if (!qId || isNaN(qId)) {
      toast.error('Please select or enter a valid Question ID');
      return;
    }

    const controller = executionRequest.begin();
    if (!controller) return;
    setIsSubmitting(true);
    setExecutionMode('submit');
    setResult(null);
    setExecutionMessage('');

    try {
      const res = await adminQuestionService.adminSubmitCode({
        questionId: qId,
        languageId: (selectedLangObj as any)?.referenceId || selectedLanguageId || 0,
        sourceCode,
      }, controller.signal);
      if (controller.signal.aborted) return;

      const data = (res as any)?.data || res;
      setResult(data);
      setExecutionMessage((res as any)?.message || 'Validated against All Test Cases');
      if (data.failedTestCases === 0 && data.passedTestCases > 0) {
        toast.success('All validation test cases passed.');
      } else {
        toast.error(`${data.failedTestCases} validation test case(s) failed.`);
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg = detail && detail !== err?.message ? `${err?.message || 'Admin submitCode execution failed'}: ${detail}` : (err?.message || 'Admin submitCode execution failed');
      toast.error(msg);
      setExecutionMessage(msg);
      setResult(null);
    } finally {
      if (executionRequest.finish(controller)) setIsSubmitting(false);
    }
  };

  const isBusy = isRunning || isSubmitting;

  useEffect(() => {
    if (!result && !executionMessage) return;
    const frame = window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [executionMessage, result]);

  return (
    <AdminCard
      title="Admin Code Execution Sandbox"
      subtitle="Execute solutions against real backend Judge0 test cases in real-time"
      icon={<Terminal className="w-5 h-5" />}
    >
      <div className="space-y-4 font-sans text-left">
        <RequestStatus pending={combinedResourcesLoading} error={combinedResourcesError} onRetry={() => setResourcesRetry((value) => value + 1)} label="Loading execution options…" />
        {/* Controls Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
          {/* Question Select */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Select Question
            </label>
            <select
              value={selectedQuestionId ?? ''}
              onChange={handleQuestionSelectChange}
              disabled={isBusy || combinedResourcesLoading || !languages.length}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  #{q.id} - {q.title} {q.difficulty ? `(${q.difficulty})` : ''}
                </option>
              ))}
              {questions.length === 0 && <option value="">No indexed questions loaded</option>}
            </select>
          </div>

          {/* Manual ID Input */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Question ID
            </label>
            <input
              type="number"
              value={manualQuestionId}
              onChange={handleManualQuestionIdChange}
              placeholder="e.g. 1"
              disabled={isBusy || combinedResourcesLoading || !languages.length}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Language Selector */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Compiler Runtime
            </label>
            <select
              value={selectedLanguageId ?? ''}
              onChange={handleLanguageChange}
              disabled={isBusy || combinedResourcesLoading || !languages.length || !sourceCode.trim()}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Execution Action Buttons */}
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              onClick={handleRunSampleCases}
              disabled={isBusy || combinedResourcesLoading || !languages.length || !sourceCode.trim()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs hover:shadow-sm disabled:opacity-50 transition-all cursor-pointer"
              title="Execute sample test cases (/api/v1/admin/testCode)"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>

            <button
              onClick={handleSubmitAllCases}
              disabled={isBusy || combinedResourcesLoading || !languages.length}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-sm disabled:opacity-50 transition-all cursor-pointer"
              title="Submit against all test cases (/api/v1/admin/submitCode)"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
              <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
            </button>
          </div>
        </div>

                    <RequestStatus pending={isRunning || isSubmitting} error={!result ? executionMessage : null} label={isSubmitting ? "Submitting code…" : "Running code…"} />
        {/* Monaco Editor Container */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="font-semibold">{selectedLangObj?.name || 'Code Editor'}</span>
            </div>
            <button
              onClick={() => {
                if (selectedLangObj && DEFAULT_STARTER_CODES[selectedLangObj.name]) {
                  setSourceCode(DEFAULT_STARTER_CODES[selectedLangObj.name]);
                }
              }}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Template</span>
            </button>
          </div>

          <div className="h-72 w-full bg-[#1e1e1e]">

                  <Editor
                    loading={<div role="status" className="w-full p-6"><Skeleton className="h-5 w-3/4" count={8} /><span className="sr-only">Loading code editor</span></div>}
              height="100%"
              language={monacoLang}
              value={sourceCode}
              onChange={(value) => setSourceCode(value || '')}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                readOnly: isBusy,
                readOnlyMessage: { value: 'Editing is paused while code execution is in progress.' },
                wordWrap: 'on',
                smoothScrolling: true,
                accessibilitySupport: 'auto',
              }}
            />
          </div>
        </div>

        {/* Results Console Panel */}
        {result && (
          <div ref={resultsRef} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 space-y-4 shadow-xs animate-in fade-in duration-200" aria-live="polite">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Execution Output ({executionMode === 'submit' ? 'All Test Cases' : 'Sample Run'})
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <AdminBadge variant="info">
                  Total: {result.totalTestCases}
                </AdminBadge>
                <AdminBadge variant="success">
                  Passed: {result.passedTestCases}
                </AdminBadge>
                {result.failedTestCases > 0 && (
                  <AdminBadge variant="danger">
                    Failed: {result.failedTestCases}
                  </AdminBadge>
                )}
              </div>
            </div>

            {executionMessage && (
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {executionMessage}
              </p>
            )}

            {/* Test Case Breakdown List */}
            {result.testCases && result.testCases.length > 0 && (
              <div className="space-y-2.5">
                {result.testCases.map((tc, idx) => {
                  const isPassed = tc.status?.toLowerCase() === 'passed' || tc.status?.toLowerCase() === 'accepted';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs font-mono transition-colors ${
                        isPassed
                          ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40'
                          : 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {isPassed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          )}
                          <span className="font-bold text-slate-900 dark:text-white">
                            Test Case #{tc.testCaseId || idx + 1}
                          </span>
                          {tc.testCaseType && (
                            <AdminBadge variant="neutral" size="sm">
                              {tc.testCaseType}
                            </AdminBadge>
                          )}
                        </div>
                        <AdminBadge variant={isPassed ? 'success' : 'danger'} size="sm">
                          {tc.status || (isPassed ? 'Passed' : 'Failed')}
                        </AdminBadge>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px]">
                        {tc.actualOutput && (
                          <div>
                            <span className="text-slate-500 font-semibold block mb-0.5">Output:</span>
                            <pre className="p-2 bg-white/80 dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto whitespace-pre-wrap">
                              {tc.actualOutput}
                            </pre>
                          </div>
                        )}
                        {tc.errorMessage && (
                          <div>
                            <span className="text-rose-500 font-semibold block mb-0.5">Error:</span>
                            <pre className="p-2 bg-rose-100/50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-900/40 overflow-x-auto whitespace-pre-wrap">
                              {tc.errorMessage}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminCard>
  );
};
