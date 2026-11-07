/**
 * Converts untrusted API values into a browser-safe external HTTP(S) URL.
 *
 * Backend records can predate current form validation, so every rendered link
 * must enforce the protocol at the final DOM boundary. Bare hostnames are
 * normalized to HTTPS for compatibility with older company records.
 */
export function getSafeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const candidate = value.trim();
  if (!candidate || candidate.startsWith('/') || candidate.includes('\\')) return null;

  const normalized = /^[a-z][a-z\d+.-]*:/i.test(candidate)
    ? candidate
    : `https://${candidate}`;

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const isPrivateNetworkHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.lan') ||
    host === '::1' ||
    (host.includes(':') && (
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe80:')
    ))
  ) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return true;
  return (
    octets[0] === 0 ||
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
};

/** Strict boundary for passive image fetches from session/API data. */
export function getSafeRemoteImageUrl(value: unknown): string | null {
  const safeUrl = getSafeExternalUrl(value);
  if (!safeUrl) return null;
  const url = new URL(safeUrl);
  if (url.protocol !== 'https:' || isPrivateNetworkHost(url.hostname)) return null;
  return url.toString();
}
