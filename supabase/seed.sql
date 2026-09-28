-- ============================================================================
-- Bison's Space — seed (supabase/seed.sql)
-- Runs after migrations on `supabase db reset` (as postgres ⇒ RLS bypassed).
--
-- Reproduces the CURRENT public content exactly — same slugs, same photographs,
-- same ordering, same alt text — so nothing is lost in migration.
--   * Existing photographs keep their static /images/... paths (no re-upload).
--   * No packages are seeded (the site intentionally shows the "Custom session"
--     card until Lazarus confirms real specs/rates). Nothing is invented.
--   * site_settings.maps_url stays '' — no Maps URL was supplied.
-- ============================================================================

-- ——— Images: registry (hero / work / about / cta / intro) ————————————————
insert into public.images (src, alt, object_position, object_position_mobile) values
  ('/images/hero/hero-sequin-gaze.jpg',    'Beauty portrait in a silver sequin gown against a cool grey studio backdrop, hand lifted into long dark hair.', '50% 22%', '50% 18%'),
  ('/images/hero/hero-gold-gown.jpg',      'Full-length editorial portrait in a sculptural gold pleated gown, profile pose on a chocolate brown backdrop.', '50% 16%', '50% 10%'),
  ('/images/hero/hero-violet-poise.jpg',   'Frontal beauty portrait with hand resting under the chin, sculpted hair bow and plum top.', '50% 28%', '50% 22%'),
  ('/images/hero/hero-camel-intimacy.jpg', 'Intimate close portrait resting a tilted head on crossed arms in a white top, warm camel backdrop.', '50% 30%', '50% 24%'),
  ('/images/hero/hero-gold-hoops.jpg',     'Beauty close-up with shaved head, gold hoop earrings and bronze makeup, eyes averted on an ivory ground.', '50% 34%', '50% 20%'),
  ('/images/hero/hero-coin-veil-eyes.jpg', 'Extreme close-up of a frontal gaze framed by a gold coin veil, crimson backdrop.', '50% 32%', '50% 28%'),
  ('/images/work/work-portrait-white-blazer.jpg', 'Studio portrait in a tailored white blazer, arms crossed, on a grey backdrop.', '50% 20%', null),
  ('/images/work/work-fashion-red-gown.jpg',      'Fashion portrait in a beaded red gown seated against a caramel backdrop.', '50% 18%', null),
  ('/images/work/work-events-graduation.jpg',     'Graduation portrait in cap and kente-trimmed stole, smiling on a dark studio backdrop.', '50% 18%', null),
  ('/images/work/work-brand-street-style.jpg',    'Street-style lookbook frame: checked blazer, denim and a woven burgundy bag against an urban wall.', '50% 22%', null),
  ('/images/about/about-studio-session.jpg',      'Behind the scenes in the studio: makeup brushed onto a model framed by palm leaves.', '50% 30%', null),
  ('/images/cta/cta-black-lace-recline.jpg',      'Portrait in a sheer black floral gown reclining against a cream chair on a camel backdrop.', '55% 35%', null),
  ('/images/intro/intro-coin-veil-crimson.jpg',   'Three-quarter beauty portrait wearing a gold coin face-veil against a crimson backdrop.', '58% 26%', '60% 22%');

-- ——— Images: portfolio photographs (crop is 'contain'; no object-position) ———
insert into public.images (src, alt) values
  ('/images/portfolio/pf-coin-veil-close.jpg',    'Close portrait of a model wearing a beaded coin veil against a crimson backdrop.'),
  ('/images/portfolio/pf-coin-veil-profile.jpg',  'Three-quarter view of the same coin veil styling, braids falling over one shoulder.'),
  ('/images/portfolio/pf-violet-hair-b.jpg',      'Model with long straightened hair and a black bow, violet gown, dark studio.'),
  ('/images/portfolio/pf-violet-hair-a.jpg',      'The same violet gown styling turned slightly away, hair over one shoulder.'),
  ('/images/portfolio/pf-violet-hair-c.jpg',      'The same session against a pale wall with a palm leaf, hair fully extended.'),
  ('/images/portfolio/pf-white-knit-close.jpg',   'Close studio portrait in a white ribbed off-shoulder knit on a cream backdrop.'),
  ('/images/portfolio/pf-white-knit-stand.jpg',   'Full-length frame from the same sitting, one hand resting on the backdrop.'),
  ('/images/portfolio/pf-graduation-cap.jpg',     'Graduate in cap and gown with a coloured stole, standing on a brown seamless.'),
  ('/images/portfolio/pf-graduation-seated.jpg',  'The same graduate seated, kente stole and regalia visible, smiling.'),
  ('/images/portfolio/pf-denim-front.jpg',        'Studio portrait in a blue tank top and denim on a pale grey backdrop.'),
  ('/images/portfolio/pf-denim-side.jpg',         'Profile frame from the same sitting, long straight hair down the back.'),
  ('/images/portfolio/pf-street-lookbook.jpg',    'Lookbook frame: checked blazer, shirt and tie with a red bag beside teal shutters.'),
  ('/images/portfolio/pf-crimson-gown.jpg',       'Fashion frame in a beaded crimson gown seated against a camel backdrop.'),
  ('/images/portfolio/pf-gold-sculpture.jpg',     'Full-length fashion study in a sculptural gold and cream gown on a brown seamless.'),
  ('/images/portfolio/pf-makeup-chair.jpg',       'Behind the chair: a makeup brush finishing a look, sparkle top and palm leaf.'),
  ('/images/portfolio/pf-sequin-studio.jpg',      'Studio portrait in a silver sequin gown, one hand raised to the hair.'),
  ('/images/portfolio/pf-white-blazer.jpg',       'Studio portrait in a tailored white blazer, arms folded, on a grey backdrop.'),
  ('/images/portfolio/pf-gold-hoops.jpg',         'Beauty portrait with bare shoulders and gold hoops on a pale pink backdrop.');

-- ——— Projects (all published, current display order) ————————————————
insert into public.projects
  (slug, title, category, status, display_order, cover_image_id, cover_alt, cover_thumb_position)
values
  ('coin-veil-editorial',    'Coin Veil Editorial',         'beauty-fashion', 'published', 1,  (select id from public.images where src='/images/portfolio/pf-coin-veil-close.jpg'),   'Close portrait of a model wearing a beaded coin veil against a crimson backdrop.', '50% 30%'),
  ('violet-hair-story',      'Violet Hair Story',           'beauty-fashion', 'published', 2,  (select id from public.images where src='/images/portfolio/pf-violet-hair-b.jpg'),      'Model with long straightened hair and a black bow, violet gown, dark studio.', '50% 26%'),
  ('white-knit-portraits',   'White Knit Studio Portraits', 'portraits',      'published', 3,  (select id from public.images where src='/images/portfolio/pf-white-knit-close.jpg'),   'Close studio portrait in a white ribbed off-shoulder knit on a cream backdrop.', '50% 30%'),
  ('graduation-celebrations','Graduation Celebrations',     'events',         'published', 4,  (select id from public.images where src='/images/portfolio/pf-graduation-cap.jpg'),     'Graduate in cap and gown with a coloured stole, standing on a brown seamless.', '50% 24%'),
  ('denim-light-portraits',  'Denim & Light Portraits',     'portraits',      'published', 5,  (select id from public.images where src='/images/portfolio/pf-denim-front.jpg'),        'Studio portrait in a blue tank top and denim on a pale grey backdrop.', '50% 26%'),
  ('street-lookbook',        'Street Lookbook',             'brand-stories',  'published', 6,  (select id from public.images where src='/images/portfolio/pf-street-lookbook.jpg'),    'Lookbook frame: checked blazer, shirt and tie with a red bag beside teal shutters.', '50% 30%'),
  ('crimson-gown-editorial', 'Crimson Gown Editorial',      'beauty-fashion', 'published', 7,  (select id from public.images where src='/images/portfolio/pf-crimson-gown.jpg'),       'Fashion frame in a beaded crimson gown seated against a camel backdrop.', '50% 28%'),
  ('gold-sculpture-study',   'Gold Sculpture Fashion Study','beauty-fashion', 'published', 8,  (select id from public.images where src='/images/portfolio/pf-gold-sculpture.jpg'),     'Full-length fashion study in a sculptural gold and cream gown on a brown seamless.', '50% 22%'),
  ('beauty-in-session',      'Beauty in Session',           'beauty-fashion', 'published', 9,  (select id from public.images where src='/images/portfolio/pf-makeup-chair.jpg'),       'Behind the chair: a makeup brush finishing a look, sparkle top and palm leaf.', '50% 30%'),
  ('sequin-studio-portrait', 'Sequin Studio Portrait',      'portraits',      'published', 10, (select id from public.images where src='/images/portfolio/pf-sequin-studio.jpg'),      'Studio portrait in a silver sequin gown, one hand raised to the hair.', '50% 32%'),
  ('white-blazer-portrait',  'White Blazer Studio Portrait','portraits',      'published', 11, (select id from public.images where src='/images/portfolio/pf-white-blazer.jpg'),       'Studio portrait in a tailored white blazer, arms folded, on a grey backdrop.', '50% 28%'),
  ('gold-hoops-beauty',      'Gold Hoops Beauty Portrait',  'portraits',      'published', 12, (select id from public.images where src='/images/portfolio/pf-gold-hoops.jpg'),         'Beauty portrait with bare shoulders and gold hoops on a pale pink backdrop.', '50% 26%');

-- ——— Project galleries (ordered; position 0 is the lead frame) ————————————
insert into public.project_gallery (project_id, image_id, alt, position)
select p.id, i.id, i.alt, g.position
from (values
  ('coin-veil-editorial', '/images/portfolio/pf-coin-veil-close.jpg',   0),
  ('coin-veil-editorial', '/images/portfolio/pf-coin-veil-profile.jpg', 1),
  ('violet-hair-story',   '/images/portfolio/pf-violet-hair-b.jpg',     0),
  ('violet-hair-story',   '/images/portfolio/pf-violet-hair-a.jpg',     1),
  ('violet-hair-story',   '/images/portfolio/pf-violet-hair-c.jpg',     2),
  ('white-knit-portraits','/images/portfolio/pf-white-knit-close.jpg',  0),
  ('white-knit-portraits','/images/portfolio/pf-white-knit-stand.jpg',  1),
  ('graduation-celebrations','/images/portfolio/pf-graduation-cap.jpg',    0),
  ('graduation-celebrations','/images/portfolio/pf-graduation-seated.jpg', 1),
  ('denim-light-portraits','/images/portfolio/pf-denim-front.jpg',      0),
  ('denim-light-portraits','/images/portfolio/pf-denim-side.jpg',       1),
  ('street-lookbook',     '/images/portfolio/pf-street-lookbook.jpg',   0),
  ('crimson-gown-editorial','/images/portfolio/pf-crimson-gown.jpg',    0),
  ('gold-sculpture-study','/images/portfolio/pf-gold-sculpture.jpg',    0),
  ('beauty-in-session',   '/images/portfolio/pf-makeup-chair.jpg',      0),
  ('sequin-studio-portrait','/images/portfolio/pf-sequin-studio.jpg',   0),
  ('white-blazer-portrait','/images/portfolio/pf-white-blazer.jpg',     0),
  ('gold-hoops-beauty',   '/images/portfolio/pf-gold-hoops.jpg',        0)
) as g(slug, src, position)
join public.projects p on p.slug = g.slug
join public.images  i on i.src = g.src;

-- ——— Hero photo wall (columns + ordered images) ————————————————————————
insert into public.hero_columns (id, duration, offset, display_order) values
  ('left',   52,  -8, 0),
  ('center', 44, -20, 1),
  ('right',  60, -34, 2);

insert into public.hero_images (column_id, image_id, alt, position, published)
select h.column_id::public.hero_column, i.id, i.alt, h.position, true
from (values
  ('left',   '/images/hero/hero-sequin-gaze.jpg',    0),
  ('left',   '/images/hero/hero-gold-gown.jpg',      1),
  ('center', '/images/hero/hero-violet-poise.jpg',   0),
  ('center', '/images/hero/hero-camel-intimacy.jpg', 1),
  ('right',  '/images/hero/hero-gold-hoops.jpg',     0),
  ('right',  '/images/hero/hero-coin-veil-eyes.jpg', 1)
) as h(column_id, src, position)
join public.images i on i.src = h.src;

-- ——— Services ("What We Shoot") — same copy + order as the site ——————————
insert into public.services (slug, name, short_description, image_id, display_order, status)
select c.slug, c.name, c.short_description, i.id, c.display_order, 'published'
from (values
  ('portraits',       'Portraits',        'Studio and location portrait sittings built on presence, not poses.', '/images/work/work-portrait-white-blazer.jpg', 0),
  ('beauty-fashion',  'Beauty & Fashion', 'Makeup, styling and light, composed for campaign and editorial use.',  '/images/work/work-fashion-red-gown.jpg',      1),
  ('events',          'Events',           'Graduations, celebrations and milestones, covered with care.',          '/images/work/work-events-graduation.jpg',     2),
  ('brand-stories',   'Brand Stories',    'Lookbooks and product narratives for brands with something to say.',    '/images/work/work-brand-street-style.jpg',    3)
) as c(slug, name, short_description, src, display_order)
join public.images i on i.src = c.src;

-- ——— Packages: intentionally none seeded (nothing invented) ————————————————

-- ——— Site settings (social/contact + WhatsApp; Maps left empty) ————————————
update public.site_settings set
  instagram_url        = 'https://www.instagram.com/bisons_space/',
  behance_url          = 'https://www.behance.net/bisons',
  whatsapp_url         = 'https://wa.me/message/A3OQGDVZH2L5G1',
  whatsapp_catalog_url = 'https://wa.me/c/233554713435',
  maps_url             = ''    -- no Maps URL supplied; stays empty until pasted in
where id = 1;
