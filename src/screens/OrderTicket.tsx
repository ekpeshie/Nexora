import { useEffect, useMemo, useState } from 'react';
import { INSTRUMENTS, getInstrument, toSlug, type Instrument, type OrderSide, type OrderType } from '../data/mock';
import { TopBar } from '../components/layout';
import { AssetClassTag, AssetGlyph, ImpactPreview } from '../components/trading';
import { Button, Card, DemoTag, Field, KeyValues, Modal, Notice, NumberInput, PriceChange, Segmented, Select, SideTag } from '../components/ui';
import { fmtNum, fmtPct, fmtPrice, fmtQtyUnit, fmtUSD } from '../lib/format';
import { availableToSell, buyingPower, projectImpact } from '../lib/portfolio';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';

const FEE_PLACEHOLDER = 0;

function decimalsOf(s: string) {
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

interface Validation {
  qty: number;
  limit: number;
  qtyError: string | null;
  priceError: string | null;
  priceWarning: string | null;
  fundsError: string | null;
  valid: boolean;
}

function validate(inst: Instrument, side: OrderSide, type: OrderType, qtyStr: string, priceStr: string, bp: number, avail: number): Validation {
  const qty = Number(qtyStr);
  const limit = Number(priceStr);
  let qtyError: string | null = null;
  let priceError: string | null = null;
  let priceWarning: string | null = null;
  let fundsError: string | null = null;

  const unitWord = inst.unit === 'shares' ? 'shares' : inst.unit;
  if (qtyStr.trim() === '') qtyError = 'Enter a quantity.';
  else if (!/^-?\d*\.?\d*$/.test(qtyStr) || !Number.isFinite(qty)) qtyError = 'Enter a valid number.';
  else if (qty < 0) qtyError = "Quantity can't be negative.";
  else if (qty === 0) qtyError = 'Quantity must be greater than zero.';
  else if (decimalsOf(qtyStr) > inst.qtyDecimals)
    qtyError = inst.qtyDecimals === 0 ? `${inst.symbol} trades in whole ${unitWord}.` : `Use up to ${inst.qtyDecimals} decimal places.`;
  else if (qty > inst.maxOrderQty) qtyError = `Exceeds the demo maximum order size of ${fmtQtyUnit(inst, inst.maxOrderQty)}.`;
  else if (side === 'sell' && qty > avail)
    qtyError = avail > 0 ? `You can sell up to ${fmtQtyUnit(inst, avail)} (available, excluding working sell orders).` : `You have no ${inst.symbol} available to sell.`;

  if (type === 'limit') {
    if (priceStr.trim() === '') priceError = 'Enter a limit price.';
    else if (!/^-?\d*\.?\d*$/.test(priceStr) || !Number.isFinite(limit)) priceError = 'Enter a valid price.';
    else if (limit <= 0) priceError = 'Limit price must be greater than zero.';
    else if (decimalsOf(priceStr) > inst.priceDecimals) priceError = `Use up to ${inst.priceDecimals} decimal places.`;
    else {
      const dev = ((limit - inst.price) / inst.price) * 100;
      if (Math.abs(dev) > 10) priceWarning = `Your limit is ${fmtPct(Math.abs(dev), 1, false)} ${dev < 0 ? 'below' : 'above'} the indicative price.`;
    }
  }

  const price = type === 'limit' && !priceError ? limit : inst.price;
  if (!qtyError && side === 'buy') {
    const total = qty * price + FEE_PLACEHOLDER;
    if (total > bp) fundsError = `Insufficient buying power: this order needs ${fmtUSD(total)} but ${fmtUSD(bp)} is available.`;
  }
  return { qty, limit, qtyError, priceError, priceWarning, fundsError, valid: !qtyError && !priceError && !fundsError };
}

export function OrderTicket({ slug, params }: { slug: string | null; params: URLSearchParams }) {
  const store = useStore();
  const { orders, threshold, setThreshold, setLastSymbol, placeOrder } = store;

  const initialSymbol = (slug && INSTRUMENTS.find((i) => toSlug(i.symbol) === decodeURIComponent(slug))?.symbol) || store.lastSymbol;
  const [symbol, setSymbol] = useState(initialSymbol);
  const inst = getInstrument(symbol)!;
  const [side, setSide] = useState<OrderSide>(params.get('side') === 'sell' ? 'sell' : 'buy');
  const [type, setType] = useState<OrderType>(params.get('type') === 'limit' ? 'limit' : 'market');
  const [qtyStr, setQtyStr] = useState(params.get('qty') ?? '');
  const [priceStr, setPriceStr] = useState(params.get('price') ?? inst.price.toFixed(inst.priceDecimals));
  const [touched, setTouched] = useState({ qty: false, price: false });
  const [attempted, setAttempted] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Keep in sync when the route changes (e.g. Buy/Sell from Asset Details).
  useEffect(() => {
    if (slug) {
      const s = INSTRUMENTS.find((i) => toSlug(i.symbol) === decodeURIComponent(slug))?.symbol;
      if (s) setSymbol(s);
    }
    const sd = params.get('side');
    if (sd === 'buy' || sd === 'sell') setSide(sd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, params.toString()]);

  useEffect(() => setLastSymbol(symbol), [symbol, setLastSymbol]);

  const changeInstrument = (s: string) => {
    const next = getInstrument(s)!;
    setSymbol(s);
    setQtyStr('');
    setPriceStr(next.price.toFixed(next.priceDecimals));
    setTouched({ qty: false, price: false });
    setAttempted(false);
    navigate(`/trade/${toSlug(s)}?side=${side}`);
  };

  const bp = buyingPower(orders);
  const avail = availableToSell(symbol, orders);
  const v = validate(inst, side, type, qtyStr, priceStr, bp, avail);
  const showQtyErr = (touched.qty || attempted) && v.qtyError;
  const showPriceErr = (touched.price || attempted) && v.priceError;

  const estPrice = type === 'limit' && !v.priceError ? v.limit : inst.price;
  const qtyForEstimate = v.qtyError ? 0 : v.qty;
  const estValue = qtyForEstimate * estPrice;
  const total = side === 'buy' ? estValue + FEE_PLACEHOLDER : estValue - FEE_PLACEHOLDER;

  const impact = useMemo(
    () => projectImpact({ inst, side, qty: qtyForEstimate, price: estPrice, fee: FEE_PLACEHOLDER }, threshold),
    [inst, side, qtyForEstimate, estPrice, threshold],
  );

  const maxQty = side === 'sell' ? avail : Math.floor((bp / estPrice) * 10 ** inst.qtyDecimals) / 10 ** inst.qtyDecimals;

  const onReview = () => {
    setAttempted(true);
    if (!v.valid) {
      const firstBad = v.qtyError || v.fundsError ? 'qty' : 'limit-price';
      document.getElementById(firstBad)?.focus();
      return;
    }
    setReviewOpen(true);
  };

  const onSubmit = () => {
    setSubmitting(true);
    window.setTimeout(() => {
      const order = placeOrder({
        symbol,
        side,
        type,
        qty: v.qty,
        limitPrice: type === 'limit' ? v.limit : undefined,
        estPrice,
        fee: FEE_PLACEHOLDER,
      });
      setSubmitting(false);
      setReviewOpen(false);
      // Confirmation is shown as a persistent banner on the Orders screen.
      navigate(`/orders?tab=open&placed=${order.id}`);
    }, 650);
  };

  const unit = inst.unit;
  const sideLabel = side === 'buy' ? 'Buy' : 'Sell';

  return (
    <>
      <TopBar title="Order ticket" back={{ label: inst.symbol, href: `#/asset/${toSlug(inst.symbol)}` }} />
      <div className="page page--ticket">
        <div className="ticket-col">
          <Card className="ticket" title="New order" titleId="ticket-title" actions={<DemoTag>Simulated order</DemoTag>}>
            <form
              className="ticket__form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                onReview();
              }}
            >
              <div className="ticket__inst">
                <AssetGlyph inst={inst} size={40} />
                <div className="ticket__inst-main">
                  <label htmlFor="instrument" className="sr-only">
                    Instrument
                  </label>
                  <Select
                    id="instrument"
                    value={symbol}
                    onChange={changeInstrument}
                    options={INSTRUMENTS.map((i) => ({ value: i.symbol, label: `${i.symbol} — ${i.name}` }))}
                  />
                  <p className="ticket__inst-meta small">
                    <AssetClassTag inst={inst} />
                    <span className="muted">{inst.market}</span>
                  </p>
                </div>
                <div className="ticket__inst-px">
                  <span className="num strong">{fmtPrice(inst, inst.price)}</span>
                  <PriceChange pct={inst.changePct} size="sm" />
                </div>
              </div>

              <Segmented<OrderSide>
                block
                label="Order side"
                value={side}
                onChange={(s) => {
                  setSide(s);
                  navigate(`/trade/${toSlug(symbol)}?side=${s}`);
                }}
                options={[
                  { value: 'buy', label: 'Buy', tone: 'buy' },
                  { value: 'sell', label: 'Sell', tone: 'sell' },
                ]}
              />

              <Field label="Order type" htmlFor="order-type" hint={type === 'market' ? 'Executes at the best available price (simulated). The estimate uses the indicative price.' : 'Executes only at your limit price or better (simulated).'}>
                <div id="order-type">
                  <Segmented<OrderType>
                    block
                    size="sm"
                    label="Order type"
                    value={type}
                    onChange={setType}
                    options={[
                      { value: 'market', label: 'Market' },
                      { value: 'limit', label: 'Limit' },
                    ]}
                  />
                </div>
              </Field>

              <Field
                label={`Quantity (${unit})`}
                htmlFor="qty"
                error={showQtyErr ? v.qtyError : null}
                aside={
                  <button type="button" className="textlink small" onClick={() => (setQtyStr(maxQty > 0 ? String(maxQty) : '0'), setTouched((t) => ({ ...t, qty: true })))}>
                    Max {fmtNum(Math.max(0, maxQty), inst.qtyDecimals)}
                  </button>
                }
                hint={side === 'sell' ? `${fmtQtyUnit(inst, avail)} available to sell` : inst.qtyDecimals ? `Up to ${inst.qtyDecimals} decimal places` : 'Whole units only'}
              >
                <NumberInput
                  id="qty"
                  value={qtyStr}
                  onChange={setQtyStr}
                  onBlur={() => setTouched((t) => ({ ...t, qty: true }))}
                  suffix={unit}
                  invalid={!!showQtyErr}
                  step={inst.qtyDecimals ? 1 / 10 ** Math.min(inst.qtyDecimals, 2) : 1}
                  decimals={inst.qtyDecimals}
                  describedBy="qty-msg"
                />
              </Field>

              {type === 'limit' && (
                <Field label={inst.assetClass === 'forex' ? 'Limit rate (USD)' : 'Limit price (USD)'} htmlFor="limit-price" error={showPriceErr ? v.priceError : null} warning={v.priceWarning} hint={`Indicative: ${fmtPrice(inst, inst.price)}`}>
                  <NumberInput
                    id="limit-price"
                    value={priceStr}
                    onChange={setPriceStr}
                    onBlur={() => setTouched((t) => ({ ...t, price: true }))}
                    prefix={inst.assetClass === 'forex' ? undefined : '$'}
                    invalid={!!showPriceErr}
                    step={inst.assetClass === 'forex' ? 0.0001 : inst.price > 1000 ? 1 : 0.05}
                    decimals={inst.priceDecimals}
                    describedBy="limit-price-msg"
                  />
                </Field>
              )}

              <div className="ticket__summary" aria-live="polite">
                <KeyValues
                  items={[
                    { k: type === 'limit' ? 'Limit price' : 'Indicative price', v: fmtPrice(inst, estPrice) },
                    { k: 'Estimated order value', v: fmtUSD(estValue) },
                    { k: 'Fees (placeholder)', v: fmtUSD(FEE_PLACEHOLDER) },
                    { k: side === 'buy' ? 'Estimated total cost' : 'Estimated proceeds', v: fmtUSD(total), strong: true },
                    { k: 'Available buying power', v: fmtUSD(bp) },
                  ]}
                />
              </div>

              {attempted && v.fundsError && <Notice tone="error" title="Insufficient buying power">{v.fundsError.replace('Insufficient buying power: ', '')}</Notice>}
              {!attempted && v.fundsError && qtyStr && <Notice tone="warning">{v.fundsError}</Notice>}

              <div className="ticket__cta">
                <Button type="submit" variant={side === 'buy' ? 'buy' : 'sell'} size="lg" block>
                  Review {sideLabel.toLowerCase()} order
                </Button>
                <p className="small muted ta-c">You'll confirm on the next step. Nothing is sent to a broker.</p>
              </div>
            </form>
          </Card>
        </div>

        <div className="impact-col">
          <Card className="impact-card" pad>
            <ImpactPreview impact={impact} threshold={threshold} onThreshold={setThreshold} />
          </Card>
        </div>
      </div>

      <Modal
        open={reviewOpen}
        onClose={() => !submitting && setReviewOpen(false)}
        title="Review demo order"
        size="lg"
        footer={
          <>
            <Button onClick={() => setReviewOpen(false)} disabled={submitting}>
              Edit order
            </Button>
            <Button variant={side === 'buy' ? 'buy' : 'sell'} onClick={onSubmit} loading={submitting} data-autofocus>
              {submitting ? 'Submitting…' : `Submit demo ${sideLabel.toLowerCase()} order`}
            </Button>
          </>
        }
      >
        <div className="review">
          <div className="review__order">
            <div className="review__headline">
              <SideTag side={side} />
              <span className="strong">
                {fmtQtyUnit(inst, v.qty)} {inst.symbol}
              </span>
              <span className="muted cap">{type}</span>
            </div>
            <KeyValues
              items={[
                { k: 'Instrument', v: `${inst.symbol} · ${inst.name}` },
                { k: 'Side', v: sideLabel },
                { k: 'Order type', v: type === 'limit' ? 'Limit' : 'Market' },
                { k: 'Quantity', v: fmtQtyUnit(inst, v.qty) },
                { k: 'Price', v: type === 'limit' ? `${fmtPrice(inst, v.limit)} limit` : `~${fmtPrice(inst, inst.price)} (indicative)` },
                { k: 'Estimated value', v: fmtUSD(estValue), strong: true },
                { k: 'Fees (placeholder)', v: fmtUSD(FEE_PLACEHOLDER) },
                { k: 'Buying power after', v: side === 'buy' ? fmtUSD(bp - total) : fmtUSD(bp) },
              ]}
            />
            <Notice tone="info">Demo only: this order is simulated in your browser and will appear as Open with 0 filled. No real execution takes place.</Notice>
          </div>
          <div className="review__impact">
            <ImpactPreview impact={impact} threshold={threshold} compact />
          </div>
        </div>
      </Modal>
    </>
  );
}
