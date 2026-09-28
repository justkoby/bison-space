/**
 * verify-public-footer.mjs — proves the footer & contact settings reach the
 * public site in BOTH content modes, without touching the hosted database:
 *
 *   • static mode   (default server)  — the footer renders today's checked-in
 *     wording and shows NO mailto:/tel: links (none supplied yet).
 *   • supabase mode (second server started with VITE_CONTENT_SOURCE=supabase) —
 *     the get_public_content() RPC is answered by a route mock carrying edited
 *     footer/contact values; the footer must show them, with working mailto:
 *     and tel: links.
 *
 *   node scripts/verify-public-footer.mjs
 *   STATIC_URL=http://localhost:5173 SUPABASE_URL=http://localhost:5175
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const STATIC_URL = process.env.STATIC_URL || 'http://localhost:5173';
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:5175';
const OUT = '.preview';
mkdirSync(OUT, { recursive: true });

let passed = 0;
let failed = 0;
const ok = (n) => { passed++; console.log(`  PASS  ${n}`); };
const bad = (n, x = '') => { failed++; console.error(`  FAIL  ${n}${x ? ` — ${x}` : ''}`); };
const assert = (n, c, x = '') => (c ? ok(n) : bad(n, x));

/** A published-only payload shaped exactly like get_public_content() returns. */
const RPC_PAYLOAD = {
  settings: {
    instagramUrl: 'https://www.instagram.com/bisons_space/',
    behanceUrl: 'https://www.behance.net/bisons',
    whatsappUrl: 'https://wa.me/message/A3OQGDVZH2L5G1',
    whatsappCatalogUrl: 'https://wa.me/c/233554713435',
    mapsUrl: '',
    studioLocation: 'Adenta, Accra, Ghana',
    contactEmail: 'studio@bisons.space',
    contactPhone: '+233 55 471 3435',
    footerTagline: 'Verified edited tagline — supabase mode.',
    footerStudioNote: 'Sessions by appointment.',
    footerCopyright: '© 2026 Bison’s Space. Photography by Lazarus Nukunu.',
  },
  hero: [],
  services: [],
  packages: [],
  projects: [
    {
      slug: 'verify-footer',
      title: 'Verify Footer',
      category: 'portraits',
      order: 1,
      cover: { src: '/images/portfolio/pf-gold-sculpture.jpg', alt: '', thumbPosition: null },
      gallery: [{ src: '/images/portfolio/pf-gold-sculpture.jpg', alt: '' }],
    },
  ],
};

async function footerState(page) {
  return page.evaluate(() => {
    const footer = document.querySelector('.footer');
    const links = [...footer.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');
    return {
      text: footer.innerText,
      mailto: links.filter((h) => h.startsWith('mailto:')),
      tel: links.filter((h) => h.startsWith('tel:')),
    };
  });
}

async function shootFooter(page, name) {
  await page.locator('.footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`.preview/${name}.png`);
}

const browser = await chromium.launch();
try {
  // ——— Static mode: unchanged checked-in wording, no contact links ———
  console.log('\nStatic mode — checked-in wording, empty contact fields hidden');
  const staticPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await staticPage.goto(`${STATIC_URL}/`, { waitUntil: 'networkidle' });
  await staticPage.waitForSelector('.footer', { timeout: 10000 });
  let s = await footerState(staticPage);
  assert('static tagline is the checked-in copy', s.text.includes('Portrait, beauty, fashion and editorial photography'), '');
  assert('static studio note is the checked-in copy', s.text.includes('Sessions by appointment.'), '');
  assert('static location is the checked-in copy', s.text.includes('Adenta, Accra, Ghana'), '');
  assert('static copyright carries the current year', s.text.includes(`© ${new Date().getFullYear()} Bison’s Space`), '');
  assert('no mailto link while no email is supplied', s.mailto.length === 0, s.mailto.join(','));
  assert('no tel link while no phone is supplied', s.tel.length === 0, s.tel.join(','));
  await shootFooter(staticPage, 'footer-static');
  await staticPage.close();

  // ——— Supabase mode: edited values from the (mocked) RPC ———
  console.log('\nSupabase mode — admin-edited footer & contact values render');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/rest/v1/rpc/get_public_content', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RPC_PAYLOAD) }),
  );
  const livePage = await ctx.newPage();
  await livePage.goto(`${SUPABASE_URL}/`, { waitUntil: 'networkidle' });
  await livePage.waitForSelector('.footer', { timeout: 10000 });
  await livePage.waitForTimeout(800); // let the lazy supabase content swap land
  s = await footerState(livePage);
  assert('edited tagline from settings renders', s.text.includes('Verified edited tagline — supabase mode.'), s.text.slice(0, 120));
  assert('email renders as a mailto: link', s.mailto.includes('mailto:studio@bisons.space'), s.mailto.join(','));
  assert('phone renders as a tel: link (digits only href)', s.tel.includes('tel:+233554713435'), s.tel.join(','));
  assert('phone keeps its human formatting as the label', s.text.includes('+233 55 471 3435'), '');
  assert('studio note still renders', s.text.includes('Sessions by appointment.'), '');
  await shootFooter(livePage, 'footer-supabase');
  await ctx.close();
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
