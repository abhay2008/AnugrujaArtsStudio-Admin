'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Images,
  UploadCloud,
  FileText,
  MessageSquare,
  GitBranch,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Key,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';

interface AdminNavProps {
  onOpenReviewModal: () => void;
  onOpenTokenModal: () => void;
}

export default function AdminNav({ onOpenReviewModal, onOpenTokenModal }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasUnsavedChanges, dirtyCount, tokenOverride } = useSite();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/galleries', label: 'Galleries', icon: Images },
    { href: '/upload', label: 'Mass Upload', icon: UploadCloud },
    { href: '/content', label: 'Content & Profile', icon: FileText },
    { href: '/inquiries', label: 'Inquiries & Leads', icon: MessageSquare },
    { href: '/github', label: 'GitHub Sync & PAT', icon: GitBranch },
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
    <header className="sticky top-0 z-40 bg-studio-dark/95 backdrop-blur-md border-b border-studio-border shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-studio-gold-dark via-studio-gold to-amber-200 flex items-center justify-center text-studio-purple-dark font-cinzel font-black text-xl shadow-lg group-hover:scale-105 transition-transform">
                A
              </div>
              <div>
                <span className="font-cinzel text-lg tracking-wider text-studio-gold font-bold block leading-tight">
                  ANUGRUJA
                </span>
                <span className="text-[10px] tracking-widest text-amber-200/60 uppercase font-sans font-medium">
                  Studio Admin Console
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-studio-gold/15 text-studio-gold border border-studio-gold/30 shadow-inner'
                      : 'text-zinc-300 hover:text-studio-gold hover:bg-studio-purple/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Fine-Grained Token Quick Status */}
            <button
              onClick={onOpenTokenModal}
              title="Configure GitHub Fine-Grained Access Token"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                tokenOverride
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-300 hover:bg-amber-900/30'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{tokenOverride ? 'PAT Active' : 'PAT Setup'}</span>
            </button>

            {/* Unsaved Changes / Commit Button */}
            {hasUnsavedChanges ? (
              <button
                onClick={onOpenReviewModal}
                className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-studio-gold via-amber-300 to-studio-gold text-studio-purple-dark shadow-[0_0_15px_rgba(242,215,112,0.4)] hover:shadow-[0_0_25px_rgba(242,215,112,0.7)] active:scale-95 transition-all animate-pulse"
              >
                <Sparkles className="w-4 h-4" />
                <span>Review & Commit ({dirtyCount})</span>
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 bg-studio-card/60 border border-studio-border">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>In Sync</span>
              </div>
            )}

            {/* View Live Public Site */}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              title="View Public Site (opens port 3000)"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-studio-gold bg-studio-purple/30 border border-studio-border hover:border-studio-gold/40 transition-colors"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign Out of Studio Admin"
              className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-300 hover:text-studio-gold rounded-lg hover:bg-studio-purple/30"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-studio-card/95 border-b border-studio-border px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-studio-gold/15 text-studio-gold border border-studio-gold/30'
                    : 'text-zinc-300 hover:text-studio-gold hover:bg-studio-purple/40'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-studio-border mt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTokenModal();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-studio-gold"
            >
              <Key className="w-4 h-4 text-studio-gold" />
              <span>Configure GitHub Fine-Grained Token</span>
            </button>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-studio-gold"
            >
              <ExternalLink className="w-4 h-4 text-studio-gold" />
              <span>View Public Studio Site</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
