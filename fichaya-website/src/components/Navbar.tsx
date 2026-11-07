import { useEffect, useRef, useState } from 'react';
import { asset, navLinks, serviceMenu } from '../data/content';

export default function Navbar() {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !navRef.current?.contains(e.target as Node)) {
        setServicesOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, []);

  return (
    <header className="nav-wrap">
      <nav ref={navRef} className="nav" aria-label="Main">
        <div className="nav__bar">
          <a href="#top" className="nav__logo" aria-label="Fichaya home">
            <img src={asset('logo.svg')} width={100} height={28} alt="Fichaya" />
          </a>

          <ul className={`nav__links${mobileOpen ? ' is-open' : ''}`}>
            {navLinks.map((link) =>
              link.label === 'Services' ? (
                <li key={link.label} className="nav__services">
                  <button
                    type="button"
                    className="nav__link"
                    aria-expanded={servicesOpen}
                    aria-controls="services-menu"
                    onClick={() => setServicesOpen((o) => !o)}
                  >
                    {link.label}
                  </button>
                  <div id="services-menu" className="services-menu" hidden={!servicesOpen}>
                    {serviceMenu.map((s) => (
                      <a key={s.title} href="#services" className="services-menu__item" onClick={() => setServicesOpen(false)}>
                        <span className="services-menu__title">{s.title}</span>
                        <span className="services-menu__text">{s.text}</span>
                      </a>
                    ))}
                  </div>
                </li>
              ) : (
                <li key={link.label}>
                  <a className="nav__link" href={link.href} onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </a>
                </li>
              ),
            )}
          </ul>

          <a href="#book" className="pill-cta">
            <span className="pill-cta__label">Book a service</span>
            <span className="pill-cta__icon" aria-hidden="true">
              <span className="mask-icon mask-icon--arrow" />
            </span>
          </a>

          <button
            type="button"
            className="nav__toggle"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>
    </header>
  );
}
