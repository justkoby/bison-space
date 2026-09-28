# Admin setup guide — Bison's Space content dashboard

A private `/admin` dashboard backed by **Supabase Auth + Postgres + Storage**. It
lets authorized studio accounts edit the portfolio, hero wall, services, packages
and site settings — while the **public site keeps rendering the checked-in static
content until you explicitly verify and flip a flag.**

Nothing here changes the live site on its own. The public bundle still imports
`src/content/*.ts`; the Supabase client and the whole admin UI are code-split into
a separate chunk that only loads when someone visits `/admin`.

---

## 1. How the cutover works (read this first)

`VITE_CONTENT_SOURCE` controls where the **public** site reads content:

| Value      | Behaviour                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------ |
| `static`   | **Default.** Public site renders `src/content/*.ts`. Supabase is used only by `/admin`.       |
| `supabase` | Public site reads published content from the `get_public_content()` RPC, **falling back to static on any error** so the site never renders blank. |

The admin dashboard always talks to Supabase regardless of the flag. Keep the flag
at `static` in production until you have run the verification steps in §7 and
confirmed the seeded data matches the live site. Only then set it to `supabase`.

> The service-role key **never** goes in browser code. It bypasses Row Level
> Security and is only for the Node scripts (seeding, provisioning the first
> admin). Only `VITE_*` variables reach the browser.

---

## 2. Prerequisites

- Node 18+ (this repo was built on Node 22).
- Docker Desktop running — required by the Supabase CLI for a local stack.
- Supabase CLI: `npm i -g supabase` **or** `brew install supabase/tap/supabase`
  (Windows: `scoop install supabase` or `winget install Supabase.CLI`).

Check with `supabase --version` and `docker info`.

---

## 3. Start a local Supabase

From the repo root:

```bash
supabase start
```

This prints the local URLs and keys, e.g.:

```
API URL:        http://127.0.0.1:54321
anon key:       eyJ...   (public — safe for the browser)
service_role key: eyJ...  (SECRET — server scripts only)
```

### Apply migrations + seed

```bash
supabase db reset
```

`db reset` runs every file in `supabase/migrations/*` in order, then
`supabase/seed.sql`. The migrations create:

1. `20260928120000_schema.sql` — enums, 9 tables, indexes, `is_admin()`,
   `set_updated_at()` triggers, and the `site_settings` singleton row.
2. `20260928120100_rls.sql` — Row Level Security policies + the
   `get_public_content()` RPC (published-only, ordered).
3. `20260928120200_storage.sql` — the `media` bucket + Storage policies.
4. `20260928130000_services.sql` — **reuses** the existing tables (no duplicates):
   renames `service_categories` → `services` and aligns it to a UUID primary key,
   unique `slug`, `name` / `short_description`, a `draft|published` `status` enum
   (replacing the boolean), `created_at` / `updated_at` + trigger and a
   status+order index; adds timeline columns to `project_gallery` and
   `hero_images`; and re-creates `get_public_content()` so it returns the key
   `services` (was `categories`). It also makes `services.slug` **permanent** (a
   `BEFORE UPDATE` trigger rejects renames, because `packages.category_slug`
   references it) and gates packages so they are public **only when both the
   package and its parent service are published**. Storage is intentionally
   unchanged — service photographs live in the same public `media` bucket.

The seed re-inserts **every current photograph, project, slug, gallery order,
hero column and site link** from the static modules, so image associations and
slugs are preserved. Legacy photos keep their `/images/...` paths (no re-upload);
only new admin uploads land in the `media` bucket. **No packages, prices, client
names or Maps URL are invented** — `maps_url` is seeded empty and no packages are
seeded, so those stay pending until you add them.

---

## 4. Configure the app environment

```bash
cp .env.example .env.local
```

Edit `.env.local` (git-ignored) with the values printed by `supabase start`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_CONTENT_SOURCE=static

# Server-side only — used by scripts/verify-supabase.mjs and provisioning:
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

Restart the dev server (`npm run dev`) so Vite picks up the new env.

---

## 5. Create the first admin account

Authorization is an **explicit allowlist**: a signed-in user can only edit if
their `auth.users.id` has a row in `public.admin_users`. RLS enforces this on
every write; the client-side check only drives the UI.

1. **Create the auth user.** Easiest for local dev is the Studio UI at
   `http://127.0.0.1:54321` → *Authentication* → *Add user* → create with an
   email + password (confirm the email so it can sign in).
   For production, invite the client from the dashboard's *Authentication* panel.

2. **Allowlist them.** Run this in the SQL editor (Studio → *SQL*), substituting
   the real email:

   ```sql
   insert into public.admin_users (id, email, label)
   select id, email, 'Studio owner'
   from auth.users
   where email = 'you@studio.com';
   ```

   To add more editors later, repeat with their email. To revoke access, delete
   their `admin_users` row — they immediately lose all write access (RLS denies).

   > Alternatively, once one admin exists, they can be added from SQL only; the
   > dashboard does not currently expose an allowlist editor. Manage `admin_users`
   > directly in the database.

---

## 6. Use the dashboard

Visit `http://localhost:5173/admin` (dev) and sign in with the allowlisted
account.

- **Portfolio** — create/edit projects: title, auto-derived (or manual) slug,
  category, cover image + alt + thumbnail crop, an **ordered** gallery (position 1
  is the lead frame), per-frame alt text, display order, and draft/published
  status. Delete asks for confirmation. Drafts never appear publicly.
- **Hero wall** — order frames within each of the three drifting columns, edit alt
  text, hide/show a frame, add or remove frames, and preview the composed order.
- **Services** — the “What We Shoot” session tiles: name, a **permanent** slug
  (set once at creation — it can’t be renamed later because packages link to it),
  photograph, short description, display order (arrow reorder) and draft/published
  status. Only published services render publicly. Deleting a service also removes
  any packages filed under it (the slug foreign key cascades).
- **Packages** — add confirmed packages under each service. **Incomplete packages
  stay draft**; price/specs are optional so you can save a work-in-progress without
  publishing it. A package shows publicly **only when it is published and its parent
  service is published** — unpublishing a service hides its packages too. Nothing is
  invented.
- **Settings** — Instagram, Behance, WhatsApp + WhatsApp catalogue, and the Google
  Maps URL. Each field must be blank or a valid `http(s)` URL. **Leave Maps blank**
  until a real studio address is confirmed; while blank the public site keeps its
  "location pending" state.

Image uploads validate file type (JPEG/PNG/WebP/AVIF) and size (≤ 12 MB) and show
a clear, friendly error otherwise.

---

## 7. Verify before flipping the public cutover

Run these from the repo root:

```bash
npm run typecheck         # TypeScript across the whole app
npm run build             # production build; confirms the admin chunk is split out
npm run verify:content    # pure-logic checks on the public-read mapping (no DB needed)
npm run verify:supabase   # integration checks against your local stack (needs §3–§5)
```

`verify:supabase` exercises the two security-critical behaviours:

- **Public reads** — as the `anon` role, `get_public_content()` returns only
  published projects/packages/services/hero frames, correctly ordered, and a direct
  table read of `projects` never returns a `draft` row. A `draft` service created
  via the service role is invisible to `anon` until it is published, and a
  **published package under a draft service** stays invisible until the service is
  published too.
- **Unauthorized writes** — as `anon`, inserts into `projects` / `services` and
  uploads to the `media` bucket are **denied outright**. Because RLS *hides* rows
  (so PostgREST reports success with **zero affected rows** rather than an error),
  blocked updates/deletes are proven against a **real row**: the script asserts 0
  rows were affected **and** the row is unchanged / still present afterwards. With
  an allowlisted admin (`BS_ADMIN_EMAIL` / `BS_ADMIN_PASSWORD` set in `.env.local`),
  the same writes **succeed**.

Only after all of these pass, and you have eyeballed the seeded content against
the live site, set `VITE_CONTENT_SOURCE=supabase` and rebuild. If anything looks
wrong, revert the flag to `static` — the site instantly returns to the checked-in
content with no data loss.

---

## 8. Deploying to a hosted Supabase (later)

1. `supabase link --project-ref <ref>` then `supabase db push` to apply migrations
   to the hosted project (or run the SQL in the hosted dashboard).
2. Re-seed content on the hosted project (or migrate rows) — do **not** push local
   auth users; create real client accounts in the hosted dashboard and allowlist
   them as in §5.
3. Create the `media` bucket on the hosted project (the storage migration does this
   automatically via `db push`).
4. Set the hosted `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in your host's
   environment (e.g. Vercel). Keep `VITE_CONTENT_SOURCE=static` until §7 passes
   against the hosted project.
5. The SPA fallback (`vercel.json`) already routes `/admin` and every `/admin/*`
   sub-path to `index.html`, so a refresh on any admin page works.

---

## 9. Security notes

- **RLS is the boundary.** Every table has RLS enabled; with no matching policy a
  role is denied by default. Writes require `public.is_admin()` (a
  `security definer` function reading the `admin_users` allowlist).
- **`get_public_content()` is `security invoker`** — RLS still applies, so an anon
  caller can only ever receive published rows, even though the RPC is executable by
  anyone.
- **The `media` bucket** is public-read, admin-write only (Storage policies mirror
  the table rules).
- **The anon key is safe to expose**; the **service-role key is not** and is
  deliberately absent from `src/` — it lives only in `.env.local` for Node scripts.
