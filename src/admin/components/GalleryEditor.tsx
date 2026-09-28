import type { GalleryItem, ImageRow } from '../../lib/types';
import { ImagePicker } from './ImagePicker';
import { Button } from './ui';

/**
 * Ordered gallery editor. Position 0 is the lead frame shown on the project
 * page. Supports add (upload or library), reorder, per-frame alt text, remove.
 */
export function GalleryEditor({
  value,
  onChange,
}: {
  value: GalleryItem[];
  onChange: (next: GalleryItem[]) => void;
}) {
  const reindex = (items: GalleryItem[]): GalleryItem[] =>
    items.map((item, index) => ({ ...item, position: index }));

  function addImage(image: ImageRow | null) {
    if (!image) return;
    onChange(
      reindex([
        ...value,
        { imageId: image.id, src: image.src, alt: image.alt, position: value.length },
      ]),
    );
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(reindex(next));
  }

  function updateAlt(index: number, alt: string) {
    onChange(value.map((item, i) => (i === index ? { ...item, alt } : item)));
  }

  function remove(index: number) {
    onChange(reindex(value.filter((_, i) => i !== index)));
  }

  return (
    <div className="adm-gallery">
      {value.length === 0 ? (
        <p className="adm-gallery__empty">
          No frames yet. Add the lead image first — it becomes the project cover candidate.
        </p>
      ) : (
        <ol className="adm-gallery__list">
          {value.map((item, index) => (
            <li className="adm-gallery__item" key={`${item.imageId}-${index}`}>
              <span className="adm-gallery__pos" aria-hidden="true">
                {index === 0 ? 'Lead' : index + 1}
              </span>
              <img className="adm-gallery__thumb" src={item.src} alt={item.alt || ''} />
              <div className="adm-gallery__fields">
                <label className="adm-visually-hidden" htmlFor={`gal-alt-${index}`}>
                  Alt text for frame {index + 1}
                </label>
                <input
                  id={`gal-alt-${index}`}
                  className="adm-input"
                  value={item.alt}
                  placeholder="Alt text (describes the photograph)"
                  onChange={(event) => updateAlt(index, event.target.value)}
                />
              </div>
              <div className="adm-gallery__actions">
                <Button type="button" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </Button>
                <Button type="button" variant="danger" onClick={() => remove(index)} aria-label="Remove frame">
                  ✕
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="adm-gallery__add">
        <ImagePicker value={null} folder="portfolio" label="Add a frame" onChange={addImage} />
      </div>
    </div>
  );
}
