import type { MouseEvent, ReactNode } from 'react';
import { navigate } from '../router';

/**
 * Client-side link within the app (works for both /admin and public routes).
 * Renders a real href (middle-click / open-in-new-tab work) but intercepts plain
 * left clicks to route without a full page reload.
 */
export function AdminLink({
  to,
  className,
  children,
  ariaLabel,
}: {
  to: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(to);
  };
  return (
    <a className={className} href={to} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </a>
  );
}
