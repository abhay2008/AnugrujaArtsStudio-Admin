import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  getImageFromMemory,
  cacheImageInMemory,
  saveImageToTmp,
  getTmpImagesDir,
} from '@/lib/imageCache';
import { getRemoteBinaryFile } from '@/lib/github';

/**
 * Image serving and fallback handler for the admin portal.
 *
 * Resolution order:
 *   1. In-memory image cache (freshly uploaded in the current session / instance — 0ms response).
 *   2. Serverless /tmp images dir (persisted on serverless runs like Vercel).
 *   3. This app's public/images (local development).
 *   4. The sibling main-site checkout (AnugrujaArtsStudio/public/images).
 *   5. GitHub repository directly (for newly committed images before Vercel deploy completes).
 *   6. Fallback redirect to the deployed main site, with strict non-caching headers so
 *      browsers never cache temporary 404s.
 */

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
};

const MAIN_SITE_URL = process.env.MAIN_SITE_URL || 'https://anugruja-arts-studio.vercel.app';

function resolveSafeFile(baseDirs: string[], segments: string[]): string | null {
  // Reject traversal: the joined path must stay inside a base dir.
  const rel = segments.join('/');
  if (!rel || rel.includes('..') || rel.startsWith('/')) return null;
  const filename = path.basename(rel);

  for (const base of baseDirs) {
    const candidatePath = path.join(base, rel);
    const candidateFile = path.join(base, filename);

    for (const candidate of [candidatePath, candidateFile]) {
      if (!candidate.startsWith(base)) continue;
      try {
        if (fs.statSync(candidate).isFile()) return candidate;
      } catch {
        // not here — try next candidate
      }
    }
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const rel = segments.join('/');
  const filename = path.basename(rel);
  const ext = path.extname(filename).toLowerCase();
  const mimeType = MIME_BY_EXT[ext] || 'application/octet-stream';

  const hasCacheBuster =
    req.nextUrl.searchParams.has('v') ||
    req.nextUrl.searchParams.has('t') ||
    req.nextUrl.searchParams.has('retry') ||
    req.nextUrl.searchParams.has('r');

  const buildSuccessHeaders = (bodyLength: number): Record<string, string> => ({
    'Content-Type': mimeType,
    'Content-Length': String(bodyLength),
    // If cache-busted with a version or timestamp parameter, cache for a day.
    // If unversioned, require revalidation within 60s so newly uploaded artworks show up.
    'Cache-Control': hasCacheBuster
      ? 'public, max-age=86400, stale-while-revalidate=604800'
      : 'no-cache, must-revalidate, max-age=60',
  });

  // 1. In-memory cache check (instant 0ms retrieval)
  const inMemory = getImageFromMemory(rel) || getImageFromMemory(filename);
  if (inMemory) {
    return new NextResponse(new Uint8Array(inMemory.buffer), {
      status: 200,
      headers: buildSuccessHeaders(inMemory.buffer.length),
    });
  }

  // 2. Check local directories (/tmp/anugruja-images, admin public/images, sibling public/images)
  const localDirs = [
    getTmpImagesDir(),
    path.join(process.cwd(), 'public', 'images'),
    path.join(process.cwd(), '..', 'AnugrujaArtsStudio', 'public', 'images'),
  ];

  const file = resolveSafeFile(localDirs, segments);
  if (file) {
    const buffer = fs.readFileSync(file);
    cacheImageInMemory(filename, buffer, mimeType);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: buildSuccessHeaders(buffer.length),
    });
  }

  // 3. GitHub repository check (fetches newly committed images before public site redeploys)
  const tokenOverride =
    req.headers.get('x-github-token') ||
    req.nextUrl.searchParams.get('gh_token') ||
    req.nextUrl.searchParams.get('token') ||
    undefined;

  try {
    const remoteBuffer = await getRemoteBinaryFile(`public/images/${rel}`, tokenOverride);
    if (remoteBuffer) {
      cacheImageInMemory(filename, remoteBuffer, mimeType);
      saveImageToTmp(filename, remoteBuffer);
      return new NextResponse(new Uint8Array(remoteBuffer), {
        status: 200,
        headers: buildSuccessHeaders(remoteBuffer.length),
      });
    }
  } catch (err) {
    console.warn('GitHub image lookup skipped:', err);
  }

  // 4. Fallback: redirect to deployed main site.
  // CRITICAL: NEVER allow browsers or CDN to cache this redirect, otherwise a temporary
  // 404 while the main site builds causes the browser to refuse loading the image.
  const target = `${MAIN_SITE_URL}/images/${segments.map(encodeURIComponent).join('/')}`;
  return NextResponse.redirect(target, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
