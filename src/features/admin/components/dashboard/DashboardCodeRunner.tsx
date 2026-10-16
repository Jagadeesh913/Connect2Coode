import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { AdminCard } from '../AdminCard';
import { AdminBadge } from '../AdminBadge';
import { adminQuestionService } from '../../../../services/admin/adminQuestionService';
import { adminLanguageService, LanguageDropdownItem } from '../../../../services/admin/adminLanguageService';
import { ExecutionResultData, ExecutionTestCaseResult } from '../../../../services/executionService';
import { toast } from 'react-hot-toast';

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
  // Monaco starter template for user solution (standard output for Judge0 execution):
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
  // Question options & selection
  const [questions, setQuestions] = useState<Array<{ id: number; title: string; difficulty?: string }>>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [manualQuestionId, setManualQuestionId] = useState<string>('');

  // Languages from GET /api/v1/language/dropdown
  const [languages, setLanguages] = useState<LanguageDropdownItem[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);

  // Editor code
  const [sourceCode, setSourceCode] = useState<string>('');

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [executionMode, setExecutionMode] = useState<'run' | 'submit' | null>(null);
  const [result, setResult] = useState<ExecutionResultData | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string>('');

  // 1. Fetch live active languages from /api/v1/language/dropdown
  // and questions list from /api/v1/questions
  useEffect(() => {
    adminLanguageService.getLanguageDropdown().then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setLanguages(list);
        setSelectedLanguageId(list[0].id);
        const langName = list[0].name;
        if (DEFAULT_STARTER_CODES[langName]) {
          setSourceCode(DEFAULT_STARTER_CODES[langName]);
        }
      }
    });

    adminQuestionService
      .getQuestions({
        level: null,
        companies: null,
        topic: null,
        searchText: null,
        pageRequest: { pageNumber: 0, pageSize: 50, sortBy: 'id', sortDirection: 'ASC' },
      })
      .then((res: any) => {
        const raw = res?.data || res;
        const list = Array.isArray(raw?.content)
          ? raw.content
          : Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];
        if (list.length > 0) {
          const mapped = list.map((q: any) => ({
            id: q.id,
            title: q.title || `Question #${q.id}`,
            difficulty: q.difficultyRefName || q.difficultyName || '',
          }));
          setQuestions(mapped);
          setSelectedQuestionId(mapped[0].id);
          setManualQuestionId(String(mapped[0].id));
        }
      })
      .catch((err) => {
        console.warn('Dashboard questions fetch failed:', err);
      });
  }, []);

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

  // Determine Monaco language mode
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

  // 1. Admin TEST CODE (POST /api/v1/admin/testCode)
  // Executes visible sample test cases only
  const handleRunSampleCases = async () => {
    const qId = Number(manualQuestionId || selectedQuestionId);
    if (!qId || isNaN(qId) || selectedLanguageId === null || languages.length === 0) {
      toast.error('Please enter a valid Question ID');
      return;
    }

    setIsRunning(true);
    setExecutionMode('run');
    setResult(null);
    setExecutionMessage('');

    try {
      const res = await adminQuestionService.adminTestCode({
        questionId: qId,
        languageId: selectedLangObj?.referenceId ?? selectedLanguageId,
        sourceCode,
      });

      const data = (res as any)?.data || res;
      setResult(data);
      setExecutionMessage((res as any)?.message || 'Code Executed Successfully (Sample Test Cases)');
      toast.success((res as any)?.message || 'Admin test completed on sample test cases!');
    } catch (err: any) {
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg = detail && detail !== err?.message ? `${err?.message || 'Admin testCode execution failed'}: ${detail}` : (err?.message || 'Admin testCode execution failed');
      toast.error(msg);
      setExecutionMessage(msg);
      setResult({
        totalTestCases: 0,
        passedTestCases: 0,
        failedTestCases: 0,
        testCases: [
          {
            testCaseId: 0,
            testCaseType: 'Error',
            status: 'Failed',
            actualOutput: msg,
          },
        ],
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 2. Admin SUBMIT CODE (POST /api/v1/admin/submitCode)
  // Executes all test cases (visible + mandatory + corner/edge cases)
  const handleSubmitAllCases = async () => {
    const qId = Number(manualQuestionId || selectedQuestionId);
    if (!qId || isNaN(qId)) {
      toast.error('Please enter a valid Question ID');
      return;
    }

    setIsSubmitting(true);
    setExecutionMode('submit');
    setResult(null);
    setExecutionMessage('');

    try {
      const res = await adminQuestionService.adminSubmitCode({
        questionId: qId,
        languageId: (selectedLangObj as any)?.referenceId || selectedLanguageId,
        sourceCode,
      });

      const data = (res as any)?.data || res;
      setResult(data);
      setExecutionMessage((res as any)?.message || 'Code Submitted Successfully (Full Test Suite)');
      toast.success((res as any)?.message || 'Admin validation completed across all test cases!');
    } catch (err: any) {
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg = detail && detail !== err?.message ? `${err?.message || 'Admin submitCode validation failed'}: ${detail}` : (err?.message || 'Admin submitCode validation failed');
      toast.error(msg);
      setExecutionMessage(msg);
      setResult({
        totalTestCases: 0,
        passedTestCases: 0,
        failedTestCases: 0,
        testCases: [
          {
            testCaseId: 0,
            testCaseType: 'Error',
            status: 'Failed',
            actualOutput: msg,
          },
        ],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminCard
      title="Admin Problem Code Runner & Validator"
      subtitle="Execute sample cases (POST /api/v1/admin/testCode) or full suite (POST /api/v1/admin/submitCode) directly from the console"
    >
      <div className="flex flex-col gap-5 font-sans text-xs">
        {/* API Pipeline Architecture Notice */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-900 border border-white/10 rounded-xl flex-wrap gap-2">
          <div className="flex items-center gap-2.5 text-gray-200">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-100 text-neutral-900 animate-pulse"></span>
            <span className="font-bold text-xs font-heading">Admin Execution Pipeline:</span>
            <span className="text-[11px] text-gray-400">
              Sends <code className="text-neutral-300 font-mono">languageId</code> from Table and executes without creating permanent submission records.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AdminBadge variant="accent">POST /api/v1/admin/testCode</AdminBadge>
            <AdminBadge variant="primary">POST /api/v1/admin/submitCode</AdminBadge>
          </div>
        </div>

        {/* Control Bar: Question Picker, ID Input, Language Selector & Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-neutral-950 p-3 rounded-xl border border-white/10">
          {/* Question Selector (Select or Type ID) */}
          <div className="md:col-span-5 flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Select Question:
              </label>
              {questions.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedQuestionId ?? ''}
                    onChange={handleQuestionSelectChange}
                    className="w-full appearance-none bg-neutral-900 text-gray-200 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs outline-none focus:border-neutral-500 cursor-pointer transition-colors shadow-2xs"
                  >
                    {questions.map((q) => (
                      <option key={q.id} value={q.id} className="bg-neutral-900 text-white">
                        #{q.id} {q.title} ({q.difficulty})
                      </option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <span className="text-gray-500 text-xs">No questions available from the backend.</span>
              )}
            </div>

            <div className="w-24">
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Question ID:
              </label>
              <input
                type="number"
                value={manualQuestionId}
                onChange={handleManualQuestionIdChange}
                placeholder="ID"
                className="w-full bg-neutral-900 text-gray-200 border border-white/10 rounded-xl px-2.5 py-2 text-xs outline-none focus:border-neutral-500 font-mono text-center transition-colors shadow-2xs"
              />
            </div>
          </div>

          {/* Language Dropdown (GET /api/v1/language/dropdown) */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              Active Language (/api/v1/language/dropdown):
            </label>
            <div className="relative">
              <select
                value={selectedLanguageId ?? ''}
                onChange={handleLanguageChange}
                className="w-full appearance-none bg-neutral-900 text-gray-200 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs outline-none focus:border-neutral-500 cursor-pointer transition-colors shadow-2xs"
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id} className="bg-neutral-900 text-white">
                    {l.name} (Execution ID: {l.id})
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Execution Buttons */}
          <div className="md:col-span-4 flex items-center justify-end gap-2 pt-4 md:pt-0">
            {/* Run Code (Sample Cases) */}
            <button
              onClick={handleRunSampleCases}
              disabled={isRunning || isSubmitting || selectedQuestionId === null || selectedLanguageId === null}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-gray-200 border border-white/15 hover:border-neutral-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Runs visible sample test cases only (POST /api/v1/admin/testCode)"
            >
              {isRunning ? (
                <i className="fa-solid fa-spinner animate-spin text-neutral-300"></i>
              ) : (
                <i className="fa-solid fa-play text-neutral-300 text-xs"></i>
              )}
              <span>Run Code</span>
            </button>

            {/* Submit Code (All Test Cases) */}
            <button
              onClick={handleSubmitAllCases}
              disabled={isRunning || isSubmitting || selectedQuestionId === null || selectedLanguageId === null}
              className="px-4 py-2 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-black font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md  disabled:opacity-50"
              title="Runs full suite including corner & hidden cases (POST /api/v1/admin/submitCode)"
            >
              {isSubmitting ? (
                <i className="fa-solid fa-spinner animate-spin text-black"></i>
              ) : (
                <i className="fa-solid fa-cloud-arrow-up text-black text-xs"></i>
              )}
              <span>Submit &amp; Validate</span>
            </button>
          </div>
        </div>

        {/* Code Editor Container */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#1E1E1E] shadow-xl">
          <div className="px-4 py-2 bg-neutral-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-300 font-mono text-[11px]">
              <i className="fa-solid fa-file-code text-neutral-300"></i>
              <span>Question #{manualQuestionId || selectedQuestionId} Solution Code</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
              Runtime: {selectedLangObj?.name} (Judge0)
            </span>
          </div>
          <Editor
            height="300px"
            language={monacoLang}
            value={sourceCode}
            onChange={(val) => setSourceCode(val || '')}
            theme="vs-dark"
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Execution Output Panel */}
        {result && (
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
            {/* Header Result Summary */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white text-xs font-heading">
                  {executionMode === 'run' ? 'Test Run Output' : 'Submission Validation Output'}:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg font-mono font-extrabold text-xs ${
                    result.failedTestCases === 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {result.failedTestCases === 0 ? '✓ All Test Cases Passed' : `✗ ${result.failedTestCases} Failed`}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-gray-400">
                  Total: <strong className="text-white">{result.totalTestCases}</strong>
                </span>
                <span className="text-emerald-400">
                  Passed: <strong>{result.passedTestCases}</strong>
                </span>
                <span className="text-rose-400">
                  Failed: <strong>{result.failedTestCases}</strong>
                </span>
              </div>
            </div>

            {executionMessage && (
              <p className="text-[11px] text-gray-400 italic">{executionMessage}</p>
            )}

            {/* Individual Test Cases Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {result.testCases && result.testCases.length > 0 ? (
                result.testCases.map((tc: ExecutionTestCaseResult, idx: number) => {
                  const isPassed = tc.status?.toLowerCase() === 'passed';
                  const isHidden = tc.isHidden === true;

                  return (
                    <div
                      key={tc.testCaseId || idx}
                      className={`p-3 rounded-xl border font-mono text-[11px] flex flex-col gap-2 ${
                        isPassed
                          ? 'bg-emerald-950/20 border-emerald-500/20'
                          : 'bg-rose-950/20 border-rose-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-white/5">
                        <span className="font-bold text-gray-200">
                          Case #{tc.testCaseId || idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">
                            {tc.testCaseType || (isHidden ? 'Hidden Case' : 'Visible Sample')}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isPassed
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {tc.status || (isPassed ? 'Passed' : 'Failed')}
                          </span>
                        </div>
                      </div>

                      {isHidden || (!tc.input && !tc.expectedOutput && isPassed) ? (
                        <div className="text-gray-500 italic text-[10px] py-1">
                          Test case details hidden by evaluator for validation privacy.
                        </div>
                      ) : (
                        <div className="space-y-1 text-[11px]">
                          {tc.input !== undefined && tc.input !== null && (
                            <div>
                              <span className="text-gray-500">Input:</span>{' '}
                              <span className="text-gray-200 whitespace-pre-wrap">{tc.input}</span>
                            </div>
                          )}
                          {tc.expectedOutput !== undefined && tc.expectedOutput !== null && (
                            <div>
                              <span className="text-gray-500">Expected:</span>{' '}
                              <span className="text-emerald-400 whitespace-pre-wrap">{tc.expectedOutput}</span>
                            </div>
                          )}
                          {tc.actualOutput !== undefined && tc.actualOutput !== null && (
                            <div>
                              <span className="text-gray-500">Actual:</span>{' '}
                              <span
                                className={`whitespace-pre-wrap ${
                                  isPassed ? 'text-gray-300' : 'text-rose-400'
                                }`}
                              >
                                {tc.actualOutput}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500 text-xs italic p-4 text-center col-span-2">
                  No individual test cases returned by evaluator.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminCard>
  );
};
