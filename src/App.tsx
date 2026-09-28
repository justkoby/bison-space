import { Suspense, lazy, useEffect } from 'react';
import Header from './components/Header';
import SiteIntro from './components/SiteIntro';
import Footer from './components/Footer';
import SupportWidget from './components/SupportWidget';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import ProjectPage from './pages/ProjectPage';
import NotFoundPage from './pages/NotFoundPage';
import { usePath } from './router';
import { getProjectBySlug } from './content/portfolio';
import { SiteContentProvider } from './data/SiteContent';

// The admin dashboard (and the Supabase client it pulls in) is code-split so it
// never lands in the public bundle. It only loads when someone visits /admin.
const AdminApp = lazy(() => import('./admin/AdminApp'));

/** Route table: "/admin/*", "/", "/portfolio" and "/portfolio/:slug"; else 404. */
function resolveRoute(path: string) {
  if (path === '/admin' || path.startsWith('/admin/')) return { name: 'admin' } as const;
  if (path === '/') return { name: 'home' } as const;
  if (path === '/portfolio') return { name: 'portfolio' } as const;
  const project = path.match(/^\/portfolio\/([^/]+)$/);
  if (project) return { name: 'project', slug: decodeURIComponent(project[1]) } as const;
  return { name: 'not-found' } as const;
}

/** Minimal fallback shown while the lazy /admin chunk loads. */
function AdminFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0e0f12',
        color: '#9aa0ac',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      Loading dashboard…
    </div>
  );
}

export default function App() {
  const path = usePath();
  const route = resolveRoute(path);
  const isHome = route.name === 'home';

  // Scroll to the top and refresh the title on every route change.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title =
      route.name === 'admin'
        ? 'Content dashboard — Bison’s Space'
        : route.name === 'portfolio'
          ? 'Portfolio — Bison’s Space'
          : route.name === 'project'
            ? `${getProjectBySlug(route.slug)?.title ?? 'Project'} — Bison’s Space`
            : route.name === 'not-found'
              ? 'Page not found — Bison’s Space'
              : 'Bison’s Space — Portrait, Beauty, Fashion & Editorial Photography';
  }, [route]);

  // The admin area is a separate, self-contained app — no public chrome.
  if (route.name === 'admin') {
    return (
      <Suspense fallback={<AdminFallback />}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <SiteContentProvider>
      {/* The branded opening sequence belongs to the homepage only */}
      {isHome && <SiteIntro />}
      <Header variant={isHome ? 'overlay' : 'solid'} />
      <main>
        {route.name === 'home' && <HomePage />}
        {route.name === 'portfolio' && <PortfolioPage />}
        {route.name === 'project' && <ProjectPage slug={route.slug} />}
        {route.name === 'not-found' && <NotFoundPage />}
      </main>
      <Footer />
      <SupportWidget />
    </SiteContentProvider>
  );
}
