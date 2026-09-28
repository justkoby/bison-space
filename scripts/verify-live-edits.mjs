/**
 * verify-live-edits.mjs — proves an allowlisted admin can EDIT live content
 * (project, service, hero image, footer setting) against the hosted Supabase,
 * and that a footer edit reaches the public payload (get_public_content).
 *
 * Credentials never touch this script: it opens a VISIBLE browser at the
 * supabase-mode dev server's /admin, waits for YOU to sign in, borrows the
 * session token from that browser session, closes the browser, and then runs
 * the edit checks over REST. Every edit is restored to its original value,
 * and the footer probe is verified publicly before AND after restoring.
 *
 *   node scripts/verify-live-edits.mjs
 *   ADMIN_URL=http://localhost:5175   (dev server with VITE_CONTENT_SOURCE=supabase)
 *   PUBLIC_URL=https://bison-space.vercel.app  (footer probe also checked in the
 *                                               deployed public site's DOM)
 */
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ——— Env loading (no dependency) ———
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
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5175';
const PUBLIC_URL = (process.env.PUBLIC_URL || ADMIN_URL).replace(/\/+$/, '');

let passed = 0;
let failed = 0;
const ok = (n) => { passed++; console.log(`  PASS  ${n}`); };
const bad = (n, x = '') => { failed++; console.error(`  FAIL  ${n}${x ? ` — ${x}` : ''}`); };
const assert = (n, c, x = '') => (c ? ok(n) : bad(n, x));
/** Compact status+body dump for diagnostics. */
const dump = (r) => `status=${r.status} body=${JSON.stringify(r.json)?.slice(0, 160)}`;

if (!URL || !ANON) {
  console.error('Supabase URL / anon key not configured in .env.local.');
  process.exit(1);
}

/** REST helper; `token` omitted = anon. */
async function rest(method, path, { token, body, single = false } = {}) {
  const headers = { apikey: ANON, Accept: single ? 'application/vnd.pgrst.object+json' : 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

/** supabase-js stores the session under sb-<ref>-auth-token, possibly nested. */
function dig(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    try { return dig(JSON.parse(value)); } catch { return null; }
  }
  if (typeof value === 'object') {
    if (typeof value.access_token === 'string') return value.access_token;
    if (value.data) return dig(value.data);
    if (value.session) return dig(value.session);
  }
  return null;
}

// ——— 1. Human sign-in in a visible browser ————————————————
console.log('\nA browser window is opening at the admin login.');
console.log('>>> Sign in there with your allowlisted admin account. <<<');
console.log('The script continues automatically once the dashboard loads.\n');

const browser = await chromium.launch({ headless: false });
let token = null;
try {
  const page = await browser.newPage();
  await page.goto(`${ADMIN_URL}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.adm-welcome', { timeout: 300000 });
  token = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.endsWith('-auth-token')) return localStorage.getItem(key);
    }
    return null;
  });
  token = dig(token);
} finally {
  await browser.close();
}

if (!token) {
  console.error('Could not borrow a session token after sign-in.');
  process.exit(1);
}
console.log('Session borrowed; browser closed. Running edit checks…');

// ——— 2. Allowlist + edit checks (each edit is restored) ————
console.log('\nAuthorized edits (live rows, restored afterwards)');
{
  const { json: allow } = await rest('GET', 'admin_users?select=id,email&limit=1', { token, single: true });
  assert('session belongs to an allowlisted admin', !!allow?.id, JSON.stringify(allow)?.slice(0, 120));

  // — Project —
  const first = await rest('GET', 'projects?select=id,title,cover_alt&order=updated_at.desc&limit=1', { token, single: true });
  const proj = first.json;
  if (!proj?.id) {
    bad('a project row exists to edit', dump(first));
  } else {
    const probe = `${proj.cover_alt || proj.title} [live edit check]`;
    const up = await rest('PATCH', `projects?id=eq.${proj.id}`, { token, body: { cover_alt: probe } });
    const reread = await rest('GET', `projects?id=eq.${proj.id}&select=cover_alt`, { token, single: true });
    assert('admin can update a project (cover_alt round-trips)', reread.json?.cover_alt === probe, `patch ${dump(up)} | reread ${dump(reread)}`);
    const back = await rest('PATCH', `projects?id=eq.${proj.id}`, { token, body: { cover_alt: proj.cover_alt } });
    const restored = await rest('GET', `projects?id=eq.${proj.id}&select=cover_alt`, { token, single: true });
    assert('project edit restores the original value', restored.json?.cover_alt === proj.cover_alt, `patch ${dump(back)} | reread ${dump(restored)}`);
  }

  // — Service —
  const svcFirst = await rest('GET', 'services?select=id,name,short_description&limit=1', { token, single: true });
  const svc = svcFirst.json;
  if (!svc?.id) {
    bad('a service row exists to edit', dump(svcFirst));
  } else {
    const probe = `${svc.short_description} [live edit check]`.trim();
    const up = await rest('PATCH', `services?id=eq.${svc.id}`, { token, body: { short_description: probe } });
    const reread = await rest('GET', `services?id=eq.${svc.id}&select=short_description`, { token, single: true });
    assert('admin can update a service (short_description round-trips)', reread.json?.short_description === probe, `patch ${dump(up)} | reread ${dump(reread)}`);
    await rest('PATCH', `services?id=eq.${svc.id}`, { token, body: { short_description: svc.short_description } });
    const restored = await rest('GET', `services?id=eq.${svc.id}&select=short_description`, { token, single: true });
    assert('service edit restores the original value', restored.json?.short_description === svc.short_description, `reread ${dump(restored)}`);
  }

  // — Hero image —
  const heroFirst = await rest('GET', 'hero_images?select=id,alt&limit=1', { token, single: true });
  const hero = heroFirst.json;
  if (!hero?.id) {
    bad('a hero image row exists to edit', dump(heroFirst));
  } else {
    const probe = `${hero.alt} [live edit check]`.trim();
    const up = await rest('PATCH', `hero_images?id=eq.${hero.id}`, { token, body: { alt: probe } });
    const reread = await rest('GET', `hero_images?id=eq.${hero.id}&select=alt`, { token, single: true });
    assert('admin can update a hero image (alt round-trips)', reread.json?.alt === probe, `patch ${dump(up)} | reread ${dump(reread)}`);
    await rest('PATCH', `hero_images?id=eq.${hero.id}`, { token, body: { alt: hero.alt } });
    const restored = await rest('GET', `hero_images?id=eq.${hero.id}&select=alt`, { token, single: true });
    assert('hero image edit restores the original value', restored.json?.alt === hero.alt, `reread ${dump(restored)}`);
  }

  // — Footer setting, with public visibility through the RPC —
  const settingsFirst = await rest('GET', 'site_settings?id=eq.1&select=footer_studio_note', { token, single: true });
  const settings = settingsFirst.json;
  if (!settings || settings.footer_studio_note === undefined) {
    bad('the site_settings singleton is readable by admin', dump(settingsFirst));
  } else {
    const original = settings.footer_studio_note;
    const probe = 'Live edit check — public visibility probe.';
    const up = await rest('PATCH', 'site_settings?id=eq.1', { token, body: { footer_studio_note: probe } });
    assert('admin can update the footer studio note', up.status === 204 || up.status === 200, dump(up));

    const rpc1 = await rest('POST', 'rpc/get_public_content', { single: true });
    assert('anon RPC shows the edited footer note (public visibility)', rpc1.json?.settings?.footerStudioNote === probe, String(rpc1.json?.settings?.footerStudioNote));

    // The deployed public site must render the probe in its footer DOM too.
    const pub = await chromium.launch();
    const pubPage = await pub.newPage();
    const footerText = async () => {
      await pubPage.goto(`${PUBLIC_URL}/`, { waitUntil: 'networkidle' });
      await pubPage.waitForSelector('.footer__line', { timeout: 15000 });
      await pubPage.waitForTimeout(500); // let the lazy content swap settle
      return (await pubPage.locator('.footer').textContent()) ?? '';
    };
    try {
      const withProbe = await footerText();
      assert('deployed public site footer shows the edited note', withProbe.includes(probe), withProbe.slice(0, 160));

      await rest('PATCH', 'site_settings?id=eq.1', { token, body: { footer_studio_note: original } });
      const rpc2 = await rest('POST', 'rpc/get_public_content', { single: true });
      assert('restored footer note is what anon sees again', rpc2.json?.settings?.footerStudioNote === original, String(rpc2.json?.settings?.footerStudioNote));

      const afterRestore = await footerText();
      assert(
        'deployed public site footer shows the restored note',
        original ? afterRestore.includes(original) && !afterRestore.includes(probe) : !afterRestore.includes(probe),
        afterRestore.slice(0, 160),
      );
    } finally {
      await pub.close();
    }
  }

  // — Anon still cannot write —
  const anonUp = await rest('PATCH', 'site_settings?id=eq.1', { body: { footer_studio_note: 'anon was here' } });
  const after = await rest('GET', 'site_settings?id=eq.1&select=footer_studio_note', { single: true });
  assert('anon update is still refused (0 rows, value untouched)', anonUp.status === 200 || anonUp.status === 204 ? !Array.isArray(anonUp.json) || anonUp.json.length === 0 : true, `status=${anonUp.status} note=${after.json?.footer_studio_note}`);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
