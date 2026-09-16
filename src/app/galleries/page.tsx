'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
  Edit3,
  Check,
  X,
  LayoutGrid,
  List,
  ExternalLink,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import { GALLERIES_META } from '@/data/galleriesData';
import { ArtworkStatus, GalleryKey, Artwork, galleryCatalogEntry } from '@/lib/types';
import DeleteArtworkModal from '@/components/DeleteArtworkModal';

function GalleryManagerContent() {
  const searchParams = useSearchParams();
  const initialGallery = (searchParams.get('gallery') as GalleryKey) || 'sale';

  const {
    content,
    loading,
    activeGallery,
    setActiveGallery,
    updateArtwork,
    deleteArtwork,
    moveArtwork,
    addArtwork,
  } = useSite();

  const [selectedGallery, setSelectedGallery] = useState<GalleryKey>(initialGallery);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Available' | 'Sold' | 'Reserved'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Deletion modal state
  const [deletingArtwork, setDeletingArtwork] = useState<Artwork | null>(null);

  // New artwork drawer / form state
  const [isAddingArtwork, setIsAddingArtwork] = useState(false);
  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtMedium, setNewArtMedium] = useState('');
  const [newArtPrice, setNewArtPrice] = useState('');
  const [newArtDimensions, setNewArtDimensions] = useState('');
  const [newArtCategory, setNewArtCategory] = useState('');
  const [newArtSrc, setNewArtSrc] = useState('/images/banner.jpeg');
  const [newArtStatus, setNewArtStatus] = useState<ArtworkStatus | ''>('');

  // Editing in-place state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMedium, setEditMedium] = useState('');
  const [editStatus, setEditStatus] = useState<ArtworkStatus | ''>('');

  const galleryList = content?.galleries[selectedGallery] || [];

  const filteredArtworks = useMemo(() => {
    return galleryList.filter((art) => {
      const matchSearch =
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.medium && art.medium.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (art.price !== undefined && String(art.price).toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        filterStatus === 'all' || art.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [galleryList, searchQuery, filterStatus]);

  const selectedMeta = galleryCatalogEntry(selectedGallery);

  const handleStartEdit = (art: Artwork) => {
    setEditingId(art.id);
    setEditTitle(art.title);
    setEditPrice(art.price !== undefined ? String(art.price) : '');
    setEditMedium(art.medium || '');
    setEditStatus(art.status || '');
  };

  const handleSaveEdit = (id: string) => {
    // On showcase collections price/status are not meaningful — clear them
    // instead of persisting junk. Blank price on sale = price on request.
    updateArtwork(selectedGallery, id, {
      title: editTitle,
      price: selectedMeta.sellable && editPrice ? editPrice : undefined,
      medium: editMedium || undefined,
      status: selectedMeta.sellable && editStatus ? editStatus : undefined,
    });
    setEditingId(null);
  };

  const handleCreateArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtTitle) return;

    const newArt: Artwork = {
      id: `art-${Date.now()}`,
      title: newArtTitle,
      category: newArtCategory || selectedMeta.defaultCategory,
      medium: newArtMedium || undefined,
      price: selectedMeta.sellable && newArtPrice ? newArtPrice : undefined,
      dimensions: newArtDimensions || undefined,
      src: newArtSrc,
      status: selectedMeta.sellable && newArtStatus ? newArtStatus : undefined,
    };

    addArtwork(selectedGallery, newArt);
    setIsAddingArtwork(false);
    // Reset form
    setNewArtTitle('');
  };

  if (loading || !content) {
    return (
      <div className="text-center py-20 text-[color:var(--ink-muted)]">
        Loading gallery collections...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Heading & Gallery Selector Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-studio-gold">
              Gallery & Artwork Manager
            </h1>
            <p className="text-xs text-[color:var(--ink-muted)]">
              Curate, reorder, and update prices for all studio collections
            </p>
          </div>

          <button
            onClick={() => setIsAddingArtwork(true)}
            className="admin-btn-gold px-4 py-2.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Artwork</span>
          </button>
        </div>

        {/* Collection Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-studio-border/60 no-scrollbar">
          {GALLERIES_META.map((meta) => {
            const isSelected = selectedGallery === meta.key;
            const count = content.galleries[meta.key]?.length || 0;

            return (
              <button
                key={meta.key}
                onClick={() => setSelectedGallery(meta.key)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected ? 'admin-btn-gold' : 'admin-btn-ghost'
                }`}
              >
                <span>{meta.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected
                      ? 'bg-black/25 text-studio-gold font-bold'
                      : 'bg-black/30 text-[color:var(--ink-faint)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artworks by title, medium, price..."
            className="admin-input pl-9 pr-3 py-1.5 text-xs"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-none">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="admin-input px-3 py-1.5 text-xs w-auto sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available for Sale</option>
            <option value="Sold">Sold</option>
            <option value="Reserved">Reserved</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-black/30 border border-[color:var(--hairline)] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
              className={`p-1.5 rounded-lg text-xs ${
                viewMode === 'grid'
                  ? 'bg-studio-gold/15 text-studio-gold'
                  : 'text-[color:var(--ink-faint)] hover:text-studio-gold'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Reorder Table View"
              className={`p-1.5 rounded-lg text-xs ${
                viewMode === 'table'
                  ? 'bg-studio-gold/15 text-studio-gold'
                  : 'text-[color:var(--ink-faint)] hover:text-studio-gold'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Artwork Content List (Grid vs Table) */}
      {filteredArtworks.length === 0 ? (
        <div className="admin-panel p-12 text-center text-[color:var(--ink-muted)] space-y-3">
          <p className="text-sm">No artworks found matching your search.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
            }}
            className="text-xs text-studio-gold underline"
          >
            Clear filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArtworks.map((art, idx) => {
            const isEditing = editingId === art.id;

            return (
              <div
                key={art.id}
                className="admin-card overflow-hidden flex flex-col justify-between group"
              >
                {/* Artwork Thumbnail */}
                <div className="relative h-48 w-full bg-black/40 overflow-hidden flex items-center justify-center border-b border-[color:var(--hairline)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={art.src}
                    alt={art.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Position Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/70 text-studio-gold border border-[color:var(--hairline-strong)]">
                    #{idx + 1}
                  </span>
                  {/* Status Badge — only on sellable collections */}
                  {selectedMeta.sellable && (
                    <span
                      className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm ${
                        art.status === 'Sold'
                          ? 'bg-rose-500/15 text-rose-200 border border-rose-400/30'
                          : art.status === 'Reserved'
                          ? 'bg-amber-500/15 text-amber-200 border border-amber-400/30'
                          : 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'
                      }`}
                    >
                      {art.status}
                    </span>
                  )}
                </div>

                {/* Details / In-Place Editor */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Artwork title"
                        className="admin-input text-xs"
                      />
                      <input
                        type="text"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="Price (e.g. ₹25,000)"
                        className="admin-input text-xs font-semibold text-studio-gold"
                      />
                      <input
                        type="text"
                        value={editMedium}
                        onChange={(e) => setEditMedium(e.target.value)}
                        placeholder="Medium (e.g. Oil on Canvas)"
                        className="admin-input text-xs"
                      />
                      {selectedMeta.sellable && (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as any)}
                          className="admin-input text-xs"
                        >
                          <option value="">No availability label</option>
                          <option value="Available">Available</option>
                          <option value="Sold">Sold</option>
                          <option value="Reserved">Reserved</option>
                        </select>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSaveEdit(art.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-white/5 border border-[color:var(--hairline)] text-[color:var(--ink)] text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-cinzel font-bold text-sm text-zinc-100 line-clamp-1">
                          {art.title}
                        </h3>
                        <button
                          onClick={() => handleStartEdit(art)}
                          className="p-1 text-zinc-400 hover:text-studio-gold transition-colors"
                          title="Edit artwork details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-studio-gold font-medium line-clamp-1">
                        {art.medium || 'Medium unspecified'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                        <span className="font-semibold text-studio-gold">
                          {art.price || 'Price on Request'}
                        </span>
                        <span>{art.dimensions || 'Dimensions on request'}</span>
                      </div>
                    </div>
                  )}

                  {/* Reordering Controls & Delete */}
                  <div className="pt-3 border-t border-studio-border/60 flex items-center justify-between gap-1 text-xs">
                    {/* Stepper Buttons */}
                    <div className="flex items-center gap-1 text-zinc-400">
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'first')}
                        title="Move to First (#1)"
                        className="p-1 hover:text-studio-gold hover:bg-white/10 rounded"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'prev')}
                        title="Move Up"
                        className="p-1 hover:text-studio-gold hover:bg-white/10 rounded"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'next')}
                        title="Move Down"
                        className="p-1 hover:text-studio-gold hover:bg-white/10 rounded"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'last')}
                        title="Move to Last"
                        className="p-1 hover:text-studio-gold hover:bg-white/10 rounded"
                      >
                        <ChevronsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Numeric Jump */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500 font-mono">Jump:</span>
                      <input
                        type="number"
                        min={1}
                        max={galleryList.length}
                        placeholder={String(idx + 1)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt((e.target as HTMLInputElement).value, 10);
                            if (!isNaN(val)) {
                              moveArtwork(selectedGallery, art.id, val - 1);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="w-12 px-1.5 py-0.5 bg-black/40 border border-[color:var(--hairline)] rounded text-[11px] font-mono text-center text-studio-gold focus:outline-none focus:border-[color:var(--hairline-strong)]"
                      />
                    </div>

                    {/* Delete Trigger */}
                    <button
                      onClick={() => setDeletingArtwork(art)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Delete artwork"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Reorder Table Mode */
        <div className="admin-panel overflow-hidden">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-black/30 text-[color:var(--ink-muted)] uppercase tracking-wider text-[10px] border-b border-[color:var(--hairline)]">
              <tr>
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3 w-16">Image</th>
                <th className="p-3">Title & Medium</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Move Sequence</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border/50">
              {filteredArtworks.map((art, idx) => (
                <tr key={art.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3 text-center font-mono font-bold text-studio-gold">
                    {idx + 1}
                  </td>
                  <td className="p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={art.src}
                      alt={art.title}
                      className="w-10 h-10 object-cover rounded-lg border border-[color:var(--hairline-strong)]"
                    />
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-zinc-100">{art.title}</p>
                    <p className="text-[11px] text-zinc-400">{art.medium || 'Medium unspecified'}</p>
                  </td>
                  <td className="p-3 font-semibold text-studio-gold">
                    {art.price || 'Price on Request'}
                  </td>
                  <td className="p-3">
                    {selectedMeta.sellable ? (
                      <span
                        className={`admin-pill ${
                          (art.status || 'Available') === 'Sold'
                            ? 'admin-pill--rose'
                            : 'admin-pill--green'
                        }`}
                      >
                        {art.status || 'No label'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-zinc-400">
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'first')}
                        title="Top"
                        className="p-1 hover:text-studio-gold"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'prev')}
                        title="Up"
                        className="p-1 hover:text-studio-gold"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'next')}
                        title="Down"
                        className="p-1 hover:text-studio-gold"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'last')}
                        title="Bottom"
                        className="p-1 hover:text-studio-gold"
                      >
                        <ChevronsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setDeletingArtwork(art)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Artwork Modal */}
      {isAddingArtwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="admin-panel relative w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[color:var(--hairline)] pb-3">
              <h3 className="font-cinzel font-bold text-lg text-studio-gold">
                Add Artwork to {selectedGallery}
              </h3>
              <button
                onClick={() => setIsAddingArtwork(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArtwork} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="admin-label">Artwork Title *</label>
                <input
                  type="text"
                  required
                  value={newArtTitle}
                  onChange={(e) => setNewArtTitle(e.target.value)}
                  placeholder="e.g. Celestial Radha Krishna"
                  className="admin-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="admin-label">Medium</label>
                  <input
                    type="text"
                    value={newArtMedium}
                    onChange={(e) => setNewArtMedium(e.target.value)}
                    placeholder="e.g. Oil on Canvas"
                    className="admin-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="admin-label">{selectedMeta.sellable ? 'Price (blank = on request)' : 'Price (showcase — leave blank)'}</label>
                  <input
                    type="text"
                    value={newArtPrice}
                    onChange={(e) => setNewArtPrice(e.target.value)}
                    placeholder={selectedMeta.sellable ? 'e.g. ₹24,000' : '—'}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="admin-label">Dimensions</label>
                  <input
                    type="text"
                    value={newArtDimensions}
                    onChange={(e) => setNewArtDimensions(e.target.value)}
                    placeholder="e.g. 24x36 in"
                    className="admin-input"
                  />
                </div>
                {selectedMeta.sellable && (
                  <div className="space-y-1">
                    <label className="admin-label">Availability Status</label>
                    <select
                      value={newArtStatus}
                      onChange={(e) => setNewArtStatus(e.target.value as any)}
                      className="admin-input"
                    >
                      <option value="">No availability label</option>
                      <option value="Available">Available for Sale</option>
                      <option value="Sold">Sold</option>
                      <option value="Reserved">Reserved</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="admin-label">Photo location (optional)</label>
                <input
                  type="text"
                  value={newArtSrc}
                  onChange={(e) => setNewArtSrc(e.target.value)}
                  placeholder="e.g. /images/p1.jpeg"
                  className="admin-input font-mono text-xs"
                />
                <p className="text-[11px] text-[color:var(--ink-faint)]">
                  Tip: Use Add New Work to choose photos directly from your phone or computer.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingArtwork(false)}
                  className="px-4 py-2 text-[color:var(--ink-muted)] hover:text-studio-gold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-gold px-5 py-2"
                >
                  Add to Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteArtworkModal
        artwork={deletingArtwork}
        galleryKey={selectedGallery}
        isOpen={Boolean(deletingArtwork)}
        onClose={() => setDeletingArtwork(null)}
        onConfirm={() => {
          if (deletingArtwork) {
            deleteArtwork(selectedGallery, deletingArtwork.id);
            setDeletingArtwork(null);
          }
        }}
      />
    </div>
  );
}

export default function GalleryManagerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="text-center py-20 text-[color:var(--ink-muted)]">
          Loading gallery collections...
        </div>
      }
    >
      <GalleryManagerContent />
    </React.Suspense>
  );
}
