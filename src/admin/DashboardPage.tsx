import { useCallback, useEffect, useState } from 'react';
import { AdminLink } from './AdminLink';
import { useAuth } from '../auth/AuthContext';
import { getContentSource } from '../data/contentApi';
import {
  listHeroImages,
  listImages,
  listPackages,
  listProjects,
  listServices,
} from '../data/adminApi';
import type { ProjectRow } from '../lib/types';
import { ErrorState, Loading, StatusPill } from './components/ui';
import { IconHero, IconPlus, IconServices } from './components/icons';

type DashData = {
  projects: ProjectRow[];
  covers: Record<string, string>;
  heroImages: number;
  services: number;
  packages: number;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * /admin — dashboard landing: real content counts, the most recently touched
 * projects, and the three actions an editor reaches for most. Every number
 * comes from the content tables; nothing is invented.
 */
export default function DashboardPage() {
  const source = getContentSource();
  const { user } = useAuth();
  const [data, setData] = useState<DashData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    setError(null);
    Promise.all([listProjects(), listImages(), listHeroImages(), listServices(), listPackages()])
      .then(([projects, images, heroImages, services, packages]) => {
        const covers: Record<string, string> = {};
        images.forEach((image) => {
          covers[image.id] = image.src;
        });
        setData({
          projects,
          covers,
          heroImages: heroImages.length,
          services: services.length,
          packages: packages.length,
        });
      })
      .catch((err: unknown) => {
        setData(null);
        setError(err instanceof Error ? err.message : 'Could not load the dashboard.');
      });
  }, []);

  useEffect(() => {
    setData(null);
    load();
  }, [load, attempt]);

  const localName = (user?.email ?? '').split('@')[0];
  const displayName = localName ? localName.charAt(0).toUpperCase() + localName.slice(1) : 'there';

  const recent = data
    ? [...data.projects].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 6)
    : [];
  const published = data ? data.projects.filter((p) => p.status === 'published').length : 0;

  const stats = data
    ? [
        { label: 'Projects', value: data.projects.length },
        { label: 'Published', value: published },
        { label: 'Hero images', value: data.heroImages },
        { label: 'Services', value: data.services },
        { label: 'Packages', value: data.packages },
      ]
    : [];

  return (
    <div>
      <div className="adm-welcome-row">
        <div>
          <h1 className="adm-welcome">
            Welcome back, <span>{displayName}</span>
          </h1>
          <p className="adm-page-sub">Manage the content that appears on the public site.</p>
        </div>
        <div className="adm-welcome__actions">
          <AdminLink to="/admin/portfolio/new" className="adm-btn adm-btn--primary">
            <IconPlus /> Add project
          </AdminLink>
          <AdminLink to="/admin/hero" className="adm-btn adm-btn--subtle">
            <IconHero /> Manage hero
          </AdminLink>
          <AdminLink to="/admin/services" className="adm-btn adm-btn--subtle">
            <IconServices /> Edit services
          </AdminLink>
        </div>
      </div>

      <div className="adm-notice adm-notice--info">
        Public content source:{' '}
        <strong>{source === 'supabase' ? 'Supabase (live)' : 'static modules'}</strong>.
        {source === 'static'
          ? ' The site still renders the checked-in content until you verify the migration and set VITE_CONTENT_SOURCE=supabase.'
          : ' The public site is reading published content from Supabase.'}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
      ) : !data ? (
        <Loading label="Loading dashboard…" />
      ) : (
        <>
          <ul className="adm-stats">
            {stats.map((stat) => (
              <li className="adm-stat" key={stat.label}>
                <span className="adm-stat__value">{stat.value}</span>
                <span className="adm-stat__label">{stat.label}</span>
              </li>
            ))}
          </ul>

          <section className="adm-panel">
            <header className="adm-panel__head">
              <h2 className="adm-panel__title">Recent projects</h2>
              <AdminLink to="/admin/portfolio" className="adm-panel__action">
                View all →
              </AdminLink>
            </header>

            {recent.length === 0 ? (
              <p className="adm-group__empty">No projects yet — add the first one to get started.</p>
            ) : (
              <div className="adm-ptable" role="table" aria-label="Recent projects">
                <div className="adm-ptable__head" role="row">
                  <span role="columnheader">Project</span>
                  <span role="columnheader">Status</span>
                  <span role="columnheader">Updated</span>
                  <span role="columnheader" />
                </div>
                {recent.map((project) => {
                  const cover = project.cover_image_id ? data.covers[project.cover_image_id] : undefined;
                  return (
                    <div className="adm-ptable__row" role="row" key={project.id}>
                      <span className="adm-ptable__project" role="cell">
                        <span className="adm-ptable__thumb">
                          {cover ? (
                            <img src={cover} alt="" loading="lazy" />
                          ) : (
                            <span className="adm-row__noimg" aria-hidden="true">
                              —
                            </span>
                          )}
                        </span>
                        <span className="adm-ptable__title">{project.title}</span>
                      </span>
                      <span className="adm-ptable__status" role="cell">
                        <StatusPill status={project.status} />
                      </span>
                      <span className="adm-ptable__date" role="cell">
                        {formatDate(project.updated_at)}
                      </span>
                      <span className="adm-ptable__action" role="cell">
                        <AdminLink to={`/admin/portfolio/${project.id}`} className="adm-btn adm-btn--ghost">
                          Edit
                        </AdminLink>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
