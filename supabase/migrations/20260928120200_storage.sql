-- ============================================================================
-- Bison's Space — Storage
-- Migration 3 of 3: the 'media' bucket + object policies.
--
--   * Objects are publicly readable (the photographs are public anyway).
--   * Only allowlisted admins may upload / replace / delete objects.
--   * The bucket enforces image MIME types and a 12 MiB size cap server-side;
--     the admin uploader validates the same rules client-side for fast feedback.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  12 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read of any object in the bucket.
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select to public
  using (bucket_id = 'media');

-- Admin-only write access (upload / replace / delete).
drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin ());

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin ())
  with check (bucket_id = 'media' and public.is_admin ());

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin ());
