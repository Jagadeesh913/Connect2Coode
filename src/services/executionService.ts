import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type {
  CodeExecutionPayload,
  ExecutionResult,
  ExecutionTestCaseResult,
  Language,
} from '../core/types/domain';

export type { CodeExecutionPayload, ExecutionTestCaseResult };
export type LanguageDropdownItem = Language;
export type ExecutionResultData = ExecutionResult;

const isMetricValue = (value: unknown): value is string | number =>
  typeof value === 'string' || typeof value === 'number';

const collectDiagnosticStrings = (...values: unknown[]): string[] => {
  const collected: string[] = [];
  const append = (value: unknown): void => {
    if (typeof value === 'string' && value.trim()) {
      collected.push(value.trim());
    } else if (Array.isArray(value)) {
      value.forEach(append);
    }
  };
  values.forEach(append);
  return [...new Set(collected)];
};

export const normalizeExecutionTestCaseResult = (
  value: unknown,
  index = 0
): ExecutionTestCaseResult => {
  const item = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const isHidden = typeof item.isHidden === 'boolean' ? item.isHidden : null;
  const diagnostics = collectDiagnosticStrings(
    item.errorMessage,
    item.errors,
    item.stderr,
    item.compileOutput,
    item.message
  );

  return {
    testCaseId: Number.isFinite(Number(item.testCaseId))
      ? Number(item.testCaseId)
      : index + 1,
    testCaseType: typeof item.testCaseType === 'string' ? item.testCaseType : 'Test Case',
    isHidden,
    status: typeof item.status === 'string' ? item.status : 'Unknown',
    // Hidden evaluation data is removed at the shared service boundary so no
    // component can accidentally reveal it. The backend must still enforce
    // access control and should not send these values to ordinary users.
    input: !isHidden && typeof item.input === 'string' ? item.input : undefined,
    expectedOutput: !isHidden && typeof item.expectedOutput === 'string'
      ? item.expectedOutput
      : undefined,
    actualOutput: !isHidden
      ? typeof item.actualOutput === 'string'
        ? item.actualOutput
        : typeof item.stdout === 'string'
          ? item.stdout
          : undefined
      : undefined,
    errorMessage: isHidden ? undefined : diagnostics[0],
  };
};

export const normalizeExecutionResult = (value: unknown): ExecutionResultData => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The execution service returned an invalid result');
  }

  const raw = value as Record<string, unknown>;
  const hasVerdictData =
    raw.totalTestCases !== undefined ||
    raw.passedTestCases !== undefined ||
    raw.failedTestCases !== undefined ||
    Array.isArray(raw.testCases);
  if (!hasVerdictData) {
    throw new Error('The execution service returned no test verdict');
  }

  const testCases = Array.isArray(raw.testCases) ? raw.testCases : [];
  const passedTestCases = Number(raw.passedTestCases ?? 0);
  const failedTestCases = Number(raw.failedTestCases ?? 0);
  const totalTestCases = Number(raw.totalTestCases ?? testCases.length);
  const rawRuntimeMs = raw.runtimeMs;
  const rawMemoryMb = raw.memoryMb;
  const rawTime = raw.time;
  const rawMemory = raw.memory;
  const hasExplicitRuntimeUnit = isMetricValue(rawRuntimeMs);
  const hasExplicitMemoryUnit = isMetricValue(rawMemoryMb);
  const executionTime = hasExplicitRuntimeUnit
    ? rawRuntimeMs
    : isMetricValue(rawTime)
      ? rawTime
      : undefined;
  const memoryUsage = hasExplicitMemoryUnit
    ? rawMemoryMb
    : isMetricValue(rawMemory)
      ? rawMemory
      : undefined;

  return {
    totalTestCases: Number.isFinite(totalTestCases) ? totalTestCases : testCases.length,
    passedTestCases: Number.isFinite(passedTestCases) ? passedTestCases : 0,
    failedTestCases: Number.isFinite(failedTestCases) ? failedTestCases : 0,
    executionTime,
    executionTimeUnit: hasExplicitRuntimeUnit ? 'ms' : undefined,
    memoryUsage,
    memoryUnit: hasExplicitMemoryUnit ? 'MB' : undefined,
    status: typeof raw.status === 'string' || typeof raw.status === 'number'
      ? raw.status
      : undefined,
    message: typeof raw.message === 'string' ? raw.message : undefined,
    stdout: typeof raw.stdout === 'string' ? raw.stdout : undefined,
    diagnostics: collectDiagnosticStrings(raw.errors, raw.stderr, raw.compileOutput),
    testCases: testCases.map(normalizeExecutionTestCaseResult),
  };
};

export const isExecutionResultSuccessful = (result: ExecutionResultData): boolean =>
  result.totalTestCases > 0 &&
  result.passedTestCases > 0 &&
  result.failedTestCases === 0 &&
  result.passedTestCases >= result.totalTestCases;

let cachedLanguages: LanguageDropdownItem[] | null = null;
let languageFetchPromise: Promise<LanguageDropdownItem[]> | null = null;
let languageFetchGeneration = 0;
let languageCacheTime = 0;
const LANGUAGE_CACHE_TTL_MS = 30 * 60 * 1000;
export const MAX_SOURCE_CODE_LENGTH = 200_000;
export const MAX_CUSTOM_INPUT_LENGTH = 64_000;

export const executionService = {
  invalidateLanguageCache(): void {
    languageFetchGeneration += 1;
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

    if (languageFetchPromise && !force) {
      return languageFetchPromise;
    }

    const requestGeneration = ++languageFetchGeneration;
    const requestPromise = (async () => {
      const res: ApiResponse<unknown> = await apiClient.get(API_ENDPOINTS.LANGUAGE.BASE);
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        const list: LanguageDropdownItem[] = data.map((value) => {
          const item = value && typeof value === 'object'
            ? value as Record<string, unknown>
            : null;
          if (
            !item ||
            !Number.isFinite(Number(item.id)) ||
            typeof item.languageName !== 'string' ||
            item.languageName.trim() === ''
          ) {
            throw new Error('The backend returned an invalid language record');
          }

          return {
            id: Number(item.id),
            // GET /language exposes `languageName`; do not substitute an
            // undocumented alias or turn a contract error into a selectable runtime.
            name: item.languageName,
            languageName: item.languageName,
            referenceId:
              item.referenceId !== undefined && item.referenceId !== null
                ? Number(item.referenceId)
                : undefined,
            judge0LanguageId: item.judge0LanguageId ? Number(item.judge0LanguageId) : undefined,
            version: typeof item.version === 'string' ? item.version : undefined,
            isActive: item.isActive !== false,
          };
        });
        if (requestGeneration === languageFetchGeneration) {
          cachedLanguages = list;
          languageCacheTime = Date.now();
        }
        return list;
      }

      throw new Error('The backend returned no supported languages');
    })().finally(() => {
      if (languageFetchPromise === requestPromise) {
        languageFetchPromise = null;
      }
    });
    languageFetchPromise = requestPromise;
    return requestPromise;
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
    const questionId = Number(payload.questionId);
    const requestedLanguageId = Number(payload.languageId);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      throw new Error('A valid question is required for code execution');
    }
    if (!Number.isInteger(requestedLanguageId) || requestedLanguageId <= 0) {
      throw new Error('A valid language is required for code execution');
    }
    if (typeof payload.sourceCode !== 'string' || payload.sourceCode.trim() === '') {
      throw new Error('Source code is required');
    }
    if (payload.sourceCode.length > MAX_SOURCE_CODE_LENGTH) {
      throw new Error(`Source code exceeds the ${MAX_SOURCE_CODE_LENGTH}-character limit`);
    }
    if ((payload.customInput?.length ?? 0) > MAX_CUSTOM_INPUT_LENGTH) {
      throw new Error(`Custom input exceeds the ${MAX_CUSTOM_INPUT_LENGTH}-character limit`);
    }

    const resolvedLanguageId = await this.resolveLanguageReferenceId(requestedLanguageId);
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
      questionId,
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
    const res: ApiResponse<unknown> = await apiClient.post(API_ENDPOINTS.EXECUTION.USER_RUN, finalPayload, { signal });
    return normalizeExecutionResult(res.data);
  },

  /**
   * POST /api/v1/submitCode
   * Normal user SUBMIT: executes all test cases (visible, mandatory, edge, hidden).
   */
  async submitCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    signal?.throwIfAborted();
    const res: ApiResponse<unknown> = await apiClient.post(API_ENDPOINTS.EXECUTION.USER_SUBMIT, finalPayload, { signal });
    return normalizeExecutionResult(res.data);
  },

  /**
   * POST /api/v1/admin/testCode
   * Admin user RUN: executes sample / visible test cases for testing without persistence.
   * Backend authorization remains authoritative; no privileged-to-user endpoint fallback.
   */
  async adminTestCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    signal?.throwIfAborted();
    const res: ApiResponse<unknown> = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_RUN, finalPayload, { signal });
    return normalizeExecutionResult(res.data);
  },

  /**
   * POST /api/v1/admin/submitCode
   * Admin user SUBMIT: executes all test cases for validation without persistence.
   * Backend authorization remains authoritative; no privileged-to-user endpoint fallback.
   */
  async adminSubmitCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    signal?.throwIfAborted();
    const res: ApiResponse<unknown> = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_SUBMIT, finalPayload, { signal });
    return normalizeExecutionResult(res.data);
  },

};
