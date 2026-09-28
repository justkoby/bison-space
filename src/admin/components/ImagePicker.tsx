import { useRef, useState } from 'react';
import type { ImageRow } from '../../lib/types';
import { uploadImage, listImages, ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from '../../data/adminApi';
import { Button, Notice, cn } from './ui';

/**
 * Image field: shows the current selection, uploads a new photograph (with
 * type/size validation and clear errors), or picks one from the existing
 * library. Used for project covers, gallery frames, hero slots, category and
 * package images.
 */
export function ImagePicker({
  value,
  folder,
  label = 'Image',
  onChange,
}: {
  value: ImageRow | null;
  folder: string;
  label?: string;
  onChange: (image: ImageRow | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<ImageRow[] | null>(null);
  const [libOpen, setLibOpen] = useState(false);
  const [libLoading, setLibLoading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const row = await uploadImage(file, folder);
      onChange(row);
      setLibrary(null); // refresh library next time it opens
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function openLibrary() {
    const next = !libOpen;
    setLibOpen(next);
    if (next && library === null) {
      setLibLoading(true);
      try {
        setLibrary(await listImages());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load the image library.');
      } finally {
        setLibLoading(false);
      }
    }
  }

  const accept = ACCEPTED_IMAGE_TYPES.join(',');

  return (
    <div className="adm-picker">
      <div className="adm-picker__row">
        <div className="adm-picker__preview" aria-hidden={!value}>
          {value ? (
            <img src={value.src} alt={value.alt || `${label} preview`} />
          ) : (
            <span className="adm-picker__empty">No image</span>
          )}
        </div>
        <div className="adm-picker__controls">
          <p className="adm-picker__label">{label}</p>
          {value ? <p className="adm-picker__meta">{value.alt || '— no alt text —'}</p> : null}
          <div className="adm-picker__buttons">
            <Button type="button" variant="subtle" busy={busy} onClick={() => inputRef.current?.click()}>
              {value ? 'Replace' : 'Upload'}
            </Button>
            <Button type="button" variant="ghost" onClick={openLibrary}>
              {libOpen ? 'Hide library' : 'Choose existing'}
            </Button>
            {value ? (
              <Button type="button" variant="ghost" onClick={() => onChange(null)}>
                Clear
              </Button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="adm-visually-hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <p className="adm-picker__hint">
            JPEG, PNG, WebP or AVIF · up to {Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB
          </p>
        </div>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {libOpen ? (
        <div className="adm-library">
          {libLoading ? (
            <p className="adm-library__status">Loading library…</p>
          ) : library && library.length > 0 ? (
            <ul className="adm-library__grid">
              {library.map((image) => (
                <li key={image.id}>
                  <button
                    type="button"
                    className={cn('adm-library__item', value?.id === image.id && 'is-selected')}
                    onClick={() => {
                      onChange(image);
                      setLibOpen(false);
                    }}
                    aria-pressed={value?.id === image.id}
                    title={image.alt || image.src}
                  >
                    <img src={image.src} alt={image.alt || ''} loading="lazy" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-library__status">No uploaded images yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
