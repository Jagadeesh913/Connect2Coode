import { useExecutionRequest } from '../hooks/useExecutionRequest';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { isBookmarkItem, toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { fetchProblemById } from '../redux/problemSlice';
import { markSolvedProblem, hydrateProgress } from '../../progress/redux/progressSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { fetchLanguages } from '../../languages/redux/languageSlice';
import {
  executionService,
  isExecutionResultSuccessful,
  LanguageDropdownItem,
  ExecutionResultData,
} from '../../../services/executionService';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { NotFound } from '../../../shared/components/errors/NotFound';
import {
  resolveActiveQuestionId,
  canExecuteProblem,
  resolveExecutionLanguageName,
} from '../utils/problemExecution';
import { toast } from 'react-hot-toast';
import { userQuestionService } from '../../../services/userQuestionService';
import { useTheme } from '../../../shared/context/ThemeContext';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { extractTestCasesFromProblem } from '../../admin/utils/testCaseUtils';
import { useAssessmentIntegrity } from '../../../shared/hooks/useAssessmentIntegrity';

interface QuestionTestCase {
  id?: number;
  testCaseId?: number;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
  typeRefName?: string;
  typeRefCode?: string;
  displayOrder?: number;
}

interface SubmissionRecord {
  id: string;
  status: 'Accepted' | 'Wrong Answer';
  passedTestCases: number;
  totalTestCases: number;
  runtimeMs?: number | string;
  memoryMb?: number | string;
  language: string;
  languageId: number;
  timestamp: string;
  sourceCode?: string;
}

const DEFAULT_STARTER_CODE: Record<string, string> = {
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
    }
}`,
  python: `import sys

def main():
    # Read standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # Write your solution here
    

if __name__ == '__main__':
    main()
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}
`,
  javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    // Write your solution here
    
}

solve();
`,
};

export const ProblemDetails: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const problemIdentifier = id || slug || '';
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { theme } = useTheme();

  // Server state owned by Redux; only editor/execution/UI state stays local.
  const { selectedProblem: problem, detailLoading: loadingProblem, detailError: problemError } = useAppSelector((state) => state.problems);
  const { languages: serverLanguages, loading: loadingLanguages, error: languagesError } = useAppSelector((state) => state.languages);

  const languages = useMemo(
    () => serverLanguages.filter((language) => language.isActive !== false),
    [serverLanguages]
  );

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageDropdownItem | null>(null);

  // Editor State
  const lastIntegrityNoticeAt = useRef(0);
  const { bindTarget: bindWorkspace, targetRef: workspaceRef, violationCount } = useAssessmentIntegrity<HTMLDivElement>({
    onViolation: (violation) => {
      const now = Date.now();
      if (now - lastIntegrityNoticeAt.current < 1500) return;
      lastIntegrityNoticeAt.current = now;
      const message = violation === 'tab-switch'
        ? 'Leaving the assessment window was detected.'
        : 'This action is disabled in the coding assessment workspace.';
      toast.error(message, { id: 'assessment-integrity-warning' });
    },
  });
  const [codeByLang, setCodeByLang] = useState<Record<number, string>>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'problem' | 'editor'>('problem');

  // Native Fullscreen Toggle with safe browser fallback
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        const elem = workspaceRef.current || document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      // Fallback to full-window CSS if browser policy prevents requestFullscreen
      setIsFullscreen((prev) => !prev);
    }
  }, [workspaceRef]);

  // Sync isFullscreen with native browser fullscreen changes (e.g. Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isNativeFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [lastExecutionMode, setLastExecutionMode] = useState<'run' | 'custom' | 'submit' | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResultData | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState<number>(0);

  // Console layout state: 'normal' | 'collapsed' | 'expanded'
  const [consoleHeight, setConsoleHeight] = useState<'normal' | 'collapsed' | 'expanded'>('normal');

  // Active Tabs
  const [leftTab, setLeftTab] = useState<'description' | 'submissions' | 'companies' | 'hints'>('description');
  const [bottomTab, setBottomTab] = useState<'testcases' | 'custom' | 'results'>('testcases');
  const [customInput, setCustomInput] = useState<string>('');
  const resultsPanelRef = useRef<HTMLDivElement>(null);

  // Check whether the currently loaded problem entity matches this route's identifier
  const isProblemLoadedForRoute = Boolean(
    problem &&
      (String(problem.id) === String(problemIdentifier) ||
        (problem.slug && problem.slug.toLowerCase() === problemIdentifier.toLowerCase()))
  );

  // Active question ID resolved from loaded problem entity (F-001, F-016)
  const activeQuestionId = useMemo(
    () => resolveActiveQuestionId(problem, problemIdentifier),
    [problem, problemIdentifier]
  );

  // Execution readiness state (F-016)
  const isExecutionReady = useMemo(
    () =>
      canExecuteProblem({
        isExecuting,
        loadingProblem,
        activeQuestionId,
        selectedLanguage,
      }),
    [isExecuting, loadingProblem, activeQuestionId, selectedLanguage]
  );

  // Submissions history scoped to active question ID
  const [submissionsHistory, setSubmissionsHistory] = useState<SubmissionRecord[]>([]);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [submissionsRetry, setSubmissionsRetry] = useState(0);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  const languagesRef = useRef(languages);
  languagesRef.current = languages;

  useEffect(() => {
    const controller = new AbortController();
    setSubmissionsHistory([]);
    setLoadingSubmissions(false);

    setSubmissionsError(null);
    const loadSubmissions = async () => {
      if (!activeQuestionId) {
        setSubmissionsHistory([]);
        return;
      }

      // Submission history is server-owned; never display a browser-cached result.
      if (user?.id) {
        try {
          setLoadingSubmissions(true);
          const serverSubs = await userQuestionService.getQuestionSubmissions(
            user.id,
            activeQuestionId,
            controller.signal
          );
          if (!controller.signal.aborted && Array.isArray(serverSubs)) {
            const mappedRecords: SubmissionRecord[] = serverSubs.map((sub) => {
              const langName = resolveExecutionLanguageName(languagesRef.current, sub.languageId);
              const isAccepted =
                sub.status === 'Accepted' ||
                (sub.totalTestCases > 0 && sub.passedTestCases === sub.totalTestCases);
              const dateStr = sub.submittedAt
                ? new Date(sub.submittedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';
              const timeStr = sub.submittedAt
                ? new Date(sub.submittedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';
              return {
                id: String(sub.id),
                status: isAccepted ? 'Accepted' : 'Wrong Answer',
                passedTestCases: sub.passedTestCases,
                totalTestCases: sub.totalTestCases,
                language: langName,
                languageId: sub.languageId,
                timestamp: `${dateStr} ${timeStr}`.trim(),
                sourceCode: sub.sourceCode,
              };
            });
            setSubmissionsHistory(mappedRecords);
          }
        } catch {
          if (!controller.signal.aborted) setSubmissionsError('Unable to refresh submissions. Please retry.');
        } finally {
          if (!controller.signal.aborted) setLoadingSubmissions(false);
        }
      }
    };

    loadSubmissions();

    return () => {
      controller.abort();
    };
  }, [activeQuestionId, user?.id, submissionsRetry]);

  useEffect(() => {
    if (languages.length === 0) return;
    setSubmissionsHistory((records) =>
      records.map((record) => ({
        ...record,
        language: resolveExecutionLanguageName(languages, record.languageId),
      }))
    );
  }, [languages]);

  // Map language name to Monaco language
  const monacoLang = useMemo(() => {
    const name = selectedLanguage?.name.toLowerCase() || '';
    if (name.includes('python')) return 'python';
    if (name.includes('c++') || name.includes('cpp')) return 'cpp';
    if (name.includes('javascript') || name.includes('js')) return 'javascript';
    return selectedLanguage ? 'java' : 'plaintext';
  }, [selectedLanguage]);

  // Current active code in editor
  const currentCode = useMemo(() => {
    if (!selectedLanguage) return '';
    if (codeByLang[selectedLanguage.id] !== undefined) {
      return codeByLang[selectedLanguage.id];
    }
    return DEFAULT_STARTER_CODE[monacoLang] || DEFAULT_STARTER_CODE.java;
  }, [codeByLang, selectedLanguage, monacoLang]);

  // Load shared server state once; Redux owns both resources.
  useEffect(() => {
    dispatch(fetchLanguages());
  }, [dispatch]);

  useEffect(() => {
    if (!problemIdentifier) return;
    const request = dispatch(fetchProblemById(problemIdentifier));
    return () => {
      request.abort();
    };
  }, [dispatch, problemIdentifier]);

  useEffect(() => {
    if (serverLanguages.length > 0) {
      setSelectedLanguage((prev) => {
        const found = serverLanguages.find(
          (language) =>
            prev &&
            (language.id === prev.id || language.referenceId === prev.referenceId)
        );
        return found || serverLanguages[0];
      });
    }
  }, [serverLanguages]);

  // Sync title
  useEffect(() => {
    if (problem?.title) {
      document.title = `${problem.title} | Connect 2 Code`;
    }
  }, [problem?.title]);

  // Handle Editor Code Change
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!selectedLanguage) return;
      const newCode = value || '';
      setCodeByLang((prev) => ({
        ...prev,
        [selectedLanguage.id]: newCode,
      }));
    },
    [selectedLanguage]
  );

  // Handle Language Dropdown Change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLangId = Number(e.target.value);
    const targetLang = languages.find((l) => l.id === newLangId);
    if (targetLang) {
      setSelectedLanguage(targetLang);
      const newMonacoLang = targetLang.name.toLowerCase().includes('python')
        ? 'python'
        : targetLang.name.toLowerCase().includes('c++')
        ? 'cpp'
        : targetLang.name.toLowerCase().includes('javascript')
        ? 'javascript'
        : 'java';

      setCodeByLang((prev) => {
        if (prev[targetLang.id] === undefined) {
          return {
            ...prev,
            [targetLang.id]: DEFAULT_STARTER_CODE[newMonacoLang] || DEFAULT_STARTER_CODE.java,
          };
        }
        return prev;
      });
    }
  };

  // Reset Code
  const handleResetCode = () => {
    if (!selectedLanguage) return;
    const template = DEFAULT_STARTER_CODE[monacoLang] || DEFAULT_STARTER_CODE.java;
    if (currentCode.trim() !== template.trim()) {
      setIsResetConfirmOpen(true);
    } else {
      executeResetCode();
    }
  };

  const executeResetCode = () => {
    if (!selectedLanguage) return;
    const template = DEFAULT_STARTER_CODE[monacoLang] || DEFAULT_STARTER_CODE.java;
    setCodeByLang((prev) => ({
      ...prev,
      [selectedLanguage.id]: template,
    }));
    setIsResetConfirmOpen(false);
    toast.success('Code reset to default starter template');
  };


  // Bookmark Status
  const isBookmarked = useMemo(() => {
    if (!problem) return false;
    return bookmarks.some((b) => isBookmarkItem(b, problem.id, 'PROBLEM'));
  }, [problem, bookmarks]);

  const handleBookmarkToggle = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark questions');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    if (problem) {
      dispatch(
        toggleBookmarkItem({
          itemId: String(problem.id),
          type: 'PROBLEM',
          title: problem.title,
          difficulty: problem.difficultyRefName || problem.difficulty || 'Medium',
          category: problem.topicRefName || problem.topic || '',
        })
      )
        .unwrap()
        .then(() => {
          toast.success(isBookmarked ? 'Bookmark removed' : 'Problem bookmarked!');
        })
        .catch((err: any) => {
          toast.error(typeof err === 'string' ? err : 'Failed to update bookmark');
        });
    }
  };

  const executionRequest = useExecutionRequest(String(problemIdentifier));
  useEffect(() => {
    setIsExecuting(false);
    setExecutionResult(null);
    setExecutionError(null);
  }, [problemIdentifier]);

  // RUN CODE (Visible Sample Test Cases only)
  const executeRun = useCallback(async (customInputValue?: string) => {
    if (!isExecutionReady || !activeQuestionId || !selectedLanguage) {
      if (loadingProblem) {
        toast.error('Please wait for the problem to load');
      } else if (!selectedLanguage) {
        toast.error('No supported execution language is available');
      } else if (!activeQuestionId) {
        toast.error('Problem details unavailable for execution');
      }
      return;
    }

    if (!currentCode || !currentCode.trim()) {
      toast.error('Please enter your code solution before running tests.');
      return;
    }

    const controller = executionRequest.begin();
    if (!controller) return;
    setIsExecuting(true);
    setLastExecutionMode(customInputValue ? 'custom' : 'run');
    setExecutionError(null);
    setBottomTab('results');
    setMobileWorkspaceTab('editor');
    if (consoleHeight === 'collapsed') setConsoleHeight('normal');

    const payload = {
      questionId: activeQuestionId,
      languageId: selectedLanguage.referenceId || selectedLanguage.id,
      sourceCode: currentCode,
      ...(customInputValue ? { customInput: customInputValue } : {}),
    };

    try {
      const result: ExecutionResultData = await executionService.runCode(payload, controller.signal);
      if (controller.signal.aborted) return;
      if (isExecutionResultSuccessful(result)) {
        toast.success('Sample test cases passed!');
      } else {
        toast.error(`${result.failedTestCases} sample case(s) failed`);
      }
      setExecutionResult(result);
      setSelectedTestCaseIdx(0);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg = detail && detail !== err?.message ? `${err?.message || 'Failed to execute code'}: ${detail}` : (err?.message || 'Failed to execute code');
      setExecutionError(msg);
      toast.error(msg);
    } finally {
      if (executionRequest.finish(controller)) setIsExecuting(false);
    }
  }, [isExecutionReady, activeQuestionId, selectedLanguage, loadingProblem, currentCode, consoleHeight, executionRequest]);

  const handleRunCode = useCallback(() => {
    void executeRun();
  }, [executeRun]);

  const handleRunCustomInput = useCallback(() => {
    if (!customInput.trim()) {
      toast.error('Enter custom input before running the code.');
      return;
    }
    void executeRun(customInput);
  }, [customInput, executeRun]);

  // SUBMIT CODE (Evaluation across all test cases - TEST CASES ARE HIDDEN)
  const handleSubmitCode = useCallback(async () => {
    if (!isExecutionReady || !activeQuestionId || !selectedLanguage) {
      if (loadingProblem) {
        toast.error('Please wait for the problem to load');
      } else if (!selectedLanguage) {
        toast.error('No supported execution language is available');
      } else if (!activeQuestionId) {
        toast.error('Problem details unavailable for execution');
      }
      return;
    }

    if (!currentCode || !currentCode.trim()) {
      toast.error('Please enter your code solution before submitting.');
      return;
    }

    const controller = executionRequest.begin();
    if (!controller) return;
    setIsExecuting(true);
    setLastExecutionMode('submit');
    setExecutionError(null);
    setBottomTab('results');
    setMobileWorkspaceTab('editor');
    if (consoleHeight === 'collapsed') setConsoleHeight('normal');

    const payload = {
      questionId: activeQuestionId,
      languageId: selectedLanguage.referenceId || selectedLanguage.id,
      sourceCode: currentCode,
    };

    try {
      const result: ExecutionResultData = await executionService.submitCode(payload, controller.signal);
      if (controller.signal.aborted) return;
      const isAccepted = isExecutionResultSuccessful(result);

      if (isAccepted) {
        toast.success('Accepted! All test cases passed!');
        dispatch(markSolvedProblem({ id: String(activeQuestionId) }));
        dispatch(hydrateProgress({ force: true, userId: user?.id ?? null }));
      } else {
        toast.error(`Submission: ${result.failedTestCases || 1} test case(s) failed`);
      }
      setExecutionResult(result);

      // The submission endpoint owns history; refetch it instead of synthesizing a client record.
      setSubmissionsRetry((attempt) => attempt + 1);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const detail = Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg = detail && detail !== err?.message ? `${err?.message || 'Failed to submit code'}: ${detail}` : (err?.message || 'Failed to submit code');
      setExecutionError(msg);
      toast.error(msg);
    } finally {
      if (executionRequest.finish(controller)) setIsExecuting(false);
    }
  }, [isExecutionReady, activeQuestionId, selectedLanguage, loadingProblem, currentCode, consoleHeight, dispatch, executionRequest, user?.id]);

  // Keyboard Shortcuts (Ctrl+' or Cmd+' to Run, Ctrl+Enter or Cmd+Enter to Submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        handleRunCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunCode, handleSubmitCode]);

  useEffect(() => {
    if (!executionResult && !executionError) return;
    const frame = window.requestAnimationFrame(() => {
      resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [executionError, executionResult]);

  // Difficulty badge styling
  const difficultyName = problem?.difficultyRefName || problem?.difficulty || '—';
  const difficultyBadgeStyle =
    difficultyName.toLowerCase() === 'basic'
      ? 'text-teal-400 bg-teal-500/10 border-teal-500/30'
      : difficultyName.toLowerCase() === 'easy'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : difficultyName.toLowerCase() === 'medium'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  // Sample visible test cases from problem statement
  const sampleTestCases: QuestionTestCase[] = useMemo(() => {
    let cases = problem?.testCases;
    if (!cases || cases.length === 0) {
      cases = extractTestCasesFromProblem({
        id: problem?.id ? Number(problem.id) : (activeQuestionId ?? undefined),
        title: problem?.title,
        description: problem?.description,
        testCases: problem?.testCases,
        examples: problem?.examples,
      });
    }
    if (cases && cases.length > 0) {
      return cases.filter((tc) => !tc.isHidden);
    }
    if (problem?.examples && problem.examples.length > 0) {
      return problem.examples.map((ex, i) => ({
        id: i + 1,
        input: ex.input,
        expectedOutput: ex.output,
        explanation: ex.explanation,
        isHidden: false,
      }));
    }
    return [];
  }, [problem, activeQuestionId]);

  // Keep active test case index within valid bounds when test cases change
  useEffect(() => {
    if (selectedTestCaseIdx >= sampleTestCases.length && sampleTestCases.length > 0) {
      setSelectedTestCaseIdx(0);
    }
  }, [sampleTestCases.length, selectedTestCaseIdx]);

  if (!isProblemLoadedForRoute && (loadingProblem || !problemError)) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 font-sans">
        <Skeleton className="h-10 w-80 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[740px]">
          <Skeleton className="lg:col-span-5 h-full rounded-2xl" />
          <Skeleton className="lg:col-span-7 h-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated && (!problem || problemError)) {
    return (
      <div className="relative w-full flex-1 flex flex-col items-center bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-x-hidden min-h-screen pb-16">
        {/* Ambient glowing blobs matching Home page */}
        <div className="hidden dark:block fixed top-20 -left-48 w-96 h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="hidden dark:block fixed top-[45%] -right-48 w-[450px] h-[550px] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="hidden dark:block fixed bottom-20 -left-40 w-96 h-[500px] bg-purple-900/20 rounded-full blur-[130px] pointer-events-none -z-10" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center flex-1">
          <div className="w-full max-w-md p-8 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl shadow-xs">
              <i className="fa-solid fa-lock"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign In to Solve Problem</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sign in to your Connect 2 Code account to access problem specifications, compile and run code in the interactive editor, and submit solutions.
            </p>
            <button
              type="button"
              onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
              className="mt-2 w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Sign In
            </button>
            <Link
              to="/practice"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1"
            >
              ← Back to Practice Problems
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isProblemLoadedForRoute) {
    return (
      <div className="relative w-full flex-1 flex flex-col items-center bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-x-hidden min-h-screen pb-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center flex-1">
          <RequestStatus error={problemError} onRetry={() => dispatch(fetchProblemById(problemIdentifier!))} />
          <NotFound
            embedded
            title={problemError ? "Unable to load problem" : "Problem Not Found"}
            description={problemError || "The requested coding problem could not be found."}
          />
        </div>
      </div>
    );
  }

  const activeSampleCase = sampleTestCases[selectedTestCaseIdx];
  const activeRunCase = executionResult?.testCases?.[selectedTestCaseIdx];

  return (
    <div
      ref={bindWorkspace}
      className={`relative w-full flex-1 flex flex-col items-center bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 min-h-screen ${
        isFullscreen
          ? 'fixed inset-0 z-[999] w-screen h-screen overflow-y-auto bg-[#FBFBFD] dark:bg-[#070A13] p-3 sm:p-5'
          : 'overflow-x-hidden pb-16'
      }`}
      aria-label="Secure coding assessment workspace"
    >
      {/* Ambient glowing blobs matching Home page */}
      <div className="hidden dark:block fixed top-20 -left-48 w-96 h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="hidden dark:block fixed top-[45%] -right-48 w-[450px] h-[550px] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="hidden dark:block fixed bottom-20 -left-40 w-96 h-[500px] bg-purple-900/20 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Main Container constrained to Home page max-w-7xl width and padding */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex flex-col flex-1">
        {/* 1. TOP NAVBAR / WORKSPACE TOOLBAR (Matching Reference Image 5) */}
      <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 mb-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        
        {/* Left: Back button & Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <Link
            to="/practice"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2.5 sm:px-3.5 py-1.5 rounded-full transition-colors shadow-2xs whitespace-nowrap"
            title="Back to Problems"
          >
            <i className="fa-solid fa-arrow-left text-[11px]"></i>
            <span><span className="hidden sm:inline">Back to </span>Problems</span>
          </Link>

          <span className="text-slate-300 dark:text-slate-700 hidden md:inline">|</span>

          {/* Breadcrumb Hierarchy */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:flex min-w-0">
            {(problem?.topicRefName || problem?.topic) && (
              <>
                <span className="truncate">{problem.topicRefName || problem.topic}</span>
                <i className="fa-solid fa-chevron-right text-[9px] text-slate-400 shrink-0"></i>
              </>
            )}
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
              {problem?.title || ''}
            </span>
          </div>
        </div>

        {/* Right: Previous / Next Problem Quick Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
            title="Clipboard, context-menu, drag/drop, printing, source-view and developer-tool shortcuts are restricted in this workspace"
          >
            <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
            Integrity mode{violationCount > 0 ? ` · ${violationCount}` : ''}
          </span>
          <button
            type="button"
            onClick={() => {
              const currentNum = Number(problem?.id);
              if (currentNum > 1) {
                navigate(`/problems/${currentNum - 1}`);
              } else {
                navigate('/practice');
              }
            }}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <i className="fa-solid fa-chevron-left text-[10px]"></i>
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const currentNum = Number(problem?.id);
              if (currentNum) {
                navigate(`/problems/${currentNum + 1}`);
              } else {
                navigate('/practice');
              }
            }}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Next</span>
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher (< lg) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-4 w-full">
        <button
          type="button"
          onClick={() => setMobileWorkspaceTab('problem')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mobileWorkspaceTab === 'problem'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <i className="fa-solid fa-file-lines text-xs"></i>
          <span>Problem Details</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileWorkspaceTab('editor')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mobileWorkspaceTab === 'editor'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <i className="fa-solid fa-code text-xs"></i>
          <span>Code & Console</span>
        </button>
      </div>

      {/* 2. MAIN WORKSPACE (2-COLUMN SPLIT PANE) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start w-full">
        
        {/* ========================================================
            LEFT COLUMN: PROBLEM SPECIFICATION & DETAILS TABS (5 COLS)
           ======================================================== */}
        <div className={`${mobileWorkspaceTab === 'problem' ? 'flex' : 'hidden'} lg:flex lg:col-span-5 flex-col bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs h-[520px] sm:h-[650px] lg:h-[780px] overflow-hidden w-full`}>
          
          {/* Tab Bar: Description | Submissions | Companies | Hints */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-3 py-2 overflow-x-auto no-scrollbar gap-1.5 shrink-0">
            <button
              onClick={() => setLeftTab('description')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                leftTab === 'description'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-file-lines text-xs text-blue-600 dark:text-blue-400"></i>
              <span>Description</span>
            </button>

            <button
              onClick={() => setLeftTab('submissions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                leftTab === 'submissions'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-clock-rotate-left text-xs text-sky-500"></i>
              <span>Submissions</span>
              {submissionsHistory.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                  {submissionsHistory.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setLeftTab('companies')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                leftTab === 'companies'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-building text-xs text-indigo-500"></i>
              <span>Companies</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {problem?.companies?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setLeftTab('hints')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                leftTab === 'hints'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-key text-xs text-emerald-500"></i>
              <span>Hints</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {problem?.questionHints?.length || problem?.hints?.length || 0}
              </span>
            </button>
          </div>

          {/* Left Panel Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            
            {/* Header: Title, Badges & Bookmark */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {problem?.title || ''}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Difficulty Badge */}
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border shadow-2xs ${difficultyBadgeStyle}`}>
                    {difficultyName}
                  </span>

                  {/* Topic Badge */}
                  {(problem?.topicRefName || problem?.topic) && (
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {problem.topicRefName || problem.topic}
                    </span>
                  )}
                </div>
              </div>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={handleBookmarkToggle}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600'
                }`}
                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}
              >
                <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark text-sm`}></i>
              </button>
            </div>

            {/* 1. DESCRIPTION TAB */}
            {leftTab === 'description' && (
              <div className="space-y-6">
                {/* Problem Statement Body */}
                <div>
                  <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 font-mono">
                    Problem Description
                  </h3>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans text-sm shadow-2xs">
                    {problem?.description || 'No problem description is available from the backend.'}
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 font-mono">
                    Examples
                  </h3>
                  {sampleTestCases.length > 0 ? (
                    <div className="space-y-3">
                      {sampleTestCases.map((tc, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 font-mono text-xs shadow-2xs">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                            <span className="text-slate-900 dark:text-white font-bold">Example {idx + 1}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Input: </span>
                            <span className="text-slate-900 dark:text-white whitespace-pre-wrap">{tc.input}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Output: </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold whitespace-pre-wrap">{tc.expectedOutput}</span>
                          </div>
                          {tc.explanation && (
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-sans">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Explanation: </span>
                              {tc.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                      No visible examples were returned for this problem.
                    </p>
                  )}
                </div>

                {/* Constraints */}
                {problem?.constraints && (
                  <div>
                    <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 font-mono">
                      Constraints
                    </h3>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line shadow-2xs">
                      {problem.constraints}
                    </div>
                  </div>
                )}

                {/* Exam Platform & Companies Footer Cards */}
                {((problem?.questionPlatform || problem?.qpfRefName || problem?.examPlatform) || (problem?.companies && problem.companies.length > 0)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {/* Exam Platform Card */}
                    {(problem?.questionPlatform || problem?.qpfRefName || problem?.examPlatform) && (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <i className="fa-solid fa-graduation-cap text-blue-600 dark:text-blue-400"></i>
                          <span>Exam Platform</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Array.from(new Set([problem?.questionPlatform, problem?.qpfRefName, problem?.examPlatform].filter(Boolean))).map((plat) => (
                            <span key={String(plat)} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              {String(plat)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Companies Card */}
                    {problem?.companies && problem.companies.length > 0 && (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <i className="fa-solid fa-building text-purple-600 dark:text-purple-400"></i>
                          <span>Companies</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {problem.companies.slice(0, 5).map((comp, i) => (
                            <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              {String(comp)}
                            </span>
                          ))}
                          {problem.companies.length > 5 && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              +{problem.companies.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. SUBMISSIONS TAB */}
            {leftTab === 'submissions' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    Recent Submissions
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {loadingSubmissions ? 'Loading...' : `${submissionsHistory.length} Record(s)`}
                  </span>
                </div>

                <RequestStatus pending={loadingSubmissions} error={submissionsError} onRetry={() => setSubmissionsRetry((value) => value + 1)} label="Loading submissions…" />
                {loadingSubmissions && submissionsHistory.length === 0 ? <Skeleton className="h-20 w-full" count={3} /> : submissionsError && submissionsHistory.length === 0 ? null : submissionsHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-mono space-y-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <i className="fa-solid fa-clock-rotate-left text-2xl text-slate-400 block mb-1"></i>
                    <span>No submissions yet in this session.</span>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Write your solution in the editor and click "Submit" to test against the full test suite.
                    </p>
                  </div>
                ) : (
                  submissionsHistory.map((sub) => {
                    const isAccepted = sub.status === 'Accepted';
                    const isExpanded = expandedSubmissionId === sub.id;
                    return (
                      <div
                        key={sub.id}
                        className={`p-3.5 bg-slate-50 dark:bg-slate-900/60 border rounded-2xl flex flex-col font-mono text-xs transition-all shadow-2xs ${
                          isAccepted ? 'border-emerald-500/30' : 'border-rose-500/30'
                        }`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer select-none"
                          onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                isAccepted
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isAccepted ? '✓ Accepted' : '✗ Wrong Answer'}
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 font-sans text-xs">
                              {sub.passedTestCases}/{sub.totalTestCases} Tests
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
                            <span>{sub.language}</span>
                            {sub.runtimeMs !== undefined && sub.runtimeMs !== null && (
                              <span className="text-slate-900 dark:text-white font-bold">{sub.runtimeMs} ms</span>
                            )}
                            <span className="text-slate-400">{sub.timestamp}</span>
                            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-[10px] text-slate-400`} />
                          </div>
                        </div>

                        {isExpanded && sub.sourceCode && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Submitted Source Code ({sub.language}):</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedLanguage) {
                                    setCodeByLang((prev) => ({
                                      ...prev,
                                      [selectedLanguage.id]: sub.sourceCode || '',
                                    }));
                                    toast.success('Loaded submission code into editor');
                                  }
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-sans cursor-pointer flex items-center gap-1.5"
                              >
                                <i className="fa-solid fa-code text-[10px]"></i>
                                <span>Load into Editor</span>
                              </button>
                            </div>
                            <pre className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-mono overflow-x-auto max-h-60 whitespace-pre">
                              {sub.sourceCode}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 4. COMPANIES TAB */}
            {leftTab === 'companies' && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                  Top Companies Asking This Question
                </div>
                {problem?.companies && problem.companies.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {problem.companies.map((c, idx) => {
                      const name = String(c);
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5 font-mono text-xs text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px]">
                            <i className="fa-solid fa-building"></i>
                          </div>
                          <span className="font-semibold">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-mono p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                    No company associations were returned for this problem.
                  </p>
                )}
              </div>
            )}

            {/* 5. HINTS TAB */}
            {leftTab === 'hints' && (
              <div className="space-y-3 animate-fade-in">
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                  Progressive Solution Hints
                </div>
                {problem?.questionHints && problem.questionHints.length > 0 ? (
                  problem.questionHints.map((h, i) => (
                    <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 space-y-1">
                      <div className="text-amber-500 font-mono font-bold flex items-center gap-1.5">
                        <i className="fa-solid fa-key text-[10px]"></i>
                        <span>Hint {i + 1}</span>
                      </div>
                      <p className="font-sans leading-relaxed text-slate-700 dark:text-slate-300">{h.hintText || String(h)}</p>
                    </div>
                  ))
                ) : problem?.hints && problem.hints.length > 0 ? (
                  problem.hints.map((h, i) => (
                    <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 space-y-1">
                      <div className="text-amber-500 font-mono font-bold flex items-center gap-1.5">
                        <i className="fa-solid fa-key text-[10px]"></i>
                        <span>Hint {i + 1}</span>
                      </div>
                      <p className="font-sans leading-relaxed text-slate-700 dark:text-slate-300">{String(h)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 font-mono p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                    No hints currently recorded for this question. Analyze time/space complexity and edge cases.
                  </p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: MONACO CODE EDITOR & INTERACTIVE TESTBENCH (7 COLS)
           ======================================================== */}
        <div className={`${mobileWorkspaceTab === 'editor' ? 'flex' : 'hidden'} lg:flex lg:col-span-7 flex-col gap-4 min-w-0 w-full`}>
          
          {/* EDITOR CARD CONTAINER */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden flex flex-col w-full">
            
            {/* Editor Action Bar (Matching Reference Image 5) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              
              {/* Language Selector Pill */}
              <div className="flex items-center gap-2">
                <div className="relative inline-flex items-center">
                  <select
                    id="languageSelect"
                    value={selectedLanguage?.id ?? ''}
                    onChange={handleLanguageChange}
                    aria-busy={loadingLanguages}
                    disabled={loadingLanguages || isExecuting || languages.length === 0}
                    className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs rounded-full pl-8 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    {languages.length === 0 ? (
                      <option value="" disabled>
                        {loadingLanguages ? 'Loading languages…' : 'No languages available'}
                      </option>
                    ) : (
                      languages.map((l) => (
                        <option key={l.id} value={l.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                          {l.name}
                        </option>
                      ))
                    )}
                  </select>
                  <i className={`text-xs absolute left-3 pointer-events-none ${
                    monacoLang === 'python'
                      ? 'fa-brands fa-python text-blue-500'
                      : monacoLang === 'cpp'
                      ? 'fa-solid fa-c text-sky-600'
                      : monacoLang === 'javascript'
                      ? 'fa-brands fa-js text-amber-500'
                      : 'fa-brands fa-java text-orange-500'
                  }`}></i>
                  <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3 pointer-events-none"></i>
                </div>
              </div>

              {/* Editor Actions: Reset, Run, Submit, Fullscreen */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetCode}
                  disabled={isExecuting}
                  title="Reset to default starter template"
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <i className="fa-solid fa-rotate-left text-[11px]"></i>
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={!isExecutionReady || !currentCode.trim()}
                  title="Run code against sample test cases (Ctrl + ')"
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <i className="fa-solid fa-play text-[11px] text-slate-700 dark:text-slate-300"></i>
                  <span>Run</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitCode}
                  disabled={!isExecutionReady || !currentCode.trim()}
                  title="Submit code for full evaluation (Ctrl + Enter)"
                  className="px-5 py-1.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <i className="fa-solid fa-paper-plane text-[11px]"></i>
                  <span>Submit</span>
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
                  className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-xs`}></i>
                </button>
              </div>
            </div>

              <RequestStatus pending={isExecuting || loadingLanguages} error={languagesError} onRetry={() => dispatch(fetchLanguages())} label={isExecuting ? (lastExecutionMode === "submit" ? "Submitting code…" : "Running code…") : "Loading languages…"} />
            <RequestStatus pending={loadingProblem} error={problemError} onRetry={() => dispatch(fetchProblemById(problemIdentifier!))} label="Refreshing problem…" />
            {/* Monaco Editor Container */}
            <div className={`w-full bg-white dark:bg-[#0F172A] transition-all duration-300 ${consoleHeight === 'expanded' ? 'h-[240px]' : consoleHeight === 'collapsed' ? 'h-[620px]' : 'h-[380px]'}`}>

                    <Editor
                      loading={<div role="status" className="p-6 w-full"><Skeleton className="h-5 w-3/4" count={8} /><span className="sr-only">Loading code editor</span></div>}
                height="100%"
                language={monacoLang}
                value={currentCode}
                onChange={handleEditorChange}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13.5,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  padding: { top: 12, bottom: 12 },
                  fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  contextmenu: false,
                  copyWithSyntaxHighlighting: false,
                  dragAndDrop: false,
                  readOnly: isExecuting,
                  readOnlyMessage: { value: 'Code editing is paused while the current execution is in progress.' },
                  wordWrap: 'on',
                  accessibilitySupport: 'auto',
                }}
              />
            </div>
          </div>

          {/* ========================================================
              BOTTOM RESULTS & INTERACTIVE CONSOLE (Matching Reference Image 5)
             ======================================================== */}
          <div className={`bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col transition-all duration-300 overflow-hidden ${consoleHeight === 'collapsed' ? 'h-[48px]' : consoleHeight === 'expanded' ? 'h-[460px]' : 'h-[340px]'}`}>
            
            {/* Console Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-2.5 flex-wrap gap-2 shrink-0">
              
              {/* Console Tabs: Test Cases | Custom Input | Test Result */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setBottomTab('testcases');
                    if (consoleHeight === 'collapsed') setConsoleHeight('normal');
                  }}
                  className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 pb-0.5 ${
                    bottomTab === 'testcases'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <i className="fa-regular fa-square-check text-xs"></i>
                  <span>Test Cases</span>
                </button>

                <button
                  onClick={() => {
                    setBottomTab('custom');
                    if (consoleHeight === 'collapsed') setConsoleHeight('normal');
                  }}
                  className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 pb-0.5 ${
                    bottomTab === 'custom'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-sliders text-xs"></i>
                  <span>Custom Input</span>
                </button>
              </div>

              {/* Right: Test Result > Tab & Console Height Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setBottomTab('results');
                    if (consoleHeight === 'collapsed') setConsoleHeight('normal');
                  }}
                  className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    bottomTab === 'results'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-list-check text-xs text-emerald-500"></i>
                  <span>Test Result &gt;</span>
                  {executionResult && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isExecutionResultSuccessful(executionResult)
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {executionResult.passedTestCases}/{executionResult.totalTestCases}
                    </span>
                  )}
                </button>

                {isExecuting && (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-blue-600 dark:text-blue-400">
                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                    <span className="hidden sm:inline">Executing...</span>
                  </div>
                )}

                {/* Minimize / Normal / Maximize Height Toggle */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-slate-500 dark:text-slate-400 text-xs shadow-2xs">
                  <button
                    onClick={() => setConsoleHeight((prev) => (prev === 'collapsed' ? 'normal' : 'collapsed'))}
                    className="p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title={consoleHeight === 'collapsed' ? 'Expand Console' : 'Minimize Console'}
                  >
                    <i className={`fa-solid ${consoleHeight === 'collapsed' ? 'fa-chevron-up' : 'fa-minus'} text-[11px]`}></i>
                  </button>
                  <button
                    onClick={() => setConsoleHeight((prev) => (prev === 'expanded' ? 'normal' : 'expanded'))}
                    className="p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title={consoleHeight === 'expanded' ? 'Restore Size' : 'Maximize Console'}
                  >
                    <i className={`fa-solid ${consoleHeight === 'expanded' ? 'fa-compress' : 'fa-expand'} text-[11px]`}></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Console Body */}
            {consoleHeight !== 'collapsed' && (
              <div className="flex-1 overflow-y-auto p-4">
                
                {/* 1. TEST CASES TAB (Matching Reference Image 5) */}
                {bottomTab === 'testcases' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full items-start">
                    
                    {/* Left Side: Case Selectors & Inputs */}
                    <div className="md:col-span-7 space-y-3">
                      {/* Case Pills: Case 1, Case 2, Case 3, + */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {sampleTestCases.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedTestCaseIdx(i)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              selectedTestCaseIdx === i
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            Case {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setBottomTab('custom')}
                          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                          title="Add custom case"
                        >
                          +
                        </button>
                      </div>

                      {/* Active Case Inputs */}
                      {activeSampleCase ? (
                        <div className="space-y-3 font-mono text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block mb-1 text-[11px] font-sans font-semibold">Input</span>
                            <div className="relative p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 shadow-2xs">
                              <pre className="whitespace-pre-wrap">{activeSampleCase.input}</pre>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block mb-1 text-[11px] font-sans font-semibold">Expected Output</span>
                            <div className="relative p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold shadow-2xs">
                              <pre className="whitespace-pre-wrap">{activeSampleCase.expectedOutput}</pre>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                          No visible test cases were returned for this problem.
                        </p>
                      )}
                    </div>

                    {/* Right Side: Execution Illustration (Matching Reference Image 5) */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center p-6 text-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800/80 my-auto h-full">
                      <div className="w-44 h-32 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2.5 flex flex-col shadow-xs mb-4">
                        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                            <i className="fa-solid fa-play text-sm ml-0.5"></i>
                          </div>
                        </div>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Run your code to see the output
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                        Test your solution against the sample test cases or custom input.
                      </p>
                    </div>

                  </div>
                )}

                {/* 2. CUSTOM INPUT TAB */}
                {bottomTab === 'custom' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Custom Standard Input:</span>
                      <button
                        onClick={handleRunCustomInput}
                        disabled={!isExecutionReady || !currentCode.trim() || !customInput.trim()}
                        className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      >
                        Run with Custom Input
                      </button>
                    </div>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom input here..."
                      className="w-full h-36 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* 3. TEST RESULTS TAB */}
                {bottomTab === 'results' && (
                  <div ref={resultsPanelRef} className="space-y-4 animate-fade-in" aria-live="polite">
                    
                    {/* Error Box */}
                    {executionError && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-mono space-y-1">
                        <div className="font-bold flex items-center gap-2">
                          <i className="fa-solid fa-triangle-exclamation"></i>
                          <span>Execution Error</span>
                        </div>
                        <pre className="whitespace-pre-wrap text-[11px] text-rose-700 dark:text-rose-300">{executionError}</pre>
                      </div>
                    )}

                    {/* Empty State before running/submitting */}
                    {!executionResult && !executionError && !isExecuting && (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs font-mono gap-2">
                        <i className="fa-solid fa-terminal text-2xl text-slate-400 mb-1"></i>
                        <span>Click "Run" to test sample cases, or "Submit" for full evaluation.</span>
                      </div>
                    )}

                    {/* RUN RESULTS */}
                    {(lastExecutionMode === 'run' || lastExecutionMode === 'custom') && executionResult && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono">
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full ${
                                isExecutionResultSuccessful(executionResult)
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {lastExecutionMode === 'custom'
                                ? (isExecutionResultSuccessful(executionResult) ? '✓ Custom Run Completed' : '✗ Custom Run Failed')
                                : (isExecutionResultSuccessful(executionResult) ? '✓ Sample Cases Passed' : '✗ Sample Cases Failed')}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              Passed: <strong className="text-slate-900 dark:text-white">{executionResult.passedTestCases}/{executionResult.totalTestCases}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Test Case Pills */}
                        {executionResult.testCases && executionResult.testCases.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {executionResult.testCases.map((tc, idx) => {
                              const isPassed = String(tc.status).toLowerCase() === 'passed';
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedTestCaseIdx(idx)}
                                  className={`px-3.5 py-1 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    selectedTestCaseIdx === idx
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                                  <span>Case {idx + 1}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {activeRunCase && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-slate-500">Case {selectedTestCaseIdx + 1}</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  String(activeRunCase.status).toLowerCase() === 'passed'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {activeRunCase.status}
                              </span>
                            </div>

                            {activeRunCase.input && (
                              <div>
                                <span className="text-slate-500 block mb-1 text-[11px]">Input:</span>
                                <pre className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap">
                                  {activeRunCase.input}
                                </pre>
                              </div>
                            )}

                            {activeRunCase.expectedOutput && (
                              <div>
                                <span className="text-slate-500 block mb-1 text-[11px]">Expected Output:</span>
                                <pre className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap font-bold">
                                  {activeRunCase.expectedOutput}
                                </pre>
                              </div>
                            )}

                            {activeRunCase.actualOutput && (
                              <div>
                                <span className="text-slate-500 block mb-1 text-[11px]">Your Output:</span>
                                <pre
                                  className={`p-2.5 bg-white dark:bg-slate-950 border rounded-xl overflow-x-auto whitespace-pre-wrap ${
                                    String(activeRunCase.status).toLowerCase() === 'passed'
                                      ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                                      : 'border-rose-500/30 text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {activeRunCase.actualOutput}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBMIT VERDICT VIEW */}
                    {lastExecutionMode === 'submit' && executionResult && (
                      <div className="space-y-4 animate-fade-in">
                        {isExecutionResultSuccessful(executionResult) ? (
                          <div className="p-6 bg-gradient-to-br from-white dark:from-[#0F172A] to-emerald-50 dark:to-emerald-950/20 border border-emerald-500/30 rounded-3xl flex flex-col gap-5 shadow-xs">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl shadow-sm">
                                <i className="fa-solid fa-check"></i>
                              </div>
                              <div>
                                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                                  Accepted
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                                  All {executionResult.totalTestCases} test cases passed successfully!
                                </div>
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
                                <span className="text-slate-400 text-[10px] block">TEST CASES</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                  {executionResult.passedTestCases} / {executionResult.totalTestCases}
                                </span>
                                <span className="text-[10px] text-slate-400 block">100% Passed</span>
                              </div>

                              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
                                <span className="text-slate-400 text-[10px] block">RUNTIME</span>
                                <span className="text-slate-900 dark:text-white font-bold text-sm">
                                  {executionResult.runtimeMs ?? '—'}{executionResult.runtimeMs !== undefined && executionResult.runtimeMs !== null ? ' ms' : ''}
                                </span>
                                <span className="text-[10px] text-slate-400 block">Fast</span>
                              </div>

                              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
                                <span className="text-slate-400 text-[10px] block">MEMORY</span>
                                <span className="text-slate-900 dark:text-white font-bold text-sm">
                                  {executionResult.memoryMb ?? '—'}{executionResult.memoryMb !== undefined && executionResult.memoryMb !== null ? ' MB' : ''}
                                </span>
                                <span className="text-[10px] text-slate-400 block">Optimal</span>
                              </div>

                              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
                                <span className="text-slate-400 text-[10px] block">LANGUAGE</span>
                                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm truncate block">
                                  {selectedLanguage?.name || '—'}
                                </span>
                                <span className="text-[10px] text-slate-400 block">Verified</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 bg-gradient-to-br from-white dark:from-[#0F172A] to-rose-50 dark:to-rose-950/20 border border-rose-500/30 rounded-3xl flex flex-col gap-4 shadow-xs">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400 text-2xl shadow-sm">
                                <i className="fa-solid fa-xmark"></i>
                              </div>
                              <div>
                                <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
                                  Wrong Answer
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                                  Failed {executionResult.failedTestCases} out of {executionResult.totalTestCases} test cases
                                </div>
                              </div>
                            </div>

                            {/* Ratio Progress Bar */}
                            <div className="space-y-1.5 font-mono text-xs">
                              <div className="flex justify-between text-[11px] text-slate-500">
                                <span>Passed: <strong className="text-emerald-500">{executionResult.passedTestCases}</strong> / {executionResult.totalTestCases}</span>
                                <span>Failed: <strong className="text-rose-500">{executionResult.failedTestCases}</strong></span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
                                <div
                                  className="bg-emerald-500 h-full transition-all duration-300"
                                  style={{ width: `${(executionResult.passedTestCases / (executionResult.totalTestCases || 1)) * 100}%` }}
                                ></div>
                                <div
                                  className="bg-rose-500 h-full transition-all duration-300"
                                  style={{ width: `${(executionResult.failedTestCases / (executionResult.totalTestCases || 1)) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </main>
      </div>

      {/* Accessible Confirmation Dialog for Reset Code */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={executeResetCode}
        title="Reset Code Solution?"
        message="This will discard your current modifications and restore the default starter code template. This action cannot be undone."
        confirmText="Reset Code"
        variant="danger"
      />
    </div>
  );
};

export default ProblemDetails;
