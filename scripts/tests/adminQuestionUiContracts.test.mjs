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
});
