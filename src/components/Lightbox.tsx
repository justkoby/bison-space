import { useCallback, useEffect, useRef, useState } from 'react';
import type { PortfolioImage } from '../content/portfolio';

/**
 * Full-screen lightbox over the project gallery.
 * - Next/previous buttons plus ← → keys, Escape to close.
 * - Touch: horizontal swipe changes image, tap on the backdrop closes.
 * - Focus moves to the close button on open and returns to the trigger on close.
 */

type LightboxProps = {
  images: PortfolioImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

const SWIPE_MIN_PX = 40;

export default function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const step = useCallback(
    (delta: number) => {
      onIndexChange((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  // Remember what had focus so it can be restored, and focus the dialog itself.
  useEffect(() => {
    triggerRef.current = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, []);

  // Body scroll lock while open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, step]);

  const image = images[index];
  if (!image) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${images.length}: ${image.alt}`}
      onPointerDown={(event) => {
        touchStartX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        const startX = touchStartX.current;
        touchStartX.current = null;
        if (startX === null) return;
        const dx = event.clientX - startX;
        if (Math.abs(dx) > SWIPE_MIN_PX) {
          step(dx < 0 ? 1 : -1);
          return;
        }
        // A plain tap on the backdrop or its letterboxing (not a control or the
        // photo itself) closes.
        const target = event.target as HTMLElement;
        if (target === event.currentTarget || target.classList.contains('lightbox__stage')) {
          onClose();
        }
      }}
    >
      <div className={`lightbox__stage${loaded[image.src] ? ' is-loaded' : ''}`}>
        <img
          key={image.src}
          src={image.src}
          alt={image.alt}
          onLoad={() => setLoaded((prev) => ({ ...prev, [image.src]: true }))}
          draggable={false}
        />
      </div>

      <p className="lightbox__count">
        {index + 1} / {images.length}
      </p>

      <button type="button" className="lightbox__close" aria-label="Close (Esc)" onClick={onClose} ref={closeRef}>
        ✕
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            aria-label="Previous image (←)"
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            aria-label="Next image (→)"
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
