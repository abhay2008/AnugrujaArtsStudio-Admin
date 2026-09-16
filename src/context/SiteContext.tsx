'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  SiteContent,
  GalleryKey,
  Artwork,
  SiteBrand,
  SiteMeta,
  SiteSections,
  StudioEvents,
  StagedImage,
  SocialLink,
  galleryCatalogEntry,
} from '@/lib/types';

interface SiteContextType {
  content: SiteContent | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  activeGallery: GalleryKey;
  setActiveGallery: (key: GalleryKey) => void;
  tokenOverride: string;
  setTokenOverride: (token: string) => void;
  stagedImages: StagedImage[];
  stageUploadedImage: (img: StagedImage) => void;
  removeStagedImage: (id: string) => void;
  clearStagedImages: () => void;
  updateBrand: (patch: Partial<SiteBrand>) => void;
  updateMeta: (patch: Partial<SiteMeta>) => void;
  updateSocial: (social: SocialLink[]) => void;
  updateSection: <K extends keyof SiteSections>(sectionKey: K, patch: Partial<SiteSections[K]>) => void;
  updateEvents: (patch: Partial<StudioEvents>) => void;
  addArtwork: (gallery: GalleryKey, artwork: Artwork) => void;
  updateArtwork: (gallery: GalleryKey, id: string, patch: Partial<Artwork>) => void;
  deleteArtwork: (gallery: GalleryKey, id: string) => void;
  reorderArtwork: (gallery: GalleryKey, fromIdx: number, toIdx: number) => void;
  moveArtwork: (
    gallery: GalleryKey,
    id: string,
    direction: 'first' | 'prev' | 'next' | 'last' | number
  ) => void;
  dirtyCount: number;
  hasUnsavedChanges: boolean;
  commitAllChanges: (message: string) => Promise<{ success: boolean; error?: string }>;
  refreshContent: () => Promise<void>;
}

const SiteContext = createContext<SiteContextType | null>(null);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [initialContent, setInitialContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGallery, setActiveGallery] = useState<GalleryKey>('sale');
  const [tokenOverride, setTokenOverrideState] = useState<string>('');
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('anugruja_github_token');
      if (savedToken) {
        setTokenOverrideState(savedToken);
      }
    }
  }, []);

  const setTokenOverride = (t: string) => {
    setTokenOverrideState(t);
    if (typeof window !== 'undefined') {
      if (t) {
        localStorage.setItem('anugruja_github_token', t);
      } else {
        localStorage.removeItem('anugruja_github_token');
      }
    }
  };

  const refreshContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (tokenOverride) headers['x-github-token'] = tokenOverride;

      const res = await fetch('/api/content', { headers });
      if (!res.ok) throw new Error('Failed to fetch site data');
      const data = (await res.json()) as SiteContent;
      setContent(JSON.parse(JSON.stringify(data)));
      setInitialContent(JSON.parse(JSON.stringify(data)));
    } catch (err: any) {
      setError(err.message || 'Error loading site content');
    } finally {
      setLoading(false);
    }
  }, [tokenOverride]);

  useEffect(() => {
    refreshContent();
  }, [refreshContent]);

  const updateBrand = (patch: Partial<SiteBrand>) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        brand: {
          ...prev.brand,
          ...patch,
        },
      };
    });
  };

  const updateMeta = (patch: Partial<SiteMeta>) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        meta: {
          ...prev.meta,
          ...patch,
        },
      };
    });
  };

  const updateSocial = (social: SocialLink[]) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        social,
      };
    });
  };

  const updateSection = <K extends keyof SiteSections>(
    sectionKey: K,
    patch: Partial<SiteSections[K]>
  ) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: {
            ...prev.sections[sectionKey],
            ...patch,
          },
        },
      };
    });
  };

  const updateEvents = (patch: Partial<StudioEvents>) => {
    setContent((prev) => {
      if (!prev) return prev;
      const current: StudioEvents = prev.events || { upcoming: [], past: [] };
      return {
        ...prev,
        events: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const addArtwork = (gallery: GalleryKey, artwork: Artwork) => {
    setContent((prev) => {
      if (!prev) return prev;
      const list = prev.galleries[gallery] || [];
      return {
        ...prev,
        galleries: {
          ...prev.galleries,
          [gallery]: [artwork, ...list],
        },
      };
    });
  };

  const updateArtwork = (gallery: GalleryKey, id: string, patch: Partial<Artwork>) => {
    setContent((prev) => {
      if (!prev) return prev;
      const list = prev.galleries[gallery] || [];
      const updated = list.map((item) => (item.id === id ? { ...item, ...patch } : item));
      return {
        ...prev,
        galleries: {
          ...prev.galleries,
          [gallery]: updated,
        },
      };
    });
  };

  const deleteArtwork = (gallery: GalleryKey, id: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const list = prev.galleries[gallery] || [];
      return {
        ...prev,
        galleries: {
          ...prev.galleries,
          [gallery]: list.filter((item) => item.id !== id),
        },
      };
    });
  };

  const reorderArtwork = (gallery: GalleryKey, fromIdx: number, toIdx: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      const list = [...(prev.galleries[gallery] || [])];
      if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length) {
        return prev;
      }
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      return {
        ...prev,
        galleries: {
          ...prev.galleries,
          [gallery]: list,
        },
      };
    });
  };

  const moveArtwork = (
    gallery: GalleryKey,
    id: string,
    direction: 'first' | 'prev' | 'next' | 'last' | number
  ) => {
    setContent((prev) => {
      if (!prev) return prev;
      const list = [...(prev.galleries[gallery] || [])];
      const idx = list.findIndex((a) => a.id === id);
      if (idx === -1) return prev;

      let target = idx;
      if (typeof direction === 'number') {
        target = Math.max(0, Math.min(list.length - 1, direction));
      } else if (direction === 'first') {
        target = 0;
      } else if (direction === 'last') {
        target = list.length - 1;
      } else if (direction === 'prev') {
        target = Math.max(0, idx - 1);
      } else if (direction === 'next') {
        target = Math.min(list.length - 1, idx + 1);
      }

      if (target === idx) return prev;
      const [moved] = list.splice(idx, 1);
      list.splice(target, 0, moved);

      return {
        ...prev,
        galleries: {
          ...prev.galleries,
          [gallery]: list,
        },
      };
    });
  };

  const stageUploadedImage = (img: StagedImage) => {
    setStagedImages((prev) => [img, ...prev]);
  };

  const removeStagedImage = (id: string) => {
    setStagedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const clearStagedImages = () => {
    setStagedImages([]);
  };

  const dirtyCount = useMemo(() => {
    if (!content || !initialContent) return stagedImages.length;
    let count = stagedImages.length;

    // Brand diff
    if (JSON.stringify(content.brand) !== JSON.stringify(initialContent.brand)) {
      count += 1;
    }
    // Meta diff
    if (JSON.stringify(content.meta) !== JSON.stringify(initialContent.meta)) {
      count += 1;
    }
    // Social diff
    if (JSON.stringify(content.social) !== JSON.stringify(initialContent.social)) {
      count += 1;
    }
    // Sections diff
    if (JSON.stringify(content.sections) !== JSON.stringify(initialContent.sections)) {
      count += 1;
    }

    // Galleries diff
    const allGalleryKeys = Array.from(
      new Set([
        ...Object.keys(content.galleries || {}),
        ...Object.keys(initialContent.galleries || {}),
      ])
    ) as GalleryKey[];

    for (const key of allGalleryKeys) {
      const curList = content.galleries[key] || [];
      const initList = initialContent.galleries[key] || [];

      if (curList.length !== initList.length) {
        count += Math.abs(curList.length - initList.length);
      }

      const minLen = Math.min(curList.length, initList.length);
      for (let i = 0; i < minLen; i++) {
        if (curList[i].id !== initList[i].id) {
          count += 1;
        } else if (JSON.stringify(curList[i]) !== JSON.stringify(initList[i])) {
          count += 1;
        }
      }
    }

    return count;
  }, [content, initialContent, stagedImages]);

  const commitAllChanges = async (message: string) => {
    if (!content) return { success: false, error: 'No content loaded' };
    setSaving(true);

    try {
      // Create a fresh clone of content so we can accumulate staged images directly into it
      const workingContent: SiteContent = JSON.parse(JSON.stringify(content));

      for (const img of stagedImages) {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(tokenOverride ? { 'x-github-token': tokenOverride } : {}),
          },
          body: JSON.stringify({
            fileName: img.name,
            base64Data: img.base64Data,
            message: `Upload ${img.title || img.name} for ${img.targetGallery}`,
            tokenOverride,
          }),
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(`Upload failed for ${img.name}: ${errData.error || uploadRes.statusText}`);
        }

        const uploaded = await uploadRes.json();
        const destEntry = galleryCatalogEntry(img.targetGallery);
        const isSale = destEntry.sellable;
        const newArtwork: Artwork = {
          id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: img.title || 'Untitled Artwork',
          category: img.category || destEntry.defaultCategory,
          description: img.description || undefined,
          // Never fabricate values: empty stays empty. Price/status only
          // exist on sellable collections, and only when provided.
          price: isSale && img.price ? img.price : undefined,
          medium: img.medium || undefined,
          dimensions: img.dimensions || undefined,
          status: isSale && img.status ? img.status : undefined,
          dateAdded: new Date().toISOString(),
          src: uploaded.src,
        };

        const targetList = workingContent.galleries[img.targetGallery] || [];
        workingContent.galleries[img.targetGallery] = [newArtwork, ...targetList];
      }

      const saveRes = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenOverride ? { 'x-github-token': tokenOverride } : {}),
        },
        body: JSON.stringify({
          content: workingContent,
          message,
          tokenOverride,
        }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.error || 'Failed to commit site changes');
      }

      setContent(workingContent);
      setInitialContent(JSON.parse(JSON.stringify(workingContent)));
      clearStagedImages();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Commit transaction failed' };
    } finally {
      setSaving(false);
    }
  };

  return (
    <SiteContext.Provider
      value={{
        content,
        loading,
        saving,
        error,
        activeGallery,
        setActiveGallery,
        tokenOverride,
        setTokenOverride,
        stagedImages,
        stageUploadedImage,
        removeStagedImage,
        clearStagedImages,
        updateBrand,
        updateMeta,
        updateSocial,
        updateSection,
        updateEvents,
        addArtwork,
        updateArtwork,
        deleteArtwork,
        reorderArtwork,
        moveArtwork,
        dirtyCount,
        hasUnsavedChanges: dirtyCount > 0,
        commitAllChanges,
        refreshContent,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    throw new Error('useSite must be used within SiteProvider');
  }
  return ctx;
}
