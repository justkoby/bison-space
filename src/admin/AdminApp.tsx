import type { ReactNode } from 'react';
import { navigate, usePath } from '../router';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { AdminLink } from './AdminLink';
import { Button, Loading, Notice } from './components/ui';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import PortfolioListPage from './PortfolioListPage';
import ProjectEditorPage from './ProjectEditorPage';
import HeroManagerPage from './HeroManagerPage';
import ServicesPage from './ServicesPage';
import PackagesPage from './PackagesPage';
import SettingsPage from './SettingsPage';
import './admin.css';

const NAV = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/portfolio', label: 'Portfolio' },
  { to: '/admin/hero', label: 'Hero wall' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/packages', label: 'Packages' },
  { to: '/admin/settings', label: 'Settings' },
];

/** Resolve the admin sub-route from the full path (everything under /admin). */
function renderRoute(path: string): ReactNode {
  if (path === '/admin' || path === '/admin/') return <DashboardPage />;
  if (path === '/admin/portfolio') return <PortfolioListPage />;
  if (path === '/admin/portfolio/new') return <ProjectEditorPage />;
  const edit = path.match(/^\/admin\/portfolio\/([^/]+)$/);
  if (edit) return <ProjectEditorPage projectId={decodeURIComponent(edit[1])} />;
  if (path === '/admin/hero') return <HeroManagerPage />;
  if (path === '/admin/services') return <ServicesPage />;
  if (path === '/admin/packages') return <PackagesPage />;
  if (path === '/admin/settings') return <SettingsPage />;
  return (
    <div className="adm-state adm-state--empty">
      <p className="adm-state__title">Page not found</p>
      <p className="adm-state__body">That admin page doesn’t exist.</p>
      <Button variant="ghost" onClick={() => navigate('/admin')}>
        Back to dashboard
      </Button>
    </div>
  );
}

/** The signed-in chrome: nav rail + the routed editor. */
function AdminShell() {
  const path = usePath();
  const { user, signOut } = useAuth();

  return (
    <div className="adm-shell">
      <header className="adm-topbar">
        <span className="adm-topbar__brand">Bison’s Space · Content</span>
        <nav className="adm-nav" aria-label="Admin sections">
          {NAV.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <AdminLink
                key={item.to}
                to={item.to}
                className={active ? 'adm-nav__link adm-nav__link--active' : 'adm-nav__link'}
                ariaLabel={item.label}
              >
                {item.label}
              </AdminLink>
            );
          })}
        </nav>
        <div className="adm-topbar__right">
          <a className="adm-nav__link" href="/" target="_blank" rel="noreferrer">
            View site ↗
          </a>
          <span className="adm-topbar__user" title={user?.email ?? ''}>
            {user?.email ?? ''}
          </span>
          <Button variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="adm-main">{renderRoute(path)}</main>
    </div>
  );
}

/** Gate: not-configured → notice; loading → spinner; anon → login; non-admin → denied. */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { configured, loading, session, isAdmin } = useAuth();

  if (!configured) {
    return (
      <div className="adm-guard">
        <Notice tone="warn">
          Supabase isn’t configured for this build. Copy <code>.env.example</code> to{' '}
          <code>.env.local</code>, set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>, then rebuild. See the admin setup guide in{' '}
          <code>docs/admin-setup.md</code>.
        </Notice>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="adm-guard">
        <Loading label="Checking your session…" />
      </div>
    );
  }

  // Signed out → show the login form (any /admin sub-path is fine).
  if (!session) {
    return <LoginPage />;
  }

  // Signed in but not on the allowlist → deny. RLS is the real boundary.
  if (!isAdmin) {
    return (
      <div className="adm-guard">
        <Notice tone="error">
          This account isn’t authorized to edit content. Ask the studio owner to add your user id to
          the <code>admin_users</code> allowlist.
        </Notice>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * /admin/* — the private content dashboard. Mounted lazily by App so the
 * Supabase client never lands in the public bundle. Wraps everything in the
 * AuthProvider and the RequireAdmin gate.
 */
export default function AdminApp() {
  return (
    <AuthProvider>
      <RequireAdmin>
        <AdminShell />
      </RequireAdmin>
    </AuthProvider>
  );
}
