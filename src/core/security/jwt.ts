/**
 * JWT utilities for client-side navigation and UX checks (F-036).
 *
 * IMPORTANT SECURITY ARCHITECTURE NOTE:
 * Client-side decoding of a JWT inspects claims for route rendering and UX gating ONLY.
 * Decoding the payload does NOT verify cryptographic signature on the client.
 * Real system security and data authorization is strictly enforced by the backend
 * server (e.g. Spring Security @PreAuthorize("hasRole('ADMIN')") on protected endpoints).
 */

export interface DecodedJwtPayload {
  sub?: string;
  role?: string;
  Role?: string;
  roles?: string[];
  Roles?: string[];
  authorities?: Array<string | { authority?: string }>;
  scope?: string;
  exp?: number;
  iat?: number;
  email?: string;
  [key: string]: unknown;
}

export function decodeJwtPayload(token: string | null | undefined): DecodedJwtPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const nodeBuffer = (
      globalThis as unknown as {
        Buffer?: { from(data: string, enc: string): { toString(enc: string): string } };
      }
    ).Buffer;

    const decodedBinary =
      typeof atob === 'function'
        ? atob(padded)
        : nodeBuffer
        ? nodeBuffer.from(padded, 'base64').toString('binary')
        : '';

    if (!decodedBinary) return null;

    const jsonPayload = decodeURIComponent(
      decodedBinary
        .split('')
        .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isJwtExpired(payload: DecodedJwtPayload | null): boolean {
  if (!payload || typeof payload.exp !== 'number') return false;
  const isLocalDev =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocalDev) {
    // 24-hour grace leeway for local dev testing so active development sessions aren't interrupted
    return payload.exp * 1000 + 86400000 <= Date.now();
  }
  return payload.exp * 1000 <= Date.now();
}

/**
 * Checks whether a token is a non-empty, well-formed JWT and has not expired.
 */
export function isTokenValid(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string' || token.trim() === '' || token === 'null' || token === 'undefined') {
    return false;
  }
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  return !isJwtExpired(payload);
}

/**
 * Checks whether the JWT contains claims indicating an admin role.
 * Used for client-side UI navigation gating only.
 * Checks role, Role, roles, Roles, authorities, and scope claims.
 */
export function isJwtAdmin(token: string | null | undefined): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  if (isJwtExpired(payload)) return false;

  const matchesAdmin = (val: unknown): boolean => {
    if (typeof val !== 'string') return false;
    const upper = val.toUpperCase().trim();
    return upper === 'ADMIN' || upper === 'ROLE_ADMIN' || upper.includes('ADMIN');
  };

  // 1. Check primary single role claims (e.g. { role: "ADMIN" } or { Role: "ADMIN" })
  if (matchesAdmin(payload.role) || matchesAdmin(payload.Role)) return true;

  // 2. Check roles array claims (e.g. { roles: ["ADMIN"] } or { Roles: ["ADMIN"] })
  const rolesArray = payload.roles || payload.Roles;
  if (Array.isArray(rolesArray) && rolesArray.some(matchesAdmin)) return true;

  // 3. Check Spring Security authorities array (e.g. { authorities: ["ROLE_ADMIN"] } or [{ authority: "ROLE_ADMIN" }])
  if (Array.isArray(payload.authorities)) {
    return payload.authorities.some((auth) =>
      typeof auth === 'string' ? matchesAdmin(auth) : matchesAdmin(auth?.authority)
    );
  }

  // 4. Check OAuth2/OIDC space-delimited scope string
  if (typeof payload.scope === 'string') {
    const scopes = payload.scope.split(' ');
    if (scopes.some(matchesAdmin)) return true;
  }

  return false;
}
