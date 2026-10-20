import type { Problem, QuestionTestCase } from '../types/domain';
import { extractTestCasesFromProblem } from '../../features/admin/utils/testCaseUtils';

type ProblemDto = Record<string, unknown> | Problem;

interface ProblemMappingContext {
  fallbackCompany?: string;
  fallbackTopic?: string;
}

const readCompanies = (value: unknown, fallbackCompany?: string): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((company) => {
        if (typeof company === 'object' && company !== null) {
          const item = company as Record<string, unknown>;
          return String(item.name || item.companyName || '').trim();
        }
        return String(company).trim();
      })
      .filter(Boolean);
  }

  return fallbackCompany ? [fallbackCompany] : [];
};

export const KNOWN_QUESTION_PLATFORMS: Record<string, { refCode: string; refName: string }> = {
  '1': { refCode: 'HACKERRANK', refName: 'HackerRank' },
  '2': { refCode: 'LEETCODE', refName: 'LeetCode' },
  '3': { refCode: 'GFG', refName: 'GeeksforGeeks' },
  '4': { refCode: 'AON', refName: 'AON Assessment Platform' },
  '5': { refCode: 'TCSION', refName: 'TCS iON Digital Exam Platform' },
  '6': { refCode: 'LEETCODE', refName: 'LeetCode' },
  '7': { refCode: 'LEETCODE', refName: 'LeetCode' },
  '8': { refCode: 'GFG', refName: 'GeeksforGeeks' },
  '9': { refCode: 'HACKERRANK', refName: 'HackerRank' },
  '10': { refCode: 'AON', refName: 'AON Assessment Platform' },
  '11': { refCode: 'TCSION', refName: 'TCS iON Digital Exam Platform' },
  '12': { refCode: 'LEETCODE', refName: 'LeetCode' },
  '13': { refCode: 'LEETCODE', refName: 'LeetCode' },
  '14': { refCode: 'GFG', refName: 'GeeksforGeeks' },
  '15': { refCode: 'HACKERRANK', refName: 'HackerRank' },
  '16': { refCode: 'TCSION', refName: 'TCS iON Digital Exam Platform' },
  '17': { refCode: 'LEETCODE', refName: 'LeetCode' },
  '18': { refCode: 'HACKERRANK', refName: 'HackerRank' },
  '19': { refCode: 'LEETCODE', refName: 'LeetCode' },
  '20': { refCode: 'GFG', refName: 'GeeksforGeeks' },
  '21': { refCode: 'LEETCODE', refName: 'LeetCode' },
  '22': { refCode: 'METTL', refName: 'Mettl Online Assessment Platform' },
  '23': { refCode: 'HACKERRANK', refName: 'HackerRank' },
  '24': { refCode: 'LEETCODE', refName: 'LeetCode' },
  '26': { refCode: 'HACKERRANK', refName: 'HackerRank' },
  '28': { refCode: 'LEETCODE', refName: 'LeetCode' },
};

export const mapProblemDto = (
  value: ProblemDto,
  context: ProblemMappingContext = {}
): Problem => {
  const rawValue = value as Record<string, unknown>;
  const rawId = rawValue.id ?? rawValue._id ?? '';
  const knownPlatform = KNOWN_QUESTION_PLATFORMS[String(rawId)] || {
    refCode: 'CONNECT2CODE',
    refName: 'Connect 2 Code',
  };

  const qpfRefName = rawValue.qpfRefName
    ? String(rawValue.qpfRefName)
    : rawValue.examPlatform
    ? String(rawValue.examPlatform)
    : rawValue.platformName
    ? String(rawValue.platformName)
    : rawValue.platform
    ? String(rawValue.platform)
    : knownPlatform.refName;

  const qpfRefCode = rawValue.qpfRefCode
    ? String(rawValue.qpfRefCode)
    : rawValue.platformCode
    ? String(rawValue.platformCode)
    : knownPlatform.refCode;

  const topic =
    rawValue.topicName ||
    rawValue.topicRefName ||
    rawValue.category ||
    rawValue.topic ||
    context.fallbackTopic ||
    '';
  const difficulty =
    rawValue.difficultyName ||
    rawValue.difficultyRefName ||
    rawValue.difficulty ||
    rawValue.level ||
    '';

  return {
    id: String(rawId),
    title: String(rawValue.title || rawValue.name || ''),
    slug: String(rawValue.slug || rawId),
    difficulty: String(difficulty),
    difficultyId:
      rawValue.difficultyId !== undefined
        ? Number(rawValue.difficultyId)
        : rawValue.levelId !== undefined
        ? Number(rawValue.levelId)
        : undefined,
    category: String(topic),
    topic: String(topic),
    topicId: rawValue.topicId !== undefined ? Number(rawValue.topicId) : undefined,
    companies: readCompanies(rawValue.companies, context.fallbackCompany),
    acceptanceRate:
      rawValue.acceptanceRate !== undefined && rawValue.acceptanceRate !== null
        ? String(rawValue.acceptanceRate)
        : '—',
    isSolved: !!rawValue.isSolved,
    isBookmarked: !!rawValue.isBookmarked,
    isOwnProblem:
      rawValue.isOwnProblem !== undefined ? !!rawValue.isOwnProblem : undefined,
    leetCodeUrl: rawValue.leetCodeUrl ? String(rawValue.leetCodeUrl) : undefined,
    gfgUrl: rawValue.gfgUrl ? String(rawValue.gfgUrl) : undefined,
    hackerRankUrl: rawValue.hackerRankUrl ? String(rawValue.hackerRankUrl) : undefined,
    description: rawValue.description ? String(rawValue.description) : '',
    constraints: rawValue.constraints ? String(rawValue.constraints) : undefined,
    difficultyRefName: rawValue.difficultyRefName ? String(rawValue.difficultyRefName) : undefined,
    difficultyRefCode: rawValue.difficultyRefCode ? String(rawValue.difficultyRefCode) : undefined,
    topicRefName: rawValue.topicRefName ? String(rawValue.topicRefName) : undefined,
    topicRefCode: rawValue.topicRefCode ? String(rawValue.topicRefCode) : undefined,
    qpfRefGroupCode: rawValue.qpfRefGroupCode ? String(rawValue.qpfRefGroupCode) : 'QPF',
    qpfRefCode: qpfRefCode,
    qpfRefName: qpfRefName,
    examPlatform: rawValue.examPlatform ? String(rawValue.examPlatform) : qpfRefName,
    questionHints: Array.isArray(rawValue.questionHints) ? rawValue.questionHints : undefined,
    hints: Array.isArray(rawValue.hints) ? rawValue.hints.map(String) : undefined,
    testCases: (() => {
      const explicit = Array.isArray(rawValue.testCases) ? (rawValue.testCases as QuestionTestCase[]) : undefined;
      if (explicit && explicit.length > 0) return explicit;
      const extracted = extractTestCasesFromProblem({
        id: Number(rawId) || undefined,
        description: rawValue.description ? String(rawValue.description) : '',
        testCases: explicit,
        examples: Array.isArray(rawValue.examples) ? rawValue.examples : undefined,
      });
      return extracted.length > 0 ? extracted : undefined;
    })(),
    codeSnippets:
      rawValue.codeSnippets && typeof rawValue.codeSnippets === 'object'
        ? (rawValue.codeSnippets as Record<string, string>)
        : undefined,
    examples: Array.isArray(rawValue.examples) ? rawValue.examples : undefined,
  };
};
