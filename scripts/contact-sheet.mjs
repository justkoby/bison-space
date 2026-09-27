/**
 * Builds a labelled contact sheet of every original photograph in the project
 * root so shoots can be grouped by eye. Prints the index → filename mapping.
 *
 * Usage: node scripts/contact-sheet.mjs
 */
import sharp from 'sharp';
import { readdirSync } from 'node:fs';

const W = 300;
const H = 380;
const COLS = 6;

const files = readdirSync('.')
  .filter((f) => /\.(jpe?g|webp)$/i.test(f))
  .sort();

const rows = Math.ceil(files.length / COLS);
const tiles = [];

for (let i = 0; i < files.length; i++) {
  const buf = await sharp(files[i]).resize(W, H, { fit: 'cover' }).toBuffer();
  const label = Buffer.from(
    `<svg width="${W}" height="${H}">` +
      `<rect x="0" y="0" width="58" height="34" fill="rgba(0,0,0,0.78)"/>` +
      `<text x="10" y="25" font-family="sans-serif" font-size="21" fill="#ffffff">${i + 1}</text>` +
      `</svg>`,
  );
  const left = (i % COLS) * W;
  const top = Math.floor(i / COLS) * H;
  tiles.push({ input: buf, left, top }, { input: label, left, top });
}

await sharp({
  create: { width: COLS * W, height: rows * H, channels: 3, background: { r: 17, g: 15, b: 12 } },
})
  .composite(tiles)
  .png()
  .toFile('.preview/contact-sheet.png');

console.log(files.map((f, i) => `${i + 1}: ${f}`).join('\n'));
console.log(`\n.preview/contact-sheet.png (${files.length} photos, ${COLS}x${rows})`);
