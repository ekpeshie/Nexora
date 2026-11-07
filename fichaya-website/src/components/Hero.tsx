import { asset } from '../data/content';

export default function Hero() {
  return (
    <section className="hero" id="top">
      <img className="hero__image" src={asset('hero.jpg')} alt="" fetchPriority="high" />
      <div className="hero__shade" aria-hidden="true" />
      <div className="hero__content">
        <div className="hero__text">
          <h1 className="hero__title">Your Building Should Run Smoothly. We Make Sure It Does.</h1>
          <div className="hero__ctas">
            <a href="#book" className="btn btn--yellow">
              Book a Property Operations Review
            </a>
            <a href="#contact" className="btn btn--light btn--icon">
              Speak to Our Team
              <img src={asset('arrow-right-up.svg')} width={24} height={24} alt="" />
            </a>
          </div>
        </div>
        <p className="hero__description">
          Fichaya is your partner for corporate and multi-tenant property operations—managing cleaning, maintenance,
          power, staffing, and vendor coordination with accountability.
        </p>
      </div>
    </section>
  );
}
