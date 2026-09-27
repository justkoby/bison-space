/**
 * Parallax checks for the intro portrait:
 *  - the image translates as the section passes the viewport (down AND back up),
 *  - total travel stays within the intended ~40-70px band,
 *  - the image always covers its container (no blank edges) at every scroll point,
 *  - reduced-motion and narrow mobile produce a static image (no transform).
 *
 * Usage: node scripts/verify-parallax.mjs [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173/';
const browser = await chromium.launch();

const readState = (page) =>
  page.evaluate(() => {
    const media = document.querySelector('.intro__media');
    const img = media?.querySelector('img');
    if (!media || !img) return null;
    const m = media.getBoundingClientRect();
    const i = img.getBoundingClientRect();
    const t = getComputedStyle(img).transform;
    let y = 0;
    if (t && t !== 'none') {
      const match = /matrix\(([^)]+)\)/.exec(t);
      if (match) y = parseFloat(match[1].split(',')[5]);
    }
    return {
      y,
      covers: i.top <= m.top + 0.5 && i.bottom >= m.bottom - 0.5,
      scrollY: window.scrollY,
    };
  });

async function sweep(page, label) {
  const bounds = await page.evaluate(() => {
    const r = document.querySelector('.intro__media').getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height, vh: window.innerHeight };
  });
  const points = [];
  const from = bounds.top - bounds.vh; // section just entering
  const to = bounds.top + bounds.height; // section just left
  for (let k = 0; k <= 6; k++) points.push(Math.round(from + ((to - from) * k) / 6));

  const down = [];
  for (const y of points) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(120);
    down.push(await readState(page));
  }
  const up = [];
  for (const y of [...points].reverse()) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(120);
    up.push(await readState(page));
  }

  const ys = down.map((s) => s.y);
  const travel = Math.max(...ys) - Math.min(...ys);
  const monotonicDown = ys.every((v, i) => i === 0 || v >= ys[i - 1] - 0.01);
  const reversible = down.every((s, i) => Math.abs(s.y - up[up.length - 1 - i].y) < 0.5);
  const alwaysCovers = [...down, ...up].every((s) => s.covers);

  console.log(`[${label}]`);
  console.log(`  translateY down: ${ys.map((v) => v.toFixed(1)).join(' → ')}`);
  console.log(`  total travel: ${travel.toFixed(1)}px ${travel >= 40 && travel <= 70 ? 'PASS' : 'FAIL'} (target 40-70)`);
  console.log(`  ${monotonicDown ? 'PASS' : 'FAIL'}: moves steadily while scrolling down`);
  console.log(`  ${reversible ? 'PASS' : 'FAIL'}: same values when scrolling back up`);
  console.log(`  ${alwaysCovers ? 'PASS' : 'FAIL'}: image covers container at every point (no blank edges)`);
  return travel >= 40 && travel <= 70 && monotonicDown && reversible && alwaysCovers;
}

let ok = true;

// Desktop: parallax active.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200); // let the opening sequence finish
  ok = (await sweep(page, 'desktop 1440x900')) && ok;
  // Capture the two travel extremes so the crop/face can be eyeballed.
  const bounds = await page.evaluate(() => {
    const r = document.querySelector('.intro__media').getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height, vh: window.innerHeight };
  });
  await page.evaluate((v) => window.scrollTo(0, v), bounds.top - bounds.vh);
  await page.waitForTimeout(200);
  await page.locator('.intro').screenshot({ path: '.preview/parallax-enter.png' });
  await page.evaluate((v) => window.scrollTo(0, v), bounds.top + bounds.height);
  await page.waitForTimeout(200);
  await page.locator('.intro').screenshot({ path: '.preview/parallax-exit.png' });
  console.log('  .preview/parallax-enter.png + parallax-exit.png');
  await page.close();
}

// Reduced motion: static image.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('.intro__media').scrollIntoView());
  await page.waitForTimeout(200);
  const s = await readState(page);
  const staticOk = s && s.y === 0 && s.covers;
  console.log(`[reduced-motion] ${staticOk ? 'PASS' : 'FAIL'}: static, covering image (y=${s?.y})`);
  ok = staticOk && ok;
  await page.close();
}

// Narrow mobile: static image.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.evaluate(() => document.querySelector('.intro__media').scrollIntoView());
  await page.waitForTimeout(200);
  const s = await readState(page);
  const staticOk = s && s.y === 0 && s.covers;
  console.log(`[mobile 390] ${staticOk ? 'PASS' : 'FAIL'}: static, covering image (y=${s?.y})`);
  ok = staticOk && ok;
  await page.close();
}

await browser.close();
console.log(ok ? 'ALL PARALLAX CHECKS PASS' : 'PARALLAX CHECKS FAILED');
process.exit(ok ? 0 : 1);
