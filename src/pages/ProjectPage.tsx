import { useState } from 'react';
import { SiteLink } from '../router';
import Lightbox from '../components/Lightbox';
import {
  categoryLabels,
  getPublishedProjects,
  getProjectBySlug,
  projectEnquiry,
} from '../content/portfolio';

/** Single project view: lead image, full-composition sequence, enquiry action. */
export default function ProjectPage({ slug }: { slug: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <section className="project project--missing">
        <p className="eyebrow">The Portfolio</p>
        <h1 className="section-title">Project not found.</h1>
        <p className="project__missing-body">
          This project may have been retired from the portfolio.
        </p>
        <SiteLink href="/portfolio" className="link-arrow">
          ← Back to the portfolio
        </SiteLink>
      </section>
    );
  }

  const projects = getPublishedProjects();
  const position = projects.findIndex((entry) => entry.slug === project.slug);
  const previous = projects[(position - 1 + projects.length) % projects.length];
  const next = projects[(position + 1) % projects.length];
  const [lead, ...sequence] = project.gallery;

  return (
    <article className="project">
      <header className="project__head">
        <SiteLink href="/portfolio" className="link-arrow project__back">
          ← The Portfolio
        </SiteLink>
        <p className="eyebrow project__eyebrow">{categoryLabels[project.category]}</p>
        <h1 className="section-title">{project.title}</h1>
      </header>

      <figure className="project__lead">
        <img
          src={lead.src}
          alt={lead.alt}
          loading="eager"
          decoding="async"
          onClick={() => setLightboxIndex(0)}
        />
      </figure>

      {sequence.length > 0 && (
        <div className="project__sequence">
          {sequence.map((image, index) => (
            <figure className="project__shot" key={image.src}>
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                onClick={() => setLightboxIndex(index + 1)}
              />
            </figure>
          ))}
        </div>
      )}

      <aside className="project__actions">
        <a
          className="btn btn--solid project__enquire"
          href={projectEnquiry(project)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Enquire about a similar shoot
        </a>
        <nav className="project__pager" aria-label="More projects">
          <SiteLink href={`/portfolio/${previous.slug}`} className="link-arrow">
            ← {previous.title}
          </SiteLink>
          <SiteLink href={`/portfolio/${next.slug}`} className="link-arrow">
            {next.title} →
          </SiteLink>
        </nav>
      </aside>

      {lightboxIndex !== null && (
        <Lightbox
          images={project.gallery}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  );
}
