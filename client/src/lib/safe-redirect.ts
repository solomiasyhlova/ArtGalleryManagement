const DEFAULT_REDIRECT = '/';

/** Any fixed origin works: it only tells whether `target` stays on the same origin. */
const BASE = new URL('http://app.invalid');

/**
 * Returns `target` if it is an internal path, otherwise `/`. Blocks open redirects such as
 * `https://evil.com`, `//evil.com` and `/\evil.com` (browsers read a backslash as a slash).
 */
export function safeRedirect(target: string | null | undefined): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return DEFAULT_REDIRECT;

  let url: URL;
  try {
    url = new URL(target, BASE);
  } catch {
    return DEFAULT_REDIRECT;
  }
  if (url.origin !== BASE.origin) return DEFAULT_REDIRECT;
  return url.pathname + url.search + url.hash;
}
