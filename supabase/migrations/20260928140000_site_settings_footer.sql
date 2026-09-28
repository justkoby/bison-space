-- ============================================================================
-- Bison's Space — site_settings footer & contact fields
-- Migration 5 of 5.
--
-- Adds the editable footer / contact block to the site_settings singleton so
-- an authorized admin can manage, from /admin/settings:
--
--   studio_location     studio address / location line in the footer
--   contact_email       rendered as a mailto: link when non-empty
--   contact_phone       rendered as a tel: link when non-empty
--   footer_tagline      line under the logo in the footer brand block
--   footer_studio_note  short note in the footer Studio column
--   footer_copyright    bottom copyright line
--
-- Initial values copy TODAY's checked-in footer wording (src/content/site.ts)
-- so the public site looks identical until an admin changes something.
-- contact_email / contact_phone start empty: the public footer hides empty
-- contact fields, and nothing is invented.
--
-- get_public_content() is re-created (create or replace ⇒ existing grants and
-- dependents are preserved) so the settings object carries the six new keys
-- alongside the existing URL keys.
-- ============================================================================

-- ——— 1. New columns ————————————————————————————————————————————————————
alter table public.site_settings
  add column if not exists studio_location    text not null default '',
  add column if not exists contact_email      text not null default '',
  add column if not exists contact_phone      text not null default '',
  add column if not exists footer_tagline     text not null default '',
  add column if not exists footer_studio_note text not null default '',
  add column if not exists footer_copyright   text not null default '';

-- ——— 2. Seed the singleton with today's footer wording ————————————————
-- Matches src/content/site.ts (brand.location / footer.*) at migration time.
-- Empty email/phone stay empty — the footer hides them until supplied.
update public.site_settings
   set studio_location    = 'Adenta, Accra, Ghana',
       footer_tagline     = 'Portrait, beauty, fashion and editorial photography — Adenta, Accra, Ghana.',
       footer_studio_note = 'Sessions by appointment.',
       footer_copyright   = '© 2026 Bison’s Space. Photography by Lazarus Nukunu.'
 where id = 1;

-- ——— 3. Public read model (published-only, ordered) ————————————————————
-- Same body as migration 4 plus the six settings keys.
create or replace function public.get_public_content ()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'settings', coalesce(
      (select jsonb_build_object(
         'instagramUrl', s.instagram_url,
         'behanceUrl', s.behance_url,
         'whatsappUrl', s.whatsapp_url,
         'whatsappCatalogUrl', s.whatsapp_catalog_url,
         'mapsUrl', s.maps_url,
         'studioLocation', s.studio_location,
         'contactEmail', s.contact_email,
         'contactPhone', s.contact_phone,
         'footerTagline', s.footer_tagline,
         'footerStudioNote', s.footer_studio_note,
         'footerCopyright', s.footer_copyright)
       from public.site_settings s where s.id = 1),
      '{}'::jsonb),

    'hero', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id,
               'duration', c.duration,
               'offset', c."offset",
               'images', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'src', i.src,
                          'alt', hi.alt,
                          'objectPosition', coalesce(hi.object_position, i.object_position),
                          'objectPositionMobile', coalesce(hi.object_position_mobile, i.object_position_mobile))
                        order by hi.position)
                 from public.hero_images hi
                 join public.images i on i.id = hi.image_id
                 where hi.column_id = c.id and hi.published), '[]'::jsonb))
             order by c.display_order)
      from public.hero_columns c), '[]'::jsonb),

    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', sv.id,
               'slug', sv.slug,
               'name', sv.name,
               'shortDescription', sv.short_description,
               'imageSrc', i.src,
               'imageAlt', i.alt,
               'imageObjectPosition', i.object_position,
               'order', sv.display_order)
             order by sv.display_order)
      from public.services sv
      left join public.images i on i.id = sv.image_id
      where sv.status = 'published'), '[]'::jsonb),

    'packages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'categorySlug', p.category_slug, 'name', p.name,
               'description', p.description, 'duration', p.duration,
               'retouchedPhotos', p.retouched_photos, 'outfits', p.outfits,
               'price', p.price, 'order', p.display_order,
               'imageSrc', i.src, 'imageAlt', i.alt, 'imageObjectPosition', i.object_position)
             order by p.display_order)
      from public.packages p
      left join public.images i on i.id = p.image_id
      where p.status = 'published'
        and exists (select 1 from public.services sv
                    where sv.slug = p.category_slug and sv.status = 'published')), '[]'::jsonb),

    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
               'slug', pr.slug, 'title', pr.title, 'category', pr.category,
               'order', pr.display_order,
               'cover', case when ci.id is null then null else jsonb_build_object(
                 'src', ci.src, 'alt', pr.cover_alt, 'thumbPosition', pr.cover_thumb_position) end,
               'gallery', coalesce((
                 select jsonb_agg(jsonb_build_object('src', gi.src, 'alt', g.alt)
                        order by g.position)
                 from public.project_gallery g
                 join public.images gi on gi.id = g.image_id
                 where g.project_id = pr.id), '[]'::jsonb))
             order by pr.display_order)
      from public.projects pr
      left join public.images ci on ci.id = pr.cover_image_id
      where pr.status = 'published'), '[]'::jsonb)
  );
$$;

-- The RPC is callable by anyone; RLS on the underlying tables keeps it published-only.
grant execute on function public.get_public_content () to anon, authenticated;
