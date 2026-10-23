import type { Problem } from '../types/domain';

/**
 * Normalizes the captured POST /questions list DTO for the problem-list UI.
 * This is deliberately not a compatibility mapper: fields absent from the
 * list response stay absent instead of being guessed from historical aliases.
 */
type QuestionListDto = {
  id?: number | string;
  title?: string;
  description?: string;
  difficultyId?: number;
  difficultyName?: string;
  topicId?: number;
  topicName?: string;
  isOwnProblem?: boolean;
  isActive?: boolean;
  companies?: Array<string | { name?: string }>;
  questionPlatform?: string;
};

const readCompanies = (companies: QuestionListDto['companies']): string[] =>
  Array.isArray(companies)
    ? companies
        .map((company) =>
          typeof company === 'string'
            ? company.trim()
            : typeof company?.name === 'string'
            ? company.name.trim()
            : ''
        )
        .filter(Boolean)
    : [];

export const mapProblemDto = (value: QuestionListDto): Problem => {
  const id = value.id === undefined || value.id === null ? '' : String(value.id);
  const title = typeof value.title === 'string' ? value.title : '';
  const description = typeof value.description === 'string' ? value.description : '';
  const difficulty = typeof value.difficultyName === 'string' ? value.difficultyName : '';
  const topic = typeof value.topicName === 'string' ? value.topicName : '';
  const questionPlatform =
    typeof value.questionPlatform === 'string' ? value.questionPlatform : undefined;

  return {
    id,
    questionId: id,
    // UI route key derived from the authoritative ID, not an API alias.
    slug: id,
    title,
    description,
    difficulty,
    difficultyId: value.difficultyId,
    category: topic,
    topic,
    topicId: value.topicId,
    companies: readCompanies(value.companies),
    acceptanceRate: '—',
    isSolved: false,
    isBookmarked: false,
    isOwnProblem: value.isOwnProblem,
    questionPlatform,
    qpfRefName: questionPlatform,
  };
};
