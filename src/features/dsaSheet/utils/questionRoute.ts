import type { DsaSheetQuestionLink } from '../types';

/**
 * The outer learning-sheet link ID identifies the association only. Problem
 * navigation must always use the nested question's authoritative numeric ID.
 */
export const getDsaQuestionProblemPath = (link: DsaSheetQuestionLink): string =>
  `/problems/${link.question.id}`;
