import { describe, it, expect } from 'vitest';
import { isAdminRole, getSafeRedirectUrl } from './jwt';

describe('JWT & Security Utilities', () => {
  describe('isAdminRole', () => {
    it('accepts valid admin roles regardless of case and whitespace', () => {
      expect(isAdminRole('ADMIN')).toBe(true);
      expect(isAdminRole('admin')).toBe(true);
      expect(isAdminRole('ROLE_ADMIN')).toBe(true);
      expect(isAdminRole('  role_admin  ')).toBe(true);
    });

    it('rejects non-admin roles and invalid values', () => {
      expect(isAdminRole('USER')).toBe(false);
      expect(isAdminRole('STUDENT')).toBe(false);
      expect(isAdminRole('')).toBe(false);
      expect(isAdminRole(null)).toBe(false);
      expect(isAdminRole(undefined)).toBe(false);
      expect(isAdminRole(123)).toBe(false);
    });
  });

  describe('getSafeRedirectUrl (Open-Redirect Prevention)', () => {
    it('allows valid internal relative paths', () => {
      expect(getSafeRedirectUrl('/practice')).toBe('/practice');
      expect(getSafeRedirectUrl('/dsa-sheet')).toBe('/dsa-sheet');
      expect(getSafeRedirectUrl('/companies/amazon')).toBe('/companies/amazon');
      expect(getSafeRedirectUrl('/profile')).toBe('/profile');
    });

    it('defaults to /practice when input is null, undefined, or empty', () => {
      expect(getSafeRedirectUrl(null)).toBe('/practice');
      expect(getSafeRedirectUrl(undefined)).toBe('/practice');
      expect(getSafeRedirectUrl('')).toBe('/practice');
      expect(getSafeRedirectUrl('   ')).toBe('/practice');
    });

    it('strictly rejects external URLs and protocol-relative attempts', () => {
      expect(getSafeRedirectUrl('https://malicious.com')).toBe('/practice');
      expect(getSafeRedirectUrl('http://evil.com/phish')).toBe('/practice');
      expect(getSafeRedirectUrl('//evil.com')).toBe('/practice');
      expect(getSafeRedirectUrl('/\\evil.com')).toBe('/practice');
      expect(getSafeRedirectUrl('\\\\evil.com')).toBe('/practice');
    });

    it('rejects URL-encoded obfuscation payloads', () => {
      expect(getSafeRedirectUrl('%2F%2Fevil.com')).toBe('/practice');
      expect(getSafeRedirectUrl('/%5Cevil.com')).toBe('/practice');
    });

    it('rejects auth/login loops', () => {
      expect(getSafeRedirectUrl('/login')).toBe('/practice');
      expect(getSafeRedirectUrl('/signup')).toBe('/practice');
      expect(getSafeRedirectUrl('/auth/login')).toBe('/practice');
      expect(getSafeRedirectUrl('/oauth/callback')).toBe('/practice');
    });
  });
});
