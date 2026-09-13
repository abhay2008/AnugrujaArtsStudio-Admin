import { NextRequest, NextResponse } from 'next/server';
import {
  testGitHubConnection,
  getLatestCommit,
  githubConfigured,
  owner,
  publicRepo,
  adminRepo,
  branch,
} from '@/lib/github';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenOverride =
      searchParams.get('token') || req.headers.get('x-github-token') || undefined;

    const test = await testGitHubConnection(tokenOverride);
    const latest = await getLatestCommit(tokenOverride);

    return NextResponse.json({
      configured: githubConfigured(tokenOverride),
      config: {
        owner: owner(),
        publicRepo: publicRepo(),
        adminRepo: adminRepo(),
        branch: branch(),
      },
      diagnostics: test,
      latestCommit: latest,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'GitHub API check failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, token } = body;

    if (action === 'test-token') {
      const test = await testGitHubConnection(token);
      return NextResponse.json(test);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}
