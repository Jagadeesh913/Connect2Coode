import type { ApiPage } from './api';

export interface ReferenceItem {
  id: number;
  refGroupCode: string;
  refCode: string;
  refName: string;
  isActive: boolean;
  /** Optional backend-owned image for visual reference groups such as QPF. */
  logoUrl?: string | null;
}

export interface CreateReferenceItemRequest {
  refGroupCode: string;
  refGroupName: string;
  refCode: string;
  refName: string;
  isActive: boolean;
}

export interface UpdateReferenceItemRequest {
  id: number;
  refGroupCode: string;
  refCode: string;
  refName: string;
  isActive: boolean;
}

export type SaveReferenceItemRequest =
  | CreateReferenceItemRequest
  | UpdateReferenceItemRequest;

export interface Company {
  id?: string | number | null;
  name: string;
  slug?: string;
  logo?: string;
  industry?: string;
  problemCount?: number;
  description?: string;
  website?: string;
  headquarters?: string;
  isActive?: boolean;
  difficultyBreakdown?: {
    easy: number;
    medium: number;
    hard: number;
  };
  rounds?: Array<{
    name: string;
    description: string;
  }>;
}

export interface QuestionPlatformSummary {
  id: number;
  refGroupCode: string;
  refGroupName: string | null;
  refCode: string;
  refName: string;
  isActive: boolean;
  logoUrl: string | null;
}

export interface QuestionCompanySummary {
  id: number;
  name: string;
  logo: string;
  website: string;
  isActive: boolean;
}

export interface Problem {
  id: string;
  questionId?: string | number;
  title: string;
  slug: string;
  difficulty: string;
  difficultyId?: number;
  category: string;
  topic: string;
  topicId?: number;
  companies: string[];
  companyDetails?: Company[];
  acceptanceRate: string;
  isSolved: boolean;
  isBookmarked: boolean;
  isOwnProblem?: boolean;
  leetCodeUrl?: string;
  gfgUrl?: string;
  hackerRankUrl?: string;
  description?: string;
  constraints?: string;
  difficultyRefName?: string;
  difficultyRefCode?: string;
  topicRefName?: string;
  topicRefCode?: string;
  qpfRefGroupCode?: string;
  qpfRefCode?: string;
  qpfRefName?: string;
  questionPlatform?: string;
  platformLogoUrl?: string | null;
  platformName?: string;
  examPlatform?: string;
  questionHints?: QuestionHint[];
  hints?: string[];
  testCases?: QuestionTestCase[];
  codeSnippets?: Record<string, string>;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
}

export interface ProblemFilter {
  category?: string;
  topic?: number[] | string | number | null;
  difficulty?: number[] | string | number | null;
  level?: number[] | string | number | null;
  search?: string | null;
  searchText?: string | null;
  company?: number[] | string | number | null;
  companies?: number[] | string[] | null;
  page?: number;
  limit?: number;
}

export interface QuestionHint {
  id?: number | null;
  questionId?: number;
  hintText: string;
  displayOrder?: number;
}

export interface QuestionTestCase {
  id?: number;
  questionId?: number;
  input: string;
  expectedOutput: string;
  explanation: string;
  isHidden: boolean;
  displayOrder: number;
  typeRefGroupCode: string;
  typeRefCode: string;
  typeRefName?: string;
}

export interface Question {
  id?: number;
  title: string;
  description: string;
  constraints?: string;
  difficultyRefGroupCode: string;
  difficultyRefCode: string;
  difficultyRefName: string;
  topicRefGroupCode: string;
  topicRefCode: string;
  topicRefName: string;
  qpfRefGroupCode: string;
  qpfRefCode: string;
  qpfRefName: string;
  questionPlatform?: string;
  platformName?: string;
  questionHints: QuestionHint[];
  companies?: Company[] | any[];
  hackerRankUrl?: string;
  leetCodeUrl?: string;
  gfgUrl?: string;
  isOwnProblem?: boolean;
  isActive?: boolean;
  askedDate?: string | null;
  testCases?: QuestionTestCase[];
}

export interface QuestionListItem {
  id: number;
  title: string;
  description: string;
  difficultyId: number;
  difficultyName: string;
  topicId: number;
  topicName: string;
  companies: QuestionCompanySummary[];
  questionPlatform: QuestionPlatformSummary | null;
  isOwnProblem: boolean;
  isActive: boolean;
}

export interface PageRequest {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface QuestionListRequest {
  level: number[] | null;
  companies: number[] | null;
  topic: number[] | null;
  searchText: string | null;
  pageRequest: PageRequest;
}

export type QuestionPage = ApiPage<QuestionListItem>;

export interface Language {
  id: number;
  name: string;
  referenceId?: number;
  judge0LanguageId?: number;
  version?: string;
  languageName?: string;
  isActive?: boolean;
}

export interface AdminLanguage {
  id?: number;
  referenceId: number;
  languageName?: string;
  judge0LanguageId: number;
  version?: string;
  isActive?: boolean;
}

export interface UserInfoData {
  id?: number | null;
  userId?: number | string;
  firstName?: string | null;
  lastName?: string | null;
  regNumber?: string | null;
  joinedYear?: number | null;
  passedOutYear?: number | null;
  /** The API has returned both `college` and `collegeName`; services normalize both to this field. */
  college?: string | null;
  collegeId?: number | null;
  bio?: string | null;
  gender?: ReferenceItem | null;
  dob?: string | null;
}

export interface SaveUserInfoPayload {
  id?: number | null;
  userId: number;
  regNumber: string;
  joinedYear: number;
  passedOutYear: number;
  college: string;
  collegeId?: number | null;
  bio: string;
  gender?: ReferenceItem | null;
  dob?: string | null;
}

export interface UserProfile {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  isDarkTheme?: boolean;
}

export type User = UserProfile;

export interface CodeExecutionPayload {
  questionId: number;
  languageId: number;
  sourceCode: string;
  customInput?: string;
}

export interface ExecutionTestCaseResult {
  testCaseId: number;
  testCaseType: string;
  isHidden?: boolean | null;
  status: 'Passed' | 'Failed' | 'Compilation Error' | string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  errorMessage?: string;
  executionTime?: number | string;
  memoryUsage?: number | string;
}

export interface ExecutionResult {
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  executionTime?: number | string;
  executionTimeUnit?: 'ms';
  memoryUsage?: number | string;
  memoryUnit?: 'MB';
  status?: number | string;
  message?: string;
  stdout?: string;
  diagnostics: string[];
  testCases: ExecutionTestCaseResult[];
}

export type ExecutionVerdict = 'accepted' | 'compilation-error' | 'runtime-error' | 'failed';

/**
 * Institution Management Domain Models
 * Matches backend Spring Boot REST entities & C2CResponse DTOs
 */
export type InstitutionType = 'COLLEGE' | 'UNIVERSITY';

export interface Institution {
  id: number;
  aisheCode: string;
  name: string;
  institutionType: InstitutionType;
  universityId?: number | null;
  universityName?: string | null;
  university?: Institution | null;
  state: string;
  district: string;
  website?: string | null;
  yearOfEstablishment?: number | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface InstitutionOptionDTO {
  id: number;
  name: string;
  institutionType: InstitutionType;
  state: string;
  district: string;
}

export interface InstitutionFilterParams {
  page?: number;
  size?: number;
  query?: string;
  type?: InstitutionType;
  state?: string;
  district?: string;
  activeOnly?: boolean;
}

export interface CreateInstitutionRequest {
  aisheCode: string;
  name: string;
  institutionType: InstitutionType;
  universityId?: number | null;
  state: string;
  district: string;
  website?: string | null;
  yearOfEstablishment?: number | null;
  isActive?: boolean;
}

export interface UpdateInstitutionRequest {
  aisheCode?: string;
  name?: string;
  institutionType?: InstitutionType;
  universityId?: number | null;
  state?: string;
  district?: string;
  website?: string | null;
  yearOfEstablishment?: number | null;
  isActive?: boolean;
}

export interface UpdateInstitutionStatusRequest {
  isActive: boolean;
}

export interface McqOption {
  id?: number;
  optionLabel: string;
  optionText: string;
  isCorrect?: boolean;
}

export interface McqQuestion {
  id: number;
  subjectGroupCode: string;
  subjectRefCode: string;
  subjectRefName: string;
  topicGroupCode?: string | null;
  topicRefCode?: string | null;
  topicRefName?: string | null;
  difficultyGroupCode?: string | null;
  difficultyRefCode?: string | null;
  difficultyRefName?: string | null;
  companyName?: string | null;
  companyId?: number | null;
  question: string;
  explanation?: string | null;
  isActive?: boolean;
  options: McqOption[];
}

export interface McqQueryPayload {
  subject?: number[];
  difficulty?: number[];
  companies?: number[];
  topic?: number[] | null;
  searchText?: string;
  pageRequest: {
    pageNumber: number;
    pageSize: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
  };
}

export interface AdminSaveMcqPayload {
  id?: number;
  subjectGroupCode: string;
  subjectRefCode: string;
  subjectRefName?: string;
  topicGroupCode: string;
  topicRefCode: string;
  topicRefName?: string;
  difficultyGroupCode: string;
  difficultyRefCode: string;
  difficultyRefName?: string;
  companyId?: number | null;
  companyName?: string | null;
  question: string;
  explanation?: string;
  isActive?: boolean;
  options: Array<{
    id?: number;
    optionLabel: string;
    optionText: string;
    isCorrect: boolean;
  }>;
}



