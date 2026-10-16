'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  UploadCloud,
  User,
  Sparkles,
  GraduationCap,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Award,
  AlertCircle,
  Loader2,
  Layers,
  Globe,
  Quote,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import {
  StudioMetric,
  StudioEducation,
  StudioChapter,
} from '@/lib/types';
import { optimizeArtworkImage } from '@/lib/imageOptimize';
import { cacheClientImage } from '@/lib/clientImageCache';
import { getAdminImageUrl } from '@/lib/urlUtils';

const DEFAULT_METRICS: StudioMetric[] = [
  { label: 'Experience', value: '7+ Years of Studio Practice' },
  { label: 'Specialization', value: 'Realistic Watercolor' },
  { label: 'Atelier', value: 'Founder & Lead Mentor' },
];

const DEFAULT_EDUCATION: StudioEducation[] = [
  {
    degree: 'Bachelor of Engineering (B.E.)',
    institution: 'Vellore Institute of Technology (VIT)',
  },
  {
    degree: 'Diploma in Fashion Design',
    institution: 'Hamstech Institute of Fashion Design, Hyderabad',
  },
];

const DEFAULT_CHAPTERS: StudioChapter[] = [
  {
    num: '01',
    tag: 'The Spark',
    title: 'The Engineering Mind & Creative Solitude',
    subtitle: 'Chennai Roots • VIT Engineering Graduate',
    body: 'Born and raised in Chennai, Anuradha graduated in engineering from VIT before family life shifted her horizons. Longing to reignite childhood fires, she found sanctuary stealing away to her art room amidst domestic whirlwinds.',
  },
  {
    num: '02',
    tag: 'The Crucible',
    title: 'The Adversary Becomes the Bestie',
    subtitle: 'Hamstech Fashion Alumna • Conquering Watercolor Realism',
    body: 'Supported by family, she completed fashion design at Hamstech and ran her own boutique, yet fine art called relentlessly. When initial rejections mounted, she transformed watercolor — initially her fiercest adversary — into her greatest ally through ruthless discipline and realistic watercolor mastery.',
  },
  {
    num: '03',
    tag: 'Mastery',
    title: 'Founding Anugruja Arts Studio',
    subtitle: '7+ Years of Studio Practice • Global Masterclasses',
    body: 'From surviving critiques to receiving global acclaim from master artists, she established Anugruja Arts Studio. Today, she balances motherhood, studio mastery, and institutional mentorship worldwide.',
  },
];

export default function ArtStudioDetailsPage() {
  const { content, loading, updateBrand, updateMeta, updateSection, tokenOverride } = useSite();
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'artist' | 'journey' | 'studio' | 'contact'>('all');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [cacheBustTime, setCacheBustTime] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading || !content) {
    return (
      <div className="text-center py-20 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-studio-gold" />
        Loading art studio details...
      </div>
    );
  }

  const { brand, meta, sections } = content;
  const aboutArtist = sections?.aboutArtist;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setUploadingPhoto(true);
    setUploadError('');

    try {
      // Local immediate preview
      const preview = URL.createObjectURL(file);
      setLocalPreview(preview);

      // Canvas resize & compression
      const optimized = await optimizeArtworkImage(file, 800, 0.85);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenOverride ? { 'x-github-token': tokenOverride } : {}),
        },
        body: JSON.stringify({
          fileName: optimized.fileName,
          base64Data: optimized.base64Payload,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.src) {
        throw new Error(result.error || 'Failed to upload photo.');
      }

      // Cache locally in browser
      cacheClientImage(result.src, optimized.dataUrl);
      setCacheBustTime(Date.now());

      // Update aboutArtist section
      updateSection('aboutArtist', {
        portraitImage: result.src,
        portraitAlt: aboutArtist?.portraitAlt || `${brand?.founder || 'Anuradha Govarthanan'} Portrait`,
      });

      showToast('Artist portrait updated successfully');
    } catch (err: any) {
      console.error('Portrait upload failed:', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
      setLocalPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const cleanWa = (brand?.whatsapp || '').replace(/[^0-9]/g, '');
  const testWaUrl = brand?.whatsapp?.startsWith('http')
    ? brand.whatsapp
    : `https://wa.me/${cleanWa}?text=${encodeURIComponent('Namaste! Welcome to Anugruja Arts Studio.')}`;

  // Current metrics & helpers
  const metrics: StudioMetric[] =
    aboutArtist?.metrics && aboutArtist.metrics.length > 0
      ? aboutArtist.metrics
      : DEFAULT_METRICS;

  const updateMetric = (index: number, patch: Partial<StudioMetric>) => {
    const next = [...metrics];
    next[index] = { ...next[index], ...patch };
    updateSection('aboutArtist', { metrics: next });
    showToast('Metrics updated');
  };

  const addMetric = () => {
    const next = [...metrics, { label: 'New Metric', value: 'Value' }];
    updateSection('aboutArtist', { metrics: next });
    showToast('Added metric item');
  };

  const removeMetric = (index: number) => {
    const next = metrics.filter((_, i) => i !== index);
    updateSection('aboutArtist', { metrics: next });
    showToast('Removed metric item');
  };

  // Current education / pedigree & helpers
  const education: StudioEducation[] =
    aboutArtist?.education && aboutArtist.education.length > 0
      ? aboutArtist.education
      : DEFAULT_EDUCATION;

  const updateEdu = (index: number, patch: Partial<StudioEducation>) => {
    const next = [...education];
    next[index] = { ...next[index], ...patch };
    updateSection('aboutArtist', { education: next });
    showToast('Pedigree updated');
  };

  const addEdu = () => {
    const next = [...education, { degree: 'Degree / Certification', institution: 'Institution / Academy' }];
    updateSection('aboutArtist', { education: next });
    showToast('Added pedigree item');
  };

  const removeEdu = (index: number) => {
    const next = education.filter((_, i) => i !== index);
    updateSection('aboutArtist', { education: next });
    showToast('Removed pedigree item');
  };

  // Current chapters & helpers
  const journey = aboutArtist?.journey;
  const chapters: StudioChapter[] =
    journey?.chapters && journey.chapters.length > 0
      ? journey.chapters
      : DEFAULT_CHAPTERS;

  const updateChapter = (index: number, patch: Partial<StudioChapter>) => {
    const next = [...chapters];
    next[index] = { ...next[index], ...patch };
    updateSection('aboutArtist', {
      journey: {
        ...journey,
        eyebrow: journey?.eyebrow || 'Biography & Studio Journey',
        heading: journey?.heading || 'The Master’s Journey',
        chapters: next,
      },
    });
    showToast(`Chapter ${next[index].num || index + 1} updated`);
  };

  const addChapter = () => {
    const nextNum = String(chapters.length + 1).padStart(2, '0');
    const next = [
      ...chapters,
      {
        num: nextNum,
        tag: 'NEW CHAPTER',
        title: 'Chapter Title',
        subtitle: 'Milestone / Focus',
        body: 'Describe this chapter of the artistic journey...',
      },
    ];
    updateSection('aboutArtist', {
      journey: {
        ...journey,
        eyebrow: journey?.eyebrow || 'Biography & Studio Journey',
        heading: journey?.heading || 'The Master’s Journey',
        chapters: next,
      },
    });
    showToast('Added new chapter');
  };

  const removeChapter = (index: number) => {
    const next = chapters.filter((_, i) => i !== index);
    updateSection('aboutArtist', {
      journey: {
        ...journey,
        eyebrow: journey?.eyebrow || 'Biography & Studio Journey',
        heading: journey?.heading || 'The Master’s Journey',
        chapters: next,
      },
    });
    showToast('Removed chapter');
  };

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= chapters.length) return;
    const next = [...chapters];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    updateSection('aboutArtist', {
      journey: {
        ...journey,
        eyebrow: journey?.eyebrow || 'Biography & Studio Journey',
        heading: journey?.heading || 'The Master’s Journey',
        chapters: next,
      },
    });
    showToast('Reordered chapter');
  };

  const portraitSrc = localPreview || aboutArtist?.portraitImage || '/images/image.png';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-studio-gold">
            Art Studio Details
          </h1>
          <p className="text-xs text-[color:var(--ink-muted)]">
            Update the information visitors see about your art studio, artist profile, Master&apos;s Journey story, contact details, and Google search listing
          </p>
        </div>

        {/* View / Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-[color:var(--hairline)] self-start sm:self-auto overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-studio-gold/20 text-studio-gold border border-studio-gold/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Sections
          </button>
          <button
            onClick={() => setActiveTab('artist')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'artist'
                ? 'bg-studio-gold/20 text-studio-gold border border-studio-gold/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Artist Profile
          </button>
          <button
            onClick={() => setActiveTab('journey')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'journey'
                ? 'bg-studio-gold/20 text-studio-gold border border-studio-gold/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Master&apos;s Journey
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'studio'
                ? 'bg-studio-gold/20 text-studio-gold border border-studio-gold/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Brand
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'contact'
                ? 'bg-studio-gold/20 text-studio-gold border border-studio-gold/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Contact &amp; SEO
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-none" />
          <span>{toastMessage}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-none" />
            <span>{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError('')}
            className="text-rose-400 hover:text-rose-200 text-[11px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid container */}
      <div className="space-y-6 text-xs">
        {/* =========================================================================
            SECTION 1: MASTER ARTIST PROFILE & PHOTO (THE MASTER'S JOURNEY STAGE)
           ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'artist') && (
          <div className="admin-panel p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[color:var(--hairline)] pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-studio-gold" />
                <h2 className="font-cinzel font-bold text-sm text-studio-gold uppercase tracking-wider">
                  Master Artist Profile &amp; Photo
                </h2>
              </div>
              <span className="text-[11px] text-[color:var(--ink-muted)]">
                Featured on The Master&apos;s Journey &amp; About Page
              </span>
            </div>

            {/* Photo Upload Zone & Avatar Preview */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-black/30 border border-[color:var(--hairline)] space-y-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                  className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 transition-all ${
                    isDragOver
                      ? 'border-emerald-400 scale-105 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
                      : 'border-studio-gold/80 shadow-[0_0_25px_rgba(212,175,55,0.2)]'
                  } bg-black/50 group cursor-pointer`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click or drag an image here to upload new portrait"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getAdminImageUrl(portraitSrc, undefined, cacheBustTime)}
                    alt={aboutArtist?.portraitAlt || 'Artist Portrait'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />

                  {uploadingPhoto ? (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-studio-gold gap-1">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-[10px] font-semibold">Uploading...</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-studio-gold gap-1 text-[11px] font-medium p-2 text-center">
                      <UploadCloud className="w-5 h-5" />
                      <span>Change Photo</span>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="admin-btn-gold px-4 py-2 text-xs"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        Upload New Photo
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-[color:var(--ink-muted)]">
                    Drag &amp; drop or click to upload (PNG, JPEG, WebP)
                  </p>
                </div>
              </div>

              {/* Identity & Headings */}
              <div className="md:col-span-8 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="admin-label">Artist Full Name</label>
                    <input
                      type="text"
                      value={aboutArtist?.name ?? brand?.founder ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSection('aboutArtist', { name: val });
                        updateBrand({ founder: val });
                        showToast('Artist name updated');
                      }}
                      className="admin-input"
                      placeholder="e.g. Anuradha Govarthanan"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="admin-label">Atelier Title / Eyebrow</label>
                    <input
                      type="text"
                      value={aboutArtist?.title ?? 'Master Watercolorist & Atelier Founder'}
                      onChange={(e) => {
                        updateSection('aboutArtist', { title: e.target.value });
                        showToast('Title updated');
                      }}
                      className="admin-input"
                      placeholder="e.g. Master Watercolorist & Atelier Founder"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="admin-label">Artist Role / Subtitle</label>
                    <input
                      type="text"
                      value={aboutArtist?.role ?? 'Master Artist & Founder'}
                      onChange={(e) => {
                        updateSection('aboutArtist', { role: e.target.value });
                        showToast('Role updated');
                      }}
                      className="admin-input"
                      placeholder="e.g. Master Artist & Founder"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="admin-label">Artist Origin</label>
                    <input
                      type="text"
                      value={aboutArtist?.origin ?? 'Chennai, Tamil Nadu'}
                      onChange={(e) => {
                        updateSection('aboutArtist', { origin: e.target.value });
                        showToast('Origin updated');
                      }}
                      className="admin-input"
                      placeholder="e.g. Chennai, Tamil Nadu"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="admin-label flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5 text-studio-gold" />
                    <span>Personal Mantra / Quote</span>
                  </label>
                  <input
                    type="text"
                    value={aboutArtist?.mantra ?? 'Discovering ourselves through colour and form'}
                    onChange={(e) => {
                      updateSection('aboutArtist', { mantra: e.target.value });
                      showToast('Mantra updated');
                    }}
                    className="admin-input"
                    placeholder="e.g. Discovering ourselves through colour and form"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="admin-label">Artist Headline</label>
                    <input
                      type="text"
                      value={aboutArtist?.headline ?? ''}
                      onChange={(e) => {
                        updateSection('aboutArtist', { headline: e.target.value });
                        showToast('Headline updated');
                      }}
                      className="admin-input"
                      placeholder="e.g. Anuradha Govarthanan — A Professional Artist"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="admin-label">Photo File Path</label>
                    <input
                      type="text"
                      value={aboutArtist?.portraitImage ?? '/images/image.png'}
                      onChange={(e) => {
                        updateSection('aboutArtist', { portraitImage: e.target.value });
                        showToast('Photo path updated');
                      }}
                      className="admin-input text-zinc-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="admin-label">Artist Introduction</label>
                  <textarea
                    rows={2}
                    value={aboutArtist?.subheading ?? ''}
                    onChange={(e) => {
                      updateSection('aboutArtist', { subheading: e.target.value });
                      showToast('Introduction updated');
                    }}
                    className="admin-input resize-none leading-relaxed"
                    placeholder="Brief intro shown on about highlights"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 2: ATELIER METRICS & PEDIGREE (EXPERIENCE & CREDENTIALS)
           ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'artist') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Metrics (Experience / Specialization / Atelier) */}
            <div className="admin-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[color:var(--hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-studio-gold" />
                  <h2 className="font-cinzel font-bold text-sm text-studio-gold uppercase tracking-wider">
                    Atelier Key Metrics
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={addMetric}
                  className="inline-flex items-center gap-1 text-[11px] text-studio-gold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Metric
                </button>
              </div>

              <p className="text-[11px] text-[color:var(--ink-muted)]">
                The stat pills highlighted directly under the artist portrait on the Master&apos;s Journey stage.
              </p>

              <div className="space-y-3">
                {metrics.map((metric, i) => (
                  <div
                    key={`metric-${i}`}
                    className="p-3 rounded-xl bg-black/25 border border-[color:var(--hairline)] flex items-center gap-3"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-[color:var(--ink-muted)] uppercase tracking-wider">
                          Label
                        </span>
                        <input
                          type="text"
                          value={metric.label}
                          onChange={(e) => updateMetric(i, { label: e.target.value })}
                          className="admin-input py-1 text-xs"
                          placeholder="e.g. Experience"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-[color:var(--ink-muted)] uppercase tracking-wider">
                          Value
                        </span>
                        <input
                          type="text"
                          value={metric.value}
                          onChange={(e) => updateMetric(i, { value: e.target.value })}
                          className="admin-input py-1 text-xs font-semibold"
                          placeholder="e.g. 7+ Years of Studio Practice"
                        />
                      </div>
                    </div>
                    {metrics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMetric(i)}
                        className="text-[color:var(--ink-faint)] hover:text-rose-400 p-1.5 transition-colors"
                        title="Remove metric"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Academic & Atelier Pedigree */}
            <div className="admin-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[color:var(--hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-studio-gold" />
                  <h2 className="font-cinzel font-bold text-sm text-studio-gold uppercase tracking-wider">
                    Academic &amp; Atelier Pedigree
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={addEdu}
                  className="inline-flex items-center gap-1 text-[11px] text-studio-gold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Credential
                </button>
              </div>

              <p className="text-[11px] text-[color:var(--ink-muted)]">
                The degrees and institute credentials shown in the pedigree card below the metrics.
              </p>

              <div className="space-y-3">
                {education.map((edu, i) => (
                  <div
                    key={`edu-${i}`}
                    className="p-3 rounded-xl bg-black/25 border border-[color:var(--hairline)] flex items-center gap-3"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[color:var(--ink-muted)] uppercase tracking-wider">
                          Degree / Qualification
                        </span>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEdu(i, { degree: e.target.value })}
                          className="admin-input py-1 text-xs font-semibold"
                          placeholder="e.g. Bachelor of Engineering (B.E.)"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[color:var(--ink-muted)] uppercase tracking-wider">
                          Institution &amp; Location
                        </span>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEdu(i, { institution: e.target.value })}
                          className="admin-input py-1 text-xs"
                          placeholder="e.g. Vellore Institute of Technology (VIT)"
                        />
                      </div>
                    </div>
                    {education.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEdu(i)}
                        className="text-[color:var(--ink-faint)] hover:text-rose-400 p-1.5 transition-colors"
                        title="Remove credential"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3: THE MASTER'S JOURNEY CHAPTERS (STORY TIMELINE)
           ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'journey') && (
          <div className="admin-panel p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[color:var(--hairline)] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-studio-gold" />
                <h2 className="font-cinzel font-bold text-sm text-studio-gold uppercase tracking-wider">
                  The Master&apos;s Journey Chapters
                </h2>
              </div>
              <button
                type="button"
                onClick={addChapter}
                className="admin-btn-gold px-3 py-1.5 text-xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Story Chapter
              </button>
            </div>

            {/* Section Headings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-black/20 border border-[color:var(--hairline)]">
              <div className="space-y-1">
                <label className="admin-label">Timeline Eyebrow</label>
                <input
                  type="text"
                  value={journey?.eyebrow ?? 'Biography & Studio Journey'}
                  onChange={(e) => {
                    updateSection('aboutArtist', {
                      journey: {
                        ...journey,
                        eyebrow: e.target.value,
                        heading: journey?.heading || 'The Master’s Journey',
                        chapters,
                      },
                    });
                    showToast('Timeline eyebrow updated');
                  }}
                  className="admin-input"
                  placeholder="e.g. Biography & Studio Journey"
                />
              </div>

              <div className="space-y-1">
                <label className="admin-label">Timeline Heading</label>
                <input
                  type="text"
                  value={journey?.heading ?? 'The Master’s Journey'}
                  onChange={(e) => {
                    updateSection('aboutArtist', {
                      journey: {
                        ...journey,
                        heading: e.target.value,
                        eyebrow: journey?.eyebrow || 'Biography & Studio Journey',
                        chapters,
                      },
                    });
                    showToast('Timeline heading updated');
                  }}
                  className="admin-input font-cinzel font-bold"
                  placeholder="e.g. The Master’s Journey"
                />
              </div>
            </div>

            {/* Chapters list */}
            <div className="space-y-4">
              {chapters.map((chapter, i) => (
                <div
                  key={`chapter-${chapter.num || i}`}
                  className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-[color:var(--hairline)] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-[color:var(--hairline)] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-cinzel font-bold text-xs px-2.5 py-0.5 rounded-full bg-studio-gold/20 text-studio-gold border border-studio-gold/30">
                        {chapter.num || String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-cinzel text-xs text-amber-200 uppercase tracking-wider font-semibold">
                        {chapter.tag || 'Chapter'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveChapter(i, 'up')}
                        className="p-1 text-zinc-400 hover:text-studio-gold disabled:opacity-20 disabled:hover:text-zinc-400"
                        title="Move Chapter Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={i === chapters.length - 1}
                        onClick={() => moveChapter(i, 'down')}
                        className="p-1 text-zinc-400 hover:text-studio-gold disabled:opacity-20 disabled:hover:text-zinc-400"
                        title="Move Chapter Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChapter(i)}
                          className="p-1 text-zinc-400 hover:text-rose-400 ml-1"
                          title="Delete Chapter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="admin-label">Chapter #</label>
                      <input
                        type="text"
                        value={chapter.num}
                        onChange={(e) => updateChapter(i, { num: e.target.value })}
                        className="admin-input font-editorial text-center font-bold"
                        placeholder="01"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="admin-label">Chapter Kicker / Tag</label>
                      <input
                        type="text"
                        value={chapter.tag}
                        onChange={(e) => updateChapter(i, { tag: e.target.value })}
                        className="admin-input uppercase font-cinzel text-xs text-studio-sunset"
                        placeholder="e.g. THE SPARK"
                      />
                    </div>

                    <div className="sm:col-span-7 space-y-1">
                      <label className="admin-label">Chapter Title</label>
                      <input
                        type="text"
                        value={chapter.title}
                        onChange={(e) => updateChapter(i, { title: e.target.value })}
                        className="admin-input font-editorial font-medium text-sm"
                        placeholder="e.g. The Engineering Mind & Creative Solitude"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="admin-label">Subtitle / Key Milestones</label>
                    <input
                      type="text"
                      value={chapter.subtitle}
                      onChange={(e) => updateChapter(i, { subtitle: e.target.value })}
                      className="admin-input uppercase font-cinzel text-[11px] text-amber-200/90 tracking-wider"
                      placeholder="e.g. CHENNAI ROOTS • VIT ENGINEERING GRADUATE"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="admin-label">Chapter Story / Narrative</label>
                    <textarea
                      rows={3}
                      value={chapter.body}
                      onChange={(e) => updateChapter(i, { body: e.target.value })}
                      className="admin-input leading-relaxed resize-y"
                      placeholder="Narrative describing this chapter of the artist's journey..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 4: STUDIO BRAND & CHANNELS
           ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'studio' || activeTab === 'contact') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 4.1: Studio Brand Information */}
            {(activeTab === 'all' || activeTab === 'studio') && (
              <div className="admin-panel p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-[color:var(--hairline)] pb-3">
                  <FileText className="w-4 h-4 text-studio-gold" />
                  <h2 className="font-cinzel font-bold text-sm text-studio-gold uppercase tracking-wider">
                    Studio Brand &amp; Identity
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="admin-label">Studio Name</label>
                    <input
                      type="text"
                      value={brand?.name || ''}
                      onChange={(e) => {
                        updateBrand({ name: e.target.value });
                        showToast('Studio name updated');
                      }}
                      className="admin-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="admin-label">Studio Tagline</label>
                    <input
                      type="text"
                      value={brand?.tagline || ''}
                      onChange={(e) => {
                        updateBrand({ tagline: e.target.value });
                        showToast('Tagline updated');
                      }}
                      className="admin-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="admin-label">Studio Subtitle</label>
                    <input
                      type="text"
                      value={brand?.subtitle || ''}
                      onChange={(e) => {
                        updateBrand({ subtitle: e.target.value });
                        showToast('Subtitle updated');
                      }}
                      className="admin-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 4.2: Contact Channels & SEO */}
            {(activeTab === 'all' || activeTab === 'contact') && (
              <div className="admin-panel p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-[color:var(--hairline)] pb-3">
                  <Phone className="w-4 h-4 text-studio-gold" />
                  <h2 className="font-cinzel font-bold text-sm text-studio-gold uppercase tracking-wider">
                    Contact Channels &amp; Search
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="admin-label">Primary Contact Phone</label>
                    <input
                      type="text"
                      value={brand?.phoneDisplay || ''}
                      onChange={(e) => {
                        updateBrand({ phoneDisplay: e.target.value });
                        showToast('Phone updated');
                      }}
                      className="admin-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="admin-label">WhatsApp Link / Number</label>
                      <a
                        href={testWaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="text"
                      value={brand?.whatsapp || ''}
                      onChange={(e) => {
                        updateBrand({ whatsapp: e.target.value });
                        showToast('WhatsApp updated');
                      }}
                      placeholder="https://wa.me/919849238464 or +91 98492 38464"
                      className="admin-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="admin-label">Official Email Address</label>
                    <input
                      type="email"
                      value={brand?.email || ''}
                      onChange={(e) => {
                        updateBrand({ email: e.target.value });
                        showToast('Email updated');
                      }}
                      className="admin-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="admin-label">Location Label</label>
                    <input
                      type="text"
                      value={brand?.locationLabel || ''}
                      onChange={(e) => {
                        updateBrand({ locationLabel: e.target.value });
                        showToast('Location updated');
                      }}
                      placeholder="e.g. Hyderabad, Telangana"
                      className="admin-input"
                    />
                  </div>

                  {/* SEO Metadata */}
                  <div className="pt-2 border-t border-[color:var(--hairline)] space-y-2">
                    <h3 className="font-semibold text-studio-gold text-xs flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Google Search Preview
                    </h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={meta?.title || ''}
                        onChange={(e) => updateMeta({ title: e.target.value })}
                        placeholder="Title shown in Google search results"
                        className="w-full px-3 py-1.5 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        value={meta?.description || ''}
                        onChange={(e) => updateMeta({ description: e.target.value })}
                        placeholder="Short description shown in Google search results"
                        className="admin-input resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
