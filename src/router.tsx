/**
 * Minimal history router — no dependency needed for two routes.
 *
 * navigate() pushes a path and broadcasts a custom event; usePath() subscribes.
 * SiteLink renders real hrefs (so direct links, middle-click and refresh all
 * work) but intercepts plain left clicks for client-side navigation.
 *
 * Hash links ("#packages") point at homepage sections: from another route
 * SiteLink navigates to "/" first, then scrolls to the section, so the
 * Services/Packages anchors keep working site-wide.
 */
import { useEffect, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

const NAVIGATE_EVENT = 'bs:navigate';

/** Current pathname without the trailing slash ("/" for the homepage). */
export function getPath(): string {
  const path = window.location.pathname.replace(/\/+$/, '');
  return path === '' ? '/' : path;
}

export function navigate(to: string, options?: { replace?: boolean }): void {
  if (options?.replace) {
    window.history.replaceState({}, '', to);
  } else {
    window.history.pushState({}, '', to);
  }
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: { path: getPath() } }));
}

/** Subscribe to route changes; returns the current path ("/", "/portfolio", …). */
export function usePath(): string {
  const [path, setPath] = useState(getPath);

  useEffect(() => {
    const sync = () => setPath(getPath());
    window.addEventListener(NAVIGATE_EVENT, sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener(NAVIGATE_EVENT, sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  return path;
}

/** Smooth-scroll to a section id on the current page. */
export function scrollToId(id: string): void {
  const target = id === 'top' ? null : document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

type SiteLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  /** Invoked after navigation (used by the mobile menu to close itself). */
  onNavigate?: () => void;
};

/**
 * Internal link: routes ("/portfolio") go through the router; hashes
 * ("#packages") scroll on the homepage or navigate home first, then scroll.
 */
export function SiteLink({ href, className, children, ariaLabel, onNavigate }: SiteLinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (new tab, download, …) behave natively.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    onNavigate?.();

    if (href.startsWith('#')) {
      const id = href.slice(1);
      if (getPath() !== '/') {
        navigate('/');
        if (id === 'top') return; // landing home — already at the top
        // Wait one frame so the homepage sections exist before scrolling.
        requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(id)));
      } else {
        scrollToId(id);
      }
      return;
    }

    const [path, hash] = href.split('#');
    if (getPath() !== path) {
      navigate(path || '/');
    }
    if (hash) {
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(hash)));
    } else if (getPath() !== path) {
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <a className={className} href={href} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </a>
  );
}
