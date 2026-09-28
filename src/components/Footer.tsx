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
  return (
    <footer className="footer" id="contact">
      <div className="footer__top">
        <div className="footer__brand">
          <Logo className="footer__logo" />
          <p className="footer__tagline">{footer.tagline}</p>
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
          <p className="footer__line">{brand.location}</p>
          <p className="footer__line">{footer.studioNote}</p>
        </div>
      </div>

      <div className="footer__bottom">
        <p>{footer.copyright}</p>
      </div>
    </footer>
  );
}
