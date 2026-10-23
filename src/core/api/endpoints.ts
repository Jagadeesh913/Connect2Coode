/**
 * Centralized REST API Endpoint Constants
 * Maps directly to Java Spring Boot REST Controllers
 */
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/signUp',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    GENERATE_PASSWORD_RESET_OTP: '/auth/generatePasswordResetOtp',
    VERIFY_PASSWORD_RESET_OTP: '/auth/verifyPasswordResetOtp',
  },
  REFERENCE: {
    GROUP: (refGroupCode: string) => `/referenceLibrary/refGroupCode/${refGroupCode}`,
  },
  COMPANY: {
    BASE: '/company',
    LIST: '/company/list',
    DETAILS: (id: string | number) => `/company/${id}`,
    EXAMS: (companyId: string | number) => `/company/${companyId}/exams/list`,
    EXAM_DETAILS: (examId: string | number) => `/company/exams/${examId}`,
    ADMIN_BASE: '/admin/company',
    ADMIN_ROLE: '/admin/companyRole',
    ADMIN_EXAM_SECTION: '/admin/examSection',
    ADMIN_EXAM: '/admin/companyExam',
  },
  QUESTION: {
    BASE: '/question',
    DETAILS: (id: string | number) => `/question/${id}`,
    TEST_CASES: (id: string | number) => `/question/${id}/testCases`,
  },
  PROBLEMS: {
    LIST: '/questions',
  },
  USER: {
    BOOKMARK: (userId: string | number, questionId: string | number) =>
      `/users/${userId}/questions/${questionId}/bookmark`,
    BOOKMARKS: (userId: string | number) => `/users/${userId}/questions/bookmarks`,
    SUBMITTED_QUESTIONS: (userId: string | number) => `/${userId}/getSubmiteedQuestionIds`,
    ATTEMPTED_QUESTIONS: (userId: string | number) => `/${userId}/getAPttemptedQuestionIds`,
    QUESTION_SUBMISSIONS: (userId: string | number, questionId: string | number) =>
      `/${userId}/question/${questionId}/getSubmissions`,
    USER_INFO: (userId: string | number) => `/userInfo/${userId}`,
  },
  LANGUAGE: {
    BASE: '/language',
    DETAILS: (id: string | number) => `/language/${id}`,
  },
  EXECUTION: {
    USER_RUN: '/runCode',
    USER_SUBMIT: '/submitCode',
    ADMIN_RUN: '/admin/testCode',
    ADMIN_SUBMIT: '/admin/submitCode',
  },
  INSTITUTION: {
    ADMIN: {
      BASE: '/admin/institutions',
      DETAILS: (id: string | number) => `/admin/institutions/${id}`,
      STATUS: (id: string | number) => `/admin/institutions/${id}/status`,
    },
    PUBLIC: {
      SEARCH: '/institutions/search',
      DETAILS: (id: string | number) => `/institutions/${id}`,
    },
  },
  MCQ: {
    LIST: '/mcq',
    DETAILS: (id: string | number) => `/mcq/${id}`,
    ADMIN_CREATE: '/admin/mcq',
    ADMIN_DELETE: (id: string | number) => `/admin/mcq/${id}`,
  },
} as const;
