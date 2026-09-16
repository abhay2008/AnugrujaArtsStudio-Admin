# 🏛️ Anugruja Arts Studio — Admin Portal & CMS

A standalone, password-protected management console for **[Anugruja Arts Studio](https://github.com/abhay2008/AnugrujaArtsStudio)** — the public site's repo *is* the database, and this portal is the safe way to edit it.

Built with **Next.js + TypeScript**, deployed on **Vercel**. No database, no server-side Git — all persistence goes through the **GitHub Contents API**, so every change is a normal Git commit in the main site repo: reviewable, revertible, and automatically deployed by Vercel.

---

## 🌟 Key Capabilities

- 🔐 **Secure session auth** — server-side password check → **HMAC-SHA256-signed session cookie** (24 h), with sign-in throttling and a lockout window against brute force.
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

Useful scripts: `npm run build`, `npm run typecheck` (`tsc --noEmit`), `npm run lint`.

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
│   └── lib/
│       ├── adminAuth.ts           # HMAC-SHA256 signed sessions (24 h)
│       ├── loginThrottle.ts       # Brute-force lockout
│       ├── github.ts              # GitHub Contents API client
│       ├── serverContent.ts       # Load/save content (EROFS-safe local writes)
│       ├── imageOptimize.ts       # Client-side compression before upload
│       └── types.ts               # Data model + GALLERY_CATALOG (shared vocabulary)
├── ADMIN_USER_GUIDE.md            # Step-by-step guide for the studio team
└── .env.example                   # Template only — real values live in .env.local / Vercel
```

Refer to [ADMIN_USER_GUIDE.md](./ADMIN_USER_GUIDE.md) for day-to-day usage.
