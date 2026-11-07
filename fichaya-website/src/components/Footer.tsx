import { asset, footerColumns, socials } from '../data/content';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <img className="footer__bg" src={asset('footer-bg.webp')} width={1440} height={690} alt="" loading="lazy" decoding="async" />

      <div className="footer__cta" id="book">
        <h2 className="footer__title">Your Building Should Run Smoothly. We Make Sure It Does.</h2>
        <p className="footer__subtitle">Book a service in minutes, or speak to the team first. No pressure either way.</p>
        <div className="footer__ctas">
          <a href="#book" className="btn btn--dark btn--round">
            Get started
          </a>
          <a href="#about" className="btn btn--light btn--round">
            Learn more
          </a>
        </div>
      </div>

      <div className="footer__card">
        <div className="footer__top">
          <div className="footer__brand">
            <img src={asset('footer-logo.svg')} width={100} height={28} alt="Fichaya" />
            <ul className="footer__socials">
              {socials.map((s) => (
                <li key={s.name}>
                  <a href={s.href} aria-label={s.name}>
                    <img src={s.src} width={16} height={16} alt="" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer__columns">
            {footerColumns.map((col) => (
              <div key={col.title} className="footer__col">
                <h3 className="footer__col-title">{col.title}</h3>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>{l.href ? <a href={l.href}>{l.label}</a> : <address>{l.label}</address>}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__meta">
            <span>© 2023 Fichaya</span>
            <img src={asset('dot.svg')} width={2} height={2} alt="" />
            <span>All Rights Reserved</span>
          </p>
          <p className="footer__meta">
            <a href="#terms">Terms</a>
            <img src={asset('dot.svg')} width={2} height={2} alt="" />
            <a href="#privacy">Privacy</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
