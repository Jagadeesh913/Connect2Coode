import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type {
  CodeExecutionPayload,
  ExecutionResult,
  ExecutionTestCaseResult,
  Language,
  QuestionTestCase,
} from '../core/types/domain';

export type { CodeExecutionPayload, ExecutionTestCaseResult };
export type LanguageDropdownItem = Language;
export type ExecutionResultData = ExecutionResult;

let cachedLanguages: LanguageDropdownItem[] | null = null;
let languageFetchPromise: Promise<LanguageDropdownItem[]> | null = null;

export const executionService = {
  /**
   * Fetches supported languages with both Table IDs and Reference IDs.
   * Prioritizes /api/v1/language to get referenceId directly from entity records.
   */
  async getLanguageDropdown(): Promise<LanguageDropdownItem[]> {
    if (cachedLanguages && cachedLanguages.length > 0) {
      return cachedLanguages;
    }

    if (languageFetchPromise) {
      return languageFetchPromise;
    }

    languageFetchPromise = (async () => {
      try {
        // Attempt full language list first as it includes referenceId
        const res: any = await apiClient.get(API_ENDPOINTS.LANGUAGE.BASE);
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const list: LanguageDropdownItem[] = data.map((item: any) => ({
            id: Number(item.id),
            name: item.languageName || item.name || 'Unknown',
            referenceId:
              item.referenceId !== undefined && item.referenceId !== null
                ? Number(item.referenceId)
                : undefined,
            judge0LanguageId: item.judge0LanguageId ? Number(item.judge0LanguageId) : undefined,
            version: item.version,
          }));
          cachedLanguages = list;
          return list;
        }
      } catch {
        // Fall through to dropdown endpoint if base is unavailable
      }

      try {
        const res: any = await apiClient.get(API_ENDPOINTS.LANGUAGE.DROPDOWN);
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const list: LanguageDropdownItem[] = data.map((item: any) => ({
            id: Number(item.id),
            name: item.name || 'Unknown',
            referenceId:
              item.referenceId !== undefined && item.referenceId !== null
                ? Number(item.referenceId)
                : undefined,
          }));
          cachedLanguages = list;
          return list;
        }
      } catch (err) {
        console.warn('Language dropdown fetch failed:', err);
      }

      throw new Error('Supported languages could not be loaded from the backend');
    })().finally(() => {
      languageFetchPromise = null;
    });

    return languageFetchPromise;
  },

  /**
   * Resolves any incoming languageId to the backend required referenceId.
   * Leverages dynamic language registry from GET /api/v1/language.
   */
  async resolveLanguageReferenceId(languageId: number, languageName?: string): Promise<number> {
    const numericId = Number(languageId);

    // Ensure cached languages are populated
    if (!cachedLanguages) {
      await this.getLanguageDropdown().catch(() => {});
    }

    if (cachedLanguages && cachedLanguages.length > 0) {
      // 1. If numericId matches language table ID (e.g. 1), resolve to referenceId (e.g. 5)
      const idMatch = cachedLanguages.find((l) => l.id === numericId);
      if (idMatch?.referenceId) {
        return idMatch.referenceId;
      }

      // 2. If numericId is already a known referenceId, retain it
      const refMatch = cachedLanguages.find((l) => l.referenceId === numericId);
      if (refMatch?.referenceId) {
        return refMatch.referenceId;
      }

      // 3. Fallback match by language name if provided
      if (languageName) {
        const nameMatch = cachedLanguages.find(
          (l) => l.name.toLowerCase() === languageName.toLowerCase()
        );
        if (nameMatch?.referenceId) {
          return nameMatch.referenceId;
        }
      }
    }

    // Fallback deterministic mapping for standard platforms: Table ID (1-4) -> Reference ID (5-8)
    const STATIC_TABLE_TO_REF: Record<number, number> = { 1: 5, 2: 6, 3: 7, 4: 8 };
    if (STATIC_TABLE_TO_REF[numericId]) {
      return STATIC_TABLE_TO_REF[numericId];
    }

    // If numericId is already a known reference ID (5-8), retain it
    if (numericId >= 5 && numericId <= 8) {
      return numericId;
    }

    // If no dynamic match found but numericId is positive, return it as fallback
    if (numericId > 0) {
      return numericId;
    }

    throw new Error(
      languageName
        ? `No backend reference mapping found for language: ${languageName}`
        : `No backend reference mapping found for language id: ${numericId}`
    );
  },

  /**
   * Prepares and sanitizes code execution payload:
   * 1. Resolves languageId to referenceId (e.g. 1 -> 5)
   * 2. Sanitizes Java classes to `public class Main` for Judge0 compatibility
   */
  async prepareExecutionPayload(payload: CodeExecutionPayload): Promise<CodeExecutionPayload> {
    const resolvedLanguageId = await this.resolveLanguageReferenceId(payload.languageId);
    let sanitizedCode = payload.sourceCode || '';

    // Check if Java via cached registry or fallback reference ID 5
    const isJava =
      cachedLanguages?.some(
        (l) =>
          (l.id === payload.languageId || l.referenceId === resolvedLanguageId) &&
          l.name.toLowerCase().includes('java') &&
          !l.name.toLowerCase().includes('script')
      ) || resolvedLanguageId === 5;

    if (isJava) {
      if (/public\s+class\s+Solution\b/.test(sanitizedCode)) {
        sanitizedCode = sanitizedCode.replace(/public\s+class\s+Solution\b/g, 'public class Main');
      }
    }

    return {
      questionId: Number(payload.questionId),
      languageId: resolvedLanguageId,
      sourceCode: sanitizedCode,
    };
  },

  /**
   * POST /api/v1/runCode
   * Normal user RUN: executes sample / visible test cases only.
   */
  async runCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.USER_RUN, finalPayload);
    return res?.data || res;
  },

  /**
   * POST /api/v1/submitCode
   * Normal user SUBMIT: executes all test cases (visible, mandatory, edge, hidden).
   */
  async submitCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.USER_SUBMIT, finalPayload);
    return res?.data || res;
  },

  /**
   * POST /api/v1/admin/testCode
   * Admin user RUN: executes sample / visible test cases for testing without persistence.
   * Backend authorization remains authoritative; no privileged-to-user endpoint fallback.
   */
  async adminTestCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_RUN, finalPayload);
    return res?.data || res;
  },

  /**
   * POST /api/v1/admin/submitCode
   * Admin user SUBMIT: executes all test cases for validation without persistence.
   * Backend authorization remains authoritative; no privileged-to-user endpoint fallback.
   */
  async adminSubmitCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_SUBMIT, finalPayload);
    return res?.data || res;
  },

  /**
   * Fetches real live execution test cases for a question directly from backend execution engine
   */
  async getProblemTestCases(questionId: number | string): Promise<QuestionTestCase[]> {
    const qId = Number(questionId);
    if (!qId) return [];

    try {
      const res = await this.runCode({
        questionId: qId,
        languageId: 5,
        sourceCode: 'public class Main { public static void main(String[] args) {} }',
      });
      const cases = res?.testCases || (res as any)?.data?.testCases;
      if (Array.isArray(cases) && cases.length > 0) {
        return cases.map((tc: any, idx: number) => ({
          id: tc.testCaseId || idx + 1,
          questionId: qId,
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          explanation: tc.explanation || '',
          isHidden: Boolean(tc.isHidden),
          displayOrder: idx + 1,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: tc.testCaseType?.toLowerCase().includes('sample') ? 'SAMPLE' : 'NECESSARY',
          typeRefName: tc.testCaseType || 'Visible Sample Test Case',
        }));
      }
    } catch {}

    return [];
  },
};
