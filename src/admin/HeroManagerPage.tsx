import { useState } from 'react';
import { useAsync } from './useAsync';
import {
  addHeroImage,
  listHeroColumns,
  listHeroImages,
  listImages,
  removeHeroImage,
  reorderHeroColumn,
  updateHeroImage,
} from '../data/adminApi';
import type { HeroColumnId, HeroColumnRow, HeroImageRow, ImageRow } from '../lib/types';
import { ImagePicker } from './components/ImagePicker';
import { Button, ErrorState, Loading, Notice, PageHeader, cn } from './components/ui';

type Loaded = {
  columns: HeroColumnRow[];
  heroImages: HeroImageRow[];
  images: Record<string, ImageRow>;
};

async function loadHero(): Promise<Loaded> {
  const [columns, heroImages, imageList] = await Promise.all([
    listHeroColumns(),
    listHeroImages(),
    listImages(),
  ]);
  const images: Record<string, ImageRow> = {};
  for (const image of imageList) images[image.id] = image;
  return { columns, heroImages, images };
}

/** /admin/hero — order the three drifting columns, add/replace/remove frames. */
export default function HeroManagerPage() {
  const { data, loading, error, reload } = useAsync(loadHero, []);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<HeroColumnId | null>(null);

  if (loading) return <Loading label="Loading hero wall…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const columns = data?.columns ?? [];
  const images = data?.images ?? {};
  const heroImages = data?.heroImages ?? [];

  const columnImages = (id: HeroColumnId) =>
    heroImages
      .filter((item) => item.column_id === id)
      .sort((a, b) => a.position - b.position);

  async function guard<T>(fn: () => Promise<T>): Promise<void> {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  async function move(columnId: HeroColumnId, index: number, delta: number) {
    const items = columnImages(columnId);
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    await guard(() => reorderHeroColumn(columnId, next.map((i) => i.id)));
  }

  return (
    <div>
      <PageHeader
        title="Hero photo wall"
        subtitle="Three columns drift upward behind the wordmark. Order frames within each column."
      />

      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      <div className="adm-hero">
        {columns.map((column) => {
          const items = columnImages(column.id);
          return (
            <section className="adm-hero__col" key={column.id}>
              <header className="adm-hero__col-head">
                <h2 className="adm-hero__col-title">{column.id}</h2>
                <span className="adm-hero__col-meta">
                  {column.duration}s loop · {column.offset}s offset
                </span>
              </header>

              {items.length === 0 ? (
                <p className="adm-hero__empty">No frames in this column.</p>
              ) : (
                <ol className="adm-hero__list">
                  {items.map((item, index) => {
                    const image = images[item.image_id];
                    return (
                      <li className="adm-hero__item" key={item.id}>
                        <img className="adm-hero__thumb" src={image?.src ?? ''} alt={item.alt || ''} />
                        <div className="adm-hero__fields">
                          <input
                            className="adm-input"
                            value={item.alt}
                            placeholder="Alt text"
                            aria-label={`Alt text for ${column.id} frame ${index + 1}`}
                            onChange={(e) => void guard(() => updateHeroImage(item.id, { alt: e.target.value }))}
                          />
                          <div className="adm-hero__btns">
                            <Button variant="ghost" onClick={() => move(column.id, index, -1)} disabled={index === 0 || busy} aria-label="Move up">
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => move(column.id, index, 1)}
                              disabled={index === items.length - 1 || busy}
                              aria-label="Move down"
                            >
                              ↓
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => void guard(() => updateHeroImage(item.id, { published: !item.published }))}
                              disabled={busy}
                              aria-pressed={item.published}
                              title={item.published ? 'Hide from the wall' : 'Show on the wall'}
                            >
                              {item.published ? 'Visible' : 'Hidden'}
                            </Button>
                            <Button variant="danger" onClick={() => void guard(() => removeHeroImage(item.id))} disabled={busy} aria-label="Remove frame">
                              ✕
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="adm-hero__add">
                {addingTo === column.id ? (
                  <ImagePicker
                    value={null}
                    folder="hero"
                    label={`Add to ${column.id}`}
                    onChange={(image) => {
                      setAddingTo(null);
                      if (image) void guard(() => addHeroImage(column.id, image.id, image.alt, items.length));
                    }}
                  />
                ) : (
                  <Button variant="subtle" onClick={() => setAddingTo(column.id)} disabled={busy}>
                    + Add frame
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Static preview of the composed wall order. */}
      <section className="adm-section">
        <h2 className="adm-section__title">Preview</h2>
        <div className={cn('adm-hero-preview')}>
          {columns.map((column) => (
            <div className="adm-hero-preview__col" key={column.id}>
              {columnImages(column.id).map((item) => (
                <img key={item.id} src={images[item.image_id]?.src ?? ''} alt="" />
              ))}
            </div>
          ))}
        </div>
        <p className="adm-section__hint">
          The live wall animates continuously; this shows the current order and crop of each column.
        </p>
      </section>
    </div>
  );
}
