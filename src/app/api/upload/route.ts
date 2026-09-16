import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { commitBinaryFile, githubConfigured } from '@/lib/github';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, base64Data, message, tokenOverride } = body as {
      fileName: string;
      base64Data: string;
      message?: string;
      tokenOverride?: string;
    };

    if (!fileName || !base64Data) {
      return NextResponse.json(
        { error: 'Both fileName and base64Data are required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length === 0 || buffer.length > 12 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image payload must be between 1 byte and 12 MB' }, { status: 400 });
    }
    const safeFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '-');
    if (!safeFileName || safeFileName === '.' || safeFileName === '..') {
      return NextResponse.json({ error: 'Invalid image filename' }, { status: 400 });
    }

    // 1. Save to local admin public/images/ (best-effort — read-only on serverless)
    const localTarget = path.join(process.cwd(), 'public', 'images', safeFileName);
    let localSaved = false;
    try {
      const localDir = path.dirname(localTarget);
      if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
      fs.writeFileSync(localTarget, buffer);
      localSaved = true;
    } catch (writeErr: any) {
      console.warn('Local image write skipped:', writeErr.code || writeErr.message);
    }

    // 2. Mirror save to sibling public repo if running locally
    if (process.env.DEVELOPMENT_LOCAL_SAVE !== 'false') {
      try {
        const siblingTarget = path.join(
          process.cwd(),
          '..',
          'AnugrujaArtsStudio',
          'public',
          'images',
          safeFileName
        );
        const siblingDir = path.dirname(siblingTarget);
        if (fs.existsSync(siblingDir)) {
          fs.writeFileSync(siblingTarget, buffer);
        }
      } catch (e) {
        console.warn('Could not mirror upload to sibling repo:', e);
      }
    }

    // 3. Commit to GitHub repo if token configured
    let commitResult = null;
    const activeToken = tokenOverride || req.headers.get('x-github-token') || undefined;

    if (githubConfigured(activeToken)) {
      try {
        const commitMsg = message || `Admin upload: added artwork asset public/images/${safeFileName}`;
        commitResult = await commitBinaryFile(
          `public/images/${safeFileName}`,
          buffer,
          commitMsg,
          activeToken
        );
      } catch (commitErr: any) {
        console.warn('Website image publish failed:', commitErr.message);
        return NextResponse.json(
          { error: 'The photo could not be published. Nothing was added to the website; please try again.' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      src: `/images/${safeFileName}`,
      fileName: safeFileName,
      sizeBytes: buffer.length,
      localSaved,
      commitResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload processing failed' }, { status: 500 });
  }
}
