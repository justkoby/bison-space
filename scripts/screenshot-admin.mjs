/**
 * screenshot-admin.mjs — captures the signed-in /admin chrome (dashboard +
 * every editor) at desktop and mobile widths into .preview/.
 *
 * The hosted project needs no credentials for this: every Supabase call the
 * admin makes (auth token, admin_users allowlist, content tables) is answered
 * by a Playwright route mock with fixture rows, so the REAL UI renders with
 * realistic data while nothing touches the network or the database. Image
 * `src`s point at the checked-in /images/... files so thumbnails render.
 *
 *   node scripts/screenshot-admin.mjs        # BASE_URL=http://localhost:5173
 *
 * Requires a running dev/preview server.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const OUT = '.preview';
mkdirSync(OUT, { recursive: true });

const USER = {
  id: '0f4b2b5a-aaaa-4bbb-8ccc-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'studio@bisons.space',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
};
const SESSION = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token',
  user: USER,
};

const img = (id, src, alt) => ({
  id,
  src,
  storage_path: null,
  alt,
  object_position: '50% 50%',
  object_position_mobile: null,
  width: 1200,
  height: 1600,
  created_at: '2026-01-05T10:00:00Z',
});

const IMAGES = [
  img('img-pf-1', '/images/portfolio/pf-gold-sculpture.jpg', 'Gold sculpture'),
  img('img-pf-2', '/images/portfolio/pf-crimson-gown.jpg', 'Crimson gown'),
  img('img-pf-3', '/images/portfolio/pf-graduation-cap.jpg', 'Graduation cap'),
  img('img-pf-4', '/images/portfolio/pf-white-blazer.jpg', 'White blazer'),
  img('img-work-1', '/images/work/work-portrait-white-blazer.jpg', 'Portrait'),
  img('img-work-2', '/images/work/work-fashion-red-gown.jpg', 'Red gown'),
  img('img-work-3', '/images/work/work-events-graduation.jpg', 'Graduation'),
  img('img-work-4', '/images/work/work-brand-street-style.jpg', 'Street style'),
  img('img-hero-1', '/images/hero/hero-gold-gown.jpg', 'Gold gown'),
  img('img-hero-2', '/images/hero/hero-sequin-gaze.jpg', 'Sequin gaze'),
];

const project = (id, slug, title, category, status, order, cover, updated) => ({
  id,
  slug,
  title,
  category,
  status,
  display_order: order,
  cover_image_id: cover,
  cover_alt: title,
  cover_thumb_position: null,
  created_at: '2026-02-01T09:00:00Z',
  updated_at: updated,
});

const PROJECTS = [
  project('p1', 'gold-sculpture', 'Gold Sculpture', 'beauty-fashion', 'published', 1, 'img-pf-1', '2026-09-24T16:20:00Z'),
  project('p2', 'crimson-gown', 'Crimson Gown', 'brand-stories', 'published', 2, 'img-pf-2', '2026-09-21T11:05:00Z'),
  project('p3', 'graduation-morning', 'Graduation Morning', 'events', 'published', 3, 'img-pf-3', '2026-09-18T08:40:00Z'),
  project('p4', 'white-blazer-studio', 'White Blazer Studio', 'portraits', 'published', 4, 'img-pf-4', '2026-09-12T14:15:00Z'),
  project('p5', 'street-lookbook', 'Street Lookbook', 'brand-stories', 'draft', 5, 'img-work-4', '2026-09-08T17:30:00Z'),
  project('p6', 'violet-series', 'Violet Series', 'portraits', 'published', 6, 'img-work-1', '2026-08-30T10:00:00Z'),
  project('p7', 'red-gown-editorial', 'Red Gown Editorial', 'beauty-fashion', 'draft', 7, 'img-work-2', '2026-08-22T13:45:00Z'),
];

const GALLERY = [
  { id: 'g1', project_id: 'p1', image_id: 'img-pf-2', alt: 'Crimson gown frame', position: 1, created_at: '2026-02-01T09:00:00Z' },
  { id: 'g2', project_id: 'p1', image_id: 'img-pf-3', alt: 'Graduation frame', position: 2, created_at: '2026-02-01T09:00:00Z' },
];

const HERO_COLUMNS = [
  { id: 'left', duration: 46, offset: -8, display_order: 1 },
  { id: 'center', duration: 52, offset: -16, display_order: 2 },
  { id: 'right', duration: 46, offset: -4, display_order: 3 },
];

const heroImage = (id, column, imageId, position) => ({
  id,
  column_id: column,
  image_id: imageId,
  alt: 'Hero frame',
  object_position: null,
  object_position_mobile: null,
  position,
  published: true,
  created_at: '2026-01-05T10:00:00Z',
  updated_at: '2026-01-05T10:00:00Z',
});

const HERO_IMAGES = [
  heroImage('h1', 'left', 'img-hero-1', 1),
  heroImage('h2', 'left', 'img-pf-4', 2),
  heroImage('h3', 'center', 'img-hero-2', 1),
  heroImage('h4', 'center', 'img-pf-1', 2),
  heroImage('h5', 'right', 'img-pf-2', 1),
  heroImage('h6', 'right', 'img-work-2', 2),
];

const service = (id, slug, name, imageId, order, status) => ({
  id,
  slug,
  name,
  short_description: `${name} sessions, directed with intent.`,
  image_id: imageId,
  display_order: order,
  status,
  created_at: '2026-01-05T10:00:00Z',
  updated_at: '2026-01-05T10:00:00Z',
});

const SERVICES = [
  service('s1', 'portraits', 'Portraits', 'img-work-1', 1, 'published'),
  service('s2', 'beauty-fashion', 'Beauty & Fashion', 'img-work-2', 2, 'published'),
  service('s3', 'events', 'Events', 'img-work-3', 3, 'published'),
  service('s4', 'brand-stories', 'Brand Stories', 'img-work-4', 4, 'published'),
];

const pkg = (id, slug, name, order, status) => ({
  id,
  category_slug: slug,
  name,
  description: 'A confirmed session package.',
  image_id: null,
  duration: '90 minutes',
  retouched_photos: '10',
  outfits: '2 looks',
  price: null,
  display_order: order,
  status,
  created_at: '2026-01-05T10:00:00Z',
  updated_at: '2026-01-05T10:00:00Z',
});

const PACKAGES = [pkg('pk1', 'portraits', 'Portrait Sitting', 1, 'published'), pkg('pk2', 'events', 'Event Cover', 1, 'draft')];

const SETTINGS = {
  id: 1,
  instagram_url: 'https://www.instagram.com/bisons_space/',
  behance_url: 'https://www.behance.net/bisons',
  whatsapp_url: 'https://wa.me/message/A3OQGDVZH2L5G1',
  whatsapp_catalog_url: 'https://wa.me/c/233554713435',
  maps_url: '',
  studio_location: 'Adenta, Accra, Ghana',
  contact_email: '',
  contact_phone: '',
  footer_tagline: 'Portrait, beauty, fashion and editorial photography — Adenta, Accra, Ghana.',
  footer_studio_note: 'Sessions by appointment.',
  footer_copyright: '© 2026 Bison’s Space. Photography by Lazarus Nukunu.',
  updated_at: '2026-01-05T10:00:00Z',
};

const TABLES = {
  admin_users: [{ id: USER.id, email: USER.email, label: 'Studio owner' }],
  site_settings: SETTINGS,
  images: IMAGES,
  projects: PROJECTS,
  project_gallery: GALLERY,
  hero_columns: HERO_COLUMNS,
  hero_images: HERO_IMAGES,
  services: SERVICES,
  packages: PACKAGES,
};

/** Answer every Supabase REST call from the fixtures above. */
async function mockRest(route) {
  const request = route.request();
  const url = new URL(request.url());
  const table = url.pathname.split('/').filter(Boolean)[2] ?? '';
  const accept = request.headers().accept ?? '';
  const wantsObject = accept.includes('vnd.pgrst.object');

  if (table === 'site_settings' && request.method() === 'PATCH') {
    const patch = JSON.parse(request.postData() ?? '{}');
    const merged = { ...SETTINGS, ...patch };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(merged) });
    return;
  }

  const rows = TABLES[table];
  if (rows === undefined) {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    return;
  }
  const body = wantsObject ? (Array.isArray(rows) ? rows[0] : rows) : rows;
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAuth(context) {
  await context.route('**/auth/v1/token*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION) }),
  );
  await context.route('**/auth/v1/logout', (route) => route.fulfill({ status: 204, body: '' }));
  await context.route('**/auth/v1/user', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USER) }),
  );
  await context.route('**/rest/v1/**', mockRest);
}

async function login(page) {
  await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.adm-login__form', { timeout: 15000 });
  await page.fill('#adm-email', USER.email);
  await page.fill('#adm-password', 'mock-password');
  await page.click('.adm-login__submit');
  await page.waitForSelector('.adm-welcome', { timeout: 15000 });
}

let passed = 0;
let failed = 0;
const ok = (n) => { passed++; console.log(`  PASS  ${n}`); };
const bad = (n, x = '') => { failed++; console.error(`  FAIL  ${n}${x ? ` — ${x}` : ''}`); };
const assert = (n, c, x = '') => (c ? ok(n) : bad(n, x));

async function shoot(page, path, waitSel, name, { fullPage = false } = {}) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector(waitSel, { timeout: 10000 });
  } catch {
    console.log(`  WARN  ${waitSel} never appeared on ${path}`);
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log(`.preview/${name}.png`);
}

const browser = await chromium.launch();
try {
  // ——— Desktop ———
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await mockAuth(desktopCtx);
  const desktop = await desktopCtx.newPage();
  await login(desktop);
  console.log('\nDesktop — dashboard + editors');
  await desktop.waitForSelector('.adm-ptable__row', { timeout: 10000 });
  const statCount = await desktop.locator('.adm-stat').count();
  assert('dashboard shows five summary stat cards', statCount === 5, `${statCount}`);
  const railTips = await desktop.locator('.adm-rail__btn .adm-rail__tip').allTextContents();
  assert('icon rail exposes hover labels for every section', railTips.slice(0, 6).every(Boolean), railTips.join(','));
  await desktop.hover('.adm-rail__btn:nth-child(2)');
  await desktop.waitForTimeout(250);
  await desktop.screenshot({ path: `${OUT}/admin-dashboard-desktop.png` });
  await desktop.mouse.move(10, 10);
  console.log('.preview/admin-dashboard-desktop.png');

  await shoot(desktop, '/admin/portfolio', '.adm-row', 'admin-portfolio-desktop');
  await shoot(desktop, '/admin/portfolio/p1', '.adm-section', 'admin-project-editor-desktop');
  await shoot(desktop, '/admin/hero', '.adm-hero__col', 'admin-hero-desktop');
  await shoot(desktop, '/admin/services', '.adm-section', 'admin-services-desktop');
  await shoot(desktop, '/admin/packages', '.adm-groups', 'admin-packages-desktop');
  await shoot(desktop, '/admin/settings', '#s-tagline', 'admin-settings-desktop');
  const footerSection = await desktop.locator('.adm-section__title', { hasText: 'Footer & contact' }).count();
  assert('settings shows the Footer & contact section', footerSection === 1, `${footerSection}`);
  await desktopCtx.close();

  // ——— Mobile ———
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mockAuth(mobileCtx);
  const mobile = await mobileCtx.newPage();
  await login(mobile);
  console.log('\nMobile — dashboard, drawer menu, editors');
  await mobile.waitForSelector('.adm-ptable__row', { timeout: 10000 });
  const noOverflowDash = await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert('dashboard has no horizontal overflow on mobile', noOverflowDash);
  await mobile.screenshot({ path: `${OUT}/admin-dashboard-mobile.png`, fullPage: true });
  console.log('.preview/admin-dashboard-mobile.png');

  await mobile.click('.adm-menubtn');
  await mobile.waitForSelector('.adm-drawer', { timeout: 5000 });
  await mobile.screenshot({ path: `${OUT}/admin-menu-mobile.png` });
  console.log('.preview/admin-menu-mobile.png');
  await mobile.click('.adm-drawer__link[href="/admin/portfolio"]');
  await mobile.waitForSelector('.adm-row', { timeout: 10000 });
  const drawerClosed = (await mobile.locator('.adm-drawer').count()) === 0;
  assert('drawer navigates and closes on selection', drawerClosed && mobile.url().includes('/admin/portfolio'));
  await mobile.screenshot({ path: `${OUT}/admin-portfolio-mobile.png`, fullPage: true });
  console.log('.preview/admin-portfolio-mobile.png');

  await shoot(mobile, '/admin/settings', '#s-tagline', 'admin-settings-mobile', { fullPage: true });
  const noOverflowSettings = await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert('settings has no horizontal overflow on mobile', noOverflowSettings);
  await mobileCtx.close();
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
