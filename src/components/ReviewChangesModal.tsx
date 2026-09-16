'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  Images,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import { galleryCatalogEntry } from '@/lib/types';

interface ReviewChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewChangesModal({ isOpen, onClose }: ReviewChangesModalProps) {
  const {
    content,
    stagedImages,
    dirtyCount,
    commitAllChanges,
    saving,
    removeStagedImage,
  } = useSite();

  const [commitStatus, setCommitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleCommit = async () => {
    setCommitStatus('idle');
    setErrorMessage('');
    const res = await commitAllChanges('Website update from Studio Manager');
    if (res.success) {
      setCommitStatus('success');
      setTimeout(() => {
        onClose();
        setCommitStatus('idle');
      }, 1600);
    } else {
      setCommitStatus('error');
      setErrorMessage(res.error || 'The website could not be updated. Your changes are still safe to try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="admin-panel relative w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--hairline)] bg-black/25">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-studio-gold/20 text-studio-gold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-lg text-studio-gold">
                Review & Publish Changes
              </h3>
              <p className="text-xs text-[color:var(--ink-muted)]">
                {dirtyCount} change{dirtyCount === 1 ? '' : 's'} ready to appear on the website
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-[color:var(--ink-faint)] hover:text-studio-gold hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Staged Uploaded Images */}
          {stagedImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-studio-gold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Images className="w-4 h-4" />
                  New photos ({stagedImages.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stagedImages.map((img) => (
                  <div
                    key={img.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-black/25 border border-[color:var(--hairline)] group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.previewUrl}
                      alt={img.title}
                      className="w-14 h-14 object-cover rounded-lg border border-[color:var(--hairline-strong)] flex-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-200 truncate">{img.title}</p>
                      <p className="text-xs text-studio-gold truncate">
                        {galleryCatalogEntry(img.targetGallery).label}
                        {img.status ? ` • ${img.status}` : ''}
                      </p>
                      <p className="text-[11px] text-[color:var(--ink-muted)]">
                        {img.price || 'Price on request'} • {Math.round(img.sizeBytes / 1024)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => removeStagedImage(img.id)}
                      title="Remove this photo"
                      className="text-[color:var(--ink-faint)] hover:text-rose-400 p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event and gallery context summary */}
          {content?.events && (
            <div className="p-3.5 rounded-xl bg-black/25 border border-[color:var(--hairline)] text-xs space-y-1.5">
              <p className="font-semibold text-studio-gold">Live website calendar included</p>
              <p className="text-[color:var(--ink-muted)]">
                {content.events.upcoming.length} upcoming event{content.events.upcoming.length === 1 ? '' : 's'} · {content.events.past.length} past event{content.events.past.length === 1 ? '' : 's'}
              </p>
            </div>
          )}

          {/* Plain-language publishing summary */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-studio-gold uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-4 h-4" />
              Before you publish
            </div>
            <div className="p-3.5 rounded-xl bg-black/25 border border-[color:var(--hairline)] text-xs text-[color:var(--ink)] space-y-2">
              <p>These changes will update the public website, including the gallery, event information, and studio details you edited.</p>
              <p className="text-[color:var(--ink-muted)]">You can remove any photo above before publishing. After publishing, the website assistant will also learn the new information automatically.</p>
            </div>
          </div>

          {/* Error Message */}
          {commitStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-none" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {commitStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs">
              <CheckCircle className="w-4 h-4 flex-none" />
              <span>Website updated successfully. Your new information is now live.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[color:var(--hairline)] bg-black/20">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-[color:var(--ink-muted)] hover:text-studio-gold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCommit}
            disabled={saving || (dirtyCount === 0 && stagedImages.length === 0)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-studio-gold via-amber-300 to-studio-gold text-studio-purple-dark shadow-lg hover:shadow-[0_0_20px_rgba(242,215,112,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating the website...</span>
              </>
            ) : (
              <>
                <span>Publish Changes</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
