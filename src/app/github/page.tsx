'use client';

import { CheckCircle, Info, ShieldCheck } from 'lucide-react';

export default function PublishingInfoPage() {
  return (
    <div className="space-y-6 text-sm">
      <div>
        <p className="admin-kicker">Website publishing</p>
        <h1 className="font-cinzel text-2xl font-bold text-studio-gold mt-1">Your Website Connection</h1>
        <p className="text-xs text-[color:var(--ink-muted)] mt-1 max-w-2xl">
          The website is connected automatically. You do not need to understand or manage the technical setup.
        </p>
      </div>

      <div className="admin-panel p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-cinzel text-lg font-bold text-white">Nothing extra is needed here</h2>
            <p className="text-xs text-[color:var(--ink-muted)] mt-1 leading-relaxed">
              Edit your paintings, events, photos, and studio details in the sections above. When you choose
              <strong className="text-studio-gold"> Review &amp; Publish</strong>, the public website is updated for you.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-black/20 border border-[color:var(--hairline)] space-y-1.5">
            <ShieldCheck className="w-4 h-4 text-studio-gold" />
            <h3 className="font-semibold text-zinc-100">Safe review first</h3>
            <p className="text-[color:var(--ink-muted)]">Your edits wait for your approval before anything changes on the website.</p>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-[color:var(--hairline)] space-y-1.5">
            <Info className="w-4 h-4 text-studio-gold" />
            <h3 className="font-semibold text-zinc-100">Need help?</h3>
            <p className="text-[color:var(--ink-muted)]">Contact your website administrator if this page ever shows a warning.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
