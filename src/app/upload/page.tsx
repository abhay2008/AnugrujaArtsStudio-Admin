'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Sparkles,
  CheckCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import { GALLERY_CATALOG, ArtworkStatus, GalleryKey, StagedImage, galleryCatalogEntry, suggestGalleryFromFilename } from '@/lib/types';
import { optimizeArtworkImage } from '@/lib/imageOptimize';

interface LocalStagingItem {
  id: string;
  name: string;
  previewUrl: string;
  base64Data: string;
  targetGallery: GalleryKey;
  gallerySource: 'filename' | 'default' | 'manual';
  title: string;
  category: string;
  categoryTouched: boolean;
  description: string;
  price: string;
  medium: string;
  dimensions: string;
  status?: ArtworkStatus;
  originalBytes: number;
  optimizedBytes: number;
}

export default function MassUploadPage() {
  const { stageUploadedImage } = useSite();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetGallery, setTargetGallery] = useState<GalleryKey>('sale');

  const [processing, setProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [stagedQueue, setStagedQueue] = useState<LocalStagingItem[]>([]);
  const [successToast, setSuccessToast] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessing(true);

    const newItems: LocalStagingItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const optimized = await optimizeArtworkImage(file, 1600, 0.82);

        // Derive nice title from filename: "krishna_flute_01.jpg" -> "Krishna Flute 01"
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[_-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        // Smart mapping: filename hints beat the batch default.
        const suggested = suggestGalleryFromFilename(file.name);
        const dest = suggested ?? targetGallery;
        const destDef = galleryCatalogEntry(dest);

        newItems.push({
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: optimized.fileName,
          previewUrl: optimized.dataUrl,
          base64Data: optimized.base64Payload,
          targetGallery: dest,
          gallerySource: suggested ? 'filename' : 'default',
          title: cleanName,
          category: destDef.defaultCategory,
          categoryTouched: false,
          description: '',
          // Never fabricate: fields stay empty unless the client fills them.
          price: '',
          medium: '',
          dimensions: '',
          status: undefined,
          originalBytes: optimized.originalBytes,
          optimizedBytes: optimized.optimizedBytes,
        });
      } catch (err) {
        console.error('Failed optimizing image:', file.name, err);
      }
    }

    setStagedQueue((prev) => [...newItems, ...prev]);
    setProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    setStagedQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, patch: Partial<LocalStagingItem>) => {
    setStagedQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const setItemGallery = (id: string, gallery: GalleryKey) => {
    const def = galleryCatalogEntry(gallery);
    setStagedQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              targetGallery: gallery,
              gallerySource: 'manual',
              category: item.categoryTouched ? item.category : def.defaultCategory,
              price: def.sellable ? item.price : '',
              status: def.sellable ? item.status : undefined,
            }
          : item
      )
    );
  };

  const handleStageAll = () => {
    if (stagedQueue.length === 0) return;

    stagedQueue.forEach((item) => {
      stageUploadedImage({
        id: item.id,
        name: item.name,
        previewUrl: item.previewUrl,
        base64Data: item.base64Data,
        targetGallery: item.targetGallery,
        title: item.title,
        category: item.category,
        description: item.description,
        price: item.price,
        medium: item.medium,
        dimensions: item.dimensions,
        status: item.status,
        sizeBytes: item.optimizedBytes,
      });
    });

    const count = stagedQueue.length;
    setStagedQueue([]);
    setSuccessToast(`${count} photo${count === 1 ? '' : 's'} added to your publish review.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-studio-gold">
          Add New Work
        </h1>
        <p className="text-xs text-[color:var(--ink-muted)]">
          Add paintings and studio photos. We will help place each one in the right part of your website before you publish.
        </p>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-none" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Batch Defaults Controls */}
      <div className="admin-panel p-5 space-y-4">
        <h2 className="text-xs font-bold font-cinzel text-studio-gold uppercase tracking-wider">
          Where should unmatched photos go?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Destination Collection */}
          <div className="space-y-1">
            <label className="admin-label">Choose a collection</label>
            <select
              value={targetGallery}
              onChange={(e) => setTargetGallery(e.target.value as GalleryKey)}
              className="admin-input text-studio-gold font-semibold"
            >
              {GALLERY_CATALOG.map((meta) => (
                <option key={meta.key} value={meta.key}>
                  {meta.label} — {meta.sellable ? 'can be offered for sale' : 'website showcase'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[color:var(--ink-faint)]">
              {galleryCatalogEntry(targetGallery).purpose}
            </p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-studio-gold bg-studio-gold/10 scale-[1.01]'
            : 'border-[color:var(--hairline-strong)] hover:border-studio-gold/60 bg-black/20 hover:bg-black/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-studio-gold/10 border border-[color:var(--hairline-strong)] flex items-center justify-center text-studio-gold shadow-xl">
            {processing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>
          <div>
            <h3 className="font-cinzel text-lg font-bold text-white">
              {processing ? 'Preparing your photos...' : 'Choose or drop photos here'}
            </h3>
            <p className="text-xs text-[color:var(--ink-muted)] mt-1">
              You can select several photos at once. Photos are prepared automatically so the website stays fast and clear.
            </p>
          </div>
        </div>
      </div>

      {/* Processed Queue */}
      {stagedQueue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel text-base font-bold text-studio-gold">
              Ready for Review ({stagedQueue.length} photo{stagedQueue.length === 1 ? '' : 's'})
            </h2>
            <button
              onClick={handleStageAll}
              className="admin-btn-gold px-5 py-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Review These Photos</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stagedQueue.map((item) => {
              const savings = Math.round(
                ((item.originalBytes - item.optimizedBytes) / item.originalBytes) * 100
              );

              return (
                <div
                  key={item.id}
                  className="admin-card p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="flex gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded-xl border border-[color:var(--hairline-strong)] flex-none"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        placeholder="Artwork title"
                        className="admin-input text-white font-medium"
                      />
                      <select
                        value={item.targetGallery}
                        onChange={(e) => setItemGallery(item.id, e.target.value as GalleryKey)}
                        className="admin-input text-[11px]"
                      >
                        {GALLERY_CATALOG.map((meta) => (
                          <option key={meta.key} value={meta.key}>
                            {meta.label} — {meta.sellable ? 'sale catalog' : 'showcase only'}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-[color:var(--ink-faint)] leading-snug">
                        {item.gallerySource === 'filename' && (
                          <span className="text-emerald-400">✓ Suggested from the file name — </span>
                        )}
                        {galleryCatalogEntry(item.targetGallery).purpose}
                      </p>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => updateItem(item.id, { category: e.target.value, categoryTouched: true })}
                        placeholder={galleryCatalogEntry(item.targetGallery).defaultCategory}
                        className="admin-input"
                      />
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Short description for the public website (optional)"
                        className="admin-input resize-y"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.medium}
                          onChange={(e) => updateItem(item.id, { medium: e.target.value })}
                          placeholder="Medium (optional)"
                          className="admin-input"
                        />
                        <input
                          type="text"
                          value={item.dimensions}
                          onChange={(e) => updateItem(item.id, { dimensions: e.target.value })}
                          placeholder="Dimensions (optional)"
                          className="admin-input"
                        />
                      </div>
                      {galleryCatalogEntry(item.targetGallery).sellable ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, { price: e.target.value })}
                            placeholder="Price — blank = on request"
                            className="admin-input text-studio-gold font-semibold"
                          />
                          <select
                            value={item.status || ''}
                            onChange={(e) => updateItem(item.id, { status: (e.target.value || undefined) as ArtworkStatus | undefined })}
                            className="admin-input"
                          >
                            <option value="">No availability label</option>
                            <option value="Available">Available</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Sold">Sold</option>
                          </select>
                        </div>
                      ) : (
                        <p className="text-[10px] text-[color:var(--ink-faint)] italic">
                          Showcase piece — price and availability labels are intentionally disabled.
                        </p>
                      )}
                      <p className="text-[11px] text-[color:var(--ink-muted)]">
                        Prepared photo: {Math.round(item.optimizedBytes / 1024)} KB{' '}
                        {savings > 0 && <span className="text-emerald-400">(-{savings}%)</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[color:var(--hairline)] text-xs">
                    <span className="text-[11px] text-studio-gold truncate">{item.name}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
