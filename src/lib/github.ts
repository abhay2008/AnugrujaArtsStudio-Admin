import { GitHubCommitResult } from './types';

const GITHUB_API = 'https://api.github.com';

export function token(override?: string): string {
  return override || process.env.GITHUB_TOKEN || '';
}

export function owner(): string {
  return process.env.GITHUB_OWNER || 'abhay2008';
}

export function publicRepo(): string {
  return process.env.GITHUB_REPO || 'AnugrujaArtsStudio';
}

export function adminRepo(): string {
  return process.env.GITHUB_ADMIN_REPO || 'AnugrujaArtsStudio-Admin';
}

export function branch(): string {
  return process.env.GITHUB_BRANCH || 'main';
}

export function githubConfigured(overrideToken?: string): boolean {
  return Boolean(token(overrideToken) && owner() && publicRepo());
}

export function githubRepoUrl(): string {
  if (!owner() || !publicRepo()) return '';
  return `https://github.com/${owner()}/${publicRepo()}`;
}

export function publishRepos(): string[] {
  const repos = [publicRepo(), adminRepo()].filter(Boolean);
  return Array.from(new Set(repos));
}

export async function githubFetch(
  path: string,
  init?: RequestInit,
  tokenOverride?: string
) {
  const activeToken = token(tokenOverride);
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'AnugrujaArtsStudio-Admin/1.0',
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  return fetch(`${GITHUB_API}${path}`, {
    cache: 'no-store',
    ...init,
    headers,
  });
}

/**
 * Diagnostic test for GitHub Fine-Grained Personal Access Token or Classic PAT
 */
export async function testGitHubConnection(tokenOverride?: string) {
  const activeToken = token(tokenOverride);
  if (!activeToken) {
    return {
      connected: false,
      error: 'No GitHub token configured. Please supply a Fine-Grained Access Token.',
    };
  }

  try {
    // 1. Check Authenticated User
    const userRes = await githubFetch('/user', {}, activeToken);
    let username = 'Authenticated Fine-Grained App';
    if (userRes.ok) {
      const userData = await userRes.json();
      username = userData.login || username;
    }

    // 2. Check Target Public Repository Access
    const repoRes = await githubFetch(`/repos/${owner()}/${publicRepo()}`, {}, activeToken);
    if (!repoRes.ok) {
      const errText = await repoRes.text();
      return {
        connected: false,
        error: `Cannot access target repo ${owner()}/${publicRepo()} (${repoRes.status}): ${errText.slice(0, 200)}`,
        status: repoRes.status,
      };
    }

    const repoData = await repoRes.json();
    const permissions = repoData.permissions || {};
    const defaultBranch = repoData.default_branch || 'main';

    // 3. Check Admin Sibling Repository Access (Optional mirror)
    let adminRepoStatus = 'Not found or not configured';
    const adminRes = await githubFetch(`/repos/${owner()}/${adminRepo()}`, {}, activeToken);
    if (adminRes.ok) {
      adminRepoStatus = 'Ready for mirror sync';
    }

    return {
      connected: true,
      username,
      publicRepo: `${owner()}/${publicRepo()}`,
      adminRepo: `${owner()}/${adminRepo()}`,
      adminRepoStatus,
      defaultBranch,
      permissions: {
        push: Boolean(permissions.push),
        pull: Boolean(permissions.pull),
        admin: Boolean(permissions.admin),
      },
      tokenType: activeToken.startsWith('github_pat_') ? 'Fine-Grained PAT' : 'Classic PAT',
      tokenPrefix: activeToken.slice(0, 10) + '...',
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Network error while contacting GitHub API',
    };
  }
}

async function commitBinaryFileTo(
  repoName: string,
  filePath: string,
  buffer: Buffer,
  message: string,
  tokenOverride?: string
): Promise<GitHubCommitResult> {
  const cleanPath = filePath.replace(/^\/+/, '');
  const encodedPath = cleanPath
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  const contentsUrl = `/repos/${owner()}/${repoName}/contents/${encodedPath}`;

  let sha: string | undefined;
  const existing = await githubFetch(
    `${contentsUrl}?ref=${encodeURIComponent(branch())}&_t=${Date.now()}`,
    {},
    tokenOverride
  );
  if (existing.ok) {
    const json = (await existing.json()) as { sha?: string };
    sha = json.sha;
  }

  let put = await githubFetch(
    contentsUrl,
    {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: buffer.toString('base64'),
        branch: branch(),
        sha,
      }),
    },
    tokenOverride
  );

  // Handle concurrent edit 409 Conflict with fresh fetch & retry
  if (put.status === 409) {
    const retryExisting = await githubFetch(
      `${contentsUrl}?ref=${encodeURIComponent(branch())}&_t=${Date.now()}`,
      {},
      tokenOverride
    );
    if (retryExisting.ok) {
      const retryJson = (await retryExisting.json()) as { sha?: string };
      put = await githubFetch(
        contentsUrl,
        {
          method: 'PUT',
          body: JSON.stringify({
            message,
            content: buffer.toString('base64'),
            branch: branch(),
            sha: retryJson.sha,
          }),
        },
        tokenOverride
      );
    }
  }

  if (!put.ok) {
    const err = await put.text();
    throw new Error(`GitHub commit failed for ${repoName} (${put.status}): ${err.slice(0, 400)}`);
  }

  const body = (await put.json()) as {
    content?: { sha?: string; html_url?: string };
    commit?: { sha?: string; html_url?: string };
  };

  return {
    sha: body.commit?.sha || body.content?.sha || '',
    htmlUrl: body.content?.html_url || `https://github.com/${owner()}/${repoName}`,
    commitUrl: body.commit?.html_url || `https://github.com/${owner()}/${repoName}`,
  };
}

export async function commitBinaryFile(
  filePath: string,
  buffer: Buffer,
  message: string,
  tokenOverride?: string
): Promise<GitHubCommitResult> {
  const repos = publishRepos();
  const primary = repos[0];
  const result = await commitBinaryFileTo(primary, filePath, buffer, message, tokenOverride);

  const extra = repos.slice(1);
  for (const repoName of extra) {
    try {
      await commitBinaryFileTo(repoName, filePath, buffer, message, tokenOverride);
    } catch (error) {
      console.warn(`Mirror commit to ${repoName} failed (may not exist yet):`, error);
    }
  }

  return { ...result, repos };
}

export async function commitTextFile(
  filePath: string,
  text: string,
  message: string,
  tokenOverride?: string
): Promise<GitHubCommitResult> {
  return commitBinaryFile(filePath, Buffer.from(text, 'utf8'), message, tokenOverride);
}

export async function getRemoteTextFile(
  filePath: string,
  tokenOverride?: string
): Promise<string | null> {
  if (!githubConfigured(tokenOverride)) return null;
  const cleanPath = filePath.replace(/^\/+/, '');
  const encodedPath = cleanPath
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  for (const repoName of publishRepos()) {
    const contentsUrl = `/repos/${owner()}/${repoName}/contents/${encodedPath}?ref=${encodeURIComponent(branch())}&_t=${Date.now()}`;
    try {
      const res = await githubFetch(contentsUrl, {}, tokenOverride);
      if (!res.ok) continue;
      const json = (await res.json()) as { content?: string; encoding?: string };
      if (!json.content) continue;
      if (json.encoding === 'base64') {
        return Buffer.from(json.content, 'base64').toString('utf8');
      }
      return json.content;
    } catch {
      /* continue */
    }
  }
  return null;
}

export async function getLatestCommit(tokenOverride?: string) {
  if (!githubConfigured(tokenOverride)) return null;
  const res = await githubFetch(
    `/repos/${owner()}/${publicRepo()}/commits?sha=${encodeURIComponent(branch())}&per_page=1`,
    {},
    tokenOverride
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const commit = data[0] as {
    html_url: string;
    sha: string;
    commit?: {
      message?: string;
      author?: { date?: string; name?: string };
    };
  };
  return {
    sha: commit.sha,
    htmlUrl: commit.html_url,
    message: commit.commit?.message || '',
    author: commit.commit?.author?.name || 'Studio Admin',
    date: commit.commit?.author?.date || '',
    repoUrl: githubRepoUrl(),
  };
}
