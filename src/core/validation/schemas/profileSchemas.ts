import { z } from 'zod';
import {
  requiredTextRule,
  optionalUrlRule,
} from '../commonRules';

const currentYear = new Date().getFullYear();

/**
 * The verified /userInfo DTO supports academic details plus optional personal
 * fields returned by the profile service.
 * Cross-field rule: passedOutYear must be greater than or equal to joinedYear.
 */
export const academicDetailsSchema = z
  .object({
    regNumber: requiredTextRule('Registration number', 1),
    joinedYear: z.coerce
      .number({ error: 'Please select a valid joined year' })
      .int()
      .min(1990, 'Joined year cannot be earlier than 1990')
      .max(currentYear + 2, 'Joined year cannot be in the future'),
    passedOutYear: z.coerce
      .number({ error: 'Please select a valid graduation year' })
      .int()
      .min(1990, 'Graduation year cannot be earlier than 1990')
      .max(currentYear + 10, 'Graduation year cannot exceed 10 years in the future'),
    college: requiredTextRule('College or university name', 2),
    collegeId: z.number().int().positive().nullable().optional(),
    bio: z.string().trim().max(500, 'Bio cannot exceed 500 characters').optional().or(z.literal('')),
    genderId: z.number().int().positive().nullable().optional(),
    dob: z
      .string()
      .trim()
      .regex(/^$|^\d{4}-\d{2}-\d{2}$/, 'Date of birth must use YYYY-MM-DD.')
      .optional(),
  })
  .refine((data) => data.passedOutYear >= data.joinedYear, {
    message: 'Graduation year cannot be earlier than joined year.',
    path: ['passedOutYear'],
  });

export type AcademicDetailsFormData = z.infer<typeof academicDetailsSchema>;

/**
 * Institution Selection / Affiliation Schema
 * Accepts either registered search results or typed institution name.
 */
export const institutionSelectionSchema = z.object({
  id: z
    .number({ error: 'Select your college or university from the search results.' })
    .min(1, 'Select your college or university from the search results.'),
  name: requiredTextRule('College or university name', 2),
  aisheCode: z.string().trim().optional(),
  institutionType: z.enum(['COLLEGE', 'UNIVERSITY']).optional(),
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  website: optionalUrlRule('Website URL'),
  yearOfEstablishment: z.number().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type InstitutionSelectionFormData = z.infer<typeof institutionSelectionSchema>;

/**
 * Avatar / Photo URL Schema
 */
export const avatarUrlSchema = z.object({
  avatarUrl: optionalUrlRule('Image URL'),
});

export type AvatarUrlFormData = z.infer<typeof avatarUrlSchema>;
