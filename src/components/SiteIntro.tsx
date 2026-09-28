import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { heroWall, images } from '../content/images';

/**
 * Branded opening sequence: a black screen with the BISONS SPACE wordmark, a brief
 * hold, then a camera-like zoom into the centre of the "O" whose interior opens as a
 * circular reveal onto the (already running) photo-wall hero.
 *
 * - Plays at most once per browser session (sessionStorage).
 * - A visible Skip button ends it immediately.
 * - prefers-reduced-motion: never mounts; the homepage shows at once.
 * - The hero behind is untouched and already animating, so the reveal is seamless.
 */

const SESSION_KEY = 'bs-intro-played';
const MIN_HOLD_MS = 500; // brief hold on the wordmark
const PRELOAD_CAP_MS = 3000; // never hang the reveal on a slow network
const ZOOM_MS = 1150; // zoom + circular reveal duration

function shouldPlay(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}

export default function SiteIntro() {
  const [active, setActive] = useState(shouldPlay);
  const [playing, setPlaying] = useState(false);
  const [centre, setCentre] = useState<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* private mode — skip persistence */
    }
    document.body.classList.remove('intro-lock');
    setActive(false);
  };

  // Lock page scroll only while the overlay is up; released on reveal or skip.
  useEffect(() => {
    if (!active) return;
    document.body.classList.add('intro-lock');
    return () => document.body.classList.remove('intro-lock');
  }, [active]);

  // Move focus to the Skip button while the intro is up so keyboard users can
  // reach it immediately (the overlay is no longer hidden from assistive tech).
  useEffect(() => {
    if (!active) return;
    skipRef.current?.focus();
  }, [active]);

  // Measure the centre of the "O" (zoom origin + reveal circle centre) once fonts settle.
  useEffect(() => {
    if (!active) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const o = rootRef.current?.querySelector('.intro__o');
      if (!o) return;
      const r = o.getBoundingClientRect();
      setCentre({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(measure);
    } else {
      measure();
    }
    return () => {
      alive = false;
    };
  }, [active]);

  // Preload the first hero frames so the reveal never exposes a blank wall, then play.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const started = performance.now();
    const srcs = heroWall.flatMap((column) => column.imageIds).map((id) => images[id].src);
    const preload = Promise.all(
      srcs.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = src;
          }),
      ),
    );
    const cap = new Promise((resolve) => setTimeout(resolve, PRELOAD_CAP_MS));

    Promise.race([preload, cap]).then(() => {
      const wait = Math.max(0, MIN_HOLD_MS - (performance.now() - started));
      window.setTimeout(() => {
        if (cancelled) return;
        setPlaying(true);
        window.setTimeout(finish, ZOOM_MS + 100);
      }, wait);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  const style = centre
    ? ({ '--cx': `${centre.x}px`, '--cy': `${centre.y}px` } as CSSProperties)
    : undefined;

  return (
    <div
      className={`intro-root${playing ? ' is-playing' : ''}`}
      ref={rootRef}
      style={style}
    >
      <div className="intro-curtain">
        <div className="intro__zoom">
          <h1 className="intro__word" aria-hidden="true">
            BIS<span className="intro__o">O</span>NS SPACE
          </h1>
        </div>
      </div>
      <button type="button" className="intro__skip" ref={skipRef} onClick={finish}>
        Skip
      </button>
    </div>
  );
}
