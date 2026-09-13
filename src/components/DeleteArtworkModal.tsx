'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Artwork, GalleryKey } from '@/lib/types';

interface DeleteArtworkModalProps {
  artwork: Artwork | null;
  galleryKey: GalleryKey;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteArtworkModal({
  artwork,
  galleryKey,
  isOpen,
  onClose,
  onConfirm,
}: DeleteArtworkModalProps) {
  if (!isOpen || !artwork) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-studio-card border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-lg text-white">Delete Artwork</h3>
              <p className="text-xs text-zinc-400">This action can be reviewed before pushing to Git</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Artwork Summary */}
        <div className="flex items-center gap-3 p-3 bg-studio-dark/70 rounded-xl border border-studio-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artwork.src}
            alt={artwork.title}
            className="w-16 h-16 object-cover rounded-lg border border-studio-gold/30 flex-none"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-zinc-100 truncate">{artwork.title}</p>
            <p className="text-xs text-studio-gold truncate">
              {artwork.medium || 'Medium unspecified'}
            </p>
            <p className="text-xs text-zinc-400">
              {artwork.price || 'Price on Request'} • Collection: <span className="font-semibold text-zinc-300">{galleryKey}</span>
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Are you sure you want to remove this painting from the{' '}
          <strong className="text-zinc-200">{galleryKey}</strong> collection? The change will be staged in your dashboard until you review and commit.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm Deletion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
