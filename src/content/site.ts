/**
 * Site-wide content for Bison’s Space.
 * Keep copy, links and navigation here — presentation lives in src/components.
 * Swapping this module for a CMS/admin fetch later requires no component changes.
 */

export const brand = {
  name: 'Bison’s Space',
  founder: 'Lazarus Nukunu',
  location: 'Adenta, Accra, Ghana',
  disciplines: ['Portrait', 'Beauty', 'Fashion', 'Editorial'],
} as const;

export const links = {
  instagram: 'https://www.instagram.com/bisons_space/',
  behance: 'https://www.behance.net/bisons',
  whatsapp: 'https://wa.me/message/A3OQGDVZH2L5G1',
} as const;

export type NavItem = { label: string; href: string; external?: boolean };

/**
 * Portfolio / About point at in-page sections for now; when the standalone
 * pages land, change these hrefs to '/portfolio' and '/about' here only.
 */
export const nav: NavItem[] = [
  { label: 'Portfolio', href: '#work' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export const hero = {
  /** Small caption line at the foot of the collage */
  caption: 'Portrait — Beauty — Fashion — Editorial',
  captionLocation: 'Accra, Ghana',
} as const;

export const intro = {
  headline: 'Portraits with presence. Stories worth keeping.',
  body:
    'Bison’s Space is the studio of Lazarus Nukunu, a visual storyteller working from Adenta, Accra. ' +
    'Across portrait, beauty, fashion and editorial frames, the work pairs deliberate light with quiet ' +
    'direction — images that hold their presence long after the shutter closes.',
  imageId: 'intro-coin-veil-crimson',
} as const;

export type WorkCategory = {
  slug: string;
  title: string;
  blurb: string;
  imageId: string;
};

export const workCategories: WorkCategory[] = [
  {
    slug: 'portraits',
    title: 'Portraits',
    blurb: 'Studio and location portraits built on presence, not poses.',
    imageId: 'work-portrait-white-blazer',
  },
  {
    slug: 'beauty-fashion',
    title: 'Beauty & Fashion',
    blurb: 'Makeup, styling and light, composed for campaign and editorial use.',
    imageId: 'work-fashion-red-gown',
  },
  {
    slug: 'events',
    title: 'Events',
    blurb: 'Graduations, celebrations and milestones, photographed with care.',
    imageId: 'work-events-graduation',
  },
  {
    slug: 'brand-stories',
    title: 'Brand Stories',
    blurb: 'Lookbooks and product narratives for brands with something to say.',
    imageId: 'work-brand-street-style',
  },
];

export const workSection = {
  eyebrow: 'Selected Work',
  headline: 'Four ways into the archive.',
  linkLabel: 'View full portfolio',
  linkHref: '#work', // becomes '/portfolio' when the page lands
} as const;

export type Service = {
  index: string;
  title: string;
  body: string;
};

export const servicesSection = {
  eyebrow: 'Photography Services',
  headline: 'Sessions, directed end to end.',
  note: 'Every enquiry is answered personally by Lazarus. Rates are quoted per project scope.',
  enquireLabel: 'Enquire',
} as const;

export const services: Service[] = [
  {
    index: '01',
    title: 'Portrait Sessions',
    body: 'Individual, family and milestone portraits, directed from first frame to final retouch.',
  },
  {
    index: '02',
    title: 'Beauty & Fashion',
    body: 'Editorial and campaign imagery developed with makeup artists and stylists.',
  },
  {
    index: '03',
    title: 'Events',
    body: 'Considered coverage for graduations, launches and celebrations.',
  },
  {
    index: '04',
    title: 'Brand & Commercial Shoots',
    body: 'Product and brand imagery for campaigns, catalogues and social.',
  },
];

export const about = {
  eyebrow: 'About Lazarus',
  headline: 'The eye behind the space.',
  // TODO(admin): replace with Lazarus’s full biography when the About page lands.
  body:
    'Lazarus Nukunu is a portrait and fashion photographer based in Adenta, Accra. He founded Bison’s ' +
    'Space to give every subject — model, graduate, founder or family — the same considered direction: ' +
    'honest light, patient framing, and images that age gracefully.',
  imageId: 'about-studio-session',
  imageCaption: 'In session — light, direction and calm.',
  linkLabel: 'Read the full story',
  linkHref: '#about', // becomes '/about' when the page lands
} as const;

export const booking = {
  eyebrow: 'Bookings open',
  headline: 'Let’s create something worth remembering.',
  body: 'Studio and location sessions across Accra. Tell Lazarus what you have in mind — dates, ideas, references — and the studio will reply with availability.',
  buttonLabel: 'Enquire on WhatsApp',
  imageId: 'cta-black-lace-recline',
} as const;

export const footer = {
  tagline: 'Portrait, beauty, fashion and editorial photography — Adenta, Accra, Ghana.',
  studioNote: 'Sessions by appointment.',
  copyright: `© ${new Date().getFullYear()} Bison’s Space. Photography by Lazarus Nukunu.`,
} as const;
