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
import { GalleryKey, Artwork } from '@/lib/types';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold' | 'reserved'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Deletion modal state
  const [deletingArtwork, setDeletingArtwork] = useState<Artwork | null>(null);

  // New artwork drawer / form state
  const [isAddingArtwork, setIsAddingArtwork] = useState(false);
  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtMedium, setNewArtMedium] = useState('Watercolor on Archival Paper');
  const [newArtPrice, setNewArtPrice] = useState('₹18,000');
  const [newArtDimensions, setNewArtDimensions] = useState('20x28 in');
  const [newArtCategory, setNewArtCategory] = useState('Painting');
  const [newArtSrc, setNewArtSrc] = useState('/images/banner.jpeg');
  const [newArtStatus, setNewArtStatus] = useState<'available' | 'sold' | 'reserved'>('available');

  // Editing in-place state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMedium, setEditMedium] = useState('');
  const [editStatus, setEditStatus] = useState<'available' | 'sold' | 'reserved'>('available');

  const galleryList = content?.galleries[selectedGallery] || [];

  const filteredArtworks = useMemo(() => {
    return galleryList.filter((art) => {
      const matchSearch =
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.medium && art.medium.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (art.price !== undefined && String(art.price).toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        filterStatus === 'all' || (art.status || 'available') === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [galleryList, searchQuery, filterStatus]);

  const handleStartEdit = (art: Artwork) => {
    setEditingId(art.id);
    setEditTitle(art.title);
    setEditPrice(art.price !== undefined ? String(art.price) : '');
    setEditMedium(art.medium || '');
    setEditStatus(art.status || 'available');
  };

  const handleSaveEdit = (id: string) => {
    updateArtwork(selectedGallery, id, {
      title: editTitle,
      price: editPrice,
      medium: editMedium,
      status: editStatus,
    });
    setEditingId(null);
  };

  const handleCreateArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtTitle) return;

    const newArt: Artwork = {
      id: `art-${Date.now()}`,
      title: newArtTitle,
      category: newArtCategory,
      medium: newArtMedium,
      price: newArtPrice,
      dimensions: newArtDimensions,
      src: newArtSrc,
      status: newArtStatus,
    };

    addArtwork(selectedGallery, newArt);
    setIsAddingArtwork(false);
    // Reset form
    setNewArtTitle('');
  };

  if (loading || !content) {
    return (
      <div className="text-center py-20 text-zinc-400">
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
            <p className="text-xs text-zinc-400">
              Curate, reorder, and update prices for all studio collections
            </p>
          </div>

          <button
            onClick={() => setIsAddingArtwork(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-studio-gold text-studio-purple-dark hover:bg-amber-300 shadow-md transition-all self-start sm:self-auto"
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-studio-gold text-studio-purple-dark shadow-md'
                    : 'bg-studio-card/80 text-zinc-300 hover:text-studio-gold hover:bg-studio-purple/40 border border-studio-border'
                }`}
              >
                <span>{meta.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected
                      ? 'bg-studio-purple-dark text-studio-gold font-bold'
                      : 'bg-studio-dark text-zinc-400'
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-studio-card border border-studio-border">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artworks by title, medium, price..."
            className="w-full pl-9 pr-3 py-1.5 bg-studio-dark border border-studio-border rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-studio-gold"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-none">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-1.5 bg-studio-dark border border-studio-border rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-studio-gold"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available for Sale</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-studio-dark border border-studio-border rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
              className={`p-1.5 rounded-lg text-xs ${
                viewMode === 'grid'
                  ? 'bg-studio-gold/20 text-studio-gold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Reorder Table View"
              className={`p-1.5 rounded-lg text-xs ${
                viewMode === 'table'
                  ? 'bg-studio-gold/20 text-studio-gold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Artwork Content List (Grid vs Table) */}
      {filteredArtworks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-studio-card border border-studio-border text-zinc-400 space-y-3">
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
                className="rounded-2xl bg-studio-card border border-studio-border overflow-hidden hover:border-studio-gold/40 shadow-xl flex flex-col justify-between group transition-all"
              >
                {/* Artwork Thumbnail */}
                <div className="relative h-48 w-full bg-studio-dark overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={art.src}
                    alt={art.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Position Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/80 text-studio-gold border border-studio-gold/30">
                    #{idx + 1}
                  </span>
                  {/* Status Badge */}
                  <span
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                      art.status === 'sold'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                        : art.status === 'reserved'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {art.status || 'available'}
                  </span>
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
                        className="w-full px-2.5 py-1 text-xs bg-studio-dark border border-studio-gold rounded-lg text-white"
                      />
                      <input
                        type="text"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="Price (e.g. ₹25,000)"
                        className="w-full px-2.5 py-1 text-xs bg-studio-dark border border-studio-border rounded-lg text-amber-300 font-semibold"
                      />
                      <input
                        type="text"
                        value={editMedium}
                        onChange={(e) => setEditMedium(e.target.value)}
                        placeholder="Medium (e.g. Oil on Canvas)"
                        className="w-full px-2.5 py-1 text-xs bg-studio-dark border border-studio-border rounded-lg text-zinc-300"
                      />
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full px-2.5 py-1 text-xs bg-studio-dark border border-studio-border rounded-lg text-zinc-300"
                      >
                        <option value="available">Available</option>
                        <option value="sold">Sold</option>
                        <option value="reserved">Reserved</option>
                      </select>

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
                          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-zinc-700 text-white text-xs"
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
                        <span className="font-semibold text-amber-300">
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
                        className="p-1 hover:text-studio-gold hover:bg-studio-dark rounded"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'prev')}
                        title="Move Up"
                        className="p-1 hover:text-studio-gold hover:bg-studio-dark rounded"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'next')}
                        title="Move Down"
                        className="p-1 hover:text-studio-gold hover:bg-studio-dark rounded"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveArtwork(selectedGallery, art.id, 'last')}
                        title="Move to Last"
                        className="p-1 hover:text-studio-gold hover:bg-studio-dark rounded"
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
                        className="w-12 px-1.5 py-0.5 bg-studio-dark border border-studio-border rounded text-[11px] font-mono text-center text-studio-gold focus:outline-none focus:border-studio-gold"
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
        <div className="rounded-2xl bg-studio-card border border-studio-border overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-studio-dark/80 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-studio-border">
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
                <tr key={art.id} className="hover:bg-studio-dark/40 transition-colors">
                  <td className="p-3 text-center font-mono font-bold text-studio-gold">
                    {idx + 1}
                  </td>
                  <td className="p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={art.src}
                      alt={art.title}
                      className="w-10 h-10 object-cover rounded-lg border border-studio-gold/30"
                    />
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-zinc-100">{art.title}</p>
                    <p className="text-[11px] text-zinc-400">{art.medium || 'Medium unspecified'}</p>
                  </td>
                  <td className="p-3 font-semibold text-amber-300">
                    {art.price || 'Price on Request'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        art.status === 'sold'
                          ? 'bg-rose-950 text-rose-300'
                          : 'bg-emerald-950 text-emerald-300'
                      }`}
                    >
                      {art.status || 'available'}
                    </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-studio-card border border-studio-gold/30 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-studio-border pb-3">
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
                <label className="text-zinc-300 font-medium">Artwork Title *</label>
                <input
                  type="text"
                  required
                  value={newArtTitle}
                  onChange={(e) => setNewArtTitle(e.target.value)}
                  placeholder="e.g. Celestial Radha Krishna"
                  className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Medium</label>
                  <input
                    type="text"
                    value={newArtMedium}
                    onChange={(e) => setNewArtMedium(e.target.value)}
                    placeholder="e.g. Oil on Canvas"
                    className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Price (INR / USD)</label>
                  <input
                    type="text"
                    value={newArtPrice}
                    onChange={(e) => setNewArtPrice(e.target.value)}
                    placeholder="e.g. ₹24,000"
                    className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Dimensions</label>
                  <input
                    type="text"
                    value={newArtDimensions}
                    onChange={(e) => setNewArtDimensions(e.target.value)}
                    placeholder="e.g. 24x36 in"
                    className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Availability Status</label>
                  <select
                    value={newArtStatus}
                    onChange={(e) => setNewArtStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none"
                  >
                    <option value="available">Available for Sale</option>
                    <option value="sold">Sold</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300 font-medium">Image Asset Path / URL</label>
                <input
                  type="text"
                  value={newArtSrc}
                  onChange={(e) => setNewArtSrc(e.target.value)}
                  placeholder="/images/p1.jpeg or remote image URL"
                  className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 font-mono text-xs focus:border-studio-gold focus:outline-none"
                />
                <p className="text-[11px] text-zinc-500">
                  Tip: Use Mass Upload Studio for drag & drop file uploads directly from your phone or desktop.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingArtwork(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold rounded-xl bg-studio-gold text-studio-purple-dark hover:bg-amber-300 transition-colors shadow-md"
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
        <div className="text-center py-20 text-zinc-400">
          Loading gallery collections...
        </div>
      }
    >
      <GalleryManagerContent />
    </React.Suspense>
  );
}
