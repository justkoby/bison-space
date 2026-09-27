/**
 * Captures the opening sequence at its key beats so the choreography can be checked:
 *   intro-hold    — black screen, centred wordmark, visible Skip
 *   intro-reveal  — mid circular reveal into the photo wall
 *   intro-after   — overlay gone, homepage live
 *   intro-skip    — Skip pressed early, homepage shown immediately
 *   intro-reduced — prefers-reduced-motion, homepage shown immediately (no overlay)
 *
 * Each capture uses a fresh browser context so the once-per-session gate replays.
 * Usage: node scripts/screenshot-intro.mjs [url]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5173/';
const outDir = path.join(process.cwd(), '.preview');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

async function shoot(name, { wait = 0, reduced = false, clickSkip = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (wait) await page.waitForTimeout(wait);
  if (clickSkip) {
    await page.waitForSelector('.intro__skip', { timeout: 3000 });
    await page.click('.intro__skip');
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  console.log(`.preview/${name}.png`);
  await context.close();
}

await shoot('intro-hold', { wait: 250 });
await shoot('intro-reveal', { wait: 820 });
await shoot('intro-after', { wait: 2200 });
await shoot('intro-skip', { wait: 200, clickSkip: true });
await shoot('intro-reduced', { wait: 400, reduced: true });

// Once per session: reload the SAME tab after the intro played — no overlay on beat 1.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200); // let the first play finish + set the session flag
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);
  const overlay = await page.locator('.intro-root').count();
  await page.screenshot({ path: path.join(outDir, 'intro-session.png') });
  console.log(`.preview/intro-session.png (overlay present on reload: ${overlay > 0})`);
  await context.close();
}

await browser.close();
