import { useEffect, useState } from 'react';
import { getSettings, updateSettings, type SettingsInput } from '../data/adminApi';
import type { SiteSettingsRow } from '../lib/types';
import { Button, ErrorState, Field, Loading, Notice, PageHeader, TextInput } from './components/ui';

type FormState = SettingsInput;

function toForm(row: SiteSettingsRow): FormState {
  return {
    instagramUrl: row.instagram_url,
    behanceUrl: row.behance_url,
    whatsappUrl: row.whatsapp_url,
    whatsappCatalogUrl: row.whatsapp_catalog_url,
    mapsUrl: row.maps_url,
  };
}

/** A field is only "valid" when blank or a well-formed http(s) URL. */
function badUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol !== 'http:' && url.protocol !== 'https:';
  } catch {
    return true;
  }
}

/** /admin/settings — social/contact URLs, WhatsApp catalogue, Google Maps link. */
export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    getSettings()
      .then((row) => {
        if (!alive) return;
        setForm(toForm(row));
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setLoadError(err instanceof Error ? err.message : 'Could not load site settings.');
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <Loading label="Loading site settings…" />;
  if (loadError) return <ErrorState message={loadError} />;
  if (!form) return null;

  const urlErrors: Partial<Record<keyof FormState, string>> = {};
  (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
    if (badUrl(form[key])) urlErrors[key] = 'Enter a full URL starting with https:// (or leave it blank).';
  });
  const hasUrlError = Object.keys(urlErrors).length > 0;

  async function onSave() {
    if (!form || hasUrlError) return;
    setBusy(true);
    setSaveError(null);
    setSaved(false);
    try {
      const row = await updateSettings({
        instagramUrl: form.instagramUrl.trim(),
        behanceUrl: form.behanceUrl.trim(),
        whatsappUrl: form.whatsappUrl.trim(),
        whatsappCatalogUrl: form.whatsappCatalogUrl.trim(),
        mapsUrl: form.mapsUrl.trim(),
      });
      setForm(toForm(row));
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Site settings"
        subtitle="Social and contact links used across the public site. Leave a field blank to keep that action pending — nothing is invented."
      />

      {saveError ? <Notice tone="error">{saveError}</Notice> : null}
      {saved ? <Notice tone="success">Site settings saved.</Notice> : null}

      <div className="adm-form">
        <section className="adm-section">
          <h2 className="adm-section__title">Social</h2>
          <div className="adm-form__grid">
            <Field label="Instagram URL" htmlFor="s-instagram" error={urlErrors.instagramUrl}>
              <TextInput
                id="s-instagram"
                value={form.instagramUrl}
                placeholder="https://instagram.com/…"
                onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              />
            </Field>
            <Field label="Behance URL" htmlFor="s-behance" error={urlErrors.behanceUrl}>
              <TextInput
                id="s-behance"
                value={form.behanceUrl}
                placeholder="https://behance.net/…"
                onChange={(e) => setForm({ ...form, behanceUrl: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="adm-section">
          <h2 className="adm-section__title">Contact & WhatsApp</h2>
          <div className="adm-form__grid">
            <Field label="WhatsApp URL" htmlFor="s-whatsapp" hint="Opens the chat." error={urlErrors.whatsappUrl}>
              <TextInput
                id="s-whatsapp"
                value={form.whatsappUrl}
                placeholder="https://wa.me/…"
                onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
              />
            </Field>
            <Field label="WhatsApp catalogue URL" htmlFor="s-catalog" hint="Optional — the rate card / catalogue link." error={urlErrors.whatsappCatalogUrl}>
              <TextInput
                id="s-catalog"
                value={form.whatsappCatalogUrl}
                placeholder="https://wa.me/c/…"
                onChange={(e) => setForm({ ...form, whatsappCatalogUrl: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="adm-section">
          <h2 className="adm-section__title">Studio location</h2>
          <Field
            label="Google Maps URL"
            htmlFor="s-maps"
            hint="Left blank until a real studio address is confirmed. While blank, the public site keeps the “location pending” state — no address is invented."
            error={urlErrors.mapsUrl}
          >
            <TextInput
              id="s-maps"
              value={form.mapsUrl}
              placeholder="https://maps.google.com/…"
              onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
            />
          </Field>
        </section>

        <div className="adm-form__actions">
          <Button onClick={onSave} busy={busy} disabled={hasUrlError}>
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
