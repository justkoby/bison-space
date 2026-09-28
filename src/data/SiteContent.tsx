/**
 * SiteContent provider — one place that decides where public content comes from.
 *
 * It renders the checked-in static content synchronously (so there is never a
 * blank/flash on first paint), and — only when `VITE_CONTENT_SOURCE=supabase`
 * AND the project is configured — lazily `import()`s the Supabase-backed
 * contentApi to swap in published-only remote content. Any remote failure keeps
 * the static content on screen (the site never renders blank).
 *
 * The dynamic import keeps `@supabase/supabase-js` out of the default public
 * bundle: the static modules and this provider have no Supabase dependency.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { resolveContentSource } from './mapping';
import { buildStaticContent } from './staticContent';
import type {
  ResolvedHeroColumn,
  ResolvedService,
  ResolvedPackage,
  ResolvedSettings,
} from './staticContent';
import type { PortfolioProject } from '../content/portfolio';

export type ContentSource = 'static' | 'supabase';
/** static = never attempted · loading = fetching remote · ready = remote applied · error = kept static. */
export type ContentStatus = 'static' | 'loading' | 'ready' | 'error';

export interface SiteContentValue {
  source: ContentSource;
  status: ContentStatus;
  projects: PortfolioProject[];
  hero: ResolvedHeroColumn[];
  services: ResolvedService[];
  packages: ResolvedPackage[];
  settings: ResolvedSettings;
}

const STATIC_CONTENT = buildStaticContent();

const INITIAL_VALUE: SiteContentValue = {
  source: 'static',
  status: 'static',
  ...STATIC_CONTENT,
};

const SiteContentContext = createContext<SiteContentValue>(INITIAL_VALUE);

/** True when both the project URL and anon key are present (no Supabase import). */
function supabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<SiteContentValue>(INITIAL_VALUE);

  useEffect(() => {
    if (resolveContentSource(import.meta.env.VITE_CONTENT_SOURCE, supabaseConfigured()) !== 'supabase') {
      return; // Static default: nothing to fetch, first paint already correct.
    }
    let cancelled = false;
    setValue((current) => ({ ...current, status: 'loading' }));
    import('./contentApi')
      .then((api) => api.loadPublicSiteContent())
      .then((loaded) => {
        if (cancelled) return;
        setValue({
          source: loaded.source,
          // A fallback to static still counts as settled — the site has content.
          status: loaded.source === 'supabase' ? 'ready' : 'error',
          projects: loaded.projects,
          hero: loaded.hero,
          services: loaded.services,
          packages: loaded.packages,
          settings: loaded.settings,
        });
      })
      .catch((error) => {
        console.warn('[content] remote load failed; keeping static content.', error);
        if (!cancelled) setValue((current) => ({ ...current, status: 'error' }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

/** Read the active public content (static or Supabase) from anywhere in the site. */
export function useSiteContent(): SiteContentValue {
  return useContext(SiteContentContext);
}
