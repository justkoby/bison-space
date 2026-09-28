/**
 * Row + payload types for the Bison's Space content tables.
 * Hand-written to match supabase/migrations/*; regenerate with
 * `supabase gen types typescript` if the schema evolves.
 */

export type PortfolioCategory = 'portraits' | 'beauty-fashion' | 'events' | 'brand-stories';
export type PublishStatus = 'draft' | 'published';
export type HeroColumnId = 'left' | 'center' | 'right';

export const CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  portraits: 'Portraits',
  'beauty-fashion': 'Beauty & Fashion',
  events: 'Events',
  'brand-stories': 'Brand Stories',
};

export const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as PortfolioCategory[];

// ——— Database rows ————————————————————————————————————————————
export interface ImageRow {
  id: string;
  src: string;
  storage_path: string | null;
  alt: string;
  object_position: string;
  object_position_mobile: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  category: PortfolioCategory;
  status: PublishStatus;
  display_order: number;
  cover_image_id: string | null;
  cover_alt: string;
  cover_thumb_position: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryRow {
  id: string;
  project_id: string;
  image_id: string;
  alt: string;
  position: number;
}

export interface HeroColumnRow {
  id: HeroColumnId;
  duration: number;
  offset: number;
  display_order: number;
}

export interface HeroImageRow {
  id: string;
  column_id: HeroColumnId;
  image_id: string;
  alt: string;
  object_position: string | null;
  object_position_mobile: string | null;
  position: number;
  published: boolean;
}

export interface ServiceCategoryRow {
  slug: string;
  title: string;
  blurb: string;
  image_id: string | null;
  display_order: number;
  published: boolean;
}

export interface PackageRow {
  id: string;
  category_slug: string;
  name: string;
  description: string;
  image_id: string | null;
  duration: string | null;
  retouched_photos: string | null;
  outfits: string | null;
  price: string | null;
  display_order: number;
  status: PublishStatus;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingsRow {
  id: number;
  instagram_url: string;
  behance_url: string;
  whatsapp_url: string;
  whatsapp_catalog_url: string;
  maps_url: string;
  updated_at: string;
}

// ——— Shape returned by the public.get_public_content() RPC ————————————
export interface PublicContentImage {
  src: string;
  alt: string;
  objectPosition?: string;
  objectPositionMobile?: string | null;
}

export interface PublicContentPayload {
  settings: {
    instagramUrl: string;
    behanceUrl: string;
    whatsappUrl: string;
    whatsappCatalogUrl: string;
    mapsUrl: string;
  };
  hero: {
    id: HeroColumnId;
    duration: number;
    offset: number;
    images: PublicContentImage[];
  }[];
  categories: {
    slug: string;
    title: string;
    blurb: string;
    imageSrc: string | null;
    imageAlt: string | null;
    imageObjectPosition: string | null;
  }[];
  packages: {
    id: string;
    categorySlug: string;
    name: string;
    description: string;
    duration: string | null;
    retouchedPhotos: string | null;
    outfits: string | null;
    price: string | null;
    order: number;
    imageSrc: string | null;
    imageAlt: string | null;
    imageObjectPosition: string | null;
  }[];
  projects: {
    slug: string;
    title: string;
    category: PortfolioCategory;
    order: number;
    cover: { src: string; alt: string; thumbPosition: string | null } | null;
    gallery: { src: string; alt: string }[];
  }[];
}

// ——— Admin-side joined view models ————————————————————————————
export interface GalleryItem {
  id?: string;
  imageId: string;
  src: string;
  alt: string;
  position: number;
}

export interface ProjectEditorModel {
  id?: string;
  slug: string;
  title: string;
  category: PortfolioCategory;
  status: PublishStatus;
  displayOrder: number;
  coverImageId: string | null;
  coverSrc: string | null;
  coverAlt: string;
  coverThumbPosition: string | null;
  gallery: GalleryItem[];
}
