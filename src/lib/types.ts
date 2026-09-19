export type GalleryKey =
  | 'featured'
  | 'sale'
  | 'commission'
  | 'classes'
  | 'watercolor'
  | 'workshop'
  | 'testimonial'
  | 'achievement';

export type ArtworkStatus = 'Available' | 'Reserved' | 'Sold';

export interface Artwork {
  id: string;
  src: string;
  title: string;
  category?: string;
  aspect?: string;
  price?: number | string;
  /**
   * ISO timestamp proving an admin explicitly saved this price. Until it is
   * set, the public website masks the price (XXXX + contact-the-studio note).
   */
  priceConfirmedAt?: string;
  description?: string;
  medium?: string;
  dimensions?: string;
  /** Acquisition status — only meaningful for sellable collections. */
  status?: ArtworkStatus;
  dateAdded?: string;
  featured?: boolean;
}

/**
 * The catalog map: what each gallery *is*, and what data it needs.
 * `sellable` galleries are commercial (price + availability apply);
 * the rest are showcase/curation — price/status never fabricated there.
 */
export interface GalleryCatalogEntry {
  key: GalleryKey;
  label: string;
  purpose: string;
  sellable: boolean;
  suggestedForUploads: boolean;
  defaultCategory: string;
  filenameHints: string[];
  chatbotNote: string;
}

export const GALLERY_CATALOG: GalleryCatalogEntry[] = [
  {
    key: 'sale',
    label: 'Art for Sale',
    purpose: 'Paintings visitors can buy — shown on the Sale page with prices.',
    sellable: true,
    suggestedForUploads: true,
    defaultCategory: 'Paintings for Sale',
    filenameHints: ['sale', 'p1', 'p2', 'p3', 'buy', 'shop'],
    chatbotNote: 'Live purchase catalog with prices and availability.',
  },
  {
    key: 'featured',
    label: 'Featured Portfolio',
    purpose: 'Masterpieces spotlighted on the home page carousel.',
    sellable: false,
    suggestedForUploads: false,
    defaultCategory: 'Featured Collection',
    filenameHints: ['featured', 'g1', 'g2', 'hero', 'portfolio'],
    chatbotNote: 'Home-page showcase — pieces the studio is proud of.',
  },
  {
    key: 'commission',
    label: 'Commissioned Works',
    purpose: 'Custom portraits & murals already delivered — sold but showcased.',
    sellable: false,
    suggestedForUploads: false,
    defaultCategory: 'Custom Commission',
    filenameHints: ['commission', 'c1', 'custom', 'portrait', 'mural'],
    chatbotNote: 'Custom work already delivered — visitors can order similar.',
  },
  {
    key: 'classes',
    label: 'Classes & Courses',
    purpose: 'Student artworks and teaching milestones — not for sale.',
    sellable: false,
    suggestedForUploads: false,
    defaultCategory: 'Student Work',
    filenameHints: ['class', 'student', 'cl0', 'academy', 'diploma'],
    chatbotNote: 'Teaching results — visitors can join the classes.',
  },
  {
    key: 'watercolor',
    label: 'Watercolor Courses',
    purpose: 'Masterclass and watercolor course samples — not for sale.',
    sellable: false,
    suggestedForUploads: false,
    defaultCategory: 'Watercolor Study',
    filenameHints: ['watercolor', 'wt1', 'wt', 'masterclass'],
    chatbotNote: 'Watercolor course showcase — visitors can enroll.',
  },
  {
    key: 'workshop',
    label: 'Workshops & Exhibitions',
    purpose: 'Corporate workshops, plein-air camps and exhibition photos.',
    sellable: false,
    suggestedForUploads: false,
    defaultCategory: 'Exhibition',
    filenameHints: ['workshop', 'w1', 'exhibition', 'camp', 'event'],
    chatbotNote: 'Workshop & exhibition gallery — visitors can book sessions.',
  },
  {
    key: 'testimonial',
    label: 'Testimonials & Reviews',
    purpose: 'Student success stories and appreciation letters.',
    sellable: false,
    suggestedForUploads: false,
    defaultCategory: 'Student Work',
    filenameHints: ['testimonial', 't1', 'review', 'letter'],
    chatbotNote: 'Social proof — stories from students and collectors.',
  },
  {
    key: 'achievement',
    label: 'Achievements & Awards',
    purpose: 'Awards, foundation recognitions and press mentions.',
    sellable: false,
    suggestedForUploads: false,
    defaultCategory: 'Award Highlight',
    filenameHints: ['achieve', 'a1', 'award', 'press'],
    chatbotNote: 'Studio recognition — awards and honors.',
  },
];

export function galleryCatalogEntry(key: GalleryKey): GalleryCatalogEntry {
  return (
    GALLERY_CATALOG.find((g) => g.key === key) ?? GALLERY_CATALOG[0]
  );
}

/**
 * Guess the destination gallery from an artwork filename.
 * Longest keyword match wins ("watercolor-masterclass-3" → watercolor).
 */
export function suggestGalleryFromFilename(filename: string): GalleryKey | null {
  const name = filename.toLowerCase();
  let best: { key: GalleryKey; len: number } | null = null;
  for (const entry of GALLERY_CATALOG) {
    for (const hint of entry.filenameHints) {
      if (name.includes(hint) && (!best || hint.length > best.len)) {
        best = { key: entry.key, len: hint.length };
      }
    }
  }
  return best?.key ?? null;
}

export interface GalleryMeta {
  key: GalleryKey;
  label: string;
  description: string;
  defaultCategory: string;
  iconName: string;
  accentColor: string;
}

export interface SocialLink {
  network: string;
  url: string;
  color?: string;
}

export interface SiteBrand {
  name: string;
  tagline: string;
  subtitle: string;
  founder: string;
  phoneDisplay: string;
  phoneRaw: string;
  whatsapp: string;
  email: string;
  locationLabel: string;
}

export interface SiteMeta {
  title: string;
  description: string;
  favicon: string;
}

export interface SiteSections {
  banner: {
    title: string;
    subtitle: string;
    quote: string;
    badge: string;
    bgImage: string;
    logo: string;
  };
  aboutArtist: {
    portraitImage: string;
    portraitAlt: string;
    headline: string;
    subheading: string;
  };
  courses: {
    title: string;
    subtitle: string;
  };
}

export type SiteGalleries = Record<GalleryKey, Artwork[]>;

export interface StudioEvent {
  id: string;
  title: string;
  date: string;
  dateIso?: string;
  location?: string;
  description?: string;
  registrationUrl?: string;
  registrationDeadline?: string;
  eventType?: string;
  seatsRemaining?: number;
  image?: string;
  images?: string[];
  outcome?: string;
}

export interface StudioEvents {
  upcoming: StudioEvent[];
  past: StudioEvent[];
}

export interface ChatbotFaq {
  question: string;
  answer: string;
}

export interface ChatbotConfig {
  enabled: boolean;
  welcomeMessage: string;
  suggestedPrompts: string[];
  faqs: ChatbotFaq[];
}

export interface SiteContent {
  meta: SiteMeta;
  brand: SiteBrand;
  social: SocialLink[];
  galleries: SiteGalleries;
  sections: SiteSections;
  events?: StudioEvents;
  chatbot?: ChatbotConfig;
  lastUpdated?: string;
}

export interface GitHubCommitResult {
  sha: string;
  htmlUrl: string;
  commitUrl: string;
  repos?: string[];
}

export interface StagedImage {
  id: string;
  name: string;
  previewUrl: string;
  base64Data: string;
  targetGallery: GalleryKey;
  title: string;
  category: string;
  description: string;
  price: string;
  medium: string;
  dimensions: string;
  status?: ArtworkStatus;
  sizeBytes: number;
}
