import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import real problem execution utility used by ProblemDetails.tsx
import {
  resolveActiveQuestionId,
  canExecuteProblem,
  resolveExecutionLanguageName,
} from '../../src/features/problems/utils/problemExecution.ts';
import {
  analyzeSourceCode,
  collectExecutionDiagnostics,
} from '../../src/features/problems/utils/codeDiagnostics.ts';

describe('BATCH-2: Problem Workspace & Code Execution Integrity (F-001, F-009, F-016)', () => {
  describe('F-001 & F-016: resolveActiveQuestionId', () => {
    it('returns loaded problem integer ID regardless of text slug in route', () => {
      const problem = { id: '42', title: 'Two Sum', slug: 'two-sum' };
      const resolvedId = resolveActiveQuestionId(problem, 'two-sum');
      assert.equal(resolvedId, 42);
    });

    it('returns loaded problem numeric ID when problem.id is already a number', () => {
      const problem = { id: 101, title: 'Median of Two Arrays', slug: 'median-arrays' };
      const resolvedId = resolveActiveQuestionId(problem, 'median-arrays');
      assert.equal(resolvedId, 101);
    });

    it('NEVER defaults or coerces text slug to question ID 1 when problem is not loaded', () => {
      const resolvedId = resolveActiveQuestionId(null, 'two-sum');
      assert.equal(
        resolvedId,
        null,
        'Slug "two-sum" must evaluate to null before problem is loaded, NEVER silently defaulting to 1'
      );
    });

    it('NEVER defaults to 1 for arbitrary complex text slugs', () => {
      assert.equal(resolveActiveQuestionId(null, 'longest-palindromic-substring'), null);
      assert.equal(resolveActiveQuestionId(null, 'reverse-integer-32bit'), null);
      assert.equal(resolveActiveQuestionId(undefined, 'merge-k-sorted-lists'), null);
    });

    it('allows direct numeric route parameters when positive integer', () => {
      assert.equal(resolveActiveQuestionId(null, '7'), 7);
      assert.equal(resolveActiveQuestionId(null, '108'), 108);
      assert.equal(resolveActiveQuestionId(null, 15), 15);
    });

    it('safely returns null for empty, whitespace, null, or undefined parameters', () => {
      assert.equal(resolveActiveQuestionId(null, ''), null);
      assert.equal(resolveActiveQuestionId(null, '   '), null);
      assert.equal(resolveActiveQuestionId(null, null), null);
      assert.equal(resolveActiveQuestionId(null, undefined), null);
    });

    it('safely returns null for non-positive or malformed numeric strings', () => {
      assert.equal(resolveActiveQuestionId(null, '0'), null);
      assert.equal(resolveActiveQuestionId(null, '-5'), null);
      assert.equal(resolveActiveQuestionId(null, '12abc'), null);
      assert.equal(resolveActiveQuestionId(null, 'NaN'), null);
    });

    it('prioritizes loaded problem entity ID over route parameter if they diverge', () => {
      const problem = { id: 99, title: 'Custom Problem', slug: 'custom' };
      assert.equal(resolveActiveQuestionId(problem, '12'), 99);
    });
  });

  describe('F-016: canExecuteProblem execution readiness gate', () => {
    const validLanguage = { id: 1, referenceId: 5, name: 'Java' };

    it('disables execution while problem is actively loading (loadingProblem === true)', () => {
      const ready = canExecuteProblem({
        isExecuting: false,
        loadingProblem: true,
        activeQuestionId: 42,
        selectedLanguage: validLanguage,
      });
      assert.equal(ready, false, 'Must be disabled while problem is loading');
    });

    it('disables execution when active question ID is null (slug not loaded or invalid)', () => {
      const ready = canExecuteProblem({
        isExecuting: false,
        loadingProblem: false,
        activeQuestionId: null,
        selectedLanguage: validLanguage,
      });
      assert.equal(ready, false, 'Must be disabled when activeQuestionId is null');
    });

    it('disables execution when code is already executing (isExecuting === true)', () => {
      const ready = canExecuteProblem({
        isExecuting: true,
        loadingProblem: false,
        activeQuestionId: 42,
        selectedLanguage: validLanguage,
      });
      assert.equal(ready, false, 'Must be disabled while currently executing');
    });

    it('disables execution when no language is selected (selectedLanguage === null)', () => {
      const ready = canExecuteProblem({
        isExecuting: false,
        loadingProblem: false,
        activeQuestionId: 42,
        selectedLanguage: null,
      });
      assert.equal(ready, false, 'Must be disabled when selectedLanguage is null');
    });

    it('enables execution ONLY when problem has loaded with valid ID, language is ready, and idle', () => {
      const ready = canExecuteProblem({
        isExecuting: false,
        loadingProblem: false,
        activeQuestionId: 42,
        selectedLanguage: validLanguage,
      });
      assert.equal(ready, true, 'Must be enabled when all conditions are satisfied');
    });
  });

  describe('submission language resolution', () => {
    const languages = [
      { id: 1, referenceId: 5, name: 'Java' },
      { id: 2, referenceId: 6, name: 'C++' },
    ];

    it('matches both language entity IDs and backend reference IDs', () => {
      assert.equal(resolveExecutionLanguageName(languages, 1), 'Java');
      assert.equal(resolveExecutionLanguageName(languages, 6), 'C++');
    });

    it('does not invent a hardcoded language name for an unknown ID', () => {
      assert.equal(resolveExecutionLanguageName(languages, 99), 'Language #99');
    });
  });

  describe('editor and execution diagnostics', () => {
    it('flags obvious cross-language API and keyword mismatches with line locations', () => {
      const diagnostics = analyzeSourceCode(
        'public class Main {\n  console.log("wrong runtime");\n}',
        'java'
      );
      assert.equal(diagnostics.length, 1);
      assert.equal(diagnostics[0].severity, 'error');
      assert.equal(diagnostics[0].line, 2);
      assert.match(diagnostics[0].message, /System\.out\.println/);
    });

    it('surfaces and deduplicates compiler messages returned on test cases', () => {
      const diagnostics = collectExecutionDiagnostics({
        totalTestCases: 2,
        passedTestCases: 0,
        failedTestCases: 2,
        testCases: [
          { testCaseId: 1, testCaseType: 'Sample', status: 'Compilation Error', errorMessage: 'Main.java:7:12: cannot find symbol' },
          { testCaseId: 2, testCaseType: 'Sample', status: 'Compilation Error', errorMessage: 'Main.java:7:12: cannot find symbol' },
        ],
      });
      assert.equal(diagnostics.length, 1);
      assert.equal(diagnostics[0].title, 'Compilation error');
      assert.equal(diagnostics[0].line, 7);
      assert.equal(diagnostics[0].column, 12);
    });
  });
});
