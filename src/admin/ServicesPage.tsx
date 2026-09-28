import { useState } from 'react';
import { useAsync } from './useAsync';
import {
  createService,
  deleteService,
  listImages,
  listServices,
  reorderServices,
  updateService,
  type ServiceInput,
} from '../data/adminApi';
import type { ImageRow, PublishStatus, ServiceRow } from '../lib/types';
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
  services: ServiceRow[];
  images: Record<string, ImageRow>;
};

async function loadAll(): Promise<Loaded> {
  const [services, imageList] = await Promise.all([listServices(), listImages()]);
  const images: Record<string, ImageRow> = {};
  for (const image of imageList) images[image.id] = image;
  return { services, images };
}

const BLANK = {
  slug: '',
  name: '',
  shortDescription: '',
  image: null as ImageRow | null,
  displayOrder: 0,
  status: 'draft' as PublishStatus,
};

type FormState = typeof BLANK;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** /admin/services — edit the "What We Shoot" service tiles shown on the public site. */
export default function ServicesPage() {
  const { data, loading, error, reload } = useAsync(loadAll, []);
  const [editingId, setEditingId] = useState<string | null>(null); // null = closed, 'new' = creating
  const [form, setForm] = useState<FormState>(BLANK);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ServiceRow | null>(null);

  if (loading) return <Loading label="Loading services…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const services = data?.services ?? [];
  const images = data?.images ?? {};

  function startNew() {
    setForm({ ...BLANK, displayOrder: services.length + 1 });
    setEditingId('new');
    setFormError(null);
  }

  function startEdit(service: ServiceRow) {
    setForm({
      slug: service.slug,
      name: service.name,
      shortDescription: service.short_description,
      image: service.image_id ? images[service.image_id] ?? null : null,
      displayOrder: service.display_order,
      status: service.status,
    });
    setEditingId(service.id);
    setFormError(null);
  }

  function close() {
    setEditingId(null);
    setForm(BLANK);
    setFormError(null);
  }

  async function save() {
    setFormError(null);
    const name = form.name.trim();
    if (!name) {
      setFormError('A service name is required.');
      return;
    }
    const slug = (form.slug.trim() || slugify(name)).toLowerCase();
    if (!slug) {
      setFormError('A slug is required (letters, numbers and dashes).');
      return;
    }
    const input: ServiceInput = {
      slug,
      name,
      shortDescription: form.shortDescription.trim(),
      imageId: form.image?.id ?? null,
      displayOrder: Number(form.displayOrder) || 0,
      status: form.status,
    };
    setBusy(true);
    try {
      if (editingId === 'new') await createService(input);
      else await updateService(editingId as string, input);
      close();
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= services.length) return;
    const next = [...services];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setBusy(true);
    setActionError(null);
    try {
      await reorderServices(next.map((service) => service.id));
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reorder failed.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    setActionError(null);
    try {
      await deleteService(pendingDelete.id);
      setPendingDelete(null);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="The session types shown in “What We Shoot”. Only published services appear on the public site; ordering here sets the tile order."
        actions={
          editingId === null ? <Button onClick={startNew}>+ New service</Button> : undefined
        }
      />

      {actionError ? <Notice tone="error">{actionError}</Notice> : null}
      {formError ? <Notice tone="error">{formError}</Notice> : null}

      {editingId !== null ? (
        <section className="adm-section adm-section--edit">
          <h2 className="adm-section__title">{editingId === 'new' ? 'New service' : 'Edit service'}</h2>
          <div className="adm-form__grid">
            <Field label="Name" htmlFor="sv-name">
              <TextInput
                id="sv-name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    slug: editingId === 'new' ? slugify(e.target.value) : form.slug,
                  })
                }
              />
            </Field>
            <Field
              label="Slug"
              htmlFor="sv-slug"
              hint={
                editingId === 'new'
                  ? 'Used for the packages tab and URLs.'
                  : 'Permanent — packages link to this slug, so it can’t be changed after creation.'
              }
            >
              <TextInput
                id="sv-slug"
                value={form.slug}
                readOnly={editingId !== 'new'}
                title={editingId === 'new' ? undefined : 'The slug is permanent once the service exists.'}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder="e.g. portraits"
              />
            </Field>
            <Field label="Status" htmlFor="sv-status" hint="Draft services never appear on the public site.">
              <Select
                id="sv-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PublishStatus })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </Field>
            <Field label="Display order" htmlFor="sv-order">
              <TextInput
                id="sv-order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="Short description" htmlFor="sv-desc">
            <TextArea
              id="sv-desc"
              rows={2}
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            />
          </Field>

          <ImagePicker
            value={form.image}
            folder="services"
            label="Service photograph"
            onChange={(image) => setForm({ ...form, image })}
          />

          <div className="adm-form__actions">
            <Button onClick={save} busy={busy}>
              {editingId === 'new' ? 'Create service' : 'Save changes'}
            </Button>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      {services.length === 0 && editingId === null ? (
        <EmptyState
          title="No services yet"
          body="Add the session types you offer. Until a service is published it stays hidden from the public site."
          action={<Button onClick={startNew}>+ New service</Button>}
        />
      ) : (
        <ul className="adm-table">
          {services.map((service, index) => {
            const image = service.image_id ? images[service.image_id] : null;
            return (
              <li className="adm-row" key={service.id}>
                <span className="adm-row__thumb">
                  {image ? <img src={image.src} alt="" /> : <span className="adm-row__noimg">—</span>}
                </span>
                <span className="adm-row__main">
                  <span className="adm-row__title">{service.name}</span>
                  <span className="adm-row__meta">/{service.slug}</span>
                </span>
                <StatusPill status={service.status} />
                <span className="adm-row__order">
                  <Button variant="ghost" onClick={() => move(index, -1)} disabled={index === 0 || busy} aria-label="Move up">
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => move(index, 1)}
                    disabled={index === services.length - 1 || busy}
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                </span>
                <span className="adm-row__actions">
                  <Button variant="subtle" onClick={() => startEdit(service)} disabled={busy}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => setPendingDelete(service)} disabled={busy}>
                    Delete
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={busy}
        title="Delete this service?"
        message={
          <p>
            <strong>{pendingDelete?.name}</strong> will be removed, along with any packages filed
            under it. Uploaded image files stay in storage. This cannot be undone.
          </p>
        }
        confirmLabel="Delete service"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
