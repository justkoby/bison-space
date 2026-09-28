import { useEffect, useState } from 'react';
import { getSettings, updateSettings, type SettingsInput } from '../data/adminApi';
import type { SiteSettingsRow } from '../lib/types';
import { Button, ErrorState, Field, Loading, Notice, PageHeader, TextArea, TextInput } from './components/ui';

type FormState = SettingsInput;

/** Fields validated as http(s) URLs — everything else is free text or email/phone. */
const URL_KEYS: (keyof FormState)[] = [
  'instagramUrl',
  'behanceUrl',
  'whatsappUrl',
  'whatsappCatalogUrl',
  'mapsUrl',
];

function toForm(row: SiteSettingsRow): FormState {
  return {
    instagramUrl: row.instagram_url,
    behanceUrl: row.behance_url,
    whatsappUrl: row.whatsapp_url,
    whatsappCatalogUrl: row.whatsapp_catalog_url,
    mapsUrl: row.maps_url,
    studioLocation: row.studio_location,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    footerTagline: row.footer_tagline,
    footerStudioNote: row.footer_studio_note,
    footerCopyright: row.footer_copyright,
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

/** Blank is fine; otherwise it must look like an address (a@b.tld). */
function badEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/** Blank is fine; otherwise digits/+/separators with at least 7 digits. */
function badPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!/^\+?[\d\s().-]{7,20}$/.test(trimmed)) return true;
  return (trimmed.match(/\d/g) ?? []).length < 7;
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

  const fieldErrors: Partial<Record<keyof FormState, string>> = {};
  URL_KEYS.forEach((key) => {
    if (badUrl(form[key])) fieldErrors[key] = 'Enter a full URL starting with https:// (or leave it blank).';
  });
  if (badEmail(form.contactEmail)) fieldErrors.contactEmail = 'Enter a valid email address (or leave it blank).';
  if (badPhone(form.contactPhone)) fieldErrors.contactPhone = 'Enter a valid phone number (or leave it blank).';
  const hasFieldError = Object.keys(fieldErrors).length > 0;

  async function onSave() {
    if (!form || hasFieldError) return;
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
        studioLocation: form.studioLocation.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        footerTagline: form.footerTagline.trim(),
        footerStudioNote: form.footerStudioNote.trim(),
        footerCopyright: form.footerCopyright.trim(),
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
            <Field label="Instagram URL" htmlFor="s-instagram" error={fieldErrors.instagramUrl}>
              <TextInput
                id="s-instagram"
                value={form.instagramUrl}
                placeholder="https://instagram.com/…"
                onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              />
            </Field>
            <Field label="Behance URL" htmlFor="s-behance" error={fieldErrors.behanceUrl}>
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
          <h2 className="adm-section__title">Footer & contact</h2>
          <p className="adm-section__hint">
            These render in the public footer. Email and phone appear as working mailto:/tel: links
            when provided; empty contact fields are hidden on the site.
          </p>
          <div className="adm-form__grid">
            <Field
              label="Studio address / location"
              htmlFor="s-location"
              hint="The location line in the footer Studio column."
            >
              <TextInput
                id="s-location"
                value={form.studioLocation}
                placeholder="e.g. Adenta, Accra, Ghana"
                onChange={(e) => setForm({ ...form, studioLocation: e.target.value })}
              />
            </Field>
            <Field label="Contact email" htmlFor="s-email" error={fieldErrors.contactEmail}>
              <TextInput
                id="s-email"
                type="email"
                value={form.contactEmail}
                placeholder="studio@example.com"
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
            </Field>
            <Field label="Phone number" htmlFor="s-phone" error={fieldErrors.contactPhone}>
              <TextInput
                id="s-phone"
                type="tel"
                value={form.contactPhone}
                placeholder="+233 …"
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </Field>
          </div>
          <Field
            label="Footer tagline"
            htmlFor="s-tagline"
            hint="The line under the logo in the footer."
          >
            <TextArea
              id="s-tagline"
              value={form.footerTagline}
              onChange={(e) => setForm({ ...form, footerTagline: e.target.value })}
            />
          </Field>
          <div className="adm-form__grid">
            <Field label="Studio note" htmlFor="s-note" hint="Short note, e.g. “Sessions by appointment.”">
              <TextInput
                id="s-note"
                value={form.footerStudioNote}
                onChange={(e) => setForm({ ...form, footerStudioNote: e.target.value })}
              />
            </Field>
            <Field label="Copyright text" htmlFor="s-copyright">
              <TextInput
                id="s-copyright"
                value={form.footerCopyright}
                onChange={(e) => setForm({ ...form, footerCopyright: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="adm-section">
          <h2 className="adm-section__title">Contact & WhatsApp</h2>
          <div className="adm-form__grid">
            <Field label="WhatsApp URL" htmlFor="s-whatsapp" hint="Opens the chat." error={fieldErrors.whatsappUrl}>
              <TextInput
                id="s-whatsapp"
                value={form.whatsappUrl}
                placeholder="https://wa.me/…"
                onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
              />
            </Field>
            <Field label="WhatsApp catalogue URL" htmlFor="s-catalog" hint="Optional — the rate card / catalogue link." error={fieldErrors.whatsappCatalogUrl}>
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
            error={fieldErrors.mapsUrl}
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
          <Button onClick={onSave} busy={busy} disabled={hasFieldError}>
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
