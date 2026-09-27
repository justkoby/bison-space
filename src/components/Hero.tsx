import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { heroWall, images } from '../content/images';
import { hero } from '../content/site';
import Logo from './Logo';

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);

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
                  column.imageIds.map((imageId) => {
                    const asset = images[imageId];
                    const duplicate = setIndex === 1;
                    return (
                      <figure
                        className="wall-cell"
                        key={`${setIndex}-${imageId}`}
                        aria-hidden={duplicate ? 'true' : undefined}
                      >
                        <img
                          src={asset.src}
                          alt={duplicate ? '' : asset.alt}
                          loading="eager"
                          decoding="async"
                          draggable={false}
                          style={
                            {
                              '--op': asset.objectPosition,
                              '--opm': asset.objectPositionMobile ?? asset.objectPosition,
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
