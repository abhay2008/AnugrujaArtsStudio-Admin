'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  GitCommit,
  CheckCircle,
  AlertCircle,
  Loader2,
  Images,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';

interface ReviewChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewChangesModal({ isOpen, onClose }: ReviewChangesModalProps) {
  const {
    stagedImages,
    dirtyCount,
    commitAllChanges,
    saving,
    tokenOverride,
    removeStagedImage,
  } = useSite();

  const [commitMessage, setCommitMessage] = useState(
    `Admin update: sync gallery artworks and studio content (${new Date().toLocaleDateString()})`
  );
  const [commitStatus, setCommitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleCommit = async () => {
    setCommitStatus('idle');
    setErrorMessage('');
    const res = await commitAllChanges(commitMessage);
    if (res.success) {
      setCommitStatus('success');
      setTimeout(() => {
        onClose();
        setCommitStatus('idle');
      }, 1600);
    } else {
      setCommitStatus('error');
      setErrorMessage(res.error || 'Failed committing to GitHub');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-studio-card border border-studio-gold/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border bg-studio-purple/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-studio-gold/20 text-studio-gold">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-lg text-studio-gold">
                Review & Commit Changes
              </h3>
              <p className="text-xs text-zinc-400">
                {dirtyCount} pending modification{dirtyCount === 1 ? '' : 's'} ready for GitHub deployment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
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
                  Staged New Artworks ({stagedImages.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stagedImages.map((img) => (
                  <div
                    key={img.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-studio-dark/70 border border-studio-border group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.previewUrl}
                      alt={img.title}
                      className="w-14 h-14 object-cover rounded-lg border border-studio-gold/30 flex-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-200 truncate">{img.title}</p>
                      <p className="text-xs text-studio-gold truncate">
                        Gallery: <span className="text-amber-200 font-semibold">{img.targetGallery}</span>
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {img.price} • {Math.round(img.sizeBytes / 1024)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => removeStagedImage(img.id)}
                      title="Remove from staging"
                      className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content & Metadata Changes */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-studio-gold uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-4 h-4" />
              Content Modifications
            </div>
            <div className="p-3.5 rounded-xl bg-studio-dark/50 border border-studio-border/60 text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between">
                <span>Target Repository:</span>
                <span className="font-mono text-studio-gold">abhay2008/AnugrujaArtsStudio (main)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Persistence Mode:</span>
                <span className="text-emerald-400">Direct Git Contents API + Local Sibling Mirror</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Access Token:</span>
                <span className="text-zinc-400 font-mono">
                  {tokenOverride ? 'Fine-Grained PAT Active' : 'Default Repo Token'}
                </span>
              </div>
            </div>
          </div>

          {/* Commit Message Authoring */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-300">
              GitHub Commit Message
            </label>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-studio-dark border border-studio-border rounded-xl focus:border-studio-gold focus:outline-none text-zinc-100 resize-none font-mono"
              placeholder="Descriptive summary of artworks and content changes..."
            />
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
              <span>Successfully committed changes directly to GitHub!</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-studio-border bg-studio-purple/30">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
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
                <span>Committing to GitHub...</span>
              </>
            ) : (
              <>
                <span>Publish to GitHub</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
