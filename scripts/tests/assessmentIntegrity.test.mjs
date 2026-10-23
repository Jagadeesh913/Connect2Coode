import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const { classifyAssessmentShortcut } = await import(
  '../../src/shared/hooks/useAssessmentIntegrity.ts'
);

const shortcut = (key, overrides = {}) => ({
  altKey: false,
  ctrlKey: false,
  key,
  metaKey: false,
  shiftKey: false,
  ...overrides,
});

describe('assessment integrity shortcut classification', () => {
  it('blocks clipboard, source-view, print and developer-tool shortcuts', () => {
    assert.equal(classifyAssessmentShortcut(shortcut('c', { ctrlKey: true })), 'clipboard');
    assert.equal(classifyAssessmentShortcut(shortcut('v', { metaKey: true })), 'clipboard');
    assert.equal(classifyAssessmentShortcut(shortcut('Insert', { shiftKey: true })), 'clipboard');
    assert.equal(classifyAssessmentShortcut(shortcut('u', { ctrlKey: true })), 'developer-tools');
    assert.equal(classifyAssessmentShortcut(shortcut('I', { ctrlKey: true, shiftKey: true })), 'developer-tools');
    assert.equal(classifyAssessmentShortcut(shortcut('F12')), 'developer-tools');
    assert.equal(classifyAssessmentShortcut(shortcut('PrintScreen')), 'print-screen');
  });

  it('preserves editor typing and execution shortcuts', () => {
    assert.equal(classifyAssessmentShortcut(shortcut('a')), null);
    assert.equal(classifyAssessmentShortcut(shortcut('Enter', { ctrlKey: true })), null);
    assert.equal(classifyAssessmentShortcut(shortcut("'", { ctrlKey: true })), null);
    assert.equal(classifyAssessmentShortcut(shortcut('z', { ctrlKey: true })), null);
  });
});
