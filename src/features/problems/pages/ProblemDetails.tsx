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
import {
  Lock,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Building2,
  CheckSquare,
  Code2,
  FileText,
  GripHorizontal,
  GripVertical,
  History,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Play,
  RotateCcw,
  Send,
} from 'lucide-react';
import { C2CSelect } from '../../../shared/components/ui/C2CSelect';

interface QuestionTestCase {
  id?: number;
  testCaseId?: number;
  name?: string;
  testCaseName?: string;
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
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [codeByLang, setCodeByLang] = useState<Record<number, string>>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'problem' | 'editor' | 'tests'>('editor');
  const [problemPanelWidth, setProblemPanelWidth] = useState(360);
  const [consolePanelHeight, setConsolePanelHeight] = useState(240);
  const [draggingSplitter, setDraggingSplitter] = useState<'problem' | 'console' | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
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
      setIsFullscreen((prev) => !prev);
    }
  }, [workspaceRef]);

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
  const [lastExecutionMode, setLastExecutionMode] = useState<'run' | 'submit' | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResultData | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState<number>(0);
  const [expandedSampleIdx, setExpandedSampleIdx] = useState<number>(0);
  const [expandedResultIdx, setExpandedResultIdx] = useState<number>(-1);

  // Console layout state: 'normal' | 'collapsed' | 'expanded'
  const [consoleHeight, setConsoleHeight] = useState<'normal' | 'collapsed' | 'expanded'>('normal');

  // Active Tabs: Description, Testcases, Submissions, Companies, Hints
  const [leftTab, setLeftTab] = useState<'description' | 'testcases' | 'submissions' | 'companies' | 'hints'>('description');
  const [bottomTab, setBottomTab] = useState<'testcases' | 'results'>('testcases');
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

  // RUN CODE (Evaluates visible sample cases)
  const executeRun = useCallback(async () => {
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
    setLastExecutionMode('run');
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
      const targetIdx = firstVisibleFailureIndex >= 0 ? firstVisibleFailureIndex : 0;
      setSelectedTestCaseIdx(targetIdx);
      setExpandedResultIdx(targetIdx);
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

  // SUBMIT CODE (Full evaluation across hidden test suite)
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
      const targetIdx = firstVisibleFailureIndex >= 0 ? firstVisibleFailureIndex : 0;
      setSelectedTestCaseIdx(targetIdx);
      setExpandedResultIdx(targetIdx);

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
    } else {
      void executeRun();
    }
  }, [executeRun, handleSubmitCode, lastExecutionMode]);

  // Keyboard Shortcuts: Ctrl+' to Run, Ctrl+Enter to Submit
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
  const difficultyName = problem?.difficultyRefName || problem?.difficulty || 'Medium';
  const difficultyDotColor =
    difficultyName.toLowerCase() === 'basic' || difficultyName.toLowerCase() === 'easy'
      ? 'bg-emerald-400'
      : difficultyName.toLowerCase() === 'medium'
      ? 'bg-amber-400'
      : 'bg-rose-400';

  const difficultyTextColor =
    difficultyName.toLowerCase() === 'basic' || difficultyName.toLowerCase() === 'easy'
      ? 'text-emerald-500 dark:text-emerald-400'
      : difficultyName.toLowerCase() === 'medium'
      ? 'text-amber-500 dark:text-amber-400'
      : 'text-rose-500 dark:text-rose-400';

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

  useEffect(() => {
    if (selectedTestCaseIdx >= sampleTestCases.length && sampleTestCases.length > 0) {
      setSelectedTestCaseIdx(0);
    }
  }, [sampleTestCases.length, selectedTestCaseIdx]);

  const clampProblemPanelWidth = useCallback((value: number) => {
    const availableWidth = layoutRef.current?.clientWidth ?? window.innerWidth;
    return Math.round(Math.min(Math.max(value, 280), Math.max(280, availableWidth - 320)));
  }, []);

  const clampConsolePanelHeight = useCallback((value: number) => {
    const availableHeight = editorWorkspaceRef.current?.clientHeight ?? window.innerHeight;
    const minimumEditorHeight = availableHeight < 480 ? 90 : 150;
    const maximumHeight = Math.max(120, Math.min(availableHeight * 0.68, availableHeight - minimumEditorHeight - 48));
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
        if (kind === 'problem') setProblemPanelWidth(clampProblemPanelWidth(360));
        else {
          setConsoleHeight('normal');
          setConsolePanelHeight(clampConsolePanelHeight(240));
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
        <div className="hidden dark:block fixed top-20 -left-48 w-96 h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="hidden dark:block fixed top-[45%] -right-48 w-[450px] h-[550px] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="hidden dark:block fixed bottom-20 -left-40 w-96 h-[500px] bg-purple-900/20 rounded-full blur-[130px] pointer-events-none -z-10" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center flex-1">
          <div className="w-full max-w-md p-8 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl shadow-xs">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign In to Solve Problem</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sign in to your Connect2Code account to access problem specifications, test cases, and the coding workspace.
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

  const executionVerdict = executionResult ? getExecutionVerdict(executionResult) : null;
  const executionVerdictLabel = executionVerdict === 'compilation-error'
    ? 'Compilation Error'
    : executionVerdict === 'runtime-error'
      ? 'Runtime Error'
      : executionVerdict === 'accepted'
        ? 'Accepted'
        : 'Wrong Answer';

  return (
    <div className="w-full h-full flex flex-col items-center bg-[#FBFBFD] dark:bg-[#070A13] text-slate-900 dark:text-slate-100 font-sans overflow-hidden p-0 m-0">
      {/* Centered Workspace Container flush with navbar and viewport bottom */}
      <div
        ref={workspaceRef}
        className={
          isFullscreen
            ? 'fixed inset-0 z-[999] w-screen h-screen bg-[#FBFBFD] dark:bg-[#0B1017] flex flex-col overflow-hidden'
            : 'w-full max-w-7xl mx-auto h-full flex flex-col overflow-hidden border-x border-slate-200 dark:border-[#202834] bg-white dark:bg-[#0B1017]'
        }
        aria-label="Secure coding assessment workspace"
        aria-description="Clipboard, context-menu, drag/drop, printing, source-view, and screen-capture shortcuts are restricted; Developer Tools remain available."
      >
          {/* Mobile Workspace Tabs (< 1024px) */}
          <div className="lg:hidden flex items-stretch bg-white dark:bg-[#10151D] border-b border-slate-200 dark:border-slate-800 w-full shrink-0" role="tablist" aria-label="Workspace views">
            <button
              type="button"
              onClick={() => setMobileWorkspaceTab('problem')}
              role="tab"
              aria-selected={mobileWorkspaceTab === 'problem'}
              className={`flex-1 border-b-2 py-2.5 px-3 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                mobileWorkspaceTab === 'problem'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Description</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileWorkspaceTab('editor')}
              role="tab"
              aria-selected={mobileWorkspaceTab === 'editor'}
              className={`flex-1 border-b-2 py-2.5 px-3 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                mobileWorkspaceTab === 'editor'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
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
              className={`flex-1 border-b-2 py-2.5 px-3 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                mobileWorkspaceTab === 'tests'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Test Cases</span>
            </button>
          </div>

          <div
            ref={layoutRef}
            className="flex flex-col lg:flex-row flex-1 min-w-0 min-h-0 overflow-hidden w-full h-full relative"
            data-mobile-view={mobileWorkspaceTab}
            data-left-tab={leftTab}
            data-bottom-tab={bottomTab}
            style={{ '--problem-panel-width': `${problemPanelWidth}px` } as React.CSSProperties}
          >
            {/* ========================================================
                LEFT COLUMN: PROBLEM SPECIFICATION & DETAILS PANE
               ======================================================== */}
            <aside
              className={`flex flex-col bg-white dark:bg-[#121922] border-r border-slate-200 dark:border-slate-800 overflow-hidden h-full shrink-0 w-full lg:w-[var(--problem-panel-width)] ${
                mobileWorkspaceTab === 'editor' ? 'hidden lg:flex' : 'flex'
              }`}
              aria-label="Problem details"
            >
              {/* Info Toolbar matching prototype */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#171E28] px-3 py-2 shrink-0 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Link
                    to="/practice"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                    aria-label="Back to all problems"
                    title="Back to all problems"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setLeftTab('description');
                      setMobileWorkspaceTab('problem');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      leftTab === 'description'
                        ? 'bg-white dark:bg-[#252D3D] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Description</span>
                  </button>
                </div>

                {/* Quick Action Icons matching prototype */}
                <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Problem information views">
                  <button
                    type="button"
                    onClick={() => {
                      setLeftTab('testcases');
                      setMobileWorkspaceTab('tests');
                    }}
                    className={`grid h-8 w-8 place-items-center rounded-lg transition-colors cursor-pointer ${
                      leftTab === 'testcases'
                        ? 'bg-blue-50 text-blue-600 dark:bg-[#2B2940] dark:text-[#DDCBFF] dark:border dark:border-[#494263]'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                    title="Test Cases"
                    aria-label="Test Cases"
                  >
                    <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeftTab('submissions')}
                    className={`relative grid h-8 w-8 place-items-center rounded-lg transition-colors cursor-pointer ${
                      leftTab === 'submissions'
                        ? 'bg-blue-50 text-blue-600 dark:bg-[#2B2940] dark:text-[#DDCBFF] dark:border dark:border-[#494263]'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                    title={`Submissions (${submissionsHistory.length})`}
                    aria-label="Submissions"
                  >
                    <History className="h-3.5 w-3.5" aria-hidden="true" />
                    {submissionsHistory.length > 0 && (
                      <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-blue-600 dark:bg-purple-600 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                        {submissionsHistory.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeftTab('companies')}
                    className={`relative grid h-8 w-8 place-items-center rounded-lg transition-colors cursor-pointer ${
                      leftTab === 'companies'
                        ? 'bg-blue-50 text-blue-600 dark:bg-[#2B2940] dark:text-[#DDCBFF] dark:border dark:border-[#494263]'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                    title={`Companies (${problem?.companies?.length || 0})`}
                    aria-label="Companies"
                  >
                    <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {Boolean(problem?.companies?.length) && (
                      <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[9px] font-mono font-bold flex items-center justify-center">
                        {problem?.companies?.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeftTab('hints')}
                    className={`relative grid h-8 w-8 place-items-center rounded-lg transition-colors cursor-pointer ${
                      leftTab === 'hints'
                        ? 'bg-blue-50 text-blue-600 dark:bg-[#2B2940] dark:text-[#DDCBFF] dark:border dark:border-[#494263]'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                    title={`Hints (${problem?.questionHints?.length || problem?.hints?.length || 0})`}
                    aria-label="Hints"
                  >
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Problem Content Scroll Area */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {/* Header Title & Tags */}
                <div className="space-y-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      {problem?.id ? `${problem.id}. ` : ''}{problem?.title || ''}
                    </h1>
                    <button
                      type="button"
                      onClick={handleBookmarkToggle}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                        isBookmarked
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${difficultyTextColor}`}>
                      <span className={`w-2 h-2 rounded-full ${difficultyDotColor}`}></span>
                      {difficultyName}
                    </span>

                    {(problem?.topicRefName || problem?.topic) && (
                      <>
                        <span className="text-slate-400 dark:text-slate-600 font-bold">·</span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                          {problem.topicRefName || problem.topic}
                        </span>
                      </>
                    )}

                    {(problem?.questionPlatform || problem?.qpfRefName || problem?.examPlatform) && (
                      <>
                        <span className="text-slate-400 dark:text-slate-600 font-bold">·</span>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {String(problem.questionPlatform || problem.qpfRefName || problem.examPlatform)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 1. DESCRIPTION VIEW */}
                {leftTab === 'description' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed text-sm">
                        {problem?.description || 'No problem description is available.'}
                      </div>
                    </div>

                    {/* Problem Examples */}
                    {sampleTestCases.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Examples
                        </div>
                        <div className="space-y-3">
                          {sampleTestCases.map((tc, idx) => (
                            <div key={idx} className="p-3.5 bg-slate-50 dark:bg-[#1C2530] border border-slate-200 dark:border-[#303B49] rounded-xl space-y-2 font-mono text-xs">
                              <div className="font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <span>Example {idx + 1}</span>
                              </div>
                              <div className="space-y-1">
                                <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider">Input</div>
                                <pre className="whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200 font-mono text-xs">{tc.input}</pre>
                              </div>
                              <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-2">
                                <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider">Expected Output</div>
                                <pre className="whitespace-pre-wrap break-words font-semibold text-emerald-600 dark:text-[#9CE5BD] font-mono text-xs">{tc.expectedOutput}</pre>
                              </div>
                              {tc.explanation && (
                                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-300 font-sans text-xs">
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">Explanation: </span>
                                  {tc.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {problem?.constraints && (
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Constraints
                        </div>
                        <div className="p-3.5 bg-slate-50 dark:bg-[#1C2530] border border-slate-200 dark:border-[#303B49] rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                          {problem.constraints}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. TEST CASES EXPLORER VIEW (Vertical Accordion) */}
                {leftTab === 'testcases' && (
                  <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                    <div className="flex items-center justify-between p-3 bg-slate-50/70 dark:bg-slate-900/40 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <span>Public Test Cases ({sampleTestCases.length})</span>
                    </div>
                    {sampleTestCases.length > 0 ? (
                      sampleTestCases.map((tc, idx) => {
                        const isOpen = expandedSampleIdx === idx;
                        const name =
                          tc.testCaseName ||
                          tc.name ||
                          tc.typeRefName ||
                          (tc.displayOrder ? `Case ${tc.displayOrder}` : `Case ${idx + 1}`);
                        return (
                          <div key={idx} className="transition-colors">
                            <button
                              type="button"
                              onClick={() => setExpandedSampleIdx(isOpen ? -1 : idx)}
                              aria-expanded={isOpen}
                              className="w-full min-h-11 px-4 py-2.5 flex items-center justify-between text-left gap-3 hover:bg-slate-50 dark:hover:bg-[#151D28] transition-colors cursor-pointer select-none"
                            >
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{name}</span>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-4 pt-1 space-y-3 bg-slate-50/50 dark:bg-[#0B1017]/50 border-t border-slate-200/60 dark:border-slate-800/60">
                                <div className="space-y-1">
                                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Input</div>
                                  <pre className="p-2.5 rounded-lg bg-white dark:bg-[#141C26] border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap">{tc.input || 'No input'}</pre>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Expected Output</div>
                                  <pre className="p-2.5 rounded-lg bg-white dark:bg-[#141C26] border border-slate-200 dark:border-slate-800 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap">{tc.expectedOutput}</pre>
                                </div>
                                {tc.explanation && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Explanation</div>
                                    <p className="p-2.5 rounded-lg bg-white dark:bg-[#141C26] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">{tc.explanation}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 font-mono p-4 text-center">No public test cases available.</p>
                    )}
                  </div>
                )}

                {/* 3. SUBMISSIONS VIEW */}
                {leftTab === 'submissions' && (
                  <div className="space-y-3">
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
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-mono space-y-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <History className="h-7 w-7 text-slate-400 mx-auto mb-1" />
                        <span>No submissions recorded yet.</span>
                      </div>
                    ) : (
                      submissionsHistory.map((sub) => {
                        const isAccepted = sub.status === 'Accepted';
                        const isExpanded = expandedSubmissionId === sub.id;
                        return (
                          <div
                            key={sub.id}
                            className={`p-3 bg-slate-50 dark:bg-[#1C2530] border rounded-xl flex flex-col font-mono text-xs transition-all ${
                              isAccepted ? 'border-emerald-500/30' : 'border-rose-500/30'
                            }`}
                          >
                            <div
                              className="flex items-center justify-between cursor-pointer select-none"
                              onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isAccepted
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {isAccepted ? '✓ Accepted' : '✗ Failed'}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 font-sans text-xs">
                                  {sub.passedTestCases}/{sub.totalTestCases} Tests
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                                <span>{sub.language}</span>
                                {sub.runtimeMs !== undefined && sub.runtimeMs !== null && (
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{sub.runtimeMs} ms</span>
                                )}
                                <span>{sub.timestamp}</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {isExpanded && sub.sourceCode && (
                              <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">Submitted Code:</span>
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
                                    className="text-blue-600 dark:text-blue-400 hover:underline font-sans cursor-pointer flex items-center gap-1"
                                  >
                                    <Code2 className="h-3 w-3" />
                                    <span>Load into Editor</span>
                                  </button>
                                </div>
                                <pre className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-mono overflow-x-auto max-h-48 whitespace-pre">
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

                {/* 4. COMPANIES VIEW */}
                {leftTab === 'companies' && (
                  <div className="space-y-3">
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold pb-2 border-b border-slate-200 dark:border-slate-800">
                      Companies Asking This Question
                    </div>
                    {problem?.companies && problem.companies.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {problem.companies.map((c, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-50 dark:bg-[#1C2530] border border-slate-200 dark:border-[#303B49] rounded-lg flex items-center gap-2 font-mono text-xs text-slate-800 dark:text-slate-200"
                          >
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold">{String(c)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-mono p-4 text-center">No company associations recorded.</p>
                    )}
                  </div>
                )}

                {/* 5. HINTS VIEW */}
                {leftTab === 'hints' && (
                  <div className="space-y-3">
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold pb-2 border-b border-slate-200 dark:border-slate-800">
                      Hints
                    </div>
                    {problem?.questionHints && problem.questionHints.length > 0 ? (
                      problem.questionHints.map((h, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-[#1C2530] border border-slate-200 dark:border-[#303B49] rounded-xl text-xs space-y-1">
                          <div className="text-amber-500 font-mono font-bold flex items-center gap-1.5">
                            <Lightbulb className="h-3 w-3 text-amber-500" />
                            <span>Hint {i + 1}</span>
                          </div>
                          <p className="font-sans text-slate-700 dark:text-slate-300 leading-relaxed">{h.hintText || String(h)}</p>
                        </div>
                      ))
                    ) : problem?.hints && problem.hints.length > 0 ? (
                      problem.hints.map((h, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-[#1C2530] border border-slate-200 dark:border-[#303B49] rounded-xl text-xs space-y-1">
                          <div className="text-amber-500 font-mono font-bold flex items-center gap-1.5">
                            <Lightbulb className="h-3 w-3 text-amber-500" />
                            <span>Hint {i + 1}</span>
                          </div>
                          <p className="font-sans text-slate-700 dark:text-slate-300 leading-relaxed">{String(h)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 font-mono p-4 text-center">No hints recorded for this question.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Problem Footer (Previous / Next navigation matching prototype) */}
              <nav className="flex h-11 shrink-0 items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 text-xs font-bold bg-slate-50/50 dark:bg-[#151D27]" aria-label="Problem navigation">
                <button
                  type="button"
                  onClick={() => {
                    const currentNum = Number(problem?.id);
                    navigate(currentNum > 1 ? `/problems/${currentNum - 1}` : '/practice');
                  }}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-[#B39AFC] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Previous
                </button>
                <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentNum = Number(problem?.id);
                    navigate(currentNum ? `/problems/${currentNum + 1}` : '/practice');
                  }}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-[#B39AFC] transition-colors cursor-pointer"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </nav>
            </aside>

            {/* Vertical Splitter Resizer */}
            <div
              className="hidden lg:flex w-2 shrink-0 cursor-col-resize items-center justify-center bg-slate-100 dark:bg-[#101720] hover:bg-blue-100 dark:hover:bg-[#293144] text-slate-400 hover:text-blue-600 dark:hover:text-[#B39AFC] transition-colors border-x border-slate-200 dark:border-[#27313b] touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 z-10"
              role="separator"
              aria-label="Resize problem and editor panels"
              aria-orientation="vertical"
              aria-valuemin={280}
              aria-valuemax={Math.max(280, (layoutRef.current?.clientWidth ?? 658) - 320)}
              aria-valuenow={problemPanelWidth}
              tabIndex={0}
              data-dragging={draggingSplitter === 'problem'}
              onPointerDown={(event) => handleSplitterPointerDown('problem', event)}
              onPointerMove={handleSplitterPointerMove}
              onPointerUp={finishSplitterDrag}
              onPointerCancel={finishSplitterDrag}
              onLostPointerCapture={finishSplitterDrag}
              onDoubleClick={() => setProblemPanelWidth(clampProblemPanelWidth(360))}
              onKeyDown={(event) => handleSplitterKeyDown('problem', event)}
              title="Drag to resize problem and editor panels; double-click to reset"
            >
              <GripVertical className="h-4 w-3 opacity-75" aria-hidden="true" />
            </div>

            {/* ========================================================
                RIGHT COLUMN: MONACO CODE EDITOR & TESTBENCH DOCK
               ======================================================== */}
            <div
              ref={editorWorkspaceRef}
              className={`flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden bg-white dark:bg-[#0D131B] ${
                mobileWorkspaceTab === 'editor' ? 'flex w-full' : 'hidden lg:flex'
              }`}
              style={{ '--console-panel-height': `${consolePanelHeight}px` } as React.CSSProperties}
            >
              {/* Editor Toolbar */}
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-slate-50/80 dark:bg-[#131A23] border-b border-slate-200 dark:border-slate-800 shrink-0">
                  {/* Left: Language Select & Fullscreen */}
                  <div className="flex items-center gap-2">
                    <div className="relative inline-flex items-center min-w-32">
                      {loadingLanguages && languages.length === 0 ? (
                        <Skeleton className="h-8 w-32 rounded-lg" />
                      ) : (
                        <C2CSelect
                          id="languageSelect"
                          value={selectedLanguage?.id ?? ''}
                          onChange={handleLanguageChange}
                          busy={loadingLanguages}
                          disabled={isExecuting || languages.length === 0}
                          placeholder={loadingLanguages ? 'Loading languages…' : 'No languages'}
                          ariaLabel="Programming language"
                          options={languages.map((language) => ({
                            value: language.id,
                            label: language.name,
                            icon: <Code2 className="h-3.5 w-3.5 text-blue-500 shrink-0" aria-hidden="true" />,
                          }))}
                          buttonClassName="py-1 px-2.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#1A222E] border-slate-200 dark:border-[#364151] text-slate-800 dark:text-[#D0D8E2]"
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      title={isFullscreen ? 'Restore view' : 'Fullscreen editor'}
                      className="w-8 h-8 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors grid place-items-center cursor-pointer"
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Right: Actions Reset, Run, Submit */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetCode}
                      disabled={isExecuting}
                      title="Reset starter template"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#1A222D] hover:bg-slate-200 dark:hover:bg-[#263140] border border-slate-200 dark:border-[#394456] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRunCode}
                      disabled={!isExecutionReady || !currentCode.trim()}
                      title="Run code against sample test cases (Ctrl + ')"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#1A222D] hover:bg-slate-100 dark:hover:bg-[#263140] border border-slate-300 dark:border-[#394456] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                    >
                      <Play className="h-3 w-3 fill-current text-slate-700 dark:text-slate-300" />
                      <span>Run</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmitCode}
                      disabled={!isExecutionReady || !currentCode.trim()}
                      title="Submit code for full evaluation (Ctrl + Enter)"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-[#B39AFC] dark:hover:bg-[#C8B8FF] dark:text-[#1B1532] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Submit</span>
                      <Send className="h-3 w-3 fill-current" />
                    </button>
                  </div>
                </div>

                {languagesError && languages.length === 0 && (
                  <div className="px-4 py-2 border-b border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30">
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
                  className="w-full min-h-0 flex-1 bg-white dark:bg-[#0D131B]"
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
                        fontSize: 13,
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
                        readOnlyMessage: { value: 'Code execution in progress.' },
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

              {/* Horizontal Splitter Resizer between Editor and Console */}
              {leftTab !== 'testcases' && (
                <div
                  className="h-2 w-full shrink-0 cursor-row-resize flex items-center justify-center bg-slate-100 dark:bg-[#101720] hover:bg-blue-100 dark:hover:bg-[#293144] text-slate-400 hover:text-blue-600 dark:hover:text-[#B39AFC] transition-colors border-y border-slate-200 dark:border-[#2C3542] touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 z-10"
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
                    setConsolePanelHeight(clampConsolePanelHeight(240));
                  }}
                  onKeyDown={(event) => handleSplitterKeyDown('console', event)}
                  title="Drag to resize editor and test case panels; double-click to reset"
                >
                  <GripHorizontal className="w-4 h-3 opacity-75" aria-hidden="true" />
                </div>
              )}

              {/* Console Dock */}
              {leftTab !== 'testcases' && (
                <section
                  className={`shrink-0 flex flex-col overflow-hidden bg-white dark:bg-[#131A23] border-t border-slate-200 dark:border-slate-800 ${
                    consoleHeight === 'collapsed'
                      ? 'h-[44px]'
                      : consoleHeight === 'expanded'
                      ? 'h-[62%] max-h-[68%]'
                      : 'h-[var(--console-panel-height,220px)] max-h-[68%]'
                  }`}
                  data-size={consoleHeight}
                  aria-label="Test cases and execution results"
                >
                  {/* Console Header Bar */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#10161F] px-4 py-2 shrink-0 gap-2">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setBottomTab('testcases');
                          if (consoleHeight === 'collapsed') setConsoleHeight('normal');
                        }}
                        className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 pb-0.5 ${
                          bottomTab === 'testcases'
                            ? 'text-blue-600 dark:text-[#E9E4FB] border-b-2 border-blue-600 dark:border-[#AA94FF]'
                            : 'text-slate-500 dark:text-[#8795A7] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>Test cases</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBottomTab('results');
                          if (consoleHeight === 'collapsed') setConsoleHeight('normal');
                        }}
                        className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 pb-0.5 ${
                          bottomTab === 'results'
                            ? 'text-blue-600 dark:text-[#E9E4FB] border-b-2 border-blue-600 dark:border-[#AA94FF]'
                            : 'text-slate-500 dark:text-[#8795A7] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>Results</span>
                        {executionResult && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                              isExecutionResultSuccessful(executionResult)
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            {executionResult.passedTestCases}/{executionResult.totalTestCases}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-[#758194]">
                        {bottomTab === 'testcases' ? `${sampleTestCases.length} public cases` : isExecuting ? 'Running...' : ''}
                      </span>

                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-slate-500 dark:text-slate-400 text-xs">
                        <button
                          type="button"
                          onClick={() => setConsoleHeight((prev) => (prev === 'collapsed' ? 'normal' : 'collapsed'))}
                          className="p-1 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title={consoleHeight === 'collapsed' ? 'Expand' : 'Collapse'}
                        >
                          {consoleHeight === 'collapsed' ? <ChevronUp className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConsoleHeight((prev) => (prev === 'expanded' ? 'normal' : 'expanded'))}
                          className="p-1 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title={consoleHeight === 'expanded' ? 'Restore' : 'Maximize'}
                        >
                          {consoleHeight === 'expanded' ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Console Body */}
                  {consoleHeight !== 'collapsed' && (
                    <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {/* TEST CASES TAB (Vertical Accordion) */}
                      {bottomTab === 'testcases' && (
                        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                          {sampleTestCases.length > 0 ? (
                            sampleTestCases.map((tc, idx) => {
                              const isOpen = expandedSampleIdx === idx;
                              const name =
                                tc.testCaseName ||
                                tc.name ||
                                tc.typeRefName ||
                                (tc.displayOrder ? `Case ${tc.displayOrder}` : `Case ${idx + 1}`);
                              return (
                                <div key={idx} className="transition-colors">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedSampleIdx(isOpen ? -1 : idx)}
                                    aria-expanded={isOpen}
                                    className="w-full min-h-11 px-4 py-2.5 flex items-center justify-between text-left gap-3 hover:bg-slate-50 dark:hover:bg-[#151D28] transition-colors cursor-pointer select-none"
                                  >
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{name}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  {isOpen && (
                                    <div className="px-4 pb-4 pt-1 space-y-3 bg-slate-50/50 dark:bg-[#0B1017]/50 border-t border-slate-200/60 dark:border-slate-800/60">
                                      <div className="space-y-1">
                                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Input</div>
                                        <pre className="p-2.5 rounded-lg bg-white dark:bg-[#141C26] border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap">{tc.input || 'No input'}</pre>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Expected Output</div>
                                        <pre className="p-2.5 rounded-lg bg-white dark:bg-[#141C26] border border-slate-200 dark:border-slate-800 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap">{tc.expectedOutput}</pre>
                                      </div>
                                      {tc.explanation && (
                                        <div className="space-y-1">
                                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Explanation</div>
                                          <p className="p-2.5 rounded-lg bg-white dark:bg-[#141C26] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">{tc.explanation}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex min-h-24 flex-col items-center justify-center p-4 text-center">
                              <p className="text-xs text-slate-400 font-mono">No public test cases available.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* RESULTS TAB (Vertical Accordion) */}
                      {bottomTab === 'results' && (
                        <div ref={resultsPanelRef} className="flex-1 min-h-0 flex flex-col h-full" aria-live="polite">
                          {/* Streamlined real-time execution loading status */}
                          {isExecuting && (
                            <div role="status" aria-label="Executing code" className="flex items-center gap-2.5 py-6 px-4">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" aria-hidden="true" />
                              <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 font-mono">
                                {lastExecutionMode === 'submit' ? 'Evaluating...' : 'Running...'}
                              </span>
                            </div>
                          )}

                        {executionError && !isExecuting && (
                          <div className="p-3.5 m-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 dark:bg-rose-950/25 dark:border-rose-900/60 dark:text-rose-300 text-xs space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-bold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
                                <span>Execution error</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleRetryExecution}
                                className="shrink-0 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950 cursor-pointer"
                              >
                                Retry
                              </button>
                            </div>
                            <pre className="whitespace-pre-wrap font-mono text-[11px]">{executionError}</pre>
                          </div>
                        )}

                        {!executionResult && !executionError && !isExecuting && (
                          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs font-mono gap-1">
                            <Terminal className="w-6 h-6 text-slate-400 mb-1" aria-hidden="true" />
                            <span>Run or Submit to view test results.</span>
                          </div>
                        )}

                        {/* Execution Verdict & Vertical Test Cases Stack */}
                        {executionResult && !isExecuting && (
                          <div className="flex flex-col h-full min-h-0">
                            {/* Summary Bar */}
                            <div className="min-h-10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#10161F] shrink-0">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <strong className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {executionResult.passedTestCases} of {executionResult.totalTestCases} test cases passed
                                </strong>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    isExecutionResultSuccessful(executionResult)
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {executionVerdictLabel}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                                {executionResult.executionTime !== undefined && executionResult.executionTime !== null && (
                                  <span>
                                    Runtime: <strong className="text-slate-800 dark:text-slate-200">{executionResult.executionTime}{executionResult.executionTimeUnit || ' ms'}</strong>
                                  </span>
                                )}
                                {executionResult.memoryUsage !== undefined && executionResult.memoryUsage !== null && (
                                  <span>
                                    Memory: <strong className="text-slate-800 dark:text-slate-200">{executionResult.memoryUsage}{executionResult.memoryUnit || ' MB'}</strong>
                                  </span>
                                )}
                                {executionResult.testCases && executionResult.testCases.length > 0 && (
                                  <div className="flex items-center gap-1 h-1.5 w-16 shrink-0" aria-hidden="true">
                                    {executionResult.testCases.map((tc, i) => {
                                      const isCasePassed = String(tc.status).toLowerCase() === 'passed';
                                      return (
                                        <span
                                          key={i}
                                          className={`flex-1 h-full rounded-xs ${
                                            isCasePassed ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400'
                                          }`}
                                        />
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Vertical Test Cases List */}
                            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                              {executionResult.testCases && executionResult.testCases.length > 0 ? (
                                executionResult.testCases.map((tc, idx) => {
                                  const isPassed = String(tc.status).toLowerCase() === 'passed';
                                  const tcName =
                                    tc.testCaseName ||
                                    tc.name ||
                                    tc.testCaseType ||
                                    tc.typeRefName ||
                                    (tc.testCaseId ? `Test Case #${tc.testCaseId}` : `Case ${idx + 1}`);

                                  if (tc.isHidden) {
                                    return (
                                      <div
                                        key={idx}
                                        className="w-full min-h-11 px-4 py-2.5 flex items-center justify-between text-left gap-3 select-none"
                                        role="group"
                                        aria-label={`${tcName} — hidden test case, ${isPassed ? 'passed' : 'failed'}`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{tcName}</span>
                                        </div>
                                        <span
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                                            isPassed
                                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                          }`}
                                        >
                                          {isPassed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                          <span>{isPassed ? 'Passed' : 'Failed'}</span>
                                        </span>
                                      </div>
                                    );
                                  }

                                  const isOpen = expandedResultIdx === idx;
                                  return (
                                    <div key={idx} className="transition-colors">
                                      <button
                                        type="button"
                                        onClick={() => setExpandedResultIdx(isOpen ? -1 : idx)}
                                        aria-expanded={isOpen}
                                        className="w-full min-h-11 px-4 py-2.5 flex items-center justify-between text-left gap-3 hover:bg-slate-50 dark:hover:bg-[#151D28] transition-colors cursor-pointer select-none"
                                      >
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{tcName}</span>
                                        <span
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                                            isPassed
                                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                          }`}
                                        >
                                          {isPassed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                          <span>{isPassed ? 'Passed' : 'Failed'}</span>
                                        </span>
                                      </button>
                                      {isOpen && (
                                        <div className="px-4 pb-4 pt-1 space-y-3 bg-slate-50/50 dark:bg-[#0B1017]/50 border-t border-slate-200/60 dark:border-slate-800/60">
                                          {tc.input && (
                                            <div className="space-y-1">
                                              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Input</div>
                                              <pre className="p-2.5 rounded-lg bg-white dark:bg-[#141C26] border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap">{tc.input}</pre>
                                            </div>
                                          )}
                                          {tc.expectedOutput && (
                                            <div className="space-y-1">
                                              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Expected Output</div>
                                              <pre className="p-2.5 rounded-lg bg-white dark:bg-[#141C26] border border-slate-200 dark:border-slate-800 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap">{tc.expectedOutput}</pre>
                                            </div>
                                          )}
                                          {tc.actualOutput !== undefined && (
                                            <div className="space-y-1">
                                              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Your Output</div>
                                              <pre className={`p-2.5 rounded-lg bg-white dark:bg-[#141C26] border font-mono text-xs overflow-x-auto whitespace-pre-wrap ${isPassed ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold' : 'border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                                                {tc.actualOutput || '—'}
                                              </pre>
                                            </div>
                                          )}
                                          {tc.errorMessage && (
                                            <div className="space-y-1">
                                              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-500">Diagnostic</div>
                                              <pre className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 font-mono text-xs text-rose-700 dark:text-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">{tc.errorMessage}</pre>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="p-4 text-center text-slate-400 text-xs font-mono">
                                  No test case details returned.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
            </div>
          </div>
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
