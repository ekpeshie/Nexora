import { asset, metrics, partners } from '../data/content';

export default function Metrics() {
  return (
    <section className="metrics" aria-label="Partners and results">
      <div className="metrics__partners">
        <p className="eyebrow">Our strategic partners</p>
        <ul className="metrics__logos">
          {partners.map((p, i) => (
            <li key={p.name} className={`logo-tile${i === 0 ? ' logo-tile--start' : ''}`}>
              <img src={p.src} width={p.width} height={p.height} alt={p.name} />
            </li>
          ))}
        </ul>
      </div>

      <dl className="metrics__list">
        {metrics.map((m) => (
          <div key={m.value} className="metric">
            <img className="metric__rule" src={asset('metric-line.svg')} width={780} height={1} alt="" />
            <dt className="metric__value">{m.value}</dt>
            <dd className="metric__label">{m.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
