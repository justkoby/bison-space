import { useState } from 'react';
import { useAsync } from './useAsync';
import {
  createPackage,
  deletePackage,
  listImages,
  listPackages,
  listServices,
  updatePackage,
  type PackageInput,
} from '../data/adminApi';
import type { ImageRow, PackageRow, PublishStatus, ServiceRow } from '../lib/types';
import { ImagePicker } from './components/ImagePicker';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  Notice,
  PageHeader,
  Select,
  StatusPill,
  TextArea,
  TextInput,
} from './components/ui';

type Loaded = {
  categories: ServiceRow[];
  packages: PackageRow[];
  images: Record<string, ImageRow>;
};

async function loadAll(): Promise<Loaded> {
  const [categories, packages, imageList] = await Promise.all([
    listServices(),
    listPackages(),
    listImages(),
  ]);
  const images: Record<string, ImageRow> = {};
  for (const image of imageList) images[image.id] = image;
  return { categories, packages, images };
}

const BLANK = {
  categorySlug: '',
  name: '',
  description: '',
  image: null as ImageRow | null,
  duration: '',
  retouchedPhotos: '',
  outfits: '',
  price: '',
  displayOrder: 0,
  status: 'draft' as PublishStatus,
};

type FormState = typeof BLANK;

/** /admin/packages — edit the session packages. Incomplete ones stay draft. */
export default function PackagesPage() {
  const { data, loading, error, reload } = useAsync(loadAll, []);
  const [editingId, setEditingId] = useState<string | null>(null); // null = closed, 'new' = creating
  const [form, setForm] = useState<FormState>(BLANK);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PackageRow | null>(null);

  if (loading) return <Loading label="Loading packages…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const categories = data?.categories ?? [];
  const packages = data?.packages ?? [];
  const images = data?.images ?? {};

  function startNew() {
    setForm({ ...BLANK, categorySlug: categories[0]?.slug ?? '' });
    setEditingId('new');
    setFormError(null);
  }

  function startEdit(pkg: PackageRow) {
    setForm({
      categorySlug: pkg.category_slug,
      name: pkg.name,
      description: pkg.description,
      image: pkg.image_id ? images[pkg.image_id] ?? null : null,
      duration: pkg.duration ?? '',
      retouchedPhotos: pkg.retouched_photos ?? '',
      outfits: pkg.outfits ?? '',
      price: pkg.price ?? '',
      displayOrder: pkg.display_order,
      status: pkg.status,
    });
    setEditingId(pkg.id);
    setFormError(null);
  }

  function close() {
    setEditingId(null);
    setForm(BLANK);
    setFormError(null);
  }

  async function save() {
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('A package name is required.');
      return;
    }
    if (!form.categorySlug) {
      setFormError('Choose a category.');
      return;
    }
    const input: PackageInput = {
      categorySlug: form.categorySlug,
      name: form.name.trim(),
      description: form.description.trim(),
      imageId: form.image?.id ?? null,
      duration: form.duration.trim() || null,
      retouchedPhotos: form.retouchedPhotos.trim() || null,
      outfits: form.outfits.trim() || null,
      price: form.price.trim() || null,
      displayOrder: Number(form.displayOrder) || 0,
      status: form.status,
    };
    setBusy(true);
    try {
      if (editingId === 'new') await createPackage(input);
      else await updatePackage(editingId as string, input);
      close();
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deletePackage(pendingDelete.id);
      setPendingDelete(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  }

  const grouped = categories.map((category) => ({
    category,
    items: packages
      .filter((pkg) => pkg.category_slug === category.slug)
      .sort((a, b) => a.display_order - b.display_order),
  }));

  return (
    <div>
      <PageHeader
        title="Services & packages"
        subtitle="Packages may be incomplete — keep them draft until specs and rates are confirmed. Nothing is published to the site until you set it live."
        actions={
          editingId === null ? (
            <Button onClick={startNew}>+ New package</Button>
          ) : undefined
        }
      />

      {formError ? <Notice tone="error">{formError}</Notice> : null}

      {editingId !== null ? (
        <section className="adm-section adm-section--edit">
          <h2 className="adm-section__title">{editingId === 'new' ? 'New package' : 'Edit package'}</h2>
          <div className="adm-form__grid">
            <Field label="Category" htmlFor="pk-cat">
              <Select id="pk-cat" value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Name" htmlFor="pk-name">
              <TextInput id="pk-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Status" htmlFor="pk-status" hint="Draft packages never appear on the public site.">
              <Select id="pk-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PublishStatus })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </Field>
            <Field label="Display order" htmlFor="pk-order">
              <TextInput id="pk-order" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
            </Field>
          </div>

          <Field label="Description" htmlFor="pk-desc">
            <TextArea id="pk-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>

          <ImagePicker value={form.image} folder="packages" label="Package image" onChange={(image) => setForm({ ...form, image })} />

          <div className="adm-form__grid">
            <Field label="Duration" htmlFor="pk-duration" hint="Optional">
              <TextInput id="pk-duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 2 hours" />
            </Field>
            <Field label="Retouched photos" htmlFor="pk-retouched" hint="Optional">
              <TextInput id="pk-retouched" value={form.retouchedPhotos} onChange={(e) => setForm({ ...form, retouchedPhotos: e.target.value })} placeholder="e.g. 15" />
            </Field>
            <Field label="Outfits" htmlFor="pk-outfits" hint="Optional">
              <TextInput id="pk-outfits" value={form.outfits} onChange={(e) => setForm({ ...form, outfits: e.target.value })} placeholder="e.g. 3" />
            </Field>
            <Field label="Price" htmlFor="pk-price" hint="Optional — leave blank until confirmed.">
              <TextInput id="pk-price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. GHS 1,500" />
            </Field>
          </div>

          <div className="adm-form__actions">
            <Button onClick={save} busy={busy}>
              {editingId === 'new' ? 'Create package' : 'Save changes'}
            </Button>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      {packages.length === 0 && editingId === null ? (
        <EmptyState
          title="No packages yet"
          body="Until packages are added and published, the public site shows the “Custom session — enquire for details” card per category. Nothing is invented."
          action={<Button onClick={startNew}>+ New package</Button>}
        />
      ) : (
        <div className="adm-groups">
          {grouped.map(({ category, items }) => (
            <section className="adm-group" key={category.slug}>
              <h2 className="adm-group__title">{category.name}</h2>
              {items.length === 0 ? (
                <p className="adm-group__empty">No packages in this category.</p>
              ) : (
                <ul className="adm-table">
                  {items.map((pkg) => (
                    <li className="adm-row" key={pkg.id}>
                      <span className="adm-row__thumb">
                        {pkg.image_id && images[pkg.image_id] ? (
                          <img src={images[pkg.image_id].src} alt="" />
                        ) : (
                          <span className="adm-row__noimg">—</span>
                        )}
                      </span>
                      <span className="adm-row__main">
                        <span className="adm-row__title">{pkg.name}</span>
                        <span className="adm-row__meta">
                          {[pkg.duration, pkg.retouched_photos && `${pkg.retouched_photos} retouched`, pkg.price].filter(Boolean).join(' · ') || 'incomplete'}
                        </span>
                      </span>
                      <StatusPill status={pkg.status} />
                      <span className="adm-row__actions">
                        <Button variant="subtle" onClick={() => startEdit(pkg)}>
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => setPendingDelete(pkg)}>
                          Delete
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={busy}
        title="Delete this package?"
        message={<p><strong>{pendingDelete?.name}</strong> will be removed. This cannot be undone.</p>}
        confirmLabel="Delete package"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
