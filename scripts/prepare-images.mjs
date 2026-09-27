/**
 * Copies the selected originals into an organised public/images tree with short,
 * descriptive filenames and writes optimised web versions (progressive JPEG,
 * q82, capped to the maximum display width of each slot).
 *
 * Originals in the project root are never modified.
 * Re-runnable: `npm run prepare:images`
 */
import sharp from 'sharp';
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

/** src = original file in project root, out = web version, width = max output width in px */
const jobs = [
  // Hero collage (desktop panels render up to ~700px wide, 2x for retina)
  { src: '434245577_956692009361926_4321562633065059117_n.jpg', out: 'public/images/hero/hero-sequin-gaze.jpg', width: 1400 },
  { src: '476122683_18487494175028532_8112736968925207418_n.jpg', out: 'public/images/hero/hero-gold-gown.jpg', width: 1400 },
  { src: '534773018_18525539095028532_49713319230917388_n.jpg', out: 'public/images/hero/hero-violet-poise.jpg', width: 1600 },
  { src: '653936468_18575238802028532_769438114173300586_n.jpg', out: 'public/images/hero/hero-camel-intimacy.jpg', width: 1400 },
  { src: '673101749_18584857819028532_3496570279453549902_n.jpg', out: 'public/images/hero/hero-gold-hoops.jpg', width: 1600 },
  { src: '514761872_18516510034028532_8940365432531496851_n.jpg', out: 'public/images/hero/hero-coin-veil-eyes.jpg', width: 1400 },
  // Selected work categories
  { src: '582221676_18321178120173431_9112519512759085918_n.jpg', out: 'public/images/work/work-portrait-white-blazer.jpg', width: 1200 },
  { src: '572129139_18331516786233977_2242280137691200924_n.jpg', out: 'public/images/work/work-fashion-red-gown.jpg', width: 1200 },
  { src: '743426302_18609955105028532_8546451521101002707_n.jpg', out: 'public/images/work/work-events-graduation.jpg', width: 1200 },
  { src: '639499628_18511467421072630_2505642586468621046_n.jpg', out: 'public/images/work/work-brand-street-style.jpg', width: 1200 },
  // About + booking CTA
  { src: '587898058_1563539225093866_6755207508844125920_n.jpg', out: 'public/images/about/about-studio-session.jpg', width: 1200 },
  { src: '655157849_18576827080028532_8504288172167838348_n.jpg', out: 'public/images/cta/cta-black-lace-recline.jpg', width: 1400 },
  // Intro (right-hand frame)
  { src: '510947006_18516550396028532_4337548753963758024_n.jpg', out: 'public/images/intro/intro-coin-veil-crimson.jpg', width: 1200 },
];

const kb = (n) => `${(n / 1024).toFixed(0)} kB`;

for (const job of jobs) {
  const srcPath = path.join(root, job.src);
  const outPath = path.join(root, job.out);
  mkdirSync(path.dirname(outPath), { recursive: true });

  const meta = await sharp(srcPath).metadata();
  const info = await sharp(srcPath)
    .resize({ width: Math.min(job.width, meta.width), withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(outPath);

  console.log(
    `${job.out.padEnd(48)} ${meta.width}x${meta.height} -> ${info.width}x${info.height}  ${kb(info.size)}`,
  );
}

// Brand assets: copied verbatim (proportions and colours preserved).
mkdirSync(path.join(root, 'public/brand'), { recursive: true });
mkdirSync(path.join(root, 'src/assets'), { recursive: true });
copyFileSync(path.join(root, 'logo.svg'), path.join(root, 'public/brand/logo.svg'));
copyFileSync(path.join(root, 'favicon.svg'), path.join(root, 'public/brand/favicon.svg'));
// Master copy for inline rendering in the header/footer (colour set via CSS currentColor).
copyFileSync(path.join(root, 'logo.svg'), path.join(root, 'src/assets/logo.svg'));
console.log('brand assets copied to public/brand and src/assets');
