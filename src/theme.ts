import { useSyncExternalStore } from 'react';

/**
 * Public-site theme: 'dark' is the brand default (ink surfaces, paper type);
 * 'light' flips the token set (paper surfaces, ink type). The choice persists
 * per browser in localStorage and is applied as `data-theme` on <html> — an
 * inline script in index.html does the same before first paint so there is no
 * flash of the wrong theme on reload.
 */
export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'bisons-theme';

let theme: Theme = readStored();

const listeners = new Set<() => void>();

function readStored(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function apply(next: Theme) {
  theme = next;
  const root = document.documentElement;
  root.dataset.theme = next;
  root.style.colorScheme = next;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', next === 'light' ? '#f4ede2' : '#0b0a08');
}

export function initTheme() {
  apply(theme);
}

export function toggleTheme() {
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private mode / blocked storage — the toggle still works for this visit.
  }
  apply(next);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current theme, reactive across every toggle on the page. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => theme,
    () => 'dark',
  );
}
