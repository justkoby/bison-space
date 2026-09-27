import type { CSSProperties } from 'react';
import { about } from '../content/site';
import { images } from '../content/images';

export default function About() {
  const asset = images[about.imageId];

  return (
    <section className="about" id="about">
      <figure className="about__frame">
        <img
          src={asset.src}
          alt={asset.alt}
          loading="lazy"
          decoding="async"
          style={{ '--op': asset.objectPosition } as CSSProperties}
        />
        <figcaption className="about__caption">{about.imageCaption}</figcaption>
      </figure>

      <div className="about__copy">
        <p className="eyebrow">{about.eyebrow}</p>
        <h2 className="section-title">{about.headline}</h2>
        <p className="about__body">{about.body}</p>
        <a className="link-arrow" href={about.linkHref}>
          {about.linkLabel} <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
