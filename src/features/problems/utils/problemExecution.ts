/**
 * Problem Execution & ID Resolution Utilities (F-001, F-009, F-016)
 *
 * Provides shared, deterministic logic for resolving active question IDs
 * and verifying code execution readiness across Problem Workspace components.
 */

export interface ActiveProblemLike {
  id?: string | number | null;
}

export interface ExecutionLanguageLike {
  id: number;
  referenceId?: number;
}

export interface ExecutionReadinessParams {
  isExecuting: boolean;
  loadingProblem: boolean;
  activeQuestionId: number | null;
  selectedLanguage: ExecutionLanguageLike | null;
}

export const resolveExecutionLanguageName = (
  languages: Array<ExecutionLanguageLike & { name?: string; languageName?: string }>,
  languageId: number
): string => {
  const language = languages.find(
    (item) => item.id === languageId || item.referenceId === languageId
  );
  return language?.name || language?.languageName || `Language #${languageId}`;
};

/**
 * Resolves the active integer question ID for code execution, submissions,
 * and markSolved state synchronization.
 *
 * - If problem entity has loaded and contains an id, extracts that integer ID.
 * - If problem is not loaded yet, but the route parameter itself is a strictly
 *   positive integer (e.g., /problems/42), returns that numeric ID.
 * - For text slugs (e.g., /problems/two-sum), empty params, invalid slugs, or
 *   loading states, returns null.
 * - STRICT RULE: Never default or coerce to question ID 1 (F-001, F-016).
 */
export const resolveActiveQuestionId = (
  problem?: ActiveProblemLike | null,
  routeIdentifier?: string | number | null
): number | null => {
  // 1. Prioritize loaded problem entity ID
  if (problem?.id !== undefined && problem?.id !== null) {
    const parsedProblemId = Number(problem.id);
    if (Number.isInteger(parsedProblemId) && parsedProblemId > 0) {
      return parsedProblemId;
    }
  }

  // 2. Allow direct numeric route parameters if purely positive integer digits
  if (routeIdentifier !== undefined && routeIdentifier !== null) {
    const trimmed = String(routeIdentifier).trim();
    if (/^\d+$/.test(trimmed)) {
      const parsedParam = Number(trimmed);
      if (Number.isInteger(parsedParam) && parsedParam > 0) {
        return parsedParam;
      }
    }
  }

  // 3. In all other cases (e.g. text slugs before problem is loaded, invalid IDs), return null
  return null;
};

/**
 * Determines whether Run Code and Submit Code controls should be enabled.
 *
 * Execution is blocked (returns false) if:
 * - Code is currently executing
 * - Problem is actively loading from the API
 * - Active question ID is null or invalid
 * - No supported execution language is selected
 */
export const canExecuteProblem = ({
  isExecuting,
  loadingProblem,
  activeQuestionId,
  selectedLanguage,
}: ExecutionReadinessParams): boolean => {
  if (isExecuting) return false;
  if (loadingProblem) return false;
  if (!activeQuestionId || activeQuestionId <= 0 || !Number.isInteger(activeQuestionId)) return false;
  if (!selectedLanguage) return false;
  return true;
};
