import { useEffect, useMemo, useState } from 'react';
import { navigate } from '../router';
import {
  createProject,
  deleteProject,
  getGallery,
  getProject,
  listImages,
  updateProject,
} from '../data/adminApi';
import { CATEGORY_LABELS, CATEGORY_VALUES } from '../lib/types';
import type { GalleryItem, ImageRow, PortfolioCategory, PublishStatus } from '../lib/types';
import { GalleryEditor } from './components/GalleryEditor';
import { ImagePicker } from './components/ImagePicker';
import {
  Button,
  ConfirmDialog,
  ErrorState,
  Field,
  Loading,
  Notice,
  PageHeader,
  Select,
  TextArea,
  TextInput,
} from './components/ui';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** /admin/portfolio/new and /admin/portfolio/:id — create or edit one project. */
export default function ProjectEditorPage({ projectId }: { projectId?: string }) {
  const isNew = !projectId;

  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState<PortfolioCategory>('portraits');
  const [status, setStatus] = useState<PublishStatus>('draft');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [cover, setCover] = useState<ImageRow | null>(null);
  const [coverAlt, setCoverAlt] = useState('');
  const [thumb, setThumb] = useState('');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Load the project (edit mode) plus the image library for previews.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const imgs = await listImages();
        const map: Record<string, ImageRow> = {};
        for (const image of imgs) map[image.id] = image;
        if (!alive) return;
        if (isNew) {
          setLoading(false);
          return;
        }
        const [project, gal] = await Promise.all([getProject(projectId as string), getGallery(projectId as string)]);
        if (!alive) return;
        setTitle(project.title);
        setSlug(project.slug);
        setSlugTouched(true);
        setCategory(project.category);
        setStatus(project.status);
        setDisplayOrder(project.display_order);
        setCoverAlt(project.cover_alt);
        setThumb(project.cover_thumb_position ?? '');
        setCover(project.cover_image_id ? map[project.cover_image_id] ?? null : null);
        setGallery(
          gal.map((g) => ({
            id: g.id,
            imageId: g.image_id,
            src: map[g.image_id]?.src ?? '',
            alt: g.alt,
            position: g.position,
          })),
        );
        setLoading(false);
      } catch (err) {
        if (!alive) return;
        setLoadError(err instanceof Error ? err.message : 'Could not load the project.');
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId, isNew]);

  const effectiveSlug = useMemo(
    () => (slugTouched ? slug : slugify(title)),
    [slug, slugTouched, title],
  );

  function onTitleChange(next: string) {
    setTitle(next);
    if (!slugTouched) setSlug(slugify(next));
  }

  function useLeadAsCover() {
    const lead = gallery[0];
    if (!lead) return;
    setCover({ id: lead.imageId, src: lead.src, alt: lead.alt } as ImageRow);
    if (!coverAlt.trim()) setCoverAlt(lead.alt);
  }

  async function onSave() {
    setFormError(null);
    if (!title.trim()) {
      setFormError('A title is required.');
      return;
    }
    const finalSlug = (slugTouched ? slug : slugify(title)).trim().toLowerCase();
    if (!finalSlug) {
      setFormError('A slug is required (it is derived from the title).');
      return;
    }
    if (status === 'published' && gallery.length === 0) {
      setFormError('Add at least one gallery frame before publishing.');
      return;
    }
    const input = {
      slug: finalSlug,
      title: title.trim(),
      category,
      status,
      displayOrder: Number(displayOrder) || 0,
      coverImageId: cover?.id ?? null,
      coverAlt: coverAlt.trim() || cover?.alt || '',
      coverThumbPosition: thumb.trim() || null,
    };
    setSaving(true);
    try {
      if (isNew) await createProject(input, gallery);
      else await updateProject(projectId as string, input, gallery);
      navigate('/admin/portfolio');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    setFormError(null);
    try {
      await deleteProject(projectId as string);
      navigate('/admin/portfolio');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Delete failed.');
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (loading) return <Loading label="Loading project…" />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div>
      <PageHeader
        title={isNew ? 'New project' : 'Edit project'}
        subtitle={isNew ? 'Draft by default — publish when it’s ready.' : `/${effectiveSlug || '…'}`}
        actions={
          <Button variant="ghost" onClick={() => navigate('/admin/portfolio')}>
            ← Back to portfolio
          </Button>
        }
      />

      {formError ? <Notice tone="error">{formError}</Notice> : null}

      <div className="adm-form">
        <div className="adm-form__grid">
          <Field label="Title" htmlFor="p-title">
            <TextInput id="p-title" value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="e.g. Coin Veil Editorial" />
          </Field>

          <Field
            label="Slug"
            htmlFor="p-slug"
            hint={slugTouched ? 'Used in the URL: /portfolio/<slug>' : 'Auto-derived from the title'}
          >
            <TextInput
              id="p-slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
            />
          </Field>

          <Field label="Category" htmlFor="p-category">
            <Select
              id="p-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as PortfolioCategory)}
            >
              {CATEGORY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Status" htmlFor="p-status" hint="Only published projects appear on the site.">
            <Select id="p-status" value={status} onChange={(e) => setStatus(e.target.value as PublishStatus)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </Field>

          <Field label="Display order" htmlFor="p-order" hint="Lower numbers appear first.">
            <TextInput
              id="p-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </Field>
        </div>

        <section className="adm-section">
          <h2 className="adm-section__title">Cover</h2>
          <ImagePicker value={cover} folder="portfolio" label="Cover image" onChange={setCover} />
          <div className="adm-form__grid">
            <Field label="Cover alt text" htmlFor="p-cover-alt">
              <TextArea id="p-cover-alt" rows={2} value={coverAlt} onChange={(e) => setCoverAlt(e.target.value)} />
            </Field>
            <Field label="Thumbnail crop (object-position)" htmlFor="p-thumb" hint="e.g. 50% 30% — keeps faces in the tile.">
              <TextInput id="p-thumb" value={thumb} onChange={(e) => setThumb(e.target.value)} placeholder="50% 30%" />
            </Field>
          </div>
          <Button type="button" variant="ghost" onClick={useLeadAsCover} disabled={gallery.length === 0}>
            Use lead frame as cover
          </Button>
        </section>

        <section className="adm-section">
          <h2 className="adm-section__title">Gallery (ordered)</h2>
          <p className="adm-section__hint">
            Position 1 is the lead frame shown large on the project page; the rest follow in order.
          </p>
          <GalleryEditor value={gallery} onChange={setGallery} />
        </section>

        <div className="adm-form__actions">
          <Button onClick={onSave} busy={saving}>
            {isNew ? 'Create project' : 'Save changes'}
          </Button>
          {!isNew ? (
            <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={deleting}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        busy={deleting}
        title="Delete this project?"
        message={<p>This removes the project and its gallery associations. This cannot be undone.</p>}
        confirmLabel="Delete project"
        onConfirm={onDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
