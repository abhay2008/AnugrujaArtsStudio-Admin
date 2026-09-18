#!/usr/bin/env node
/**
 * Re-sync this portal's content mirror with the public website's copy.
 *
 * The portal keeps `content/site.json` of its own so local development works
 * without GitHub access, and so a deployment that cannot reach GitHub still
 * shows real content instead of an empty portal. That mirror can go stale when
 * the *site* repository changes without a publish from this portal — for
 * example when the public site's own /admin console writes content, or when an
 * agent edits the file directly.
 *
 * A stale mirror used to be how the portal showed "Upcoming (0)" for workshops
 * the website was already advertising, so re-run this whenever the two copies
 * might have drifted:
 *
 *     npm run sync:content
 *
 * Preferred source is a sibling checkout of the public repo (no network, no
 * token). Falls back to the GitHub Contents API when GITHUB_TOKEN is set.
 * The loader and publisher both defend against drift, but matching the two
 * files is still the cleanest state.
 */
import fs from 'node:fs';
import path from 'node:path';

const HERE = process.cwd();
const MIRROR = path.join(HERE, 'content', 'site.json');
const SIBLING = path.join(HERE, '..', 'AnugrujaArtsStudio', 'content', 'site.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function describe(content) {
  const upcoming = content.events?.upcoming?.length ?? 0;
  const past = content.events?.past?.length ?? 0;
  const works = Object.values(content.galleries || {}).reduce((n, list) => n + list.length, 0);
  return `${works} artworks · ${upcoming} upcoming / ${past} past events · chatbot ${
    content.chatbot ? 'on' : 'off'
  }`;
}

async function fromSibling() {
  if (!fs.existsSync(SIBLING)) return null;
  return readJson(SIBLING);
}

async function fromGitHub() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  const owner = process.env.GITHUB_OWNER || 'abhay2008';
  const repo = process.env.GITHUB_REPO || 'AnugrujaArtsStudio';
  const branch = process.env.GITHUB_BRANCH || 'main';
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/content/site.json?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AnugrujaArtsStudio-Admin/1.0',
      },
    }
  );
  if (!res.ok) {
    console.error(`GitHub read failed (${res.status}). Check GITHUB_TOKEN and GITHUB_REPO.`);
    return null;
  }
  const body = await res.json();
  if (!body.content) return null;
  return JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
}

const source = (await fromSibling()) ?? (await fromGitHub());
if (!source) {
  console.error(
    'No content source found.\n' +
      `  • keep a sibling checkout at ${SIBLING}, or\n` +
      '  • set GITHUB_TOKEN so the mirror can be pulled from the site repository.'
  );
  process.exit(1);
}

const previous = fs.existsSync(MIRROR) ? readJson(MIRROR) : null;
fs.writeFileSync(MIRROR, `${JSON.stringify(source, null, 2)}\n`);

console.log(`Mirror updated → ${path.relative(HERE, MIRROR)}`);
console.log(`  before: ${previous ? describe(previous) : '(missing)'}`);
console.log(`  after : ${describe(source)}`);
