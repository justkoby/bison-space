/**
 * verify-theme-toggle.mjs — proves the public-site dark/light toggle works:
 *
 *   • dark is the default (ink surfaces, paper type)
 *   • the header toggle flips to light (paper surfaces, ink type)
 *   • the choice survives a reload (localStorage, applied pre-paint)
 *   • the mobile menu exposes the same toggle
 *
 *   node scripts/verify-theme-toggle.mjs        # BASE_URL=http://localhost:5173
 *
 * Requires a running dev/preview server. Captures into .preview/.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const OUT = '.preview';
mkdirSync(OUT, { recursive: true });

let passed = 0;
let failed = 0;
const ok = (n) => { passed++; console.log(`  PASS  ${n}`); };
const bad = (n, x = '') => { failed++; console.error(`  FAIL  ${n}${x ? ` — ${x}` : ''}`); };
const assert = (n, c, x = '') => (c ? ok(n) : bad(n, x));

const DARK_BG = 'rgb(11, 10, 8)'; // --ink (dark theme body)
const LIGHT_BG = 'rgb(244, 237, 226)'; // --ink (light theme body)

const browser = await chromium.launch();
try {
  // ——— Desktop ———
  console.log('\nDesktop — default, toggle, persistence');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // Skip the branded intro sequence (session-gated on the real site)
  await ctx.addInitScript(() => sessionStorage.setItem('bs-intro-played', '1'));
  const page = await ctx.newPage();

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.header', { timeout: 10000 });
  let bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert('dark is the default theme', bodyBg === DARK_BG, bodyBg);
  assert('toggle is reachable in the header nav', (await page.locator('.header__nav .theme-toggle').count()) === 1);
  await page.screenshot({ path: `${OUT}/theme-dark-home.png` });
  console.log('.preview/theme-dark-home.png');

  await page.click('.header__nav .theme-toggle');
  await page.waitForTimeout(500);
  const attr = await page.evaluate(() => document.documentElement.dataset.theme);
  const stored = await page.evaluate(() => localStorage.getItem('bisons-theme'));
  bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert('clicking the toggle applies the light theme', attr === 'light' && bodyBg === LIGHT_BG, `${attr}/${bodyBg}`);
  assert('the choice is stored in localStorage', stored === 'light', String(stored));
  const meta = await page.evaluate(() => document.querySelector('meta[name="theme-color"]').content);
  assert('theme-color meta follows the theme', meta === '#f4ede2', meta);
  await page.screenshot({ path: `${OUT}/theme-light-home.png` });
  console.log('.preview/theme-light-home.png');

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.header', { timeout: 10000 });
  const afterReload = await page.evaluate(
    () => `${document.documentElement.dataset.theme}|${getComputedStyle(document.body).backgroundColor}`,
  );
  assert('light theme survives a reload (no flash, pre-paint script)', afterReload === `light|${LIGHT_BG}`, afterReload);

  await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.portfolio__grid, .portfolio__empty', { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/theme-light-portfolio.png` });
  console.log('.preview/theme-light-portfolio.png');

  await page.click('.header__nav .theme-toggle');
  await page.waitForTimeout(500);
  bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert('toggling back restores the dark theme', bodyBg === DARK_BG, bodyBg);
  await page.screenshot({ path: `${OUT}/theme-dark-portfolio.png` });
  console.log('.preview/theme-dark-portfolio.png');
  await ctx.close();

  // ——— Mobile ———
  console.log('\nMobile — toggle inside the menu');
  const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mCtx.addInitScript(() => sessionStorage.setItem('bs-intro-played', '1'));
  const mobile = await mCtx.newPage();
  await mobile.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await mobile.waitForSelector('.header', { timeout: 10000 });
  await mobile.click('.burger');
  await mobile.waitForSelector('.menu--open', { timeout: 5000 });
  assert('menu head exposes the theme toggle', (await mobile.locator('.menu__head .theme-toggle').count()) === 1);
  await mobile.screenshot({ path: `${OUT}/theme-menu-dark.png` });
  await mobile.click('.menu__head .theme-toggle');
  await mobile.waitForTimeout(500);
  const mAttr = await mobile.evaluate(() => document.documentElement.dataset.theme);
  // The menu panel uses --paper: light in the dark theme, dark in the light theme
  const menuBg = await mobile.evaluate(() => getComputedStyle(document.querySelector('.menu')).backgroundColor);
  assert('mobile toggle flips the theme (menu surface follows)', mAttr === 'light' && menuBg === 'rgb(20, 18, 13)', `${mAttr}/${menuBg}`);
  await mobile.screenshot({ path: `${OUT}/theme-menu-light.png` });
  console.log('.preview/theme-menu-light.png');
  await mCtx.close();
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
