import type { ReactNode } from 'react';

/**
 * Inline stroke icons for the admin chrome (rail, top nav, drawer, actions).
 * Single colour (currentColor) so they inherit the active/inactive ink, and
 * dependency-free — no icon library in the bundle.
 */
export type IconProps = { className?: string };

function Svg({ className = '', children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={`adm-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconDashboard(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Svg>
  );
}

export function IconPortfolio(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="M21 15.5 16.5 11 9 19" />
    </Svg>
  );
}

export function IconHero(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="7" width="4" height="13" rx="1.5" />
      <rect x="10" y="4" width="4" height="16" rx="1.5" />
      <rect x="16" y="9" width="4" height="11" rx="1.5" />
    </Svg>
  );
}

export function IconServices(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8.5 7 10 4.5h4L15.5 7" />
      <circle cx="12" cy="13.5" r="3.2" />
    </Svg>
  );
}

export function IconPackages(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </Svg>
  );
}

export function IconSettings(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 7h9" />
      <circle cx="16.5" cy="7" r="2.5" />
      <path d="M20 17h-9" />
      <circle cx="7.5" cy="17" r="2.5" />
    </Svg>
  );
}

export function IconExternal(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H11" />
    </Svg>
  );
}

export function IconLogout(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" />
      <path d="m15 8 4 4-4 4" />
      <path d="M19 12H9" />
    </Svg>
  );
}

export function IconMenu(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 6.5h16" />
      <path d="M4 12h16" />
      <path d="M4 17.5h16" />
    </Svg>
  );
}

export function IconClose(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </Svg>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  );
}
