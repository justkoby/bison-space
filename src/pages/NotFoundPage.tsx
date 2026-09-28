import { SiteLink } from '../router';

/**
 * Dedicated 404 view for unknown routes. Shown instead of silently rendering
 * another page, so a mistyped or stale URL is never mistaken for real content.
 * Reuses the project shell (dark stage, editorial type) to stay on-brand.
 */
export default function NotFoundPage() {
  return (
    <section className="project project--missing not-found">
      <p className="eyebrow">Bison’s Space</p>
      <h1 className="section-title">Page not found.</h1>
      <p className="project__missing-body">
        The page you’re looking for doesn’t exist, or it may have been moved.
      </p>
      <nav className="not-found__links" aria-label="Get back on track">
        <SiteLink href="/" className="link-arrow">
          ← Back to the homepage
        </SiteLink>
        <SiteLink href="/portfolio" className="link-arrow">
          View the portfolio →
        </SiteLink>
      </nav>
    </section>
  );
}
