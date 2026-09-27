# Bison’s Space — Website

Homepage for **Bison’s Space**, the portrait, beauty, fashion and editorial photography
studio of **Lazarus Nukunu** (Adenta, Accra, Ghana).

Stack: Vite + React + TypeScript. No UI framework; all styling in `src/styles/global.css`.

## Run

```bash
npm install
npm run prepare:images   # re-generates public/images + copies brand assets (idempotent)
npm run dev              # http://localhost:5173
npm run build            # production build
npm run typecheck
node scripts/screenshot.mjs   # headless captures into .preview/ (desktop, mobile, menu, full page)
node scripts/screenshot-intro.mjs # captures the opening sequence beats (hold/reveal/after/skip/reduced/session)
node scripts/verify-loop.mjs  # proves the hero wall loop is seamless (pixel-compare one full loop apart)
```

## Project structure

```
public/
  brand/logo.svg, favicon.svg   # supplied assets, copied verbatim
  images/hero|work|about|cta/   # optimised web versions (progressive JPEG q82)
scripts/
  prepare-images.mjs            # original → web version pipeline (sharp)
  screenshot.mjs                # headless composition checks (playwright)
  screenshot-intro.mjs          # opening-sequence beat captures (playwright)
  verify-loop.mjs               # seam check: frame at t vs t+duration must be identical
src/
  content/site.ts               # ALL copy, links, nav, services, categories
  content/images.ts             # image registry: paths, alt, object-position, recommended sizes
  components/                   # presentation only (Header, Hero, Intro, SelectedWork,
                                # Services, About, BookingCta, Footer, Logo)
  styles/global.css             # design tokens + all section styles
```

Content is fully separated from presentation: an admin dashboard later only needs to
replace the two modules in `src/content/` (same shapes) — no component changes.

## Originals

The 26 source photographs, `logo.svg` and `favicon.svg` remain untouched in the project
root. `scripts/prepare-images.mjs` only ever reads them.

## Image guide (recommended source sizes for future uploads)

Web versions are capped per slot (progressive JPEG, quality 82). When Lazarus swaps
images via admin, sources should meet or exceed:

| Slot | Files | Recommended source | Crop notes |
|---|---|---|---|
| Hero left-top | `hero-sequin-gaze.jpg` | ≥ 1400×1400, square/portrait | face in upper third |
| Hero left-bottom | `hero-gold-gown.jpg` | ≥ 1400×1800 portrait | full-figure or 3/4; face near top |
| Hero center-top | `hero-violet-poise.jpg` | ≥ 1600×2000 portrait | bust crop, face upper-center |
| Hero center-bottom | `hero-camel-intimacy.jpg` | ≥ 1400×1400 square/portrait | close portrait, face upper-center |
| Hero right-top sliver | `hero-gold-hoops.jpg` | ≥ 1600×2000 portrait | band shows forehead→chin (object-position 50% 34%) |
| Hero right-bottom (dominant) | `hero-coin-veil-eyes.jpg` | ≥ 1400×1800 portrait | extreme close-up, eyes upper-third |
| Work tiles (×4) | `work-*.jpg` | ≥ 1200×1600 portrait (3:4) | face in upper half |
| About frame | `about-studio-session.jpg` | ≥ 1200×1600 portrait (4:5) | — |
| CTA frame | `cta-black-lace-recline.jpg` | ≥ 1400×1800 portrait (4:5) | — |

Every slot sets a deliberate `object-position` (see `src/content/images.ts`, fields
`objectPosition` / `objectPositionMobile`) so faces are never cut on desktop or mobile.

## Opening sequence

A short branded intro ([src/components/SiteIntro.tsx](src/components/SiteIntro.tsx)) plays before the
homepage: a black screen with “BISONS SPACE” in the Saol display serif, a brief hold, then a
camera-like zoom into the centre of the “O”, whose interior opens as a circular mask reveal onto
the already-running photo-wall hero. Total ≈1.7s.

- The hero behind is mounted and animating from first paint; the intro only masks over it, so the
  approved composition and endless movement are unchanged.
- First hero frames are preloaded before the reveal starts (capped at 3s) so no blank wall shows.
- Plays once per browser session (`sessionStorage`); a visible Skip button ends it immediately.
- `prefers-reduced-motion` never mounts the overlay — the homepage shows at once.
- Page scroll is locked only while the overlay is up and released on reveal/skip, so navigation and
  scrolling are never delayed afterwards.

`node scripts/screenshot-intro.mjs` captures each beat (hold, mid-reveal, after, skip,
reduced-motion, same-session reload) into `.preview/`.

## Hero photo wall

The hero is a seamless, endlessly scrolling photo wall: three vertical tracks drift
upward behind the stationary logo wordmark. Each track renders its image sequence
twice and translates exactly `-50%` of its own height (one full set), so the wrap is
pixel-identical — no seam, gap or pause. Sequence and pace live in
`src/content/images.ts` (`heroWall`); cell heights, gutter and easing live in
`src/styles/global.css`. Adjacent columns run at slightly different speeds for depth.

- Transform-only (`translate3d`) for smooth compositing; the hero stays one viewport
  tall and never drives page scroll.
- Pauses when the tab is hidden (`visibilitychange` → `.hero--paused`).
- Hover eases the image only; it never restarts the track animation.
- `prefers-reduced-motion` freezes the wall to a static, face-forward composition.
- Mobile drops to two slower tracks with the wordmark and faces clearly visible.

`node scripts/verify-loop.mjs` pauses the tracks and compares the frame at time `t`
with the frame one full loop later; byte-identical PNGs confirm the loop is seamless.

## Brand assets

- `favicon.svg` is linked as-is for the browser tab (white disc + black monogram).
- `logo.svg` is a single-colour vector with no embedded fills. It is inlined verbatim
  (`src/components/Logo.tsx`) and tinted with `currentColor`: warm off-white over
  photographs and the black footer, original black on the paper mobile menu.
  Geometry and proportions are exactly as supplied; a subtle local gradient sits behind
  the navigation for legibility over the collage.

## Phase 2 (not built yet)

Standalone Portfolio and About pages. When they land, update the hrefs in
`src/content/site.ts` (`nav`, `workSection.linkHref`, `about.linkHref`) from the current
in-page anchors to `/portfolio` and `/about`.
