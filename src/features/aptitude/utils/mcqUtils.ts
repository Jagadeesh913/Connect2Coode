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
  return text.replace(/^\[MCQ[^\]]*\]\s*/i, '').trim();
}

/**
 * Ensures that every MCQ has 4 clear, interactive multiple-choice options (A, B, C, D).
 * If the live API returns options, it maps them.
 * If options array is empty in the database, it derives realistic choices from the question and explanation.
 */
export function synthesizeMcqOptions(q: McqQuestion): SynthesizedOption[] {
  if (q.options && q.options.length > 0) {
    return q.options.map((opt, i) => ({
      id: opt.id || i + 1,
      optionLabel: opt.optionLabel || String.fromCharCode(65 + i),
      optionText: opt.optionText,
      isCorrect: opt.isCorrect === true,
    }));
  }

  const rawQ = cleanQuestionText(q.question);
  const rawExpl = (q.explanation || '').trim();
  const lowerQ = rawQ.toLowerCase();
  const lowerExpl = rawExpl.toLowerCase();

  let correctText = '';
  let distractors: string[] = [];

  // 1. Specific known question types & logic patterns
  if (lowerQ.includes('shortest') && (lowerExpl.includes('kiran') || lowerQ.includes('maya'))) {
    correctText = 'Kiran';
    distractors = ['Maya', 'Ravi', 'Cannot be determined'];
  } else if (lowerQ.includes('stack') && (lowerExpl.includes('lifo') || lowerExpl.includes('last in'))) {
    correctText = 'LIFO (Last In, First Out)';
    distractors = ['FIFO (First In, First Out)', 'Random Access', 'Priority Queue'];
  } else if (lowerQ.includes('queue') && (lowerExpl.includes('fifo') || lowerExpl.includes('first in'))) {
    correctText = 'FIFO (First In, First Out)';
    distractors = ['LIFO (Last In, First Out)', 'Priority Queue', 'Random Access'];
  } else if (lowerQ.includes('bubble sort') || lowerExpl.includes('bubble sort')) {
    correctText = 'Bubble Sort';
    distractors = ['Quick Sort', 'Merge Sort', 'Binary Search'];
  } else if (lowerQ.includes('binary search') || lowerExpl.includes('must be sorted')) {
    correctText = 'The array must be sorted';
    distractors = ['The array must contain positive numbers', 'The array must have odd length', 'The array elements must be unique'];
  } else if (lowerQ.includes('linked list') || lowerExpl.includes('linked list')) {
    correctText = 'Linked List';
    distractors = ['Array', 'Stack', 'Hash Table'];
  } else if (lowerQ.includes('if-else') || lowerExpl.includes('if-else')) {
    correctText = 'if-else statement';
    distractors = ['switch statement', 'for loop', 'break statement'];
  } else if (lowerQ.includes('while loop') || lowerExpl.includes('while loop')) {
    correctText = 'while loop';
    distractors = ['do-while loop', 'for loop', 'goto statement'];
  } else if (lowerExpl.includes('zero-based indexing') || lowerQ.includes('index of the first element')) {
    correctText = '0';
    distractors = ['1', '-1', 'null'];
  } else {
    // 2. Numerical / Calculation Questions
    const eqMatch = rawExpl.match(/(?:equals|is equal to|result is|=)\s*([0-9]+(?:\.[0-9]+)?%?)/i);
    const numMatch = eqMatch || rawExpl.match(/(\b[0-9]+(?:\.[0-9]+)?%?\b)/);

    if (numMatch) {
      const valStr = numMatch[1];
      const isPct = valStr.includes('%');
      const num = parseFloat(valStr);
      if (!isNaN(num)) {
        const unit = isPct ? '%' : '';
        correctText = `${num}${unit}`;
        const d1 = num > 10 ? `${Math.round(num * 0.5)}${unit}` : `${num + 1}${unit}`;
        const d2 = num > 10 ? `${Math.round(num * 1.5)}${unit}` : `${Math.max(0, num - 1)}${unit}`;
        const d3 = num > 10 ? `${Math.round(num * 2)}${unit}` : `${num + 2}${unit}`;
        distractors = [d1, d2, d3];
      }
    }

    // 3. Fallback semantic extraction from explanation
    if (!correctText) {
      const isMatch = rawExpl.match(/^(?:the|an|a)?\s*([A-Za-z0-9_-]+(?:\s+[A-Za-z0-9_-]+){0,3})\s+(?:is|are|means|refers to)/i);
      if (isMatch) {
        correctText = isMatch[1].trim();
        distractors = ['None of the above', 'Both A and B', 'Cannot be determined'];
      } else {
        const firstClause = rawExpl.split(/[.,]/)[0].trim();
        correctText = firstClause.length <= 40 ? firstClause : 'Correct Answer';
        distractors = ['None of the above', 'All of the above', 'Cannot be determined'];
      }
    }
  }

  // Ensure distractors has exactly 3 unique items
  const finalDistractors: string[] = [];
  distractors.forEach((d) => {
    if (d !== correctText && !finalDistractors.includes(d)) {
      finalDistractors.push(d);
    }
  });
  while (finalDistractors.length < 3) {
    const fallback = `Option ${finalDistractors.length + 2}`;
    if (!finalDistractors.includes(fallback) && fallback !== correctText) {
      finalDistractors.push(fallback);
    }
  }

  // Deterministically place correct answer based on question id
  const correctIdx = Math.abs(Number(q.id) || 1) % 4;
  const allChoices = [...finalDistractors.slice(0, 3)];
  allChoices.splice(correctIdx, 0, correctText);

  return allChoices.map((text, idx) => ({
    id: idx + 1,
    optionLabel: String.fromCharCode(65 + idx),
    optionText: text,
    isCorrect: idx === correctIdx,
  }));
}
