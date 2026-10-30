import { useExecutionRequest } from '../../../problems/hooks/useExecutionRequest';
import { RequestStatus } from '../../../../shared/components/ui/RequestStatus';
import { Skeleton } from '../../../../shared/components/ui/Skeleton';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { AdminCard } from '../AdminCard';
import { AdminBadge } from '../AdminBadge';
import { adminQuestionService, getLiveTotalQuestionsCount } from '../../../../services/admin/adminQuestionService';
import { problemService } from '../../../../services/problemService';
import { ExecutionResultData, isExecutionResultSuccessful } from '../../../../services/executionService';
import { useTheme } from '../../../../shared/context/ThemeContext';
import { toast } from 'react-hot-toast';
import {
  Play,
  Send,
  Terminal,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import { fetchLanguages } from '../../../languages/redux/languageSlice';
import type { QuestionTestCase, Question } from '../../../../core/types/domain';
import { extractTestCasesFromProblem } from '../../utils/testCaseUtils';

interface QuestionOption {
  id: number;
  title: string;
  description?: string;
  constraints?: string;
  difficulty?: string;
  difficultyRefName?: string;
  topicRefName?: string;
  testCases?: QuestionTestCase[];
}

/**
 * Verified working demo solutions for quick runtime verification testing.
 */
const SAMPLE_WORKING_SOLUTIONS: Record<number, Record<string, string>> = {
  1: {
    java: `import java.util.*;

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
    python: `import sys

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
    cpp: `#include <iostream>
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
    javascript: `const fs = require('fs');

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
  },
};

/**
 * Generates dynamic starter boilerplate tailored to each problem challenge and target runtime.
 */
const getDynamicStarterCode = (languageName: string, title?: string, problemId?: number | null): string => {
  const normLang = (languageName || '').toLowerCase().trim();
  const idPrefix = problemId ? `#${problemId} ` : '';
  const headerComment = title ? `${idPrefix}${title}` : 'Solution';

  if (normLang.includes('python')) {
    return `import sys

def solve():
    # ${headerComment}
    lines = sys.stdin.read().split()
    if not lines:
        return
    # Process input lines and print answer

if __name__ == '__main__':
    solve()
`;
  }

  if (normLang.includes('c++') || normLang === 'cpp') {
    return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // ${headerComment}
    string line;
    while (cin >> line) {
        // Process input and print answer
    }
    return 0;
}
`;
  }

  if (normLang.includes('javascript') || normLang.includes('node') || normLang === 'js') {
    return `const fs = require('fs');

function solve() {
    // ${headerComment}
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    // Process input and print answer
}

solve();
`;
  }

  // Default Java
  return `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // ${headerComment}
        while (sc.hasNextLine()) {
            String line = sc.nextLine();
            // Process input and print output
        }
    }
}
`;
};

export const DashboardCodeRunner: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();

  // Question options & dynamic search
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [totalKnownQuestions, setTotalKnownQuestions] = useState<number>(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [manualQuestionId, setManualQuestionId] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isSearchingBackend, setIsSearchingBackend] = useState<boolean>(false);

  // Selected question statement & test cases
  const [selectedQuestionDetails, setSelectedQuestionDetails] = useState<Question | null>(null);
  const [selectedQuestionTestCases, setSelectedQuestionTestCases] = useState<QuestionTestCase[]>([]);
  const [loadingQuestionDetails, setLoadingQuestionDetails] = useState<boolean>(false);
  const [isStatementOpen, setIsStatementOpen] = useState<boolean>(true);
  const [testCaseTab, setTestCaseTab] = useState<'sample' | 'all'>('sample');

  // Languages from GET /api/v1/language
  const { languages: languageRegistry, loading: languagesLoading, error: languagesError } =
    useAppSelector((state) => state.languages);
  const languages = useMemo(
    () => languageRegistry.filter((language) => language.isActive !== false),
    [languageRegistry]
  );
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);

  // Scoped code drafts per question and runtime language
  const [_codeDrafts, setCodeDrafts] = useState<Record<string, string>>({});
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

  // 1. Fetch available questions dynamically across the full bank using pageSize: 10
  const loadQuestionBank = useCallback(async (signal?: AbortSignal) => {
    setResourcesLoading(true);
    setResourcesError(null);
    try {
      const initialRes = await adminQuestionService.getQuestions(
        {
          level: null,
          companies: null,
          topic: null,
          searchText: null,
          pageRequest: { pageNumber: 0, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
        },
        signal
      );
      const raw: any = initialRes?.data || initialRes;
      let allItems: any[] = Array.isArray(raw?.content)
        ? raw.content
        : Array.isArray(raw)
        ? raw
        : [];

      const totalElements =
        typeof raw?.totalElements === 'number'
          ? raw.totalElements
          : getLiveTotalQuestionsCount();
      const totalPages =
        typeof raw?.totalPages === 'number'
          ? raw.totalPages
          : Math.max(1, Math.ceil(totalElements / 10));
      setTotalKnownQuestions(totalElements);

      // Dynamically load all available pages with pageSize: 10 matching /admin/questions contract
      if (totalPages > 1) {
        const pagesToFetch = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
        const subPageResults = await Promise.allSettled(
          pagesToFetch.map((pageNum) =>
            adminQuestionService.getQuestions(
              {
                level: null,
                companies: null,
                topic: null,
                searchText: null,
                pageRequest: { pageNumber: pageNum, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
              },
              signal
            )
          )
        );

        for (const subRes of subPageResults) {
          if (subRes.status === 'fulfilled') {
            const pageRaw: any = subRes.value?.data || subRes.value;
            const content = Array.isArray(pageRaw?.content) ? pageRaw.content : [];
            allItems = allItems.concat(content);
          }
        }
      }

      // Deduplicate by ID and map
      const uniqueMap = new Map<number, QuestionOption>();
      allItems.forEach((item) => {
        if (item && typeof item.id === 'number') {
          uniqueMap.set(item.id, {
            id: item.id,
            title: item.title,
            description: item.description,
            constraints: item.constraints,
            difficulty: item.difficulty || item.difficultyRefName,
            difficultyRefName: item.difficultyRefName || item.difficulty,
            topicRefName: item.topicRefName,
            testCases: item.testCases,
          });
        }
      });
      const uniqueList = Array.from(uniqueMap.values()).sort((a, b) => a.id - b.id);

      setQuestions(uniqueList);
      if (uniqueList.length > 0) {
        setSelectedQuestionId((prev) => {
          if (prev && uniqueList.some((q) => q.id === prev)) return prev;
          setManualQuestionId(String(uniqueList[0].id));
          return uniqueList[0].id;
        });
      }
    } catch {
      setResourcesError('Unable to load question catalog.');
    } finally {
      setResourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void dispatch(fetchLanguages(resourcesRetry > 0 ? { force: true } : undefined));
    void loadQuestionBank(controller.signal);
    return () => {
      controller.abort();
    };
  }, [dispatch, loadQuestionBank, resourcesRetry]);

  // Set default language on language load
  useEffect(() => {
    setSelectedLanguageId((previous) =>
      languages.some((language) => language.id === previous)
        ? previous
        : languages[0]?.id ?? null
    );
  }, [languages]);

  // 2. Fetch selected problem statement & test cases dynamically with multi-tier fallback
  useEffect(() => {
    if (!selectedQuestionId) {
      setSelectedQuestionDetails(null);
      setSelectedQuestionTestCases([]);
      return;
    }

    let active = true;
    setLoadingQuestionDetails(true);

    const loadDetailsAndTestCases = async () => {
      let details: Question | null = null;
      let cases: QuestionTestCase[] = [];

      // Tier 1: Dedicated adminQuestionService.getQuestionById
      try {
        const detailRes = await adminQuestionService.getQuestionById(selectedQuestionId);
        const raw: any = detailRes?.data || detailRes;
        if (raw && typeof raw === 'object' && raw.id) {
          details = raw;
          if (Array.isArray(raw.testCases) && raw.testCases.length > 0) {
            cases = raw.testCases;
          }
        }
      } catch {
        // Direct admin detail fetch might fail (e.g. backend 500 on certain IDs like #6)
      }

      // Tier 2: Resilient problemService.getProblemById with catalog fallback
      if (!details) {
        try {
          const probRes = await problemService.getProblemById(selectedQuestionId);
          if (probRes?.data) {
            const p = probRes.data;
            details = {
              id: Number(p.id || p.questionId || selectedQuestionId),
              title: p.title,
              description: p.description || '',
              constraints: p.constraints || '',
              difficultyRefGroupCode: 'DIFF',
              difficultyRefCode: p.difficultyRefCode || '',
              difficultyRefName: p.difficultyRefName || p.difficulty || '',
              topicRefGroupCode: 'TOPIC',
              topicRefCode: p.topicRefCode || '',
              topicRefName: p.topicRefName || p.topic || '',
              qpfRefGroupCode: 'QPF',
              qpfRefCode: p.qpfRefCode || '',
              qpfRefName: p.qpfRefName || '',
              questionHints: [],
              testCases: p.testCases || [],
            };
            if (Array.isArray(p.testCases) && p.testCases.length > 0) {
              cases = p.testCases;
            }
          }
        } catch {
          // Fall through to question cache
        }
      }

      // Tier 3: Lookup in already-loaded questions list
      if (!details) {
        const cached = questions.find((q) => q.id === selectedQuestionId);
        if (cached) {
          details = {
            id: cached.id,
            title: cached.title,
            description: cached.description || '',
            constraints: cached.constraints || '',
            difficultyRefGroupCode: 'DIFF',
            difficultyRefCode: '',
            difficultyRefName: cached.difficultyRefName || cached.difficulty || '',
            topicRefGroupCode: 'TOPIC',
            topicRefCode: '',
            topicRefName: cached.topicRefName || '',
            qpfRefGroupCode: 'QPF',
            qpfRefCode: '',
            qpfRefName: '',
            questionHints: [],
            testCases: cached.testCases || [],
          };
          if (Array.isArray(cached.testCases) && cached.testCases.length > 0) {
            cases = cached.testCases;
          }
        }
      }

      // Tier 4: Try fetching test cases if still empty
      if (cases.length === 0) {
        try {
          const tcRes = await adminQuestionService.getTestCases(selectedQuestionId);
          if (Array.isArray(tcRes) && tcRes.length > 0) {
            cases = tcRes;
          }
        } catch {
          // Ignore
        }
      }

      // Tier 5: Extract test cases from problem description markdown or standard cases
      if (cases.length === 0 && details) {
        cases = extractTestCasesFromProblem(details);
      }

      if (!active) return;
      setSelectedQuestionDetails(details);
      setSelectedQuestionTestCases(cases);
      setLoadingQuestionDetails(false);
    };

    void loadDetailsAndTestCases();

    return () => {
      active = false;
    };
  }, [selectedQuestionId, questions]);

  // Synchronize editor code per problem challenge and runtime language
  useEffect(() => {
    if (!selectedQuestionId || !selectedLanguageId) return;
    const key = `${selectedQuestionId}_${selectedLanguageId}`;
    const langObj = languages.find((l) => l.id === selectedLanguageId);
    const langName = langObj?.name || 'Java';
    const normLang = langName.toLowerCase().includes('python')
      ? 'python'
      : langName.toLowerCase().includes('c++')
      ? 'cpp'
      : langName.toLowerCase().includes('javascript')
      ? 'javascript'
      : 'java';

    setCodeDrafts((prev) => {
      if (prev[key] !== undefined) {
        setSourceCode(prev[key]);
        return prev;
      }
      const starter =
        SAMPLE_WORKING_SOLUTIONS[selectedQuestionId]?.[normLang] ||
        getDynamicStarterCode(langName, selectedQuestionDetails?.title, selectedQuestionId);
      setSourceCode(starter);
      return { ...prev, [key]: starter };
    });
  }, [selectedQuestionId, selectedLanguageId, languages, selectedQuestionDetails?.title]);

  const combinedResourcesLoading = resourcesLoading || languagesLoading;
  const combinedResourcesError =
    resourcesError ||
    languagesError ||
    (!languagesLoading && languages.length === 0 ? 'No execution languages are configured.' : null);

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

  // Instant client-side search filtering over loaded questions
  const filteredQuestions = useMemo(() => {
    if (!searchFilter.trim()) return questions;
    const query = searchFilter.toLowerCase().trim();
    return questions.filter((item) => {
      const matchId = String(item.id).includes(query);
      const matchTitle = (item.title || '').toLowerCase().includes(query);
      const matchDiff = (item.difficulty || item.difficultyRefName || '').toLowerCase().includes(query);
      const matchTopic = (item.topicRefName || '').toLowerCase().includes(query);
      return matchId || matchTitle || matchDiff || matchTopic;
    });
  }, [questions, searchFilter]);

  // Dynamic backend search for terms beyond local page
  const handleBackendSearch = async () => {
    if (!searchFilter.trim()) return;
    setIsSearchingBackend(true);
    try {
      const res = await adminQuestionService.getQuestions({
        level: null,
        companies: null,
        topic: null,
        searchText: searchFilter.trim(),
        pageRequest: { pageNumber: 0, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
      });
      const raw: any = res?.data || res;
      const list = Array.isArray(raw?.content)
        ? raw.content
        : Array.isArray(raw)
        ? raw
        : [];

      if (list.length > 0) {
        setQuestions((prev) => {
          const map = new Map(prev.map((item) => [item.id, item]));
          list.forEach((item: any) => {
            if (item && item.id) {
              map.set(item.id, {
                id: item.id,
                title: item.title,
                description: item.description,
                constraints: item.constraints,
                difficulty: item.difficulty || item.difficultyRefName,
                difficultyRefName: item.difficultyRefName || item.difficulty,
                topicRefName: item.topicRefName,
                testCases: item.testCases,
              });
            }
          });
          return Array.from(map.values()).sort((a, b) => a.id - b.id);
        });
        setSelectedQuestionId(list[0].id);
        setManualQuestionId(String(list[0].id));
        toast.success(`Found ${list.length} question(s) matching "${searchFilter}"`);
      } else {
        toast.error(`No questions found matching "${searchFilter}"`);
      }
    } catch (err: any) {
      toast.error('Search failed: ' + (err?.message || 'Server error'));
    } finally {
      setIsSearchingBackend(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const val = value || '';
    setSourceCode(val);
    if (selectedQuestionId && selectedLanguageId) {
      const key = `${selectedQuestionId}_${selectedLanguageId}`;
      setCodeDrafts((prev) => ({ ...prev, [key]: val }));
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    setSelectedLanguageId(newId);
    setResult(null);
  };

  const handleQuestionSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const qId = Number(e.target.value);
    if (!qId || isNaN(qId)) return;
    setSelectedQuestionId(qId);
    setManualQuestionId(String(qId));
    setResult(null);
    setExecutionMessage('');
  };

  const handleManualQuestionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualQuestionId(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setSelectedQuestionId(num);
      setResult(null);
    }
  };

  const handleManualQuestionIdBlur = async () => {
    const num = Number(manualQuestionId);
    if (isNaN(num) || num <= 0) return;
    const exists = questions.some((q) => q.id === num);
    if (!exists) {
      try {
        let qData: any = null;
        try {
          const res = await adminQuestionService.getQuestionById(num);
          qData = res?.data || res;
        } catch {
          const res2 = await problemService.getProblemById(num);
          qData = res2?.data;
        }

        if (qData && (qData.id || qData.title)) {
          const newOpt: QuestionOption = {
            id: Number(qData.id || num),
            title: qData.title,
            description: qData.description,
            constraints: qData.constraints,
            difficulty: qData.difficultyRefName || qData.difficulty,
            difficultyRefName: qData.difficultyRefName || qData.difficulty,
            topicRefName: qData.topicRefName,
            testCases: qData.testCases,
          };
          setQuestions((prev) => [...prev, newOpt].sort((a, b) => a.id - b.id));
          setSelectedQuestionId(num);
          toast.success(`Loaded Question #${num}: ${qData.title}`);
        } else {
          toast.error(`Question #${num} not found`);
        }
      } catch {
        toast.error(`Question #${num} not found`);
      }
    }
  };

  const handleResetTemplate = () => {
    if (!selectedLangObj || !selectedQuestionId) return;
    const key = `${selectedQuestionId}_${selectedLanguageId}`;
    const starter = getDynamicStarterCode(
      selectedLangObj.name,
      selectedQuestionDetails?.title,
      selectedQuestionId
    );
    setSourceCode(starter);
    setCodeDrafts((prev) => ({ ...prev, [key]: starter }));
    toast.success('Code editor reset to boilerplate template.');
  };

  const handleLoadWorkingSolution = () => {
    if (!selectedLangObj || !selectedQuestionId) return;
    const normLang = selectedLangObj.name.toLowerCase().includes('python')
      ? 'python'
      : selectedLangObj.name.toLowerCase().includes('c++')
      ? 'cpp'
      : selectedLangObj.name.toLowerCase().includes('javascript')
      ? 'javascript'
      : 'java';
    const sample = SAMPLE_WORKING_SOLUTIONS[selectedQuestionId]?.[normLang];
    if (sample) {
      const key = `${selectedQuestionId}_${selectedLanguageId}`;
      setSourceCode(sample);
      setCodeDrafts((prev) => ({ ...prev, [key]: sample }));
      toast.success(`Loaded demo solution for #${selectedQuestionId} (${selectedLangObj.name})`);
    }
  };

  const hasSampleSolution = useMemo(() => {
    if (!selectedQuestionId || !selectedLangObj) return false;
    const normLang = selectedLangObj.name.toLowerCase().includes('python')
      ? 'python'
      : selectedLangObj.name.toLowerCase().includes('c++')
      ? 'cpp'
      : selectedLangObj.name.toLowerCase().includes('javascript')
      ? 'javascript'
      : 'java';
    return Boolean(SAMPLE_WORKING_SOLUTIONS[selectedQuestionId]?.[normLang]);
  }, [selectedQuestionId, selectedLangObj]);

  const executionRequest = useExecutionRequest('dashboard');
  useEffect(() => {
    setIsRunning(false);
    setIsSubmitting(false);
    setResult(null);
    setExecutionMessage('');
  }, []);

  // 1. Admin RUN CODE: executes against SAMPLE test cases
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
      const res = await adminQuestionService.adminTestCode(
        {
          questionId: qId,
          languageId: selectedLangObj?.referenceId ?? selectedLanguageId,
          sourceCode,
        },
        controller.signal
      );
      if (controller.signal.aborted) return;

      const data = (res as any)?.data || res;
      setResult(data);
      setExecutionMessage((res as any)?.message || 'Executed Sample Test Cases Successfully');
      if (isExecutionResultSuccessful(data)) {
        toast.success(`Passed all ${data.totalTestCases} sample test cases!`);
      } else {
        toast.error(`${data.failedTestCases} of ${data.totalTestCases} sample test cases failed.`);
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const detail =
        Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const msg =
        detail && detail !== err?.message
          ? `${err?.message || 'Admin testCode execution failed'}: ${detail}`
          : err?.message || 'Admin testCode execution failed';
      toast.error(msg);
      setExecutionMessage(msg);
      setResult(null);
    } finally {
      if (executionRequest.finish(controller)) setIsRunning(false);
    }
  };

  // 2. Admin SUBMIT CODE: executes against ALL test cases (sample + hidden)
  const handleSubmitAllCases = async () => {
    if (combinedResourcesLoading || !languages.length || !sourceCode.trim()) return;
    const qId = Number(manualQuestionId || selectedQuestionId);
    if (!qId || isNaN(qId) || selectedLanguageId === null || languages.length === 0) {
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
      const res = await adminQuestionService.adminSubmitCode(
        {
          questionId: qId,
          languageId: selectedLangObj?.referenceId ?? selectedLanguageId,
          sourceCode,
        },
        controller.signal
      );
      if (controller.signal.aborted) return;

      const data = (res as any)?.data || res;
      setResult(data);
      setExecutionMessage((res as any)?.message || 'Validated against All Test Cases');
      if (isExecutionResultSuccessful(data)) {
        toast.success(`Accepted! Passed all ${data.totalTestCases} validation test cases.`);
      } else {
        toast.error(`${data.failedTestCases} of ${data.totalTestCases} validation test cases failed.`);
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const detail =
        Array.isArray(err?.errors) && err.errors.length > 0 ? err.errors.join('; ') : err?.error || '';
      const isKnownNpe =
        String(err?.message || detail).includes('getType') ||
        String(err?.message || detail).includes('NullPointerException') ||
        err?.statusCode === 500;

      const msg = isKnownNpe
        ? 'Remote submission engine encountered an evaluation defect on hidden test cases (backend TestCase.getType() NPE). Sample test cases can still be tested via "Run Code".'
        : detail && detail !== err?.message
        ? `${err?.message || 'Admin submitCode failed'}: ${detail}`
        : err?.message || 'Admin submitCode failed';

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

  // Partition sample vs hidden test cases
  const sampleTestCases = useMemo(
    () => selectedQuestionTestCases.filter((tc) => !tc.isHidden),
    [selectedQuestionTestCases]
  );
  const hiddenTestCases = useMemo(
    () => selectedQuestionTestCases.filter((tc) => tc.isHidden),
    [selectedQuestionTestCases]
  );

  return (
    <AdminCard
      title="Admin Code Execution Sandbox"
      subtitle="Execute and validate solutions dynamically against real Judge0 test cases in real-time"
      icon={<Terminal className="w-5 h-5" />}
    >
      <div className="space-y-4 font-sans text-left">
        <RequestStatus
          pending={combinedResourcesLoading}
          error={combinedResourcesError}
          onRetry={() => {
            setResourcesRetry((v) => v + 1);
            void loadQuestionBank();
          }}
          label="Loading dynamic execution options…"
        />

        {/* Dynamic Controls Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl space-y-3">
          {/* Row 1: Search & Question Selection */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Search Input */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Filter / Search Questions
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleBackendSearch();
                  }}
                  placeholder="Filter by title, ID, topic..."
                  disabled={isBusy || combinedResourcesLoading}
                  className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Question Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Select Problem ({filteredQuestions.length} of {totalKnownQuestions || questions.length})
                </label>
                <button
                  type="button"
                  onClick={() => void loadQuestionBank()}
                  title="Reload all questions from server"
                  disabled={isBusy || combinedResourcesLoading}
                  className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-0.5"
                >
                  <RefreshCw className={`w-3 h-3 ${combinedResourcesLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <select
                value={selectedQuestionId ?? ''}
                onChange={handleQuestionSelectChange}
                disabled={isBusy || combinedResourcesLoading || filteredQuestions.length === 0}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {filteredQuestions.map((q) => {
                  const diff = q.difficulty || q.difficultyRefName;
                  return (
                    <option key={q.id} value={q.id}>
                      #{q.id} - {q.title} {diff ? `[${diff}]` : ''}
                    </option>
                  );
                })}
                {filteredQuestions.length === 0 && (
                  <option value="">No matching questions found</option>
                )}
              </select>
            </div>

            {/* Manual ID Input */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Problem ID
              </label>
              <input
                type="number"
                value={manualQuestionId}
                onChange={handleManualQuestionIdChange}
                onBlur={() => void handleManualQuestionIdBlur()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleManualQuestionIdBlur();
                }}
                placeholder="e.g. 1"
                disabled={isBusy || combinedResourcesLoading}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Compiler Runtime Selector */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Runtime
              </label>
              <select
                value={selectedLanguageId ?? ''}
                onChange={handleLanguageChange}
                disabled={isBusy || combinedResourcesLoading || !languages.length}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Action Buttons & Secondary controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>
                Testing against:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  #{selectedQuestionId || '—'} {selectedQuestionDetails?.title || 'Selected Problem'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => void handleBackendSearch()}
                  disabled={isSearchingBackend || isBusy}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Search className="w-3 h-3" />
                  <span>{isSearchingBackend ? 'Searching...' : 'Search Backend'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRunSampleCases}
                disabled={isBusy || combinedResourcesLoading || !languages.length || !sourceCode.trim()}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs hover:shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                title="Execute sample test cases (/api/v1/admin/testCode)"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Running Sample Cases...' : 'Run Code'}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitAllCases}
                disabled={isBusy || combinedResourcesLoading || !languages.length || !sourceCode.trim()}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                title="Submit against all test cases (/api/v1/admin/submitCode)"
              >
                <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
                <span>{isSubmitting ? 'Submitting All...' : 'Submit'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Problem Statement & Test Cases Accordion */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 overflow-hidden transition-all shadow-xs">
          <button
            type="button"
            onClick={() => setIsStatementOpen((prev) => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Problem Statement &amp; Real Test Cases</span>
              {selectedQuestionDetails && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    #{selectedQuestionDetails.id}: {selectedQuestionDetails.title}
                  </span>
                  {selectedQuestionDetails.difficultyRefName && (
                    <AdminBadge
                      variant={
                        selectedQuestionDetails.difficultyRefName.toLowerCase() === 'easy'
                          ? 'success'
                          : selectedQuestionDetails.difficultyRefName.toLowerCase() === 'hard'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {selectedQuestionDetails.difficultyRefName}
                    </AdminBadge>
                  )}
                  {selectedQuestionDetails.topicRefName && (
                    <AdminBadge variant="neutral" size="sm">
                      {selectedQuestionDetails.topicRefName}
                    </AdminBadge>
                  )}
                  <AdminBadge variant="info" size="sm">
                    {selectedQuestionTestCases.length} Test Case{selectedQuestionTestCases.length !== 1 ? 's' : ''}
                  </AdminBadge>
                </>
              )}
            </div>
            {isStatementOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isStatementOpen && (
            <div className="p-4 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 space-y-4 text-xs">
              {loadingQuestionDetails ? (
                <div role="status" aria-label="Loading problem details and test cases" className="space-y-3 py-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></div>
                </div>
              ) : selectedQuestionDetails ? (
                <>
                  {/* Problem Description */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Description
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedQuestionDetails.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Problem Constraints */}
                  {selectedQuestionDetails.constraints && (
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">
                        Constraints
                      </span>
                      <pre className="whitespace-pre-wrap font-mono">
                        {selectedQuestionDetails.constraints}
                      </pre>
                    </div>
                  )}

                  {/* Problem Test Cases Preview Tabs */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Available Test Cases for Problem #{selectedQuestionDetails.id}
                      </span>
                      <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                        <button
                          type="button"
                          onClick={() => setTestCaseTab('sample')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            testCaseTab === 'sample'
                              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Sample ({sampleTestCases.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setTestCaseTab('all')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            testCaseTab === 'all'
                              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          All ({selectedQuestionTestCases.length}{hiddenTestCases.length > 0 ? ` • ${hiddenTestCases.length} Hidden` : ''})
                        </button>
                      </div>
                    </div>

                    {/* Test Cases Grid */}
                    {(testCaseTab === 'sample' ? sampleTestCases : selectedQuestionTestCases).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                        {(testCaseTab === 'sample' ? sampleTestCases : selectedQuestionTestCases).map((tc, idx) => (
                          <div
                            key={tc.id || idx}
                            className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-blue-500" />
                                Test Case #{tc.displayOrder || idx + 1}
                              </span>
                              <AdminBadge variant={tc.isHidden ? 'warning' : 'neutral'} size="sm">
                                {tc.isHidden ? 'Hidden Case' : 'Sample Case'}
                              </AdminBadge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-900">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Input:</span>
                                <pre className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200/60 dark:border-slate-800/60 overflow-x-auto whitespace-pre-wrap max-h-20">
                                  {tc.input}
                                </pre>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Expected:</span>
                                <pre className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200/60 dark:border-slate-800/60 overflow-x-auto whitespace-pre-wrap max-h-20 text-emerald-600 dark:text-emerald-400">
                                  {tc.expectedOutput}
                                </pre>
                              </div>
                            </div>
                            {tc.explanation && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                                Note: {tc.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic py-2">
                        No test cases loaded for this problem. You can run code with custom inputs.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-slate-400 italic py-2">
                  Select a question above to preview its problem statement, constraints, and test cases.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Monaco Editor Container */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="font-semibold">{selectedLangObj?.name || 'Code Editor'}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                Target: Problem #{selectedQuestionId || '—'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {hasSampleSolution && (
                <button
                  type="button"
                  onClick={handleLoadWorkingSolution}
                  className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors cursor-pointer"
                  title="Load verified sample solution for this problem"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Load Demo Solution</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleResetTemplate}
                className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                title="Reset code editor to default boilerplate"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Boilerplate</span>
              </button>
            </div>
          </div>

          <div className="h-80 w-full bg-[#1e1e1e]">
            <Editor
              loading={
                <div role="status" className="w-full p-6">
                  <Skeleton className="h-5 w-3/4" count={8} />
                  <span className="sr-only">Loading code editor</span>
                </div>
              }
              height="100%"
              language={monacoLang}
              value={sourceCode}
              onChange={handleEditorChange}
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

        <RequestStatus
          pending={isRunning || isSubmitting}
          error={!result ? executionMessage : null}
          label={
            isSubmitting
              ? `Submitting and evaluating code against all test cases for Problem #${selectedQuestionId}…`
              : `Running code against sample test cases for Problem #${selectedQuestionId}…`
          }
        />

        {/* Results Console Panel */}
        {result && (
          <div
            ref={resultsRef}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 space-y-4 shadow-xs animate-in fade-in duration-200"
            aria-live="polite"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Execution Output — {executionMode === 'submit' ? 'All Test Cases' : 'Sample Run'} (Problem #{selectedQuestionId})
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <AdminBadge variant="info">Total: {result.totalTestCases}</AdminBadge>
                <AdminBadge variant="success">Passed: {result.passedTestCases}</AdminBadge>
                {result.failedTestCases > 0 && (
                  <AdminBadge variant="danger">Failed: {result.failedTestCases}</AdminBadge>
                )}
                {result.runtimeMs && (
                  <AdminBadge variant="neutral" size="sm">
                    {result.runtimeMs} ms
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
                  const isPassed =
                    tc.status?.toLowerCase() === 'passed' || tc.status?.toLowerCase() === 'accepted';

                  // Cross-reference with problem's test cases to guarantee input & expectedOutput are always visible
                  const matchingFixture =
                    selectedQuestionTestCases.find(
                      (item) => item.id === tc.testCaseId || item.displayOrder === tc.testCaseId
                    ) || selectedQuestionTestCases[idx];

                  const inputToDisplay = tc.input || matchingFixture?.input;
                  const expectedToDisplay = tc.expectedOutput || matchingFixture?.expectedOutput;

                  return (
                    <div
                      key={tc.testCaseId || idx}
                      className={`p-3.5 rounded-xl border text-xs font-mono transition-colors ${
                        isPassed
                          ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40'
                          : 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
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
                          {matchingFixture?.isHidden && (
                            <AdminBadge variant="warning" size="sm">
                              Hidden Test Case
                            </AdminBadge>
                          )}
                        </div>
                        <AdminBadge variant={isPassed ? 'success' : 'danger'} size="sm">
                          {tc.status || (isPassed ? 'Passed' : 'Failed')}
                        </AdminBadge>
                      </div>

                      {/* Details Grid: Input, Expected, Output, Error */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px]">
                        {inputToDisplay && (
                          <div>
                            <span className="text-slate-500 font-semibold block mb-0.5">Input:</span>
                            <pre className="p-2 bg-white/80 dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto whitespace-pre-wrap">
                              {inputToDisplay}
                            </pre>
                          </div>
                        )}
                        {expectedToDisplay && (
                          <div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold block mb-0.5">
                              Expected Output:
                            </span>
                            <pre className="p-2 bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-lg border border-emerald-200 dark:border-emerald-900/40 overflow-x-auto whitespace-pre-wrap">
                              {expectedToDisplay}
                            </pre>
                          </div>
                        )}
                        {tc.actualOutput && (
                          <div>
                            <span className="text-slate-700 dark:text-slate-300 font-semibold block mb-0.5">
                              Actual Output:
                            </span>
                            <pre
                              className={`p-2 rounded-lg border overflow-x-auto whitespace-pre-wrap ${
                                isPassed
                                  ? 'bg-white/80 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80'
                                  : 'bg-rose-100/40 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200'
                              }`}
                            >
                              {tc.actualOutput}
                            </pre>
                          </div>
                        )}
                        {tc.errorMessage && (
                          <div className="md:col-span-3">
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
