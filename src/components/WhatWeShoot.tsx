import type { CSSProperties } from 'react';
import { shootCategories, shootSection } from '../content/site';
import { images } from '../content/images';
import { SELECT_CATEGORY_EVENT } from './Packages';
import { SiteLink } from '../router';

export default function WhatWeShoot() {
  const seePackages = (slug: string) => () => {
    window.dispatchEvent(new CustomEvent(SELECT_CATEGORY_EVENT, { detail: slug }));
  };

  return (
    <section className="shoot" id="shoot">
      <div className="shoot__head">
        <div>
          <p className="eyebrow">{shootSection.eyebrow}</p>
          <h2 className="section-title">{shootSection.headline}</h2>
        </div>
        <SiteLink href={shootSection.linkHref} className="link-arrow shoot__portfolio-link">
          {shootSection.linkLabel} <span aria-hidden="true">→</span>
        </SiteLink>
      </div>

      <div className="shoot__grid">
        {shootCategories.map((category) => {
          const asset = images[category.imageId];
          return (
            <article className="shoot__tile" key={category.slug}>
              <figure className="shoot__frame">
                <img
                  src={asset.src}
                  alt={asset.alt}
                  loading="lazy"
                  decoding="async"
                  style={{ '--op': asset.objectPosition } as CSSProperties}
                />
              </figure>
              <h3 className="shoot__title">{category.title}</h3>
              <p className="shoot__blurb">{category.blurb}</p>
              <a className="shoot__action" href="#packages" onClick={seePackages(category.slug)}>
                {shootSection.cardAction} <span aria-hidden="true">→</span>
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
