/**
 * Content-sync helpers shared by the content loader and the publisher.
 *
 * The admin portal keeps its own mirror of `content/site.json` (used for local
 * development and as a fallback when GitHub is not configured), while the
 * public website reads the copy committed to the *site* repository. The two
 * can drift, and when they do the mirror is usually the older one — it was
 * written before a given CMS domain existed (events, the chatbot config, the
 * page listings, brand.mapsUrl ...).
 *
 * Drift used to be dangerous in both directions:
 *   • Loader: an older mirror would *hide* a domain the website already had,
 *     so the portal showed "Upcoming (0)" for events that were live.
 *   • Publisher: that now-empty domain was written straight back over the
 *     website's copy, erasing live content.
 *
 * The two helpers below make drift harmless:
 *   • `fillMissing`      — a copy can never hide a domain a newer copy has.
 *   • `missingTopLevelKeys` — tells the publisher exactly which domains it
 *     preserved, so the outcome is logged instead of guessed.
 */

type Plain = Record<string, unknown>;

function isPlainObject(value: unknown): value is Plain {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-fills only the keys `target` does not define, taking values from
 * `source`. `target` always wins where it has a value, so a deliberate edit —
 * including clearing a list to `[]` — is never overwritten.
 */
export function fillMissing<T>(target: T, source: unknown): T {
  if (!isPlainObject(target) || !isPlainObject(source)) return target;

  const merged: Plain = { ...target };
  for (const [key, sourceValue] of Object.entries(source)) {
    const current = merged[key];
    if (current === undefined || current === null) {
      merged[key] = sourceValue;
    } else if (isPlainObject(current) && isPlainObject(sourceValue)) {
      merged[key] = fillMissing(current, sourceValue);
    }
  }
  return merged as T;
}

/** Top-level keys `source` has that `target` is missing entirely. */
export function missingTopLevelKeys(target: unknown, source: unknown): string[] {
  if (!isPlainObject(target) || !isPlainObject(source)) return [];
  return Object.keys(source).filter((key) => target[key] === undefined);
}
