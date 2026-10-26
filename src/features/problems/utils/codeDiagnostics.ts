import type { ExecutionResultData } from '../../../services/executionService';

export type CodeDiagnosticSeverity = 'error' | 'warning' | 'info';

export interface CodeDiagnostic {
  id: string;
  severity: CodeDiagnosticSeverity;
  title: string;
  message: string;
  line: number;
  column: number;
  endColumn?: number;
  source: 'editor' | 'compiler' | 'runtime';
}

const lineAndColumnPatterns = [
  /(?:line|Line)\s+(\d+)(?::(\d+))?/,
  /:(\d+):(\d+)(?:\D|$)/,
  /\((\d+),(\d+)\)/,
];

const locateDiagnostic = (message: string): { line: number; column: number } => {
  for (const pattern of lineAndColumnPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        line: Math.max(1, Number(match[1]) || 1),
        column: Math.max(1, Number(match[2]) || 1),
      };
    }
  }
  return { line: 1, column: 1 };
};

const classifyBackendMessage = (message: string): Pick<CodeDiagnostic, 'severity' | 'title' | 'source'> => {
  const normalized = message.toLowerCase();
  if (/compil|syntax|expected|cannot find symbol|undeclared|not defined|type mismatch/.test(normalized)) {
    return { severity: 'error', title: 'Compilation error', source: 'compiler' };
  }
  if (/time limit|timeout|memory limit|runtime|exception|segmentation|traceback/.test(normalized)) {
    return { severity: 'error', title: 'Runtime error', source: 'runtime' };
  }
  return { severity: 'error', title: 'Execution error', source: 'runtime' };
};

export function collectExecutionDiagnostics(
  result: ExecutionResultData | null,
  requestError?: string | null
): CodeDiagnostic[] {
  const messages: Array<{ key: string; message: string }> = [];
  if (requestError?.trim()) messages.push({ key: 'request', message: requestError.trim() });
  result?.testCases.forEach((testCase, index) => {
    if (testCase.errorMessage?.trim()) {
      messages.push({ key: `case-${testCase.testCaseId || index + 1}`, message: testCase.errorMessage.trim() });
    }
  });

  const seen = new Set<string>();
  return messages.flatMap(({ key, message }) => {
    if (seen.has(message)) return [];
    seen.add(message);
    const location = locateDiagnostic(message);
    return [{
      id: `${key}-${location.line}-${location.column}`,
      ...classifyBackendMessage(message),
      message,
      ...location,
    }];
  });
}

const firstTokenColumn = (line: string, token: string): number => Math.max(1, line.indexOf(token) + 1);

export function analyzeSourceCode(code: string, language: string): CodeDiagnostic[] {
  if (!code.trim()) return [];
  const normalizedLanguage = language.toLowerCase();
  const lines = code.split(/\r?\n/);
  const diagnostics: CodeDiagnostic[] = [];
  const add = (
    id: string,
    severity: CodeDiagnosticSeverity,
    title: string,
    message: string,
    line: number,
    token: string,
  ) => diagnostics.push({
    id,
    severity,
    title,
    message,
    line,
    column: firstTokenColumn(lines[line - 1] || '', token),
    endColumn: firstTokenColumn(lines[line - 1] || '', token) + Math.max(token.length, 1),
    source: 'editor',
  });

  lines.forEach((lineText, index) => {
    const line = index + 1;
    if (normalizedLanguage === 'java') {
      if (lineText.includes('console.log')) add(`java-console-${line}`, 'error', 'JavaScript API in Java', 'Use System.out.println(...) in Java instead of console.log(...).', line, 'console.log');
      if (/^\s*#include\b/.test(lineText)) add(`java-include-${line}`, 'error', 'C++ syntax in Java', 'The selected language is Java, but this line uses a C++ preprocessor directive.', line, '#include');
      const publicClass = lineText.match(/public\s+class\s+(\w+)/);
      if (publicClass && publicClass[1] !== 'Main' && publicClass[1] !== 'Solution') {
        add(`java-main-${line}`, 'warning', 'Entry class name', 'The judge expects the public entry class to be Main. Solution is also accepted and normalized automatically.', line, publicClass[1]);
      }
    }
    if (normalizedLanguage === 'cpp') {
      if (lineText.includes('System.out.')) add(`cpp-system-${line}`, 'error', 'Java API in C++', 'Use std::cout in C++ instead of System.out.', line, 'System.out');
      if (lineText.includes('console.log')) add(`cpp-console-${line}`, 'error', 'JavaScript API in C++', 'Use std::cout in C++ instead of console.log(...).', line, 'console.log');
    }
    if (normalizedLanguage === 'python') {
      if (lineText.includes('System.out.')) add(`python-system-${line}`, 'error', 'Java API in Python', 'Use print(...) in Python instead of System.out.', line, 'System.out');
      if (lineText.includes('console.log')) add(`python-console-${line}`, 'error', 'JavaScript API in Python', 'Use print(...) in Python instead of console.log(...).', line, 'console.log');
      if (/\b(?:int|String|boolean)\s+\w+\s*=/.test(lineText)) add(`python-declaration-${line}`, 'warning', 'Typed declaration in Python', 'This looks like a Java-style variable declaration. Python variables do not use these type keywords.', line, lineText.trim().split(/\s+/)[0]);
    }
    if (normalizedLanguage === 'javascript') {
      if (lineText.includes('System.out.')) add(`js-system-${line}`, 'error', 'Java API in JavaScript', 'Use console.log(...) in JavaScript instead of System.out.', line, 'System.out');
      if (/^\s*#include\b/.test(lineText)) add(`js-include-${line}`, 'error', 'C++ syntax in JavaScript', 'The selected language is JavaScript, but this line uses a C++ preprocessor directive.', line, '#include');
    }
  });

  return diagnostics;
}

