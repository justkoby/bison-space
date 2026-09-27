import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { intro } from '../content/site';
import { images } from '../content/images';

/** Total vertical travel of the parallax, in px (kept understated). */
const PARALLAX_TRAVEL = 60;

export default function Intro() {
  const asset = images[intro.imageId];
  const mediaRef = useRef<HTMLElement>(null);

  // Scroll-driven parallax on the portrait only. The image is 115% tall with a
  // -7.5% top overscan, so translating it within ±7.5% of the container height
  // can never expose a blank edge. Skipped for reduced motion and narrow screens.
  useEffect(() => {
    const media = mediaRef.current;
    const img = media?.querySelector('img');
    if (!media || !img) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = window.matchMedia('(max-width: 899px)');
    let raf = 0;

    const apply = () => {
      raf = 0;
      if (motion.matches || narrow.matches) {
        img.style.transform = '';
        return;
      }
      const rect = media.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 as the section enters from the bottom, 1 as it leaves off the top.
      const progress = (vh - rect.top) / (vh + rect.height);
      const p = Math.min(1, Math.max(0, progress));
      const limit = rect.height * 0.075; // stay inside the overscan
      const offset = Math.max(-limit, Math.min(limit, (p - 0.5) * PARALLAX_TRAVEL));
      img.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    motion.addEventListener?.('change', onScroll);
    narrow.addEventListener?.('change', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      motion.removeEventListener?.('change', onScroll);
      narrow.removeEventListener?.('change', onScroll);
    };
  }, []);

  return (
    <section className="intro">
      <div className="intro__text">
        <h2 className="intro__headline">{intro.headline}</h2>
        <p className="intro__body">{intro.body}</p>
      </div>

      <figure className="intro__media" ref={mediaRef}>
        <img
          src={asset.src}
          alt={asset.alt}
          loading="lazy"
          decoding="async"
          style={
            {
              '--op': asset.objectPosition,
              '--opm': asset.objectPositionMobile ?? asset.objectPosition,
            } as CSSProperties
          }
        />
      </figure>
    </section>
  );
}
