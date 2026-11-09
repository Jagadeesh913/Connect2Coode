import { useExecutionRequest } from '../hooks/useExecutionRequest';
import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor, { type OnMount } from '@monaco-editor/react';
import '../../../core/editor/monacoEnvironment';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { isBookmarkItem, toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { fetchProblemById } from '../redux/problemSlice';
import { markSolvedProblem, hydrateProgress } from '../../progress/redux/progressSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { fetchLanguages } from '../../languages/redux/languageSlice';
import {
  executionService,
  getExecutionVerdict,
  isExecutionResultSuccessful,
  LanguageDropdownItem,
  ExecutionResultData,
} from '../../../services/executionService';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { NotFound } from '../../../shared/components/errors/NotFound';
import {
  resolveActiveQuestionId,
  canExecuteProblem,
  resolveExecutionLanguage,
  resolveExecutionLanguageName,
} from '../utils/problemExecution';
import { toast } from '@/shared/notifications/toast';
import { userQuestionService } from '../../../services/userQuestionService';
import { useTheme } from '../../../shared/context/ThemeContext';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { extractTestCasesFromProblem } from '../../admin/utils/testCaseUtils';
import { usePageMetadata } from '../../../core/metadata/usePageMetadata';
import {
  analyzeSourceCode,
  collectExecutionDiagnostics,
  type CodeDiagnostic,
} from '../utils/codeDiagnostics';
import { getInternalEditorClipboardAction } from '../utils/internalEditorClipboard';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';
import { getActionableErrorMessage } from '../../../core/validation/serverErrorMapper';
import { C2CSelect } from '../../../shared/components/ui/C2CSelect';
import './ProblemDetails.css';

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

const getDraftStorageKey = (problemIdentifier: string, languageId: number): string =>
  `problem-draft:${problemIdentifier}:language:${languageId}`;

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
  // AppRouterLayout owns the single assessment-integrity controller. This ref
  // is only the fullscreen target; installing another controller here would
  // register duplicate capture listeners around Monaco.
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [codeByLang, setCodeByLang] = useState<Record<number, string>>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'problem' | 'editor' | 'tests'>('editor');
  const [problemPanelWidth, setProblemPanelWidth] = useState(350);
  const [consolePanelHeight, setConsolePanelHeight] = useState(260);
  const [draggingSplitter, setDraggingSplitter] = useState<'problem' | 'console' | null>(null);
  const layoutRef = useRef<HTMLElement>(null);
  const editorWorkspaceRef = useRef<HTMLDivElement>(null);
  const splitterPointerRef = useRef<{ kind: 'problem' | 'console'; pointerId: number } | null>(null);

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
  const [leftTab, setLeftTab] = useState<'description' | 'testcases' | 'submissions' | 'companies' | 'hints'>('description');
  const [bottomTab, setBottomTab] = useState<'testcases' | 'custom' | 'results'>('testcases');
  const [customInput, setCustomInput] = useState<string>('');
  const resultsPanelRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const internalEditorClipboardRef = useRef('');
  const draftOwner = String(user?.id ?? user?.email ?? 'guest');

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

  const editorDiagnostics = useMemo(
    () => analyzeSourceCode(currentCode, monacoLang),
    [currentCode, monacoLang]
  );
  const executionDiagnostics = useMemo(
    () => collectExecutionDiagnostics(executionResult),
    [executionResult]
  );
  const diagnostics = useMemo(
    () => [...executionDiagnostics, ...editorDiagnostics],
    [editorDiagnostics, executionDiagnostics]
  );

  const syncEditorDiagnostics = useCallback((items: CodeDiagnostic[]) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!model || !monaco) return;
    monaco.editor.setModelMarkers(
      model,
      'connect2code',
      items.map((item) => ({
        severity:
          item.severity === 'error'
            ? monaco.MarkerSeverity.Error
            : item.severity === 'warning'
              ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Info,
        message: `${item.title}: ${item.message}`,
        source: item.source === 'editor' ? 'Connect2Code' : item.source,
        startLineNumber: item.line,
        startColumn: item.column,
        endLineNumber: item.line,
        endColumn: item.endColumn || item.column + 1,
      }))
    );
  }, []);

  useEffect(() => {
    syncEditorDiagnostics(diagnostics);
  }, [diagnostics, syncEditorDiagnostics]);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();
    syncEditorDiagnostics(diagnostics);
  }, [diagnostics, syncEditorDiagnostics]);

  const handleInternalEditorClipboard = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const action = getInternalEditorClipboardAction(event);
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();

    const editor = editorRef.current;
    const model = editor?.getModel();
    const selection = editor?.getSelection();
    if (!editor || !model || !selection) return;

    if (action === 'copy' || action === 'cut') {
      const selectedCode = model.getValueInRange(selection);
      if (!selectedCode) return;
      internalEditorClipboardRef.current = selectedCode;
      if (action === 'cut' && !isExecuting) {
        editor.pushUndoStop();
        editor.executeEdits('connect2code-internal-cut', [{ range: selection, text: '', forceMoveMarkers: true }]);
        editor.pushUndoStop();
      }
      return;
    }

    if (!internalEditorClipboardRef.current) {
      return;
    }
    if (isExecuting) return;
    editor.pushUndoStop();
    editor.executeEdits('connect2code-internal-paste', [{
      range: selection,
      text: internalEditorClipboardRef.current,
      forceMoveMarkers: true,
    }]);
    editor.pushUndoStop();
  }, [isExecuting]);

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

  useEffect(() => {
    setCodeByLang({});
    internalEditorClipboardRef.current = '';
  }, [draftOwner, problemIdentifier]);

  useEffect(() => {
    if (!selectedLanguage || !problemIdentifier) return;
    const savedDraft = userScopedStorage.getItem(
      getDraftStorageKey(problemIdentifier, selectedLanguage.id)
    );
    const starter = DEFAULT_STARTER_CODE[monacoLang] || DEFAULT_STARTER_CODE.java;
    setCodeByLang((previous) => previous[selectedLanguage.id] !== undefined
      ? previous
      : { ...previous, [selectedLanguage.id]: savedDraft ?? starter });
  }, [draftOwner, monacoLang, problemIdentifier, selectedLanguage]);

  useEffect(() => {
    if (!selectedLanguage || !problemIdentifier) return;
    const draft = codeByLang[selectedLanguage.id];
    if (draft === undefined) return;
    const timer = window.setTimeout(() => {
      userScopedStorage.setItem(getDraftStorageKey(problemIdentifier, selectedLanguage.id), draft);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [codeByLang, draftOwner, problemIdentifier, selectedLanguage]);

  usePageMetadata(
    isProblemLoadedForRoute && problem?.title
      ? {
          title: problem.title,
          description:
            problem.description ||
            `Solve ${problem.title} with the Connect2Code coding workspace and test cases.`,
          type: 'article',
        }
      : null
  );

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
  const handleLanguageChange = (value: string) => {
    const newLangId = Number(value);
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
    setExecutionResult(null);
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
      const firstVisibleFailureIndex = result.testCases.findIndex(
        (testCase) => !testCase.isHidden && String(testCase.status).toLowerCase() !== 'passed'
      );
      setSelectedTestCaseIdx(firstVisibleFailureIndex >= 0 ? firstVisibleFailureIndex : 0);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const msg = getActionableErrorMessage(err, 'We could not run your code. Please try again.');
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
    setExecutionResult(null);
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
      const firstVisibleFailureIndex = result.testCases.findIndex(
        (testCase) => !testCase.isHidden && String(testCase.status).toLowerCase() !== 'passed'
      );
      setSelectedTestCaseIdx(firstVisibleFailureIndex >= 0 ? firstVisibleFailureIndex : 0);

      // The submission endpoint owns history; refetch it instead of synthesizing a client record.
      setSubmissionsRetry((attempt) => attempt + 1);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const msg = getActionableErrorMessage(err, 'We could not submit your code. Please try again.');
      setExecutionError(msg);
      toast.error(msg);
    } finally {
      if (executionRequest.finish(controller)) setIsExecuting(false);
    }
  }, [isExecutionReady, activeQuestionId, selectedLanguage, loadingProblem, currentCode, consoleHeight, dispatch, executionRequest, user?.id]);

  const handleRetryExecution = useCallback(() => {
    if (lastExecutionMode === 'submit') {
      void handleSubmitCode();
      return;
    }
    void executeRun(lastExecutionMode === 'custom' ? customInput : undefined);
  }, [customInput, executeRun, handleSubmitCode, lastExecutionMode]);

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

  const clampProblemPanelWidth = useCallback((value: number) => {
    const availableWidth = layoutRef.current?.clientWidth ?? window.innerWidth;
    return Math.round(Math.min(Math.max(value, 270), Math.max(270, availableWidth - 308)));
  }, []);

  const clampConsolePanelHeight = useCallback((value: number) => {
    const availableHeight = editorWorkspaceRef.current?.clientHeight ?? window.innerHeight;
    const minimumEditorHeight = availableHeight < 480 ? 90 : 150;
    const maximumHeight = Math.max(120, Math.min(availableHeight * 0.68, availableHeight - minimumEditorHeight - 64));
    return Math.round(Math.min(Math.max(value, 120), maximumHeight));
  }, []);

  const handleSplitterPointerDown = useCallback(
    (kind: 'problem' | 'console', event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      splitterPointerRef.current = { kind, pointerId: event.pointerId };
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraggingSplitter(kind);
      if (kind === 'console') setConsoleHeight('normal');
    },
    []
  );

  const handleSplitterPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const action = splitterPointerRef.current;
      if (!action || action.pointerId !== event.pointerId) return;
      if (action.kind === 'problem') {
        const bounds = layoutRef.current?.getBoundingClientRect();
        if (bounds) setProblemPanelWidth(clampProblemPanelWidth(event.clientX - bounds.left - 4));
        return;
      }
      const bounds = editorWorkspaceRef.current?.getBoundingClientRect();
      if (bounds) setConsolePanelHeight(clampConsolePanelHeight(bounds.bottom - event.clientY - 4));
    },
    [clampConsolePanelHeight, clampProblemPanelWidth]
  );

  const finishSplitterDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const action = splitterPointerRef.current;
    if (!action || action.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    splitterPointerRef.current = null;
    setDraggingSplitter(null);
  }, []);

  const handleSplitterKeyDown = useCallback(
    (kind: 'problem' | 'console', event: React.KeyboardEvent<HTMLDivElement>) => {
      const amount = event.shiftKey ? 40 : 16;
      if (kind === 'problem' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        setProblemPanelWidth((value) =>
          clampProblemPanelWidth(value + (event.key === 'ArrowRight' ? amount : -amount))
        );
      }
      if (kind === 'console' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        setConsoleHeight('normal');
        setConsolePanelHeight((value) =>
          clampConsolePanelHeight(value + (event.key === 'ArrowUp' ? amount : -amount))
        );
      }
      if (event.key === 'Home') {
        event.preventDefault();
        if (kind === 'problem') setProblemPanelWidth(clampProblemPanelWidth(350));
        else {
          setConsoleHeight('normal');
          setConsolePanelHeight(clampConsolePanelHeight(260));
        }
      }
    },
    [clampConsolePanelHeight, clampProblemPanelWidth]
  );

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

  const activeRunCase = executionResult?.testCases?.[selectedTestCaseIdx];
  const executionVerdict = executionResult ? getExecutionVerdict(executionResult) : null;
  const executionVerdictLabel = executionVerdict === 'compilation-error'
    ? 'Compilation error'
    : executionVerdict === 'runtime-error'
      ? 'Runtime error'
      : executionVerdict === 'accepted'
        ? 'Accepted'
        : 'Wrong answer';

  return (
    <div
      ref={workspaceRef}
      className={`c2c-problem-page relative w-full flex-1 flex flex-col bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-[999] w-screen !h-screen bg-[#FBFBFD] dark:bg-[#070A13]'
          : ''
      }`}
      aria-label="Secure coding assessment workspace"
      aria-description="Clipboard, context-menu, drag/drop, printing, source-view, and screen-capture shortcuts are restricted; Developer Tools remain available."
    >
      <div className="c2c-problem-shell flex-1">
      <div className="lg:hidden flex items-stretch bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 w-full" role="tablist" aria-label="Workspace views">
        <button
          type="button"
          onClick={() => setMobileWorkspaceTab('problem')}
          role="tab"
          aria-selected={mobileWorkspaceTab === 'problem'}
          className={`flex-1 border-b-2 py-2 px-2 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            mobileWorkspaceTab === 'problem'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        >
          <i className="fa-solid fa-file-lines text-xs"></i>
          <span>Description</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileWorkspaceTab('editor')}
          role="tab"
          aria-selected={mobileWorkspaceTab === 'editor'}
          className={`flex-1 border-b-2 py-2 px-2 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            mobileWorkspaceTab === 'editor'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        >
          <i className="fa-solid fa-code text-xs"></i>
          <span>Editor</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileWorkspaceTab === 'tests'}
          onClick={() => {
            setLeftTab('testcases');
            setMobileWorkspaceTab('tests');
          }}
          className={`flex-1 border-b-2 py-2 px-2 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            mobileWorkspaceTab === 'tests'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        >
          <i className="fa-regular fa-square-check text-xs"></i>
          <span>Test cases</span>
        </button>
      </div>

      <main
        ref={layoutRef}
        className="c2c-problem-layout"
        data-mobile-view={mobileWorkspaceTab}
        data-left-tab={leftTab}
        data-bottom-tab={bottomTab}
        style={{ '--problem-panel-width': `${problemPanelWidth}px` } as React.CSSProperties}
      >
        
        {/* ========================================================
            LEFT COLUMN: PROBLEM SPECIFICATION & DETAILS TABS (5 COLS)
           ======================================================== */}
        <aside className="c2c-problem-panel flex flex-col bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 overflow-hidden w-full h-full" aria-label="Problem details">
          
          {/* Tab Bar: Description | Submissions | Companies | Hints */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-2.5 py-2 overflow-x-auto no-scrollbar gap-1.5 shrink-0">
            <Link
              to="/practice"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
              aria-label="Back to all problems"
              title="Back to all problems"
            >
              <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true"></i>
            </Link>
            <button
              onClick={() => {
                setLeftTab('description');
                setMobileWorkspaceTab('problem');
              }}
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
              type="button"
              onClick={() => {
                setLeftTab('testcases');
                setMobileWorkspaceTab('tests');
              }}
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors ${
                leftTab === 'testcases'
                  ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
              aria-label="Test cases"
              title="Test cases"
              aria-pressed={leftTab === 'testcases'}
            >
              <i className="fa-regular fa-square-check text-xs" aria-hidden="true"></i>
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
          <div className="c2c-problem-scroll flex-1 overflow-y-auto p-5 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            
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

            {leftTab === 'testcases' && (
              <section className="space-y-3" aria-label="Public test cases">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Test cases</h3>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      {sampleTestCases.length} public sample{sampleTestCases.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBottomTab(executionResult || executionError ? 'results' : 'custom');
                      setMobileWorkspaceTab('editor');
                    }}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
                  >
                    {executionResult || executionError ? 'View results' : 'Custom input'}
                  </button>
                </div>
                {sampleTestCases.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    {sampleTestCases.map((testCase, index) => {
                      const isOpen = selectedTestCaseIdx === index;
                      return (
                        <div key={testCase.id ?? testCase.testCaseId ?? index} className="border-b border-slate-200 last:border-b-0 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setSelectedTestCaseIdx(isOpen ? -1 : index)}
                            className={`flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-xs font-bold transition-colors ${
                              isOpen
                                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-900'
                            }`}
                            aria-expanded={isOpen}
                            aria-controls={`problem-test-case-${index}`}
                          >
                            <span>Case {index + 1}</span>
                            <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} text-[10px] text-slate-400`} aria-hidden="true"></i>
                          </button>
                          {isOpen && (
                            <div id={`problem-test-case-${index}`} className="space-y-4 border-t border-slate-200 bg-slate-50/70 px-4 py-4 font-mono text-xs dark:border-slate-800 dark:bg-slate-900/50">
                              <div>
                                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Input</div>
                                <pre className="whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">{testCase.input || 'No input'}</pre>
                              </div>
                              <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Expected output</div>
                                <pre className="whitespace-pre-wrap break-words font-semibold text-emerald-600 dark:text-emerald-400">{testCase.expectedOutput}</pre>
                              </div>
                              {testCase.explanation && (
                                <div className="border-t border-slate-200 pt-3 font-sans text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
                                  {testCase.explanation}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                    No public test cases were returned. Hidden cases remain available only to the submission evaluator.
                  </p>
                )}
              </section>
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
                                  const submissionLanguage = resolveExecutionLanguage(languages, sub.languageId);
                                  if (!submissionLanguage) {
                                    toast.error('The language used by this submission is no longer available.');
                                    return;
                                  }
                                  setSelectedLanguage(submissionLanguage);
                                  setCodeByLang((prev) => ({
                                    ...prev,
                                    [submissionLanguage.id]: sub.sourceCode || '',
                                  }));
                                  setMobileWorkspaceTab('editor');
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
          <nav className="flex h-12 shrink-0 items-center justify-between border-t border-slate-200 px-4 text-xs font-bold dark:border-slate-800" aria-label="Problem navigation">
            <button
              type="button"
              onClick={() => {
                const currentNum = Number(problem?.id);
                navigate(currentNum > 1 ? `/problems/${currentNum - 1}` : '/practice');
              }}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              <i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Previous
            </button>
            <button
              type="button"
              onClick={() => {
                const currentNum = Number(problem?.id);
                navigate(currentNum ? `/problems/${currentNum + 1}` : '/practice');
              }}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              Next <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>
          </nav>
        </aside>

        <div
          className="c2c-splitter c2c-splitter-vertical"
          role="separator"
          aria-label="Resize problem and editor panels"
          aria-orientation="vertical"
          aria-valuemin={270}
          aria-valuemax={Math.max(270, (layoutRef.current?.clientWidth ?? 658) - 308)}
          aria-valuenow={problemPanelWidth}
          tabIndex={0}
          data-dragging={draggingSplitter === 'problem'}
          onPointerDown={(event) => handleSplitterPointerDown('problem', event)}
          onPointerMove={handleSplitterPointerMove}
          onPointerUp={finishSplitterDrag}
          onPointerCancel={finishSplitterDrag}
          onLostPointerCapture={finishSplitterDrag}
          onDoubleClick={() => setProblemPanelWidth(clampProblemPanelWidth(350))}
          onKeyDown={(event) => handleSplitterKeyDown('problem', event)}
          title="Drag to resize problem and editor panels; double-click to reset"
        >
          <span className="c2c-splitter-grip-vertical" aria-hidden="true"></span>
        </div>

        {/* ========================================================
            RIGHT COLUMN: MONACO CODE EDITOR & INTERACTIVE TESTBENCH (7 COLS)
           ======================================================== */}
        <div
          ref={editorWorkspaceRef}
          className="c2c-editor-workspace"
          style={{ '--console-panel-height': `${consolePanelHeight}px` } as React.CSSProperties}
        >
          
          {/* EDITOR CARD CONTAINER */}
          <div className="c2c-editor-card bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 w-full">
            
            {/* Editor Action Bar (Matching Reference Image 5) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              
              {/* Language Selector Pill */}
              <div className="flex items-center gap-2">
                <div className="relative inline-flex items-center min-w-36">
                  {loadingLanguages && languages.length === 0 ? (
                    <Skeleton className="h-8 w-36 rounded-full" />
                  ) : <C2CSelect
                    id="languageSelect"
                    value={selectedLanguage?.id ?? ''}
                    onChange={handleLanguageChange}
                    busy={loadingLanguages}
                    disabled={isExecuting || languages.length === 0}
                    placeholder={loadingLanguages ? 'Loading languages…' : 'No languages available'}
                    ariaLabel="Programming language"
                    options={languages.map((language) => {
                      const norm = language.name?.toLowerCase() || '';
                      return {
                        value: language.id,
                        label: language.name,
                        icon: (
                          <i
                            className={`text-xs ${
                              norm.includes('python')
                                ? 'fa-brands fa-python text-blue-500'
                                : norm.includes('c++') || norm.includes('cpp')
                                ? 'fa-solid fa-c text-sky-600'
                                : norm.includes('javascript') || norm.includes('js')
                                ? 'fa-brands fa-js text-amber-500'
                                : 'fa-brands fa-java text-orange-500'
                            }`}
                          />
                        ),
                      };
                    })}
                    buttonClassName="pl-8 pr-3"
                    leading={selectedLanguage ? <i className={`text-xs ${
                    monacoLang === 'python'
                      ? 'fa-brands fa-python text-blue-500'
                      : monacoLang === 'cpp'
                      ? 'fa-solid fa-c text-sky-600'
                      : monacoLang === 'javascript'
                      ? 'fa-brands fa-js text-amber-500'
                      : 'fa-brands fa-java text-orange-500'
                  }`} /> : undefined}
                  />}
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

            {languagesError && languages.length === 0 && (
              <div className="px-4 py-3 border-b border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30">
                <RequestStatus error={languagesError} onRetry={() => dispatch(fetchLanguages())} />
              </div>
            )}
            {/* Monaco Editor Container */}
            <div
              data-assessment-clipboard="internal"
              onKeyDownCapture={handleInternalEditorClipboard}
              onCopyCapture={(event) => event.preventDefault()}
              onCutCapture={(event) => event.preventDefault()}
              onPasteCapture={(event) => event.preventDefault()}
              className="w-full min-h-0 flex-1 bg-white dark:bg-[#0F172A]"
            >
              {loadingLanguages && languages.length === 0 ? (
                <div role="status" aria-label="Loading code editor" className="h-full p-5 space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" count={8} />
                </div>
              ) : (
                <Editor
                      loading={<div role="status" className="p-6 w-full"><Skeleton className="h-5 w-3/4" count={8} /><span className="sr-only">Loading code editor</span></div>}
                height="100%"
                language={monacoLang}
                value={currentCode}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
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
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true, indentation: true },
                  matchBrackets: 'always',
                  quickSuggestions: { comments: false, strings: false, other: true },
                  suggestOnTriggerCharacters: true,
                  parameterHints: { enabled: true },
                  formatOnPaste: true,
                  formatOnType: true,
                  stickyScroll: { enabled: true },
                  renderWhitespace: 'selection',
                }}
              />
              )}
            </div>
          </div>

          <div
            className="c2c-splitter c2c-splitter-horizontal"
            role="separator"
            aria-label="Resize editor and console panels"
            aria-orientation="horizontal"
            aria-valuemin={120}
            aria-valuemax={Math.max(120, Math.round((editorWorkspaceRef.current?.clientHeight ?? 500) * 0.68))}
            aria-valuenow={consolePanelHeight}
            tabIndex={0}
            data-dragging={draggingSplitter === 'console'}
            onPointerDown={(event) => handleSplitterPointerDown('console', event)}
            onPointerMove={handleSplitterPointerMove}
            onPointerUp={finishSplitterDrag}
            onPointerCancel={finishSplitterDrag}
            onLostPointerCapture={finishSplitterDrag}
            onDoubleClick={() => {
              setConsoleHeight('normal');
              setConsolePanelHeight(clampConsolePanelHeight(260));
            }}
            onKeyDown={(event) => handleSplitterKeyDown('console', event)}
            title="Drag to resize editor and console panels; double-click to reset"
          >
            <span className="c2c-splitter-grip-horizontal" aria-hidden="true"></span>
          </div>

          {/* ========================================================
              BOTTOM RESULTS & INTERACTIVE CONSOLE (Matching Reference Image 5)
             ======================================================== */}
          <section
            className="c2c-console-dock bg-white dark:bg-[#0F172A]"
            data-size={consoleHeight}
            aria-label="Test cases and execution results"
          >
            
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
                  <span>Results</span>
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
                  {!executionResult && diagnostics.length > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                      {diagnostics.length}
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
              <div className="c2c-console-scroll flex-1 overflow-y-auto p-4">
                
                {/* 1. TEST CASES TAB (Matching Reference Image 5) */}
                {bottomTab === 'testcases' && (
                  <div className="space-y-4 h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Sample test cases</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Review the public examples before running your solution.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBottomTab('custom')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
                      >
                        <i className="fa-solid fa-plus text-[10px]" aria-hidden="true"></i>
                        Custom input
                      </button>
                    </div>

                    {sampleTestCases.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                        {sampleTestCases.map((testCase, index) => {
                          const isOpen = selectedTestCaseIdx === index;
                          return (
                            <div key={testCase.id ?? testCase.testCaseId ?? index} className="border-b border-slate-200 last:border-b-0 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => setSelectedTestCaseIdx(isOpen ? -1 : index)}
                                className={`flex min-h-11 w-full items-center justify-between px-4 text-left text-xs font-bold ${
                                  isOpen
                                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                                    : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-[#0F172A] dark:text-slate-300 dark:hover:bg-slate-900'
                                }`}
                                aria-expanded={isOpen}
                                aria-controls={`dock-test-case-${index}`}
                              >
                                <span>Case {index + 1}</span>
                              </button>
                              {isOpen && (
                                <div id={`dock-test-case-${index}`} className="grid gap-3 border-t border-slate-200 bg-slate-50/70 p-4 font-mono text-xs dark:border-slate-800 dark:bg-slate-900/50 xl:grid-cols-2">
                                  <div className="min-w-0">
                                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Input</div>
                                    <pre className="whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">{testCase.input || 'No input'}</pre>
                                  </div>
                                  <div className="min-w-0 border-t border-slate-200 pt-3 dark:border-slate-800 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
                                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Expected output</div>
                                    <pre className="whitespace-pre-wrap break-words font-semibold text-emerald-600 dark:text-emerald-400">{testCase.expectedOutput}</pre>
                                  </div>
                                  {testCase.explanation && (
                                    <p className="border-t border-slate-200 pt-3 font-sans text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300 xl:col-span-2">
                                      {testCase.explanation}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center dark:border-slate-700 dark:bg-slate-900/40">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <i className="fa-solid fa-flask" aria-hidden="true"></i>
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No public test cases</p>
                        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">Use custom input to check your solution. Hidden cases are evaluated only when you submit.</p>
                      </div>
                    )}
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

                    {isExecuting && (
                      <div role="status" aria-label={lastExecutionMode === 'submit' ? 'Submitting solution' : 'Running code'} className="space-y-3 loading-status">
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white"><i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i></div>
                            <div>
                              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{lastExecutionMode === 'submit' ? 'Evaluating your solution' : 'Running your code'}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">The previous result has been cleared. Waiting for a valid response…</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Skeleton className="h-20 w-full rounded-2xl" count={3} />
                        </div>
                        <Skeleton className="h-24 w-full rounded-2xl" />
                      </div>
                    )}

                    {/* Error Box */}
                    {executionError && !isExecuting && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 dark:bg-rose-950/25 dark:border-rose-900/60 dark:text-rose-300 text-xs space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-bold flex items-center gap-2">
                            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                            <span>Execution request failed</span>
                          </div>
                          <button type="button" onClick={handleRetryExecution} className="shrink-0 rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950">
                            Retry
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-[11px]">{executionError}</pre>
                      </div>
                    )}

                    {diagnostics.length > 0 && !isExecuting && (
                      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40" aria-label="Code diagnostics">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
                          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
                            <i className="fa-solid fa-stethoscope text-amber-500" aria-hidden="true"></i>
                            Diagnostics
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{diagnostics.length} issue{diagnostics.length === 1 ? '' : 's'}</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {diagnostics.map((diagnostic) => (
                            <button
                              type="button"
                              key={diagnostic.id}
                              onClick={() => {
                                editorRef.current?.revealLineInCenter(diagnostic.line);
                                editorRef.current?.setPosition({ lineNumber: diagnostic.line, column: diagnostic.column });
                                editorRef.current?.focus();
                              }}
                              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                            >
                              <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${diagnostic.severity === 'error' ? 'bg-rose-500' : diagnostic.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-bold text-slate-900 dark:text-white">{diagnostic.title}</span>
                                <span className="mt-0.5 block whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">{diagnostic.message}</span>
                              </span>
                              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">Ln {diagnostic.line}</span>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Empty State before running/submitting */}
                    {!executionResult && !executionError && !isExecuting && diagnostics.length === 0 && (
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
                                  <span>{tc.isHidden ? 'Private case' : `Sample ${idx + 1}`}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {activeRunCase && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-slate-500">{activeRunCase.isHidden ? 'Private evaluation' : `Sample case ${selectedTestCaseIdx + 1}`}</span>
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

                            {activeRunCase.isHidden ? (
                              <p className="rounded-xl border border-slate-200 bg-white p-3 font-sans text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                                This private evaluation contributes to your verdict. Its input, output, and diagnostics are not displayed.
                              </p>
                            ) : <>
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

                            {activeRunCase.actualOutput !== undefined && (
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

                            {activeRunCase.errorMessage && (
                              <div>
                                <span className="text-rose-600 dark:text-rose-400 block mb-1 text-[11px] font-bold">Compiler / runtime diagnostic</span>
                                <pre className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                  {activeRunCase.errorMessage}
                                </pre>
                              </div>
                            )}
                            </>}
                            {(activeRunCase.executionTime !== undefined || activeRunCase.memoryUsage !== undefined) && (
                              <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-[11px] dark:border-slate-800">
                                <span className="text-slate-500">Time <strong className="ml-1 text-slate-800 dark:text-slate-200">{activeRunCase.executionTime ?? 'Not reported'}</strong></span>
                                <span className="text-slate-500">Memory <strong className="ml-1 text-slate-800 dark:text-slate-200">{activeRunCase.memoryUsage ?? 'Not reported'}</strong></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBMIT VERDICT VIEW */}
                    {lastExecutionMode === 'submit' && executionResult && (
                      <section className={`animate-fade-in overflow-hidden rounded-2xl border bg-white shadow-xs dark:bg-[#0F172A] ${isExecutionResultSuccessful(executionResult) ? 'border-emerald-200 dark:border-emerald-900/70' : 'border-rose-200 dark:border-rose-900/70'}`}>
                        <div className={`flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${isExecutionResultSuccessful(executionResult) ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20' : 'border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base text-white shadow-sm ${isExecutionResultSuccessful(executionResult) ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                              <i className={`fa-solid ${isExecutionResultSuccessful(executionResult) ? 'fa-check' : 'fa-xmark'}`} aria-hidden="true"></i>
                            </div>
                            <div>
                              <h3 className={`text-lg font-extrabold tracking-tight ${isExecutionResultSuccessful(executionResult) ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                                {executionVerdictLabel}
                              </h3>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                {isExecutionResultSuccessful(executionResult)
                                  ? 'Your solution passed every evaluation case.'
                                  : 'Your solution did not pass the complete evaluation.'}
                              </p>
                            </div>
                          </div>
                          <span className={`w-fit rounded-full border px-3 py-1 font-mono text-[11px] font-bold ${isExecutionResultSuccessful(executionResult) ? 'border-emerald-200 bg-white text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-rose-200 bg-white text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                            {executionResult.passedTestCases}/{executionResult.totalTestCases} tests passed
                          </span>
                        </div>

                        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                              <span>Evaluation progress</span>
                              <span>{Math.round((executionResult.passedTestCases / (executionResult.totalTestCases || 1)) * 100)}%</span>
                            </div>
                            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                              <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(executionResult.passedTestCases / (executionResult.totalTestCases || 1)) * 100}%` }}></div>
                              <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${(executionResult.failedTestCases / (executionResult.totalTestCases || 1)) * 100}%` }}></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Passed</span>
                                <span className="mt-0.5 block text-base font-extrabold text-emerald-600 dark:text-emerald-400">{executionResult.passedTestCases}</span>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Failed</span>
                                <span className={`mt-0.5 block text-base font-extrabold ${executionResult.failedTestCases > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{executionResult.failedTestCases}</span>
                              </div>
                            </div>
                            <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                              {isExecutionResultSuccessful(executionResult)
                                ? 'Submission recorded. Your draft remains saved automatically on this device.'
                                : 'Review the diagnostics and sample output, update your solution, then submit again.'}
                            </p>
                          </div>

                          <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-1">
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-800">
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Runtime</dt>
                              <dd className="font-mono font-bold text-slate-900 dark:text-white">{executionResult.executionTime !== undefined && executionResult.executionTime !== null ? `${executionResult.executionTime}${executionResult.executionTimeUnit ? ` ${executionResult.executionTimeUnit}` : ''}` : 'Not reported'}</dd>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-800">
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Memory</dt>
                              <dd className="font-mono font-bold text-slate-900 dark:text-white">{executionResult.memoryUsage !== undefined && executionResult.memoryUsage !== null ? `${executionResult.memoryUsage}${executionResult.memoryUnit ? ` ${executionResult.memoryUnit}` : ''}` : 'Not reported'}</dd>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-800">
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Language</dt>
                              <dd className="max-w-32 truncate font-bold text-blue-600 dark:text-blue-400">{selectedLanguage?.name || 'Unknown'}</dd>
                            </div>
                          </dl>
                        </div>

                        {executionResult.testCases.length > 0 && (
                          <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              Evaluation details
                            </h4>
                            <div className="mt-3 space-y-2">
                              {executionResult.testCases.map((testCase, index) => {
                                const didPass = String(testCase.status).toLowerCase() === 'passed';
                                const hasMetrics = testCase.executionTime !== undefined || testCase.memoryUsage !== undefined;
                                return (
                                  <article
                                    key={testCase.testCaseId}
                                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                        {testCase.isHidden ? 'Private evaluation' : `Sample case ${index + 1}`}
                                      </span>
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${didPass ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>
                                        {testCase.status}
                                      </span>
                                    </div>
                                    {hasMetrics && (
                                      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                        {testCase.executionTime !== undefined && <>Time: <strong className="font-mono text-slate-700 dark:text-slate-200">{testCase.executionTime}</strong></>}
                                        {testCase.executionTime !== undefined && testCase.memoryUsage !== undefined && <span aria-hidden="true"> · </span>}
                                        {testCase.memoryUsage !== undefined && <>Memory: <strong className="font-mono text-slate-700 dark:text-slate-200">{testCase.memoryUsage}</strong></>}
                                      </p>
                                    )}
                                    {testCase.isHidden ? (
                                      <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                        Private case details are intentionally unavailable.
                                      </p>
                                    ) : testCase.errorMessage ? (
                                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] leading-relaxed text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                                        {testCase.errorMessage}
                                      </pre>
                                    ) : null}
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </section>
                    )}

                  </div>
                )}

              </div>
            )}

          </section>

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
