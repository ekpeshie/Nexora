import { useMemo, useState } from 'react';
import { ACCOUNT, ASSET_CLASSES, CLASS_META, INSTRUMENTS, PREV_CLOSE_VALUE, getInstrument, seedActivity, type AssetClass } from '../data/mock';
import { AllocationBar, PriceChart, TimeframeControl } from '../components/charts';
import { TopBar, goToAsset } from '../components/layout';
import { OrderCards, Watchlist, orderValue } from '../components/trading';
import { Button, Card, DemoTag, EmptyState, Icon, PriceChange, SearchInput, Segmented, SideTag } from '../components/ui';
import { fmtPct, fmtPrice, fmtQtyUnit, fmtRelative, fmtSignedUSD, fmtUSD } from '../lib/format';
import { currentAllocationValues, isWorking, toRows } from '../lib/portfolio';
import { navigate } from '../lib/router';
import { PORTFOLIO_TIMEFRAMES, portfolioSeries, timeframeLabel, type Timeframe } from '../lib/series';
import { useStore } from '../lib/store';

type Filter = 'all' | AssetClass;

export function Overview({ now }: { now: number }) {
  const { orders } = useStore();
  const [tf, setTf] = useState<Timeframe>('1D');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const series = useMemo(() => portfolioSeries(tf, now), [tf, now]);
  const periodStart = series[0].o;
  const periodChg = ACCOUNT.totalValue - periodStart;
  const periodPct = (periodChg / periodStart) * 100;
  const dayPct = (ACCOUNT.dayPnl / PREV_CLOSE_VALUE) * 100;

  const rows = useMemo(() => toRows(currentAllocationValues()), []);

  const watch = INSTRUMENTS.filter((i) => {
    if (filter !== 'all' && i.assetClass !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
  });

  const working = orders.filter(isWorking);
  const activity = useMemo(() => {
    const fromOrders = orders
      .filter((o) => o.status !== 'open')
      .map((o) => ({ id: o.id, at: o.updatedAt, order: o }))
      .slice(0, 5);
    const other = seedActivity(now).map((a) => ({ id: a.id, at: a.at, act: a }));
    return [...fromOrders, ...other].sort((a, b) => b.at - a.at).slice(0, 5);
  }, [orders, now]);

  return (
    <>
      <TopBar title="Overview" />
      <div className="page page--overview">
        <div className="col-main">
          <Card className="summary" title="Portfolio value" titleId="pv-title" actions={<DemoTag>Demo account · USD</DemoTag>}>
            <div className="summary__top">
              <div>
                <p className="summary__value num" aria-describedby="pv-title">
                  {fmtUSD(ACCOUNT.totalValue)}
                </p>
                <p className="summary__pnl">
                  <span className="muted">Today</span>
                  <PriceChange pct={dayPct} abs={fmtSignedUSD(ACCOUNT.dayPnl)} pill />
                </p>
              </div>
              <div className="summary__tf">
                <TimeframeControl value={tf} onChange={setTf} options={PORTFOLIO_TIMEFRAMES} />
                <p className="small muted num">
                  {fmtSignedUSD(periodChg)} ({fmtPct(periodPct)}) {timeframeLabel(tf)}
                </p>
              </div>
            </div>
            <PriceChart
              data={series}
              mode="line"
              height={240}
              decimals={0}
              tf={tf}
              formatValue={(n) => fmtUSD(n)}
              baseline={tf === '1D' ? PREV_CLOSE_VALUE : undefined}
              ariaLabel={`Portfolio value ${timeframeLabel(tf)}: from ${fmtUSD(periodStart)} to ${fmtUSD(ACCOUNT.totalValue)}, ${fmtPct(periodPct)}. Illustrative.`}
            />
          </Card>

          <Card
            title="Watchlist"
            titleId="wl-title"
            className="watchlist"
            pad={false}
            actions={
              <div className="wl-tools">
                <SearchInput value={query} onChange={setQuery} placeholder="Search symbol or name" />
              </div>
            }
          >
            <div className="wl-filters">
              <Segmented<Filter>
                size="sm"
                label="Filter by asset class"
                value={filter}
                onChange={setFilter}
                options={[{ value: 'all', label: 'All' }, ...ASSET_CLASSES.map((c) => ({ value: c, label: CLASS_META[c].label }))]}
              />
              <span className="small muted">Indicative prices · not live</span>
            </div>
            {watch.length ? (
              <Watchlist items={watch} onSelect={(i) => goToAsset(i.symbol)} now={now} />
            ) : (
              <EmptyState
                icon="search"
                title="No instruments match"
                body={`Nothing in your watchlist matches “${query}”${filter !== 'all' ? ` in ${CLASS_META[filter].label}` : ''}.`}
                action={
                  <Button
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            )}
          </Card>
        </div>

        <div className="col-side">
          <Card title="Allocation" titleId="alloc-title">
            <AllocationBar rows={rows} />
            <ul className="alloc-list">
              {rows.map((r) => (
                <li key={r.key}>
                  <span className="alloc-list__label">
                    <i style={{ background: r.color }} aria-hidden="true" />
                    {r.label}
                  </span>
                  <span className="num muted">{fmtUSD(r.value)}</span>
                  <span className="num strong">{fmtPct(r.pct, 1, false)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title={
              <>
                Open orders <span className="card__count">{working.length}</span>
              </>
            }
            titleId="oo-title"
            actions={
              <a className="textlink" href="#/orders?tab=open">
                View all
              </a>
            }
          >
            {working.length ? (
              <OrderCards orders={working.slice(0, 3)} onOpen={(o) => navigate(`/orders?tab=open&order=${o.id}`)} />
            ) : (
              <EmptyState title="No open orders" body="Orders you place will appear here while they're working." />
            )}
          </Card>

          <Card title="Recent activity" titleId="ra-title">
            <ul className="activity">
              {activity.map((a) => {
                if ('order' in a && a.order) {
                  const o = a.order;
                  const inst = getInstrument(o.symbol)!;
                  const verb = o.status === 'filled' ? 'Filled' : o.status === 'cancelled' ? 'Cancelled' : o.status === 'rejected' ? 'Rejected' : 'Partially filled';
                  return (
                    <li key={a.id}>
                      <a href={`#/orders?tab=${o.status === 'filled' ? 'filled' : o.status === 'partial' ? 'open' : 'cancelled'}&order=${o.id}`} className="activity__item">
                        <span className={`activity__icon activity__icon--${o.status}`}>
                          <Icon name={o.status === 'filled' ? 'check' : o.status === 'partial' ? 'half' : o.status === 'rejected' ? 'alert' : 'xCircle'} size={16} />
                        </span>
                        <span className="activity__main">
                          <span>
                            {verb} · <SideTag side={o.side} /> {o.symbol}
                          </span>
                          <span className="small muted num">
                            {fmtQtyUnit(inst, o.status === 'partial' ? o.filledQty : o.qty)}
                            {o.avgFillPrice ? ` at ${fmtPrice(inst, o.avgFillPrice)}` : ''} · {fmtRelative(a.at, now)}
                          </span>
                        </span>
                        <span className="num small">{o.status === 'filled' ? fmtUSD(orderValue(o)) : ''}</span>
                      </a>
                    </li>
                  );
                }
                const act = 'act' in a ? a.act : null;
                if (!act) return null;
                return (
                  <li key={a.id}>
                    <div className="activity__item">
                      <span className="activity__icon">
                        <Icon name={act.kind === 'deposit' ? 'deposit' : 'coin'} size={16} />
                      </span>
                      <span className="activity__main">
                        <span>{act.label}</span>
                        <span className="small muted num">{fmtRelative(act.at, now)}</span>
                      </span>
                      <span className="num small tx-pos">+{fmtUSD(act.amount)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
