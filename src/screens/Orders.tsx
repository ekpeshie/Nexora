import { useEffect, useState } from 'react';
import { getInstrument, type Order } from '../data/mock';
import { TopBar } from '../components/layout';
import { FillProgress, OrderCards, OrderSummary, OrderTimeline, OrdersTable, orderValue } from '../components/trading';
import { Button, Card, EmptyState, Modal, Notice, Skeleton, StatusBadge, Tabs } from '../components/ui';
import { fmtPrice, fmtQtyUnit, fmtUSD } from '../lib/format';
import { isWorking } from '../lib/portfolio';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';

type Tab = 'open' | 'filled' | 'cancelled' | 'all';
const TABS: Tab[] = ['open', 'filled', 'cancelled', 'all'];

const inTab = (o: Order, t: Tab) =>
  t === 'all' ? true : t === 'open' ? isWorking(o) : t === 'filled' ? o.status === 'filled' : o.status === 'cancelled' || o.status === 'rejected';

export function Orders({ params }: { params: URLSearchParams }) {
  const { orders, cancelOrder, toast } = useStore();
  const tabParam = params.get('tab') as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'open';
  const selectedId = params.get('order');
  const placedId = params.get('placed');
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(t);
  }, [tab]);

  const setParams = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) (v === null ? p.delete(k) : p.set(k, v));
    navigate(`/orders?${p.toString()}`);
  };

  const list = orders.filter((o) => inTab(o, tab)).sort((a, b) => b.createdAt - a.createdAt);
  const counts = Object.fromEntries(TABS.map((t) => [t, orders.filter((o) => inTab(o, t)).length])) as Record<Tab, number>;
  const selected = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;
  const placed = placedId ? orders.find((o) => o.id === placedId) : null;

  const open = (o: Order) => setParams({ order: o.id });
  const doCancel = () => {
    if (!confirmCancel) return;
    const o = confirmCancel;
    setCancelling(true);
    window.setTimeout(() => {
      cancelOrder(o.id);
      setCancelling(false);
      setConfirmCancel(null);
      const inst = getInstrument(o.symbol)!;
      toast({ tone: 'info', title: 'Order cancelled', body: `${o.side === 'buy' ? 'Buy' : 'Sell'} ${fmtQtyUnit(inst, o.qty)} ${o.symbol} (${o.id}) was cancelled.` });
    }, 500);
  };

  const emptyCopy: Record<Tab, { title: string; body: string }> = {
    open: { title: 'No open orders', body: 'Working orders appear here until they fill or you cancel them.' },
    filled: { title: 'No filled orders yet', body: 'Completed orders will be listed here.' },
    cancelled: { title: 'Nothing cancelled or rejected', body: 'Orders you cancel, or that are rejected, appear here.' },
    all: { title: 'No orders yet', body: 'Place a demo order from any instrument to get started.' },
  };

  return (
    <>
      <TopBar title="Orders & activity" />
      <div className="page page--orders">
        {placed && (
          <div className="placed-banner">
            <Notice tone="success" title={`Demo order ${placed.id} placed`}>
              {(() => {
                const inst = getInstrument(placed.symbol)!;
                return (
                  <>
                    {placed.side === 'buy' ? 'Buy' : 'Sell'} {fmtQtyUnit(inst, placed.qty)} {placed.symbol}{' '}
                    {placed.limitPrice !== undefined ? `at a ${fmtPrice(inst, placed.limitPrice)} limit` : 'at market'} · est. {fmtUSD(orderValue(placed))}. Status:{' '}
                    <StatusBadge status={placed.status} />{' '}
                    {placed.status === 'open' && '0 filled.'}{' '}
                    <button type="button" className="textlink" onClick={() => setParams({ order: placed.id })}>
                      View details
                    </button>
                  </>
                );
              })()}
            </Notice>
            <button type="button" className="icon-btn icon-btn--sm" aria-label="Dismiss" onClick={() => setParams({ placed: null })}>
              ×
            </button>
          </div>
        )}

        <Card pad={false} className="orders-card">
          <div className="orders-card__head">
            <Tabs<Tab>
              label="Filter orders by status"
              value={tab}
              onChange={(t) => setParams({ tab: t })}
              tabs={[
                { value: 'open', label: 'Open', count: counts.open },
                { value: 'filled', label: 'Filled', count: counts.filled },
                { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
                { value: 'all', label: 'All', count: counts.all },
              ]}
            />
            <Button variant="primary" size="sm" icon="plus" onClick={() => navigate('/trade/AAPL?side=buy')}>
              New order
            </Button>
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="orders-card__body">
            {tab === 'cancelled' && !loading && list.length > 0 && <p className="small muted orders-card__note">Includes orders rejected by the simulated venue.</p>}
            {loading ? (
              <div className="orders-loading" aria-busy="true" aria-label="Loading orders">
                {[0, 1, 2].map((i) => (
                  <div className="orders-loading__row" key={i}>
                    <Skeleton w="18%" />
                    <Skeleton w="10%" />
                    <Skeleton w="22%" />
                    <Skeleton w="14%" />
                    <Skeleton w="16%" />
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <EmptyState
                title={emptyCopy[tab].title}
                body={emptyCopy[tab].body}
                action={
                  <Button variant="secondary" size="sm" onClick={() => navigate('/overview')}>
                    Browse watchlist
                  </Button>
                }
              />
            ) : (
              <>
                <div className="hide-mobile table-scroll">
                  <OrdersTable orders={list} onOpen={open} selectedId={selectedId} />
                </div>
                <div className="show-mobile">
                  <OrderCards orders={list} onOpen={open} />
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setParams({ order: null })}
        variant="drawer"
        title={
          selected ? (
            <span className="drawer-title">
              {selected.symbol} <span className="muted small">{selected.id}</span>
            </span>
          ) : (
            ''
          )
        }
        footer={
          selected && isWorking(selected) ? (
            <>
              <Button onClick={() => setParams({ order: null })}>Close</Button>
              <Button variant="danger" onClick={() => setConfirmCancel(selected)}>
                Cancel order
              </Button>
            </>
          ) : (
            <Button onClick={() => setParams({ order: null })}>Close</Button>
          )
        }
      >
        {selected && (
          <div className="order-detail">
            <div className="order-detail__status">
              <StatusBadge status={selected.status} />
              <span className="num strong">{fmtUSD(orderValue(selected))}</span>
            </div>
            {selected.status === 'rejected' && selected.rejectReason && (
              <Notice tone="error" title="Order rejected">
                {selected.rejectReason}
              </Notice>
            )}
            {selected.status === 'partial' && (
              <Notice tone="info" title="Partially filled">
                Part of this order has filled. The remainder is still working at the limit price.
              </Notice>
            )}
            <FillProgress order={selected} />
            <OrderSummary order={selected} />
            <div>
              <h3 className="section-label">Status timeline</h3>
              <OrderTimeline order={selected} />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmCancel}
        onClose={() => !cancelling && setConfirmCancel(null)}
        title="Cancel this order?"
        size="sm"
        footer={
          <>
            <Button onClick={() => setConfirmCancel(null)} disabled={cancelling} data-autofocus>
              Keep order
            </Button>
            <Button variant="danger" onClick={doCancel} loading={cancelling}>
              {cancelling ? 'Cancelling…' : 'Yes, cancel order'}
            </Button>
          </>
        }
      >
        {confirmCancel &&
          (() => {
            const o = confirmCancel;
            const inst = getInstrument(o.symbol)!;
            const remaining = o.qty - o.filledQty;
            return (
              <div className="confirm">
                <p>
                  {o.side === 'buy' ? 'Buy' : 'Sell'} <strong>{fmtQtyUnit(inst, o.qty)}</strong> {o.symbol}{' '}
                  {o.limitPrice !== undefined ? `at a ${fmtPrice(inst, o.limitPrice)} limit` : 'at market'} ({o.id}).
                </p>
                <p className="muted small">
                  {o.filledQty > 0
                    ? `${fmtQtyUnit(inst, o.filledQty)} already filled will be kept; the remaining ${fmtQtyUnit(inst, remaining)} will be cancelled.`
                    : 'Nothing has filled yet, so the whole order will be cancelled.'}{' '}
                  {o.side === 'buy' && `This releases ${fmtUSD(remaining * o.estPrice)} of reserved buying power.`}
                </p>
              </div>
            );
          })()}
      </Modal>
    </>
  );
}
