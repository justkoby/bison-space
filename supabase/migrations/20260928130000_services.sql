-- ============================================================================
-- Bison's Space — services table alignment + timeline columns
-- Migration 4 of 4.
--
-- The portfolio / hero / services tables already exist (migrations 1–3) and are
-- seeded; this migration REUSES them — no duplicate tables, no data loss — and
-- aligns them with the requested field set:
--
--   requested name       existing table (reused)
--   ------------------   ----------------------------------------------------
--   portfolio_projects ≡ public.projects          (uuid pk, title, unique slug,
--                                                  category, cover image, status
--                                                  draft|published, display_order,
--                                                  created_at, updated_at)
--   portfolio_images   ≡ public.project_gallery   (uuid pk, project fk ON DELETE
--                                                  CASCADE, alt, position) + the
--                                                  shared public.images registry
--   hero_slides        ≡ public.hero_images       (uuid pk, alt, position,
--                                                  published flag) + images registry
--   services           ≡ public.service_categories  ← renamed + aligned here
--
-- Changes in this migration:
--   1. service_categories → services: uuid primary key, unique slug, `name` and
--      `short_description` columns, draft|published `status` (replacing the
--      boolean), created_at / updated_at + updated_at trigger, status+order index.
--      ("Full page content" and "icon" fields are intentionally NOT added: the
--      current design has no per-service pages and uses a photograph, not icons.)
--   2. project_gallery.created_at and hero_images.created_at / updated_at so
--      every content row carries a timeline.
--   3. RLS: the services select policy is re-created on `status` (the boolean is
--      dropped); write policies stay allowlisted-admin-only (renamed for clarity).
--      packages_select is re-created so a package is public ONLY when it is
--      itself published AND its parent service is published (a draft service
--      hides its packages), mirroring project_gallery_select's parent check.
--   4. get_public_content() returns the key `services` (was `categories`) with
--      name / shortDescription / order fields, and gates packages through a
--      published service. security invoker ⇒ RLS still applies, so anon callers
--      only ever receive published rows.
--   5. services.slug is PERMANENT: packages.category_slug references it without
--      ON UPDATE CASCADE, so the dashboard treats slug as create-only and a
--      BEFORE UPDATE trigger rejects any slug change at the data layer. (The
--      alternative — re-pointing packages at services.id — is a larger change
--      across the app and seed; not needed while slugs are immutable.)
--
-- Dependency ordering: the old get_public_content() body and the
-- service_categories_select policy both reference the columns we rename/drop
-- (`title`, `blurb`, `published`). PostgreSQL records those as dependencies, so
-- both are dropped FIRST and re-created at the end. Without this the migration
-- would fail with "cannot drop/rename column because other objects depend on it".
--
-- Storage: intentionally unchanged — service photographs live in the existing
-- public 'media' bucket (public read; admin-only upload/replace/delete; image
-- MIME types + 12 MiB cap enforced server-side), exactly like portfolio/hero.
-- ============================================================================

-- ——— 0. Drop dependents on the columns we are about to change ———————————
-- The public read model is re-created below with the `services` key.
drop function if exists public.get_public_content ();
-- The select policy uses the boolean `published`, replaced by `status` below.
drop policy if exists service_categories_select on public.service_categories;

-- ——— 1. services (was service_categories) ————————————————————————————
alter table public.service_categories rename to services;

-- UUID primary key; slug stays the human-readable unique key (packages still
-- reference it). The packages FK is re-pointed explicitly because it currently
-- depends on the old slug primary key.
alter table public.packages drop constraint packages_category_slug_fkey;
alter table public.services add column id uuid not null default gen_random_uuid();
alter table public.services drop constraint service_categories_pkey;
alter table public.services add primary key (id);
alter table public.services add constraint services_slug_key unique (slug);
alter table public.packages
  add constraint packages_category_slug_fkey
  foreign key (category_slug) references public.services (slug) on delete cascade;

-- Field names matching the requested vocabulary.
alter table public.services rename column title to name;
alter table public.services rename column blurb to short_description;

-- Publication status as the shared enum (migrated from the boolean).
alter table public.services add column status public.publish_status not null default 'draft';
update public.services
   set status = case when published then 'published'::public.publish_status
                     else 'draft'::public.publish_status end;
alter table public.services drop column published;

-- Timeline + ordering index + trigger.
alter table public.services add column created_at timestamptz not null default now();
alter table public.services add column updated_at timestamptz not null default now();

drop index if exists public.service_categories_order_idx;
create index services_status_order_idx on public.services (status, display_order);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at ();

-- The slug is permanent. packages.category_slug references services.slug with
-- ON DELETE CASCADE but no ON UPDATE CASCADE, so renaming a service that has
-- packages would fail (or orphan rows). The dashboard makes slug create-only;
-- this guard enforces the same rule for every client at the data layer.
create or replace function public.services_guard_slug ()
returns trigger
language plpgsql
as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'A service slug is permanent because its packages reference it. Create a new service instead of renaming.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger services_slug_immutable
  before update on public.services
  for each row execute function public.services_guard_slug ();

-- ——— 2. Timeline columns for gallery + hero slides ————————————————————
alter table public.project_gallery add column created_at timestamptz not null default now();

alter table public.hero_images add column created_at timestamptz not null default now();
alter table public.hero_images add column updated_at timestamptz not null default now();

create trigger hero_images_set_updated_at
  before update on public.hero_images
  for each row execute function public.set_updated_at ();

-- ——— 3. RLS for services —————————————————————————————————————————————
-- Public visitors read published services only; admins read drafts and manage.
-- The write policies followed the table rename; give them matching names.
create policy services_select on public.services
  for select to public using (status = 'published' or public.is_admin ());

alter policy service_categories_insert on public.services rename to services_insert;
alter policy service_categories_update on public.services rename to services_update;
alter policy service_categories_delete on public.services rename to services_delete;

-- Packages are public only when the package is published AND its parent service
-- is published, so unpublishing a service also hides its packages. Admins still
-- read every package. The subquery is not self-referential (packages → services),
-- so there is no policy recursion.
drop policy if exists packages_select on public.packages;
create policy packages_select on public.packages
  for select to public using (
    public.is_admin ()
    or (
      status = 'published'
      and exists (
        select 1 from public.services sv
        where sv.slug = packages.category_slug and sv.status = 'published'
      )
    )
  );

-- ——— 4. Public read model (published-only, ordered) ———————————————————
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
