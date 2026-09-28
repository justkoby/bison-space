-- ============================================================================
-- Bison's Space — content dashboard schema
-- Migration 1 of 3: enums, tables, indexes, helper functions, triggers, views.
--
-- Design mirrors the existing src/content/*.ts shapes so the public site can be
-- migrated without component changes:
--   content/portfolio.ts  -> projects + project_gallery + images
--   content/images.ts     -> images + hero_columns + hero_images
--   content/site.ts       -> service_categories + packages + site_settings
--
-- Authorization is an explicit allowlist (admin_users). RLS lives in migration 2.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ——— Enums ————————————————————————————————————————————————
create type public.portfolio_category as enum (
  'portraits', 'beauty-fashion', 'events', 'brand-stories'
);
create type public.publish_status as enum ('draft', 'published');
create type public.hero_column as enum ('left', 'center', 'right');

-- ——— Authorization allowlist ————————————————————————————————
-- A client account is authorized iff it has a row here (id = auth.users.id).
create table public.admin_users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  label      text,
  created_at timestamptz not null default now()
);

-- ——— Images (photographs) ———————————————————————————————————
-- Legacy site photographs keep their static path in `src` (storage_path null);
-- admin uploads land in the `media` bucket and set both storage_path and src.
create table public.images (
  id           uuid primary key default gen_random_uuid(),
  src          text not null,                 -- public URL or site-relative path
  storage_path text,                          -- path within the 'media' bucket, if uploaded
  alt          text not null default '',
  object_position        text not null default '50% 50%',  -- crop anchor (registry objectPosition)
  object_position_mobile text,                             -- mobile crop anchor, when different
  width        integer,
  height       integer,
  created_at   timestamptz not null default now()
);
create unique index images_src_key on public.images (src);

-- ——— Portfolio projects —————————————————————————————————————
create table public.projects (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  title                text not null,
  category             public.portfolio_category not null,
  status               public.publish_status not null default 'draft',
  display_order        integer not null default 0,
  cover_image_id       uuid references public.images (id) on delete set null,
  cover_alt            text not null default '',
  cover_thumb_position text,                   -- e.g. '50% 30%' (object-position for the tile)
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index projects_status_order_idx on public.projects (status, display_order);

-- Ordered gallery for a project. position 0 is the lead frame.
create table public.project_gallery (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  image_id   uuid not null references public.images (id) on delete restrict,
  alt        text not null default '',
  position   integer not null default 0,
  unique (project_id, position)
);
create index project_gallery_project_idx on public.project_gallery (project_id, position);

-- ——— Hero photo wall ————————————————————————————————————————
-- Pace/geometry per column (content today; editable later) + ordered images.
create table public.hero_columns (
  id            public.hero_column primary key,
  duration      integer not null default 50,   -- seconds for one loop
  offset        integer not null default 0,    -- negative offset so seams don't align
  display_order integer not null default 0
);

create table public.hero_images (
  id                   uuid primary key default gen_random_uuid(),
  column_id            public.hero_column not null references public.hero_columns (id) on delete cascade,
  image_id             uuid not null references public.images (id) on delete restrict,
  alt                  text not null default '',
  object_position      text,                   -- optional per-slot override of images.object_position
  object_position_mobile text,                 -- optional per-slot override
  position             integer not null default 0,
  published            boolean not null default true,
  unique (column_id, position)
);
create index hero_images_col_idx on public.hero_images (column_id, position);

-- ——— Services ("What We Shoot") + packages ————————————————————
create table public.service_categories (
  slug          text primary key,
  title         text not null,
  blurb         text not null default '',
  image_id      uuid references public.images (id) on delete set null,
  display_order integer not null default 0,
  published     boolean not null default true
);
create index service_categories_order_idx on public.service_categories (display_order);

-- Packages may be incomplete (no price/specs) and stay 'draft' until published.
create table public.packages (
  id               uuid primary key default gen_random_uuid(),
  category_slug    text not null references public.service_categories (slug) on delete cascade,
  name             text not null,
  description      text not null default '',
  image_id         uuid references public.images (id) on delete set null,
  duration         text,
  retouched_photos text,
  outfits          text,
  price            text,
  display_order    integer not null default 0,
  status           public.publish_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index packages_cat_idx on public.packages (category_slug, display_order);

-- ——— Site settings (singleton) ————————————————————————————————
create table public.site_settings (
  id                   integer primary key default 1 check (id = 1),
  instagram_url        text not null default '',
  behance_url          text not null default '',
  whatsapp_url         text not null default '',
  whatsapp_catalog_url text not null default '',
  maps_url             text not null default '',  -- empty until supplied; never guessed
  updated_at           timestamptz not null default now()
);
insert into public.site_settings (id) values (1);

-- ——— Helper functions ————————————————————————————————————————
-- True when the current JWT belongs to an allowlisted admin account.
-- security definer + fixed search_path so it can read admin_users inside RLS
-- without recursion and without exposing that table publicly.
create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

create or replace function public.set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at ();

create trigger packages_set_updated_at
  before update on public.packages
  for each row execute function public.set_updated_at ();

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at ();
