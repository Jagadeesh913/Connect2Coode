/**
 * Cross-tab authentication notifications contain no credentials or user data.
 * BroadcastChannel is preferred; the storage-event fallback is only used for
 * browsers that do not support it and removes its transient marker immediately.
 */
export type AuthSessionEventType = 'session-updated' | 'session-cleared';

export interface AuthSessionEvent {
  type: AuthSessionEventType;
  occurredAt: number;
}

const CHANNEL_NAME = 'c2c-auth-session';
const FALLBACK_STORAGE_KEY = 'c2c_auth_session_event';
let publisherChannel: BroadcastChannel | null | undefined;

export const isAuthSessionEvent = (value: unknown): value is AuthSessionEvent => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AuthSessionEvent>;
  const keys = Object.keys(candidate);
  return (
    keys.length === 2 &&
    keys.includes('type') &&
    keys.includes('occurredAt') &&
    (candidate.type === 'session-updated' || candidate.type === 'session-cleared') &&
    typeof candidate.occurredAt === 'number' &&
    Number.isFinite(candidate.occurredAt)
  );
};

function supportsBroadcastChannel(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}

function getPublisherChannel(): BroadcastChannel | null {
  if (publisherChannel !== undefined) return publisherChannel;
  try {
    publisherChannel = new BroadcastChannel(CHANNEL_NAME);
    (publisherChannel as unknown as { unref?: () => void }).unref?.();
  } catch {
    publisherChannel = null;
  }
  return publisherChannel;
}

export function publishAuthSessionEvent(type: AuthSessionEventType): void {
  const event: AuthSessionEvent = { type, occurredAt: Date.now() };

  if (supportsBroadcastChannel()) {
    try {
      const channel = getPublisherChannel();
      if (channel) {
        channel.postMessage(event);
        return;
      }
    } catch {
      // Fall through to the browser-supported storage event transport.
    }
  }

  try {
    window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(event));
    window.localStorage.removeItem(FALLBACK_STORAGE_KEY);
  } catch {
    // Cross-tab sync is unavailable in this browser/privacy mode. Cookie state
    // still determines authentication on the next request or page load.
  }
}

export function subscribeToAuthSessionEvents(listener: (event: AuthSessionEvent) => void): () => void {
  if (supportsBroadcastChannel()) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (message: MessageEvent<unknown>) => {
        if (isAuthSessionEvent(message.data)) listener(message.data);
      };
      return () => channel.close();
    } catch {
      // Fall through to the browser-supported storage event transport.
    }
  }

  if (typeof window === 'undefined') return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== FALLBACK_STORAGE_KEY || !event.newValue) return;
    try {
      const message = JSON.parse(event.newValue) as unknown;
      if (isAuthSessionEvent(message)) listener(message);
    } catch {
      // Ignore malformed data written by an unrelated script.
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}
