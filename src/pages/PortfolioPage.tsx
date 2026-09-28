import { useState } from 'react';
import type { CSSProperties } from 'react';
import { SiteLink } from '../router';
import {
  categoryLabels,
  portfolioCta,
  portfolioIntro,
} from '../content/portfolio';
import type { PortfolioCategory } from '../content/portfolio';
import { links } from '../content/site';
import { useSiteContent } from '../data/SiteContent';

type Filter = PortfolioCategory | 'all';

/** Standalone portfolio index: filterable grid of shoot/project tiles. */
export default function PortfolioPage() {
  const { projects } = useSiteContent();
  const [filter, setFilter] = useState<Filter>('all');

  // Only offer categories the published projects genuinely cover.
  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: projects.length },
    ...(Object.keys(categoryLabels) as PortfolioCategory[])
      .map((category) => ({
        key: category as Filter,
        label: categoryLabels[category],
        count: projects.filter((project) => project.category === category).length,
      }))
      .filter((entry) => entry.count > 0),
  ];

  const visible =
    filter === 'all' ? projects : projects.filter((project) => project.category === filter);

  return (
    <>
      <section className="portfolio-head">
        <p className="eyebrow">{portfolioIntro.eyebrow}</p>
        <h1 className="section-title">{portfolioIntro.title}</h1>
        <p className="portfolio-head__body">{portfolioIntro.body}</p>
      </section>

      <section className="portfolio">
        <div className="portfolio__filters" role="group" aria-label="Filter projects by category">
          {filters.map((entry) => (
            <button
              type="button"
              key={entry.key}
              className={`portfolio__filter${filter === entry.key ? ' is-active' : ''}`}
              aria-pressed={filter === entry.key}
              onClick={() => setFilter(entry.key)}
            >
              {entry.label} <span className="portfolio__filter-count">{entry.count}</span>
            </button>
          ))}
        </div>

        <div className="portfolio__grid" key={filter}>
          {visible.length === 0 ? (
            <p className="portfolio__empty">
              No published projects in this view yet — please check back soon.
            </p>
          ) : (
            visible.map((project, index) => (
              <SiteLink
                href={`/portfolio/${project.slug}`}
                className="portfolio__tile"
                key={project.slug}
              >
                <figure className="portfolio__frame">
                  <img
                    src={project.cover.src}
                    alt={project.cover.alt}
                    loading={index < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    style={{ '--op': project.cover.thumbPosition ?? '50% 30%' } as CSSProperties}
                  />
                </figure>
                <div className="portfolio__meta">
                  <p className="portfolio__category">{categoryLabels[project.category]}</p>
                  <h2 className="portfolio__title">{project.title}</h2>
                </div>
              </SiteLink>
            ))
          )}
        </div>
      </section>

      <section className="portfolio-cta">
        <h2 className="section-title section-title--ink">{portfolioCta.title}</h2>
        <p className="portfolio-cta__body">{portfolioCta.body}</p>
        <a
          className="btn btn--ink portfolio-cta__btn"
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          {portfolioCta.buttonLabel}
        </a>
      </section>
    </>
  );
}
