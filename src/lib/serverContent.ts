import fs from 'fs';
import path from 'path';
import { SiteContent } from './types';
import { commitTextFile, getRemoteTextFile, githubConfigured } from './github';

/**
 * Best-effort local write. Serverless filesystems (e.g. Vercel's /var/task)
 * are read-only, so local persistence must never be allowed to break a save
 * whose real destination is the GitHub commit.
 */
function tryWriteFile(target: string, data: string | Buffer): boolean {
  try {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, data);
    return true;
  } catch (err: any) {
    console.warn(`Local write skipped for ${target}:`, err.code || err.message);
    return false;
  }
}

const LOCAL_CONTENT_PATH = path.join(process.cwd(), 'content', 'site.json');
const SIBLING_CONTENT_PATH = path.join(process.cwd(), '..', 'AnugrujaArtsStudio', 'content', 'site.json');

export function getLocalContent(): SiteContent | null {
  try {
    if (fs.existsSync(LOCAL_CONTENT_PATH)) {
      const raw = fs.readFileSync(LOCAL_CONTENT_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed reading local site.json:', err);
  }
  return null;
}

function getSiblingContent(): SiteContent | null {
  try {
    if (fs.existsSync(SIBLING_CONTENT_PATH)) {
      return JSON.parse(fs.readFileSync(SIBLING_CONTENT_PATH, 'utf8')) as SiteContent;
    }
  } catch (err) {
    console.warn('Could not read sibling public-site content:', err);
  }
  return null;
}

export async function loadContent(tokenOverride?: string): Promise<SiteContent> {
  // If remote file is available via GitHub token, fetch remote
  try {
    const remote = await getRemoteTextFile('content/site.json', tokenOverride);
    if (remote) {
      return JSON.parse(remote);
    }
  } catch (err) {
    console.warn('Could not fetch remote site.json, falling back to local file:', err);
  }

  const local = getLocalContent();
  const sibling = getSiblingContent();
  if (local && sibling) {
    // Keep admin-local edits, but fill newer structured CMS domains when the
    // local checkout predates events/chatbot support.
    return {
      ...local,
      events: local.events ?? sibling.events,
      chatbot: local.chatbot ?? sibling.chatbot,
    };
  }
  if (local) return local;
  if (sibling) return sibling;

  throw new Error('site.json not found in content directory');
}

export async function saveContent(
  content: SiteContent,
  commitMessage = 'Admin update: updated site content',
  tokenOverride?: string
) {
  content.lastUpdated = new Date().toISOString();
  const jsonStr = JSON.stringify(content, null, 2);

  // 1. Save to local admin file (best-effort — read-only on serverless)
  const localSaved = tryWriteFile(LOCAL_CONTENT_PATH, jsonStr);

  // 2. Mirror save to sibling public repo if running locally on disk
  let siblingSaved = false;
  if (process.env.DEVELOPMENT_LOCAL_SAVE !== 'false') {
    siblingSaved = tryWriteFile(SIBLING_CONTENT_PATH, jsonStr);
  }

  // 3. Commit to GitHub if token configured
  let commitResult = null;
  try {
    commitResult = await commitTextFile('content/site.json', jsonStr, commitMessage, tokenOverride);
  } catch (githubErr: any) {
    console.warn('GitHub commit skipped or failed:', githubErr.message);
    if (githubConfigured(tokenOverride) && !localSaved && !siblingSaved) {
      throw new Error(`Could not publish site content to GitHub: ${githubErr.message}`);
    }
  }

  if (githubConfigured(tokenOverride) && !commitResult) {
    throw new Error('GitHub publishing did not complete. Your staged changes are still safe to retry.');
  }

  return {
    success: true,
    lastUpdated: content.lastUpdated,
    commitResult,
    localSaved,
    siblingSaved,
  };
}
