import { useEffect, useState } from 'react';
import Logo from './Logo';
import { nav, links } from '../content/site';
import { SiteLink } from '../router';

type HeaderProps = {
  /** 'overlay' floats above the homepage hero; 'solid' docks on other routes. */
  variant?: 'overlay' | 'solid';
};

export default function Header({ variant = 'overlay' }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // The solid variant is always docked; only the homepage overlay floats.
    if (variant === 'solid') {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`header${variant === 'solid' ? ' header--page' : ''}${
          scrolled ? ' header--scrolled' : ''
        }`}
      >
        <div className="header__inner">
          <SiteLink className="header__logo" href="#top" ariaLabel="Bison’s Space — home">
            <Logo />
          </SiteLink>

          <nav className="header__nav" aria-label="Primary">
            {nav.map((item) => (
              <SiteLink key={item.label} className="header__link" href={item.href}>
                {item.label}
              </SiteLink>
            ))}
            <a
              className="btn btn--solid header__cta"
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Shoot
            </a>
          </nav>

          <button
            type="button"
            className={`burger${menuOpen ? ' burger--open' : ''}`}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={`menu${menuOpen ? ' menu--open' : ''}`} aria-hidden={!menuOpen}>
        <div className="menu__head">
          <Logo className="menu__logo" />
          <button
            type="button"
            className="burger burger--ink burger--open"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <span />
            <span />
          </button>
        </div>
        <nav className="menu__nav" aria-label="Mobile">
          {nav.map((item) => (
            <SiteLink
              key={item.label}
              className="menu__link"
              href={item.href}
              onNavigate={() => setMenuOpen(false)}
            >
              {item.label}
            </SiteLink>
          ))}
        </nav>
        <a
          className="btn btn--ink menu__cta"
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          Book a Shoot
        </a>
        <div className="menu__social">
          <a href={links.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href={links.behance} target="_blank" rel="noopener noreferrer">Behance</a>
          <a href={links.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>
      </div>
    </>
  );
}
