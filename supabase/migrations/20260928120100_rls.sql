-- ============================================================================
-- Bison's Space — Row Level Security
-- Migration 2 of 3.
--
-- Rules:
--   * Public visitors (anon) may READ published content only, correctly ordered.
--   * Only allowlisted admins (public.is_admin()) may INSERT/UPDATE/DELETE, and
--     may read drafts. Authenticated non-admins have no write access.
--   * The service_role (server-side only) bypasses RLS — used for seeding and
--     provisioning the first admin. It is NEVER used in browser code.
--   * With no policy for a role/action, access is denied by default.
-- ============================================================================

alter table public.admin_users        enable row level security;
alter table public.images             enable row level security;
alter table public.projects           enable row level security;
alter table public.project_gallery    enable row level security;
alter table public.hero_columns       enable row level security;
alter table public.hero_images        enable row level security;
alter table public.service_categories enable row level security;
alter table public.packages           enable row level security;
alter table public.site_settings      enable row level security;

-- ——— admin_users: only admins can manage the allowlist ——————————————————
create policy admin_users_select on public.admin_users
  for select to authenticated using (public.is_admin ());
create policy admin_users_write on public.admin_users
  for insert to authenticated with check (public.is_admin ());
create policy admin_users_update on public.admin_users
  for update to authenticated using (public.is_admin ()) with check (public.is_admin ());
create policy admin_users_delete on public.admin_users
  for delete to authenticated using (public.is_admin ());

-- ——— images: photographs are public to read; admins manage ——————————————
create policy images_select on public.images
  for select to public using (true);
create policy images_insert on public.images
  for insert to authenticated with check (public.is_admin ());
create policy images_update on public.images
  for update to authenticated using (public.is_admin ()) with check (public.is_admin ());
create policy images_delete on public.images
  for delete to authenticated using (public.is_admin ());

-- ——— projects: public sees published only; admins see/manage all —————————
create policy projects_select on public.projects
  for select to public using (status = 'published' or public.is_admin ());
create policy projects_insert on public.projects
  for insert to authenticated with check (public.is_admin ());
create policy projects_update on public.projects
  for update to authenticated using (public.is_admin ()) with check (public.is_admin ());
create policy projects_delete on public.projects
  for delete to authenticated using (public.is_admin ());

-- ——— project_gallery: readable when the parent project is published ——————
create policy project_gallery_select on public.project_gallery
  for select to public using (
    public.is_admin ()
    or exists (
      select 1 from public.projects p
      where p.id = project_gallery.project_id and p.status = 'published'
    )
  );
create policy project_gallery_insert on public.project_gallery
  for insert to authenticated with check (public.is_admin ());
create policy project_gallery_update on public.project_gallery
  for update to authenticated using (public.is_admin ()) with check (public.is_admin ());
create policy project_gallery_delete on public.project_gallery
  for delete to authenticated using (public.is_admin ());

-- ——— hero_columns: pace/geometry is public to read, admin to write ———————
create policy hero_columns_select on public.hero_columns
  for select to public using (true);
create policy hero_columns_write on public.hero_columns
  for insert to authenticated with check (public.is_admin ());
create policy hero_columns_update on public.hero_columns
  for update to authenticated using (public.is_admin ()) with check (public.is_admin ());
create policy hero_columns_delete on public.hero_columns
  for delete to authenticated using (public.is_admin ());

-- ——— hero_images: public sees published only ————————————————————————————
create policy hero_images_select on public.hero_images
  for select to public using (published or public.is_admin ());
create policy hero_images_insert on public.hero_images
  for insert to authenticated with check (public.is_admin ());
create policy hero_images_update on public.hero_images
  for update to authenticated using (public.is_admin ()) with check (public.is_admin ());
create policy hero_images_delete on public.hero_images
  for delete to authenticated using (public.is_admin ());

-- ——— service_categories: public sees published only ——————————————————————
create policy service_categories_select on public.service_categories
  for select to public using (published or public.is_admin ());
create policy service_categories_insert on public.service_categories
  for insert to authenticated with check (public.is_admin ());
create policy service_categories_update on public.service_categories
  for update to authenticated using (public.is_admin ()) with check (public.is_admin ());
create policy service_categories_delete on public.service_categories
  for delete to authenticated using (public.is_admin ());

-- ——— packages: public sees published only; drafts stay hidden ————————————
create policy packages_select on public.packages
  for select to public using (status = 'published' or public.is_admin ());
create policy packages_insert on public.packages
  for insert to authenticated with check (public.is_admin ());
create policy packages_update on public.packages
  for update to authenticated using (public.is_admin ()) with check (public.is_admin ());
create policy packages_delete on public.packages
  for delete to authenticated using (public.is_admin ());

-- ——— site_settings: public to read, admin to write ———————————————————————
create policy site_settings_select on public.site_settings
  for select to public using (true);
create policy site_settings_update on public.site_settings
  for update to authenticated using (public.is_admin ()) with check (public.is_admin ());

-- ============================================================================
-- Public read model: one ordered, published-only payload for the site.
-- security invoker ⇒ RLS still applies, so anon callers only ever receive
-- published rows. Ordered by display_order / position for stable presentation.
-- ============================================================================
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
         'mapsUrl', s.maps_url)
       from public.site_settings s where s.id = 1),
      '{}'::jsonb),

    'hero', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id,
               'duration', c.duration,
               'offset', c.offset,
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

    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
               'slug', sc.slug, 'title', sc.title, 'blurb', sc.blurb,
               'imageSrc', i.src, 'imageAlt', i.alt, 'imageObjectPosition', i.object_position)
             order by sc.display_order)
      from public.service_categories sc
      left join public.images i on i.id = sc.image_id
      where sc.published), '[]'::jsonb),

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
      where p.status = 'published'), '[]'::jsonb),

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
