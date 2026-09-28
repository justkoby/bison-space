import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { hero } from '../content/site';
import { useSiteContent } from '../data/SiteContent';
import Logo from './Logo';

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const { hero: heroWall } = useSiteContent();

  // Pause the drift while the tab is hidden (saves CPU/GPU; resumes on return).
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const sync = () => el.classList.toggle('hero--paused', document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  return (
    <section className="hero" id="top" ref={heroRef}>
      <div className="hero-wall" aria-hidden="true">
        {heroWall.map((column) => {
          // Render the sequence twice; the track translates -50% (one full set) so
          // the wrap is pixel-identical — no seam, gap or pause on restart.
          const sets = [0, 1];
          return (
            <div className={`wall-col wall-col--${column.id}`} key={column.id}>
              <div
                className="wall-track"
                style={
                  {
                    '--dur': `${column.duration}s`,
                    '--offset': `${column.offset}s`,
                  } as CSSProperties
                }
              >
                {sets.map((setIndex) =>
                  column.images.map((image, imageIndex) => {
                    const duplicate = setIndex === 1;
                    return (
                      <figure
                        className="wall-cell"
                        key={`${setIndex}-${imageIndex}-${image.src}`}
                        aria-hidden={duplicate ? 'true' : undefined}
                      >
                        <img
                          src={image.src}
                          alt={duplicate ? '' : image.alt}
                          loading="eager"
                          decoding="async"
                          draggable={false}
                          style={
                            {
                              '--op': image.objectPosition,
                              '--opm': image.objectPositionMobile ?? image.objectPosition,
                            } as CSSProperties
                          }
                        />
                      </figure>
                    );
                  }),
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stationary wordmark — the supplied logo — held above the moving wall */}
      <h1 className="hero-title">
        <Logo className="hero-title__logo" label="Bison’s Space" />
      </h1>

      <div className="hero-foot">
        <span className="hero-foot__caption">{hero.caption}</span>
        <span className="hero-foot__location">{hero.captionLocation}</span>
      </div>
    </section>
  );
}
