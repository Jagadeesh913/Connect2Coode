export const APPROVED_ADMIN_ROLES: readonly string[] = ['ADMIN', 'ROLE_ADMIN'];

/** Uses the backend response role for client-side routing and display decisions. */
export function isAdminRole(role: unknown): boolean {
  if (typeof role !== 'string') return false;
  return APPROVED_ADMIN_ROLES.includes(role.trim().toUpperCase());
}

function containsControlCharacter(str: string): boolean {
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code <= 31 || code === 127) {
      return true;
    }
  }
  return false;
}

/**
 * Sanitizes redirect destination to prevent open-redirect vulnerabilities.
 * Only allows relative internal paths within the single page application.
 * Strictly rejects protocol-relative URLs (//), any backslash (\), colons (:),
 * URL-encoded obfuscation (%5C, %2F%2F), control characters, and authentication/oauth routes.
 */
export function getSafeRedirectUrl(target: string | null | undefined): string {
  if (!target || typeof target !== 'string') return '/practice';
  const trimmed = target.trim();

  // Reject control characters, newlines, and null bytes
  if (containsControlCharacter(trimmed)) return '/practice';

  // Decode URI encoding to detect obfuscated open-redirect payloads (e.g., %5C, %2F%2F)
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // Malformed URI encoding
    return '/practice';
  }

  // Check decoded string for control chars, backslashes, protocol-relative prefixes, or schemes
  if (containsControlCharacter(decoded)) return '/practice';
  if (decoded.includes('\\') || decoded.startsWith('//') || decoded.includes(':')) {
    return '/practice';
  }

  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes('\\') &&
    !trimmed.includes(':') &&
    !trimmed.startsWith('/login') &&
    !trimmed.startsWith('/signup') &&
    !trimmed.startsWith('/forgot-password') &&
    !trimmed.startsWith('/auth') &&
    !trimmed.startsWith('/oauth')
  ) {
    return trimmed;
  }
  return '/practice';
}
