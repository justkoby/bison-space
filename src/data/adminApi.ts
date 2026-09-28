/**
 * Admin content API — all writes go through the anon client and are authorized
 * by Row Level Security (only allowlisted admins succeed). Every function
 * surfaces a human-readable error message for the dashboard UI.
 *
 * The service-role key is never used here or anywhere in the browser.
 */
import { getSupabase } from '../lib/supabaseClient';
import type {
  ImageRow,
  ProjectRow,
  GalleryRow,
  HeroColumnRow,
  HeroImageRow,
  ServiceRow,
  PackageRow,
  SiteSettingsRow,
  PortfolioCategory,
  PublishStatus,
  HeroColumnId,
  GalleryItem,
} from '../lib/types';

export const MEDIA_BUCKET = 'media';
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MiB, matches the bucket limit
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Wrap a Supabase error (or unknown throw) into a friendly message. */
export function friendlyError(error: unknown, fallback = 'Something went wrong.'): string {
  const err = error as { message?: string; code?: string; details?: string } | null;
  const message = err?.message ?? fallback;
  if (err?.code === '23505') return 'That value must be unique (a duplicate already exists).';
  if (err?.code === '23503') return 'Linked record is missing — refresh and try again.';
  if (/row-level security|new row violates|permission denied/i.test(message)) {
    return 'You are not authorized to make this change. Only allowlisted admin accounts can edit.';
  }
  return err?.details ? `${message} — ${err.details}` : message;
}

// ——— Image upload ————————————————————————————————————————————

export type UploadValidation = { ok: true } | { ok: false; message: string };

/** Validate a file before upload: type + size, with specific, useful messages. */
export function validateImageFile(file: File): UploadValidation {
  if (!file) return { ok: false, message: 'No file selected.' };
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      ok: false,
      message: `Unsupported file type “${file.type || 'unknown'}”. Use JPEG, PNG, WebP or AVIF.`,
    };
  }
  if (file.size <= 0) return { ok: false, message: 'That file is empty.' };
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return { ok: false, message: `File is ${mb} MB — the limit is 12 MB. Please compress it.` };
  }
  return { ok: true };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Read intrinsic pixel dimensions (best-effort; null on failure). */
function readDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Upload a photograph to the `media` bucket and register it in `images`.
 * `folder` groups objects (e.g. "portfolio", "hero", "packages").
 */
export async function uploadImage(file: File, folder: string, alt = ''): Promise<ImageRow> {
  const validation = validateImageFile(file);
  if (!validation.ok) throw new Error(validation.message);

  const supabase = getSupabase();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder}/${Date.now()}-${slugify(file.name)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    if (/The resource already exists/i.test(uploadError.message)) {
      throw new Error('A file with that name already exists. Rename it and try again.');
    }
    throw new Error(friendlyError(uploadError, 'Upload failed.'));
  }

  const { data: publicUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  const { width, height } = await readDimensions(file);

  const { data, error } = await supabase
    .from('images')
    .insert({ src: publicUrlData.publicUrl, storage_path: path, alt, width, height })
    .select()
    .single<ImageRow>();
  if (error) {
    // Best-effort cleanup so an orphaned object isn't left behind.
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    throw new Error(friendlyError(error, 'Could not register the uploaded image.'));
  }
  return data;
}

export async function listImages(): Promise<ImageRow[]> {
  const { data, error } = await getSupabase()
    .from('images')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(friendlyError(error, 'Could not load images.'));
  return (data ?? []) as ImageRow[];
}

// ——— Projects + galleries ————————————————————————————————————

export async function listProjects(): Promise<ProjectRow[]> {
  const { data, error } = await getSupabase()
    .from('projects')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(friendlyError(error, 'Could not load projects.'));
  return (data ?? []) as ProjectRow[];
}

export async function getProject(id: string): Promise<ProjectRow> {
  const { data, error } = await getSupabase()
    .from('projects')
    .select('*')
    .eq('id', id)
    .single<ProjectRow>();
  if (error) throw new Error(friendlyError(error, 'Could not load that project.'));
  return data;
}

export async function getGallery(projectId: string): Promise<GalleryRow[]> {
  const { data, error } = await getSupabase()
    .from('project_gallery')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });
  if (error) throw new Error(friendlyError(error, 'Could not load the gallery.'));
  return (data ?? []) as GalleryRow[];
}

export type ProjectInput = {
  slug: string;
  title: string;
  category: PortfolioCategory;
  status: PublishStatus;
  displayOrder: number;
  coverImageId: string | null;
  coverAlt: string;
  coverThumbPosition: string | null;
};

/** Replace a project's ordered gallery (delete + reinsert by position). */
async function replaceGallery(projectId: string, items: GalleryItem[]): Promise<void> {
  const supabase = getSupabase();
  const { error: delError } = await supabase
    .from('project_gallery')
    .delete()
    .eq('project_id', projectId);
  if (delError) throw new Error(friendlyError(delError, 'Could not clear the existing gallery.'));

  if (items.length === 0) return;
  const rows = items.map((item, index) => ({
    project_id: projectId,
    image_id: item.imageId,
    alt: item.alt,
    position: index,
  }));
  const { error } = await supabase.from('project_gallery').insert(rows);
  if (error) throw new Error(friendlyError(error, 'Could not save the gallery.'));
}

export async function createProject(
  input: ProjectInput,
  gallery: GalleryItem[],
): Promise<ProjectRow> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      slug: input.slug,
      title: input.title,
      category: input.category,
      status: input.status,
      display_order: input.displayOrder,
      cover_image_id: input.coverImageId,
      cover_alt: input.coverAlt,
      cover_thumb_position: input.coverThumbPosition,
    })
    .select()
    .single<ProjectRow>();
  if (error) {
    if (error.code === '23505') throw new Error('That slug is already in use. Choose another.');
    throw new Error(friendlyError(error, 'Could not create the project.'));
  }
  await replaceGallery(data.id, gallery);
  return data;
}

export async function updateProject(
  id: string,
  input: ProjectInput,
  gallery: GalleryItem[],
): Promise<ProjectRow> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('projects')
    .update({
      slug: input.slug,
      title: input.title,
      category: input.category,
      status: input.status,
      display_order: input.displayOrder,
      cover_image_id: input.coverImageId,
      cover_alt: input.coverAlt,
      cover_thumb_position: input.coverThumbPosition,
    })
    .eq('id', id)
    .select()
    .single<ProjectRow>();
  if (error) {
    if (error.code === '23505') throw new Error('That slug is already in use. Choose another.');
    throw new Error(friendlyError(error, 'Could not update the project.'));
  }
  await replaceGallery(id, gallery);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await getSupabase().from('projects').delete().eq('id', id);
  if (error) throw new Error(friendlyError(error, 'Could not delete the project.'));
}

/** Persist a new display order for a set of project ids. */
export async function reorderProjects(orderedIds: string[]): Promise<void> {
  const supabase = getSupabase();
  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabase
      .from('projects')
      .update({ display_order: index + 1 })
      .eq('id', orderedIds[index]);
    if (error) throw new Error(friendlyError(error, 'Could not reorder projects.'));
  }
}

// ——— Hero manager ——————————————————————————————————————————————

export async function listHeroColumns(): Promise<HeroColumnRow[]> {
  const { data, error } = await getSupabase()
    .from('hero_columns')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(friendlyError(error, 'Could not load hero columns.'));
  return (data ?? []) as HeroColumnRow[];
}

export async function listHeroImages(): Promise<HeroImageRow[]> {
  const { data, error } = await getSupabase()
    .from('hero_images')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw new Error(friendlyError(error, 'Could not load hero images.'));
  return (data ?? []) as HeroImageRow[];
}

export async function addHeroImage(
  columnId: HeroColumnId,
  imageId: string,
  alt: string,
  position: number,
): Promise<void> {
  const { error } = await getSupabase()
    .from('hero_images')
    .insert({ column_id: columnId, image_id: imageId, alt, position, published: true });
  if (error) throw new Error(friendlyError(error, 'Could not add the hero image.'));
}

export async function updateHeroImage(
  id: string,
  patch: Partial<Pick<HeroImageRow, 'alt' | 'published' | 'position'>>,
): Promise<void> {
  const { error } = await getSupabase().from('hero_images').update(patch).eq('id', id);
  if (error) throw new Error(friendlyError(error, 'Could not update the hero image.'));
}

export async function removeHeroImage(id: string): Promise<void> {
  const { error } = await getSupabase().from('hero_images').delete().eq('id', id);
  if (error) throw new Error(friendlyError(error, 'Could not remove the hero image.'));
}

/** Persist ordering for one column (array of hero_images ids in order). */
export async function reorderHeroColumn(columnId: HeroColumnId, orderedIds: string[]): Promise<void> {
  const supabase = getSupabase();
  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabase
      .from('hero_images')
      .update({ position: index })
      .eq('id', orderedIds[index])
      .eq('column_id', columnId);
    if (error) throw new Error(friendlyError(error, 'Could not reorder the hero column.'));
  }
}

// ——— Services + packages ——————————————————————————————————————

export async function listServices(): Promise<ServiceRow[]> {
  const { data, error } = await getSupabase()
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(friendlyError(error, 'Could not load services.'));
  return (data ?? []) as ServiceRow[];
}

export type ServiceInput = {
  slug: string;
  name: string;
  shortDescription: string;
  imageId: string | null;
  displayOrder: number;
  status: PublishStatus;
};

export async function createService(input: ServiceInput): Promise<ServiceRow> {
  const { data, error } = await getSupabase()
    .from('services')
    .insert({
      slug: input.slug,
      name: input.name,
      short_description: input.shortDescription,
      image_id: input.imageId,
      display_order: input.displayOrder,
      status: input.status,
    })
    .select()
    .single<ServiceRow>();
  if (error) {
    if (error.code === '23505') throw new Error('That slug is already in use. Choose another.');
    throw new Error(friendlyError(error, 'Could not create the service.'));
  }
  return data;
}

export async function updateService(id: string, input: ServiceInput): Promise<ServiceRow> {
  // The slug is permanent (packages.category_slug references it and the DB
  // rejects slug changes), so it is deliberately NOT part of the update payload.
  const { data, error } = await getSupabase()
    .from('services')
    .update({
      name: input.name,
      short_description: input.shortDescription,
      image_id: input.imageId,
      display_order: input.displayOrder,
      status: input.status,
    })
    .eq('id', id)
    .select()
    .single<ServiceRow>();
  if (error) {
    throw new Error(friendlyError(error, 'Could not update the service.'));
  }
  return data;
}

/** Deleting a service also removes its packages (ON DELETE CASCADE on the slug FK). */
export async function deleteService(id: string): Promise<void> {
  const { error } = await getSupabase().from('services').delete().eq('id', id);
  if (error) throw new Error(friendlyError(error, 'Could not delete the service.'));
}

/** Persist a new display order for a set of service ids. */
export async function reorderServices(orderedIds: string[]): Promise<void> {
  const supabase = getSupabase();
  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabase
      .from('services')
      .update({ display_order: index + 1 })
      .eq('id', orderedIds[index]);
    if (error) throw new Error(friendlyError(error, 'Could not reorder services.'));
  }
}

export async function listPackages(): Promise<PackageRow[]> {
  const { data, error } = await getSupabase()
    .from('packages')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(friendlyError(error, 'Could not load packages.'));
  return (data ?? []) as PackageRow[];
}

export type PackageInput = {
  categorySlug: string;
  name: string;
  description: string;
  imageId: string | null;
  duration: string | null;
  retouchedPhotos: string | null;
  outfits: string | null;
  price: string | null;
  displayOrder: number;
  status: PublishStatus;
};

export async function createPackage(input: PackageInput): Promise<PackageRow> {
  const { data, error } = await getSupabase()
    .from('packages')
    .insert({
      category_slug: input.categorySlug,
      name: input.name,
      description: input.description,
      image_id: input.imageId,
      duration: input.duration,
      retouched_photos: input.retouchedPhotos,
      outfits: input.outfits,
      price: input.price,
      display_order: input.displayOrder,
      status: input.status,
    })
    .select()
    .single<PackageRow>();
  if (error) throw new Error(friendlyError(error, 'Could not create the package.'));
  return data;
}

export async function updatePackage(id: string, input: PackageInput): Promise<PackageRow> {
  const { data, error } = await getSupabase()
    .from('packages')
    .update({
      category_slug: input.categorySlug,
      name: input.name,
      description: input.description,
      image_id: input.imageId,
      duration: input.duration,
      retouched_photos: input.retouchedPhotos,
      outfits: input.outfits,
      price: input.price,
      display_order: input.displayOrder,
      status: input.status,
    })
    .eq('id', id)
    .select()
    .single<PackageRow>();
  if (error) throw new Error(friendlyError(error, 'Could not update the package.'));
  return data;
}

export async function deletePackage(id: string): Promise<void> {
  const { error } = await getSupabase().from('packages').delete().eq('id', id);
  if (error) throw new Error(friendlyError(error, 'Could not delete the package.'));
}

// ——— Site settings ————————————————————————————————————————————

export async function getSettings(): Promise<SiteSettingsRow> {
  const { data, error } = await getSupabase()
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single<SiteSettingsRow>();
  if (error) throw new Error(friendlyError(error, 'Could not load site settings.'));
  return data;
}

export type SettingsInput = {
  instagramUrl: string;
  behanceUrl: string;
  whatsappUrl: string;
  whatsappCatalogUrl: string;
  mapsUrl: string;
  studioLocation: string;
  contactEmail: string;
  contactPhone: string;
  footerTagline: string;
  footerStudioNote: string;
  footerCopyright: string;
};

export async function updateSettings(input: SettingsInput): Promise<SiteSettingsRow> {
  const { data, error } = await getSupabase()
    .from('site_settings')
    .update({
      instagram_url: input.instagramUrl,
      behance_url: input.behanceUrl,
      whatsapp_url: input.whatsappUrl,
      whatsapp_catalog_url: input.whatsappCatalogUrl,
      maps_url: input.mapsUrl,
      studio_location: input.studioLocation,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone,
      footer_tagline: input.footerTagline,
      footer_studio_note: input.footerStudioNote,
      footer_copyright: input.footerCopyright,
    })
    .eq('id', 1)
    .select()
    .single<SiteSettingsRow>();
  if (error) throw new Error(friendlyError(error, 'Could not save site settings.'));
  return data;
}
