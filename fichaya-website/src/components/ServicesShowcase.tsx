import { useState } from 'react';
import { photo, services } from '../data/content';

const backgrounds = [...new Set(services.map((s) => s.image))];

export default function ServicesShowcase() {
  const [active, setActive] = useState(0);
  const current = services[active];

  return (
    <section className="showcase" id="services">
      <header className="section-header">
        <h2 className="section-header__title">Made for you and your business to thrive</h2>
        <p className="section-header__subtitle showcase__subtitle">
          Whether you’re an homeowner, a small business or large corporation, we have excatly what you need.
        </p>
      </header>

      <div className="showcase__panel">
        {backgrounds.map((name) => (
          <img
            key={name}
            className={`showcase__image${name === current.image ? ' is-active' : ''}`}
            {...photo(name)}
            sizes="(max-width: 1440px) calc(100vw - 32px), 1376px"
            width={1376}
            height={839}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ))}

        <ul className="showcase__list">
          {services.map((s, i) =>
            i === active ? (
              <li key={s.title} className="service-card" aria-live="polite">
                <h3 className="service-card__title">{current.title}</h3>
                <p className="service-card__text">{current.text}</p>
              </li>
            ) : (
              <li key={s.title}>
                <button type="button" className="service-pill" onClick={() => setActive(i)}>
                  {s.title}
                  <span className="service-pill__icon" aria-hidden="true">
                    <span className="mask-icon mask-icon--plus" />
                  </span>
                </button>
              </li>
            ),
          )}
        </ul>

        <div className="progress-pill" aria-hidden="true">
          <span className="progress-pill__track">
            <span className="progress-pill__bar" style={{ width: `${((active + 1) / services.length) * 100}%` }} />
          </span>
        </div>
      </div>
    </section>
  );
}
