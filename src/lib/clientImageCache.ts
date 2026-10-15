/**
 * Browser Client-Side Image Cache for Anugruja Arts Studio Admin.
 *
 * Solves the serverless deployment lag issue:
 * When an artwork photo is uploaded in the admin portal, the public site deployment
 * takes 1-3 minutes to build on Vercel. During that window, serverless lambda containers
 * cannot reliably serve the newly committed image from disk or memory across instances.
 *
 * This client-side cache stores uploaded photos directly in the browser across 3 tiers:
 *   Tier 1: Synchronous In-Memory Map (0ms instant render in current tab/session)
 *   Tier 2: IndexedDB (persists multi-megabyte image payloads across page refreshes)
 *   Tier 3: Browser Cache Storage API (caches.open) + Service Worker interceptor
 *
 * Guarantees that newly uploaded paintings render immediately in the admin gallery view.
 */

const DB_NAME = 'anugruja_artwork_cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CACHE_NAME = 'anugruja-artwork-cache-v1';
const MAX_MEMORY_ITEMS = 60;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheRecord {
  key: string;
  dataUrl: string;
  mimeType: string;
  timestamp: number;
}

// Global in-memory cache shared across all React components in the browser window
interface ScopeWithCache {
  __ANUGARUJA_BROWSER_IMG_CACHE__?: Map<string, string>;
  __ANUGARUJA_CACHE_HYDRATED__?: boolean;
}

function getMemoryCache(): Map<string, string> {
  const scope = (typeof window !== 'undefined' ? window : globalThis) as unknown as ScopeWithCache;
  if (!scope.__ANUGARUJA_BROWSER_IMG_CACHE__) {
    scope.__ANUGARUJA_BROWSER_IMG_CACHE__ = new Map<string, string>();
  }
  return scope.__ANUGARUJA_BROWSER_IMG_CACHE__;
}

/**
 * Normalizes an image path or URL into a consistent key for cache matching.
 * e.g.:
 *   "/images/painting.webp?v=123" -> "/images/painting.webp"
 *   "painting.webp" -> "/images/painting.webp"
 *   "https://admin.example.com/images/painting.webp" -> "/images/painting.webp"
 */
export function normalizeImageKey(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  let clean = raw;
  try {
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const u = new URL(clean);
      clean = u.pathname;
    }
  } catch {
    // ignore parse error, use raw
  }

  // Strip query parameters and hash
  clean = clean.split('?')[0].split('#')[0];

  // Remove duplicate slashes
  clean = clean.replace(/\/+/g, '/');

  // Ensure canonical /images/... prefix if just filename
  if (!clean.startsWith('/')) {
    clean = `/${clean}`;
  }
  if (!clean.startsWith('/images/')) {
    clean = `/images${clean}`;
  }

  return clean;
}

/**
 * Extract simple filename from path for secondary key matching.
 */
function getFilenameKey(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

/**
 * Open IndexedDB with graceful degradation.
 */
function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('[ImageCache] IndexedDB open error, falling back to in-memory cache');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Synchronously retrieves a cached image URL from Tier 1 (Memory Map).
 * Returns null if not cached in memory.
 */
export function getCachedClientImage(rawKey: string): string | null {
  if (!rawKey) return null;
  if (rawKey.startsWith('data:') || rawKey.startsWith('blob:')) return rawKey;

  const mem = getMemoryCache();
  const canonical = normalizeImageKey(rawKey);
  const filename = getFilenameKey(canonical);

  return mem.get(canonical) || mem.get(filename) || mem.get(rawKey) || null;
}

/**
 * Asynchronously loads a cached image from Tier 2 (IndexedDB) or Tier 3 (Cache Storage).
 * Automatically hydrates Tier 1 memory cache upon finding a match.
 */
export async function loadCachedClientImageAsync(rawKey: string): Promise<string | null> {
  // Check Tier 1 first
  const sync = getCachedClientImage(rawKey);
  if (sync) return sync;

  if (typeof window === 'undefined') return null;

  const canonical = normalizeImageKey(rawKey);
  const filename = getFilenameKey(canonical);
  const mem = getMemoryCache();

  // Check Tier 2 (IndexedDB)
  try {
    const db = await openDatabase();
    if (db) {
      const record = await new Promise<CacheRecord | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(canonical);

        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result as CacheRecord);
          } else {
            // Try matching by filename
            const reqAlt = store.get(filename);
            reqAlt.onsuccess = () => resolve((reqAlt.result as CacheRecord) || null);
            reqAlt.onerror = () => resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });

      if (record && record.dataUrl) {
        // Hydrate Tier 1 Memory Cache
        mem.set(canonical, record.dataUrl);
        mem.set(filename, record.dataUrl);
        return record.dataUrl;
      }
    }
  } catch (err) {
    console.warn('[ImageCache] IndexedDB read error:', err);
  }

  // Check Tier 3 (Cache Storage API)
  if ('caches' in window) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const matched = (await cache.match(canonical)) || (await cache.match(rawKey));
      if (matched) {
        const blob = await matched.blob();
        const objectUrl = URL.createObjectURL(blob);
        mem.set(canonical, objectUrl);
        mem.set(filename, objectUrl);
        return objectUrl;
      }
    } catch {
      // cache storage skipped
    }
  }

  return null;
}

/**
 * Stores an uploaded image in browser client-side cache across all 3 tiers.
 *
 * @param rawKey Image path (e.g. '/images/radha_krishna_123.webp')
 * @param dataUrl Base64 Data URL or Blob
 * @param mimeType Optional MIME type (defaults to image/webp or image/jpeg)
 */
export async function cacheClientImage(
  rawKey: string,
  dataUrl: string,
  mimeType = 'image/webp'
): Promise<void> {
  if (!rawKey || !dataUrl) return;

  const canonical = normalizeImageKey(rawKey);
  const filename = getFilenameKey(canonical);
  const mem = getMemoryCache();

  // 1. Tier 1: In-Memory Storage
  if (mem.size >= MAX_MEMORY_ITEMS) {
    const oldest = mem.keys().next().value;
    if (oldest) mem.delete(oldest);
  }
  mem.set(canonical, dataUrl);
  mem.set(filename, dataUrl);

  if (typeof window === 'undefined') return;

  // Notify active components immediately
  try {
    window.dispatchEvent(
      new CustomEvent('anugruja:image-cached', {
        detail: { src: canonical, filename, url: dataUrl },
      })
    );
  } catch {}

  // 2. Tier 2: IndexedDB Storage
  try {
    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: CacheRecord = {
        key: canonical,
        dataUrl,
        mimeType,
        timestamp: Date.now(),
      };
      store.put(record);
      // Also index by filename
      store.put({ ...record, key: filename });
    }
  } catch (err) {
    console.warn('[ImageCache] IndexedDB write failed:', err);
  }

  // 3. Tier 3: Cache Storage API
  if ('caches' in window) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      // Convert Data URL to Blob for Cache Storage
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const response = new Response(blob, {
        headers: {
          'Content-Type': mimeType || blob.type || 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
      await cache.put(canonical, response.clone());
      await cache.put(rawKey, response);
    } catch {
      // cache storage write skipped
    }
  }
}

/**
 * Preloads all cached images from IndexedDB into memory on admin boot.
 * Also cleans entries older than 7 days.
 */
export async function preloadClientImageCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  const win = window as unknown as ScopeWithCache;
  if (win.__ANUGARUJA_CACHE_HYDRATED__) return;
  win.__ANUGARUJA_CACHE_HYDRATED__ = true;

  try {
    const db = await openDatabase();
    if (!db) return;

    const mem = getMemoryCache();
    const now = Date.now();

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const record = cursor.value as CacheRecord;
        if (record && record.timestamp && now - record.timestamp > MAX_AGE_MS) {
          // Clean expired record
          cursor.delete();
        } else if (record && record.key && record.dataUrl) {
          mem.set(record.key, record.dataUrl);
        }
        cursor.continue();
      }
    };
  } catch (err) {
    console.warn('[ImageCache] Preload failed:', err);
  }
}

/**
 * Clears the client-side browser image cache across all tiers.
 */
export async function clearClientImageCache(): Promise<void> {
  const mem = getMemoryCache();
  mem.clear();

  if (typeof window === 'undefined') return;

  try {
    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    }
  } catch {}

  if ('caches' in window) {
    try {
      await window.caches.delete(CACHE_NAME);
    } catch {}
  }
}
