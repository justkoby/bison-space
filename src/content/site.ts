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

/** Hash hrefs point at homepage sections; SiteLink resolves them from any route. */
export const nav: NavItem[] = [
  { label: 'What We Shoot', href: '#shoot' },
  { label: 'Packages', href: '#packages' },
  { label: 'Portfolio', href: '/portfolio' },
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

export type ShootCategory = {
  slug: string;
  title: string;
  blurb: string;
  imageId: string;
};

/** The four session categories Bison’s Space actually offers. */
export const shootCategories: ShootCategory[] = [
  {
    slug: 'portraits',
    title: 'Portraits',
    blurb: 'Studio and location portrait sittings built on presence, not poses.',
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
    blurb: 'Graduations, celebrations and milestones, covered with care.',
    imageId: 'work-events-graduation',
  },
  {
    slug: 'brand-stories',
    title: 'Brand Stories',
    blurb: 'Lookbooks and product narratives for brands with something to say.',
    imageId: 'work-brand-street-style',
  },
];

export const shootSection = {
  eyebrow: 'What We Shoot',
  headline: 'Four kinds of sessions, directed with intent.',
  cardAction: 'See packages',
  linkLabel: 'View full portfolio',
  linkHref: '/portfolio',
} as const;

export type Package = {
  id: string;
  categorySlug: string;
  name: string;
  description: string;
  imageId: string;
  /** Rendered only once the studio has confirmed them. */
  duration?: string;
  retouchedPhotos?: string;
  outfits?: string;
  price?: string;
  confirmed: boolean;
};

/**
 * Confirmed packages only. Left empty until Lazarus supplies names, specs and
 * rates — until then the packages section shows the custom-session enquiry
 * card per category instead of inventing anything.
 */
export const packages: Package[] = [];

export const packagesSection = {
  eyebrow: 'Photography Services',
  headline: 'Sessions & packages.',
  note: 'Every enquiry is answered personally by Lazarus. Rates are quoted per project scope.',
  bookLabel: 'Book',
  custom: {
    name: 'Custom session',
    description:
      'A session shaped around your idea — location, looks and delivery agreed together before we shoot.',
    cta: 'Enquire for details',
  },
} as const;

/** WhatsApp click-to-chat with the category pre-filled in the message. */
export const whatsappEnquiry = (categoryTitle: string) =>
  `${links.whatsapp}?text=${encodeURIComponent(
    `Hi Bison’s Space! I’d like to enquire about a ${categoryTitle} session.`,
  )}`;

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

/**
 * Floating support widget.
 * `mapsUrl` is the Google Maps link for the studio: it was NOT included in the
 * supplied project materials, so it stays empty here (the “Find the studio”
 * action renders as pending) until the real URL is pasted in — never guessed.
 */
export const support = {
  buttonLabel: 'Support',
  closeLabel: 'Close support panel',
  heading: 'How can we help?',
  note:
    'Sessions are arranged by appointment. Send us your preferred date and the type of shoot you have in mind.',
  catalogUrl: 'https://wa.me/c/233554713435',
  mapsUrl: '', // TODO(supplied materials): Google Maps URL for the Adenta studio — missing.
  pendingHint: 'Link pending',
} as const;

export type SupportAction = { id: string; label: string; hint: string; href: string };

export const supportActions: SupportAction[] = [
  { id: 'book', label: 'Book a shoot', hint: 'WhatsApp', href: links.whatsapp },
  { id: 'packages', label: 'View packages', hint: 'WhatsApp catalogue', href: support.catalogUrl },
  { id: 'studio', label: 'Find the studio', hint: 'Google Maps', href: support.mapsUrl },
  { id: 'ask', label: 'Ask a question', hint: 'WhatsApp', href: links.whatsapp },
];
