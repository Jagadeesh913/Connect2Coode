import type { QuestionTestCase, Question, ReferenceItem } from '../../../core/types/domain';

/**
 * Extracts constraints block from Markdown / text problem descriptions.
 */
export function extractConstraintsFromDescription(description?: string | null): string {
  if (!description) return '';
  const match = description.match(/(?:(?:^|\n)\s*(?:\*\*|##)?\s*Constraints:?\s*(?:\*\*)?)([\s\S]*?)(?=(?:\n\s*(?:Example|Note|Follow-up|Hints|\*\*Example)|\n\n\n|$))/i);
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
function parseTestCasesFromMarkdown(
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

  // Description-derived examples are frontend conveniences, not backend
  // classification records. Never expose invented reference metadata.
  return cases.map((testCase) => ({
    ...testCase,
    typeRefGroupCode: '',
    typeRefCode: '',
    typeRefName: '',
  }));
}

/**
 * Resolves a semantic ReferenceItem from the available TESTCASETYPE reference library options.
 * Never invents defaults: uses ONLY options present in the backend reference library.
 * Preserves existing valid type code if found in options.
 */
export function resolveTestCaseType(
  options: ReferenceItem[],
  isHidden: boolean,
  existingRefCode?: string
): ReferenceItem | undefined {
  if (!Array.isArray(options) || options.length === 0) {
    return undefined;
  }

  // 1. If an existing valid refCode is provided, preserve it if present in options
  if (existingRefCode && existingRefCode.trim()) {
    const matched = options.find(
      (opt) => opt.refCode.toLowerCase() === existingRefCode.trim().toLowerCase()
    );
    if (matched) return matched;
  }

  // 2. Select appropriate option based on visibility (isHidden)
  if (!isHidden) {
    // Prefer exact 'SAMPLE' code
    const sample = options.find((opt) => opt.refCode.toUpperCase() === 'SAMPLE');
    if (sample) return sample;
    // Fall back to any option containing 'sample'
    const sampleLike = options.find(
      (opt) =>
        opt.refCode.toLowerCase().includes('sample') ||
        opt.refName.toLowerCase().includes('sample')
    );
    if (sampleLike) return sampleLike;
    // Fall back to first option that is not marked as hidden/necessary
    const nonHidden = options.find(
      (opt) =>
        !opt.refCode.toLowerCase().includes('hidden') &&
        !opt.refCode.toLowerCase().includes('necessary')
    );
    return nonHidden || options[0];
  } else {
    // Prefer exact 'NECESSARY' code
    const necessary = options.find((opt) => opt.refCode.toUpperCase() === 'NECESSARY');
    if (necessary) return necessary;
    // Prefer exact 'HIDDEN' code
    const hidden = options.find((opt) => opt.refCode.toUpperCase() === 'HIDDEN');
    if (hidden) return hidden;
    // Fall back to any option containing 'necessary' or 'hidden'
    const hiddenLike = options.find(
      (opt) =>
        opt.refCode.toLowerCase().includes('necessary') ||
        opt.refCode.toLowerCase().includes('hidden') ||
        opt.refName.toLowerCase().includes('hidden')
    );
    if (hiddenLike) return hiddenLike;
    // Fall back to second option or first option
    return options[1] || options[0];
  }
}

/**
 * Reconciles test cases with backend reference-library options.
 * Preserves existing valid type codes. Resolves missing/empty type codes using actual backend options.
 * Never invents defaults when options are unavailable.
 */
export function reconcileTestCasesWithReferenceTypes(
  testCases: QuestionTestCase[],
  options: ReferenceItem[]
): QuestionTestCase[] {
  if (!Array.isArray(testCases) || testCases.length === 0) return [];
  if (!Array.isArray(options) || options.length === 0) return testCases;

  return testCases.map((tc) => {
    // If tc already has a non-empty typeRefCode:
    if (tc.typeRefCode && tc.typeRefCode.trim()) {
      const matched = options.find(
        (opt) => opt.refCode.toLowerCase() === tc.typeRefCode.trim().toLowerCase()
      );
      if (matched) {
        return {
          ...tc,
          typeRefGroupCode: matched.refGroupCode || 'TESTCASETYPE',
          typeRefCode: matched.refCode,
          typeRefName: matched.refName || tc.typeRefName || '',
        };
      }
      // Preserve existing valid type even if not in options
      return tc;
    }

    // Otherwise, resolve missing type using reference options and isHidden
    const resolved = resolveTestCaseType(options, Boolean(tc.isHidden));
    if (resolved) {
      return {
        ...tc,
        typeRefGroupCode: resolved.refGroupCode || 'TESTCASETYPE',
        typeRefCode: resolved.refCode,
        typeRefName: resolved.refName || '',
      };
    }

    return tc;
  });
}

/**
 * Robust test cases resolver for any DSA problem.
 * Evaluates in order:
 * 1. Explicit question.testCases (if non-empty)
 * 2. question.examples array
 * 3. Extracted test cases from question description
 * If referenceOptions is provided, resolves test case types using actual backend taxonomy.
 */
export function extractTestCasesFromProblem(
  question?: (Partial<Question> & { examples?: Array<{ input?: unknown; output?: unknown; expectedOutput?: unknown; explanation?: unknown }>; title?: string }) | null,
  referenceOptions?: ReferenceItem[]
): QuestionTestCase[] {
  if (!question) return [];

  let cases: QuestionTestCase[] = [];

  // 1. Explicit question.testCases
  if (Array.isArray(question.testCases) && question.testCases.length > 0) {
    const valid = question.testCases.filter(
      (tc) => tc && (tc.input?.trim() || tc.expectedOutput?.trim())
    );
    if (valid.length > 0) {
      cases = valid.map((tc, idx) => ({
        ...tc,
        displayOrder: tc.displayOrder || idx + 1,
        typeRefGroupCode: tc.typeRefGroupCode || '',
        typeRefCode: tc.typeRefCode || '',
        typeRefName: tc.typeRefName || '',
      }));
    }
  }

  const numericId = question.id ? Number(question.id) : undefined;

  // 2. Examples array
  if (cases.length === 0) {
    const rawExamples = question.examples;
    if (Array.isArray(rawExamples) && rawExamples.length > 0) {
      cases = rawExamples.map((ex, idx: number) => ({
        id: idx + 1,
        questionId: numericId,
        input: String(ex?.input || '').trim(),
        expectedOutput: String(ex?.output || ex?.expectedOutput || '').trim(),
        explanation: String(ex?.explanation || '').trim(),
        isHidden: false,
        displayOrder: idx + 1,
        typeRefGroupCode: '',
        typeRefCode: '',
        typeRefName: '',
      }));
    }
  }

  // 3. Extracted from description
  if (cases.length === 0) {
    const desc = question.description || '';
    if (desc) {
      const parsed = parseTestCasesFromMarkdown(desc, numericId);
      if (parsed.length > 0) {
        cases = parsed.map((testCase) => ({
          ...testCase,
          typeRefGroupCode: '',
          typeRefCode: '',
          typeRefName: '',
        }));
      }
    }
  }

  // If reference options provided, reconcile cases
  if (Array.isArray(referenceOptions) && referenceOptions.length > 0) {
    return reconcileTestCasesWithReferenceTypes(cases, referenceOptions);
  }

  return cases;
}

/**
 * Validates a single test case for admin persistence.
 */
export function validateTestCase(
  tc: QuestionTestCase,
  options?: ReferenceItem[]
): { input?: string; expectedOutput?: string; typeRefCode?: string } | null {
  const errors: { input?: string; expectedOutput?: string; typeRefCode?: string } = {};
  let hasError = false;

  if (!tc.input || !tc.input.trim()) {
    errors.input = 'Input raw string is required';
    hasError = true;
  }
  if (!tc.expectedOutput || !tc.expectedOutput.trim()) {
    errors.expectedOutput = 'Expected output raw string is required';
    hasError = true;
  }
  if (!tc.typeRefCode || !tc.typeRefCode.trim()) {
    errors.typeRefCode = 'Test case type is required';
    hasError = true;
  } else if (Array.isArray(options) && options.length > 0) {
    const isValid = options.some(
      (opt) => opt.refCode.toLowerCase() === tc.typeRefCode.trim().toLowerCase()
    );
    if (!isValid) {
      errors.typeRefCode = 'Select a valid type from the reference library';
      hasError = true;
    }
  }

  return hasError ? errors : null;
}

