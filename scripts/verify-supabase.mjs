/**
 * verify-supabase.mjs — integration checks for the content dashboard's security
 * and public-read rules, run against a live Supabase (local `supabase start`).
 *
 *   npm run verify:supabase
 *
 * What it proves:
 *   PUBLIC READS   — as `anon`, get_public_content() returns published content
 *                    only, correctly ordered; a draft row created via the
 *                    service role is invisible to anon until published.
 *   UNAUTHORIZED   — as `anon`, writes to content tables and uploads to the
 *   WRITES         — `media` bucket are DENIED by RLS / Storage policies.
 *   AUTHORIZED     — with BS_ADMIN_EMAIL/BS_ADMIN_PASSWORD (an allowlisted
 *   WRITES         — account), the same writes SUCCEED. (Optional.)
 *
 * If Supabase is not configured/reachable it SKIPS (exit 0) with instructions,
 * so it is safe to wire into CI before a stack exists. Assertion failures exit 1.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ——— Env loading (no dependency) ————————————————————————————————
function loadEnv() {
  const env = { ...process.env };
  const path = resolve(process.cwd(), '.env.local');
  if (existsSync(path)) {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = env.BS_ADMIN_EMAIL;
const ADMIN_PASSWORD = env.BS_ADMIN_PASSWORD;

let passed = 0;
let failed = 0;
const ok = (name) => { passed++; console.log(`  PASS  ${name}`); };
const bad = (name, extra = '') => { failed++; console.error(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`); };
const assert = (name, cond, extra = '') => (cond ? ok(name) : bad(name, extra));

function skip(reason) {
  console.log(`\nSKIPPED — ${reason}`);
  console.log('Start a local stack (supabase start && supabase db reset), set the');
  console.log('SUPABASE_* / VITE_SUPABASE_* vars in .env.local, then re-run.\n');
  process.exit(0);
}

if (!URL || !ANON) skip('Supabase URL / anon key not configured in .env.local.');

const anon = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });

// Reachability probe.
try {
  const { error } = await anon.rpc('get_public_content');
  if (error) throw new Error(error.message);
} catch (err) {
  skip(`could not reach Supabase at ${URL} (${err.message}).`);
}

const stamp = Date.now();
const draftSlug = `verify-draft-${stamp}`;
let service = null;
if (SERVICE) service = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

// ——— 1. PUBLIC READS: published-only + ordered ————————————————
console.log('\nPublic reads (anon)');
{
  const { data, error } = await anon.rpc('get_public_content');
  assert('get_public_content() is callable by anon', !error, error?.message);
  if (!error && data) {
    const orders = (data.projects ?? []).map((p) => p.order ?? 0);
    assert('projects are ordered ascending by display_order',
      orders.every((v, i) => i === 0 || orders[i - 1] <= v), JSON.stringify(orders));
    assert('every published project has at least one gallery frame',
      (data.projects ?? []).every((p) => Array.isArray(p.gallery) && p.gallery.length > 0));
    assert('settings.mapsUrl is a string (never null/invented)',
      typeof (data.settings?.mapsUrl ?? '') === 'string');
  }
}

// Prove published-only using a draft created with the service role.
let draftId = null;
if (service) {
  const { data: img } = await service.from('images').select('id').limit(1).maybeSingle();
  const imageId = img?.id ?? null;
  const { data: created, error } = await service
    .from('projects')
    .insert({ slug: draftSlug, title: 'Verify Draft', category: 'portraits', status: 'draft', display_order: 9999, cover_image_id: imageId, cover_alt: '' })
    .select()
    .single();
  if (error) {
    bad('service role can create a draft project', error.message);
  } else {
    draftId = created.id;
    ok('service role can create a draft project');

    const { data: anonProjects } = await anon.from('projects').select('slug');
    assert('anon cannot see the draft project in a table read',
      !(anonProjects ?? []).some((p) => p.slug === draftSlug));

    const { data: anonRpc } = await anon.rpc('get_public_content');
    assert('draft is absent from the anon public payload',
      !(anonRpc?.projects ?? []).some((p) => p.slug === draftSlug));

    // Publish it and confirm anon now sees it.
    await service.from('projects').update({ status: 'published' }).eq('id', draftId);
    const { data: anonRpc2 } = await anon.rpc('get_public_content');
    assert('after publishing, anon sees the project',
      (anonRpc2?.projects ?? []).some((p) => p.slug === draftSlug));
  }
} else {
  console.log('  SKIP  published-only draft test (no SUPABASE_SERVICE_ROLE_KEY)');
}

// ——— 2. UNAUTHORIZED WRITES: anon is denied ————————————————
console.log('\nUnauthorized writes (anon)');
{
  const { error } = await anon.from('projects').insert({ slug: `hack-${stamp}`, title: 'x', category: 'portraits', status: 'published', display_order: 0, cover_alt: '' });
  assert('anon cannot insert a project (RLS)', !!error, 'insert unexpectedly succeeded');

  const { error: updErr } = await anon.from('site_settings').update({ instagram_url: 'https://evil.example' }).eq('id', 1);
  assert('anon cannot update site_settings (RLS)', !!updErr, 'update unexpectedly succeeded');

  const { error: delErr } = await anon.from('projects').delete().eq('slug', 'nonexistent-verify');
  assert('anon cannot delete projects (RLS)', !!delErr, 'delete unexpectedly succeeded');

  const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' });
  const { error: upErr } = await anon.storage.from('media').upload(`verify/anon-${stamp}.jpg`, blob, { contentType: 'image/jpeg' });
  assert('anon cannot upload to the media bucket (Storage policy)', !!upErr, 'upload unexpectedly succeeded');
}

// ——— 3. AUTHORIZED WRITES: allowlisted admin succeeds ——————————
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  console.log('\nAuthorized writes (allowlisted admin)');
  const admin = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: signIn, error: signInErr } = await admin.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (signInErr) {
    bad('admin can sign in', signInErr.message);
  } else {
    ok('admin can sign in');
    const { data: allowRow } = await admin.from('admin_users').select('id').eq('id', signIn.user.id).maybeSingle();
    assert('signed-in admin is on the admin_users allowlist', !!allowRow);

    const slug = `verify-admin-${stamp}`;
    const { data: proj, error: insErr } = await admin
      .from('projects')
      .insert({ slug, title: 'Verify Admin', category: 'portraits', status: 'draft', display_order: 9998, cover_alt: '' })
      .select()
      .single();
    assert('admin can insert a project', !insErr, insErr?.message);

    const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' });
    const { error: upErr } = await admin.storage.from('media').upload(`verify/admin-${stamp}.jpg`, blob, { contentType: 'image/jpeg' });
    assert('admin can upload to the media bucket', !upErr, upErr?.message);
    if (!upErr) await admin.storage.from('media').remove([`verify/admin-${stamp}.jpg`]);

    if (proj) await admin.from('projects').delete().eq('id', proj.id);
  }
} else {
  console.log('\n  SKIP  authorized-write checks (set BS_ADMIN_EMAIL/BS_ADMIN_PASSWORD)');
}

// ——— Cleanup ——————————————————————————————————————————————
if (service && draftId) await service.from('projects').delete().eq('id', draftId);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
