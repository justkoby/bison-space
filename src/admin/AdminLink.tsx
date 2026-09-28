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
  title,
  onClick,
}: {
  to: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  /** Hover tooltip (used by the icon rail). */
  title?: string;
  /** Runs after a client-side navigation (used to close the mobile drawer). */
  onClick?: () => void;
}) {
  const onClickHandler = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(to);
    onClick?.();
  };
  return (
    <a className={className} href={to} aria-label={ariaLabel} title={title} onClick={onClickHandler}>
      {children}
    </a>
  );
}
