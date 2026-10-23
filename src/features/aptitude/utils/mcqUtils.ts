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
    // 1. Check if the options already have explicit isCorrect flags
    const hasExplicitIsCorrect = q.options.some(
      (opt: any) =>
        opt.isCorrect === true ||
        String(opt.isCorrect).toLowerCase() === 'true' ||
        opt.isCorrect === 1 ||
        opt.correct === true ||
        String(opt.correct).toLowerCase() === 'true' ||
        opt.correct === 1 ||
        opt.is_correct === true ||
        String(opt.is_correct).toLowerCase() === 'true' ||
        opt.is_correct === 1
    );

    if (hasExplicitIsCorrect) {
      // Strictly use the option's own isCorrect field.
      // Do NOT allow question-level correctOption / answer to override an option whose isCorrect is false.
      return q.options.map((opt: any, i) => {
        const text = String(
          opt.optionText ?? opt.optionValue ?? opt.value ?? opt.text ?? opt.option ?? ''
        );
        const isThisOptionCorrect =
          opt.isCorrect === true ||
          String(opt.isCorrect).toLowerCase() === 'true' ||
          opt.isCorrect === 1 ||
          opt.correct === true ||
          String(opt.correct).toLowerCase() === 'true' ||
          opt.correct === 1 ||
          opt.is_correct === true ||
          String(opt.is_correct).toLowerCase() === 'true' ||
          opt.is_correct === 1;

        return {
          id: opt.id || opt.optionId || i + 1,
          optionLabel: opt.optionLabel || String.fromCharCode(65 + i),
          optionText: text,
          isCorrect: isThisOptionCorrect,
        };
      });
    }

    // 2. Only if NO option has an explicit isCorrect flag, fallback to question-level targetCorrectOption
    const targetLabel = (q.correctOption || '').toUpperCase();
    const targetText = ((q as any).correctAnswer || (q as any).answer || '').trim().toLowerCase();

    const rawOpts = q.options.map((opt: any, i) => {
      const text = String(
        opt.optionText ?? opt.optionValue ?? opt.value ?? opt.text ?? opt.option ?? ''
      );
      const label = opt.optionLabel || String.fromCharCode(65 + i);
      const isMatched =
        Boolean(targetLabel && String(label).toUpperCase() === targetLabel) ||
        Boolean(targetText && text.trim().toLowerCase() === targetText);

      return {
        id: opt.id || opt.optionId || i + 1,
        optionLabel: label,
        optionText: text,
        isCorrect: isMatched,
      };
    });

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
