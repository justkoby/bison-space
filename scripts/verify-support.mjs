/**
 * Support widget checks: dialog behaviour (close button / Escape / outside click),
 * focus restoration, focus trap, link targets, and non-overlap with the header CTA,
 * footer links and the open mobile menu. Captures desktop + mobile evidence.
 *
 * Usage: node scripts/verify-support.mjs [url]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5173/';
const outDir = path.join(process.cwd(), '.preview');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
let ok = true;
const check = (pass, label) => {
  console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${label}`);
  ok = ok && pass;
};

const intersects = (a, b) =>
  a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const fabFocused = (page) =>
  page.evaluate(() => document.activeElement?.classList.contains('support-fab') ?? false);

const panelOpen = (page) => page.locator('#support-panel').count().then((n) => n > 0);

/* ——— Desktop behaviour ——— */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  console.log('[desktop 1440x900]');

  await page.click('.support-fab');
  await page.waitForTimeout(400);
  check(await panelOpen(page), 'panel opens from the Support button');
  check(
    (await page.locator('#support-title').innerText()).trim() === 'How can we help?',
    'heading is “How can we help?”',
  );

  const actions = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.support__action')];
    return nodes.map((n) => ({
      tag: n.tagName,
      label: n.querySelector('span')?.textContent ?? '',
      href: n.getAttribute('href') ?? '',
      target: n.getAttribute('target') ?? '',
      rel: n.getAttribute('rel') ?? '',
      disabled: n.getAttribute('aria-disabled') === 'true',
    }));
  });
  check(actions.length === 4, `four actions listed (${actions.length})`);
  const links = actions.filter((a) => a.tag === 'A');
  check(
    links.length === 3 && links.every((a) => a.target === '_blank' && a.rel.includes('noopener')),
    'WhatsApp/Maps actions open in a new tab with rel=noopener',
  );
  check(
    actions[0].href === 'https://wa.me/message/A3OQGDVZH2L5G1' &&
      actions[3].href === 'https://wa.me/message/A3OQGDVZH2L5G1',
    'Book a shoot + Ask a question use the WhatsApp enquiry link',
  );
  check(actions[1].href === 'https://wa.me/c/233554713435', 'View packages uses the WhatsApp catalogue');
  check(
    actions[2].disabled && actions[2].label === 'Find the studio',
    'Find the studio renders as pending (no Maps URL supplied) instead of a guessed pin',
  );
  check(
    (await page.locator('.support__note').innerText()).includes('Sessions are arranged by appointment'),
    'appointment note present',
  );

  // focus trap: tabbing cycles inside the panel
  let trapped = true;
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('Tab');
    trapped = trapped && (await page.evaluate(() => document.getElementById('support-panel')?.contains(document.activeElement) ?? false));
  }
  check(trapped, 'Tab focus stays inside the dialog');

  await page.screenshot({ path: path.join(outDir, 'support-desktop.png') });
  console.log('  .preview/support-desktop.png');

  // Escape closes + focus restore
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check(!(await panelOpen(page)), 'Escape closes the panel');
  check(await fabFocused(page), 'focus returns to the Support button after Escape');

  // outside click closes + focus restore
  await page.click('.support-fab');
  await page.waitForTimeout(300);
  await page.mouse.click(500, 400);
  await page.waitForTimeout(300);
  check(!(await panelOpen(page)), 'clicking outside closes the panel');
  check(await fabFocused(page), 'focus returns to the Support button after outside click');

  // close button closes + focus restore
  await page.click('.support-fab');
  await page.waitForTimeout(300);
  await page.click('.support__close');
  await page.waitForTimeout(300);
  check(!(await panelOpen(page)), 'close button closes the panel');
  check(await fabFocused(page), 'focus returns to the Support button after close button');

  // non-overlap: header CTA and footer links
  const fabBox = await page.locator('.support-fab').boundingBox();
  const ctaBox = await page.locator('.header__cta').boundingBox();
  check(!intersects(fabBox, ctaBox), 'Support button never covers the header Book a Shoot button');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  const footerBoxes = await page.evaluate(() =>
    [...document.querySelectorAll('.footer a, .footer__bottom')].map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }),
  );
  const clash = footerBoxes.some((b) => intersects(fabBox, b));
  check(!clash, 'Support button never covers footer links at the page end');
  await page.close();
}

/* ——— Mobile behaviour + open menu ——— */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  console.log('[mobile 390x844]');

  await page.click('.support-fab');
  await page.waitForTimeout(400);
  const box = await page.locator('#support-panel').boundingBox();
  check(
    !!box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844,
    'panel fits fully inside the mobile viewport',
  );
  await page.screenshot({ path: path.join(outDir, 'support-mobile.png') });
  console.log('  .preview/support-mobile.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Booking CTA: sweeping the section past the viewport must never place the
  // floating Support button over the WhatsApp button.
  const ctaClash = await page.evaluate(async () => {
    const cta = document.querySelector('.cta');
    const btn = document.querySelector('.cta__button');
    const fab = document.querySelector('.support-fab');
    if (!cta || !btn || !fab) return true;
    const hit = (a, b) =>
      a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const top = cta.getBoundingClientRect().top + window.scrollY;
    const start = Math.max(0, top - window.innerHeight);
    const end = top + cta.getBoundingClientRect().height;
    for (let y = start; y <= end; y += 40) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
      if (hit(btn.getBoundingClientRect(), fab.getBoundingClientRect())) return true;
    }
    return false;
  });
  check(!ctaClash, 'Support button never covers the booking CTA WhatsApp button while scrolling past it');

  // open mobile menu: the menu must cover the Support button entirely
  await page.click('.burger');
  await page.waitForTimeout(800);
  const covered = await page.evaluate(() => {
    const fab = document.querySelector('.support-fab');
    if (!fab) return false;
    const r = fab.getBoundingClientRect();
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !fab.contains(top) && !!top?.closest('.menu');
  });
  check(covered, 'open mobile menu covers the Support button');
  await page.screenshot({ path: path.join(outDir, 'support-menu.png') });
  console.log('  .preview/support-menu.png');
  await page.close();
}

await browser.close();
console.log(ok ? 'ALL SUPPORT CHECKS PASS' : 'SUPPORT CHECKS FAILED');
process.exit(ok ? 0 : 1);
