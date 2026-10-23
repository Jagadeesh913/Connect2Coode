import { RequestStatus } from '../../../shared/components/ui/RequestStatus';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTable, Column } from '../components/AdminTable';
import { AdminBadge } from '../components/AdminBadge';
import { AdminErrorState } from '../components/AdminErrorState';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { QuestionFormModal, QuestionFormData } from '../components/questions/QuestionFormModal';
import { QuestionDetailsModal } from '../components/questions/QuestionDetailsModal';
import { TestCaseModal } from '../components/questions/TestCaseModal';
import { AdminCodeTestModal } from '../components/questions/AdminCodeTestModal';
import { QuestionPayload, QuestionTestCase } from '../../../services/questionService';
import { adminQuestionService } from '../../../services/admin/adminQuestionService';
import { adminCompanyService } from '../../../services/admin/adminCompanyService';
import { toast } from 'react-hot-toast';
import { getActionableErrorMessage } from '../../../core/validation';
import { extractTestCasesFromProblem, extractConstraintsFromDescription } from '../utils/testCaseUtils';
import {
  Plus,
  RotateCw,
  Search,
  Eye,
  Edit3,
  Layers,
  Terminal,
} from 'lucide-react';
import { useReferenceGroup } from '../../references/hooks/useReferenceGroup';

export const AdminQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Filter States
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Reference Library & Companies Data for Filters
  const { items: difficulties } = useReferenceGroup('DIFF');
  const { items: topics } = useReferenceGroup('TOPIC');
  const { items: qpfs } = useReferenceGroup('QPF');
  const [companies, setCompanies] = useState<any[]>([]);

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isTestCaseOpen, setIsTestCaseOpen] = useState<boolean>(false);
  const [isTestCodeOpen, setIsTestCodeOpen] = useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionPayload | null>(null);
  const [targetQuestionForTestCases, setTargetQuestionForTestCases] = useState<QuestionPayload | null>(null);
  const [targetQuestionForTestCode, setTargetQuestionForTestCode] = useState<{ id: number | string; title: string; difficultyRefName?: string } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Search Debouncing
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPageNumber(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Companies use their own API/store domain; reference groups are shared by Redux.
  useEffect(() => {
    let active = true;
    const fetchCompanies = async () => {
      try {
        const compRes = await adminCompanyService.getCompanies();
        if (!active) return;
        const compList = compRes.data;
        setCompanies(Array.isArray(compList) ? compList : []);
      } catch (err) {
        console.warn('Failed to load company filter data:', err);
      }
    };
    void fetchCompanies();
    return () => {
      active = false;
    };
  }, []);

  /**
   * REAL API ONLY — POST /api/v1/questions
   * Fetches paginated questions from Java Spring Boot Backend.
   */
  const fetchQuestions = useCallback(async () => {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const levelArr: number[] | null = selectedDifficulty && !isNaN(Number(selectedDifficulty)) ? [Number(selectedDifficulty)] : null;
      const topicArr: number[] | null = selectedTopic && !isNaN(Number(selectedTopic)) ? [Number(selectedTopic)] : null;
      const compArr: number[] | null = selectedCompany && !isNaN(Number(selectedCompany)) ? [Number(selectedCompany)] : null;

      const res = await adminQuestionService.getQuestions(
        {
          level: levelArr,
          companies: compArr,
          topic: topicArr,
          searchText: debouncedSearch.trim() ? debouncedSearch.trim() : null,
          pageRequest: {
            pageNumber,
            pageSize,
            sortBy: 'id',
            sortDirection: 'ASC',
          },
        },
        controller.signal
      );

      if (controller.signal.aborted) return;

      const pageData = res.data;

      const contentList: QuestionPayload[] = (
        Array.isArray(pageData?.content)
          ? pageData.content
          : []
      ).map((item: any) => {
        const finalCompanies = item.companies;
        const finalPlatform = item.questionPlatform || item.qpfRefName || item.platformName;
        const finalPlatformCode = item.qpfRefCode;

        return {
          ...item,
          companies: finalCompanies,
          questionPlatform: finalPlatform,
          qpfRefName: finalPlatform,
          qpfRefCode: finalPlatformCode,
        };
      });

      const total = typeof pageData?.totalElements === 'number'
        ? pageData.totalElements
        : contentList.length;

      const computedPages = typeof pageData?.totalPages === 'number' && pageData.totalPages > 0
        ? pageData.totalPages
        : Math.max(1, Math.ceil(total / pageSize));

      setQuestions(contentList);
      setTotalElements(total);
      setTotalPages(computedPages);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setError(getActionableErrorMessage(err, 'Failed to fetch question bank records.'));

    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [pageNumber, pageSize, selectedDifficulty, selectedTopic, selectedCompany, debouncedSearch]);

  useEffect(() => {
    fetchQuestions();
    return () => {
      searchAbortRef.current?.abort();
    };
  }, [fetchQuestions]);

  const handleInspect = async (questionOrId: QuestionPayload | string | number) => {
    let questionRow: QuestionPayload | null = null;
    let qId: string | number;

    if (typeof questionOrId === 'object' && questionOrId !== null) {
      questionRow = questionOrId;
      qId = questionOrId.id || '';
    } else {
      qId = questionOrId;
      questionRow = questions.find((q) => String(q.id) === String(qId)) || null;
    }

    if (questionRow) {
      const cases = (questionRow.testCases && questionRow.testCases.length > 0)
        ? questionRow.testCases
        : extractTestCasesFromProblem(questionRow);
      const enrichedRow: QuestionPayload = {
        ...questionRow,
        testCases: cases,
        constraints: questionRow.constraints || extractConstraintsFromDescription(questionRow.description),
      };
      setSelectedQuestion(enrichedRow);
      setIsDetailsOpen(true);

      // Asynchronously enrich with live execution test cases if still empty
      if (cases.length === 0 && qId) {
        adminQuestionService.getTestCases(qId).then((fetchedCases) => {
          if (fetchedCases && fetchedCases.length > 0) {
            setSelectedQuestion((prev) => (String(prev?.id) === String(qId) ? { ...prev!, testCases: fetchedCases } : prev));
          }
        }).catch(() => {});
      }
    } else if (qId) {
      setDetailsLoading(true);
      setIsDetailsOpen(true);
      try {
        const res = await adminQuestionService.getQuestionById(qId);
        const detailedData = res.data;
        if (detailedData) {
          const cases = (detailedData.testCases && detailedData.testCases.length > 0)
            ? detailedData.testCases
            : extractTestCasesFromProblem(detailedData);
          setSelectedQuestion({
            ...detailedData,
            testCases: cases,
            constraints: detailedData.constraints || extractConstraintsFromDescription(detailedData.description),
          });
        }
      } catch (err: any) {
        toast.error(getActionableErrorMessage(err, 'Failed to load question statement.'));
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  const handleEditClick = async (question: QuestionPayload) => {
    if (!question.id) return;
    const initialCases = (question.testCases && question.testCases.length > 0)
      ? question.testCases
      : extractTestCasesFromProblem(question);

    const enriched: QuestionPayload = {
      ...question,
      testCases: initialCases,
      constraints: question.constraints || extractConstraintsFromDescription(question.description),
    };
    setSelectedQuestion(enriched);
    setIsFormOpen(true);

    // If initial test cases were empty, fetch them asynchronously and update form
    if (initialCases.length === 0) {
      try {
        const fetchedCases = await adminQuestionService.getTestCases(question.id);
        if (fetchedCases && fetchedCases.length > 0) {
          setSelectedQuestion((prev) => (prev ? { ...prev, testCases: fetchedCases } : prev));
        }
      } catch {
        // Form remains usable
      }
    }
  };

  const handleCreateClick = () => {
    setSelectedQuestion(null);
    setIsFormOpen(true);
  };

  const handleSaveQuestion = async (formData: QuestionFormData) => {
    setSubmitting(true);
    try {
      const questionId = formData.id ? Number(formData.id) : undefined;
      const matchedQpf = qpfs.find(
        (q) =>
          (formData.qpfRefCode && q.refCode.toUpperCase() === formData.qpfRefCode.toUpperCase()) ||
          (formData.qpfRefName && q.refName.toLowerCase() === formData.qpfRefName.toLowerCase())
      );
      const platformName = formData.qpfRefName || matchedQpf?.refName || '';

      // Resolve company entities with IDs from companies list
      const resolvedCompanies: { id?: number; name: string }[] = [];
      for (const c of (formData.companies || [])) {
        const cName = (typeof c === 'string' ? c : (c as any)?.name || (c as any)?.companyName || '').trim();
        if (!cName) continue;
        const match = companies.find((comp) => comp.name.toLowerCase() === cName.toLowerCase());
        const cId = (typeof c === 'object' && c !== null && (c as any).id) ? Number((c as any).id) : match?.id;
        resolvedCompanies.push({
          id: cId ? Number(cId) : undefined,
          name: cName,
        });
      }

      let companiesToSubmit: any[] | undefined = undefined;

      if (!questionId) {
        // Creating new question: submit all companies that have an ID
        const validCompanies = resolvedCompanies.filter((c) => typeof c.id === 'number' && c.id > 0);
        companiesToSubmit = validCompanies.length > 0 ? validCompanies : undefined;
      } else {
        // Updating existing question:
        // PostgreSQL join table "questionCompanies" has unique constraint "uk_questionCompanies_question_company".
        // Spring Boot executes "insert into questionCompanies (companyId, questionId) values (?,?)"
        // for each company in the payload. Resending already linked companies triggers a duplicate key error.
        // Therefore, we only send newly associated companies to the database.
        const originalQuestion =
          selectedQuestion?.id === questionId
            ? selectedQuestion
            : questions.find((q) => q.id === questionId);

        const originalCompanies = originalQuestion?.companies || [];
        const existingNames = new Set<string>();
        const existingIds = new Set<number>();

        originalCompanies.forEach((c: any) => {
          const cName = (typeof c === 'string' ? c : c?.name || c?.companyName || '').toLowerCase().trim();
          if (cName) existingNames.add(cName);
          if (typeof c === 'object' && c !== null && c.id) {
            existingIds.add(Number(c.id));
          } else if (cName) {
            const match = companies.find((comp) => comp.name.toLowerCase() === cName);
            if (match?.id) existingIds.add(Number(match.id));
          }
        });

        const newOnly = resolvedCompanies.filter(
          (c) =>
            typeof c.id === 'number' &&
            c.id > 0 &&
            !existingIds.has(c.id) &&
            !existingNames.has(c.name.toLowerCase())
        );

        companiesToSubmit = newOnly.length > 0 ? newOnly : undefined;
      }

      const questionPayload: QuestionPayload = {
        id: questionId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        constraints: formData.constraints ? formData.constraints.trim() : '',
        difficultyRefGroupCode: formData.difficultyRefGroupCode || 'DIFF',
        difficultyRefCode: formData.difficultyRefCode,
        difficultyRefName: formData.difficultyRefName,
        topicRefGroupCode: formData.topicRefGroupCode || 'TOPIC',
        topicRefCode: formData.topicRefCode,
        topicRefName: formData.topicRefName,
        qpfRefGroupCode: formData.qpfRefGroupCode || 'QPF',
        qpfRefCode: formData.qpfRefCode,
        qpfRefName: platformName,
        questionPlatform: platformName,
        leetCodeUrl: formData.leetCodeUrl ? formData.leetCodeUrl.trim() : '',
        gfgUrl: formData.gfgUrl ? formData.gfgUrl.trim() : '',
        hackerRankUrl: formData.hackerRankUrl ? formData.hackerRankUrl.trim() : '',
        isOwnProblem: formData.isOwnProblem === true,
        isActive: formData.isActive ?? true,
        askedDate: formData.askedDate && formData.askedDate.trim() !== '' ? formData.askedDate.trim() : null,
        questionHints: formData.questionHints || [],
        ...(companiesToSubmit !== undefined ? { companies: companiesToSubmit } : {}),
        testCases: formData.testCases || [],
      };

      const res = await adminQuestionService.saveOrUpdateQuestion(questionPayload);
      const savedQuestion: any = res?.data || res;
      const targetQuestionId = savedQuestion?.id || questionId;

      if (targetQuestionId) {
        // Optimistically update local questions state
        setQuestions((prev) =>
          prev.map((q) => {
            if (q.id === targetQuestionId) {
              return {
                ...q,
                ...formData,
                id: targetQuestionId,
                companies: formData.companies || [],
                questionPlatform: platformName,
                qpfRefName: platformName,
                qpfRefCode: formData.qpfRefCode,
              };
            }
            return q;
          })
        );

        if (selectedQuestion?.id === targetQuestionId) {
          setSelectedQuestion((prev) =>
            prev
              ? {
                  ...prev,
                  ...formData,
                  id: targetQuestionId,
                  companies: formData.companies || [],
                  questionPlatform: platformName,
                  qpfRefName: platformName,
                  qpfRefCode: formData.qpfRefCode,
                }
              : prev
          );
        }
      }

      // Attach test cases if provided
      if (targetQuestionId && Array.isArray(formData.testCases) && formData.testCases.length > 0) {
        try {
          const testCasesPayload: QuestionTestCase[] = formData.testCases.map((tc, idx) => ({
            id: tc.id,
            questionId: targetQuestionId,
            input: tc.input.trim(),
            expectedOutput: tc.expectedOutput.trim(),
            explanation: tc.explanation ? tc.explanation.trim() : '',
            isHidden: tc.isHidden === true,
            displayOrder: idx + 1,
            typeRefGroupCode: 'TESTCASETYPE',
            typeRefCode: tc.typeRefCode || (tc.isHidden ? 'NECESSARY' : 'SAMPLE'),
            typeRefName: tc.typeRefName,
          }));
          await adminQuestionService.addTestCases(targetQuestionId, testCasesPayload);
        } catch (tcErr: any) {
          console.warn('Backend rejected test case attachment:', tcErr);
        }
      }

      toast.success(formData.id ? 'Question updated successfully!' : 'Question published successfully!');
      setIsFormOpen(false);
      await fetchQuestions();
    } catch (err: any) {
      toast.error(getActionableErrorMessage(err, 'Failed to save question entity.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyVariant = (diff?: string) => {
    const d = (diff || '').toLowerCase();
    if (d.includes('easy') || d.includes('basic')) return 'easy';
    if (d.includes('med')) return 'medium';
    if (d.includes('hard')) return 'hard';
    return 'neutral';
  };

  const columns: Column<QuestionPayload>[] = [
    {
      header: 'Identifier',
      accessorKey: 'id',
      className: 'w-20 font-mono text-slate-400 font-semibold',
      cell: (row) => <span>#{row.id}</span>,
    },
    {
      header: 'Problem Title',
      className: 'min-w-[260px]',
      cell: (row: any) => {
        const platform =
          row.questionPlatform ||
          row.qpfRefName ||
          row.platformName ||
          row.examPlatform ||
          row.platform ||
          (row.isOwnProblem ? 'Custom In-House' : 'Connect 2 Code');
        return (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {row.title}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Platform: {platform}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Difficulty',
      className: 'w-28',
      cell: (row: any) => {
        const diff =
          row.difficultyRefName ||
          row.difficultyName ||
          row.difficulty ||
          row.difficultyRefCode ||
          'Medium';
        return (
          <AdminBadge
            variant={getDifficultyVariant(diff)}
            size="sm"
          >
            {diff}
          </AdminBadge>
        );
      },
    },
    {
      header: 'Category / Topic',
      className: 'w-36',
      cell: (row: any) => {
        const topic =
          row.topicRefName ||
          row.topicName ||
          row.category ||
          row.topic ||
          'General';
        return (
          <AdminBadge variant="primary" size="sm">
            {topic}
          </AdminBadge>
        );
      },
    },
    {
      header: 'Hiring Partners',
      className: 'min-w-[140px] hidden lg:table-cell',
      cell: (row: any) => {
        const companyList = Array.isArray(row.companies)
          ? row.companies
              .map((c: any) =>
                typeof c === 'object' && c !== null ? c.name || c.companyName || '' : String(c)
              )
              .filter(Boolean)
          : [];
        if (companyList.length === 0) {
          return <span className="text-slate-400 text-xs italic">None</span>;
        }
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {companyList.slice(0, 2).map((name: string, i: number) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-semibold"
              >
                {name}
              </span>
            ))}
            {companyList.length > 2 && (
              <span className="text-[10px] text-slate-400 font-mono">
                +{companyList.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      className: 'w-36 text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleInspect(row)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-2xs cursor-pointer"
            title="Inspect Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleEditClick(row)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer"
            title="Edit Problem"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (row.id) {
                const enrichedRow: QuestionPayload = {
                  ...row,
                  testCases: (row.testCases && row.testCases.length > 0)
                    ? row.testCases
                    : extractTestCasesFromProblem(row),
                  constraints: row.constraints || extractConstraintsFromDescription(row.description),
                };
                setTargetQuestionForTestCases(enrichedRow);
                setIsTestCaseOpen(true);
              }
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-400 transition-colors shadow-2xs cursor-pointer"
            title="Manage Test Cases"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (row.id) {
                setTargetQuestionForTestCode({
                  id: row.id,
                  title: row.title,
                  difficultyRefName: row.difficultyRefName,
                });
                setIsTestCodeOpen(true);
              }
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 hover:border-purple-400 transition-colors shadow-2xs cursor-pointer"
            title="Run Code Sandbox"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      <RequestStatus error={questions.length ? error : null} onRetry={fetchQuestions} />
      {/* Page Header */}
      <AdminPageHeader
        title="DSA Problem Bank"
        description="Index coding challenges, manage Judge0 sample and hidden assertions, and configure company tags."
        badge={
          <AdminBadge variant="primary">
            {totalElements} Problems
          </AdminBadge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Question</span>
            </button>
            <button
              onClick={fetchQuestions}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search problems by title..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Difficulty */}
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPageNumber(0);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulties</option>
            {difficulties.map((d) => (
              <option key={d.id} value={d.id}>
                {d.refName}
              </option>
            ))}
          </select>

          {/* Topic */}
          <select
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setPageNumber(0);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.refName}
              </option>
            ))}
          </select>

          {/* Company */}
          <select
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              setPageNumber(0);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageNumber(0);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && questions.length === 0 && <AdminErrorState message={error} onRetry={fetchQuestions} />}

      {/* Questions Table */}
      {(!error || questions.length > 0) && (
        <div className="space-y-4">
          <AdminTable<QuestionPayload>
            columns={columns}
            data={questions}
            loading={loading}
            keyExtractor={(row) => row.id || row.title}
            onRowClick={(row) => handleInspect(row)}
            emptyTitle="No Questions Found"
            emptyDescription="There are currently no DSA problems matching your active filter criteria."
            emptyAction={
              <button
                onClick={handleCreateClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Question</span>
              </button>
            }
          />

          {/* Pagination */}
          {totalElements > 0 && (
            <Pagination
              currentPage={pageNumber + 1}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={(p) => setPageNumber(p - 1)}
            />
          )}
        </div>
      )}

      {/* Question Form Modal (Create / Edit) */}
      <QuestionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveQuestion}
        initialData={selectedQuestion}
        submitting={submitting}
      />

      {/* Question Details Modal */}
      <QuestionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        question={selectedQuestion}
        loading={detailsLoading}
        onOpenTestCode={(q) => {
          setTargetQuestionForTestCode({
            id: q.id!,
            title: q.title,
            difficultyRefName: q.difficultyRefName,
          });
          setIsTestCodeOpen(true);
        }}
      />

      {/* TestCase Modal */}
      <TestCaseModal
        isOpen={isTestCaseOpen}
        onClose={() => {
          setIsTestCaseOpen(false);
          setTargetQuestionForTestCases(null);
        }}
        questionId={targetQuestionForTestCases?.id || null}
        questionTitle={targetQuestionForTestCases?.title}
        question={targetQuestionForTestCases}
        onSuccess={() => fetchQuestions()}
      />

      {/* Admin Code Test Modal */}
      <AdminCodeTestModal
        isOpen={isTestCodeOpen}
        onClose={() => {
          setIsTestCodeOpen(false);
          setTargetQuestionForTestCode(null);
        }}
        question={targetQuestionForTestCode}
      />
    </div>
  );
};

export default AdminQuestions;
