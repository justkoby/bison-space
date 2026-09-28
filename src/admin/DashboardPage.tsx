import { AdminLink } from './AdminLink';
import { getContentSource } from '../data/contentApi';

const CARDS = [
  {
    to: '/admin/portfolio',
    title: 'Portfolio',
    body: 'Create and edit projects: category, slug, cover, ordered gallery, alt text, display order and draft/published status.',
  },
  {
    to: '/admin/hero',
    title: 'Hero photo wall',
    body: 'Order the three drifting columns, add or replace frames, and preview the loop.',
  },
  {
    to: '/admin/packages',
    title: 'Services & packages',
    body: 'Edit the four session categories and their packages. Incomplete packages stay draft until published.',
  },
  {
    to: '/admin/settings',
    title: 'Site settings',
    body: 'Social and contact URLs, the WhatsApp catalogue, and the Google Maps link (left empty until supplied).',
  },
];

/** /admin — dashboard landing with links to each editor. */
export default function DashboardPage() {
  const source = getContentSource();
  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-page-sub">Manage the content that appears on the public site.</p>
        </div>
      </div>

      <div className="adm-notice adm-notice--info">
        Public content source:{' '}
        <strong>{source === 'supabase' ? 'Supabase (live)' : 'static modules'}</strong>.
        {source === 'static'
          ? ' The site still renders the checked-in content until you verify the migration and set VITE_CONTENT_SOURCE=supabase.'
          : ' The public site is reading published content from Supabase.'}
      </div>

      <ul className="adm-cards">
        {CARDS.map((card) => (
          <li key={card.to}>
            <AdminLink to={card.to} className="adm-card">
              <h2 className="adm-card__title">{card.title}</h2>
              <p className="adm-card__body">{card.body}</p>
              <span className="adm-card__cta">Open →</span>
            </AdminLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
