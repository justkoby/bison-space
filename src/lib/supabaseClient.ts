import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client — anon key only.
 *
 * The anon key is safe to expose because Row Level Security enforces every
 * rule: public visitors can read published content, and only allowlisted
 * admins (see the `admin_users` table + `is_admin()` policy) can write.
 *
 * ⚠️ The service-role key is NEVER imported here or anywhere in `src/`.
 *    It lives only in server-side scripts (see .env.example).
 *
 * This module is imported only by the (lazy-loaded) admin app and the optional
 * Supabase content path, so `@supabase/supabase-js` stays out of the public
 * bundle while the site runs on the static content modules.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when both the project URL and anon key are present. */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Lazily create the shared browser client; throws if not configured. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
        '(see .env.example) before using the content dashboard.',
    );
  }
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}
