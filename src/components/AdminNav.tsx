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
  ShieldCheck,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';

interface AdminNavProps {
  onOpenReviewModal: () => void;
}

export default function AdminNav({ onOpenReviewModal }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasUnsavedChanges, dirtyCount } = useSite();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { href: '/', label: 'Studio Home', icon: LayoutDashboard },
    { href: '/galleries', label: 'Paintings & Collections', icon: Images },
    { href: '/upload', label: 'Add New Work', icon: UploadCloud },
    { href: '/content', label: 'Studio Details', icon: FileText },
    { href: '/events', label: 'Events & Workshops', icon: CalendarDays },
  ];

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

  return (
    <header className="sticky top-0 z-40 border-b border-studio-gold/15 bg-[#140820]/80 backdrop-blur-xl shadow-[0_10px_36px_-18px_rgba(0,0,0,0.8)]">
      {/* Gold foil top edge — the vitrine catch-light */}
      <div
        aria-hidden
        className="h-[2px] w-full bg-[linear-gradient(90deg,transparent_0%,#b8933a_18%,#f2d770_50%,#b8933a_82%,transparent_100%)] opacity-80"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand crest + wordmark */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-[linear-gradient(150deg,#f7e494_0%,#d4af37_55%,#8a6410_100%)] flex items-center justify-center text-[#221204] font-cinzel font-black text-xl shadow-[0_6px_18px_-6px_rgba(212,175,55,0.7),inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-amber-200/40 group-hover:scale-105 transition-transform">
                A
              </div>
              <div>
                <span className="font-cinzel text-lg tracking-[0.14em] text-studio-gold font-bold block leading-tight">
                  ANUGRUJA
                </span>
                <span className="text-[9px] tracking-[0.3em] text-amber-200/50 uppercase font-sans font-semibold">
                  Studio Manager
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation — quiet pills, gold when active */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-studio-gold/12 text-studio-gold border border-studio-gold/35 shadow-[inset_0_1px_0_rgba(255,251,235,0.08)]'
                      : 'text-zinc-300/90 border border-transparent hover:text-studio-gold hover:bg-white/[0.04] hover:border-studio-gold/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right action bar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Unsaved changes / publish CTA */}
            {hasUnsavedChanges ? (
              <button
                onClick={onOpenReviewModal}
                className="admin-btn-gold !rounded-full !px-4 !py-2 !text-xs animate-pulse"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Review &amp; Publish ({dirtyCount})
                </span>
              </button>
            ) : (
              <div className="admin-pill admin-pill--green hidden lg:inline-flex">
                <ShieldCheck className="w-3 h-3" />
                <span>Website Up to Date</span>
              </div>
            )}

            {/* View live public site */}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              title="Open the public website"
              className="admin-btn-ghost !rounded-full !px-3 !py-2 !text-xs hidden lg:inline-flex"
            >
              <span>View Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign Out of Studio Admin"
              className="p-2 text-zinc-400 hover:text-rose-300 hover:bg-rose-950/25 rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-300 hover:text-studio-gold rounded-lg hover:bg-white/[0.05]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1a0b24]/95 backdrop-blur-xl border-b border-studio-gold/15 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium ${
                  isActive
                    ? 'bg-studio-gold/12 text-studio-gold border border-studio-gold/35'
                    : 'text-zinc-300 hover:text-studio-gold hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-studio-gold/15 mt-2 flex flex-col gap-1">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:text-studio-gold"
            >
              <ExternalLink className="w-4 h-4 text-studio-gold" />
              <span>View Public Website</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
