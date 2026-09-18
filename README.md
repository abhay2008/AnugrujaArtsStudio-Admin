# 🏛️ Anugruja Arts Studio — Admin Portal & CMS

A standalone, password-protected management console for **[Anugruja Arts Studio](https://github.com/abhay2008/AnugrujaArtsStudio)** — the public site's repo *is* the database, and this portal is the safe way to edit it.

Built with **Next.js + TypeScript**, deployed on **Vercel**. No database, no server-side Git — all persistence goes through the **GitHub Contents API**, so every change is a normal Git commit in the main site repo: reviewable, revertible, and automatically deployed by Vercel.

---

## 🌟 Key Capabilities

- 🔐 **Secure session auth** — server-side password check → **HMAC-SHA256-signed session cookie** (24 h). Every page and `/api/*` route is gated by `src/middleware.ts` (401 for API calls, redirect for pages), and the check fails closed when `ADMIN_PASSWORD` is unset. There is **no built-in login rate limit** — put the portal behind your host's edge protection (e.g. a Vercel firewall rule) if it is ever exposed publicly.
- 🖼️ **Gallery management** — inline editing, reorder, move-between-collections, slot jumping, grid/table views across the site's typed collections.
- 📸 **Mass Upload Studio** — client-side image compression before staging, smart collection mapping (auto-suggested from filenames, overridable per image), and adaptive metadata: price/status fields appear **only** for sellable collections, never for showcase art.
- 📅 **Events & workshops CMS** — upcoming registration cards and past exhibitions with dates, deadlines, seats, photos, descriptions.
- 💬 **Chatbot knowledge** — edits to artwork/content flow into the main site's chat assistant automatically (its context is generated from the same `site.json`).
- 🐙 **Git-backed publishing** — every change is staged in the browser and applied by **one explicit Commit**, which writes to the main repo via the GitHub Contents API.
- 🔄 **Local sibling mirroring** — during local development, saves can also mirror to a sibling checkout of the public repo on disk (`DEVELOPMENT_LOCAL_SAVE=true`).

---

## 🧭 How the Commit Pipeline Works

```
┌─────────────────────────────┐
│  1. Sign in (ADMIN_PASSWORD │  Server verifies the password, issues an
│     checked server-side)    │  HMAC-signed session cookie (24 h).
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  2. Edit anything, freely   │  All edits are STAGED in the browser —
│     — nothing is live yet   │  discardable, never auto-published.
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  3. "Commit Changes" (once) │  POST /api/content →
│                             │   • persists locally (best-effort; skipped
│                             │     harmlessly on Vercel's read-only FS)
│                             │   • commits content/site.json to the MAIN
│                             │     site repo via the GitHub Contents API
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  4. Vercel rebuilds the     │  Public site (and its chatbot) now serve
│     main site from main     │  the new content. Revert = revert a commit.
└─────────────────────────────┘
```

**Uploads** follow the same philosophy: images are compressed in the browser, written to the main repo's `public/images/` via the GitHub API, and served optimized by the main site. Because the portal is hosted separately from the artwork files, an image fallback route (`src/app/images/[...path]/route.ts`) resolves thumbnails in order: portal's own uploads → sibling local checkout (dev) → the deployed main site (production redirect). No image is ever duplicated into this repo.

> ⚠️ **Serverless note:** Vercel's filesystem is **read-only** (`/var/task`). Local file writes are best-effort by design and an `EROFS` there is logged and skipped — the **GitHub commit is the source of truth**. If a commit fails, check `GITHUB_TOKEN` validity/permissions first.

> 🚨 **Nothing is published as a side effect.** A save whose only outcome was "written to this machine" reports `published: false`, and the portal says so plainly ("Saved on this computer only"). A save with nowhere to go at all — no GitHub access *and* no writable disk — fails with an explicit error instead of a fake success. That silent-success path was why "my edits never appear on the website" used to be so hard to trace: without a valid `GITHUB_TOKEN`, the portal used to report success while publishing nothing.

### The content mirror (and how it stays in sync)

The portal keeps its own `content/site.json` so that local development works without GitHub access, and so a deployment that cannot reach GitHub still shows real content instead of an empty portal.

Read order at runtime (`src/lib/serverContent.ts`):

1. **The site repo's committed `content/site.json`** — the source of truth, when `GITHUB_TOKEN` is configured.
2. **This repo's mirror**, merged with a sibling checkout's copy if one is present (`../AnugrujaArtsStudio`).

That mirror can drift when the *site* repository changes without a publish from this portal — for instance when the public site's own `/admin` console writes content, or when the file is edited directly. A drifted mirror is what once made this portal show **"Upcoming (0)"** for workshops the live website was already advertising, because the mirror predated the `events` key entirely.

Two guards make drift harmless:

- **Loader** (`src/lib/contentMerge.ts`) fills every domain the older copy is missing — `events`, `chatbot`, `sections.pageMeta`, `brand.mapsUrl`, and anything the CMS grows later. An out-of-date copy can no longer *hide* live content.
- **Publisher** re-reads the current website content before writing and carries over any domain the payload does not contain. Publishing from a stale portal can no longer *erase* live events or chatbot settings.

To re-match the two files explicitly at any time:

```bash
npm run sync:content      # prefers a sibling checkout, falls back to the GitHub API
```

Run it after pulling site-repo changes that did not go through this portal. If the portal shows fewer events (or fewer page listings) than the live website, the mirror is the first thing to check.

> 🗓️ **Events publish like any other domain.** Editing a workshop bumps the change counter that enables **Review & Publish** — previously the counter ignored events, so an event-only edit left the publish button disabled and could never go live.

---

## 🚀 Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local from the template (see below) — never commit it
cp .env.example .env.local

# 3. Run the dev server (port 3002)
npm run dev

# 4. Open the portal
http://localhost:3002
```

There is **no default password**. Sign-in requires `ADMIN_PASSWORD` from your environment — set it locally in `.env.local` and in production in Vercel's project settings. To change the studio password, change that variable and redeploy; nothing in the code references it.

Useful scripts: `npm run build`, `npm run typecheck` (`tsc --noEmit`), `npm run verify` (the checks below), `npm run lint`, `npm run sync:content`.

### ✅ Checks before publishing a change

```bash
npm run typecheck    # TypeScript, no emit
npm run verify       # 3 suites: auth/session, content load + schema, GitHub targets
npm run build        # production build
```

`npm run verify` (≈ `scripts/verify-admin-suite.ts`) runs on plain Node — no `tsx`/`ts-node` install — via the small loader in `scripts/ts-node-boot.mjs` (Node 23+ strips the types). It reads `ADMIN_PASSWORD` and the `GITHUB_*` values, so export them first:

```bash
set -a; . ./.env.local; set +a; npm run verify
```

It checks that the correct password is accepted and a wrong one rejected, that issued session tokens verify while forged ones do not, that the content mirror loads with 8 galleries and a non-empty Art for Sale collection, and that both `GITHUB_REPO` targets resolve.

To publish from a **local** portal you need `GITHUB_TOKEN` set in `.env.local` — without it the portal can still read content (via its mirror) but publishing reaches GitHub unauthenticated, so nothing is committed and the portal will tell you so. `DEVELOPMENT_LOCAL_SAVE=true` mirrors saves to the sibling public checkout on disk, which is enough for local content work but does not update the live site.

---

## 🔑 Environment Variables

Create `.env.local` (gitignored). Template: [.env.example](./.env.example). **Never commit real values — they live only in `.env.local` and Vercel's environment settings.**

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_PASSWORD` | ✅ | Studio portal password (checked server-side; no default exists) |
| `SESSION_SECRET` | ✅ | Random string used to sign session cookies — generate with `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"` |
| `GITHUB_TOKEN` | ✅ (for commits/uploads) | GitHub **fine-grained PAT**: repository access limited to `AnugrujaArtsStudio` + `AnugrujaArtsStudio-Admin`; permissions `Contents: Read and write`, `Metadata: Read-only` |
| `GITHUB_OWNER` | optional | Defaults to `abhay2008` |
| `GITHUB_REPO` | optional | Target **content** repo — defaults to `AnugrujaArtsStudio` |
| `GITHUB_ADMIN_REPO` | optional | This portal's repo (used for image fallback checks) |
| `GITHUB_BRANCH` | optional | Defaults to `main` |
| `DEVELOPMENT_LOCAL_SAVE` | optional | `true` = also mirror saves to a sibling local checkout of the public repo during local dev |
| `MAIN_SITE_URL` | optional | Override the production redirect target for the image fallback route |
| `NEXT_PUBLIC_SITE_URL` | optional | Address used by the portal's **View Website** links. A production build defaults to the live site, local dev to `http://localhost:3000` |

---

## ☁️ Deployment (Vercel)

1. Import this repo into Vercel (framework auto-detected).
2. Set **all** required env vars above in *Project → Settings → Environment Variables*.
3. Deploy. Pushes to `main` rebuild automatically.
4. The `GITHUB_TOKEN` must keep write access to the **main** site repo — that's how commits from production work.

**Security checklist**

- [ ] `.env.local` is gitignored and was never committed
- [ ] `SESSION_SECRET` is random (not a phrase) and rotated if ever exposed
- [ ] The PAT is *fine-grained*, limited to the two repos, Contents read/write only
- [ ] Passwords/tokens appear nowhere in code, docs, commits, or issues
- [ ] If a secret ever touches Git history: **rotate it**, then scrub history

---

## 📂 Project Structure

```
AnugrujaArtsStudio-Admin/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Dashboard (stats, quick links)
│   │   ├── login/                 # Password gate → signed session cookie
│   │   ├── galleries/             # Collection editors (grid/table, move, edit)
│   │   ├── upload/                # Mass Upload Studio (staging + smart mapping)
│   │   ├── events/                # Events & workshops CMS
│   │   ├── content/               # Raw content editor + commit review
│   │   ├── github/                # Commit status / GitHub diagnostics
│   │   ├── images/[...path]/      # Image fallback route (see pipeline above)
│   │   └── api/
│   │       ├── auth/              # Password check, session issue/clear
│   │       ├── content/           # GET/POST content → local mirror + GitHub commit
│   │       ├── upload/            # Image upload → main repo public/images
│   │       └── github/            # Contents API helpers
│   ├── components/                # Admin UI (managers, modals, staged-review UI)
│   ├── context/SiteContext.tsx    # Loaded content + staging state
│   ├── middleware.ts              # Session gate for every page + /api/* route
│   └── lib/
│       ├── adminAuth.ts           # HMAC-SHA256 signed sessions (24 h)
│       ├── contentMerge.ts        # Drift guards: fill missing domains / carry them over
│       ├── github.ts              # GitHub Contents API client
│       ├── serverContent.ts       # Load/save content (EROFS-safe local writes)
│       ├── imageOptimize.ts       # Client-side compression before upload
│       └── types.ts               # Data model + GALLERY_CATALOG (shared vocabulary)
├── scripts/
│   ├── sync-content.mjs           # Re-match the mirror with the site repo (npm run sync:content)
│   ├── verify-admin-suite.ts      # Auth / content / GitHub checks (npm run verify)
│   ├── ts-node-boot.mjs           # Plain-Node TS loader used by npm run verify
│   └── ts-node-hooks.mjs
├── ADMIN_USER_GUIDE.md            # Step-by-step guide for the studio team
└── .env.example                   # Template only — real values live in .env.local / Vercel
```

Refer to [ADMIN_USER_GUIDE.md](./ADMIN_USER_GUIDE.md) for day-to-day usage.
