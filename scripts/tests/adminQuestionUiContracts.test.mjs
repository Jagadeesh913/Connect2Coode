import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

describe('Admin question UI contracts', () => {
  it('keeps dialog escape available when dynamic form options fail', () => {
    const source = fs.readFileSync(
      'src/features/admin/components/questions/QuestionFormModal.tsx',
      'utf8'
    );

    assert.match(
      source,
      /onClick=\{onClose\}[\s\S]*?disabled=\{submitting\}/,
      'Cancel must not be disabled by reference-library loading or failure'
    );
    assert.match(
      source,
      /onClick=\{handleSubmit\(handleFormSubmit\)\}[\s\S]*?disabled=\{submitting \|\| referenceLoading \|\| Boolean\(referenceError\)\}/,
      'Save must remain disabled until required dynamic options are authoritative'
    );
  });

  it('surfaces retryable dynamic filter failures instead of silently showing empty filters', () => {
    const source = fs.readFileSync('src/features/admin/pages/AdminQuestions.tsx', 'utf8');

    assert.match(source, /error=\{filterOptionsError\}/);
    assert.match(source, /onRetry=\{retryFilterOptions\}/);
    assert.match(source, /aria-label="Filter questions by difficulty"/);
    assert.match(source, /aria-label="Filter questions by topic"/);
    assert.match(source, /aria-label="Filter questions by company"/);
  });

  it('transitions a successful create to its saved identity before attaching test cases', () => {
    const source = fs.readFileSync('src/features/admin/pages/AdminQuestions.tsx', 'utf8');
    const saveIndex = source.indexOf('const savedQuestion = res.data;');
    const identityIndex = source.indexOf('setSelectedQuestion({', saveIndex);
    const invalidateIndex = source.indexOf('dispatch(invalidateProblemCache())', saveIndex);
    const testCaseIndex = source.indexOf('await adminQuestionService.addTestCases', saveIndex);

    assert.ok(saveIndex > -1, 'the question save response must be captured');
    assert.ok(identityIndex > saveIndex && identityIndex < testCaseIndex, 'the form must receive the saved ID before test-case attachment');
    assert.ok(invalidateIndex > saveIndex && invalidateIndex < testCaseIndex, 'the primary save must invalidate problem caches even when test cases fail');
    assert.match(source.slice(identityIndex, testCaseIndex), /id: targetQuestionId/);
  });

  it('resets pagination immediately when the question search changes', () => {
    const source = fs.readFileSync('src/features/admin/pages/AdminQuestions.tsx', 'utf8');
    assert.match(
      source,
      /onChange=\{\(e\) => \{\s*setSearchTerm\(e\.target\.value\);\s*setPageNumber\(0\);\s*\}\}/
    );
  });

  it('allows removing any company association during question edit', () => {
    const source = fs.readFileSync(
      'src/features/admin/components/questions/QuestionFormModal.tsx',
      'utf8'
    );
    assert.doesNotMatch(source, />\s*API-linked\s*<\/span>/);
    assert.doesNotMatch(source, /Existing associations cannot be removed by the current API/);
    assert.match(source, /handleRemoveCompany\(c\)/);
    assert.match(source, /setSelectedCompanies\(\(current\) => current\.filter/);
  });

  it('isolates runtime code drafts by question and language', () => {
    const source = fs.readFileSync(
      'src/features/admin/components/questions/AdminCodeTestModal.tsx',
      'utf8'
    );
    assert.match(source, /useRef<Record<string, string>>\(\{\}\)/);
    assert.match(source, /const draftKey = `\$\{question\.id\}_\$\{nextLanguageId\}`/);
    assert.match(source, /const activeDraftKey = question\?\.id && selectedLanguageId !== null/);
    assert.match(source, /codeDraftsRef\.current = \{ \.\.\.codeDraftsRef\.current, \[activeDraftKey\]: nextCode \}/);
  });

  it('sends the live question limits and renders admin execution metrics', () => {
    const formSource = fs.readFileSync(
      'src/features/admin/components/questions/QuestionFormModal.tsx',
      'utf8'
    );
    const pageSource = fs.readFileSync('src/features/admin/pages/AdminQuestions.tsx', 'utf8');
    const runnerSource = fs.readFileSync(
      'src/features/admin/components/questions/AdminCodeTestModal.tsx',
      'utf8'
    );

    assert.match(formSource, /register\('timeLimit'\)/);
    assert.match(formSource, /register\('memoryLimit'\)/);
    assert.match(pageSource, /timeLimit: formData\.timeLimit/);
    assert.match(pageSource, /memoryLimit: formData\.memoryLimit/);
    assert.match(runnerSource, /Time: \{result\.executionTime\}/);
    assert.match(runnerSource, /Memory: \{result\.memoryUsage\}/);
    assert.match(runnerSource, /Time: <strong>\{tc\.executionTime\}<\/strong>/);
    assert.match(runnerSource, /Memory: <strong>\{tc\.memoryUsage\}<\/strong>/);
  });
});
