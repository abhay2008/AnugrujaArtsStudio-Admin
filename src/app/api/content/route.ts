import { NextRequest, NextResponse } from 'next/server';
import { loadContent, saveContent } from '@/lib/serverContent';
import { SiteContent } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const tokenOverride = req.headers.get('x-github-token') || undefined;
    const content = await loadContent(tokenOverride);
    return NextResponse.json(content);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load content' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, message, tokenOverride } = body as {
      content: SiteContent;
      message?: string;
      tokenOverride?: string;
    };

    if (!content || !content.galleries) {
      return NextResponse.json({ error: 'Malformed site content payload' }, { status: 400 });
    }

    const tokenHeader = req.headers.get('x-github-token') || undefined;
    const activeToken = tokenOverride || tokenHeader;

    const result = await saveContent(
      content,
      message || 'Admin update: updated site content',
      activeToken
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save content' }, { status: 500 });
  }
}
