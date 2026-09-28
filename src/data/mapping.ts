/**
 * Pure content-mapping helpers — intentionally dependency-free (no imports) so
 * they can be unit-tested directly with `node --experimental-strip-types`
 * (see scripts/verify-content-layer.ts) without a database.
 *
 * These guarantee the two public-read invariants regardless of what the RPC or
 * a query returns: PUBLISHED-ONLY and STABLE ORDERING.
 */

export type ContentSource = 'static' | 'supabase';

/** The public site reads Supabase only when explicitly flagged AND configured. */
export function resolveContentSource(
  flag: string | undefined,
  supabaseConfigured: boolean,
): ContentSource {
  return flag === 'supabase' && supabaseConfigured ? 'supabase' : 'static';
}

/** Sort a copy of `rows` ascending by a numeric key (stable for equal keys). */
export function sortOrdered<T>(rows: readonly T[], key: (row: T) => number): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => key(a.row) - key(b.row) || a.index - b.index)
    .map((entry) => entry.row);
}

/** Keep only rows the predicate marks published/visible. */
export function onlyPublished<T>(rows: readonly T[], isPublished: (row: T) => boolean): T[] {
  return rows.filter(isPublished);
}

// ——— Minimal structural view of the RPC payload (self-contained) ————————————
interface PayloadProject {
  slug: string;
  title: string;
  category: string;
  order: number;
  cover: { src: string; alt: string; thumbPosition: string | null } | null;
  gallery: { src: string; alt: string }[];
}
interface PayloadHeroColumn {
  id: string;
  duration: number;
  offset: number;
  images: { src: string; alt: string; objectPosition?: string; objectPositionMobile?: string | null }[];
}
interface PayloadCategory {
  slug: string;
  title: string;
  blurb: string;
  imageSrc: string | null;
  imageAlt: string | null;
  imageObjectPosition: string | null;
}
interface PayloadPackage {
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
}
interface PayloadSettings {
  instagramUrl?: string;
  behanceUrl?: string;
  whatsappUrl?: string;
  whatsappCatalogUrl?: string;
  mapsUrl?: string;
}
export interface RawPublicContent {
  settings?: PayloadSettings | null;
  hero?: PayloadHeroColumn[] | null;
  categories?: PayloadCategory[] | null;
  packages?: PayloadPackage[] | null;
  projects?: PayloadProject[] | null;
}

export interface NormalizedSettings {
  instagramUrl: string;
  behanceUrl: string;
  whatsappUrl: string;
  whatsappCatalogUrl: string;
  mapsUrl: string;
}

export interface NormalizedContent {
  settings: NormalizedSettings;
  hero: PayloadHeroColumn[];
  categories: PayloadCategory[];
  packages: PayloadPackage[];
  projects: PayloadProject[];
}

/** Coerce any settings object into a full, string-only settings record. */
export function normalizeSettings(settings: PayloadSettings | null | undefined): NormalizedSettings {
  return {
    instagramUrl: settings?.instagramUrl ?? '',
    behanceUrl: settings?.behanceUrl ?? '',
    whatsappUrl: settings?.whatsappUrl ?? '',
    whatsappCatalogUrl: settings?.whatsappCatalogUrl ?? '',
    // Never invent a Maps URL — an absent value stays empty (renders pending).
    mapsUrl: settings?.mapsUrl ?? '',
  };
}

/**
 * Defensive normalization of the public payload: drop malformed rows, order
 * projects/packages by `order`, keep gallery/hero-image order as returned
 * (already ordered by position in SQL), and fill settings defaults.
 */
export function normalizePublicContent(payload: RawPublicContent | null | undefined): NormalizedContent {
  const projects = sortOrdered(
    (payload?.projects ?? []).filter(
      (p): p is PayloadProject =>
        !!p && typeof p.slug === 'string' && p.slug.length > 0 && Array.isArray(p.gallery),
    ),
    (p) => Number(p.order ?? 0),
  ).map((p) => ({
    ...p,
    gallery: p.gallery.filter((g) => !!g && typeof g.src === 'string' && g.src.length > 0),
  }));

  const packages = sortOrdered(payload?.packages ?? [], (p) => Number(p.order ?? 0));
  const hero = (payload?.hero ?? []).map((column) => ({ ...column, images: column.images ?? [] }));

  return {
    settings: normalizeSettings(payload?.settings),
    hero,
    categories: payload?.categories ?? [],
    packages,
    projects,
  };
}

/** True when the normalized payload has enough content to render the site. */
export function hasUsableContent(content: NormalizedContent): boolean {
  return content.projects.length > 0 || content.hero.some((c) => c.images.length > 0);
}
