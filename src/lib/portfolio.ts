import {
  ACCOUNT,
  ASSET_CLASSES,
  CLASS_META,
  POSITIONS,
  getInstrument,
  type AllocationKey,
  type Instrument,
  type Order,
  type OrderSide,
} from '../data/mock';
import { fmtPct, fmtUSD } from './format';

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Holding {
  inst: Instrument;
  qty: number;
  avgCost: number;
  value: number;
}

export const HOLDINGS: Holding[] = POSITIONS.map((p) => {
  const inst = getInstrument(p.symbol)!;
  return { inst, qty: p.qty, avgCost: p.avgCost, value: round2(p.qty * inst.price) };
});

const INVESTED = round2(HOLDINGS.reduce((s, h) => s + h.value, 0));
/** Settled USD cash — the remainder of the $24,860.42 account value. */
export const CASH = round2(ACCOUNT.totalValue - INVESTED);

export type AllocationValues = Record<AllocationKey, number>;

export function currentAllocationValues(): AllocationValues {
  const v: AllocationValues = { stocks: 0, crypto: 0, forex: 0, commodities: 0, cash: CASH };
  for (const h of HOLDINGS) v[h.inst.assetClass] = round2(v[h.inst.assetClass] + h.value);
  return v;
}

export interface AllocationRow {
  key: AllocationKey;
  label: string;
  color: string;
  value: number;
  pct: number;
}

export function toRows(values: AllocationValues): AllocationRow[] {
  const total = Object.values(values).reduce((s, n) => s + n, 0);
  const keys: AllocationKey[] = [...ASSET_CLASSES, 'cash'];
  return keys.map((key) => ({
    key,
    label: CLASS_META[key].label,
    color: CLASS_META[key].color,
    value: values[key],
    pct: total > 0 ? (values[key] / total) * 100 : 0,
  }));
}

export function getHolding(symbol: string) {
  return HOLDINGS.find((h) => h.inst.symbol === symbol);
}

/* ---------------- buying power / reservations ---------------- */

export const isWorking = (o: Order) => o.status === 'open' || o.status === 'partial';

/** USD reserved by working buy orders (remaining qty × estimate price). */
export function reservedCash(orders: Order[]) {
  return round2(
    orders.filter((o) => isWorking(o) && o.side === 'buy').reduce((s, o) => s + (o.qty - o.filledQty) * o.estPrice + o.fee, 0),
  );
}

export function buyingPower(orders: Order[]) {
  return round2(CASH - reservedCash(orders));
}

/** Units of a holding not already committed to working sell orders. */
export function availableToSell(symbol: string, orders: Order[]) {
  const held = getHolding(symbol)?.qty ?? 0;
  const committed = orders
    .filter((o) => isWorking(o) && o.side === 'sell' && o.symbol === symbol)
    .reduce((s, o) => s + (o.qty - o.filledQty), 0);
  return Math.max(0, +(held - committed).toFixed(8));
}

/* ---------------- portfolio impact ---------------- */

export interface ImpactInput {
  inst: Instrument;
  side: OrderSide;
  qty: number;
  price: number;
  fee: number;
}

export interface ImpactRow extends AllocationRow {
  projectedValue: number;
  projectedPct: number;
  deltaPct: number;
  /** Asset classes only: was at/below threshold and would move above it. */
  crossesAbove: boolean;
  /** Was above threshold and would move to at/below it. */
  crossesBelow: boolean;
  aboveAfter: boolean;
  aboveBefore: boolean;
}

export interface Impact {
  rows: ImpactRow[];
  orderValue: number;
  totalBefore: number;
  totalAfter: number;
  target: ImpactRow;
  cash: ImpactRow;
  summary: string;
  thresholdNote: string | null;
  level: 'info' | 'warning';
}

/**
 * Projects allocation after a proposed trade, assuming a full fill at `price`
 * and all other holdings unchanged. Buying moves value from cash into the
 * instrument's asset class; selling does the reverse. Fees leave the account.
 */
export function projectImpact(input: ImpactInput, threshold: number): Impact {
  const before = currentAllocationValues();
  const after: AllocationValues = { ...before };
  const orderValue = round2(input.qty * input.price);
  const cls = input.inst.assetClass;
  if (input.side === 'buy') {
    after[cls] = round2(after[cls] + orderValue);
    after.cash = round2(after.cash - orderValue - input.fee);
  } else {
    after[cls] = round2(Math.max(0, after[cls] - orderValue));
    after.cash = round2(after.cash + orderValue - input.fee);
  }
  const beforeRows = toRows(before);
  const afterRows = toRows(after);
  const totalBefore = round2(Object.values(before).reduce((s, n) => s + n, 0));
  const totalAfter = round2(Object.values(after).reduce((s, n) => s + n, 0));

  const rows: ImpactRow[] = beforeRows.map((b, i) => {
    const a = afterRows[i];
    const isClass = b.key !== 'cash';
    const aboveBefore = isClass && b.pct > threshold;
    const aboveAfter = isClass && a.pct > threshold;
    return {
      ...b,
      projectedValue: a.value,
      projectedPct: a.pct,
      deltaPct: a.pct - b.pct,
      aboveBefore,
      aboveAfter,
      crossesAbove: !aboveBefore && aboveAfter,
      crossesBelow: aboveBefore && !aboveAfter,
    };
  });

  const target = rows.find((r) => r.key === cls)!;
  const cash = rows.find((r) => r.key === 'cash')!;
  const verb = input.side === 'buy' ? 'rise' : 'fall';
  const cashVerb = input.side === 'buy' ? 'fall' : 'rise';
  const summary =
    orderValue > 0
      ? `This ${input.side} of ${fmtUSD(orderValue)} would make ${target.label.toLowerCase()} ${verb} from ${fmtPct(target.pct, 1, false)} to ${fmtPct(
          target.projectedPct,
          1,
          false,
        )} of your portfolio, and cash ${cashVerb} from ${fmtPct(cash.pct, 1, false)} to ${fmtPct(cash.projectedPct, 1, false)}. Other asset classes keep their current value.`
      : 'Enter a quantity to see how this trade would change your allocation.';

  let thresholdNote: string | null = null;
  let level: Impact['level'] = 'info';
  if (orderValue > 0) {
    if (target.crossesAbove) {
      level = 'warning';
      thresholdNote = `${target.label} would move above your ${threshold}% concentration threshold (${fmtPct(target.projectedPct, 1, false)}).`;
    } else if (target.aboveBefore && target.aboveAfter) {
      level = 'warning';
      thresholdNote = `${target.label} is already above your ${threshold}% threshold and would ${input.side === 'buy' ? 'increase' : 'remain above it'} at ${fmtPct(
        target.projectedPct,
        1,
        false,
      )}.`;
    } else if (target.crossesBelow) {
      thresholdNote = `${target.label} would move back within your ${threshold}% threshold (${fmtPct(target.projectedPct, 1, false)}).`;
    } else {
      thresholdNote = `${target.label} stays within your ${threshold}% threshold.`;
    }
  }

  return { rows, orderValue, totalBefore, totalAfter, target, cash, summary, thresholdNote, level };
}
