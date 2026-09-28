/**
 * Public content API — the Supabase-backed path.
 *
 * Two sources, chosen by `resolveContentSource(VITE_CONTENT_SOURCE, configured)`:
 *   • "static"   (default) — the checked-in src/content/*.ts modules, resolved by
 *                  `buildStaticContent()` (see staticContent.ts). The live site
 *                  keeps using these until the migration is verified.
 *   • "supabase" — published-only content from the `get_public_content()` RPC,
 *                  normalized + ordered, falling back to static on any error so
 *                  the site never renders blank.
 *
 * The `to*` adapters convert the Supabase payload into the SAME resolved shapes
 * the static builder produces, so a component reads one shape either way.
 *
 * This module statically imports the Supabase client, so the public site loads it
 * lazily (dynamic `import()`) only when the supabase source is active — keeping
 * `@supabase/supabase-js` out of the default public bundle.
 */
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { PublicContentPayload, PortfolioCategory } from '../lib/types';
import type { PortfolioProject } from '../content/portfolio';
import {
  normalizePublicContent,
  resolveContentSource,
  hasUsableContent,
  type NormalizedContent,
} from './mapping';
import {
  buildStaticContent,
  type ResolvedHeroColumn,
  type ResolvedService,
  type ResolvedPackage,
  type ResolvedSettings,
  type StaticSiteContent,
} from './staticContent';

export type { ResolvedHeroColumn, ResolvedService, ResolvedPackage, ResolvedSettings };

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

// ——— Adapters: Supabase payload → resolved site shapes ————————————————

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

export function toHeroWall(content: NormalizedContent): ResolvedHeroColumn[] {
  return content.hero.map((column) => ({
    id: column.id as ResolvedHeroColumn['id'],
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

export function toServices(content: NormalizedContent): ResolvedService[] {
  return content.services
    .filter((service) => !!service.imageSrc) // a tile without a photograph cannot render
    .map((service) => ({
      slug: service.slug,
      title: service.name,
      blurb: service.shortDescription,
      src: service.imageSrc as string,
      alt: service.imageAlt ?? '',
      ...(service.imageObjectPosition ? { objectPosition: service.imageObjectPosition } : {}),
    }));
}

export function toPackages(content: NormalizedContent): ResolvedPackage[] {
  return content.packages.map((pkg) => ({
    id: pkg.id,
    categorySlug: pkg.categorySlug,
    name: pkg.name,
    description: pkg.description,
    src: pkg.imageSrc,
    alt: pkg.imageAlt,
    ...(pkg.imageObjectPosition ? { objectPosition: pkg.imageObjectPosition } : {}),
    ...(pkg.duration ? { duration: pkg.duration } : {}),
    ...(pkg.retouchedPhotos ? { retouchedPhotos: pkg.retouchedPhotos } : {}),
    ...(pkg.outfits ? { outfits: pkg.outfits } : {}),
    ...(pkg.price ? { price: pkg.price } : {}),
  }));
}

export function toSettings(content: NormalizedContent): ResolvedSettings {
  return {
    instagram: content.settings.instagramUrl,
    behance: content.settings.behanceUrl,
    whatsapp: content.settings.whatsappUrl,
    whatsappCatalog: content.settings.whatsappCatalogUrl,
    mapsUrl: content.settings.mapsUrl, // '' ⇒ support widget renders "Link pending"
    studioLocation: content.settings.studioLocation,
    contactEmail: content.settings.contactEmail,
    contactPhone: content.settings.contactPhone,
    footerTagline: content.settings.footerTagline,
    footerStudioNote: content.settings.footerStudioNote,
    footerCopyright: content.settings.footerCopyright,
  };
}

/** The resolved public content set plus which source actually produced it. */
export type PublicSiteContent = StaticSiteContent & { source: ContentSource };

/**
 * Load the full public content set from the active source. On any Supabase
 * error (or unusable payload) it falls back to the static modules so the site
 * always renders. `source` reports which one actually won.
 */
export async function loadPublicSiteContent(): Promise<PublicSiteContent> {
  const requested = getContentSource();

  if (requested === 'supabase') {
    try {
      const content = await fetchPublicContent();
      if (hasUsableContent(content)) {
        return {
          source: 'supabase',
          projects: toPortfolioProjects(content),
          hero: toHeroWall(content),
          services: toServices(content),
          packages: toPackages(content),
          settings: toSettings(content),
        };
      }
    } catch (error) {
      console.warn('[content] Supabase read failed; falling back to static content.', error);
    }
  }

  // Static fallback / default — mirrors the current checked-in content exactly.
  return { source: 'static', ...buildStaticContent() };
}
