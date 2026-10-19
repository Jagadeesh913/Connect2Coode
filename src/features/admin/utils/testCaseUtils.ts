import type { QuestionTestCase, Question } from '../../../core/types/domain';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';

/**
 * Extracts constraints block from Markdown / text problem descriptions.
 */
export function extractConstraintsFromDescription(description?: string | null): string {
  if (!description) return '';
  const match = description.match(/(?:(?:\*\*|##)?\s*Constraints:?\s*(?:\*\*)?)([\s\S]*?)(?=(?:\n\s*(?:Example|Note|Follow-up|Hints|\*\*Example)|\n\n\n|$))/i);
  if (match && match[1]) {
    return match[1]
      .replace(/^[-*•]\s+/gm, '')
      .replace(/```[a-z]*\s*/g, '')
      .replace(/```/g, '')
      .trim();
  }
  return '';
}

/**
 * Parses structured test cases (Input, Output, Explanation) from Markdown / text problem descriptions.
 */
export function parseTestCasesFromMarkdown(
  text?: string | null,
  questionId?: number | string | null
): QuestionTestCase[] {
  if (!text) return [];

  const cases: QuestionTestCase[] = [];
  const qId = questionId ? Number(questionId) : undefined;

  // Pattern 1: Example blocks with Input: ... Output: ... (Explanation: ...)
  const exampleRegex =
    /(?:(?:Example|\*\*Example)\s*\d*[:\s]*)?(?:```[a-z]*\s*)?(?:\*\*|__)?Input:?(?:\*\*|__)?\s*([^\n\r]+(?:(?!\n\s*(?:(?:\*\*|__)?Output|Example|Constraints))[\s\S])*)\s*(?:\*\*|__)?Output:?(?:\*\*|__)?\s*([^\n\r]+(?:(?!\n\s*(?:(?:\*\*|__)?Explanation|Example|Constraints|Input))[\s\S])*?)(?:\s*(?:\*\*|__)?Explanation:?(?:\*\*|__)?\s*([^\n\r]+(?:(?!\n\s*(?:Example|Constraints|Input))[\s\S])*?))?(?=(?:```|\n\s*Example|\n\s*Constraints|$))/gi;

  let match: RegExpExecArray | null;
  let idx = 1;

  while ((match = exampleRegex.exec(text)) !== null) {
    const rawInput = (match[1] || '')
      .replace(/```/g, '')
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .trim();
    const rawOutput = (match[2] || '')
      .replace(/```/g, '')
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .trim();
    const rawExpl = (match[3] || '')
      .replace(/```/g, '')
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .trim();

    if (rawInput && rawOutput) {
      cases.push({
        id: idx,
        questionId: qId,
        input: rawInput,
        expectedOutput: rawOutput,
        explanation: rawExpl || '',
        isHidden: false,
        displayOrder: idx,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
        typeRefName: 'Visible Sample Test Case',
      });
      idx++;
    }
  }

  // Pattern 2: Simpler line-by-line fallback if Pattern 1 found nothing
  if (cases.length === 0) {
    const inputMatches = [...text.matchAll(/(?:^|\n)\s*(?:\*\*)?Input:?(?:\*\*)?\s*`?([^\n`]+)`?/gi)];
    const outputMatches = [...text.matchAll(/(?:^|\n)\s*(?:\*\*)?Output:?(?:\*\*)?\s*`?([^\n`]+)`?/gi)];

    const count = Math.min(inputMatches.length, outputMatches.length);
    for (let i = 0; i < count; i++) {
      const inVal = inputMatches[i][1]?.trim();
      const outVal = outputMatches[i][1]?.trim();
      if (inVal && outVal) {
        cases.push({
          id: i + 1,
          questionId: qId,
          input: inVal,
          expectedOutput: outVal,
          explanation: '',
          isHidden: false,
          displayOrder: i + 1,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: 'SAMPLE',
          typeRefName: 'Visible Sample Test Case',
        });
      }
    }
  }

  return cases;
}

/**
 * Canonical test cases for standard DSA problem bank problems.
 * Directly mirrors the Java execution engine test fixtures.
 */
export const KNOWN_PROBLEM_TEST_CASES: Record<number, QuestionTestCase[]> = {
  1: [
    {
      id: 1,
      questionId: 1,
      input: '5\n1 2 3 4 5',
      expectedOutput: '5',
      explanation: '5 is the largest element in [1, 2, 3, 4, 5]',
      isHidden: false,
      displayOrder: 1,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'SAMPLE',
      typeRefName: 'Visible Sample Test Case',
    },
    {
      id: 2,
      questionId: 1,
      input: '6\n8 10 5 7 9 2',
      expectedOutput: '10',
      explanation: '10 is the largest integer in the array',
      isHidden: false,
      displayOrder: 2,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'SAMPLE',
      typeRefName: 'Visible Sample Test Case',
    },
    {
      id: 3,
      questionId: 1,
      input: '4\n-1 -2 -3 -4',
      expectedOutput: '-1',
      explanation: '-1 is the largest element among negative integers',
      isHidden: false,
      displayOrder: 3,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'SAMPLE',
      typeRefName: 'Visible Sample Test Case',
    },
    {
      id: 4,
      questionId: 1,
      input: '1\n42',
      expectedOutput: '42',
      explanation: 'Single element array has only 42',
      isHidden: true,
      displayOrder: 4,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'NECESSARY',
      typeRefName: 'Hidden Evaluation Test Case',
    },
    {
      id: 5,
      questionId: 1,
      input: '7\n100 200 50 400 300 250 150',
      expectedOutput: '400',
      explanation: 'Maximum value is 400',
      isHidden: true,
      displayOrder: 5,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'NECESSARY',
      typeRefName: 'Hidden Evaluation Test Case',
    },
  ],
  2: [
    {
      id: 1,
      questionId: 2,
      input: '5\n1 2 3 4 5',
      expectedOutput: '4',
      explanation: '4 is the second largest distinct element',
      isHidden: false,
      displayOrder: 1,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'SAMPLE',
      typeRefName: 'Visible Sample Test Case',
    },
    {
      id: 2,
      questionId: 2,
      input: '5\n10 10 10 10 10',
      expectedOutput: '-1',
      explanation: 'No distinct second largest element exists',
      isHidden: false,
      displayOrder: 2,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'SAMPLE',
      typeRefName: 'Visible Sample Test Case',
    },
    {
      id: 3,
      questionId: 2,
      input: '6\n12 35 1 10 34 1',
      expectedOutput: '34',
      explanation: 'Largest is 35, second largest is 34',
      isHidden: true,
      displayOrder: 3,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'NECESSARY',
      typeRefName: 'Hidden Evaluation Test Case',
    },
  ],
};

/**
 * Robust test cases resolver for any DSA problem.
 * Evaluates in order:
 * 1. Explicit question.testCases (if non-empty)
 * 2. Saved local storage test cases (if admin previously saved for this questionId)
 * 3. Canonical seed test cases for standard questions
 * 4. question.examples array
 * 5. Extracted test cases from question description
 */
export function extractTestCasesFromProblem(
  question?: Partial<Question> | null
): QuestionTestCase[] {
  if (!question) return [];

  // 1. Explicit question.testCases
  if (Array.isArray(question.testCases) && question.testCases.length > 0) {
    const valid = question.testCases.filter(
      (tc) => tc && (tc.input?.trim() || tc.expectedOutput?.trim())
    );
    if (valid.length > 0) {
      return valid.map((tc, idx) => ({
        ...tc,
        displayOrder: tc.displayOrder || idx + 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: tc.typeRefCode || (tc.isHidden ? 'NECESSARY' : 'SAMPLE'),
        typeRefName:
          tc.typeRefName ||
          (tc.isHidden ? 'Hidden Evaluation Test Case' : 'Visible Sample Test Case'),
      }));
    }
  }

  // 2. Locally cached admin test cases
  const numericId = question.id ? Number(question.id) : undefined;
  if (numericId) {
    try {
      const cachedStr = userScopedStorage.getItem(`admin_test_cases_${numericId}`);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (Array.isArray(cached) && cached.length > 0) {
          return cached;
        }
      }
    } catch {
      // Ignore cache parse error
    }

    // 3. Known canonical problem test cases
    if (KNOWN_PROBLEM_TEST_CASES[numericId]) {
      return KNOWN_PROBLEM_TEST_CASES[numericId];
    }
  }

  // 4. Examples array
  const rawExamples = (question as any).examples;
  if (Array.isArray(rawExamples) && rawExamples.length > 0) {
    return rawExamples.map((ex: any, idx: number) => ({
      id: idx + 1,
      questionId: numericId,
      input: String(ex.input || '').trim(),
      expectedOutput: String(ex.output || ex.expectedOutput || '').trim(),
      explanation: String(ex.explanation || '').trim(),
      isHidden: false,
      displayOrder: idx + 1,
      typeRefGroupCode: 'TESTCASETYPE',
      typeRefCode: 'SAMPLE',
      typeRefName: 'Visible Sample Test Case',
    }));
  }

  // 5. Extracted from description
  const desc = question.description || '';
  if (desc) {
    const parsed = parseTestCasesFromMarkdown(desc, numericId);
    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [];
}
