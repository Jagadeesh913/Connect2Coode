import { describe, it, expect } from 'vitest';
import {
  normalizeApiMcqOptions,
  serializeMcqOptions,
  hasExactlyOneCorrectOption,
  type EditableMcqOption,
} from '../../features/admin/utils/mcqPayload';
import type { McqOption } from '../../core/types/domain';

describe('Admin MCQ Payload Utilities', () => {
  it('normalizes API MCQ options with labels and booleans', () => {
    const rawOptions: McqOption[] = [
      { id: 1, optionLabel: 'A', optionText: 'First choice', isCorrect: true },
      { id: 2, optionLabel: 'B', optionText: 'Second choice', isCorrect: false },
    ];

    const normalized = normalizeApiMcqOptions(rawOptions);
    expect(normalized).toEqual([
      { id: 1, optionLabel: 'A', optionText: 'First choice', isCorrect: true },
      { id: 2, optionLabel: 'B', optionText: 'Second choice', isCorrect: false },
    ]);
  });

  it('generates fallback option labels when missing', () => {
    const rawOptions = [
      { optionText: 'Alpha', isCorrect: false } as unknown as McqOption,
      { optionText: 'Beta', isCorrect: true } as unknown as McqOption,
    ];

    const normalized = normalizeApiMcqOptions(rawOptions);
    expect(normalized[0].optionLabel).toBe('A');
    expect(normalized[1].optionLabel).toBe('B');
  });

  it('serializes options to Spring API option DTO format', () => {
    const options: EditableMcqOption[] = [
      { id: 10, optionLabel: 'A', optionText: ' Choice 1 ', isCorrect: true },
      { optionLabel: 'B', optionText: ' Choice 2 ', isCorrect: false },
    ];

    const serialized = serializeMcqOptions(options);
    expect(serialized).toEqual([
      { id: 10, optionLabel: 'A', optionText: 'Choice 1', isCorrect: true },
      { optionLabel: 'B', optionText: 'Choice 2', isCorrect: false },
    ]);
  });

  it('hasExactlyOneCorrectOption validates option correctness', () => {
    const oneCorrect: EditableMcqOption[] = [
      { optionLabel: 'A', optionText: '1', isCorrect: false },
      { optionLabel: 'B', optionText: '2', isCorrect: true },
    ];
    expect(hasExactlyOneCorrectOption(oneCorrect)).toBe(true);

    const noneCorrect: EditableMcqOption[] = [
      { optionLabel: 'A', optionText: '1', isCorrect: false },
      { optionLabel: 'B', optionText: '2', isCorrect: false },
    ];
    expect(hasExactlyOneCorrectOption(noneCorrect)).toBe(false);

    const twoCorrect: EditableMcqOption[] = [
      { optionLabel: 'A', optionText: '1', isCorrect: true },
      { optionLabel: 'B', optionText: '2', isCorrect: true },
    ];
    expect(hasExactlyOneCorrectOption(twoCorrect)).toBe(false);
  });
});
