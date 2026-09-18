'use client';

import React from 'react';
import Link from 'next/link';
import {
  Images,
  UploadCloud,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import { GALLERIES_META } from '@/data/galleriesData';
import { GalleryKey } from '@/lib/types';

export default function DashboardPage() {
  const { content, loading, setActiveGallery } = useSite();

  if (loading || !content) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-studio-gold" />
        <p className="text-sm text-zinc-400 font-sans">Loading your studio information…</p>
      </div>
    );
  }

  // Studio metrics
  const totalArtworks = Object.values(content.galleries || {}).reduce(
    (acc, list) => acc + (list?.length || 0),
    0
  );
  const saleArtworks = content.galleries?.sale?.length || 0;
  const metrics = [
    {
      label: 'Cataloged Artworks',
      value: String(totalArtworks),
      sub: 'Across 8 collections',
      icon: Images,
      tone: 'text-studio-gold',
      valueTone: 'text-white',
    },
    {
      label: 'Art for Sale',
      value: String(saleArtworks),
      sub: 'Available original paintings',
      icon: ShoppingBag,
      tone: 'text-amber-300',
      valueTone: 'text-amber-200',
    },
    {
      label: 'Website Status',
      value: 'Ready to Publish',
      sub: 'Your latest changes are safely reviewed before publishing',
      icon: ShieldCheck,
      tone: 'text-emerald-300',
      valueTone: 'text-emerald-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Studio header banner */}
      <section className="admin-panel relative overflow-hidden p-6 sm:p-8">
        {/* Ambient foil sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 55% 70% at 85% 0%, rgba(242,215,112,0.10), transparent 60%), radial-gradient(ellipse 40% 60% at 8% 100%, rgba(125,60,152,0.14), transparent 60%)',
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <span className="admin-pill admin-pill--gold">
              <Sparkles className="w-3 h-3" />
              Admin Portal
            </span>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-white tracking-wide">
              {content.brand?.name || 'Anugruja Arts Studio'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300/90 max-w-xl leading-relaxed">
              Keep your paintings, collections, workshops, and studio information beautifully organised
              on the website.
            </p>
          </div>

          {/* Action hub */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/galleries" className="admin-btn-gold px-4 py-2.5">
              <Images className="w-4 h-4" />
              <span>Manage Artworks</span>
            </Link>
            <Link href="/upload" className="admin-btn-ghost px-4 py-2.5">
              <UploadCloud className="w-4 h-4" />
              <span>Upload Photos</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics row */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="admin-card p-5 space-y-1.5">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold tracking-wide uppercase">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.tone}`} />
              </div>
              <p className={`text-2xl sm:text-3xl font-bold font-cinzel ${m.valueTone}`}>{m.value}</p>
              <p className="text-[11px] text-zinc-400">{m.sub}</p>
            </div>
          );
        })}
      </section>

      {/* Gallery collections navigator */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="admin-title text-xl font-bold">Studio Collections &amp; Galleries</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Choose a collection to organise paintings, update details, or add new work
            </p>
          </div>
          <Link
            href="/galleries"
            className="text-xs font-semibold text-studio-gold hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Open Gallery Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GALLERIES_META.map((meta) => {
            const list = content.galleries[meta.key] || [];
            const firstImg = list[0]?.src || '/images/banner.jpeg';

            return (
              <div
                key={meta.key}
                className="admin-card group relative overflow-hidden flex flex-col justify-between !transform-none"
              >
                {/* Artwork thumbnail */}
                <div className="relative h-32 w-full bg-studio-dark/80 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={firstImg}
                    alt={meta.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#200e2a] via-[#200e2a]/40 to-transparent" />
                  <span className="admin-pill admin-pill--gold absolute bottom-2 right-2 !bg-[#14081a]/85">
                    {list.length} artworks
                  </span>
                </div>

                {/* Details & jump */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-cinzel font-bold text-base text-zinc-100 group-hover:text-studio-gold transition-colors">
                      {meta.label}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{meta.description}</p>
                  </div>

                  <Link
                    href={`/galleries?gallery=${meta.key}`}
                    onClick={() => setActiveGallery(meta.key as GalleryKey)}
                    className="flex items-center justify-between text-xs font-semibold text-studio-gold hover:text-white pt-2.5 border-t border-studio-gold/15"
                  >
                    <span>Manage Collection</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
