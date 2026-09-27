import type { CSSProperties } from 'react';
import { workCategories, workSection } from '../content/site';
import { images } from '../content/images';

export default function SelectedWork() {
  return (
    <section className="work" id="work">
      <div className="work__head">
        <div>
          <p className="eyebrow">{workSection.eyebrow}</p>
          <h2 className="section-title">{workSection.headline}</h2>
        </div>
        <a className="link-arrow" href={workSection.linkHref}>
          {workSection.linkLabel} <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="work__grid">
        {workCategories.map((category) => {
          const asset = images[category.imageId];
          return (
            <a className="work__tile" href={workSection.linkHref} key={category.slug}>
              <figure className="work__frame">
                <img
                  src={asset.src}
                  alt={asset.alt}
                  loading="lazy"
                  decoding="async"
                  style={{ '--op': asset.objectPosition } as CSSProperties}
                />
              </figure>
              <h3 className="work__title">{category.title}</h3>
              <p className="work__blurb">{category.blurb}</p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
