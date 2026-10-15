/**
 * Builds a cache-busted image URL for the admin portal.
 *
 * Browsers aggressively cache 404s and images. Adding a version key
 * (such as artwork creation timestamp or ID) and cache-busting timestamp
 * ensures the browser fetches the newly uploaded painting immediately
 * instead of displaying a blank or cached failure.
 */
export function getAdminImageUrl(
  src: string,
  versionKey?: string | number,
  cacheBustTimestamp?: number,
  retryCount = 0
): string {
  if (!src) return '/images/banner.jpeg';
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;

  const [base, query] = src.split('?');
  const params = new URLSearchParams(query || '');

  if (cacheBustTimestamp && cacheBustTimestamp > 0) {
    params.set('t', String(cacheBustTimestamp));
    if (retryCount > 0) params.set('r', String(retryCount));
  } else if (versionKey) {
    params.set('v', String(versionKey));
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
