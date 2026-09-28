/**
 * Public content API.
 *
 * Two sources, chosen by `resolveContentSource(VITE_CONTENT_SOURCE, configured)`:
 *   • "static"   (default) — the checked-in src/content/*.ts modules. The live
 *                  site keeps using these directly until migration is verified.
 *   • "supabase" — published-only content from the `get_public_content()` RPC,
 *                  normalized + ordered, falling back to static on any error so
 *                  the site never renders blank.
 *
 * The `to*` adapters convert the Supabase payload into the SAME shapes the
 * static modules export, so cutting a component over is an import swap — no
 * markup, styling or animation changes.
 */
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type {
  PublicContentPayload,
  PortfolioCategory,
  HeroColumnId,
} from '../lib/types';
import {
  normalizePublicContent,
  resolveContentSource,
  hasUsableContent,
  type NormalizedContent,
} from './mapping';

// Static modules (fallback + default source).
import {
  getPublishedProjects as staticProjects,
  type PortfolioProject,
} from '../content/portfolio';
import { heroWall as staticHeroWall, images as staticImages } from '../content/images';
import {
  shootCategories as staticCategories,
  packages as staticPackages,
  links as staticLinks,
  support as staticSupport,
  type Package,
  type ShootCategory,
} from '../content/site';

export type ContentSource = 'static' | 'supabase';

/** Which source the public site should use, given env + configuration. */
export function getContentSource(): ContentSource {
  return resolveContentSource(import.meta.env.VITE_CONTENT_SOURCE, isSupabaseConfigured);
}

/** Fetch + normalize the published-only payload from Supabase. */
export async function fetchPublicContent(): Promise<NormalizedContent> {
  const { data, error } = await getSupabase().rpc('get_public_content');
  if (error) throw new Error(error.message);
  return normalizePublicContent(data as PublicContentPayload);
}

// ——— Adapters: Supabase payload → existing site shapes ————————————————

export function toPortfolioProjects(content: NormalizedContent): PortfolioProject[] {
  return content.projects.map((project, index) => {
    const gallery = project.gallery.map((g) => ({ src: g.src, alt: g.alt }));
    const cover = project.cover
      ? {
          src: project.cover.src,
          alt: project.cover.alt,
          ...(project.cover.thumbPosition ? { thumbPosition: project.cover.thumbPosition } : {}),
        }
      : gallery[0];
    return {
      slug: project.slug,
      title: project.title,
      category: project.category as PortfolioCategory,
      cover,
      gallery,
      order: project.order ?? index + 1,
      published: true,
    } as PortfolioProject;
  });
}

export type ResolvedHeroColumn = {
  id: HeroColumnId;
  duration: number;
  offset: number;
  images: { src: string; alt: string; objectPosition: string; objectPositionMobile?: string }[];
};

export function toHeroWall(content: NormalizedContent): ResolvedHeroColumn[] {
  return content.hero.map((column) => ({
    id: column.id as HeroColumnId,
    duration: column.duration,
    offset: column.offset,
    images: column.images.map((image) => ({
      src: image.src,
      alt: image.alt,
      objectPosition: image.objectPosition ?? '50% 50%',
      ...(image.objectPositionMobile ? { objectPositionMobile: image.objectPositionMobile } : {}),
    })),
  }));
}

export function toShootCategories(content: NormalizedContent): ShootCategory[] {
  return content.categories.map((category) => ({
    slug: category.slug,
    title: category.title,
    blurb: category.blurb,
    // Categories reference an image by src here; the static module used an id.
    imageId: category.imageSrc ?? '',
  })) as ShootCategory[];
}

export function toPackages(content: NormalizedContent): Package[] {
  return content.packages.map((pkg) => ({
    id: pkg.id,
    categorySlug: pkg.categorySlug,
    name: pkg.name,
    description: pkg.description,
    imageId: pkg.imageSrc ?? '',
    ...(pkg.duration ? { duration: pkg.duration } : {}),
    ...(pkg.retouchedPhotos ? { retouchedPhotos: pkg.retouchedPhotos } : {}),
    ...(pkg.outfits ? { outfits: pkg.outfits } : {}),
    ...(pkg.price ? { price: pkg.price } : {}),
    confirmed: true, // only published packages reach the public payload
  })) as Package[];
}

export type ResolvedSettings = {
  instagram: string;
  behance: string;
  whatsapp: string;
  whatsappCatalog: string;
  mapsUrl: string;
};

export function toSettings(content: NormalizedContent): ResolvedSettings {
  return {
    instagram: content.settings.instagramUrl,
    behance: content.settings.behanceUrl,
    whatsapp: content.settings.whatsappUrl,
    whatsappCatalog: content.settings.whatsappCatalogUrl,
    mapsUrl: content.settings.mapsUrl, // '' ⇒ support widget renders "Link pending"
  };
}

/**
 * Load the full public content set from the active source. On any Supabase
 * error (or unusable payload) it falls back to the static modules so the site
 * always renders. `source` reports which one actually won.
 */
export async function loadPublicSiteContent(): Promise<{
  source: ContentSource;
  projects: PortfolioProject[];
  hero: ResolvedHeroColumn[];
  categories: ShootCategory[];
  packages: Package[];
  settings: ResolvedSettings;
}> {
  const requested = getContentSource();

  if (requested === 'supabase') {
    try {
      const content = await fetchPublicContent();
      if (hasUsableContent(content)) {
        return {
          source: 'supabase',
          projects: toPortfolioProjects(content),
          hero: toHeroWall(content),
          categories: toShootCategories(content),
          packages: toPackages(content),
          settings: toSettings(content),
        };
      }
    } catch (error) {
      console.warn('[content] Supabase read failed; falling back to static content.', error);
    }
  }

  // Static fallback / default — mirrors the current checked-in content exactly.
  return {
    source: 'static',
    projects: staticProjects(),
    hero: staticHeroWall.map((column) => ({
      id: column.id,
      duration: column.duration,
      offset: column.offset,
      images: column.imageIds.map((id) => {
        const asset = staticImages[id];
        return {
          src: asset.src,
          alt: asset.alt,
          objectPosition: asset.objectPosition,
          ...(asset.objectPositionMobile ? { objectPositionMobile: asset.objectPositionMobile } : {}),
        };
      }),
    })),
    categories: staticCategories,
    packages: staticPackages,
    settings: {
      instagram: staticLinks.instagram,
      behance: staticLinks.behance,
      whatsapp: staticLinks.whatsapp,
      whatsappCatalog: staticSupport.catalogUrl,
      mapsUrl: staticSupport.mapsUrl,
    },
  };
}
