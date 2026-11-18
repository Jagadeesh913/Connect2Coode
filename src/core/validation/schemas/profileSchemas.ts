import { z } from 'zod';
import {
  requiredTextRule,
  optionalUrlRule,
} from '../commonRules';

const currentYear = new Date().getFullYear();
const MAX_REGISTRATION_NUMBER_LENGTH = 64;
const MAX_INSTITUTION_NAME_LENGTH = 160;

const dateOfBirthRule = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const today = new Date();
    return (
      year >= 1900 &&
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day &&
      date.getTime() <= Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    );
  }, 'Enter a valid date of birth that is not in the future.');

/**
 * The verified /userInfo DTO supports academic details plus optional personal
 * fields returned by the profile service.
 * Cross-field rule: passedOutYear must be greater than or equal to joinedYear.
 */
export const academicDetailsSchema = z
  .object({
    firstName: z.string().trim().max(50, 'First name cannot exceed 50 characters').optional().or(z.literal('')),
    lastName: z.string().trim().max(50, 'Last name cannot exceed 50 characters').optional().or(z.literal('')),
    regNumber: requiredTextRule('Registration number', 1).max(
      MAX_REGISTRATION_NUMBER_LENGTH,
      `Registration number cannot exceed ${MAX_REGISTRATION_NUMBER_LENGTH} characters.`
    ),
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
    college: requiredTextRule('College or university name', 2).max(
      MAX_INSTITUTION_NAME_LENGTH,
      `College or university name cannot exceed ${MAX_INSTITUTION_NAME_LENGTH} characters.`
    ),
    collegeId: z.number().int().positive().nullable().optional(),
    bio: z.string().trim().max(500, 'Bio cannot exceed 500 characters').optional().or(z.literal('')),
    genderId: z.number().int().positive().nullable().optional(),
    dob: dateOfBirthRule.optional(),
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
  name: requiredTextRule('College or university name', 2).max(
    MAX_INSTITUTION_NAME_LENGTH,
    `College or university name cannot exceed ${MAX_INSTITUTION_NAME_LENGTH} characters.`
  ),
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
