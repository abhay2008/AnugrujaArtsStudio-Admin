import fs from 'fs';
import path from 'path';
import { SiteContent, Inquiry } from './types';
import { commitTextFile, getRemoteTextFile } from './github';

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

const LOCAL_INQUIRIES_PATH = path.join(process.cwd(), 'content', 'inquiries.json');

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
  if (local) return local;

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
  }

  return {
    success: true,
    lastUpdated: content.lastUpdated,
    commitResult,
    localSaved,
    siblingSaved,
  };
}

export function loadInquiries(): Inquiry[] {
  try {
    if (fs.existsSync(LOCAL_INQUIRIES_PATH)) {
      const raw = fs.readFileSync(LOCAL_INQUIRIES_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed reading inquiries.json:', err);
  }
  return [];
}

export function saveInquiries(inquiries: Inquiry[]) {
  const saved = tryWriteFile(LOCAL_INQUIRIES_PATH, JSON.stringify(inquiries, null, 2));
  return { success: true, count: inquiries.length, saved };
}
