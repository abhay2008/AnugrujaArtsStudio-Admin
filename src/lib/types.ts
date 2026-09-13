export type GalleryKey =
  | 'featured'
  | 'sale'
  | 'commission'
  | 'classes'
  | 'watercolor'
  | 'workshop'
  | 'testimonial'
  | 'achievement';

export interface Artwork {
  id: string;
  src: string;
  title: string;
  category?: string;
  aspect?: string;
  price?: number | string;
  description?: string;
  medium?: string;
  dimensions?: string;
  status?: 'available' | 'sold' | 'reserved';
  dateAdded?: string;
  featured?: boolean;
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

export interface SiteContent {
  meta: SiteMeta;
  brand: SiteBrand;
  social: SocialLink[];
  galleries: SiteGalleries;
  sections: SiteSections;
  lastUpdated?: string;
}

export interface Inquiry {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  interest: 'Commission' | 'Art Purchase' | 'Classes' | 'Workshop' | 'General';
  artworkTitle?: string;
  budget?: string;
  quotedPrice?: string;
  status: 'New' | 'In Discussion' | 'Quoted' | 'Completed' | 'Archived';
  date: string;
  notes?: string;
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
  price: string;
  medium: string;
  dimensions: string;
  sizeBytes: number;
}
