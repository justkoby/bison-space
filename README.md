# Bison’s Space — Website

Homepage and portfolio for **Bison’s Space**, the portrait, beauty, fashion and editorial
photography studio of **Lazarus Nukunu** (Adenta, Accra, Ghana).

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
node scripts/verify-parallax.mjs # checks intro portrait parallax travel, reversibility, edge coverage
node scripts/verify-support.mjs # support widget dialog behaviour, focus, overlaps, menu coverage
npm run build && npx vite preview --port 4173   # in another terminal, then:
node scripts/verify-portfolio.mjs # routes, filters, tiles, lightbox, proportions (against preview)
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
  verify-parallax.mjs           # intro parallax checks (travel, reverse scroll, coverage)
  verify-support.mjs            # support widget checks (dialog, focus, overlaps, menu)
  verify-portfolio.mjs          # portfolio routes/filters/lightbox/proportions (vite preview)
  contact-sheet.mjs             # labelled montage of all originals (shoot grouping by eye)
src/
  content/site.ts               # ALL copy, links, nav, categories, packages
  content/images.ts             # image registry: paths, alt, object-position, recommended sizes
  content/portfolio.ts          # portfolio projects (slug/title/category/cover/gallery/alt/order/published)
  router.tsx                    # tiny history router: navigate/usePath/SiteLink (hash-aware)
  pages/                        # HomePage, PortfolioPage (/portfolio), ProjectPage (/portfolio/:slug)
  components/                   # presentation only (Header, Hero, Intro, WhatWeShoot,
                                # Packages, About, BookingCta, Footer, Logo, SupportWidget, Lightbox)
  styles/global.css             # design tokens + all section styles
```

Content is fully separated from presentation: an admin dashboard later only needs to
replace the modules in `src/content/` (same shapes) — no component changes.
`content/portfolio.ts` already mirrors the future Supabase table: a fetch returning the
same `PortfolioProject[]` can replace it without touching any component.

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
| Category tiles & package cards (×4) | `work-*.jpg` | ≥ 1200×1600 portrait (3:4) | face in upper half |
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

## Intro portrait parallax

The full-bleed intro portrait has a subtle scroll-driven parallax ([Intro.tsx](src/components/Intro.tsx)).
The container stays flush to the section's top/bottom and the viewport's right edge with
`overflow: hidden`; the image is `height: 115%` with a `-7.5%` top overscan and is translated
`translate3d` by up to ±30px (60px total) as the section crosses the viewport, clamped inside the
overscan so no blank edge can appear. Only the image moves — never the container or the text.

- rAF-throttled passive scroll/resize listeners; transform-only for smooth compositing.
- `object-position` (registry `intro-coin-veil-crimson`) keeps the model's face in frame.
- Disabled for `prefers-reduced-motion` and on narrow (<900px) screens, which fall back to a
  static, fully covering image.

`node scripts/verify-parallax.mjs` sweeps the section scrolling down and back up, asserting the
40-70px travel band, reversibility, continuous coverage, and the static reduced/mobile fallbacks.

## What We Shoot & Packages

The two sections after the introduction present services, not a portfolio:

- **What We Shoot** (`#shoot`, [WhatWeShoot.tsx](src/components/WhatWeShoot.tsx)) — the four
  image-led categories Bison’s Space actually offers (Portraits, Beauty & Fashion, Events,
  Brand Stories). Each card’s “See packages” action scrolls to `#packages` and opens the
  matching tab via a `bs:select-category` event.
- **Packages** (`#packages`, [Packages.tsx](src/components/Packages.tsx)) — category tabs across
  the top (horizontally scrollable on mobile) over package cards: photograph, name, short
  description, then duration / retouched / outfits and price **only when confirmed**, and a
  Book / Enquire button.

Until Lazarus confirms real package names, specs and rates, `packages` in `src/content/site.ts`
stays empty and each category shows a polished “Custom session — enquire for details” card whose
CTA opens WhatsApp with that category pre-filled in the message (`whatsappEnquiry`). Nothing is
invented: no prices, no specs. Adding a confirmed package later is a data-only change.

`node scripts/screenshot.mjs` also asserts the card→tab hand-off and the WhatsApp message.

## Portfolio

Real routes — `/portfolio` (filterable index) and `/portfolio/:slug` (project page) — served
by a tiny history router ([router.tsx](src/router.tsx)); direct links and browser refresh
work in `vite preview` (SPA fallback). The branded opening sequence plays on the homepage
only; other routes get a docked solid header (`.header--page`).

- **Index** ([PortfolioPage.tsx](src/pages/PortfolioPage.tsx)) — editorial head (“THE
  PORTFOLIO” / “Stories in focus.” / one sentence), category filters with counts (only
  categories the published projects genuinely cover), a 3/2/1-column tile grid, and a
  restrained closing CTA on paper. First three covers load eager, the rest lazy.
- **Project** ([ProjectPage.tsx](src/pages/ProjectPage.tsx)) — back link, category, title,
  a large eager lead image, then the remaining frames as a centred sequence (even frames at
  82% width for rhythm), all at full composition (`object-fit: contain`, never cropped),
  an “Enquire about a similar shoot” WhatsApp action, and prev/next project links.
- **Lightbox** ([Lightbox.tsx](src/components/Lightbox.tsx)) — full-screen viewer with
  next/previous buttons, ← → keys, Escape to close, swipe on touch, tap-backdrop close,
  focus restore and a body scroll lock.
- **Data** ([portfolio.ts](src/content/portfolio.ts)) — 12 published projects from 18 unique
  photographs grouped by shoot (no photograph repeats across projects); neutral descriptive
  titles only — no client names, dates or credits are invented. Thumbnails crop via
  `object-position` in CSS; galleries always show the full frame.

Hash links in the nav (`#shoot`, `#packages`, …) resolve through `SiteLink`: from another
route they navigate home first and then scroll, so the services anchors work site-wide.

`node scripts/verify-portfolio.mjs` (against `vite preview`) asserts direct loads and
refresh of both routes, the filters, that every tile opens a real project, lightbox keys and
swipe, cross-route anchors, lead-image proportions, and captures desktop + mobile evidence.

## Support widget

A floating **Support** button sits at the viewport's bottom-right on every screen
([SupportWidget.tsx](src/components/SupportWidget.tsx)). It opens a compact `role="dialog"`
panel — “How can we help?” — with four actions: Book a shoot (WhatsApp enquiry), View packages
(WhatsApp catalogue), Find the studio (Google Maps) and Ask a question (WhatsApp enquiry), plus
the appointment note. All copy and links live in `src/content/site.ts` (`support`,
`supportActions`); external links open in a new tab with `rel="noopener noreferrer"`.

- Closes via its close button, Escape or a click outside; focus always returns to the Support
  button, and Tab is trapped inside while open.
- `z-index: 30`, below the mobile menu (`40`), so an open menu always covers it; the footer keeps
  extra bottom padding so the button never sits over footer links.
- No chatbot, form or FAQs — the panel is four links and a note.

> **Missing input:** the Google Maps URL for the studio was not in the supplied project
> materials. `support.mapsUrl` in `src/content/site.ts` is therefore an empty, clearly marked
> config value and the “Find the studio” action renders as “Link pending” (disabled) until the
> real URL is pasted in. No address or pin was guessed.

`node scripts/verify-support.mjs` asserts the dialog behaviour, focus restoration, link targets,
non-overlap with the header CTA and footer links, panel fit on mobile, and menu coverage.

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

Standalone About page (the nav About entry still points at the homepage `#about` section).
When it lands, update `about.linkHref` in `src/content/site.ts` from `#about` to `/about`.
The Portfolio page has shipped; its content module is ready to swap for Supabase — the admin
dashboard that writes to it is the remaining piece.
