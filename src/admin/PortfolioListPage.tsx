import { useState } from 'react';
import { AdminLink } from './AdminLink';
import { useAsync } from './useAsync';
import { listProjects, listImages, deleteProject, reorderProjects } from '../data/adminApi';
import { CATEGORY_LABELS } from '../lib/types';
import type { ImageRow, ProjectRow } from '../lib/types';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Loading,
  Notice,
  PageHeader,
  StatusPill,
} from './components/ui';

async function loadAll(): Promise<{ projects: ProjectRow[]; images: Record<string, ImageRow> }> {
  const [projects, images] = await Promise.all([listProjects(), listImages()]);
  const map: Record<string, ImageRow> = {};
  for (const image of images) map[image.id] = image;
  return { projects, images: map };
}

/** /admin/portfolio — project list with reorder, delete-with-confirm, create. */
export default function PortfolioListPage() {
  const { data, loading, error, reload } = useAsync(loadAll, []);
  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <Loading label="Loading projects…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const projects = data?.projects ?? [];
  const images = data?.images ?? {};

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= projects.length) return;
    const next = [...projects];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setBusy(true);
    setActionError(null);
    try {
      await reorderProjects(next.map((project) => project.id));
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reorder failed.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    setActionError(null);
    try {
      await deleteProject(pendingDelete.id);
      setPendingDelete(null);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Portfolio"
        subtitle={`${projects.length} project${projects.length === 1 ? '' : 's'} · drag-free ordering via the arrows`}
        actions={
          <AdminLink to="/admin/portfolio/new" className="adm-btn adm-btn--primary">
            + New project
          </AdminLink>
        }
      />

      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Create your first portfolio project to see it here. Drafts stay hidden from the public site until published."
          action={
            <AdminLink to="/admin/portfolio/new" className="adm-btn adm-btn--primary">
              + New project
            </AdminLink>
          }
        />
      ) : (
        <ul className="adm-table">
          {projects.map((project, index) => {
            const cover = project.cover_image_id ? images[project.cover_image_id] : null;
            return (
              <li className="adm-row" key={project.id}>
                <span className="adm-row__thumb">
                  {cover ? <img src={cover.src} alt="" /> : <span className="adm-row__noimg">—</span>}
                </span>
                <span className="adm-row__main">
                  <span className="adm-row__title">{project.title}</span>
                  <span className="adm-row__meta">
                    /{project.slug} · {CATEGORY_LABELS[project.category]}
                  </span>
                </span>
                <StatusPill status={project.status} />
                <span className="adm-row__order">
                  <Button variant="ghost" onClick={() => move(index, -1)} disabled={index === 0 || busy} aria-label="Move up">
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => move(index, 1)}
                    disabled={index === projects.length - 1 || busy}
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                </span>
                <span className="adm-row__actions">
                  <AdminLink to={`/admin/portfolio/${project.id}`} className="adm-btn adm-btn--subtle">
                    Edit
                  </AdminLink>
                  <Button variant="danger" onClick={() => setPendingDelete(project)} disabled={busy}>
                    Delete
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={busy}
        title="Delete this project?"
        message={
          <>
            <p>
              <strong>{pendingDelete?.title}</strong> and its gallery associations will be removed.
              Uploaded image files stay in storage. This cannot be undone.
            </p>
          </>
        }
        confirmLabel="Delete project"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
