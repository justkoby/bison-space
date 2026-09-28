import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { packagesSection, whatsappEnquiry } from '../content/site';
import { useSiteContent } from '../data/SiteContent';
import type { ResolvedPackage, ResolvedService } from '../data/staticContent';

/** Fired by the "What We Shoot" cards so the matching tab opens. */
export const SELECT_CATEGORY_EVENT = 'bs:select-category';

export default function Packages() {
  const { services, packages } = useSiteContent();
  const [active, setActive] = useState(services[0]?.slug ?? '');

  useEffect(() => {
    const onSelect = (event: Event) => {
      const slug = (event as CustomEvent<string>).detail;
      if (services.some((service) => service.slug === slug)) setActive(slug);
    };
    window.addEventListener(SELECT_CATEGORY_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_CATEGORY_EVENT, onSelect);
  }, [services]);

  const category = services.find((item) => item.slug === active) ?? services[0];
  const confirmed = category
    ? packages.filter((pkg) => pkg.categorySlug === category.slug)
    : [];

  return (
    <section className="packages" id="packages">
      <p className="eyebrow eyebrow--ink">{packagesSection.eyebrow}</p>
      <h2 className="section-title section-title--ink">{packagesSection.headline}</h2>

      <div className="packages__tabs" role="tablist" aria-label="Session categories">
        {services.map((item) => (
          <button
            key={item.slug}
            type="button"
            role="tab"
            id={`tab-${item.slug}`}
            aria-selected={item.slug === category?.slug}
            aria-controls={`panel-${item.slug}`}
            className={`packages__tab${item.slug === category?.slug ? ' is-active' : ''}`}
            onClick={() => setActive(item.slug)}
          >
            {item.title}
          </button>
        ))}
      </div>

      {category ? (
        <div
          className="packages__panel"
          role="tabpanel"
          id={`panel-${category.slug}`}
          aria-labelledby={`tab-${category.slug}`}
        >
          <div className={`packages__grid${confirmed.length > 0 ? '' : ' packages__grid--single'}`}>
            {confirmed.length > 0
              ? confirmed.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} categoryTitle={category.title} />
                ))
              : <CustomCard categoryTitle={category.title} service={category} />}
          </div>
        </div>
      ) : (
        <div className="packages__panel">
          <p className="packages__note">{packagesSection.custom.description}</p>
        </div>
      )}

      <p className="packages__note">{packagesSection.note}</p>
    </section>
  );
}

function PackageCard({ pkg, categoryTitle }: { pkg: ResolvedPackage; categoryTitle: string }) {
  const specs = [
    pkg.duration && { label: 'Duration', value: pkg.duration },
    pkg.retouchedPhotos && { label: 'Retouched', value: pkg.retouchedPhotos },
    pkg.outfits && { label: 'Outfits', value: pkg.outfits },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="package">
      {pkg.src ? (
        <figure className="package__frame">
          <img
            src={pkg.src}
            alt={pkg.alt ?? ''}
            loading="lazy"
            decoding="async"
            style={{ '--op': pkg.objectPosition } as CSSProperties}
          />
        </figure>
      ) : null}
      <div className="package__body">
        <p className="package__category">{categoryTitle}</p>
        <h3 className="package__name">{pkg.name}</h3>
        <p className="package__desc">{pkg.description}</p>
        {specs.length > 0 && (
          <dl className="package__specs">
            {specs.map((spec) => (
              <div className="package__spec" key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <a
          className="btn btn--ink package__cta"
          href={whatsappEnquiry(categoryTitle)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {pkg.price ? `${packagesSection.bookLabel} · ${pkg.price}` : packagesSection.custom.cta}
        </a>
      </div>
    </article>
  );
}

/** Polished placeholder shown until real packages are confirmed for a category. */
function CustomCard({ categoryTitle, service }: { categoryTitle: string; service: ResolvedService }) {
  return (
    <article className="package package--wide">
      <figure className="package__frame">
        <img
          src={service.src}
          alt={service.alt}
          loading="lazy"
          decoding="async"
          style={{ '--op': service.objectPosition } as CSSProperties}
        />
      </figure>
      <div className="package__body">
        <p className="package__category">{categoryTitle}</p>
        <h3 className="package__name">{packagesSection.custom.name}</h3>
        <p className="package__desc">{packagesSection.custom.description}</p>
        <a
          className="btn btn--ink package__cta"
          href={whatsappEnquiry(categoryTitle)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {packagesSection.custom.cta} <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}
