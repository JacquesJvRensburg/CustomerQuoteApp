/** Hosts allowed for flag images (and their subdomains). */
const FLAG_IMAGE_HOSTS = ['flagcdn.com'] as const;

/**
 * Returns a safe http(s) URL, or '' if the value is missing or uses another scheme.
 * Blocks javascript:, data:, and other non-http schemes used in phishing/XSS payloads.
 */
export function sanitizeHttpUrl(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }

    return url.href;
  } catch {
    return '';
  }
}

/**
 * Returns a safe https flag-image URL on an allowlisted host, or '' otherwise.
 */
export function sanitizeFlagImageUrl(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') {
      return '';
    }

    const host = url.hostname.toLowerCase();
    const allowed = FLAG_IMAGE_HOSTS.some(
      (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`),
    );

    return allowed ? url.href : '';
  } catch {
    return '';
  }
}
