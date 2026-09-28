import type { CSSProperties } from 'react';
import { shootSection } from '../content/site';
import { useSiteContent } from '../data/SiteContent';
import { SELECT_CATEGORY_EVENT } from './Packages';
import { SiteLink } from '../router';

export default function WhatWeShoot() {
  const { services } = useSiteContent();
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
        {services.map((service) => (
          <article className="shoot__tile" key={service.slug}>
            <figure className="shoot__frame">
              <img
                src={service.src}
                alt={service.alt}
                loading="lazy"
                decoding="async"
                style={{ '--op': service.objectPosition } as CSSProperties}
              />
            </figure>
            <h3 className="shoot__title">{service.title}</h3>
            <p className="shoot__blurb">{service.blurb}</p>
            <a className="shoot__action" href="#packages" onClick={seePackages(service.slug)}>
              {shootSection.cardAction} <span aria-hidden="true">→</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
