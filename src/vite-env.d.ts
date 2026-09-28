/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL (safe to expose). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon/public key (safe to expose; RLS still applies). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Public-site content source: "static" (default) or "supabase". */
  readonly VITE_CONTENT_SOURCE?: 'static' | 'supabase';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
