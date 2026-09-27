import { useEffect } from 'react';
import Header from './components/Header';
import SiteIntro from './components/SiteIntro';
import Footer from './components/Footer';
import SupportWidget from './components/SupportWidget';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import ProjectPage from './pages/ProjectPage';
import { usePath } from './router';
import { getProjectBySlug } from './content/portfolio';

/** Route table: "/", "/portfolio" and "/portfolio/:slug" — no unknown paths. */
function resolveRoute(path: string) {
  if (path === '/') return { name: 'home' } as const;
  if (path === '/portfolio') return { name: 'portfolio' } as const;
  const project = path.match(/^\/portfolio\/([^/]+)$/);
  if (project) return { name: 'project', slug: decodeURIComponent(project[1]) } as const;
  return { name: 'not-found' } as const;
}

export default function App() {
  const path = usePath();
  const route = resolveRoute(path);
  const isHome = route.name === 'home';

  // Scroll to the top and refresh the title on every route change.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title =
      route.name === 'portfolio'
        ? 'Portfolio — Bison’s Space'
        : route.name === 'project'
          ? `${getProjectBySlug(route.slug)?.title ?? 'Project'} — Bison’s Space`
          : 'Bison’s Space — Portrait, Beauty, Fashion & Editorial Photography';
  }, [route]);

  return (
    <>
      {/* The branded opening sequence belongs to the homepage only */}
      {isHome && <SiteIntro />}
      <Header variant={isHome ? 'overlay' : 'solid'} />
      <main>
        {route.name === 'home' && <HomePage />}
        {route.name === 'portfolio' && <PortfolioPage />}
        {route.name === 'project' && <ProjectPage slug={route.slug} />}
        {route.name === 'not-found' && <PortfolioPage />}
      </main>
      <Footer />
      <SupportWidget />
    </>
  );
}
