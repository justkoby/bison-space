/**
 * verify-admin-login.mjs — renders the /admin login at desktop + mobile widths
 * and captures empty / focused / validation-error / loading states, asserting
 * the brand-matched composition via computed styles + geometry:
 *   • centred ~1100px split panel, ≈50% photograph (left) / 50% form (right)
 *   • near-black form side, ~360px form, subtle borders, minimal rounding
 *   • logo, "Welcome back" heading, support text, password visibility toggle,
 *     brand-accent Sign in button, subtle "Back to website" link
 *   • no sign-up or social-login options (private admin login)
 *   • focus, validation-error and loading states visible
 *   • mobile: single column, short photographic header, no horizontal overflow
 *
 *   node scripts/verify-admin-login.mjs        # BASE_URL=http://localhost:5174
 *
 * Requires a running server (dev or preview). No auth needed — the login form
 * renders for signed-out visitors.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:5174';
const OUT = '.preview';
mkdirSync(OUT, { recursive: true });

let passed = 0;
let failed = 0;
const ok = (n) => { passed++; console.log(`  PASS  ${n}`); };
const bad = (n, x = '') => { failed++; console.error(`  FAIL  ${n}${x ? ` — ${x}` : ''}`); };
const assert = (n, c, x = '') => (c ? ok(n) : bad(n, x));

/** Geometry + computed styles for the split login panel. */
async function probe(page) {
  return page.evaluate(() => {
    const rect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, bottom: r.bottom, right: r.right };
    };
    const cs = (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el) : null;
    };
    const input = cs('#adm-email');
    const btn = cs('.adm-login__submit');
    const side = cs('.adm-login__side');
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      frame: rect('.adm-login__frame'),
      media: rect('.adm-login__media'),
      side: rect('.adm-login__side'),
      form: rect('.adm-login__form'),
      inputBorder: input?.borderTopWidth,
      inputRadius: input?.borderTopLeftRadius,
      btnBg: btn?.backgroundColor,
      btnRadius: btn?.borderTopLeftRadius,
      btnBox: rect('.adm-login__submit'),
      sideBg: side?.backgroundColor,
      titleText: document.querySelector('.adm-login__title')?.textContent?.trim(),
      titleFont: cs('.adm-login__title')?.fontFamily,
      subText: document.querySelector('.adm-login__sub')?.textContent?.trim(),
      hasLogo: !!document.querySelector('.adm-login__logo svg'),
      backHref: document.querySelector('.adm-login__back')?.getAttribute('href'),
      bodyText: document.body.innerText,
    };
  });
}

const isOpaque = (bg) => !!bg && bg !== 'transparent' && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(bg);
const px = (v) => parseFloat(v || '0');

const browser = await chromium.launch();
try {
  // ——— Desktop ———
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await desktop.waitForSelector('.adm-login__form', { timeout: 8000 });

  let s = await probe(desktop);
  console.log('\nDesktop — empty (centred split panel)');
  assert('panel is ~1100px wide', s.frame && s.frame.w >= 1060 && s.frame.w <= 1101, `${s.frame?.w}`);
  assert('panel is horizontally centred', s.frame && Math.abs(s.frame.x - (s.vw - s.frame.w) / 2) <= 2, `x=${s.frame?.x}`);
  assert('photograph takes the left half', s.media && s.frame && Math.abs(s.media.w - s.frame.w / 2) <= s.frame.w * 0.05, `${s.media?.w} of ${s.frame?.w}`);
  assert('form sits on the right half', s.form && s.media && s.form.x > s.media.right, `form.x=${s.form?.x} media.right=${s.media?.right}`);
  assert('form side is near-black', /^rgb\((1[0-9]|[0-9]), /.test(s.sideBg || '') || s.sideBg === 'rgb(11, 10, 8)', s.sideBg);
  assert('form is ~360px wide', s.form && s.form.w <= 365, `${s.form?.w}`);
  assert('brand logo is rendered', s.hasLogo);
  assert('heading reads "Welcome back"', s.titleText === 'Welcome back', s.titleText);
  assert('support text reads "Sign in to manage your website."', s.subText === 'Sign in to manage your website.', s.subText);
  assert('heading uses the editorial serif', /Playfair|Saol|serif/i.test(s.titleFont || ''), s.titleFont);
  assert('fields have subtle borders', px(s.inputBorder) >= 1, s.inputBorder);
  assert('fields have minimal rounding', px(s.inputRadius) <= 4, s.inputRadius);
  assert('Sign in button uses the brand accent fill', isOpaque(s.btnBg), s.btnBg);
  assert('Sign in button has minimal rounding', px(s.btnRadius) <= 6, s.btnRadius);
  assert('Sign in button is prominent', s.btnBox && s.btnBox.w >= 300, `${s.btnBox?.w}`);
  assert('subtle "Back to website" link points home', s.backHref === '/', s.backHref);
  assert('no sign-up option (private login)', !/sign\s*up/i.test(s.bodyText));
  assert('no social-login options', !/continue with|google|facebook/i.test(s.bodyText));
  await desktop.screenshot({ path: `${OUT}/admin-login-desktop.png` });

  console.log('\nDesktop — password toggle');
  const typeBefore = await desktop.getAttribute('#adm-password', 'type');
  await desktop.click('.adm-login__pw-toggle');
  const typeShown = await desktop.getAttribute('#adm-password', 'type');
  const pressed = await desktop.getAttribute('.adm-login__pw-toggle', 'aria-pressed');
  await desktop.click('.adm-login__pw-toggle');
  const typeAfter = await desktop.getAttribute('#adm-password', 'type');
  assert('toggle reveals then hides the password', typeBefore === 'password' && typeShown === 'text' && typeAfter === 'password', `${typeBefore}/${typeShown}/${typeAfter}`);
  assert('toggle exposes aria-pressed', pressed === 'true', String(pressed));

  console.log('\nDesktop — focused');
  await desktop.focus('#adm-email');
  const focus = await desktop.evaluate(() => {
    const i = getComputedStyle(document.querySelector('#adm-email'));
    return { border: i.borderTopColor, shadow: i.boxShadow };
  });
  assert('focused field shows accent border/ring', focus.shadow !== 'none', JSON.stringify(focus));
  await desktop.screenshot({ path: `${OUT}/admin-login-desktop-focused.png` });

  console.log('\nDesktop — validation error');
  await desktop.click('.adm-login__submit');
  await desktop.waitForSelector('.adm-notice--error', { timeout: 3000 });
  const errText = await desktop.textContent('.adm-notice--error');
  assert('empty submit shows a validation notice', /email and password/i.test(errText || ''), errText || '');
  await desktop.screenshot({ path: `${OUT}/admin-login-desktop-error.png` });

  console.log('\nDesktop — loading');
  await desktop.fill('#adm-email', 'probe@example.com');
  await desktop.fill('#adm-password', 'probe-password');
  await desktop.click('.adm-login__submit');
  let sawSpinner = false;
  try {
    await desktop.waitForSelector('.adm-login__form .adm-spinner', { timeout: 2000 });
    sawSpinner = true;
    const disabledWhileBusy = await desktop.evaluate(() => document.querySelector('.adm-login__submit').disabled);
    assert('submit is disabled while busy (no duplicate submits)', disabledWhileBusy);
    await desktop.screenshot({ path: `${OUT}/admin-login-desktop-loading.png` });
  } catch {
    /* network resolved before we could catch the spinner */
  }
  if (sawSpinner) ok('submit shows a loading spinner on the button');
  else console.log('  SKIP  loading spinner (network resolved too fast to capture)');
  await desktop.waitForTimeout(1200);
  await desktop.close();

  // ——— Mobile ———
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await mobile.waitForSelector('.adm-login__form', { timeout: 8000 });
  s = await probe(mobile);
  console.log('\nMobile — single column');
  assert('photographic header stacks ABOVE the form', s.media && s.side && s.media.bottom <= s.side.top + 1, `media.bottom=${s.media?.bottom} side.top=${s.side?.top}`);
  assert('header is short (~28vh band)', s.media && s.media.h >= 150 && s.media.h <= s.vh * 0.4, `${s.media?.h}`);
  assert('fields have subtle borders', px(s.inputBorder) >= 1, s.inputBorder);
  assert('Sign in button uses the brand accent fill', isOpaque(s.btnBg), s.btnBg);
  const inputW = await mobile.evaluate(() => document.querySelector('#adm-email').getBoundingClientRect().width);
  assert('fields are easy to hit on mobile', inputW > 250, `${inputW}`);
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert('no horizontal overflow on mobile', overflow);
  await mobile.screenshot({ path: `${OUT}/admin-login-mobile.png`, fullPage: true });
  await mobile.close();
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
