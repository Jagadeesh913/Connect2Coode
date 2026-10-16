import { z } from 'zod';

/**
 * Standard Email Validator
 * Allows real-world standard emails (RFC 5322 compliant characters including +, subdomains)
 * without being overly restrictive while preventing common typos.
 */
export const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const emailRule = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .regex(emailRegex, 'Enter a valid email address, for example, name@example.com.');

/**
 * Standard Password Validator
 * Enforces production security standard min 6 chars with clear guidance.
 */
export const passwordRule = z
  .string()
  .min(1, 'Enter your password.')
  .min(6, 'Password must be at least 6 characters long.');

/**
 * International Name Validator
 * Accepts Unicode characters (letters with accents, umlauts, non-Latin scripts),
 * spaces, hyphens, and apostrophes (e.g. O'Connor, Renée, Mary-Jane, Smith Jr.).
 * Rejects whitespace-only and strings under 2 characters.
 */
export const nameRegex = /^[\p{L}\p{M}\s'’\-. ]+$/u;

export const nameRule = (fieldName: string, minLength = 2) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${fieldName.toLowerCase()}.`)
    .min(minLength, `${fieldName} must be at least ${minLength} characters.`)
    .refine((val) => nameRegex.test(val), {
      message: `${fieldName} should contain only letters, spaces, hyphens, or apostrophes.`,
    });

/**
 * Phone Number Validator
 * Supports standard local and international E.164 phone formats (7 to 15 digits, optional leading +).
 */
export const phoneRegex = /^\+?[0-9\s\-()]{7,18}$/;

export const optionalPhoneRule = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => !val || (phoneRegex.test(val) && (val.match(/\d/g) || []).length >= 7),
    {
      message: 'Enter a valid phone number (minimum 7 digits).',
    }
  );

/**
 * URL Validator
 * Checks for valid http:// or https:// protocol and valid domain structure.
 */
export const urlRegex = /^https?:\/\/(?:localhost(?::\d+)?|(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b)(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i;

export const optionalUrlRule = (fieldName = 'URL', allowRelative = false) =>
  z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || (allowRelative && val.startsWith('/')) || urlRegex.test(val), {
      message: `${fieldName} must start with http:// or https:// and have a valid web address.`,
    });

export const requiredUrlRule = (fieldName = 'URL', allowRelative = false) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${fieldName.toLowerCase()}.`)
    .refine((val) => (allowRelative && val.startsWith('/')) || urlRegex.test(val), {
      message: `${fieldName} must start with http:// or https:// and have a valid web address.`,
    });

/**
 * Year Validator
 * Validates bounded integer year.
 */
export const yearRule = (
  minYear = 1800,
  maxYear = new Date().getFullYear() + 1,
  fieldName = 'Year'
) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z
      .number({ invalid_type_error: `${fieldName} must be a valid number.` })
      .int(`${fieldName} must be a whole year.`)
      .min(minYear, `${fieldName} must be ${minYear} or later.`)
      .max(maxYear, `${fieldName} cannot exceed ${maxYear}.`)
  );

export const optionalYearRule = (
  minYear = 1800,
  maxYear = new Date().getFullYear() + 1,
  fieldName = 'Year'
) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z
      .number({ invalid_type_error: `${fieldName} must be a valid number.` })
      .int(`${fieldName} must be a whole year.`)
      .min(minYear, `${fieldName} must be ${minYear} or later.`)
      .max(maxYear, `${fieldName} cannot exceed ${maxYear}.`)
      .nullable()
      .optional()
  );

/**
 * AISHE Code Validator
 * Letters, numbers, and hyphens, automatically trimmed and uppercase.
 */
export const aisheCodeRule = z
  .string()
  .trim()
  .min(1, 'Enter the AISHE code.')
  .regex(
    /^[A-Za-z0-9\-_]+$/,
    'AISHE code can only contain letters, numbers, hyphens, and underscores.'
  )
  .transform((val) => val.toUpperCase());

/**
 * Required Text (non-whitespace)
 */
export const requiredTextRule = (fieldName: string, minLength = 1) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${fieldName.toLowerCase()}.`)
    .min(minLength, `${fieldName} must be at least ${minLength} characters.`);
