import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type {
  CodeExecutionPayload,
  ExecutionResult,
  ExecutionTestCaseResult,
  Language,
} from '../core/types/domain';

export type { CodeExecutionPayload, ExecutionTestCaseResult };
export type LanguageDropdownItem = Language;
export type ExecutionResultData = ExecutionResult;

export const normalizeExecutionResult = (value: unknown): ExecutionResultData => {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const testCases = Array.isArray(raw.testCases) ? raw.testCases : [];
  const passedTestCases = Number(raw.passedTestCases ?? 0);
  const failedTestCases = Number(raw.failedTestCases ?? 0);
  const totalTestCases = Number(raw.totalTestCases ?? testCases.length);

  return {
    totalTestCases: Number.isFinite(totalTestCases) ? totalTestCases : testCases.length,
    passedTestCases: Number.isFinite(passedTestCases) ? passedTestCases : 0,
    failedTestCases: Number.isFinite(failedTestCases) ? failedTestCases : 0,
    runtimeMs: typeof raw.runtimeMs === 'string' || typeof raw.runtimeMs === 'number' ? raw.runtimeMs : undefined,
    memoryMb: typeof raw.memoryMb === 'string' || typeof raw.memoryMb === 'number' ? raw.memoryMb : undefined,
    testCases: testCases.map((testCase, index) => {
      const item = testCase && typeof testCase === 'object' ? testCase as Record<string, unknown> : {};
      return {
        testCaseId: Number(item.testCaseId ?? index + 1),
        testCaseType: typeof item.testCaseType === 'string' ? item.testCaseType : 'Test Case',
        isHidden: typeof item.isHidden === 'boolean' ? item.isHidden : null,
        status: typeof item.status === 'string' ? item.status : 'Unknown',
        input: typeof item.input === 'string' ? item.input : undefined,
        expectedOutput: typeof item.expectedOutput === 'string' ? item.expectedOutput : undefined,
        actualOutput: typeof item.actualOutput === 'string' ? item.actualOutput : undefined,
        errorMessage: typeof item.errorMessage === 'string' ? item.errorMessage : undefined,
      };
    }),
  };
};

let cachedLanguages: LanguageDropdownItem[] | null = null;
let languageFetchPromise: Promise<LanguageDropdownItem[]> | null = null;
let languageCacheTime = 0;
const LANGUAGE_CACHE_TTL_MS = 30 * 60 * 1000;

export const executionService = {
  invalidateLanguageCache(): void {
    cachedLanguages = null;
    languageFetchPromise = null;
    languageCacheTime = 0;
  },

  /**
   * Fetches supported languages with both Table IDs and Reference IDs.
   * Prioritizes /api/v1/language to get referenceId directly from entity records.
   */
  async getLanguageDropdown(force = false): Promise<LanguageDropdownItem[]> {
    if (
      !force &&
      cachedLanguages &&
      Date.now() - languageCacheTime < LANGUAGE_CACHE_TTL_MS
    ) {
      return cachedLanguages;
    }

    if (languageFetchPromise) {
      return languageFetchPromise;
    }

    languageFetchPromise = (async () => {
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
          isActive: item.isActive !== false,
        }));
        cachedLanguages = list;
        languageCacheTime = Date.now();
        return list;
      }

      throw new Error('The backend returned no supported languages');
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
    if (!cachedLanguages) await this.getLanguageDropdown();

    if (cachedLanguages && cachedLanguages.length > 0) {
      const activeLanguages = cachedLanguages.filter((language) => language.isActive !== false);
      // 1. If numericId matches language table ID (e.g. 1), resolve to referenceId (e.g. 5)
      const idMatch = activeLanguages.find((l) => l.id === numericId);
      if (idMatch?.referenceId) {
        return idMatch.referenceId;
      }

      // 2. If numericId is already a known referenceId, retain it
      const refMatch = activeLanguages.find((l) => l.referenceId === numericId);
      if (refMatch?.referenceId) {
        return refMatch.referenceId;
      }

      // 3. Fallback match by language name if provided
      if (languageName) {
        const nameMatch = activeLanguages.find(
          (l) => l.name.toLowerCase() === languageName.toLowerCase()
        );
        if (nameMatch?.referenceId) {
          return nameMatch.referenceId;
        }
      }
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

    // Java is derived from the backend language registry; reference IDs are not guessed.
    const isJava =
      cachedLanguages?.some(
        (l) =>
          l.isActive !== false &&
          (l.id === payload.languageId || l.referenceId === resolvedLanguageId) &&
          l.name.toLowerCase().includes('java') &&
          !l.name.toLowerCase().includes('script')
      );

    if (isJava) {
      if (/public\s+class\s+Solution\b/.test(sanitizedCode)) {
        sanitizedCode = sanitizedCode.replace(/public\s+class\s+Solution\b/g, 'public class Main');
      }
    }

    return {
      questionId: Number(payload.questionId),
      languageId: resolvedLanguageId,
      sourceCode: sanitizedCode,
      ...(payload.customInput?.trim() ? { customInput: payload.customInput } : {}),
    };
  },

  /**
   * POST /api/v1/runCode
   * Normal user RUN: executes sample / visible test cases only.
   */
  async runCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    signal?.throwIfAborted();
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.USER_RUN, finalPayload, { signal });
    return normalizeExecutionResult(res?.data || res);
  },

  /**
   * POST /api/v1/submitCode
   * Normal user SUBMIT: executes all test cases (visible, mandatory, edge, hidden).
   */
  async submitCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    signal?.throwIfAborted();
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.USER_SUBMIT, finalPayload, { signal });
    return normalizeExecutionResult(res?.data || res);
  },

  /**
   * POST /api/v1/admin/testCode
   * Admin user RUN: executes sample / visible test cases for testing without persistence.
   * Backend authorization remains authoritative; no privileged-to-user endpoint fallback.
   */
  async adminTestCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    signal?.throwIfAborted();
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_RUN, finalPayload, { signal });
    return normalizeExecutionResult(res?.data || res);
  },

  /**
   * POST /api/v1/admin/submitCode
   * Admin user SUBMIT: executes all test cases for validation without persistence.
   * Backend authorization remains authoritative; no privileged-to-user endpoint fallback.
   */
  async adminSubmitCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    signal?.throwIfAborted();
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_SUBMIT, finalPayload, { signal });
    return normalizeExecutionResult(res?.data || res);
  },

};
