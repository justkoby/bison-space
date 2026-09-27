/**
 * Portfolio verification: routing (direct load + refresh under `vite preview`),
 * filters, every tile opening a real project, cross-route service anchors,
 * lightbox keyboard + swipe behaviour, proportions, and desktop/mobile captures.
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4173   (in another terminal)
 *   node scripts/verify-portfolio.mjs [url]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const url = (process.argv[2] ?? 'http://localhost:4173/').replace(/\/$/, '');
const outDir = path.join(process.cwd(), '.preview');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
let ok = true;
const check = (pass, label) => {
  console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${label}`);
  ok = ok && pass;
};

const waitIntro = async (page) => {
  // The branded intro plays at most once per session; skip past it if present.
  const skip = page.locator('.intro__skip');
  if (await skip.count()) {
    await skip.click().catch(() => {});
  }
  await page.waitForTimeout(600);
};

/* ——— Desktop: homepage → /portfolio ——— */
const slugs = [];
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${url}/`, { waitUntil: 'networkidle' });
  await waitIntro(page);
  console.log('[desktop 1440x900 — homepage]');

  const headLink = page.locator('.shoot__portfolio-link');
  check((await headLink.getAttribute('href')) === '/portfolio', '“View full portfolio” link points to /portfolio');
  const navLink = page.locator('.header__link', { hasText: 'Portfolio' });
  check((await navLink.getAttribute('href')) === '/portfolio', 'header Portfolio link points to /portfolio');

  await headLink.click();
  await page.waitForURL(`${url}/portfolio`);
  await page.waitForTimeout(500);

  console.log('[desktop 1440x900 — /portfolio]');
  check(
    (await page.locator('.portfolio-head .eyebrow').innerText()).toLowerCase() === 'the portfolio',
    'eyebrow reads THE PORTFOLIO',
  );
  check(
    (await page.locator('.portfolio-head .section-title').innerText()).trim() === 'Stories in focus.',
    'title reads “Stories in focus.”',
  );
  check((await page.locator('.portfolio-head__body').count()) === 1, 'one-sentence intro present');

  const filterLabels = await page.locator('.portfolio__filter').allInnerTexts();
  check(
    filterLabels.length >= 2 && filterLabels[0].toLowerCase().startsWith('all'),
    `filters present: ${filterLabels.map((l) => l.replace(/\s*\d+$/, '')).join(', ')}`,
  );

  const tiles = page.locator('.portfolio__tile');
  const tileCount = await tiles.count();
  check(tileCount >= 8, `${tileCount} project tiles rendered`);
  const hrefs = await tiles.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
  check(
    hrefs.every((h) => /^\/portfolio\/[a-z0-9-]+$/.test(h)),
    'every tile links to /portfolio/:slug',
  );
  slugs.push(...hrefs.map((h) => h.split('/').pop()));

  await page.screenshot({ path: path.join(outDir, 'portfolio-desktop.png') });
  console.log('  .preview/portfolio-desktop.png');

  // Filters actually filter
  const eventsBtn = page.locator('.portfolio__filter', { hasText: 'Events' });
  await eventsBtn.click();
  await page.waitForTimeout(400);
  const eventsCats = await page.locator('.portfolio__category').allInnerTexts();
  check(
    eventsCats.length > 0 && eventsCats.every((c) => c.trim().toLowerCase() === 'events'),
    'Events filter shows only Events projects',
  );
  await page.locator('.portfolio__filter', { hasText: 'All' }).first().click();
  await page.waitForTimeout(400);
  check((await tiles.count()) === tileCount, 'All restores the full grid');

  // Restrained closing CTA
  await page.locator('.portfolio-cta').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  check(
    (await page.locator('.portfolio-cta .section-title').innerText()).trim() === 'See your story here.',
    'restrained booking CTA closes the portfolio page',
  );
  await page.screenshot({ path: path.join(outDir, 'portfolio-cta.png') });
  console.log('  .preview/portfolio-cta.png');

  // Every tile opens a real project (client-side navigation)
  let allOpen = true;
  for (const slug of slugs) {
    await page.goto(`${url}/portfolio`, { waitUntil: 'domcontentloaded' });
    await page.locator(`.portfolio__tile[href="/portfolio/${slug}"]`).first().click();
    await page.waitForURL(`${url}/portfolio/${slug}`);
    const title = (await page.locator('.project .section-title').innerText()).trim();
    const leadSrc = await page.locator('.project__lead img').getAttribute('src');
    allOpen = allOpen && title.length > 2 && !!leadSrc && leadSrc.startsWith('/images/portfolio/');
  }
  check(allOpen, `all ${slugs.length} tiles open a real project page`);

  // Refresh on a project route works (SPA fallback in vite preview)
  await page.goto(`${url}/portfolio/${slugs[0]}`, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  check(
    page.url() === `${url}/portfolio/${slugs[0]}` && (await page.locator('.project__lead img').count()) === 1,
    'refreshing a project URL renders the project (direct load + refresh)',
  );

  // Refresh on /portfolio itself
  await page.goto(`${url}/portfolio`, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  check((await page.locator('.portfolio__tile').count()) === tileCount, 'refreshing /portfolio renders the grid');

  // Proportions: the painted lead image keeps the photograph’s aspect ratio
  // (object-fit: contain letterboxes inside the element box — compare the
  // rendered content area, not the box itself).
  const ratioOk = await page.evaluate(async () => {
    const link = document.querySelector('.portfolio__tile');
    link.click();
    await new Promise((r) => setTimeout(r, 600));
    const img = document.querySelector('.project__lead img');
    if (!img) return false;
    if (!img.complete) await img.decode().catch(() => {});
    const fit = getComputedStyle(img).objectFit;
    const rect = img.getBoundingClientRect();
    const natural = img.naturalWidth / img.naturalHeight;
    const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const paintedW = img.naturalWidth * scale;
    const paintedH = img.naturalHeight * scale;
    // contain ⇒ the whole photograph is painted inside the box (no crop),
    // at its natural aspect ratio, never upscaled past the box.
    return (
      fit === 'contain' &&
      natural > 0 &&
      paintedW <= rect.width + 1 &&
      paintedH <= rect.height + 1 &&
      Math.abs(paintedW / paintedH - natural) < 0.02
    );
  });
  check(ratioOk, 'lead image preserves the photograph’s proportions');

  /* ——— Lightbox ——— */
  console.log('[desktop — lightbox]');
  await page.locator('.project__lead img').click();
  await page.waitForTimeout(500);
  check((await page.locator('.lightbox').count()) === 1, 'clicking the lead opens the lightbox');
  const countText = () => page.locator('.lightbox__count').innerText();
  check((await countText()).trim() === '1 / 2', 'counter starts at 1 / 2');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  check((await countText()).trim() === '2 / 2', 'ArrowRight advances');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  check((await countText()).trim() === '1 / 2', 'ArrowLeft goes back');
  await page.click('.lightbox__nav--next');
  await page.waitForTimeout(300);
  check((await countText()).trim() === '2 / 2', 'next button advances');
  await page.screenshot({ path: path.join(outDir, 'portfolio-lightbox.png') });
  console.log('  .preview/portfolio-lightbox.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  check((await page.locator('.lightbox').count()) === 0, 'Escape closes the lightbox');

  // Enquiry action
  const enquire = page.locator('.project__enquire');
  const enquireHref = await enquire.getAttribute('href');
  check(
    enquireHref.startsWith('https://wa.me/message/A3OQGDVZH2L5G1?text=') &&
      (await enquire.innerText()).toLowerCase().includes('enquire about a similar shoot'),
    '“Enquire about a similar shoot” opens WhatsApp with a pre-filled message',
  );
  await page.screenshot({ path: path.join(outDir, 'portfolio-project-desktop.png') });
  console.log('  .preview/portfolio-project-desktop.png');

  /* ——— Cross-route service anchors ——— */
  console.log('[desktop — cross-route anchors]');
  await page.locator('.header__link', { hasText: 'Packages' }).click();
  await page.waitForURL(`${url}/`);
  await page.waitForTimeout(1600);
  const packagesTop = await page.evaluate(() => {
    const el = document.getElementById('packages');
    return el ? Math.abs(el.getBoundingClientRect().top) : 9999;
  });
  check(packagesTop < 160, 'Packages link from a project route lands on the homepage packages section');

  await page.goto(`${url}/portfolio`, { waitUntil: 'domcontentloaded' });
  await page.locator('.header__link', { hasText: 'What We Shoot' }).click();
  await page.waitForURL(`${url}/`);
  await page.waitForTimeout(1600);
  const shootTop = await page.evaluate(() => {
    const el = document.getElementById('shoot');
    return el ? Math.abs(el.getBoundingClientRect().top) : 9999;
  });
  check(shootTop < 160, 'What We Shoot link from /portfolio lands on the homepage services section');
  await page.close();
}

/* ——— Mobile 390x844 ——— */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${url}/portfolio`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  console.log('[mobile 390x844]');

  const cols = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.portfolio__grid')).gridTemplateColumns.split(' ').length,
  );
  check(cols === 1, 'mobile grid is a single column');
  await page.screenshot({ path: path.join(outDir, 'portfolio-mobile.png') });
  console.log('  .preview/portfolio-mobile.png');

  // Menu → Portfolio
  await page.click('.burger');
  await page.waitForTimeout(700);
  await page.locator('.menu__link', { hasText: 'Portfolio' }).click();
  await page.waitForURL(`${url}/portfolio`);
  await page.waitForTimeout(400);
  const menuClosed = await page.evaluate(() => !document.querySelector('.menu')?.classList.contains('menu--open'));
  check(menuClosed, 'mobile menu Portfolio link navigates and closes the menu');

  // Open first project + swipe in the lightbox
  await page.locator('.portfolio__tile').first().click();
  await page.waitForURL(/\/portfolio\/[a-z0-9-]+$/);
  await page.locator('.project__lead img').click();
  await page.waitForTimeout(500);
  const before = await page.locator('.lightbox__count').innerText();
  await page.mouse.move(300, 420);
  await page.mouse.down();
  await page.mouse.move(90, 420, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await page.locator('.lightbox__count').innerText();
  check(before !== after, 'swipe left advances the lightbox on touch');
  await page.screenshot({ path: path.join(outDir, 'portfolio-lightbox-mobile.png') });
  console.log('  .preview/portfolio-lightbox-mobile.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.close();
}

await browser.close();
console.log(ok ? 'ALL PORTFOLIO CHECKS PASS' : 'PORTFOLIO CHECKS FAILED');
process.exit(ok ? 0 : 1);
