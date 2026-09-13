'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Images,
  Sparkles,
  CheckCircle,
  X,
  Loader2,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import { GALLERIES_META } from '@/data/galleriesData';
import { GalleryKey, StagedImage } from '@/lib/types';
import { optimizeArtworkImage } from '@/lib/imageOptimize';

interface LocalStagingItem {
  id: string;
  name: string;
  previewUrl: string;
  base64Data: string;
  targetGallery: GalleryKey;
  title: string;
  category: string;
  price: string;
  medium: string;
  dimensions: string;
  originalBytes: number;
  optimizedBytes: number;
}

export default function MassUploadPage() {
  const { stageUploadedImage, setActiveGallery } = useSite();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetGallery, setTargetGallery] = useState<GalleryKey>('sale');
  const [defaultMedium, setDefaultMedium] = useState('Watercolor on Archival Paper');
  const [defaultPrice, setDefaultPrice] = useState('₹18,000');
  const [defaultCategory, setDefaultCategory] = useState('Painting');

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

        newItems.push({
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: optimized.fileName,
          previewUrl: optimized.dataUrl,
          base64Data: optimized.base64Payload,
          targetGallery,
          title: cleanName,
          category: defaultCategory,
          price: defaultPrice,
          medium: defaultMedium,
          dimensions: '20x28 in',
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
        price: item.price,
        medium: item.medium,
        dimensions: item.dimensions,
        sizeBytes: item.optimizedBytes,
      });
    });

    const count = stagedQueue.length;
    setStagedQueue([]);
    setSuccessToast(`Staged ${count} artwork photo${count === 1 ? '' : 's'} for deployment!`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-studio-gold">
          Mass Upload Studio
        </h1>
        <p className="text-xs text-zinc-400">
          Drop artwork photos for automatic canvas compression, tagging, and one-click GitHub push
        </p>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-none" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Batch Defaults Controls */}
      <div className="p-5 rounded-2xl bg-studio-card border border-studio-border space-y-4">
        <h2 className="text-xs font-bold font-cinzel text-studio-gold uppercase tracking-wider">
          Batch Target & Defaults
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          {/* Destination Collection */}
          <div className="space-y-1">
            <label className="text-zinc-300 font-medium">Destination Gallery</label>
            <select
              value={targetGallery}
              onChange={(e) => setTargetGallery(e.target.value as GalleryKey)}
              className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none"
            >
              {GALLERIES_META.map((meta) => (
                <option key={meta.key} value={meta.key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          {/* Default Medium */}
          <div className="space-y-1">
            <label className="text-zinc-300 font-medium">Default Medium</label>
            <input
              type="text"
              value={defaultMedium}
              onChange={(e) => setDefaultMedium(e.target.value)}
              className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none"
            />
          </div>

          {/* Default Price */}
          <div className="space-y-1">
            <label className="text-zinc-300 font-medium">Default Price</label>
            <input
              type="text"
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(e.target.value)}
              className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-amber-300 font-semibold focus:border-studio-gold focus:outline-none"
            />
          </div>

          {/* Default Category */}
          <div className="space-y-1">
            <label className="text-zinc-300 font-medium">Category</label>
            <input
              type="text"
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none"
            />
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
            : 'border-studio-border hover:border-studio-gold/60 bg-studio-card/60 hover:bg-studio-card'
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
          <div className="w-16 h-16 mx-auto rounded-2xl bg-studio-purple/80 border border-studio-gold/40 flex items-center justify-center text-studio-gold shadow-xl">
            {processing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>
          <div>
            <h3 className="font-cinzel text-lg font-bold text-white">
              {processing ? 'Optimizing Artwork Canvas...' : 'Select or Drop Paintings Here'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Supports high-resolution JPEG, PNG, WEBP files. Browser compresses and resizes photos seamlessly for fast web loading.
            </p>
          </div>
        </div>
      </div>

      {/* Processed Queue */}
      {stagedQueue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel text-base font-bold text-studio-gold">
              Ready for Staging ({stagedQueue.length} photo{stagedQueue.length === 1 ? '' : 's'})
            </h2>
            <button
              onClick={handleStageAll}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-studio-gold to-amber-300 text-studio-purple-dark hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Stage All for Commit</span>
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
                  className="p-4 rounded-2xl bg-studio-card border border-studio-border space-y-3 flex flex-col justify-between"
                >
                  <div className="flex gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded-xl border border-studio-gold/30 flex-none"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        placeholder="Artwork title"
                        className="w-full px-2 py-1 bg-studio-dark border border-studio-border rounded-lg text-white font-medium focus:outline-none focus:border-studio-gold"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, { price: e.target.value })}
                          placeholder="Price"
                          className="w-full px-2 py-1 bg-studio-dark border border-studio-border rounded-lg text-amber-300 font-semibold focus:outline-none focus:border-studio-gold"
                        />
                        <select
                          value={item.targetGallery}
                          onChange={(e) =>
                            updateItem(item.id, { targetGallery: e.target.value as GalleryKey })
                          }
                          className="w-full px-2 py-1 bg-studio-dark border border-studio-border rounded-lg text-zinc-300 text-[11px] focus:outline-none focus:border-studio-gold"
                        >
                          {GALLERIES_META.map((meta) => (
                            <option key={meta.key} value={meta.key}>
                              {meta.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Compressed: {Math.round(item.optimizedBytes / 1024)} KB{' '}
                        {savings > 0 && <span className="text-emerald-400">(-{savings}%)</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-studio-border/50 text-xs">
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
