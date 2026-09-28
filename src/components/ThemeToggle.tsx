import { toggleTheme, useTheme } from '../theme';

/**
 * Sun/moon theme switch. Rendered in the header nav (desktop) and in the
 * mobile menu head, so the theme is reachable on every breakpoint.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useTheme();
  const toLight = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-toggle${className ? ` ${className}` : ''}`}
      onClick={toggleTheme}
      aria-pressed={!toLight}
      aria-label={toLight ? 'Switch to light mode' : 'Switch to dark mode'}
      title={toLight ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {toLight ? (
        /* Sun — the theme you get by pressing */
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4.4" />
          <g strokeLinecap="round">
            <line x1="12" y1="1.8" x2="12" y2="4.2" />
            <line x1="12" y1="19.8" x2="12" y2="22.2" />
            <line x1="1.8" y1="12" x2="4.2" y2="12" />
            <line x1="19.8" y1="12" x2="22.2" y2="12" />
            <line x1="4.8" y1="4.8" x2="6.5" y2="6.5" />
            <line x1="17.5" y1="17.5" x2="19.2" y2="19.2" />
            <line x1="4.8" y1="19.2" x2="6.5" y2="17.5" />
            <line x1="17.5" y1="6.5" x2="19.2" y2="4.8" />
          </g>
        </svg>
      ) : (
        /* Moon */
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11z" />
        </svg>
      )}
    </button>
  );
}
