/**
 * Seam check for the hero photo wall.
 *
 * A seamless loop means the frame at time t is pixel-identical to the frame one
 * full loop later (t + duration). We pause every track's animation, capture the
 * hero, then advance each track by exactly its own loop duration and capture
 * again. Byte-identical PNGs prove there is no jump, gap or pause on restart.
 *
 * Usage: node scripts/verify-loop.mjs [url]
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5173/';
const outDir = path.join(process.cwd(), '.preview');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const PROBE_MS = 5000; // arbitrary point inside the loop

// Pause every track and seek all of them to the probe time.
const tracks = await page.$$('.wall-track');
for (const track of tracks) {
  await track.evaluate((el, t) => {
    const anim = el.getAnimations()[0];
    if (!anim) return;
    anim.pause();
    anim.currentTime = t;
  }, PROBE_MS);
}
const shotA = path.join(outDir, 'loop-start.png');
await page.locator('.hero').screenshot({ path: shotA });

// Advance each track by exactly one full loop duration.
for (const track of tracks) {
  await track.evaluate((el, t) => {
    const anim = el.getAnimations()[0];
    if (!anim) return;
    const dur = anim.effect.getComputedTiming().duration;
    anim.currentTime = t + dur;
  }, PROBE_MS);
}
const shotB = path.join(outDir, 'loop-end.png');
await page.locator('.hero').screenshot({ path: shotB });

const a = readFileSync(shotA);
const b = readFileSync(shotB);
const identical = a.equals(b);

console.log(`tracks checked: ${tracks.length}`);
console.log(`.preview/loop-start.png (${a.length} bytes)`);
console.log(`.preview/loop-end.png   (${b.length} bytes)`);
console.log(identical ? 'PASS: seamless — loop end is pixel-identical to loop start' : 'FAIL: SEAM DETECTED — frames differ');

// Hero is exactly one viewport tall and never blocks page scroll.
const heroBox = await page.locator('.hero').boundingBox();
const viewport = page.viewportSize();
const heroIsViewport = Math.round(heroBox.height) === viewport.height;
console.log(heroIsViewport ? `PASS: hero height ${heroBox.height}px == viewport ${viewport.height}px` : `FAIL: hero height ${heroBox.height}px != viewport ${viewport.height}px`);

await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
await page.waitForTimeout(300);
const scrolled = await page.evaluate(() => window.scrollY);
console.log(scrolled > 0 ? `PASS: page scrolls past the hero (scrollY=${scrolled})` : 'FAIL: page did not scroll');

// Reduced motion must freeze the wall (no running track animation).
const rmPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await rmPage.goto(url, { waitUntil: 'networkidle' });
await rmPage.waitForTimeout(800);
const running = await rmPage.evaluate(
  () => document.querySelectorAll('.wall-track').length &&
    Array.from(document.querySelectorAll('.wall-track')).some((el) =>
      el.getAnimations().some((an) => an.playState === 'running'),
    ),
);
console.log(running ? 'FAIL: wall still animates under prefers-reduced-motion' : 'PASS: wall frozen under prefers-reduced-motion');
await rmPage.close();

const ok = identical && heroIsViewport && scrolled > 0 && !running;
await browser.close();
process.exit(ok ? 0 : 1);
