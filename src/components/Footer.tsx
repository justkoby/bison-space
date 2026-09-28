import Logo from './Logo';
import { nav, links, brand, footer } from '../content/site';
import { useSiteContent } from '../data/SiteContent';
import { SiteLink } from '../router';

export default function Footer() {
  const { settings } = useSiteContent();
  // Prefer the admin-managed URL; fall back to the checked-in default so a blank
  // setting never produces a broken link.
  const instagram = settings.instagram || links.instagram;
  const behance = settings.behance || links.behance;
  const whatsapp = settings.whatsapp || links.whatsapp;
  // Footer wording: admin-managed value first, checked-in copy as the fallback
  // so an emptied field restores today's wording instead of rendering blank.
  const tagline = settings.footerTagline || footer.tagline;
  const studioNote = settings.footerStudioNote || footer.studioNote;
  const copyright = settings.footerCopyright || footer.copyright;
  const location = settings.studioLocation || brand.location;
  // Contact details are hidden until the studio supplies them — nothing invented.
  const email = settings.contactEmail.trim();
  const phone = settings.contactPhone.trim();
  // tel: hrefs carry digits and a leading + only; the visible text keeps formatting.
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  return (
    <footer className="footer" id="contact">
      <div className="footer__top">
        <div className="footer__brand">
          <Logo className="footer__logo" />
          <p className="footer__tagline">{tagline}</p>
        </div>

        <div className="footer__col">
          <h3 className="footer__heading">Explore</h3>
          {nav.map((item) => (
            <SiteLink className="footer__link" href={item.href} key={item.label}>
              {item.label}
            </SiteLink>
          ))}
        </div>

        <div className="footer__col">
          <h3 className="footer__heading">Connect</h3>
          <a className="footer__link" href={instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a className="footer__link" href={behance} target="_blank" rel="noopener noreferrer">
            Behance
          </a>
          <a className="footer__link" href={whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </div>

        <div className="footer__col">
          <h3 className="footer__heading">Studio</h3>
          {location ? <p className="footer__line">{location}</p> : null}
          {email ? (
            <a className="footer__link" href={`mailto:${email}`}>
              {email}
            </a>
          ) : null}
          {phone ? (
            <a className="footer__link" href={phoneHref}>
              {phone}
            </a>
          ) : null}
          {studioNote ? <p className="footer__line">{studioNote}</p> : null}
        </div>
      </div>

      <div className="footer__bottom">
        <p>{copyright}</p>
      </div>
    </footer>
  );
}
