import { asset, metrics, partners } from '../data/content';

export default function Metrics() {
  return (
    <section className="metrics" aria-label="Partners and results">
      <div className="metrics__partners">
        <h2 className="eyebrow">Our strategic partners</h2>
        <ul className="metrics__logos">
          {partners.map((p, i) => (
            <li key={p.name} className={`logo-tile${i === 0 ? ' logo-tile--start' : ''}`}>
              <img src={p.src} width={p.width} height={p.height} alt={p.name} />
            </li>
          ))}
        </ul>
      </div>

      <ul className="metrics__list">
        {metrics.map((m) => (
          <li key={m.value} className="metric">
            <img className="metric__rule" src={asset('metric-line.svg')} width={780} height={1} alt="" />
            <p className="metric__value">{m.value}</p>
            <p className="metric__label">{m.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
