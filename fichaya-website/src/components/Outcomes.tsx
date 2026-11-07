import { asset, outcomePhotos, outcomes } from '../data/content';

export default function Outcomes() {
  return (
    <section className="outcomes" id="about">
      <div className="outcomes__photos" aria-hidden="true">
        {outcomePhotos.map((p, i) => (
          <img
            key={i}
            className="outcomes__photo"
            src={asset('feature-photo.webp')}
            width={230}
            height={223}
            decoding="async"
            alt=""
            loading="lazy"
            style={{ left: p.left, top: p.top, transform: `rotate(${p.rotate}deg)` }}
          />
        ))}
      </div>

      <header className="section-header outcomes__header">
        <h2 className="section-header__title section-header__title--medium">Reliable Outomes</h2>
        <p className="section-header__subtitle outcomes__subtitle">
          No guesswork, no vendor juggling, just a property that runs the way it should, every day.
        </p>
      </header>

      <ul className="outcomes__grid">
        {outcomes.map((o) => (
          <li key={o.title} className="outcome-card">
            <h3 className="outcome-card__title">{o.title}</h3>
            <p className="outcome-card__text">{o.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
