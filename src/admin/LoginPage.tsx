import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { SiteLink } from '../router';
import Logo from '../components/Logo';
import { Button, Field, TextInput, Notice } from './components/ui';

/** One strong frame from an existing shoot anchors the left half of the panel. */
const LOGIN_IMAGE = '/images/hero/hero-coin-veil-eyes.jpg';

/** /admin/login — private split-screen sign-in for allowlisted studio accounts. */
export default function LoginPage() {
  const { signIn, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    const result = await signIn(email.trim(), password);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="adm-login">
      <div className="adm-login__frame">
        <div className="adm-login__media" aria-hidden="true">
          <img className="adm-login__media-img" src={LOGIN_IMAGE} alt="" />
        </div>

        <div className="adm-login__side">
          <form className="adm-login__form" onSubmit={onSubmit} noValidate>
            <Logo className="adm-login__logo" />

            <h1 className="adm-login__title">Welcome back</h1>
            <p className="adm-login__sub">Sign in to manage your website.</p>

            {!configured ? (
              <Notice tone="warn">
                Supabase isn’t configured for this build. Set <code>VITE_SUPABASE_URL</code> and{' '}
                <code>VITE_SUPABASE_ANON_KEY</code> (see <code>.env.example</code> and the admin
                setup guide), then rebuild.
              </Notice>
            ) : null}

            {error ? <Notice tone="error">{error}</Notice> : null}

            <Field label="Email" htmlFor="adm-email">
              <TextInput
                id="adm-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
              />
            </Field>

            <Field label="Password" htmlFor="adm-password">
              <span className="adm-login__pw">
                <TextInput
                  id="adm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={busy}
                />
                <button
                  type="button"
                  className="adm-login__pw-toggle"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={busy}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </Field>

            <Button type="submit" busy={busy} disabled={!configured} className="adm-login__submit">
              Sign in
            </Button>

            <SiteLink href="/" className="adm-login__back">
              Back to website
            </SiteLink>
          </form>
        </div>
      </div>
    </div>
  );
}
