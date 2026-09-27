import { useEffect, useRef, useState } from 'react';
import { support, supportActions } from '../content/site';

/**
 * Floating support button + compact dialog panel.
 * Closes via its close button, Escape or a click outside, and always returns
 * focus to the Support button. Sits below the mobile menu in z-order so the
 * menu covers it, and the footer keeps clear space beneath its links.
 */
export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hadOpen = useRef(false);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      // Keep focus inside the dialog while it is open.
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([aria-disabled="true"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const insidePanel = panel?.contains(target) ?? false;
      const insideFab = fabRef.current?.contains(target) ?? false;
      if (!insidePanel && !insideFab) {
        // Stop the browser moving focus to the clicked spot, so focus can
        // return to the Support button instead.
        event.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  // Return focus to the Support button after any close (not on first mount).
  useEffect(() => {
    if (open) {
      hadOpen.current = true;
      return;
    }
    if (hadOpen.current) {
      hadOpen.current = false;
      fabRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={fabRef}
        className="support-fab"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="support-panel"
        onClick={() => setOpen((value) => !value)}
      >
        {support.buttonLabel}
      </button>

      {open && (
        <div
          ref={panelRef}
          id="support-panel"
          className="support-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-title"
          tabIndex={-1}
        >
          <div className="support__head">
            <h2 className="support__title" id="support-title">
              {support.heading}
            </h2>
            <button
              type="button"
              className="support__close"
              aria-label={support.closeLabel}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div className="support__actions">
            {supportActions.map((action) =>
              action.href ? (
                <a
                  key={action.id}
                  className="support__action"
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{action.label}</span>
                  <span className="support__hint">{action.hint}</span>
                </a>
              ) : (
                <button
                  key={action.id}
                  type="button"
                  className="support__action"
                  aria-disabled="true"
                >
                  <span>{action.label}</span>
                  <span className="support__hint">{support.pendingHint}</span>
                </button>
              ),
            )}
          </div>

          <p className="support__note">{support.note}</p>
        </div>
      )}
    </>
  );
}
