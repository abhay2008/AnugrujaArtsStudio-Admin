# 🎨 Anugruja Arts Studio — Master Admin Console & CMS User Guide

Welcome to the **Anugruja Arts Studio Autonomous Admin Console**. This application is an independent, private repository (`abhay2008/AnugrujaArtsStudio-Admin`) designed specifically for studio owners, curators, and administrators to manage artwork collections, pricing, media uploads, and studio content with automated Git-backed persistence.

---

## 🏛️ Architecture Overview

The system utilizes an automated **Git-backed Headless CMS** pattern:
1. **Public Site**: Hosted at `abhay2008/AnugrujaArtsStudio` (Next.js 15 App Router, pure customer showcase, ultra-fast and lightweight).
2. **Private Admin Portal**: Hosted at `abhay2008/AnugrujaArtsStudio-Admin` (protected console with full management capabilities).
3. **Synchronization**: When edits are made or images uploaded in this Admin Console, changes are committed directly to `content/site.json` and `public/images/` via the **GitHub REST Contents API**.
4. **Local Sibling Mirroring**: During local development, changes are automatically written to `../AnugrujaArtsStudio/content/site.json` for immediate real-time preview on `http://localhost:3000`.

---

## 🔐 Authentication & Session Security

- **Login Route**: `/login` (all protected routes automatically redirect here).
- **Admin Password**: configured via the `ADMIN_PASSWORD` environment variable in `.env.local` / Vercel Project Settings (required — no built-in default).
- **Session Duration**: 24 hours. Signed with HMAC-SHA256 Web Crypto token in an HTTP-only secure cookie (`anugruja_admin_session`).

---

## 🔑 Setting Up Your GitHub Fine-Grained Personal Access Token (PAT)

This portal is fully optimized for GitHub's modern **Fine-Grained Personal Access Tokens**. To configure your token:

1. Log into your GitHub account (`abhay2008`).
2. Go to **Settings** &gt; **Developer settings** &gt; **Personal access tokens** &gt; **Fine-grained tokens** (or visit [github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta)).
3. Click **"Generate new token"**.
4. Set a name: `Anugruja-Admin-PAT`.
5. Under **Repository access**, choose **"Only select repositories"** and select:
   - `AnugrujaArtsStudio` (Public Showcase)
   - `AnugrujaArtsStudio-Admin` (Admin Console)
6. Under **Permissions** &gt; **Repository permissions**:
   - **Contents**: Select **Read and write** (allows automated image commits & content updates).
   - **Metadata**: Left at **Read-only** (default).
7. Click **Generate token** and copy the generated key (starts with `github_pat_...`).
8. Paste the token into the **GitHub Sync & PAT** page in this admin portal (`/github`) or click **PAT Setup** in the top navigation bar.
9. Click **"Test Connection"** to verify that read/write permissions are active.

---

## 🛠️ Management Modules

### 1. Dashboard Overview (`/`)
- Live counters across all 8 collections and artworks available for sale.
- GitHub connection and commit status badge.
- Quick navigation shortcuts into each collection.

### 2. Gallery & Artwork Manager (`/galleries`)
- **8 Collections**: Art for Sale, Featured Portfolio, Commissions, Watercolors, Student Artworks, Workshops & Events, Testimonials, Awards & Honors.
- **Search & Filter**: Real-time filtering by title, medium, price, and status (`Available for Sale`, `Sold`, `Reserved`).
- **Reordering Controls**:
  - **Quick Jump**: Type any slot number (e.g. `#1`) to instantly move an artwork to that position.
  - **Steppers**: Move to Top (`<<`), Up (`<`), Down (`>`), or Bottom (`>>`).
  - **Reorder Table Mode**: Toggle to compact list view for rapidly organizing 30+ artworks.
- **In-Place Inline Editor**: Quickly update titles, prices, medium, and availability status without leaving the page.
- **Delete Confirmation**: Thumbnail preview modal to prevent accidental deletions.

### 3. Mass Upload Studio (`/upload`)
- Multi-file drag and drop from desktop or mobile device.
- **Client-Side Canvas Compression**: Automatically resizes multi-megapixel photos to optimal web dimensions (max 1600px) and converts to compressed WebP/JPEG, reducing file sizes by up to 90% without visible quality loss.
- **Smart Collection Mapping**: Filename hints suggest the correct collection, while every upload keeps a clear manual dropdown override.
- **Safe Metadata Review**: Edit title, category, description, medium, dimensions, price, and optional availability status per image. Non-sale collections never receive price or status fields.
- **Staging Queue**: Review converted thumbnails and all metadata before clicking **"Stage All for Commit"**. Nothing is published until the global Review & Commit flow is confirmed.

### 4. Events & Workshops (`/events`)
- Manage upcoming and past workshops, masterclasses, retreats, exhibitions, and outreach events.
- Edit the title, type, date, venue, description, registration deadline, seats, registration URL, outcome, and event photos.
- Publishing an event updates the public registration card and the chatbot's live context through the same `content/site.json` CMS.

### 5. Studio Profile & Content Editor (`/content`)
- **Studio Identity**: Update studio name, tagline, founder biography, and milestone statistics (years of experience, students trained, artworks created, awards won).
- **Contact & WhatsApp**: Update phone number, WhatsApp business number (with real-time test link), email address, and physical gallery address.
- **Social Profiles**: Links for Instagram, YouTube, and Facebook.
- **SEO**: Meta browser titles and search engine descriptions.

### 6. Review Changes Modal & Git Deployment
- When any modifications are made or artworks staged, a glowing **"Review & Commit"** button appears in the header.
- The review modal displays:
  - Staged new artwork images with thumbnails.
  - List of modified content and gallery reorderings.
  - Custom commit message authoring.
- Clicking **"Publish to GitHub"** pushes all binary assets and `site.json` changes directly to the remote repository.

---

## ✅ Admin Scope

This portal is intentionally a website CMS only. Use it to manage galleries, artwork metadata, uploads, workshops/events, studio profile content, SEO, and GitHub publishing. Customer communications and CRM records are not stored or managed here; visitors are directed to the studio's configured contact channels instead.

---

## 💻 Local Development Commands

```bash
# Install dependencies
npm install

# Start local admin server (runs on port 3002)
npm run dev

# Run TypeScript typecheck
npm run typecheck

# Build production bundle
npm run build

# Start production server
npm run start
```
