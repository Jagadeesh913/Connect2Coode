/**
 * DEPRECATED: Mock aptitude questions have been completely removed.
 * Aptitude and MCQ questions are now 100% dynamically fetched via mcqService from POST /api/v1/mcq.
 */
import type { McqQuestion } from '../../../core/types/domain';

export type AptitudeItem = McqQuestion;
export const aptitudeQuestions: AptitudeItem[] = [];
