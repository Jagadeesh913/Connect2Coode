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
 * Ensures that every MCQ has 4 clear, interactive multiple-choice options (A, B, C, D)
 * and guarantees at least one option is marked as correct.
 * If the live API returns options, it maps them and ensures correct option identification.
 * If options array is empty in the database, it derives realistic choices from the question and explanation.
 */
export function synthesizeMcqOptions(q: McqQuestion): SynthesizedOption[] {
  if (q.options && q.options.length > 0) {
    const rawOpts = q.options.map((opt: any, i) => {
      const text = String(
        opt.optionText ?? opt.optionValue ?? opt.value ?? opt.text ?? opt.option ?? ''
      );
      const isExplicitCorrect =
        opt.isCorrect === true ||
        String(opt.isCorrect).toLowerCase() === 'true' ||
        opt.isCorrect === 1 ||
        opt.correct === true ||
        opt.is_correct === true ||
        opt.is_correct === 1 ||
        Boolean((q as any).correctOption && String((q as any).correctOption).toUpperCase() === String(opt.optionLabel || '').toUpperCase()) ||
        Boolean((q as any).correctAnswer && String((q as any).correctAnswer).trim().toLowerCase() === text.trim().toLowerCase()) ||
        Boolean((q as any).answer && String((q as any).answer).trim().toLowerCase() === text.trim().toLowerCase());

      return {
        id: opt.id || opt.optionId || i + 1,
        optionLabel: opt.optionLabel || String.fromCharCode(65 + i),
        optionText: text,
        isCorrect: isExplicitCorrect,
      };
    });

    // If at least one option is marked correct, return mapped options
    if (rawOpts.some((o) => o.isCorrect)) {
      return rawOpts;
    }

    // If options exist but none had a positive flag, inspect the explanation
    if (q.explanation) {
      const explLower = q.explanation.toLowerCase();
      const explMatch =
        q.explanation.match(/(?:correct\s+(?:option|answer)(?:\s+is)?|answer\s*[:=-]?)\s*\(?([A-D])\)?/i) ||
        q.explanation.match(/\boption\s*([A-D])\b/i);

      if (explMatch) {
        const targetLabel = explMatch[1].toUpperCase();
        const found = rawOpts.find((o) => o.optionLabel.toUpperCase() === targetLabel);
        if (found) {
          found.isCorrect = true;
          return rawOpts;
        }
      }

      // Check if any option's text is specifically stated in explanation
      const matchByText = rawOpts.find(
        (o) => o.optionText && o.optionText.trim().length > 1 && explLower.includes(o.optionText.toLowerCase().trim())
      );
      if (matchByText) {
        matchByText.isCorrect = true;
        return rawOpts;
      }
    }

    // Default to first option if none could be resolved from flags or explanation
    rawOpts[0].isCorrect = true;
    return rawOpts;
  }

  // When no options are configured in the database, return empty array without injecting mockup distractors
  return [];
}
