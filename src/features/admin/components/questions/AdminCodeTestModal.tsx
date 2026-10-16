import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { AdminModal } from '../AdminModal';
import { AdminBadge } from '../AdminBadge';
import { adminQuestionService } from '../../../../services/admin/adminQuestionService';
import { ExecutionResultData, ExecutionTestCaseResult } from '../../../../services/executionService';
import { toast } from 'react-hot-toast';

interface AdminCodeTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: {
    id: number | string;
    title: string;
    difficultyRefName?: string;
  } | null;
}

const STARTER_CODES: Record<string, string> = {
  Java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String input = sc.next();
            System.out.println(input);
        }
    }
}`,
  Python: `import sys

def solve():
    lines = sys.stdin.read().split()
    if lines:
        print(lines[0])

if __name__ == '__main__':
    solve()
`,
  'C++': `#include <iostream>
#include <string>
using namespace std;

int main() {
    string input;
    if (cin >> input) {
        cout << input << endl;
    }
    return 0;
}
`,
  // Monaco starter template for user solution (standard output for Judge0 execution):
  JavaScript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    console.log(input);
}

solve();
`,
};

export const AdminCodeTestModal: React.FC<AdminCodeTestModalProps> = ({
  isOpen,
  onClose,
  question,
}) => {
  const [languages, setLanguages] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);
  const [sourceCode, setSourceCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<ExecutionResultData | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'console' | 'testcases'>('testcases');
  const [questionDetails, setQuestionDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [isStatementOpen, setIsStatementOpen] = useState<boolean>(true);

  // Load real languages dropdown from backend
  useEffect(() => {
    if (isOpen) {
      adminQuestionService.getLanguagesDropdown().then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setLanguages(list);
          setSelectedLanguageId(list[0].id);
          const langName = list[0].name;
          setSourceCode(STARTER_CODES[langName] || '');
        }
      });
      setResult(null);

      if (question?.id) {
        setLoadingDetails(true);
        adminQuestionService
          .getQuestionById(question.id)
          .then((res: any) => {
            const data = res?.data || res;
            setQuestionDetails(data);
          })
          .catch((err) => {
            console.warn('Failed to load question details for test modal:', err);
          })
          .finally(() => {
            setLoadingDetails(false);
          });
      }
    } else {
      setQuestionDetails(null);
    }
  }, [isOpen, question?.id]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    setSelectedLanguageId(newId);
    const langObj = languages.find((l) => l.id === newId);
    if (langObj && STARTER_CODES[langObj.name]) {
      setSourceCode(STARTER_CODES[langObj.name]);
    }
    setResult(null);
  };

  const selectedLangObj = languages.find((l) => l.id === selectedLanguageId);
  const selectedLangName = selectedLangObj?.name?.toLowerCase() || '';
  const monacoLang =
    selectedLangName === 'c++'
      ? 'cpp'
      : selectedLangName === 'python'
      ? 'python'
      : selectedLangName === 'javascript'
      ? 'javascript'
      : selectedLangName === 'java'
      ? 'java'
      : 'plaintext';

  // Admin RUN (Sample / Visible Test Cases)
  const handleAdminRun = async () => {
    if (!question?.id || selectedLanguageId === null || !selectedLangObj) return;
    setIsRunning(true);
    setResult(null);
    try {
      const res = await adminQuestionService.adminTestCode({
        questionId: Number(question.id),
        languageId: (selectedLangObj as any)?.referenceId ?? selectedLanguageId,
        sourceCode,
      });
      const data = (res as any)?.data || res;
      setResult(data);
      toast.success('Admin: Sample test cases executed');
    } catch (err: any) {
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg = detail && detail !== err?.message ? `${err?.message || 'Admin run failed'}: ${detail}` : (err?.message || 'Admin run failed');
      toast.error(msg);
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

  // Admin SUBMIT (All Test Cases)
  const handleAdminSubmit = async () => {
    if (!question?.id) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const res = await adminQuestionService.adminSubmitCode({
        questionId: Number(question.id),
        languageId: (selectedLangObj as any)?.referenceId ?? selectedLanguageId,
        sourceCode,
      });
      const data = (res as any)?.data || res;
      setResult(data);
      toast.success('Admin: Full validation submitted');
    } catch (err: any) {
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg = detail && detail !== err?.message ? `${err?.message || 'Admin validation failed'}: ${detail}` : (err?.message || 'Admin validation failed');
      toast.error(msg);
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

  if (!question) return null;

  const rawCases = questionDetails?.testCases || [];
  const sampleTestCases = rawCases.filter(
    (tc: any) => tc.isHidden === false || tc.typeRefCode === 'SAMPLE' || !tc.typeRefCode?.includes('HIDDEN')
  );
  const allTestCasesCount = rawCases.length;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Admin Code Test: #${question.id} ${question.title}`}
      subtitle="Validate problem statement with sample tests (POST /api/v1/admin/testCode) or full suite (POST /api/v1/admin/submitCode)"
      maxWidth="4xl"
    >
        <div className="flex flex-col gap-4 font-sans text-xs">
          {/* Admin Mode Notice */}
          <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-amber-400">
              <i className="fa-solid fa-shield-halved text-sm"></i>
              <span className="font-semibold text-xs">Admin Execution Mode</span>
              <span className="text-[11px] text-gray-400">• Non-persisting execution (no student submission record created)</span>
            </div>
            <AdminBadge variant="accent">Admin API</AdminBadge>
          </div>

          {/* Collapsible Problem Statement & Configured Sample Test Cases Panel */}
          <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden transition-all">
            <div
              onClick={() => setIsStatementOpen((prev) => !prev)}
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-file-lines text-neutral-300"></i>
                <span className="font-bold text-white text-xs">Problem Statement &amp; Configured Sample Test Cases</span>
                {loadingDetails ? (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                    <i className="fa-solid fa-spinner animate-spin"></i> Loading...
                  </span>
                ) : (
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-mono font-semibold">
                    {sampleTestCases.length} Sample Case{sampleTestCases.length !== 1 ? 's' : ''} (of {allTestCasesCount || sampleTestCases.length} total)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <span>{isStatementOpen ? 'Hide' : 'View'} Statement &amp; Test Cases</span>
                <i className={`fa-solid fa-chevron-${isStatementOpen ? 'up' : 'down'} text-[10px]`}></i>
              </div>
            </div>

            {isStatementOpen && (
              <div className="p-4 pt-1 border-t border-white/5 flex flex-col gap-3 text-xs bg-neutral-950">
                {/* Problem Description */}
                {questionDetails?.description && (
                  <div>
                    <span className="text-gray-400 font-semibold block text-[11px] mb-1 uppercase tracking-wider">
                      Description:
                    </span>
                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap bg-neutral-900 p-3 rounded-lg border border-white/5 font-sans">
                      {questionDetails.description}
                    </p>
                  </div>
                )}

                {/* Constraints if present */}
                {questionDetails?.constraints && (
                  <div>
                    <span className="text-gray-400 font-semibold block text-[11px] mb-1 uppercase tracking-wider">
                      Constraints:
                    </span>
                    <div className="font-mono text-gray-300 bg-neutral-900 p-2.5 rounded-lg border border-white/5">
                      {questionDetails.constraints}
                    </div>
                  </div>
                )}

                {/* Configured Sample Test Cases */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                      Configured Sample Test Cases (Evaluated by "Run Code"):
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      POST /api/v1/admin/testCode runs these
                    </span>
                  </div>

                  {sampleTestCases.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {sampleTestCases.map((stc: any, sIdx: number) => (
                        <div
                          key={stc.id || sIdx}
                          className="bg-neutral-900 p-2.5 rounded-lg border border-white/10 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-gray-200">
                              Sample #{sIdx + 1}
                            </span>
                            <span className="text-[10px] text-neutral-300 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
                              {stc.typeRefName || 'Sample'}
                            </span>
                          </div>
                          <div className="font-mono text-[11px]">
                            <span className="text-gray-500 text-[10px] block">Input:</span>
                            <div className="bg-neutral-950 p-1.5 rounded border border-white/5 text-gray-300 font-mono whitespace-pre-wrap break-all max-h-16 overflow-y-auto">
                              {stc.input || '(empty)'}
                            </div>
                          </div>
                          <div className="font-mono text-[11px]">
                            <span className="text-gray-500 text-[10px] block">Expected Output:</span>
                            <div className="bg-neutral-950 p-1.5 rounded border border-white/5 text-emerald-400 font-mono whitespace-pre-wrap break-all max-h-16 overflow-y-auto">
                              {stc.expectedOutput || '(empty)'}
                            </div>
                          </div>
                          {stc.explanation && (
                            <p className="text-[10px] text-gray-400 italic" title={stc.explanation}>
                              {stc.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-[11px] p-2 bg-neutral-900 rounded-lg">
                      {loadingDetails ? 'Fetching sample test cases...' : 'No visible sample test cases found.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

        {/* Top Control Bar: Language Dropdown + Action Buttons */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-neutral-900 p-2.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <label className="text-gray-300 font-semibold text-xs flex items-center gap-1.5">
              <i className="fa-solid fa-code text-neutral-300"></i>
              <span>Language:</span>
            </label>
            <div className="relative">
              <select
                value={selectedLanguageId ?? ''}
                onChange={handleLanguageChange}
                className="appearance-none bg-neutral-950 text-gray-200 border border-white/10 rounded-xl pl-3 pr-8 py-1.5 text-xs outline-none focus:border-neutral-500 cursor-pointer transition-colors shadow-2xs"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id} className="bg-neutral-900 text-white">
                    {lang.name} (Table ID: {lang.id})
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Run Code Button */}
            <button
              onClick={handleAdminRun}
              disabled={isRunning || isSubmitting || selectedLanguageId === null || languages.length === 0}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-gray-200 border border-white/10 hover:border-neutral-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Executes visible sample test cases only (POST /api/v1/admin/testCode)"
            >
              {isRunning ? (
                <i className="fa-solid fa-spinner animate-spin text-neutral-300"></i>
              ) : (
                <i className="fa-solid fa-play text-neutral-300 text-[10px]"></i>
              )}
              <span>Run Code (Sample)</span>
            </button>

            {/* Submit Code Button */}
            <button
              onClick={handleAdminSubmit}
              disabled={isRunning || isSubmitting}
              className="px-4 py-1.5 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-black font-extrabold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md  disabled:opacity-50"
              title="Executes all test cases including hidden (POST /api/v1/admin/submitCode)"
            >
              {isSubmitting ? (
                <i className="fa-solid fa-spinner animate-spin text-black"></i>
              ) : (
                <i className="fa-solid fa-cloud-arrow-up text-black text-[11px]"></i>
              )}
              <span>Submit & Validate (All)</span>
            </button>
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#1E1E1E] shadow-inner">
          <Editor
            height="320px"
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
              formatOnPaste: true,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Execution Results Section */}
        {result && (
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
            {/* Header Summary */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white text-xs">Validation Result:</span>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                    result.failedTestCases === 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {result.failedTestCases === 0 ? 'All Passed' : `${result.failedTestCases} Failed`}
                </span>
                <span className="text-gray-400 text-xs font-mono">
                  Passed: {result.passedTestCases} / {result.totalTestCases}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveResultTab('testcases')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    activeResultTab === 'testcases' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Test Cases ({result.testCases?.length || 0})
                </button>
              </div>
            </div>

            {/* Test Cases List */}
            {activeResultTab === 'testcases' && (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {result.testCases && result.testCases.length > 0 ? (
                  result.testCases.map((tc: ExecutionTestCaseResult, idx: number) => {
                    const isPassed = tc.status?.toLowerCase() === 'passed';
                    const isHidden = tc.isHidden === true;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex flex-col gap-1.5 ${
                          isPassed
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-rose-500/5 border-rose-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-200 flex items-center gap-1.5">
                            <i
                              className={`fa-solid ${
                                isPassed ? 'fa-check text-emerald-400' : 'fa-xmark text-rose-400'
                              }`}
                            ></i>
                            <span>Test Case #{idx + 1}</span>
                            <span className="text-gray-500 font-mono text-[10px]">
                              ({tc.testCaseType || (isHidden ? 'Hidden Test Case' : 'Visible Sample Test Case')})
                            </span>
                          </span>

                          <div className="flex items-center gap-2">
                            {isHidden && (
                              <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded font-mono">
                                Hidden
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {tc.status}
                            </span>
                          </div>
                        </div>

                        {/* Visible Test Case Details (Only when not hidden) */}
                        {!isHidden && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 text-[11px] font-mono">
                            {tc.input && (
                              <div className="bg-neutral-950 p-2 rounded border border-white/5">
                                <span className="text-gray-500 block text-[10px]">Input:</span>
                                <span className="text-gray-300">{tc.input}</span>
                              </div>
                            )}
                            {tc.expectedOutput && (
                              <div className="bg-neutral-950 p-2 rounded border border-white/5">
                                <span className="text-gray-500 block text-[10px]">Expected:</span>
                                <span className="text-emerald-400">{tc.expectedOutput}</span>
                              </div>
                            )}
                            {tc.actualOutput && (
                              <div className="bg-neutral-950 p-2 rounded border border-white/5 sm:col-span-2">
                                <span className="text-gray-500 block text-[10px]">Actual Output:</span>
                                <span className={isPassed ? 'text-gray-300' : 'text-rose-400'}>
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
                  <p className="text-gray-400 text-xs italic">No individual test cases returned</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminModal>
  );
};
