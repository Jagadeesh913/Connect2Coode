import type { QuestionTestCase, Question } from '../../../core/types/domain';

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
 * Canonical visible sample test cases for standard foundational problems
 * when neither the server payload nor the description embeds examples.
 * Note: Contains ONLY visible sample test cases (isHidden: false);
 * hidden evaluation cases remain server-owned.
 */
function getStandardSampleCases(
  numericId?: number,
  title?: string
): QuestionTestCase[] {
  const normTitle = (title || '').toLowerCase().trim();

  // Problem 3: Reverse an Array
  if (
    numericId === 3 ||
    (normTitle.includes('reverse') && normTitle.includes('array'))
  ) {
    return [
      {
        id: 1,
        questionId: numericId || 3,
        input: '6\n1 4 3 2 6 5',
        expectedOutput: '5 6 2 3 4 1',
        explanation: 'The elements of the array are reversed in-place.',
        isHidden: false,
        displayOrder: 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
        typeRefName: 'Visible Sample Test Case',
      },
      {
        id: 2,
        questionId: numericId || 3,
        input: '3\n4 5 2',
        expectedOutput: '2 5 4',
        explanation: 'Reversing array [4, 5, 2] yields [2, 5, 4].',
        isHidden: false,
        displayOrder: 2,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
        typeRefName: 'Visible Sample Test Case',
      },
      {
        id: 3,
        questionId: numericId || 3,
        input: '5\n1 2 3 4 5',
        expectedOutput: '5 4 3 2 1',
        explanation: 'The reverse of [1, 2, 3, 4, 5] is [5, 4, 3, 2, 1].',
        isHidden: false,
        displayOrder: 3,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
        typeRefName: 'Visible Sample Test Case',
      },
    ];
  }

  // Problem 1: Find Largest Element in Array
  if (
    numericId === 1 ||
    (normTitle.includes('largest') && !normTitle.includes('second'))
  ) {
    return [
      {
        id: 1,
        questionId: numericId || 1,
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
        questionId: numericId || 1,
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
        questionId: numericId || 1,
        input: '4\n-1 -2 -3 -4',
        expectedOutput: '-1',
        explanation: '-1 is the largest element among negative integers',
        isHidden: false,
        displayOrder: 3,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
        typeRefName: 'Visible Sample Test Case',
      },
    ];
  }

  // Problem 2: Second Largest Element
  if (
    numericId === 2 ||
    normTitle.includes('second largest') ||
    normTitle.includes('second smallest')
  ) {
    return [
      {
        id: 1,
        questionId: numericId || 2,
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
        questionId: numericId || 2,
        input: '5\n10 10 10 10 10',
        expectedOutput: '-1',
        explanation: 'No distinct second largest element exists',
        isHidden: false,
        displayOrder: 2,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
        typeRefName: 'Visible Sample Test Case',
      },
    ];
  }

  // Problem 4: Sum of Array Elements
  if (
    numericId === 4 ||
    (normTitle.includes('sum') && normTitle.includes('array'))
  ) {
    return [
      {
        id: 1,
        questionId: numericId || 4,
        input: '5\n1 2 3 4 5',
        expectedOutput: '15',
        explanation: 'Sum of elements is 1 + 2 + 3 + 4 + 5 = 15',
        isHidden: false,
        displayOrder: 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
        typeRefName: 'Visible Sample Test Case',
      },
      {
        id: 2,
        questionId: numericId || 4,
        input: '4\n10 20 30 40',
        expectedOutput: '100',
        explanation: '10 + 20 + 30 + 40 = 100',
        isHidden: false,
        displayOrder: 2,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
        typeRefName: 'Visible Sample Test Case',
      },
    ];
  }

  return [];
}

/**
 * Robust test cases resolver for any DSA problem.
 * Evaluates in order:
 * 1. Explicit question.testCases (if non-empty)
 * 2. question.examples array
 * 3. Extracted test cases from question description
 * 4. Fallback visible sample cases for standard foundational problems
 */
export function extractTestCasesFromProblem(
  question?: (Partial<Question> & { examples?: any[]; title?: string }) | null
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

  const numericId = question.id ? Number(question.id) : undefined;

  // 2. Examples array
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

  // 3. Extracted from description
  const desc = question.description || '';
  if (desc) {
    const parsed = parseTestCasesFromMarkdown(desc, numericId);
    if (parsed.length > 0) {
      return parsed;
    }
  }

  // 4. Standard foundational visible sample test cases fallback
  const standardCases = getStandardSampleCases(numericId, question.title);
  if (standardCases.length > 0) {
    return standardCases;
  }

  return [];
}
