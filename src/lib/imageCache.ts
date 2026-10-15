import fs from 'fs';
import path from 'path';

export interface CachedImage {
  buffer: Buffer;
  mimeType: string;
  timestamp: number;
}

// Global server in-memory cache shared across all Next.js webpack chunks and serverless lambdas in the same process
interface GlobalWithServerCache {
  __ANUGARUJA_SERVER_IMAGE_CACHE__?: Map<string, CachedImage>;
}

const globalScope = globalThis as unknown as GlobalWithServerCache;
if (!globalScope.__ANUGARUJA_SERVER_IMAGE_CACHE__) {
  globalScope.__ANUGARUJA_SERVER_IMAGE_CACHE__ = new Map<string, CachedImage>();
}
const memoryCache = globalScope.__ANUGARUJA_SERVER_IMAGE_CACHE__;

const MAX_CACHE_ITEMS = 150;

// /tmp directory is writable on serverless platforms (e.g. Vercel Serverless Functions)
const TMP_IMAGES_DIR = path.join('/tmp', 'anugruja-images');

function cleanKey(raw: string): string {
  if (!raw) return '';
  return raw.replace(/^\/+/, '').split('?')[0].split('#')[0];
}

export function cacheImageInMemory(filename: string, buffer: Buffer, mimeType: string) {
  if (!filename || !buffer) return;
  const relKey = cleanKey(filename);
  const baseKey = path.basename(relKey);

  if (memoryCache.size >= MAX_CACHE_ITEMS) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }

  const record: CachedImage = {
    buffer,
    mimeType,
    timestamp: Date.now(),
  };

  memoryCache.set(relKey, record);
  memoryCache.set(baseKey, record);
}

export function getImageFromMemory(filename: string): CachedImage | null {
  const relKey = cleanKey(filename);
  const baseKey = path.basename(relKey);
  return memoryCache.get(relKey) || memoryCache.get(baseKey) || null;
}

export function saveImageToTmp(filename: string, buffer: Buffer): boolean {
  try {
    const relKey = cleanKey(filename);
    const baseKey = path.basename(relKey);

    if (!fs.existsSync(TMP_IMAGES_DIR)) {
      fs.mkdirSync(TMP_IMAGES_DIR, { recursive: true });
    }

    // Save under baseKey
    fs.writeFileSync(path.join(TMP_IMAGES_DIR, baseKey), buffer);

    // If relKey has subdirectories, save nested as well
    if (relKey !== baseKey) {
      const nested = path.join(TMP_IMAGES_DIR, relKey);
      const dir = path.dirname(nested);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(nested, buffer);
    }
    return true;
  } catch (err) {
    return false;
  }
}

export function getImageFromTmp(filename: string): Buffer | null {
  try {
    const relKey = cleanKey(filename);
    const baseKey = path.basename(relKey);

    const candidates = [
      path.join(TMP_IMAGES_DIR, relKey),
      path.join(TMP_IMAGES_DIR, baseKey),
    ];

    for (const target of candidates) {
      if (fs.existsSync(target) && fs.statSync(target).isFile()) {
        return fs.readFileSync(target);
      }
    }
  } catch {
    // not available in tmp
  }
  return null;
}

export function getTmpImagesDir(): string {
  return TMP_IMAGES_DIR;
}
