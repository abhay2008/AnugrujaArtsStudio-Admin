'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ImageOff, RotateCw, Loader2 } from 'lucide-react';
import { getAdminImageUrl } from '@/lib/urlUtils';
import {
  getCachedClientImage,
  loadCachedClientImageAsync,
  normalizeImageKey,
} from '@/lib/clientImageCache';

export { getAdminImageUrl };

interface ArtworkThumbnailProps {
  src: string;
  alt: string;
  className?: string;
  aspect?: 'contain' | 'cover';
  versionKey?: string | number;
  containerClassName?: string;
}

export default function ArtworkThumbnail({
  src,
  alt,
  className = 'max-h-full max-w-full object-contain',
  aspect = 'contain',
  versionKey,
  containerClassName = '',
}: ArtworkThumbnailProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [cacheBustTime, setCacheBustTime] = useState<number>(0);

  // 1. Synchronous check for client browser cache
  const initialClientSrc = useMemo(() => {
    return getCachedClientImage(src);
  }, [src]);

  const [clientCachedSrc, setClientCachedSrc] = useState<string | null>(initialClientSrc);
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialClientSrc);

  // 2. Hydrate from persistent browser storage (IndexedDB / Cache API)
  useEffect(() => {
    let active = true;

    // Fast sync check
    const sync = getCachedClientImage(src);
    if (sync) {
      setClientCachedSrc(sync);
      setIsLoading(false);
      setLoadFailed(false);
      return;
    }

    // Async storage check
    loadCachedClientImageAsync(src).then((cached) => {
      if (active && cached) {
        setClientCachedSrc(cached);
        setIsLoading(false);
        setLoadFailed(false);
      }
    });

    // Listen for live upload events in current window
    const handleCachedEvent = (e: Event) => {
      const custom = e as CustomEvent<{ src: string; filename: string; url: string }>;
      if (custom.detail) {
        const norm = normalizeImageKey(src);
        const eventNorm = normalizeImageKey(custom.detail.src);
        const eventFilename = custom.detail.filename;
        if (
          norm === eventNorm ||
          norm.endsWith(eventFilename) ||
          eventNorm.endsWith(norm) ||
          src.includes(eventFilename)
        ) {
          if (active) {
            setClientCachedSrc(custom.detail.url);
            setIsLoading(false);
            setLoadFailed(false);
          }
        }
      }
    };

    window.addEventListener('anugruja:image-cached', handleCachedEvent);
    return () => {
      active = false;
      window.removeEventListener('anugruja:image-cached', handleCachedEvent);
    };
  }, [src]);

  // Reset retry & fail states when source URL or version changes
  useEffect(() => {
    setLoadFailed(false);
    setRetryCount(0);
    setCacheBustTime(0);

    const sync = getCachedClientImage(src);
    if (sync) {
      setClientCachedSrc(sync);
      setIsLoading(false);
    } else {
      setClientCachedSrc(null);
      setIsLoading(true);
    }
  }, [src, versionKey]);

  // Determine display URL: client browser cache takes precedence for immediate 0ms rendering
  const computedSrc = useMemo(() => {
    if (clientCachedSrc) return clientCachedSrc;
    return getAdminImageUrl(src, versionKey, cacheBustTime, retryCount);
  }, [src, clientCachedSrc, versionKey, cacheBustTime, retryCount]);

  const handleManualReload = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Allow network retry by clearing client cache pointer for this card
    setClientCachedSrc(null);
    setRetryCount(0);
    setCacheBustTime(Date.now());
    setIsLoading(true);
    setLoadFailed(false);
  }, []);

  const handleError = useCallback(() => {
    // If we have a cached client version, fall back to it immediately before showing failure
    const cached = getCachedClientImage(src);
    if (cached && computedSrc !== cached) {
      setClientCachedSrc(cached);
      setIsLoading(false);
      setLoadFailed(false);
      return;
    }

    // Automatically retry up to 3 times with exponential backoff for network lag
    if (retryCount < 3) {
      const nextAttempt = retryCount + 1;
      const delay = nextAttempt * 1000;
      const timer = setTimeout(() => {
        setCacheBustTime(Date.now());
        setRetryCount(nextAttempt);
        setIsLoading(true);
        setLoadFailed(false);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setLoadFailed(true);
      setIsLoading(false);
    }
  }, [retryCount, src, computedSrc]);

  if (loadFailed) {
    return (
      <div className="flex flex-col items-center justify-center p-3 text-center h-full w-full bg-black/50 text-zinc-400 space-y-2 select-none">
        <ImageOff className="w-5 h-5 text-amber-400/80 shrink-0" />
        <span className="text-[11px] text-zinc-400 leading-tight">Image not rendered</span>
        <button
          type="button"
          onClick={handleManualReload}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-studio-gold/15 hover:bg-studio-gold/25 text-studio-gold text-[10px] font-semibold transition-colors border border-studio-gold/30"
          title="Bypass browser cache and reload photo"
        >
          <RotateCw className="w-3 h-3" />
          <span>Reload</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${containerClassName}`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
          <Loader2 className="w-4 h-4 text-studio-gold/50 animate-spin" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={computedSrc}
        alt={alt}
        onLoad={() => {
          setIsLoading(false);
          setLoadFailed(false);
        }}
        onError={handleError}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
      />
    </div>
  );
}
