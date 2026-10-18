import { z } from 'zod';
import {
  nameRule,
  emailRule,
  optionalPhoneRule,
  yearRule,
  requiredTextRule,
  optionalUrlRule,
} from '../commonRules';

const currentYear = new Date().getFullYear();

/**
 * Personal Information Modal Schema
 */
export const personalInfoSchema = z.object({
  fullName: nameRule('Full name'),
  email: emailRule,
  phone: optionalPhoneRule,
  dob: z.string().trim().optional().or(z.literal('')),
  gender: z.string().trim().optional().or(z.literal('')),
  location: z.string().trim().optional().or(z.literal('')),
  bio: z.string().trim().optional().or(z.literal('')),
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

/**
 * Academic Details Modal Schema
 * Cross-field rule: passedOutYear must be greater than or equal to joinedYear.
 */
export const academicDetailsSchema = z
  .object({
    regNumber: requiredTextRule('Registration number', 1),
    degree: z.string().trim().optional().or(z.literal('')),
    branch: z.string().trim().optional().or(z.literal('')),
    joinedYear: yearRule(1990, currentYear + 5, 'Joined year'),
    passedOutYear: yearRule(1990, currentYear + 10, 'Graduation year'),
    college: requiredTextRule('College or university name', 2),
    bio: z.string().trim().optional().or(z.literal('')),
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
    .number({ invalid_type_error: 'Select your college or university from the search results.' })
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
