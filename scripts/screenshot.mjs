/**
 * Headless composition checks: captures the site at desktop and mobile sizes
 * into .preview/ so layouts can be verified at exact breakpoints.
 * Usage: node scripts/screenshot.mjs [url]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5173/';
const outDir = path.join(process.cwd(), '.preview');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

/* Instant jump to a section — smooth scrolling can outlive the settle wait on
   long pages and leave captures mid-flight. Stops below the fixed header so
   section eyebrows are never hidden under it. */
const jumpTo = (selector) => async (page) => {
  await page.locator(selector).evaluate((el) => {
    const header = document.querySelector('.header');
    const offset = header ? header.getBoundingClientRect().height : 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'instant' });
  });
  await page.waitForTimeout(600);
};

async function shoot(name, width, height, { fullPage = false, before } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200); // let reveal animations settle
  if (before) await before(page);
  if (fullPage) {
    // trigger lazy-loaded images before stitching the tall capture
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage });
  console.log(`.preview/${name}.png`);
  await page.close();
}

await shoot('desktop-hero', 1440, 900);
await shoot('desktop-intro', 1440, 900, { before: jumpTo('.intro') });
await shoot('mobile-hero', 390, 844);
await shoot('mobile-intro', 390, 844, { before: jumpTo('.intro') });
await shoot('mobile-menu', 390, 844, {
  before: async (page) => {
    await page.click('.burger');
    await page.waitForTimeout(700);
  },
});
await shoot('desktop-shoot', 1440, 900, { before: jumpTo('.shoot') });
await shoot('desktop-packages', 1440, 900, { before: jumpTo('.packages') });
await shoot('mobile-packages', 390, 844, { before: jumpTo('.packages') });
await shoot('desktop-cta', 1440, 900, { before: jumpTo('.cta') });
await shoot('mobile-cta', 390, 844, { before: jumpTo('.cta') });
await shoot('desktop-full', 1440, 900, { fullPage: true });

// "See packages" on a category card must scroll to #packages, activate the
// matching tab, and the enquiry CTA must carry that category to WhatsApp.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.locator('.shoot__tile').nth(2).locator('.shoot__action').click();
  await page.waitForTimeout(1000);
  const active = (await page.locator('.packages__tab.is-active').innerText()).trim().toLowerCase();
  const cardCategory = (await page.locator('.package__category').first().innerText()).trim().toLowerCase();
  const href = (await page.locator('.package__cta').first().getAttribute('href')) ?? '';
  const inView = await page.locator('.packages').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });
  const waOk = href.includes('wa.me') && decodeURIComponent(href).includes('Events');
  const ok = active === 'events' && cardCategory === 'events' && inView && waOk;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}: card action -> #packages with Events tab active ` +
      `(tab="${active}", card="${cardCategory}", inView=${inView}, wa=${waOk})`,
  );
  await page.screenshot({ path: path.join(outDir, 'desktop-packages-events.png') });
  console.log('.preview/desktop-packages-events.png');
  await page.close();
}

await browser.close();
