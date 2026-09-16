import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Image fallback for the admin portal.
 *
 * The admin repo does not duplicate the main site's artwork library (28MB+
 * of images live in AnugrujaArtsStudio/public/images), but gallery cards and
 * the gallery editor reference `/images/...` directly. Resolution order:
 *
 *   1. This app's own public/images — covers freshly uploaded artwork files
 *      (the upload API saves them here before committing to the main repo).
 *   2. The sibling main-site checkout — covers the full existing library
 *      when running locally next to the main repo (dev convenience).
 *   3. Redirect to the deployed main site — production images are committed
 *      to AnugrujaArtsStudio and served by its Vercel deployment.
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
  for (const base of baseDirs) {
    const candidate = path.join(base, rel);
    if (!candidate.startsWith(base)) continue;
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // not here — try next base
    }
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  const localDirs = [
    path.join(process.cwd(), 'public', 'images'),
    path.join(process.cwd(), '..', 'AnugrujaArtsStudio', 'public', 'images'),
  ];

  const file = resolveSafeFile(localDirs, segments);
  if (file) {
    const ext = path.extname(file).toLowerCase();
    const body = new Uint8Array(fs.readFileSync(file));
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': MIME_BY_EXT[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Not available locally — the deployed main site serves the committed file.
  const target = `${MAIN_SITE_URL}/images/${segments.map(encodeURIComponent).join('/')}`;
  return NextResponse.redirect(target, 302);
}
