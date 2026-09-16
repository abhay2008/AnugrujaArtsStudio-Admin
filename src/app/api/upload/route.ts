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
    const relPath = path.join('images', fileName);

    // 1. Save to local admin public/images/ (best-effort — read-only on serverless)
    const localTarget = path.join(process.cwd(), 'public', 'images', fileName);
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
          fileName
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
        const commitMsg = message || `Admin upload: added artwork asset public/images/${fileName}`;
        commitResult = await commitBinaryFile(
          `public/images/${fileName}`,
          buffer,
          commitMsg,
          activeToken
        );
      } catch (commitErr: any) {
        console.warn('GitHub image commit failed:', commitErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      src: `/images/${fileName}`,
      fileName,
      sizeBytes: buffer.length,
      localSaved,
      commitResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload processing failed' }, { status: 500 });
  }
}
