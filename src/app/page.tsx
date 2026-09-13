'use client';

import React from 'react';
import Link from 'next/link';
import {
  Images,
  UploadCloud,
  FileText,
  MessageSquare,
  GitBranch,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import { GALLERIES_META } from '@/data/galleriesData';
import { GalleryKey } from '@/lib/types';

export default function DashboardPage() {
  const { content, loading, inquiries, setActiveGallery, tokenOverride } = useSite();

  if (loading || !content) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-studio-gold" />
        <p className="text-sm text-zinc-400 font-sans">Connecting to Studio Repository...</p>
      </div>
    );
  }

  // Calculate metrics
  const totalArtworks = Object.values(content.galleries || {}).reduce(
    (acc, list) => acc + (list?.length || 0),
    0
  );

  const saleArtworks = content.galleries?.sale?.length || 0;
  const newInquiries = inquiries.filter((i) => i.status === 'New').length;

  return (
    <div className="space-y-8">
      {/* Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-studio-purple via-studio-card to-studio-purple border border-studio-gold/30 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-studio-gold/15 text-studio-gold border border-studio-gold/30">
              <Sparkles className="w-3.5 h-3.5" />
              Autonomous Studio Console
            </span>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-white tracking-wide">
              {content.brand?.name || 'Anugraha Arts Studio'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
              Curate gallery collections, process inquiries, upload high-res paintings, and deploy instant Git updates directly to GitHub.
            </p>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/galleries"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-studio-gold text-studio-purple-dark hover:bg-amber-300 shadow-lg hover:shadow-[0_0_20px_rgba(242,215,112,0.4)] transition-all"
            >
              <Images className="w-4 h-4" />
              <span>Manage Artworks</span>
            </Link>
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-studio-purple/60 border border-studio-gold/40 text-studio-gold hover:bg-studio-purple transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Photos</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-studio-card border border-studio-border shadow-lg space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Cataloged Artworks</span>
            <Images className="w-4 h-4 text-studio-gold" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-cinzel text-white">
            {totalArtworks}
          </p>
          <p className="text-[11px] text-zinc-400">Across 8 collections</p>
        </div>

        <div className="p-5 rounded-2xl bg-studio-card border border-studio-border shadow-lg space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Art for Sale</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-cinzel text-amber-300">
            {saleArtworks}
          </p>
          <p className="text-[11px] text-zinc-400">Available original paintings</p>
        </div>

        <div className="p-5 rounded-2xl bg-studio-card border border-studio-border shadow-lg space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Active Inquiries</span>
            <MessageSquare className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-cinzel text-sky-300">
            {inquiries.length}
          </p>
          <p className="text-[11px] text-zinc-400">
            {newInquiries > 0 ? (
              <span className="text-amber-300 font-semibold">{newInquiries} new leads pending</span>
            ) : (
              'All leads responded'
            )}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-studio-card border border-studio-border shadow-lg space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">GitHub Status</span>
            <GitBranch className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold font-mono text-emerald-300 truncate pt-2">
            {tokenOverride ? 'Fine-Grained Active' : 'Public Repo Linked'}
          </p>
          <p className="text-[11px] text-zinc-400">abhay2008/AnugrujaArtsStudio</p>
        </div>
      </div>

      {/* Gallery Collections Navigator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-cinzel text-xl font-bold text-studio-gold">
              Studio Collections & Galleries
            </h2>
            <p className="text-xs text-zinc-400">
              Select a gallery to reorder paintings, edit pricing, or add new exhibits
            </p>
          </div>
          <Link
            href="/galleries"
            className="text-xs text-studio-gold hover:underline flex items-center gap-1"
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
                className="group relative rounded-2xl bg-studio-card border border-studio-border overflow-hidden hover:border-studio-gold/50 shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between"
              >
                {/* Artwork Thumbnail Strip */}
                <div className="relative h-32 w-full bg-studio-dark/80 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={firstImg}
                    alt={meta.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-studio-card via-studio-card/40 to-transparent" />
                  <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-studio-dark/90 text-studio-gold border border-studio-border">
                    {list.length} artworks
                  </span>
                </div>

                {/* Details & Jump Button */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-cinzel font-bold text-base text-zinc-100 group-hover:text-studio-gold transition-colors">
                      {meta.label}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                      {meta.description}
                    </p>
                  </div>

                  <Link
                    href={`/galleries?gallery=${meta.key}`}
                    onClick={() => setActiveGallery(meta.key as GalleryKey)}
                    className="flex items-center justify-between text-xs font-semibold text-studio-gold hover:text-white pt-2 border-t border-studio-border/50"
                  >
                    <span>Manage Collection</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Inquiries Preview */}
      {inquiries.length > 0 && (
        <div className="p-6 rounded-2xl bg-studio-card border border-studio-border shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-studio-gold" />
              <div>
                <h3 className="font-cinzel font-bold text-base text-white">
                  Recent Inquiries & Commissions
                </h3>
                <p className="text-xs text-zinc-400">Customer requests awaiting direct response</p>
              </div>
            </div>
            <Link
              href="/inquiries"
              className="text-xs font-semibold text-studio-gold hover:underline flex items-center gap-1"
            >
              <span>View All ({inquiries.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-studio-border/50">
            {inquiries.slice(0, 3).map((inq) => {
              const cleanPhone = inq.phone.replace(/[^0-9]/g, '');
              const waText = encodeURIComponent(
                `Namaste ${inq.customerName}! Thank you for your inquiry with Anugraha Arts Studio regarding ${inq.artworkTitle || inq.interest}. How can I assist you with your requirements?`
              );
              const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

              return (
                <div key={inq.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-zinc-100">{inq.customerName}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-studio-purple text-studio-gold border border-studio-border">
                        {inq.interest}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {inq.artworkTitle} • Budget: <span className="text-zinc-200">{inq.budget || inq.quotedPrice || 'Flexible'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-none">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
