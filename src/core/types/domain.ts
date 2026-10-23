import type { ApiPage } from './api';

export interface ReferenceItem {
  id: number;
  refGroupCode: string;
  refCode: string;
  refName: string;
  isActive: boolean;
}

export interface Company {
  id?: string | number | null;
  name: string;
  slug?: string;
  logo?: string;
  logoUrl?: string;
  industry?: string;
  problemCount?: number;
  description?: string;
  website?: string;
  websiteUrl?: string;
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
  platform?: number[] | string | number | null;
  platforms?: number[] | string[] | null;
  qpf?: number[] | string | number | null;
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
  difficultyId?: number;
  difficultyName?: string;
  topicId?: number;
  topicName?: string;
  isOwnProblem?: boolean;
  isActive?: boolean;
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
  regNumber?: string;
  joinedYear?: number | string;
  passedOutYear?: number | string;
  college?: string;
  collegeName?: string;
  collegeId?: number | string | null;
  bio?: string;
  gender?: ReferenceItem | { id: number; refGroupCode?: string; refCode?: string; refName?: string; isActive?: boolean } | null;
  dob?: string | null;
}

export interface SaveUserInfoPayload {
  id?: number | null;
  userId?: number;
  regNumber: string;
  joinedYear: number;
  passedOutYear: number;
  college: string;
  collegeId?: string | number | null;
  bio: string;
  gender?: ReferenceItem | { id: number; refGroupCode?: string; refCode?: string; refName?: string; isActive?: boolean } | null;
  dob?: string | null;
  jwtToken?: string;
}

export interface UserProfile {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  role?: string;
  collegeName?: string;
  graduationYear?: number | string;
  phone?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  leetcodeUrl?: string;
  bio?: string;
  avatarUrl?: string;
  dob?: string | null;
  gender?: string | ReferenceItem | { id: number; refGroupCode?: string; refCode?: string; refName?: string; isActive?: boolean } | null;
  location?: string;
  degree?: string;
  branch?: string;
  currentYear?: string;
  joinedYear?: number | string;
  passedOutYear?: number | string;
  regNumber?: string;
  institutionId?: number | null;
  institution?: Institution | null;
  userInfo?: UserInfoData | null;
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
}

export interface ExecutionResult {
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  runtimeMs?: number | string;
  memoryMb?: number | string;
  testCases: ExecutionTestCaseResult[];
}

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
  institutionType?: InstitutionType;
  type?: InstitutionType;
  state?: string;
  district?: string;
  isActive?: boolean;
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
  correctOption?: string | null;
  correctAnswer?: string | null;
  answer?: string | null;
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

export interface AdminCreateMcqPayload {
  id?: number;
  subjectGroupCode: string;
  subjectRefCode: string;
  topicGroupCode: string;
  topicRefCode: string;
  difficultyGroupCode: string;
  difficultyRefCode: string;
  companyId?: number | null;
  question: string;
  explanation?: string;
  isActive?: boolean;
  correctOption?: string | null;
  correctAnswer?: string | null;
  answer?: string | null;
  options: Array<{
    id?: number;
    optionId?: number;
    optionLabel: string;
    optionText: string;
    isCorrect: boolean;
    correct?: boolean;
    is_correct?: boolean;
  }>;
}



