import { ACCOUNT, PREV_CLOSE_VALUE, type Instrument } from '../data/mock';

/** Deterministic PRNG so charts look the same on every render. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export type Timeframe = '1H' | '4H' | '1D' | '1W' | '1M' | '1Y';
export const ASSET_TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D', '1W', '1M', '1Y'];
export const PORTFOLIO_TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '1Y'];

const MIN = 60_000;
const TF: Record<Timeframe, { n: number; step: number; days: number; label: string }> = {
  '1H': { n: 60, step: MIN, days: 1 / 24, label: 'past hour' },
  '4H': { n: 48, step: 5 * MIN, days: 1 / 6, label: 'past 4 hours' },
  '1D': { n: 48, step: 30 * MIN, days: 1, label: 'today' },
  '1W': { n: 56, step: 3 * 60 * MIN, days: 7, label: 'past week' },
  '1M': { n: 60, step: 12 * 60 * MIN, days: 30, label: 'past month' },
  '1Y': { n: 52, step: 7 * 24 * 60 * MIN, days: 365, label: 'past year' },
};

export const timeframeLabel = (tf: Timeframe) => TF[tf].label;

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

/**
 * Log-space Brownian bridge from `start` to `end` over n steps, so the series
 * always lands exactly on the displayed indicative price.
 */
function bridge(start: number, end: number, n: number, vol: number, rand: () => number) {
  const inc: number[] = [];
  let w = 0;
  const walk = [0];
  for (let i = 0; i < n; i++) {
    const e = gaussian(rand) * vol;
    inc.push(e);
    w += e;
    walk.push(w);
  }
  const L = Math.log(end / start);
  return walk.map((wk, k) => start * Math.exp(wk - (k / n) * (w - L)));
}

function periodChange(tf: Timeframe, dailyChangePct: number, dailyVol: number, rand: () => number) {
  switch (tf) {
    case '1H':
      return dailyChangePct * 0.18 + gaussian(rand) * dailyVol * 0.08;
    case '4H':
      return dailyChangePct * 0.45 + gaussian(rand) * dailyVol * 0.15;
    case '1D':
      return dailyChangePct;
    case '1W':
      return dailyChangePct + gaussian(rand) * dailyVol * 1.6;
    case '1M':
      return gaussian(rand) * dailyVol * 3 + dailyVol * 1.2;
    case '1Y':
      return dailyVol * 9 + gaussian(rand) * dailyVol * 4;
  }
}

const cache = new Map<string, Candle[]>();

export function assetSeries(inst: Instrument, tf: Timeframe, now: number): Candle[] {
  const key = `${inst.symbol}|${tf}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rand = mulberry32(hash(key));
  const cfg = TF[tf];
  const chg = periodChange(tf, inst.changePct, inst.dailyVol, rand);
  const start = inst.price / (1 + chg / 100);
  const vol = (inst.dailyVol / 100) * Math.sqrt(cfg.days) / Math.sqrt(cfg.n) * 1.15;
  const closes = bridge(start, inst.price, cfg.n, vol, rand);
  const end = Math.floor(now / cfg.step) * cfg.step;
  const candles: Candle[] = [];
  for (let k = 1; k <= cfg.n; k++) {
    const o = closes[k - 1];
    const c = closes[k];
    const wick = vol * 0.7;
    const h = Math.max(o, c) * (1 + Math.abs(gaussian(rand)) * wick);
    const l = Math.min(o, c) * (1 - Math.abs(gaussian(rand)) * wick);
    candles.push({ t: end - (cfg.n - k) * cfg.step, o, h, l, c });
  }
  cache.set(key, candles);
  return candles;
}

const PORTFOLIO_START: Partial<Record<Timeframe, number>> = {
  '1D': PREV_CLOSE_VALUE,
  '1W': 24193.1,
  '1M': 23712.55,
  '1Y': 19884.3,
};

export function portfolioSeries(tf: Timeframe, now: number) {
  const key = `portfolio|${tf}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rand = mulberry32(hash(key));
  const cfg = TF[tf];
  const start = PORTFOLIO_START[tf] ?? PREV_CLOSE_VALUE;
  const vol = (1.1 / 100) * Math.sqrt(cfg.days) / Math.sqrt(cfg.n);
  const pts = bridge(start, ACCOUNT.totalValue, cfg.n, vol, rand);
  const end = Math.floor(now / cfg.step) * cfg.step;
  const out: Candle[] = pts.slice(1).map((c, i) => ({ t: end - (cfg.n - 1 - i) * cfg.step, o: pts[i], h: c, l: c, c }));
  cache.set(key, out);
  return out;
}

/** Small sparkline for watchlist rows (1D). */
export function sparkline(inst: Instrument, now: number) {
  return assetSeries(inst, '1D', now).map((c) => c.c);
}

export interface DepthLevel {
  price: number;
  size: number;
  cum: number;
}

export function marketDepth(inst: Instrument): { bids: DepthLevel[]; asks: DepthLevel[]; spread: number } {
  const rand = mulberry32(hash(inst.symbol + '|depth'));
  const tick = inst.assetClass === 'forex' ? 0.0001 : inst.price > 10000 ? 0.5 : inst.price > 1000 ? 0.1 : 0.01;
  const half = Math.max(tick, +(inst.price * 0.00008).toFixed(inst.priceDecimals));
  const baseSize = inst.assetClass === 'forex' ? 250000 : inst.assetClass === 'crypto' ? (inst.price > 10000 ? 0.8 : 9) : inst.assetClass === 'stocks' ? 400 : inst.price > 1000 ? 12 : 600;
  const levels = 6;
  const mk = (dir: 1 | -1) => {
    let cum = 0;
    let offset = half;
    const out: DepthLevel[] = [];
    for (let i = 0; i < levels; i++) {
      if (i > 0) offset += tick * (1 + Math.floor(rand() * 3));
      const price = inst.price + dir * offset;
      const size = baseSize * (0.35 + rand() * 1.2) * (1 + i * 0.15);
      cum += size;
      out.push({ price, size, cum });
    }
    return out;
  };
  const bids = mk(-1);
  const asks = mk(1);
  return { bids, asks, spread: asks[0].price - bids[0].price };
}
