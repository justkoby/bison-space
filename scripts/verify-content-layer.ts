/**
 * verify-content-layer.ts — pure-logic checks for the public-read invariants.
 *
 * Runs WITHOUT a database via Node's type stripping:
 *   node --experimental-strip-types scripts/verify-content-layer.ts
 * (wired up as `npm run verify:content`).
 *
 * It targets src/data/mapping.ts, which is deliberately dependency-free, and
 * asserts the two guarantees the public site relies on:
 *   1. PUBLISHED-ONLY + STABLE ORDERING of the normalized payload.
 *   2. Nothing is invented — an absent Maps URL / settings field stays empty,
 *      and the source only becomes "supabase" when both flagged AND configured.
 */
import {
  resolveContentSource,
  sortOrdered,
  onlyPublished,
  normalizeSettings,
  normalizePublicContent,
  hasUsableContent,
  type RawPublicContent,
} from '../src/data/mapping.ts';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}`);
  }
}

function eq(name: string, actual: unknown, expected: unknown): void {
  check(`${name} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`,
    JSON.stringify(actual) === JSON.stringify(expected));
}

console.log('\nresolveContentSource — the public cutover flag');
eq('defaults to static when unset', resolveContentSource(undefined, true), 'static');
eq('static even when flag=supabase but not configured', resolveContentSource('supabase', false), 'static');
eq('static for an unknown flag value', resolveContentSource('nonsense', true), 'static');
eq('supabase only when flagged AND configured', resolveContentSource('supabase', true), 'supabase');

console.log('\nsortOrdered — stable ascending order');
const rows = [
  { id: 'a', order: 2 },
  { id: 'b', order: 1 },
  { id: 'c', order: 2 },
  { id: 'd', order: 0 },
];
eq('sorts by key, ties keep input order',
  sortOrdered(rows, (r) => r.order).map((r) => r.id),
  ['d', 'b', 'a', 'c']);
eq('does not mutate the input', rows.map((r) => r.id), ['a', 'b', 'c', 'd']);

console.log('\nonlyPublished — filters drafts');
eq('keeps only published',
  onlyPublished(
    [{ s: 'published' }, { s: 'draft' }, { s: 'published' }],
    (r) => r.s === 'published',
  ).length,
  2);

console.log('\nnormalizeSettings — never invents values');
const emptySettings = normalizeSettings(null);
eq('absent settings → all empty strings', emptySettings, {
  instagramUrl: '', behanceUrl: '', whatsappUrl: '', whatsappCatalogUrl: '', mapsUrl: '',
});
eq('absent mapsUrl stays empty (no guessed address)',
  normalizeSettings({ instagramUrl: 'https://x' }).mapsUrl, '');
eq('provided mapsUrl is preserved',
  normalizeSettings({ mapsUrl: 'https://maps.google.com/?q=1' }).mapsUrl,
  'https://maps.google.com/?q=1');

console.log('\nnormalizePublicContent — published-only + ordered + defensive');
const payload: RawPublicContent = {
  projects: [
    { slug: 'b', title: 'B', category: 'portraits', order: 2, cover: null, gallery: [{ src: '/b.jpg', alt: '' }] },
    { slug: 'a', title: 'A', category: 'events', order: 1, cover: null, gallery: [{ src: '/a.jpg', alt: '' }] },
    // malformed: no slug → dropped
    { slug: '', title: 'Broken', category: 'events', order: 0, cover: null, gallery: [] },
    // gallery entry with empty src → that frame is dropped
    { slug: 'c', title: 'C', category: 'events', order: 3, cover: null, gallery: [{ src: '', alt: '' }, { src: '/c.jpg', alt: '' }] },
  ],
  packages: [
    { id: 'p2', categorySlug: 'x', name: 'P2', description: '', duration: null, retouchedPhotos: null, outfits: null, price: null, order: 2, imageSrc: null, imageAlt: null, imageObjectPosition: null },
    { id: 'p1', categorySlug: 'x', name: 'P1', description: '', duration: null, retouchedPhotos: null, outfits: null, price: null, order: 1, imageSrc: null, imageAlt: null, imageObjectPosition: null },
  ],
  hero: [{ id: 'left', duration: 50, offset: -8, images: undefined as never }],
};
const normalized = normalizePublicContent(payload);
eq('projects ordered by order', normalized.projects.map((p) => p.slug), ['a', 'b', 'c']);
eq('malformed project dropped', normalized.projects.length, 3);
eq('empty-src gallery frame dropped', normalized.projects[2].gallery.length, 1);
eq('packages ordered by order', normalized.packages.map((p) => p.id), ['p1', 'p2']);
eq('hero column with missing images → empty array', normalized.hero[0].images.length, 0);
eq('null payload is safe', normalizePublicContent(null).projects.length, 0);

console.log('\nhasUsableContent — guards the fallback');
check('true when projects exist', hasUsableContent(normalized));
check('false for an empty payload', !hasUsableContent(normalizePublicContent({})));

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
