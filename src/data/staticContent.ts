/**
 * Static content resolution — the checked-in src/content modules turned into the
 * SAME resolved shapes the public components render, with every image already
 * reduced to a `src` string.
 *
 * This module is deliberately dependency-free of Supabase: it imports only the
 * static content modules and type-only helpers, so it can be bundled with the
 * public site (and unit-tested) without pulling in `@supabase/supabase-js`.
 * The Supabase-backed path lives in contentApi.ts and is loaded lazily.
 */
import { getPublishedProjects, type PortfolioProject } from '../content/portfolio';
import { heroWall, images } from '../content/images';
import {
  shootCategories,
  packages as staticPackageList,
  links,
  support,
  brand,
  footer,
} from '../content/site';
import type { HeroColumnId } from '../lib/types';

/** One drifting hero column with its images resolved to srcs. */
export type ResolvedHeroColumn = {
  id: HeroColumnId;
  duration: number;
  offset: number;
  images: { src: string; alt: string; objectPosition: string; objectPositionMobile?: string }[];
};

/** A service tile ("What We Shoot") with its photograph resolved to a src. */
export interface ResolvedService {
  slug: string;
  title: string;
  blurb: string;
  src: string;
  alt: string;
  objectPosition?: string;
}

/** A confirmed, published package with its photograph resolved to a src. */
export interface ResolvedPackage {
  id: string;
  categorySlug: string;
  name: string;
  description: string;
  src: string | null;
  alt: string | null;
  objectPosition?: string;
  duration?: string;
  retouchedPhotos?: string;
  outfits?: string;
  price?: string;
}

/** Public contact / social links resolved from settings (or the static defaults). */
export type ResolvedSettings = {
  instagram: string;
  behance: string;
  whatsapp: string;
  whatsappCatalog: string;
  mapsUrl: string;
  studioLocation: string;
  contactEmail: string;
  contactPhone: string;
  footerTagline: string;
  footerStudioNote: string;
  footerCopyright: string;
};

export interface StaticSiteContent {
  projects: PortfolioProject[];
  hero: ResolvedHeroColumn[];
  services: ResolvedService[];
  packages: ResolvedPackage[];
  settings: ResolvedSettings;
}

/** Build the full resolved content set from the checked-in static modules. */
export function buildStaticContent(): StaticSiteContent {
  return {
    projects: getPublishedProjects(),
    hero: heroWall.map((column) => ({
      id: column.id,
      duration: column.duration,
      offset: column.offset,
      images: column.imageIds.map((id) => {
        const asset = images[id];
        return {
          src: asset.src,
          alt: asset.alt,
          objectPosition: asset.objectPosition,
          ...(asset.objectPositionMobile ? { objectPositionMobile: asset.objectPositionMobile } : {}),
        };
      }),
    })),
    services: shootCategories.map((category) => {
      const asset = images[category.imageId];
      return {
        slug: category.slug,
        title: category.title,
        blurb: category.blurb,
        src: asset.src,
        alt: asset.alt,
        ...(asset.objectPosition ? { objectPosition: asset.objectPosition } : {}),
      };
    }),
    packages: staticPackageList.map((pkg) => {
      const asset = images[pkg.imageId];
      return {
        id: pkg.id,
        categorySlug: pkg.categorySlug,
        name: pkg.name,
        description: pkg.description,
        src: asset?.src ?? null,
        alt: asset?.alt ?? null,
        ...(asset?.objectPosition ? { objectPosition: asset.objectPosition } : {}),
        ...(pkg.duration ? { duration: pkg.duration } : {}),
        ...(pkg.retouchedPhotos ? { retouchedPhotos: pkg.retouchedPhotos } : {}),
        ...(pkg.outfits ? { outfits: pkg.outfits } : {}),
        ...(pkg.price ? { price: pkg.price } : {}),
      };
    }),
    settings: {
      instagram: links.instagram,
      behance: links.behance,
      whatsapp: links.whatsapp,
      whatsappCatalog: support.catalogUrl,
      mapsUrl: support.mapsUrl,
      studioLocation: brand.location,
      // No public contact email/phone exists in the checked-in content yet —
      // the footer hides empty contact fields until the studio supplies them.
      contactEmail: '',
      contactPhone: '',
      footerTagline: footer.tagline,
      footerStudioNote: footer.studioNote,
      footerCopyright: footer.copyright,
    },
  };
}
