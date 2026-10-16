import { z } from 'zod';
import {
  nameRule,
  aisheCodeRule,
  requiredTextRule,
  optionalUrlRule,
  optionalYearRule,
} from '../commonRules';

const currentYear = new Date().getFullYear();

/**
 * Admin Institution Form Schema
 * Governs POST /api/v1/admin/institutions and PUT /api/v1/admin/institutions/{id}
 */
export const adminInstitutionSchema = z
  .object({
    id: z.number().nullable().optional(),
    aisheCode: aisheCodeRule,
    name: nameRule('Institution name', 2),
    institutionType: z.enum(['COLLEGE', 'UNIVERSITY'], {
      required_error: 'Select an institution type (COLLEGE or UNIVERSITY).',
    }),
    universityId: z.number().nullable().optional(),
    state: requiredTextRule('State', 2),
    district: requiredTextRule('District', 2),
    website: optionalUrlRule('Website URL'),
    yearOfEstablishment: optionalYearRule(1800, currentYear + 1, 'Year of establishment'),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // If institution is a UNIVERSITY, universityId must be null
      if (data.institutionType === 'UNIVERSITY' && data.universityId !== null && data.universityId !== undefined) {
        return false;
      }
      return true;
    },
    {
      message: 'A university cannot be affiliated with another university.',
      path: ['universityId'],
    }
  );

export type AdminInstitutionFormData = z.infer<typeof adminInstitutionSchema>;

/**
 * Admin Hiring Company Form Schema
 */
export const adminCompanySchema = z.object({
  id: z.number().nullable().optional(),
  name: requiredTextRule('Company name', 2),
  websiteUrl: optionalUrlRule('Website URL'),
  logoUrl: optionalUrlRule('Logo image URL', true),
  description: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export type AdminCompanyFormData = z.infer<typeof adminCompanySchema>;

/**
 * Admin DSA Question Form Schema
 */
export const adminQuestionSchema = z.object({
  id: z.number().nullable().optional(),
  title: requiredTextRule('Title', 3),
  description: requiredTextRule('Description', 10),
  constraints: z.string().trim().optional(),
  difficultyRefGroupCode: z.string().default('DIFF'),
  difficultyRefCode: z.string().min(1, 'Difficulty is required.'),
  difficultyRefName: z.string().min(1, 'Difficulty name is required.'),
  topicRefGroupCode: z.string().default('TOPIC'),
  topicRefCode: z.string().min(1, 'Category / Topic is required.'),
  topicRefName: z.string().min(1, 'Topic name is required.'),
  qpfRefGroupCode: z.string().default('QPF'),
  qpfRefCode: z.string().min(1, 'Platform is required.'),
  qpfRefName: z.string().min(1, 'Platform name is required.'),
  leetCodeUrl: optionalUrlRule('LeetCode URL'),
  gfgUrl: optionalUrlRule('GeeksforGeeks URL'),
  hackerRankUrl: optionalUrlRule('HackerRank URL'),
  isOwnProblem: z.boolean().default(true),
  isActive: z.boolean().default(true),
  askedDate: z.string().nullable().optional(),
});

export type AdminQuestionFormData = z.infer<typeof adminQuestionSchema>;

/**
 * Admin Test Case Form Schema
 */
export const adminTestCaseSchema = z.object({
  id: z.number().optional(),
  questionId: z.union([z.number(), z.string()]).optional(),
  input: z.string().trim().min(1, 'Input raw string is required.'),
  expectedOutput: z.string().trim().min(1, 'Expected output raw string is required.'),
  explanation: z.string().trim().optional(),
  isHidden: z.boolean().default(false),
  displayOrder: z.number().optional(),
  typeRefGroupCode: z.string().default('TESTCASETYPE'),
  typeRefCode: z.string().min(1, 'Test case type is required.'),
  typeRefName: z.string().optional(),
});

export type AdminTestCaseFormData = z.infer<typeof adminTestCaseSchema>;

/**
 * Admin Language Registration Form Schema
 */
export const adminLanguageSchema = z.object({
  id: z.number().optional(),
  referenceId: z
    .number({ invalid_type_error: 'Select a valid language from the list.' })
    .min(1, 'Select a valid language from the list.'),
  judge0LanguageId: z
    .number({ invalid_type_error: 'Enter a valid numeric Judge0 Language ID.' })
    .min(1, 'Judge0 Language ID must be greater than 0.'),
  version: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export type AdminLanguageFormData = z.infer<typeof adminLanguageSchema>;
