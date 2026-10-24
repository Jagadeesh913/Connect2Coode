import type { Problem, QuestionTestCase, QuestionHint } from '../types/domain';
import { extractTestCasesFromProblem, extractConstraintsFromDescription } from '../../features/admin/utils/testCaseUtils';

export type ProblemDto = {
  id?: number | string;
  questionId?: number | string;
  title?: string;
  description?: string;
  constraints?: string;
  difficultyId?: number;
  difficultyName?: string;
  difficultyRefName?: string;
  difficultyRefCode?: string;
  topicId?: number;
  topicName?: string;
  topicRefName?: string;
  topicRefCode?: string;
  isOwnProblem?: boolean;
  isActive?: boolean;
  companies?: Array<string | { name?: string }>;
  questionPlatform?: string;
  platformName?: string;
  examPlatform?: string;
  qpfRefGroupCode?: string;
  qpfRefCode?: string;
  qpfRefName?: string;
  leetCodeUrl?: string;
  gfgUrl?: string;
  hackerRankUrl?: string;
  testCases?: QuestionTestCase[];
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  hints?: string[];
  questionHints?: QuestionHint[];
  codeSnippets?: Record<string, string>;
  acceptanceRate?: string;
  isSolved?: boolean;
  isBookmarked?: boolean;
};

const readCompanies = (companies: ProblemDto['companies']): string[] =>
  Array.isArray(companies)
    ? companies
        .map((company) =>
          typeof company === 'string'
            ? company.trim()
            : typeof company?.name === 'string'
            ? company.name.trim()
            : ''
        )
        .filter(Boolean)
    : [];

export const mapProblemDto = (value: ProblemDto): Problem => {
  const id = value.id === undefined || value.id === null ? '' : String(value.id);
  const questionId =
    value.questionId !== undefined && value.questionId !== null
      ? String(value.questionId)
      : id;
  const title = typeof value.title === 'string' ? value.title : '';
  const description = typeof value.description === 'string' ? value.description : '';
  const difficulty =
    typeof value.difficultyName === 'string'
      ? value.difficultyName
      : typeof value.difficultyRefName === 'string'
      ? value.difficultyRefName
      : '';
  const topic =
    typeof value.topicName === 'string'
      ? value.topicName
      : typeof value.topicRefName === 'string'
      ? value.topicRefName
      : '';
  const questionPlatform =
    typeof value.questionPlatform === 'string'
      ? value.questionPlatform
      : typeof value.platformName === 'string'
      ? value.platformName
      : typeof value.examPlatform === 'string'
      ? value.examPlatform
      : undefined;

  const constraints =
    typeof value.constraints === 'string' && value.constraints.trim()
      ? value.constraints
      : extractConstraintsFromDescription(description) || undefined;

  const testCases: QuestionTestCase[] | undefined = (() => {
    if (Array.isArray(value.testCases) && value.testCases.length > 0) {
      return value.testCases;
    }
    const extracted = extractTestCasesFromProblem({
      id: Number(id) || undefined,
      title,
      description,
      testCases: value.testCases,
      examples: Array.isArray(value.examples) ? value.examples : undefined,
    });
    return extracted.length > 0 ? extracted : undefined;
  })();

  return {
    id,
    questionId,
    // UI route key derived from the authoritative ID, not an API alias.
    slug: id,
    title,
    description,
    constraints,
    difficulty,
    difficultyId: value.difficultyId,
    difficultyRefName: typeof value.difficultyRefName === 'string' ? value.difficultyRefName : undefined,
    difficultyRefCode: typeof value.difficultyRefCode === 'string' ? value.difficultyRefCode : undefined,
    category: topic,
    topic,
    topicId: value.topicId,
    topicRefName: typeof value.topicRefName === 'string' ? value.topicRefName : undefined,
    topicRefCode: typeof value.topicRefCode === 'string' ? value.topicRefCode : undefined,
    companies: readCompanies(value.companies),
    acceptanceRate: value.acceptanceRate ? String(value.acceptanceRate) : '—',
    isSolved: Boolean(value.isSolved),
    isBookmarked: Boolean(value.isBookmarked),
    isOwnProblem: value.isOwnProblem,
    questionPlatform,
    qpfRefName: questionPlatform,
    qpfRefCode: typeof value.qpfRefCode === 'string' ? value.qpfRefCode : undefined,
    qpfRefGroupCode: typeof value.qpfRefGroupCode === 'string' ? value.qpfRefGroupCode : undefined,
    examPlatform: typeof value.examPlatform === 'string' ? value.examPlatform : undefined,
    leetCodeUrl: typeof value.leetCodeUrl === 'string' ? value.leetCodeUrl : undefined,
    gfgUrl: typeof value.gfgUrl === 'string' ? value.gfgUrl : undefined,
    hackerRankUrl: typeof value.hackerRankUrl === 'string' ? value.hackerRankUrl : undefined,
    testCases,
    examples: Array.isArray(value.examples) ? value.examples : undefined,
    hints: Array.isArray(value.hints) ? value.hints.map(String) : undefined,
    questionHints: Array.isArray(value.questionHints) ? value.questionHints : undefined,
    codeSnippets:
      value.codeSnippets && typeof value.codeSnippets === 'object'
        ? value.codeSnippets
        : undefined,
  };
};
