import type { McqQuestion } from '../../../core/types/domain';

export interface SynthesizedOption {
  id: number;
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
}

/**
 * Strips internal question code prefixes like [MCQ-PSEUDO-001], [MCQ-REAS-015], [MCQ-APT-002], etc.
 * so only the clean question text is displayed to the user.
 */
export function cleanQuestionText(text?: string | null): string {
  if (!text) return '';
  return text.replace(/^\[(?:MCQ|Aptitude|Question)[^\]]*\]\s*[:-]?\s*/i, '').trim();
}

/**
 * Maps only the documented option DTO returned by the MCQ API. In particular,
 * answer correctness is represented solely by `options[].isCorrect`; legacy
 * question-level answer strings and guessed alternate option property names are
 * not reliable enough to score a user answer.
 */
export function synthesizeMcqOptions(q: McqQuestion): SynthesizedOption[] {
  if (q.options && q.options.length > 0) {
    return q.options.map((opt, i) => ({
      id: opt.id || i + 1,
      optionLabel: opt.optionLabel || String.fromCharCode(65 + i),
      optionText: opt.optionText || '',
      isCorrect: opt.isCorrect === true,
    }));
  }

  // An incomplete API response must not be converted into invented answer data.
  return [];
}
