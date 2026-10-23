import type { AdminCreateMcqPayload, McqOption } from '../../../core/types/domain';

export interface EditableMcqOption {
  id?: number;
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
}

/**
 * Maps the documented MCQ response fields only. `correct`, `is_correct`,
 * `correctOption`, and answer text are not authority for an option's state.
 */
export function normalizeApiMcqOptions(options: readonly McqOption[] | null | undefined): EditableMcqOption[] {
  return (options || []).map((option, index) => ({
    ...(option.id ? { id: Number(option.id) } : {}),
    optionLabel: option.optionLabel || String.fromCharCode(65 + index),
    optionText: String(option.optionText || ''),
    isCorrect: option.isCorrect === true,
  }));
}

/** Serializes only the Spring API's option DTO fields; no guessed aliases. */
export function serializeMcqOptions(options: readonly EditableMcqOption[]): AdminCreateMcqPayload['options'] {
  return options.map((option, index) => ({
    ...(option.id ? { id: Number(option.id) } : {}),
    optionLabel: option.optionLabel || String.fromCharCode(65 + index),
    optionText: option.optionText.trim(),
    isCorrect: option.isCorrect === true,
  }));
}

export function hasExactlyOneCorrectOption(options: readonly EditableMcqOption[]): boolean {
  return options.filter((option) => option.isCorrect === true).length === 1;
}
