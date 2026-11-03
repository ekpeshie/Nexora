import { useEffect, useMemo, useState } from 'react';
import { ACCOUNT, getInstrument, toSlug, type Instrument } from '../data/mock';
import { PriceChart, TimeframeControl } from '../components/charts';
import { TopBar } from '../components/layout';
import { AssetClassTag, AssetGlyph } from '../components/trading';
import { Button, Card, DemoTag, EmptyState, KeyValues, PriceChange, Segmented, Skeleton } from '../components/ui';
import { fmtNum, fmtPct, fmtPrice, fmtQtyUnit, fmtSignedUSD, fmtUSD } from '../lib/format';
import { availableToSell, getHolding } from '../lib/portfolio';
import { navigate } from '../lib/router';
import { ASSET_TIMEFRAMES, assetSeries, marketDepth, timeframeLabel, type Timeframe } from '../lib/series';
import { useStore } from '../lib/store';

export function AssetDetails({ symbol, now }: { symbol: string | undefined; now: number }) {
  const inst = symbol ? getInstrument(symbol) : undefined;
  const { setLastSymbol } = useStore();
  useEffect(() => {
    if (inst) setLastSymbol(inst.symbol);
  }, [inst, setLastSymbol]);

  if (!inst) {
    return (
      <>
        <TopBar title="Instrument not found" back={{ label: 'Overview', href: '#/overview' }} />
        <div className="page">
          <Card>
            <EmptyState icon="search" title="We couldn't find that instrument" body="It may not be in the demo watchlist." action={<Button onClick={() => navigate('/overview')}>Back to overview</Button>} />
          </Card>
        </div>
      </>
    );
  }
  return <AssetView key={inst.symbol} inst={inst} now={now} />;
}

function AssetView({ inst, now }: { inst: Instrument; now: number }) {
  const { orders } = useStore();
  const [tf, setTf] = useState<Timeframe>('1D');
  const [mode, setMode] = useState<'candle' | 'line'>('candle');
  const [loading, setLoading] = useState(true);

  // Brief simulated load when the chart data changes, so the loading state is visible.
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 280);
    return () => window.clearTimeout(t);
  }, [tf]);

  const series = useMemo(() => assetSeries(inst, tf, now), [inst, tf, now]);
  const day = useMemo(() => assetSeries(inst, '1D', now), [inst, now]);
  const year = useMemo(() => assetSeries(inst, '1Y', now), [inst, now]);
  const depth = useMemo(() => marketDepth(inst), [inst]);

  const prevClose = inst.price / (1 + inst.changePct / 100);
  const dayAbs = inst.price - prevClose;
  const periodStart = series[0].o;
  const periodPct = ((inst.price - periodStart) / periodStart) * 100;
  const holding = getHolding(inst.symbol);
  const avail = availableToSell(inst.symbol, orders);
  const slug = toSlug(inst.symbol);
  const isFx = inst.assetClass === 'forex';

  const stats = [
    { k: 'Open', v: fmtPrice(inst, day[0].o) },
    { k: 'Previous close', v: fmtPrice(inst, prevClose) },
    { k: 'Day high', v: fmtPrice(inst, Math.max(...day.map((c) => c.h))) },
    { k: 'Day low', v: fmtPrice(inst, Math.min(...day.map((c) => c.l))) },
    { k: '52-week high', v: fmtPrice(inst, Math.max(...year.map((c) => c.h))) },
    { k: '52-week low', v: fmtPrice(inst, Math.min(...year.map((c) => c.l))) },
    ...inst.stats.map((s) => ({ k: s.label, v: s.value })),
  ];

  const maxCum = Math.max(depth.bids[depth.bids.length - 1].cum, depth.asks[depth.asks.length - 1].cum);
  const sizeDp = inst.assetClass === 'crypto' ? 3 : inst.assetClass === 'commodities' && inst.price > 1000 ? 2 : 0;

  const priceLine = (
    <div className="asset-hero__px">
      <span className="asset-hero__price num">{fmtPrice(inst, inst.price)}</span>
      <PriceChange pct={inst.changePct} abs={isFx ? `${dayAbs > 0 ? '+' : '−'}${fmtNum(Math.abs(dayAbs), 4)}` : fmtSignedUSD(dayAbs)} pill />
    </div>
  );

  return (
    <>
      <TopBar title={inst.symbol} back={{ label: 'Overview', href: '#/overview' }} />
      <div className="page page--asset">
        <section className="asset-hero card card--pad" aria-labelledby="asset-name">
          <div className="asset-hero__id">
            <AssetGlyph inst={inst} size={44} />
            <div>
              <h2 className="asset-hero__name" id="asset-name">
                {inst.name}
              </h2>
              <p className="asset-hero__meta">
                <span className="strong">{inst.symbol}</span>
                <AssetClassTag inst={inst} />
                <span className="muted">{inst.market}</span>
              </p>
            </div>
          </div>
          {priceLine}
          <p className="asset-hero__note small muted">
            <DemoTag>Indicative price</DemoTag> {isFx ? 'Quoted in USD per 1 ' + inst.unit + '. ' : ''}Not live; for demonstration only.
          </p>
          <div className="asset-hero__actions">
            <Button variant="buy" size="lg" onClick={() => navigate(`/trade/${slug}?side=buy`)}>
              Buy {inst.symbol.split('/')[0]}
            </Button>
            <Button variant="sell" size="lg" onClick={() => navigate(`/trade/${slug}?side=sell`)} disabled={avail <= 0} title={avail <= 0 ? 'No units available to sell' : undefined}>
              Sell
            </Button>
          </div>
        </section>

        <div className="asset-grid">
          <Card
            className="asset-chart"
            title={
              <>
                Price chart <span className="muted small num">{fmtPct(periodPct)} {timeframeLabel(tf)}</span>
              </>
            }
            titleId="chart-title"
            actions={
              <div className="chart-tools">
                <Segmented
                  size="sm"
                  label="Chart type"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: 'candle', label: 'Candles' },
                    { value: 'line', label: 'Line' },
                  ]}
                />
                <TimeframeControl value={tf} onChange={setTf} options={ASSET_TIMEFRAMES} />
              </div>
            }
          >
            {loading ? (
              <div className="chart-loading" style={{ height: 300 }} aria-busy="true" aria-label="Loading chart">
                <Skeleton h={300} r={8} />
              </div>
            ) : (
              <PriceChart
                data={series}
                mode={mode}
                height={300}
                decimals={inst.priceDecimals}
                tf={tf}
                formatValue={(n) => fmtPrice(inst, n)}
                ariaLabel={`${inst.symbol} ${mode} chart, ${timeframeLabel(tf)}: ${fmtPct(periodPct)}. Illustrative data.`}
              />
            )}
          </Card>

          <Card title="Key statistics" titleId="stats-title" className="asset-stats">
            <KeyValues columns={2} items={stats} />
          </Card>

          <Card title="Your position" titleId="pos-title" className="asset-pos">
            {holding ? (
              <KeyValues
                items={[
                  { k: 'Quantity', v: fmtQtyUnit(inst, holding.qty) },
                  { k: 'Available to sell', v: fmtQtyUnit(inst, avail) },
                  { k: 'Market value', v: fmtUSD(holding.value), strong: true },
                  { k: 'Avg. cost', v: fmtPrice(inst, holding.avgCost) },
                  {
                    k: 'Unrealised P&L',
                    v: (() => {
                      const pnl = holding.qty * (inst.price - holding.avgCost);
                      const pct = ((inst.price - holding.avgCost) / holding.avgCost) * 100;
                      return <PriceChange pct={pct} abs={fmtSignedUSD(pnl)} size="sm" />;
                    })(),
                  },
                  { k: 'Share of portfolio', v: fmtPct((holding.value / ACCOUNT.totalValue) * 100, 1, false) },
                ]}
              />
            ) : (
              <EmptyState title="No position" body={`You don't hold ${inst.symbol} in the demo account.`} />
            )}
          </Card>

          <Card title="Market depth" titleId="depth-title" className="asset-depth" actions={<DemoTag>Simulated</DemoTag>}>
            <div className="depth" role="table" aria-label={`Simulated order book for ${inst.symbol}`}>
              <div className="depth__head" role="row">
                <span role="columnheader">Bid size</span>
                <span role="columnheader" className="ta-r">
                  Bid
                </span>
                <span role="columnheader">Ask</span>
                <span role="columnheader" className="ta-r">
                  Ask size
                </span>
              </div>
              {depth.bids.map((b, i) => {
                const a = depth.asks[i];
                return (
                  <div className="depth__row" role="row" key={i}>
                    <span role="cell" className="depth__cell depth__cell--bid num">
                      <i style={{ width: `${(b.cum / maxCum) * 100}%` }} aria-hidden="true" />
                      {fmtNum(b.size, sizeDp)}
                    </span>
                    <span role="cell" className="ta-r num tx-pos">
                      {fmtNum(b.price, inst.priceDecimals)}
                    </span>
                    <span role="cell" className="num tx-neg">
                      {fmtNum(a.price, inst.priceDecimals)}
                    </span>
                    <span role="cell" className="depth__cell depth__cell--ask ta-r num">
                      <i style={{ width: `${(a.cum / maxCum) * 100}%` }} aria-hidden="true" />
                      {fmtNum(a.size, sizeDp)}
                    </span>
                  </div>
                );
              })}
              <p className="depth__spread small muted num">
                Spread {fmtNum(depth.spread, inst.priceDecimals)} · sizes in {isFx ? inst.unit : inst.unit}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile sticky trade bar (sits above bottom nav) */}
      <div className="trade-bar" role="region" aria-label="Trade actions">
        <div className="trade-bar__px">
          <span className="num strong">{fmtPrice(inst, inst.price)}</span>
          <PriceChange pct={inst.changePct} size="sm" />
        </div>
        <Button variant="sell" onClick={() => navigate(`/trade/${slug}?side=sell`)} disabled={avail <= 0}>
          Sell
        </Button>
        <Button variant="buy" onClick={() => navigate(`/trade/${slug}?side=buy`)}>
          Buy
        </Button>
      </div>
    </>
  );
}
