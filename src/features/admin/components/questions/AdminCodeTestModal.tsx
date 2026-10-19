import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { AdminModal } from '../AdminModal';
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
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
} from 'lucide-react';

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
  const { theme } = useTheme();

  const [languages, setLanguages] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);
  const [sourceCode, setSourceCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<ExecutionResultData | null>(null);
  const [questionDetails, setQuestionDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [isStatementOpen, setIsStatementOpen] = useState<boolean>(false);
  const [executionMessage, setExecutionMessage] = useState<string>('');

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
            console.warn('Could not load question statement in test modal:', err);
          })
          .finally(() => {
            setLoadingDetails(false);
          });
      }
    }
  }, [isOpen, question?.id]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    setSelectedLanguageId(newId);
    const found = languages.find((l) => l.id === newId);
    if (found && STARTER_CODES[found.name]) {
      setSourceCode(STARTER_CODES[found.name]);
    }
    setResult(null);
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

  // 1. Run Sample Cases (POST /api/v1/admin/testCode)
  const handleRunSampleCases = async () => {
    if (!question?.id || selectedLanguageId === null) return;

    setIsRunning(true);
    setResult(null);
    setExecutionMessage('');

    try {
      const res = await adminQuestionService.adminTestCode({
        questionId: Number(question.id),
        languageId: (selectedLangObj as any)?.referenceId || selectedLanguageId,
        sourceCode,
      });

      const data = (res as any)?.data || res;
      setResult(data);
      setExecutionMessage((res as any)?.message || 'Executed sample test cases');
      toast.success('Sample test cases passed execution!');
    } catch (err: any) {
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg = detail && detail !== err?.message ? `${err?.message || 'Admin testCode failed'}: ${detail}` : (err?.message || 'Admin testCode execution failed');
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

  // 2. Submit All Cases (POST /api/v1/admin/submitCode)
  const handleSubmitAllCases = async () => {
    if (!question?.id || selectedLanguageId === null) return;

    setIsSubmitting(true);
    setResult(null);
    setExecutionMessage('');

    try {
      const res = await adminQuestionService.adminSubmitCode({
        questionId: Number(question.id),
        languageId: (selectedLangObj as any)?.referenceId || selectedLanguageId,
        sourceCode,
      });

      const data = (res as any)?.data || res;
      setResult(data);
      setExecutionMessage((res as any)?.message || 'Executed all test cases');
      toast.success('Admin validation run completed against all test cases!');
    } catch (err: any) {
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg = detail && detail !== err?.message ? `${err?.message || 'Admin submitCode failed'}: ${detail}` : (err?.message || 'Admin submitCode execution failed');
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

  const isBusy = isRunning || isSubmitting;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={question ? `Runtime Tester — #${question.id}: ${question.title}` : 'Code Tester'}
      subtitle="Execute real Judge0 compilations against sample and full verification test suites"
      icon={<Terminal className="w-5 h-5" />}
      maxWidth="5xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSampleCases}
              disabled={isBusy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Sample Cases...' : 'Run Sample Cases'}</span>
            </button>
            <button
              onClick={handleSubmitAllCases}
              disabled={isBusy}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
              <span>{isSubmitting ? 'Submitting All...' : 'Submit All Test Cases'}</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Close Sandbox
          </button>
        </div>
      }
    >
      <div className="space-y-4 font-sans text-left">
        {/* Collapsible Statement Drawer */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsStatementOpen((prev) => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Problem Statement &amp; Constraints</span>
            </div>
            {isStatementOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isStatementOpen && (
            <div className="p-4 pt-0 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3 text-xs leading-relaxed">
              {loadingDetails ? (
                <div className="flex items-center gap-2 text-slate-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading statement details...</span>
                </div>
              ) : questionDetails ? (
                <>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {questionDetails.description}
                  </p>
                  {questionDetails.constraints && (
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-400 block mb-1">Constraints:</span>
                      {questionDetails.constraints}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-400 italic">No statement available.</p>
              )}
            </div>
          )}
        </div>

        {/* Toolbar: Language selector and Reset */}
        <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Runtime:
            </span>
            <select
              value={selectedLanguageId ?? ''}
              onChange={handleLanguageChange}
              disabled={isBusy}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (selectedLangObj && STARTER_CODES[selectedLangObj.name]) {
                setSourceCode(STARTER_CODES[selectedLangObj.name]);
              }
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Boilerplate</span>
          </button>
        </div>

        {/* Monaco Editor */}
        <div className="h-72 w-full rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs bg-[#1e1e1e]">
          <Editor
            height="100%"
            language={monacoLang}
            value={sourceCode}
            onChange={(val) => setSourceCode(val || '')}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>

        {/* Execution Results */}
        {result && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-blue-600" />
                Execution Results
              </span>
              <div className="flex items-center gap-2">
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

            {result.testCases && result.testCases.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {result.testCases.map((tc, idx) => {
                  const isPassed = tc.status?.toLowerCase() === 'passed' || tc.status?.toLowerCase() === 'accepted';
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs font-mono ${
                        isPassed
                          ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40'
                          : 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Test Case #{tc.testCaseId || idx + 1}
                        </span>
                        <AdminBadge variant={isPassed ? 'success' : 'danger'} size="sm">
                          {tc.status || (isPassed ? 'Passed' : 'Failed')}
                        </AdminBadge>
                      </div>
                      {tc.actualOutput && (
                        <pre className="p-2 bg-white/80 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-[11px] overflow-x-auto whitespace-pre-wrap">
                          {tc.actualOutput}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminModal>
  );
};
