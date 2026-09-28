import { useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { navigate, usePath } from '../router';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { AdminLink } from './AdminLink';
import { Button, Loading, Notice } from './components/ui';
import {
  IconClose,
  IconDashboard,
  IconExternal,
  IconHero,
  IconLogout,
  IconMenu,
  IconPackages,
  IconPortfolio,
  IconServices,
  IconSettings,
  type IconProps,
} from './components/icons';
import Logo from '../components/Logo';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import PortfolioListPage from './PortfolioListPage';
import ProjectEditorPage from './ProjectEditorPage';
import HeroManagerPage from './HeroManagerPage';
import ServicesPage from './ServicesPage';
import PackagesPage from './PackagesPage';
import SettingsPage from './SettingsPage';
import './admin.css';

type NavItem = {
  to: string;
  label: string;
  exact?: boolean;
  Icon: ComponentType<IconProps>;
};

const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', exact: true, Icon: IconDashboard },
  { to: '/admin/portfolio', label: 'Portfolio', Icon: IconPortfolio },
  { to: '/admin/hero', label: 'Hero', Icon: IconHero },
  { to: '/admin/services', label: 'Services', Icon: IconServices },
  { to: '/admin/packages', label: 'Packages', Icon: IconPackages },
  { to: '/admin/settings', label: 'Settings', Icon: IconSettings },
];

function isActive(item: NavItem, path: string): boolean {
  return item.exact ? path === item.to : path.startsWith(item.to);
}

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

/** The signed-in chrome: rounded workspace, top bar, icon rail, routed editor. */
function AdminShell() {
  const path = usePath();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="adm-shell">
      <div className="adm-workspace">
        <header className="adm-topbar">
          <AdminLink to="/admin" className="adm-topbar__brand" ariaLabel="Bison’s Space — admin dashboard">
            <Logo className="adm-topbar__logo" />
          </AdminLink>

          <nav className="adm-topnav" aria-label="Admin sections">
            {NAV.map((item) => (
              <AdminLink
                key={item.to}
                to={item.to}
                className={isActive(item, path) ? 'adm-topnav__link adm-topnav__link--active' : 'adm-topnav__link'}
              >
                {item.label}
              </AdminLink>
            ))}
          </nav>

          <div className="adm-topbar__right">
            <a className="adm-topbar__site" href="/" target="_blank" rel="noreferrer">
              View site ↗
            </a>
            <span className="adm-topbar__user" title={user?.email ?? ''}>
              {user?.email ?? ''}
            </span>
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
            <button
              type="button"
              className="adm-menubtn"
              aria-expanded={menuOpen}
              aria-label="Open admin menu"
              onClick={() => setMenuOpen(true)}
            >
              <IconMenu />
            </button>
          </div>
        </header>

        {menuOpen ? (
          <div className="adm-drawer__backdrop" role="presentation" onClick={closeMenu}>
            <div
              className="adm-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Admin menu"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="adm-drawer__head">
                <Logo className="adm-drawer__logo" />
                <button type="button" className="adm-menubtn" aria-label="Close admin menu" onClick={closeMenu}>
                  <IconClose />
                </button>
              </div>
              <nav className="adm-drawer__nav" aria-label="Admin sections">
                {NAV.map((item) => (
                  <AdminLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className={isActive(item, path) ? 'adm-drawer__link adm-drawer__link--active' : 'adm-drawer__link'}
                  >
                    <item.Icon />
                    <span>{item.label}</span>
                  </AdminLink>
                ))}
              </nav>
              <div className="adm-drawer__foot">
                <a className="adm-drawer__link" href="/" target="_blank" rel="noreferrer">
                  <IconExternal />
                  <span>View site</span>
                </a>
                <button
                  type="button"
                  className="adm-drawer__link adm-drawer__link--button"
                  onClick={() => {
                    closeMenu();
                    void signOut();
                  }}
                >
                  <IconLogout />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="adm-body">
          <nav className="adm-rail" aria-label="Admin sections">
            {NAV.map((item) => (
              <AdminLink
                key={item.to}
                to={item.to}
                title={item.label}
                ariaLabel={item.label}
                className={isActive(item, path) ? 'adm-rail__btn adm-rail__btn--active' : 'adm-rail__btn'}
              >
                <item.Icon />
              </AdminLink>
            ))}
            <span className="adm-rail__sep" aria-hidden="true" />
            <a
              className="adm-rail__btn"
              href="/"
              target="_blank"
              rel="noreferrer"
              title="View site"
              aria-label="View site (opens in a new tab)"
            >
              <IconExternal />
            </a>
          </nav>

          <main className="adm-main">{renderRoute(path)}</main>
        </div>
      </div>
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
