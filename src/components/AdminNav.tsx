'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Images,
  UploadCloud,
  FileText,
  CalendarDays,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';

interface AdminNavProps {
  onOpenReviewModal: () => void;
}

/**
 * The public website this portal publishes to. Hardcoding `localhost:3000`
 * pointed the studio owner's "View Website" button at their own machine on the
 * deployed portal, so the address is configurable and falls back sensibly:
 * the live site in a production build, the sibling dev server otherwise.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://anugruja-arts-studio.vercel.app'
    : 'http://localhost:3000');

/**
 * Section rail. `label` is what fits on a desktop bar without wrapping;
 * `full` is the sentence-case name used in the mobile drawer, tooltips and
 * accessible names. Labels collapse to icons between `md` and `xl` so the bar
 * never has to cram — and never wraps — at in-between widths.
 */
const NAV_ITEMS = [
  { href: '/', label: 'Home', full: 'Studio home', icon: LayoutDashboard },
  { href: '/galleries', label: 'Paintings', full: 'Paintings & collections', icon: Images },
  { href: '/upload', label: 'Upload', full: 'Add new work', icon: UploadCloud },
  { href: '/content', label: 'Studio Details', full: 'Studio details', icon: FileText },
  { href: '/events', label: 'Events', full: 'Events & workshops', icon: CalendarDays },
];

export default function AdminNav({ onOpenReviewModal }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasUnsavedChanges, dirtyCount } = useSite();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  /**
   * Shared nav styling. Every item is a fixed-height, single-line pill:
   * `whitespace-nowrap` + `shrink-0` is what stops the rail from folding
   * labels onto a second line when the bar gets tight.
   */
  const navItemClass = (isActive: boolean) =>
    [
      'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border',
      'min-h-[38px] px-2.5 xl:px-3.5 text-[13px] font-semibold',
      'transition-colors duration-200',
      isActive
        ? 'border-studio-gold/40 bg-studio-gold/12 text-studio-gold shadow-[inset_0_1px_0_rgba(255,251,235,0.08)]'
        : 'border-transparent text-zinc-300/90 hover:border-studio-gold/20 hover:bg-white/[0.05] hover:text-studio-gold',
    ].join(' ');

  return (
    <header className="sticky top-0 z-40 border-b border-studio-gold/15 bg-[#140820]/85 backdrop-blur-xl shadow-[0_10px_36px_-18px_rgba(0,0,0,0.8)]">
      {/* Gold foil top edge — the vitrine catch-light */}
      <div
        aria-hidden
        className="h-[2px] w-full bg-[linear-gradient(90deg,transparent_0%,#b8933a_18%,#f2d770_50%,#b8933a_82%,transparent_100%)] opacity-80"
      />

      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8">
        {/* Slightly taller than the old bar: the identity block now stacks a
            title and an "ADMIN PORTAL" tag without crowding the section rail. */}
        <div className="flex h-[68px] items-center justify-between gap-3">
          {/* ── Identity: crest + wordmark ─────────────────────────────── */}
          <Link
            href="/"
            aria-label="Anugruja admin portal — home"
            className="flex shrink-0 items-center gap-2.5 group"
          >
            {/* The studio's real logo crest (previously a plain "A" letter). */}
            <div className="w-10 h-10 rounded-xl bg-[linear-gradient(150deg,#f7e494_0%,#d4af37_55%,#8a6410_100%)] overflow-hidden flex items-center justify-center shadow-[0_6px_18px_-6px_rgba(212,175,55,0.7),inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-amber-200/40 group-hover:scale-105 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element -- static local asset; next/image adds nothing here */}
              <img src="/images/logo.png" alt="Anugruja Arts Studio logo" className="h-full w-full object-contain p-1" />
            </div>
            <div>
              <span className="block font-cinzel text-[15px] font-bold leading-none tracking-[0.16em] text-studio-gold sm:text-[17px]">
                ANUGRUJA
              </span>
              <span className="mt-[5px] block text-[9px] font-semibold uppercase leading-none tracking-[0.26em] text-amber-200/60 whitespace-nowrap">
                Admin Portal
              </span>
            </div>
          </Link>

          {/* ── Section rail ────────────────────────────────────────────
              Below `xl` the labels collapse to icons + tooltips, so the bar
              stays one clean line at every width with no second-line text. */}
          <nav
            aria-label="Portal sections"
            className="hidden md:inline-flex shrink-0 items-center gap-0.5 rounded-full border border-white/[0.07] bg-black/25 p-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.full}
                  aria-label={item.full}
                  aria-current={isActive ? 'page' : undefined}
                  className={navItemClass(isActive)}
                >
                  <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ── Actions: publish state, public site, sign out ──────────── */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {hasUnsavedChanges ? (
              <button
                onClick={onOpenReviewModal}
                title="Review and publish your changes to the website"
                className="admin-btn-gold !rounded-full !px-3 sm:!px-4 !py-2 !text-xs whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {/* Short label on narrow bars, full wording once there is room. */}
                <span className="lg:hidden">Publish ({dirtyCount})</span>
                <span className="hidden lg:inline">Review &amp; publish ({dirtyCount})</span>
              </button>
            ) : (
              <span
                title="All changes are published — the website matches this portal"
                className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/35 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 whitespace-nowrap"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                Up to date
              </span>
            )}

            {/* Hidden below `md`: the drawer already offers this, and dropping it
                on phones keeps the brand and the ADMIN PORTAL tag on one line.
                The wrapper (not the link) carries the breakpoint, because
                `.admin-btn-ghost` sets its own `display` that would out-rank
                Tailwind's `hidden`. */}
            <div className="hidden shrink-0 md:block">
              <a
                href={SITE_URL}
                target="_blank"
                rel="noreferrer"
                title="Open the public website"
                aria-label="Open the public website"
                className="admin-btn-ghost !rounded-full !px-3 !py-2 !text-xs whitespace-nowrap"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden xl:inline">View site</span>
              </a>
            </div>

            <span aria-hidden className="mx-0.5 hidden h-5 w-px bg-white/10 sm:block" />

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign out of the admin portal"
              aria-label="Sign out of the admin portal"
              className="shrink-0 rounded-full p-2 text-zinc-400 transition-colors hover:bg-rose-950/25 hover:text-rose-300 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden shrink-0 rounded-lg p-2 text-zinc-300 hover:bg-white/[0.05] hover:text-studio-gold"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer — has the room, so it uses the full section names. */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1a0b24]/95 backdrop-blur-xl border-b border-studio-gold/15 px-4 pt-2 pb-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium ${
                  isActive
                    ? 'bg-studio-gold/12 text-studio-gold border border-studio-gold/35'
                    : 'text-zinc-300 hover:text-studio-gold hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden />
                <span>{item.full}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-studio-gold/15 mt-2 flex flex-col gap-1">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:text-studio-gold"
            >
              <ExternalLink className="w-4 h-4 text-studio-gold" aria-hidden />
              <span>View public website</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
