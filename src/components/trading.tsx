import { useMemo } from 'react';
import { CLASS_META, THRESHOLD_OPTIONS, getInstrument, toSlug, type Instrument, type Order } from '../data/mock';
import { fmtDateTime, fmtNum, fmtPct, fmtPrice, fmtQty, fmtQtyUnit, fmtRelative, fmtTimeSec, fmtUSD } from '../lib/format';
import type { Impact } from '../lib/portfolio';
import { sparkline } from '../lib/series';
import { Sparkline } from './charts';
import { Icon, KeyValues, Notice, PriceChange, Select, SideTag, StatusBadge, Tag } from './ui';

/* ------------------------------------------------------------------ */
/* Asset rows / cards                                                  */
/* ------------------------------------------------------------------ */

export function AssetClassTag({ inst }: { inst: Instrument }) {
  return (
    <span className="classtag">
      <i style={{ background: CLASS_META[inst.assetClass].color }} aria-hidden="true" />
      {CLASS_META[inst.assetClass].label}
    </span>
  );
}

export function AssetGlyph({ inst, size = 32 }: { inst: Instrument; size?: number }) {
  const txt = inst.symbol.split('/')[0].slice(0, 4);
  return (
    <span
      className="glyph"
      style={{ width: size, height: size, borderColor: CLASS_META[inst.assetClass].color, fontSize: Math.round(size * (txt.length > 3 ? 0.25 : 0.3)) }}
      aria-hidden="true"
    >
      {txt}
    </span>
  );
}

/** Watchlist: a table at ≥768px, stacked tappable cards below. */
export function Watchlist({ items, onSelect, now }: { items: Instrument[]; onSelect: (i: Instrument) => void; now: number }) {
  return (
    <>
      <table className="table table--interactive wl-table">
        <caption className="sr-only">Watchlist (illustrative prices)</caption>
        <thead>
          <tr>
            <th scope="col">Instrument</th>
            <th scope="col">Asset class</th>
            <th scope="col" className="ta-r">
              Price
            </th>
            <th scope="col" className="ta-r">
              24h / day
            </th>
            <th scope="col" className="ta-r hide-tablet">
              Trend (1D)
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.symbol} onClick={() => onSelect(i)}>
              <td>
                <a
                  href={`#/asset/${toSlug(i.symbol)}`}
                  className="asset-cell"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`${i.symbol}, ${i.name}. View details`}
                >
                  <AssetGlyph inst={i} />
                  <span>
                    <span className="asset-cell__sym">{i.symbol}</span>
                    <span className="asset-cell__name">{i.name}</span>
                  </span>
                </a>
              </td>
              <td>
                <AssetClassTag inst={i} />
              </td>
              <td className="ta-r num strong">{fmtPrice(i, i.price)}</td>
              <td className="ta-r">
                <PriceChange pct={i.changePct} />
              </td>
              <td className="ta-r hide-tablet">
                <Sparkline values={sparkline(i, now)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="wl-cards">
        {items.map((i) => (
          <li key={i.symbol}>
            <a href={`#/asset/${toSlug(i.symbol)}`} className="asset-card">
              <AssetGlyph inst={i} size={36} />
              <span className="asset-card__main">
                <span className="asset-cell__sym">{i.symbol}</span>
                <span className="asset-cell__name">
                  {i.name} · {CLASS_META[i.assetClass].short}
                </span>
              </span>
              <span className="asset-card__px">
                <span className="num strong">{fmtPrice(i, i.price)}</span>
                <PriceChange pct={i.changePct} size="sm" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Portfolio impact preview                                            */
/* ------------------------------------------------------------------ */

export function ImpactPreview({
  impact,
  threshold,
  onThreshold,
  compact,
}: {
  impact: Impact;
  threshold: number;
  onThreshold?: (v: number) => void;
  compact?: boolean;
}) {
  const hasOrder = impact.orderValue > 0;
  const scaleMax = Math.max(60, threshold + 10, ...impact.rows.map((r) => Math.max(r.pct, r.projectedPct) + 5));
  const pctW = (p: number) => `${(Math.max(0, p) / scaleMax) * 100}%`;
  return (
    <div className={`impact ${compact ? 'impact--compact' : ''}`}>
      <div className="impact__head">
        <div>
          <p className="impact__eyebrow">Portfolio impact preview</p>
          <p className="impact__sub">Current vs projected allocation by asset class</p>
        </div>
        {onThreshold ? (
          <label className="impact__threshold">
            <span>Threshold</span>
            <Select
              compact
              ariaLabel="Concentration threshold per asset class"
              value={String(threshold)}
              onChange={(v) => onThreshold(Number(v))}
              options={THRESHOLD_OPTIONS.map((t) => ({ value: String(t), label: `${t}%` }))}
            />
          </label>
        ) : (
          <Tag tone="warn">Threshold {threshold}%</Tag>
        )}
      </div>

      <div className="impact__legend" aria-hidden="true">
        <span>
          <i className="lg lg--cur" /> Current
        </span>
        <span>
          <i className="lg lg--proj" /> Projected
        </span>
        <span>
          <i className="lg lg--thr" /> {threshold}% threshold
        </span>
      </div>

      <table className="impact__table">
        <caption className="sr-only">
          Allocation by asset class, current and projected after this trade. Concentration threshold {threshold}%.
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Asset class</th>
            <th scope="col">Current</th>
            <th scope="col">Projected</th>
            <th scope="col">Change</th>
          </tr>
        </thead>
        <tbody>
          {impact.rows.map((r) => {
            const isTarget = r.key === impact.target.key;
            const flagged = r.key !== 'cash' && hasOrder && (r.crossesAbove || (r.aboveAfter && isTarget));
            const changed = Math.abs(r.deltaPct) >= 0.05 && hasOrder;
            return (
              <tr key={r.key} className={`impact__row ${isTarget && hasOrder ? 'is-target' : ''} ${flagged ? 'is-flagged' : ''}`}>
                <th scope="row" className="impact__label">
                  <i style={{ background: r.color }} aria-hidden="true" />
                  {r.label}
                  {flagged && (
                    <span className="impact__flag">
                      <Icon name="alert" size={12} />
                      {r.crossesAbove ? 'Crosses' : 'Above'} {threshold}%
                    </span>
                  )}
                </th>
                <td className="impact__bars" aria-hidden="true">
                  <span className="impact__track">
                    <span className="impact__bar impact__bar--cur" style={{ width: pctW(r.pct), background: r.color }} />
                    {r.key !== 'cash' && <span className="impact__thr" style={{ left: pctW(threshold) }} />}
                  </span>
                  <span className="impact__track">
                    <span
                      className={`impact__bar impact__bar--proj ${flagged ? 'is-flagged' : ''}`}
                      style={{ width: pctW(hasOrder ? r.projectedPct : r.pct), borderColor: r.color }}
                    />
                    {r.key !== 'cash' && <span className="impact__thr" style={{ left: pctW(threshold) }} />}
                  </span>
                </td>
                <td className="impact__nums num">
                  <span className="impact__cur">{fmtPct(r.pct, 1, false)}</span>
                  <Icon name="chevron" size={12} className="impact__arrow" />
                  <span className={`impact__proj ${flagged ? 'tx-warn' : ''}`}>{fmtPct(hasOrder ? r.projectedPct : r.pct, 1, false)}</span>
                </td>
                <td className={`impact__delta num ${changed ? (r.deltaPct > 0 ? 'is-up' : 'is-down') : ''}`}>
                  {changed ? `${r.deltaPct > 0 ? '+' : '−'}${Math.abs(r.deltaPct).toFixed(1)} pts` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="impact__explain">
        {hasOrder && impact.thresholdNote && (
          <Notice tone={impact.level === 'warning' ? 'warning' : 'info'} title={impact.level === 'warning' ? 'Concentration threshold' : 'Within threshold'}>
            {impact.thresholdNote}
          </Notice>
        )}
        <p className="impact__summary">{impact.summary}</p>
        <p className="impact__fine">
          Calculated from the demo account ({fmtUSD(impact.totalBefore)}), assuming a full fill at the estimated price and all other holdings unchanged. Working
          orders are not included. The threshold is a display setting you choose — informational only, not investment advice.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export const orderValue = (o: Order) => o.qty * o.estPrice;

export function OrdersTable({ orders, onOpen, selectedId }: { orders: Order[]; onOpen: (o: Order) => void; selectedId?: string | null }) {
  return (
    <table className="table table--interactive orders-table">
      <caption className="sr-only">Orders</caption>
      <thead>
        <tr>
          <th scope="col">Symbol</th>
          <th scope="col">Side</th>
          <th scope="col">Type</th>
          <th scope="col" className="ta-r">
            Qty (filled)
          </th>
          <th scope="col" className="ta-r">
            Limit price
          </th>
          <th scope="col" className="ta-r">
            Est. value
          </th>
          <th scope="col">Time</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => {
          const inst = getInstrument(o.symbol)!;
          return (
            <tr key={o.id} onClick={() => onOpen(o)} className={`${o.isNew ? 'is-new' : ''} ${selectedId === o.id ? 'is-selected' : ''}`}>
              <td>
                <button type="button" className="linkish" onClick={(e) => (e.stopPropagation(), onOpen(o))} aria-label={`Order ${o.id}, ${o.symbol}. View details`}>
                  <span className="strong">{o.symbol}</span>
                  <span className="muted small">{o.id}</span>
                </button>
              </td>
              <td>
                <SideTag side={o.side} />
              </td>
              <td className="cap">{o.type}</td>
              <td className="ta-r num">
                {fmtQty(inst, o.qty)} <span className="muted">({fmtQty(inst, o.filledQty)})</span>
              </td>
              <td className="ta-r num">{o.limitPrice !== undefined ? fmtPrice(inst, o.limitPrice) : <span className="muted">Market</span>}</td>
              <td className="ta-r num">{fmtUSD(orderValue(o))}</td>
              <td className="num nowrap">{fmtRelative(o.createdAt)}</td>
              <td>
                <StatusBadge status={o.status} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function OrderCards({ orders, onOpen }: { orders: Order[]; onOpen: (o: Order) => void }) {
  return (
    <ul className="order-cards">
      {orders.map((o) => {
        const inst = getInstrument(o.symbol)!;
        return (
          <li key={o.id}>
            <button type="button" className={`order-card ${o.isNew ? 'is-new' : ''}`} onClick={() => onOpen(o)}>
              <span className="order-card__row">
                <span className="order-card__sym">
                  <SideTag side={o.side} />
                  <span className="strong">{o.symbol}</span>
                </span>
                <StatusBadge status={o.status} />
              </span>
              <span className="order-card__row muted small">
                <span>
                  <span className="cap">{o.type}</span> · {fmtQtyUnit(inst, o.qty)}
                  {o.limitPrice !== undefined && ` @ ${fmtPrice(inst, o.limitPrice)}`}
                </span>
                <span className="num">{fmtUSD(orderValue(o))}</span>
              </span>
              <span className="order-card__row muted small">
                <span className="num">{fmtRelative(o.createdAt)}</span>
                <span className="num">
                  Filled {fmtQty(inst, o.filledQty)}/{fmtQty(inst, o.qty)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function FillProgress({ order }: { order: Order }) {
  const inst = getInstrument(order.symbol)!;
  const pct = order.qty ? (order.filledQty / order.qty) * 100 : 0;
  return (
    <div className="fill">
      <div className="fill__top">
        <span className="muted small">Filled</span>
        <span className="num small">
          {fmtQtyUnit(inst, order.filledQty)} of {fmtQty(inst, order.qty)} · {fmtNum(pct, 0)}%
        </span>
      </div>
      <div
        className="fill__track"
        role="progressbar"
        aria-label="Fill progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Status timeline: completed events plus the expected next step for working orders. */
export function OrderTimeline({ order }: { order: Order }) {
  const steps = useMemo(() => {
    const done = order.events.map((e) => ({ ...e, state: e.kind === 'failed' ? ('failed' as const) : ('done' as const) }));
    const working = order.status === 'open' || order.status === 'partial';
    if (working) {
      done.push({
        label: order.status === 'partial' ? 'Working — remainder open' : 'Working — awaiting fill',
        at: 0,
        detail: order.type === 'limit' ? 'Fills only at the limit price or better (simulated)' : undefined,
        state: 'current' as never,
      });
      done.push({ label: 'Filled', at: 0, detail: undefined, state: 'pending' as never });
    }
    return done as { label: string; at: number; detail?: string; state: 'done' | 'failed' | 'current' | 'pending' }[];
  }, [order]);

  return (
    <ol className="timeline">
      {steps.map((s, i) => (
        <li key={i} className={`timeline__step is-${s.state}`}>
          <span className="timeline__dot" aria-hidden="true">
            {s.state === 'done' && <Icon name="check" size={11} />}
            {s.state === 'failed' && <Icon name="close" size={11} />}
          </span>
          <div className="timeline__text">
            <p className="timeline__label">
              {s.label}
              <span className="sr-only">
                {' '}
                ({s.state === 'pending' ? 'not yet' : s.state === 'current' ? 'in progress' : s.state === 'failed' ? 'ended' : 'complete'})
              </span>
            </p>
            {s.at > 0 && <p className="timeline__time num">{`${fmtDateTime(s.at).split(',')[0]}, ${fmtTimeSec(s.at)}`}</p>}
            {s.detail && <p className="timeline__detail">{s.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function OrderSummary({ order }: { order: Order }) {
  const inst = getInstrument(order.symbol)!;
  return (
    <KeyValues
      columns={2}
      items={[
        { k: 'Instrument', v: `${inst.symbol} · ${inst.name}` },
        { k: 'Side', v: <SideTag side={order.side} /> },
        { k: 'Order type', v: <span className="cap">{order.type}</span> },
        { k: 'Quantity', v: fmtQtyUnit(inst, order.qty) },
        { k: 'Limit price', v: order.limitPrice !== undefined ? fmtPrice(inst, order.limitPrice) : 'Market' },
        { k: 'Avg fill price', v: order.avgFillPrice !== undefined ? fmtPrice(inst, order.avgFillPrice) : '—' },
        { k: 'Estimated value', v: fmtUSD(orderValue(order)) },
        { k: 'Fees (placeholder)', v: fmtUSD(order.fee) },
        { k: 'Submitted', v: fmtDateTime(order.createdAt) },
        { k: 'Order ID', v: order.id },
      ]}
    />
  );
}
