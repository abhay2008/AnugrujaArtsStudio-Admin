# 🏛️ Anugruja Arts Studio — Admin Portal & CMS

Autonomous Content & Gallery Management Console for **Anugruja Arts Studio**, designed for automated Git-backed publishing to GitHub.

## 🌟 Key Capabilities

- 🔐 **Secure Session Authentication**: Protected routes with 24-hour HMAC-SHA256 session cookie.
- 🖼️ **Complete Gallery Management**: Inline editing, slot jumping, steppers, and table/grid views across 8 collections.
- 📸 **Mass Upload Studio**: HTML5 canvas image optimizer reduces file sizes by up to 90% in-browser before staging.
- 💬 **Inquiry & Lead Management**: Customer inquiry pipeline with custom commission pricing estimator and one-click WhatsApp quick-replies.
- ⚙️ **Studio Profile Editor**: Manage founder bio, studio statistics, contact info, and SEO tags.
- 🐙 **GitHub Contents API Integration**: Native support for Fine-Grained Personal Access Tokens (PATs) for direct commits without complex server-side Git installations.
- 🔄 **Local Sibling Mirroring**: Seamlessly syncs local changes to the public `AnugrujaArtsStudio` repository on disk during local development.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server (Port 3002)
npm run dev

# 3. Open in browser
http://localhost:3002
```

Default credentials:
- Password: configured via the `ADMIN_PASSWORD` environment variable (required — no built-in default)

## 📦 Environment Variables

Create `.env.local`:

```env
GITHUB_TOKEN=github_pat_...
GITHUB_OWNER=abhay2008
GITHUB_REPO=AnugrujaArtsStudio
GITHUB_ADMIN_REPO=AnugrujaArtsStudio-Admin
GITHUB_BRANCH=main
ADMIN_PASSWORD=<your-admin-password>
SESSION_SECRET=anugruja_arts_studio_secret_session_key_2026
DEVELOPMENT_LOCAL_SAVE=true
```

Refer to [ADMIN_USER_GUIDE.md](./ADMIN_USER_GUIDE.md) for full documentation.
