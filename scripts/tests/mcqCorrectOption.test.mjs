import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to handle extensionless .ts imports and stub axios
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } } }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return await nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

const { synthesizeMcqOptions, parseAptitudeSubjectCode } = await import('../../src/features/aptitude/utils/mcqUtils.ts');
const { apiClient } = await import('../../src/core/api/apiClient.ts');
const { mcqService } = await import('../../src/services/mcqService.ts');
const {
  normalizeApiMcqOptions,
  serializeMcqOptions,
  hasExactlyOneCorrectOption,
} = await import('../../src/features/admin/utils/mcqPayload.ts');

describe('MCQ & Aptitude Bank: Correct Option Identification (isCorrect)', () => {
  it('maps URL category aliases deterministically for back/forward navigation', () => {
    assert.equal(parseAptitudeSubjectCode('quantitative'), 'APTITUDE');
    assert.equal(parseAptitudeSubjectCode('logical'), 'REASONING');
    assert.equal(parseAptitudeSubjectCode('verbal'), 'VERBAL');
    assert.equal(parseAptitudeSubjectCode('pseudo'), 'PSEUDOCODE');
  });

  it('serializes an admin update using only the documented option-level isCorrect contract', () => {
    const payload = serializeMcqOptions([
      { id: 101, optionLabel: 'A', optionText: '15', isCorrect: false },
      { id: 102, optionLabel: 'B', optionText: '20', isCorrect: true },
    ]);

    assert.deepEqual(payload, [
      { id: 101, optionLabel: 'A', optionText: '15', isCorrect: false },
      { id: 102, optionLabel: 'B', optionText: '20', isCorrect: true },
    ]);
    assert.equal(hasExactlyOneCorrectOption(payload), true);
    assert.equal(hasExactlyOneCorrectOption([{ optionLabel: 'A', optionText: '15', isCorrect: false }]), false);
  });

  it('does not treat legacy aliases or top-level answer fields as an API option correctness signal', () => {
    const options = normalizeApiMcqOptions([
      { id: 101, optionLabel: 'A', optionText: '15', isCorrect: false, correct: true },
      { id: 102, optionLabel: 'B', optionText: '20', isCorrect: true, is_correct: false },
    ]);

    assert.equal(options[0].isCorrect, false);
    assert.equal(options[1].isCorrect, true);
  });

  it('correctly identifies option B when user edits MCQ and sets option A to isCorrect: false and option B to isCorrect: true, even with stale correctOption: "A"', () => {
    const mcq = {
      id: 42,
      question: 'What is 10 + 10?',
      correctOption: 'A', // Stale top-level field from when A was initially chosen by mistake
      correctAnswer: '15', // Stale answer text
      answer: '15',
      options: [
        { id: 101, optionLabel: 'A', optionText: '15', isCorrect: false },
        { id: 102, optionLabel: 'B', optionText: '20', isCorrect: true }, // User changed to B
        { id: 103, optionLabel: 'C', optionText: '25', isCorrect: false },
        { id: 104, optionLabel: 'D', optionText: '30', isCorrect: false },
      ],
    };

    const options = synthesizeMcqOptions(mcq);

    // Option A must strictly have isCorrect: false
    const optA = options.find((o) => o.optionLabel === 'A');
    assert.equal(optA.isCorrect, false, 'Option A must have isCorrect: false');

    // Option B must strictly have isCorrect: true
    const optB = options.find((o) => o.optionLabel === 'B');
    assert.equal(optB.isCorrect, true, 'Option B must have isCorrect: true');

    // Exactly one option must be marked correct
    const correctOptions = options.filter((o) => o.isCorrect === true);
    assert.equal(correctOptions.length, 1, 'Only one option must be marked as correct');
    assert.equal(correctOptions[0].optionLabel, 'B');
    assert.equal(correctOptions[0].optionText, '20');
  });

  it('uses only boolean isCorrect values returned by the option DTO', () => {
    const mcqWithUnverifiedAliases = {
      id: 43,
      question: 'Identify binary flag correctly',
      options: [
        { id: 201, optionLabel: 'A', optionText: 'First', isCorrect: false, correct: true },
        { id: 202, optionLabel: 'B', optionText: 'Second', isCorrect: false, is_correct: true },
        { id: 203, optionLabel: 'C', optionText: 'Third', isCorrect: true },
        { id: 204, optionLabel: 'D', optionText: 'Fourth', isCorrect: false },
      ],
    };

    const options = synthesizeMcqOptions(mcqWithUnverifiedAliases);
    const correctOpt = options.find((o) => o.isCorrect === true);
    assert.ok(correctOpt, 'Must find a correct option');
    assert.equal(correctOpt.optionLabel, 'C');
    assert.equal(correctOpt.optionText, 'Third');
  });

  it('does not fabricate correctness from a stale top-level correctOption', () => {
    const legacyMcq = {
      id: 44,
      question: 'Legacy question with only correctOption',
      correctOption: 'C',
      options: [
        { id: 301, optionLabel: 'A', optionText: 'Red' },
        { id: 302, optionLabel: 'B', optionText: 'Blue' },
        { id: 303, optionLabel: 'C', optionText: 'Green' },
        { id: 304, optionLabel: 'D', optionText: 'Yellow' },
      ],
    };

    const options = synthesizeMcqOptions(legacyMcq);
    assert.equal(options.some((option) => option.isCorrect), false);
  });

  it('keeps an API question with an empty options array unanswerable instead of inventing choices', () => {
    const options = synthesizeMcqOptions({
      id: 4,
      question: 'A server-side MCQ record without persisted options',
      options: [],
    });

    assert.deepEqual(options, []);
  });

  it('fetches MCQ detail when a list row omits answer options', async () => {
    const originalGet = apiClient.get;
    const calls = [];
    apiClient.get = async (url, config) => {
      calls.push([url, config]);
      return {
        statusCode: 200,
        data: {
          id: 4,
          subjectGroupCode: 'SUBJECT',
          subjectRefCode: 'APTITUDE',
          subjectRefName: 'Aptitude',
          question: 'Detail question',
          options: [
            { id: 1, optionLabel: 'A', optionText: 'First', isCorrect: false },
            { id: 2, optionLabel: 'B', optionText: 'Second', isCorrect: true },
          ],
        },
      };
    };

    try {
      const controller = new AbortController();
      const detail = await mcqService.getMcqForAnswering(
        { id: 4, question: 'List question' },
        controller.signal
      );
      assert.equal(calls.length, 1);
      assert.equal(calls[0][0], '/mcq/4');
      assert.equal(calls[0][1].signal, controller.signal);
      assert.equal(synthesizeMcqOptions(detail).find((option) => option.isCorrect)?.optionLabel, 'B');
    } finally {
      apiClient.get = originalGet;
    }
  });

  it('rejects malformed MCQ option records at the API boundary', async () => {
    const originalGet = apiClient.get;
    apiClient.get = async () => ({
      statusCode: 200,
      data: {
        id: 6,
        subjectGroupCode: 'SUBJECT',
        subjectRefCode: 'APTITUDE',
        subjectRefName: 'Aptitude',
        question: 'Malformed option payload',
        options: [null],
      },
    });

    try {
      await assert.rejects(() => mcqService.getMcqById(6), /Unexpected MCQ option #1/);
    } finally {
      apiClient.get = originalGet;
    }
  });

  it('does not refetch a list row that already contains authoritative options', async () => {
    const originalGet = apiClient.get;
    apiClient.get = async () => {
      throw new Error('Detail request should not run');
    };
    const listQuestion = {
      id: 5,
      question: 'Complete list question',
      options: [{ id: 1, optionLabel: 'A', optionText: 'Answer', isCorrect: true }],
    };

    try {
      assert.equal(await mcqService.getMcqForAnswering(listQuestion), listQuestion);
    } finally {
      apiClient.get = originalGet;
    }
  });
});
