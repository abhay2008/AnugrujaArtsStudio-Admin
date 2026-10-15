import fs from 'fs';
import path from 'path';
import {
  cacheImageInMemory,
  getImageFromMemory,
  saveImageToTmp,
  getImageFromTmp,
} from '../src/lib/imageCache';
import { getAdminImageUrl } from '../src/lib/urlUtils';
import { getRemoteBinaryFile } from '../src/lib/github';
import {
  normalizeImageKey,
  cacheClientImage,
  getCachedClientImage,
  clearClientImageCache,
} from '../src/lib/clientImageCache';

async function runImageCacheTests() {
  console.log('🧪 Starting Image Caching & Cache-Busting Verification...\n');

  // Test 1: In-Memory Server Cache & Global Scope Sharing
  console.log('--- Test 1: In-Memory Server Cache (globalThis shared scope) ---');
  const dummyBuffer = Buffer.from('RIFF....WEBPVP8 ...test image bytes...');
  const testFileName = 'test-artwork-123.webp';
  cacheImageInMemory(testFileName, dummyBuffer, 'image/webp');

  const retrieved = getImageFromMemory(testFileName);
  if (!retrieved) throw new Error('Failed to retrieve image from in-memory cache');
  if (retrieved.buffer.toString() !== dummyBuffer.toString()) {
    throw new Error('In-memory buffer content mismatch');
  }
  if (retrieved.mimeType !== 'image/webp') {
    throw new Error(`In-memory mimeType mismatch: expected image/webp, got ${retrieved.mimeType}`);
  }

  // Check that relative path lookup also works (/images/test-artwork-123.webp)
  const retrievedRel = getImageFromMemory(`public/images/${testFileName}`);
  if (!retrievedRel) throw new Error('Failed to retrieve image using relative path');
  console.log('[SERVER CACHE] In-memory storage, globalThis scope & path matching: PASS');

  // Test 2: Serverless /tmp Storage
  console.log('\n--- Test 2: Serverless /tmp Image Storage ---');
  const tmpSaved = saveImageToTmp(testFileName, dummyBuffer);
  if (!tmpSaved) throw new Error('Failed saving image to /tmp directory');
  const tmpBuffer = getImageFromTmp(testFileName);
  if (!tmpBuffer) throw new Error('Failed retrieving image from /tmp directory');
  if (tmpBuffer.toString() !== dummyBuffer.toString()) {
    throw new Error('/tmp image buffer content mismatch');
  }
  console.log('[SERVER CACHE] /tmp storage & retrieval: PASS');

  // Test 3: Browser Client-Side Image Cache (Memory, Normalization & Instant Lookup)
  console.log('\n--- Test 3: Browser Client Image Cache ---');
  // Scenario 3a: Key normalization
  const k1 = normalizeImageKey('/images/krishna_lotus.webp?v=1729000000');
  const k2 = normalizeImageKey('krishna_lotus.webp');
  const k3 = normalizeImageKey('https://studio.com/images/krishna_lotus.webp#frag');
  if (k1 !== '/images/krishna_lotus.webp') throw new Error(`Normalization error: ${k1}`);
  if (k2 !== '/images/krishna_lotus.webp') throw new Error(`Normalization error for filename: ${k2}`);
  if (k3 !== '/images/krishna_lotus.webp') throw new Error(`Normalization error for URL: ${k3}`);
  console.log('[CLIENT CACHE] Key normalization: PASS');

  // Scenario 3b: In-memory client caching & multi-format lookup
  const testDataUrl = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAACwAQCdASoBAAEAAgA0JaACdLoAA3AA/v398wAA';
  await cacheClientImage('/images/new_painting_99.webp', testDataUrl, 'image/webp');

  // Retrieve by full path
  const cachedByPath = getCachedClientImage('/images/new_painting_99.webp');
  if (cachedByPath !== testDataUrl) throw new Error('Failed retrieving cached image by full path');

  // Retrieve by filename
  const cachedByFilename = getCachedClientImage('new_painting_99.webp');
  if (cachedByFilename !== testDataUrl) throw new Error('Failed retrieving cached image by filename');

  // Retrieve by path with query parameters
  const cachedByQuery = getCachedClientImage('/images/new_painting_99.webp?v=2026-10-15T12:00:00Z');
  if (cachedByQuery !== testDataUrl) throw new Error('Failed retrieving cached image with version query');

  console.log('[CLIENT CACHE] Multi-format client image retrieval: PASS');

  // Scenario 3c: Clear client cache
  await clearClientImageCache();
  if (getCachedClientImage('/images/new_painting_99.webp')) {
    throw new Error('Cache clear failed: entry still present');
  }
  console.log('[CLIENT CACHE] Cache cleanup: PASS');

  // Test 4: Client getAdminImageUrl Cache-Buster
  console.log('\n--- Test 4: Client Cache-Busting URL Generation ---');
  const urlWithVersion = getAdminImageUrl('/images/painting1.jpg', 'v-art-101');
  if (urlWithVersion !== '/images/painting1.jpg?v=v-art-101') {
    throw new Error(`Unexpected urlWithVersion: ${urlWithVersion}`);
  }

  const urlExistingQuery = getAdminImageUrl('/images/painting1.jpg?existing=true', 'v2');
  if (!urlExistingQuery.includes('existing=true') || !urlExistingQuery.includes('v=v2')) {
    throw new Error(`Unexpected urlExistingQuery: ${urlExistingQuery}`);
  }

  const ts = 1729000000000;
  const urlRetry = getAdminImageUrl('/images/painting1.jpg', 'v1', ts, 2);
  if (!urlRetry.includes(`t=${ts}`) || !urlRetry.includes('r=2')) {
    throw new Error(`Unexpected urlRetry: ${urlRetry}`);
  }

  const dataUrl = 'data:image/webp;base64,AAAA';
  if (getAdminImageUrl(dataUrl, 'v1') !== dataUrl) {
    throw new Error('Data URL should not be modified by cache buster');
  }

  const emptyUrl = getAdminImageUrl('', 'v1');
  if (emptyUrl !== '/images/banner.jpeg') {
    throw new Error(`Expected /images/banner.jpeg fallback, got ${emptyUrl}`);
  }
  console.log('[URL] Cache-busting URL generation & preservation: PASS');

  // Test 5: Service Worker Asset Integrity
  console.log('\n--- Test 5: Service Worker Asset Integrity ---');
  const swPath = path.join(process.cwd(), 'public', 'admin-image-cache-sw.js');
  if (!fs.existsSync(swPath)) {
    throw new Error('public/admin-image-cache-sw.js is missing');
  }
  const swContent = fs.readFileSync(swPath, 'utf8');
  if (!swContent.includes('anugruja-artwork-cache') || !swContent.includes('fetch')) {
    throw new Error('Service worker content missing cache or fetch handlers');
  }
  console.log('[SERVICE WORKER] Admin image cache SW verified: PASS');

  // Test 6: GitHub Binary Fetch Contract
  console.log('\n--- Test 6: GitHub Binary Fetch Contract ---');
  if (typeof getRemoteBinaryFile !== 'function') {
    throw new Error('getRemoteBinaryFile is not exported from github.ts');
  }
  console.log('[GITHUB] getRemoteBinaryFile export: PASS');

  console.log('\n🎉 ALL IMAGE CACHING & CACHE-BUSTING VERIFICATIONS PASSED SUCCESSFULLY!');
}

runImageCacheTests().catch((err) => {
  console.error('❌ Image Cache Verification Error:', err);
  process.exit(1);
});
