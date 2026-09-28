/**
 * Verify the DEPLOYED public site renders the seeded Supabase content.
 *
 *   node scripts/verify-deployed.mjs            # BASE_URL=https://bison-space.vercel.app
 *
 * Every expectation is derived live from the anon `get_public_content()` RPC —
 * nothing is hard-coded — and the browser must prove it actually fetched that
 * RPC (a static-fallback render fails the network assertion). Checks run on a
 * desktop and a mobile viewport: hero wall, services, portfolio grid, footer
 * wording, plus horizontal-overflow guards. Screenshots land in .preview/.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BASE = (process.env.BASE_URL || 'https://bison-space.vercel.app').replace(/\/+$/, '');
const OUT = '.preview';
mkdirSync(OUT, { recursive: true });

function loadEnv() {
  const file = path.join(process.cwd(), '.env.local');
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)="?([^"]*)"?\s*$/);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;

let passed = 0;
let failed = 0;
function assert(label, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

// ——— Ground truth: the anon RPC the deployed bundle is supposed to call ———
const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_content`, {
  headers: { apikey: ANON, Accept: 'application/json' },
});
if (!rpc.ok) {
  console.error(`RPC fetch failed: ${rpc.status}`);
  process.exit(1);
}
// PostgREST returns the RPC result directly (one object), not wrapped.
const data = await rpc.json();
if (!data || !Array.isArray(data.projects)) {
  console.error('Unexpected RPC payload shape');
  process.exit(1);
}

const projects = data.projects ?? [];
const services = data.services ?? [];
const settings = data.settings ?? {};
const heroSrcs = (data.hero ?? []).flatMap((column) => column.images.map((img) => img.src));

console.log(`Deployed site: ${BASE}`);
console.log(`RPC ground truth: ${projects.length} projects, ${services.length} services, ${heroSrcs.length} hero images\n`);

const browser = await chromium.launch();

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  console.log(`${viewport.name === 'desktop' ? 'Desktop' : 'Mobile'} — ${viewport.width}×${viewport.height}`);
  const ctx = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await ctx.newPage();

  let rpcOk = 0;
  page.on('response', (res) => {
    if (res.url().includes('/rest/v1/rpc/get_public_content') && res.ok()) rpcOk += 1;
  });

  // ——— Home: hero wall, services, footer ———
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.hero-wall img', { timeout: 15000 });
  await page.waitForSelector('.shoot__tile', { timeout: 15000 });
  await page.waitForSelector('.footer', { timeout: 15000 });
  await page.waitForTimeout(600); // let the lazy content swap settle

  assert(`[${viewport.name}] page fetched get_public_content() from the browser`, rpcOk > 0, `${rpcOk} ok responses`);

  const wallSrcs = await page.locator('.hero-wall img').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
  const heroCovered = heroSrcs.every((src) => wallSrcs.includes(src));
  assert(`[${viewport.name}] hero wall carries every published hero image`, heroCovered, `wall=${wallSrcs.length} rpc=${heroSrcs.length}`);

  const serviceTitles = await page.locator('.shoot__title').allTextContents();
  assert(
    `[${viewport.name}] services grid matches the RPC (${services.length})`,
    serviceTitles.length === services.length && services.every((s) => serviceTitles.includes(s.name)),
    serviceTitles.join(' | '),
  );

  const tagline = (await page.locator('.footer__tagline').textContent())?.trim() ?? '';
  assert(`[${viewport.name}] footer tagline matches settings`, tagline === settings.footerTagline, tagline);
  const footerLines = await page.locator('.footer__line').allTextContents();
  const linesOk =
    (!settings.studioLocation || footerLines.some((l) => l.trim() === settings.studioLocation)) &&
    (!settings.footerStudioNote || footerLines.some((l) => l.trim() === settings.footerStudioNote));
  assert(`[${viewport.name}] footer studio column shows location + note`, linesOk, footerLines.join(' | '));
  const copy = (await page.locator('.footer__bottom p').textContent())?.trim() ?? '';
  assert(`[${viewport.name}] footer copyright matches settings`, copy === settings.footerCopyright, copy);

  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert(`[${viewport.name}] home has no horizontal overflow`, homeOverflow);
  await page.screenshot({ path: `${OUT}/deployed-${viewport.name}-home.png`, fullPage: viewport.name === 'mobile' });
  console.log(`.preview/deployed-${viewport.name}-home.png`);

  // ——— Portfolio grid ———
  await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.portfolio__tile', { timeout: 15000 });
  await page.waitForTimeout(400);
  const tiles = await page.locator('.portfolio__tile').count();
  const tileTitles = await page.locator('.portfolio__title').allTextContents();
  assert(
    `[${viewport.name}] portfolio grid matches the RPC (${projects.length} published)`,
    tiles === projects.length && projects.every((p) => tileTitles.includes(p.title)),
    `tiles=${tiles} titles=${tileTitles.join(' | ')}`,
  );
  const pfOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert(`[${viewport.name}] portfolio has no horizontal overflow`, pfOverflow);
  await page.screenshot({ path: `${OUT}/deployed-${viewport.name}-portfolio.png`, fullPage: viewport.name === 'mobile' });
  console.log(`.preview/deployed-${viewport.name}-portfolio.png`);

  await ctx.close();
  console.log('');
}

await browser.close();
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
