import { z } from 'zod';
import { emailRule, passwordRule, nameRule } from '../commonRules';

export const otpRule = z
  .string()
  .trim()
  .min(1, 'Enter the 6-digit OTP code.')
  .regex(/^\d{6}$/, 'OTP must be exactly 6 digits.');

/**
 * Login Form Validation Schema
 */
export const loginSchema = z.object({
  email: emailRule,
  password: passwordRule,
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration (Signup) Form Validation Schema
 * Backend contract: firstName, lastName, email, password, role ('USER')
 * Cross-field match: password and confirmPassword must match.
 */
const signupFieldsSchema = z.object({
  firstName: nameRule('First name'),
  lastName: nameRule('Last name', 1),
  email: emailRule,
  password: passwordRule,
  confirmPassword: z.string().min(1, 'Confirm your password.'),
});

export const signupSchema = signupFieldsSchema
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

/** API payload validation for callers outside the React Hook Form signup flow. */
export const signupPayloadSchema = signupFieldsSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  password: true,
});

/**
 * Forgot Password Step 1 Schema: Request Reset OTP
 */
export const forgotPasswordStep1Schema = z.object({
  email: emailRule,
});

export type ForgotPasswordStep1Data = z.infer<typeof forgotPasswordStep1Schema>;

/**
 * Forgot Password Step 2 Schema: Verify OTP & Reset Password
 */
export const forgotPasswordStep2Schema = z
  .object({
    otp: otpRule,
    newPassword: passwordRule,
    confirmNewPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match.',
    path: ['confirmNewPassword'],
  });

export type ForgotPasswordStep2Data = z.infer<typeof forgotPasswordStep2Schema>;

/** API payload validation for the password-reset endpoint. */
export const verifyPasswordResetOtpPayloadSchema = z.object({
  email: emailRule,
  otp: otpRule,
  password: passwordRule,
});
