import type { CSSProperties } from 'react';
import { intro } from '../content/site';
import { images } from '../content/images';

export default function Intro() {
  const asset = images[intro.imageId];

  return (
    <section className="intro">
      <div className="intro__text">
        <h2 className="intro__headline">{intro.headline}</h2>
        <p className="intro__body">{intro.body}</p>
      </div>

      <figure className="intro__media">
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
