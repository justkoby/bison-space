import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

/** Shared admin UI primitives. All class names are namespaced `adm-*` so they
 *  can never collide with the public site's styles (see src/styles/global.css). */

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle';
  busy?: boolean;
};

export function Button({ variant = 'primary', busy, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn('adm-btn', `adm-btn--${variant}`, className)}
      disabled={disabled || busy}
      {...rest}
    >
      {busy ? <span className="adm-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="adm-field">
      <label className="adm-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error ? <p className="adm-field__hint">{hint}</p> : null}
      {error ? <p className="adm-field__error" role="alert">{error}</p> : null}
    </div>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('adm-input', className)} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('adm-input adm-textarea', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('adm-input adm-select', className)} {...rest}>
      {children}
    </select>
  );
}

export function StatusPill({ status }: { status: 'draft' | 'published' }) {
  return <span className={cn('adm-pill', `adm-pill--${status}`)}>{status}</span>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="adm-page-head">
      <div>
        <h1 className="adm-page-title">{title}</h1>
        {subtitle ? <p className="adm-page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="adm-page-actions">{actions}</div> : null}
    </header>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="adm-state" role="status" aria-live="polite">
      <span className="adm-spinner adm-spinner--lg" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="adm-state adm-state--empty">
      <p className="adm-state__title">{title}</p>
      {body ? <p className="adm-state__body">{body}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="adm-state adm-state--error" role="alert">
      <p className="adm-state__title">Something went wrong</p>
      <p className="adm-state__body">{message}</p>
      {onRetry ? (
        <Button variant="ghost" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error' | 'success'; children: ReactNode }) {
  return <div className={cn('adm-notice', `adm-notice--${tone}`)}>{children}</div>;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="adm-modal__backdrop" role="presentation" onClick={onCancel}>
      <div
        className="adm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="adm-modal__title">{title}</h2>
        <div className="adm-modal__body">{message}</div>
        <div className="adm-modal__actions">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
