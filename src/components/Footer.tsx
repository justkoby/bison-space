import Logo from './Logo';
import { nav, links, brand, footer } from '../content/site';

export default function Footer() {
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
            <a className="footer__link" href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </div>

        <div className="footer__col">
          <h3 className="footer__heading">Connect</h3>
          <a className="footer__link" href={links.instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a className="footer__link" href={links.behance} target="_blank" rel="noopener noreferrer">
            Behance
          </a>
          <a className="footer__link" href={links.whatsapp} target="_blank" rel="noopener noreferrer">
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
