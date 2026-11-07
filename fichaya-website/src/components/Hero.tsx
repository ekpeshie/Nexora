import { asset, photo } from '../data/content';

const hero = photo('hero');

export default function Hero() {
  return (
    <section className="hero" id="top">
      <img
        className="hero__image"
        src={hero.src}
        srcSet={hero.srcSet}
        sizes="(max-width: 900px) calc(100vw - 32px), calc(100vw - 64px)"
        width={1376}
        height={800}
        alt="Modern office lounge with plants, desks and chairs, managed by Fichaya"
        fetchPriority="high"
        decoding="async"
      />
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
