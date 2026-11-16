import { describe, it, expect } from 'vitest';
import { collectExecutionDiagnostics } from '../../features/problems/utils/codeDiagnostics';

describe('Code Diagnostics Extraction', () => {
  it('returns empty diagnostics when result and error are null', () => {
    expect(collectExecutionDiagnostics(null, null)).toEqual([]);
  });

  it('extracts compilation error diagnostics with line and column', () => {
    const mockResult = {
      totalTestCases: 0,
      passedTestCases: 0,
      failedTestCases: 0,
      diagnostics: ['Main.java:14: error: cannot find symbol\n  int x = undefinedVar;\n          ^\n'],
      testCases: [],
      status: 6,
    };

    const diagnostics = collectExecutionDiagnostics(mockResult as never);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0].severity).toBe('error');
    expect(diagnostics[0].source).toBe('compiler');
    expect(diagnostics[0].line).toBe(14);
  });

  it('extracts runtime exception diagnostics with line number', () => {
    const mockResult = {
      totalTestCases: 1,
      passedTestCases: 0,
      failedTestCases: 1,
      diagnostics: ['Exception in thread "main" java.lang.ArithmeticException: / by zero\n\tat Solution.main(Line 8)'],
      testCases: [],
      status: 11,
    };

    const diagnostics = collectExecutionDiagnostics(mockResult as never);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0].severity).toBe('error');
    expect(diagnostics[0].source).toBe('runtime');
    expect(diagnostics[0].line).toBe(8);
  });

  it('captures network or request error as execution diagnostic', () => {
    const diagnostics = collectExecutionDiagnostics(null, 'Network connection timed out');
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].title).toBe('Execution error');
    expect(diagnostics[0].message).toBe('Network connection timed out');
  });
});
