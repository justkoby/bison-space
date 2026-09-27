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
await shoot('desktop-intro', 1440, 900, {
  before: async (page) => {
    await page.locator('.intro').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
  },
});
await shoot('mobile-hero', 390, 844);
await shoot('mobile-intro', 390, 844, {
  before: async (page) => {
    await page.locator('.intro').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
  },
});
await shoot('mobile-menu', 390, 844, {
  before: async (page) => {
    await page.click('.burger');
    await page.waitForTimeout(700);
  },
});
await shoot('desktop-full', 1440, 900, { fullPage: true });

await browser.close();
