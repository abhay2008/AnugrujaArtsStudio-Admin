import fs from 'fs';
import path from 'path';
import type { SiteContent } from './types';
import { commitTextFile, getRemoteTextFile, githubConfigured } from './github';
import { fillMissing, missingTopLevelKeys } from './contentMerge';

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

/**
 * The freshest content this deployment can reach: the committed file from the
 * site repository when GitHub is configured, otherwise the local mirror merged
 * with the sibling checkout's copy.
 *
 * The merge is deliberately domain-agnostic (`fillMissing`) instead of naming
 * `events`/`chatbot` by hand: any domain this mirror predates — page listings,
 * maps URL, whatever the CMS grows next — is filled in instead of hidden.
 * Without it, an out-of-date mirror makes the portal show "Upcoming (0)" for
 * workshops the live website is already advertising.
 */
async function loadBestAvailableContent(tokenOverride?: string): Promise<SiteContent | null> {
  try {
    const remote = await getRemoteTextFile('content/site.json', tokenOverride);
    if (remote) {
      return JSON.parse(remote) as SiteContent;
    }
  } catch (err) {
    console.warn('Could not fetch remote site.json, falling back to local file:', err);
  }

  const local = getLocalContent();
  const sibling = getSiblingContent();
  if (local && sibling) return fillMissing(local, sibling);
  return local ?? sibling;
}

export async function loadContent(tokenOverride?: string): Promise<SiteContent> {
  const best = await loadBestAvailableContent(tokenOverride);
  if (!best) {
    throw new Error(
      'site.json not found: configure GITHUB_TOKEN so the portal can read the website content, or keep a content/site.json in this repository.'
    );
  }
  return best;
}

export async function saveContent(
  content: SiteContent,
  commitMessage = 'Admin update: updated site content',
  tokenOverride?: string
) {
  // Never let an incomplete payload erase a domain it does not carry. If this
  // deployment loaded a stale mirror (or the editor simply does not model a
  // domain), the copy that goes to GitHub keeps whatever the site already had
  // — otherwise publishing once would silently drop live events and chatbot
  // settings from the public website.
  const current = await loadBestAvailableContent(tokenOverride);
  const preservedDomains = current ? missingTopLevelKeys(content, current) : [];
  const payload: SiteContent = current ? fillMissing(content, current) : content;
  if (preservedDomains.length > 0) {
    console.warn(
      `Preserved website content the payload did not include: ${preservedDomains.join(', ')}`
    );
  }

  payload.lastUpdated = new Date().toISOString();
  const jsonStr = JSON.stringify(payload, null, 2);

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

  // Nothing reached GitHub *and* nothing was persisted locally: the save only
  // existed in the browser. Reporting success here is what made "your changes
  // don't appear on the website" so hard to trace, so fail loudly instead.
  if (!commitResult && !localSaved && !siblingSaved) {
    throw new Error(
      'Nothing was published. This deployment cannot write files and has no GitHub access — set GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO in the environment, then publish again. Your staged changes are still here.'
    );
  }

  return {
    success: true,
    lastUpdated: payload.lastUpdated,
    commitResult,
    localSaved,
    siblingSaved,
    /** False when the save only landed on this machine (GitHub not configured). */
    published: Boolean(commitResult),
    /** Domains the payload omitted and that were carried over from the website. */
    preservedDomains,
  };
}
