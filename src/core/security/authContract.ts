import type { User } from '../types/domain';

export interface AuthSessionData {
  token: string;
  id: number | string;
  role: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  isDarkTheme?: boolean;
  user?: User;
}

const hasIdentity = (value: unknown): value is number | string =>
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' && value.trim().length > 0);

const requiredText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/**
 * Validates the login/refresh payload before any authenticated state is
 * established. The backend contract requires both the access token and the
 * identity fields needed to restore authorization after a page reload.
 */
export function requireAuthSessionData(value: unknown): AuthSessionData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Authentication response did not contain session data');
  }

  const data = value as Record<string, unknown>;
  const nestedUser = data.user && typeof data.user === 'object' && !Array.isArray(data.user)
    ? data.user as Record<string, unknown>
    : null;
  const token = requiredText(data.token);
  const id = nestedUser?.id ?? data.id;
  const role = requiredText(nestedUser?.role ?? data.role);
  const email = requiredText(nestedUser?.email ?? data.email);

  if (!token || !hasIdentity(id) || !role || !email) {
    throw new Error('Authentication response is missing token or required identity fields');
  }

  const firstName = requiredText(nestedUser?.firstName ?? data.firstName) ?? undefined;
  const lastName = requiredText(nestedUser?.lastName ?? data.lastName) ?? undefined;
  const fullName = requiredText(nestedUser?.fullName ?? data.fullName) ?? undefined;
  const isDarkTheme = typeof (nestedUser?.isDarkTheme ?? data.isDarkTheme) === 'boolean'
    ? Boolean(nestedUser?.isDarkTheme ?? data.isDarkTheme)
    : undefined;

  return {
    token,
    id,
    role,
    email,
    firstName,
    lastName,
    fullName,
    isDarkTheme,
    ...(nestedUser ? {
      user: {
        id,
        role,
        email,
        firstName,
        lastName,
        fullName,
        isDarkTheme,
      } satisfies User,
    } : {}),
  };
}
