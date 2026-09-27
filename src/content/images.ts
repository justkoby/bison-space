/**
 * Image registry: every photograph used on the site, with its web path, alt text,
 * deliberate crop anchoring (object-position) and the recommended source size for
 * future uploads (admin dashboard ready).
 *
 * object-position values are chosen per panel so faces stay fully visible in both
 * the desktop collage and the mobile recomposition.
 */

export type ImageAsset = {
  id: string;
  src: string;
  alt: string;
  /** Crop anchor on desktop */
  objectPosition: string;
  /** Crop anchor on the mobile composition, when different */
  objectPositionMobile?: string;
  /** Recommended minimum source size for replacements uploaded via admin */
  recommended: string;
};

export const images: Record<string, ImageAsset> = {
  // ——— Hero collage ———
  'hero-sequin-gaze': {
    id: 'hero-sequin-gaze',
    src: '/images/hero/hero-sequin-gaze.jpg',
    alt: 'Beauty portrait in a silver sequin gown against a cool grey studio backdrop, hand lifted into long dark hair.',
    objectPosition: '50% 22%',
    objectPositionMobile: '50% 18%',
    recommended: '1400×1400 or larger, square or portrait',
  },
  'hero-gold-gown': {
    id: 'hero-gold-gown',
    src: '/images/hero/hero-gold-gown.jpg',
    alt: 'Full-length editorial portrait in a sculptural gold pleated gown, profile pose on a chocolate brown backdrop.',
    objectPosition: '50% 16%',
    objectPositionMobile: '50% 10%',
    recommended: '1400×1800 or larger, portrait',
  },
  'hero-violet-poise': {
    id: 'hero-violet-poise',
    src: '/images/hero/hero-violet-poise.jpg',
    alt: 'Frontal beauty portrait with hand resting under the chin, sculpted hair bow and plum top.',
    objectPosition: '50% 28%',
    objectPositionMobile: '50% 22%',
    recommended: '1600×2000 or larger, portrait',
  },
  'hero-camel-intimacy': {
    id: 'hero-camel-intimacy',
    src: '/images/hero/hero-camel-intimacy.jpg',
    alt: 'Intimate close portrait resting a tilted head on crossed arms in a white top, warm camel backdrop.',
    objectPosition: '50% 30%',
    objectPositionMobile: '50% 24%',
    recommended: '1400×1400 or larger, square or portrait',
  },
  'hero-gold-hoops': {
    id: 'hero-gold-hoops',
    src: '/images/hero/hero-gold-hoops.jpg',
    alt: 'Beauty close-up with shaved head, gold hoop earrings and bronze makeup, eyes averted on an ivory ground.',
    objectPosition: '50% 34%',
    objectPositionMobile: '50% 20%',
    recommended: '1600×2000 or larger, portrait',
  },
  'hero-coin-veil-eyes': {
    id: 'hero-coin-veil-eyes',
    src: '/images/hero/hero-coin-veil-eyes.jpg',
    alt: 'Extreme close-up of a frontal gaze framed by a gold coin veil, crimson backdrop.',
    objectPosition: '50% 32%',
    objectPositionMobile: '50% 28%',
    recommended: '1400×1800 or larger, portrait',
  },

  // ——— Selected work ———
  'work-portrait-white-blazer': {
    id: 'work-portrait-white-blazer',
    src: '/images/work/work-portrait-white-blazer.jpg',
    alt: 'Studio portrait in a tailored white blazer, arms crossed, on a grey backdrop.',
    objectPosition: '50% 20%',
    recommended: '1200×1600 or larger, portrait',
  },
  'work-fashion-red-gown': {
    id: 'work-fashion-red-gown',
    src: '/images/work/work-fashion-red-gown.jpg',
    alt: 'Fashion portrait in a beaded red gown seated against a caramel backdrop.',
    objectPosition: '50% 18%',
    recommended: '1200×1600 or larger, portrait',
  },
  'work-events-graduation': {
    id: 'work-events-graduation',
    src: '/images/work/work-events-graduation.jpg',
    alt: 'Graduation portrait in cap and kente-trimmed stole, smiling on a dark studio backdrop.',
    objectPosition: '50% 18%',
    recommended: '1200×1600 or larger, portrait',
  },
  'work-brand-street-style': {
    id: 'work-brand-street-style',
    src: '/images/work/work-brand-street-style.jpg',
    alt: 'Street-style lookbook frame: checked blazer, denim and a woven burgundy bag against an urban wall.',
    objectPosition: '50% 22%',
    recommended: '1200×1600 or larger, portrait',
  },

  // ——— About + CTA ———
  'about-studio-session': {
    id: 'about-studio-session',
    src: '/images/about/about-studio-session.jpg',
    alt: 'Behind the scenes in the studio: makeup brushed onto a model framed by palm leaves.',
    objectPosition: '50% 30%',
    recommended: '1200×1600 or larger, portrait',
  },
  'cta-black-lace-recline': {
    id: 'cta-black-lace-recline',
    src: '/images/cta/cta-black-lace-recline.jpg',
    alt: 'Portrait in a sheer black floral gown reclining against a cream chair on a camel backdrop.',
    objectPosition: '55% 35%',
    recommended: '1400×1800 or larger, portrait',
  },

  // ——— Intro ———
  'intro-coin-veil-crimson': {
    id: 'intro-coin-veil-crimson',
    src: '/images/intro/intro-coin-veil-crimson.jpg',
    alt: 'Three-quarter beauty portrait wearing a gold coin face-veil against a crimson backdrop.',
    objectPosition: '58% 26%',
    objectPositionMobile: '60% 22%',
    recommended: '1200×1500 or larger, portrait (4:5)',
  },
};

export type HeroWallColumn = {
  id: 'left' | 'center' | 'right';
  /** Ordered images in one loop set; the set is duplicated in the DOM for a seamless wrap. */
  imageIds: string[];
  /** Seconds for one full loop — adjacent columns differ slightly for depth. */
  duration: number;
  /** Negative offset so the seams of neighbouring columns never line up. */
  offset: number;
};

/**
 * Hero photo wall: three vertical tracks drifting upward. Each track renders its
 * `imageIds` twice and translates -50% of its own height, so the loop restarts with
 * no visible seam. Presentation (cell heights, gutter, easing) lives in global.css;
 * only the sequence and pace are content here.
 */
export const heroWall: HeroWallColumn[] = [
  { id: 'left', imageIds: ['hero-sequin-gaze', 'hero-gold-gown'], duration: 52, offset: -8 },
  { id: 'center', imageIds: ['hero-violet-poise', 'hero-camel-intimacy'], duration: 44, offset: -20 },
  { id: 'right', imageIds: ['hero-gold-hoops', 'hero-coin-veil-eyes'], duration: 60, offset: -34 },
];
