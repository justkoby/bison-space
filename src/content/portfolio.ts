/**
 * Portfolio projects for Bison’s Space.
 *
 * The shape mirrors the future Supabase table (slug, title, category, cover,
 * gallery, alt text, display order, published): swapping this module for a
 * fetch that returns the same PortfolioProject[] needs no component changes.
 *
 * Titles are neutral and descriptive on purpose — no client names, dates,
 * campaign credits or stories are invented. Images are grouped by shoot as
 * observed in the source photographs; each photograph appears in one project.
 */
import { links } from './site';

export type PortfolioCategory = 'portraits' | 'beauty-fashion' | 'events' | 'brand-stories';

/** Human-readable category names (labels match the homepage service categories). */
export const categoryLabels: Record<PortfolioCategory, string> = {
  portraits: 'Portraits',
  'beauty-fashion': 'Beauty & Fashion',
  events: 'Events',
  'brand-stories': 'Brand Stories',
};

export type PortfolioImage = {
  src: string;
  alt: string;
  /** Deliberate thumbnail crop (object-position). Galleries show the full frame. */
  thumbPosition?: string;
};

export type PortfolioProject = {
  slug: string;
  title: string;
  category: PortfolioCategory;
  cover: PortfolioImage;
  gallery: PortfolioImage[];
  order: number;
  published: boolean;
};

export const portfolioIntro = {
  eyebrow: 'The Portfolio',
  title: 'Stories in focus.',
  body:
    'A working archive of Lazarus Nukunu’s studio and location sessions — portrait, beauty, ' +
    'fashion and event frames made in Accra.',
} as const;

export const portfolioCta = {
  title: 'See your story here.',
  body: 'Every project begins with a conversation — tell us what you have in mind.',
  buttonLabel: 'Enquire on WhatsApp',
} as const;

/** Published projects, in display order. */
export function getPublishedProjects(): PortfolioProject[] {
  return portfolioProjects
    .filter((project) => project.published)
    .sort((a, b) => a.order - b.order);
}

export function getProjectBySlug(slug: string): PortfolioProject | undefined {
  return getPublishedProjects().find((project) => project.slug === slug);
}

/** WhatsApp click-to-chat pre-filled for a similar shoot. */
export function projectEnquiry(project: PortfolioProject): string {
  return `${links.whatsapp}?text=${encodeURIComponent(
    `Hi Bison’s Space! I saw “${project.title}” in your portfolio and I’d like to enquire about a similar shoot.`,
  )}`;
}

export const portfolioProjects: PortfolioProject[] = [
  {
    slug: 'coin-veil-editorial',
    title: 'Coin Veil Editorial',
    category: 'beauty-fashion',
    order: 1,
    published: true,
    cover: {
      src: '/images/portfolio/pf-coin-veil-close.jpg',
      alt: 'Close portrait of a model wearing a beaded coin veil against a crimson backdrop.',
      thumbPosition: '50% 30%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-coin-veil-close.jpg',
        alt: 'Close portrait of a model wearing a beaded coin veil against a crimson backdrop.',
      },
      {
        src: '/images/portfolio/pf-coin-veil-profile.jpg',
        alt: 'Three-quarter view of the same coin veil styling, braids falling over one shoulder.',
      },
    ],
  },
  {
    slug: 'violet-hair-story',
    title: 'Violet Hair Story',
    category: 'beauty-fashion',
    order: 2,
    published: true,
    cover: {
      src: '/images/portfolio/pf-violet-hair-b.jpg',
      alt: 'Model with long straightened hair and a black bow, violet gown, dark studio.',
      thumbPosition: '50% 26%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-violet-hair-b.jpg',
        alt: 'Model with long straightened hair and a black bow, violet gown, dark studio.',
      },
      {
        src: '/images/portfolio/pf-violet-hair-a.jpg',
        alt: 'The same violet gown styling turned slightly away, hair over one shoulder.',
      },
      {
        src: '/images/portfolio/pf-violet-hair-c.jpg',
        alt: 'The same session against a pale wall with a palm leaf, hair fully extended.',
      },
    ],
  },
  {
    slug: 'white-knit-portraits',
    title: 'White Knit Studio Portraits',
    category: 'portraits',
    order: 3,
    published: true,
    cover: {
      src: '/images/portfolio/pf-white-knit-close.jpg',
      alt: 'Close studio portrait in a white ribbed off-shoulder knit on a cream backdrop.',
      thumbPosition: '50% 30%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-white-knit-close.jpg',
        alt: 'Close studio portrait in a white ribbed off-shoulder knit on a cream backdrop.',
      },
      {
        src: '/images/portfolio/pf-white-knit-stand.jpg',
        alt: 'Full-length frame from the same sitting, one hand resting on the backdrop.',
      },
    ],
  },
  {
    slug: 'graduation-celebrations',
    title: 'Graduation Celebrations',
    category: 'events',
    order: 4,
    published: true,
    cover: {
      src: '/images/portfolio/pf-graduation-cap.jpg',
      alt: 'Graduate in cap and gown with a coloured stole, standing on a brown seamless.',
      thumbPosition: '50% 24%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-graduation-cap.jpg',
        alt: 'Graduate in cap and gown with a coloured stole, standing on a brown seamless.',
      },
      {
        src: '/images/portfolio/pf-graduation-seated.jpg',
        alt: 'The same graduate seated, kente stole and regalia visible, smiling.',
      },
    ],
  },
  {
    slug: 'denim-light-portraits',
    title: 'Denim & Light Portraits',
    category: 'portraits',
    order: 5,
    published: true,
    cover: {
      src: '/images/portfolio/pf-denim-front.jpg',
      alt: 'Studio portrait in a blue tank top and denim on a pale grey backdrop.',
      thumbPosition: '50% 26%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-denim-front.jpg',
        alt: 'Studio portrait in a blue tank top and denim on a pale grey backdrop.',
      },
      {
        src: '/images/portfolio/pf-denim-side.jpg',
        alt: 'Profile frame from the same sitting, long straight hair down the back.',
      },
    ],
  },
  {
    slug: 'street-lookbook',
    title: 'Street Lookbook',
    category: 'brand-stories',
    order: 6,
    published: true,
    cover: {
      src: '/images/portfolio/pf-street-lookbook.jpg',
      alt: 'Lookbook frame: checked blazer, shirt and tie with a red bag beside teal shutters.',
      thumbPosition: '50% 30%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-street-lookbook.jpg',
        alt: 'Lookbook frame: checked blazer, shirt and tie with a red bag beside teal shutters.',
      },
    ],
  },
  {
    slug: 'crimson-gown-editorial',
    title: 'Crimson Gown Editorial',
    category: 'beauty-fashion',
    order: 7,
    published: true,
    cover: {
      src: '/images/portfolio/pf-crimson-gown.jpg',
      alt: 'Fashion frame in a beaded crimson gown seated against a camel backdrop.',
      thumbPosition: '50% 28%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-crimson-gown.jpg',
        alt: 'Fashion frame in a beaded crimson gown seated against a camel backdrop.',
      },
    ],
  },
  {
    slug: 'gold-sculpture-study',
    title: 'Gold Sculpture Fashion Study',
    category: 'beauty-fashion',
    order: 8,
    published: true,
    cover: {
      src: '/images/portfolio/pf-gold-sculpture.jpg',
      alt: 'Full-length fashion study in a sculptural gold and cream gown on a brown seamless.',
      thumbPosition: '50% 22%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-gold-sculpture.jpg',
        alt: 'Full-length fashion study in a sculptural gold and cream gown on a brown seamless.',
      },
    ],
  },
  {
    slug: 'beauty-in-session',
    title: 'Beauty in Session',
    category: 'beauty-fashion',
    order: 9,
    published: true,
    cover: {
      src: '/images/portfolio/pf-makeup-chair.jpg',
      alt: 'Behind the chair: a makeup brush finishing a look, sparkle top and palm leaf.',
      thumbPosition: '50% 30%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-makeup-chair.jpg',
        alt: 'Behind the chair: a makeup brush finishing a look, sparkle top and palm leaf.',
      },
    ],
  },
  {
    slug: 'sequin-studio-portrait',
    title: 'Sequin Studio Portrait',
    category: 'portraits',
    order: 10,
    published: true,
    cover: {
      src: '/images/portfolio/pf-sequin-studio.jpg',
      alt: 'Studio portrait in a silver sequin gown, one hand raised to the hair.',
      thumbPosition: '50% 32%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-sequin-studio.jpg',
        alt: 'Studio portrait in a silver sequin gown, one hand raised to the hair.',
      },
    ],
  },
  {
    slug: 'white-blazer-portrait',
    title: 'White Blazer Studio Portrait',
    category: 'portraits',
    order: 11,
    published: true,
    cover: {
      src: '/images/portfolio/pf-white-blazer.jpg',
      alt: 'Studio portrait in a tailored white blazer, arms folded, on a grey backdrop.',
      thumbPosition: '50% 28%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-white-blazer.jpg',
        alt: 'Studio portrait in a tailored white blazer, arms folded, on a grey backdrop.',
      },
    ],
  },
  {
    slug: 'gold-hoops-beauty',
    title: 'Gold Hoops Beauty Portrait',
    category: 'portraits',
    order: 12,
    published: true,
    cover: {
      src: '/images/portfolio/pf-gold-hoops.jpg',
      alt: 'Beauty portrait with bare shoulders and gold hoops on a pale pink backdrop.',
      thumbPosition: '50% 26%',
    },
    gallery: [
      {
        src: '/images/portfolio/pf-gold-hoops.jpg',
        alt: 'Beauty portrait with bare shoulders and gold hoops on a pale pink backdrop.',
      },
    ],
  },
];
