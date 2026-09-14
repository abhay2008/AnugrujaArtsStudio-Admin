'use client';

import React, { useState } from 'react';
import {
  FileText,
  Save,
  CheckCircle,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Globe,
  Award,
  Users,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
    </svg>
  );
}

export default function ContentSettingsPage() {
  const { content, loading, updateBrand, updateMeta, updateSection } = useSite();
  const [toastMessage, setToastMessage] = useState('');

  if (loading || !content) {
    return (
      <div className="text-center py-20 text-zinc-400">
        Loading content settings...
      </div>
    );
  }

  const { brand, meta, sections } = content;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const cleanWa = (brand?.whatsapp || '').replace(/[^0-9]/g, '');
  const testWaUrl = brand?.whatsapp?.startsWith('http')
    ? brand.whatsapp
    : `https://wa.me/${cleanWa}?text=${encodeURIComponent('Namaste! Welcome to Anugraha Arts Studio.')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-studio-gold">
            Studio Content & Profile Editor
          </h1>
        <p className="text-xs text-[color:var(--ink-muted)]">
          Configure studio biography, contact channels, WhatsApp quick link, and SEO
        </p>
        </div>
      </div>

      {toastMessage && (          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-none" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Section 1: Studio Brand & Founder */}
        <div className="admin-panel p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[color:var(--hairline)] pb-3">
            <FileText className="w-4 h-4 text-studio-gold" />
            <h2 className="font-cinzel font-bold text-sm text-studio-gold uppercase tracking-wider">
              Studio Identity & Founder
            </h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="admin-label">Studio Name</label>
              <input
                type="text"
                value={brand?.name || ''}
                onChange={(e) => {
                  updateBrand({ name: e.target.value });
                  showToast('Studio name updated');
                }}
                className="admin-input"
              />
            </div>

            <div className="space-y-1">
              <label className="admin-label">Studio Tagline</label>
              <input
                type="text"
                value={brand?.tagline || ''}
                onChange={(e) => {
                  updateBrand({ tagline: e.target.value });
                  showToast('Tagline updated');
                }}
                className="admin-input"
              />
            </div>

            <div className="space-y-1">
              <label className="admin-label">Founder & Master Artist Name</label>
              <input
                type="text"
                value={brand?.founder || ''}
                onChange={(e) => {
                  updateBrand({ founder: e.target.value });
                  showToast('Founder name updated');
                }}
                className="admin-input"
              />
            </div>

            <div className="space-y-1">
              <label className="admin-label">Artist Headline</label>
              <input
                type="text"
                value={sections?.aboutArtist?.headline || ''}
                onChange={(e) => {
                  updateSection('aboutArtist', { headline: e.target.value });
                  showToast('Headline updated');
                }}
                className="admin-input"
              />
            </div>

            <div className="space-y-1">
              <label className="admin-label">Artist Subheading / Philosophy</label>
              <textarea
                rows={3}
                value={sections?.aboutArtist?.subheading || ''}
                onChange={(e) => {
                  updateSection('aboutArtist', { subheading: e.target.value });
                  showToast('Subheading updated');
                }}
                className="admin-input resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Channels & WhatsApp */}
        <div className="admin-panel p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[color:var(--hairline)] pb-3">
            <Phone className="w-4 h-4 text-studio-gold" />
            <h2 className="font-cinzel font-bold text-sm text-studio-gold uppercase tracking-wider">
              Contact & Inquiry Channels
            </h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="admin-label">Primary Contact Phone</label>
              <input
                type="text"
                value={brand?.phoneDisplay || ''}
                onChange={(e) => {
                  updateBrand({ phoneDisplay: e.target.value });
                  showToast('Phone updated');
                }}
                className="admin-input"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="admin-label">WhatsApp Link / Number</label>
                <a
                  href={testWaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={brand?.whatsapp || ''}
                onChange={(e) => {
                  updateBrand({ whatsapp: e.target.value });
                  showToast('WhatsApp updated');
                }}
                placeholder="https://wa.link/... or +91 96112 55949"
                className="admin-input"
              />
            </div>

            <div className="space-y-1">
              <label className="admin-label">Official Email Address</label>
              <input
                type="email"
                value={brand?.email || ''}
                onChange={(e) => {
                  updateBrand({ email: e.target.value });
                  showToast('Email updated');
                }}
                className="admin-input"
              />
            </div>

            <div className="space-y-1">
              <label className="admin-label">Location Label</label>
              <input
                type="text"
                value={brand?.locationLabel || ''}
                onChange={(e) => {
                  updateBrand({ locationLabel: e.target.value });
                  showToast('Location updated');
                }}
                placeholder="e.g. Bengaluru & Chennai"
                className="admin-input"
              />
            </div>
          </div>

          {/* SEO Metadata */}
            <div className="pt-2 border-t border-[color:var(--hairline)] space-y-2">              <h3 className="font-semibold text-studio-gold text-xs">Search Engine Optimization (SEO)</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={meta?.title || ''}
                onChange={(e) => updateMeta({ title: e.target.value })}
                placeholder="Browser Page Title"
                className="w-full px-3 py-1.5 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none"
              />
              <textarea
                rows={2}
                value={meta?.description || ''}
                onChange={(e) => updateMeta({ description: e.target.value })}
                placeholder="Google Meta Description"
                className="admin-input resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
