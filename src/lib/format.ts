import type { Instrument } from '../data/mock';

const usdCache = new Map<number, Intl.NumberFormat>();
function usdFmt(dp: number) {
  let f = usdCache.get(dp);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: dp, maximumFractionDigits: dp });
    usdCache.set(dp, f);
  }
  return f;
}

/** $24,860.42 */
export const fmtUSD = (n: number, dp = 2) => usdFmt(dp).format(n);

/** +$312.68 / −$12.00 (true minus sign) */
export const fmtSignedUSD = (n: number, dp = 2) => (n > 0 ? '+' : n < 0 ? '−' : '') + usdFmt(dp).format(Math.abs(n));

/** +1.27% / −0.18% */
export const fmtPct = (n: number, dp = 2, signed = true) => {
  const s = Math.abs(n).toFixed(dp) + '%';
  if (!signed) return (n < 0 ? '−' : '') + s;
  return (n > 0 ? '+' : n < 0 ? '−' : '') + s;
};

export const fmtNum = (n: number, dp = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });

/** Price in the instrument's quote convention: forex as a rate (1.0842), others as USD. */
export const fmtPrice = (inst: Instrument, n: number) =>
  inst.assetClass === 'forex' ? fmtNum(n, inst.priceDecimals) : fmtUSD(n, inst.priceDecimals);

export const fmtQty = (inst: Instrument, q: number) => fmtNum(q, inst.qtyDecimals);

export const fmtQtyUnit = (inst: Instrument, q: number) => {
  const unit = inst.unit === 'shares' && q === 1 ? 'share' : inst.unit;
  return `${fmtQty(inst, q)} ${unit}`;
};

const dtFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const tsFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** 3 Nov 2026, 14:32 */
export const fmtDateTime = (t: number) => dtFmt.format(t);
export const fmtTime = (t: number) => timeFmt.format(t);
export const fmtTimeSec = (t: number) => tsFmt.format(t);
export const fmtDay = (t: number) => dayFmt.format(t);

/** "Today, 14:32" / "Yesterday, 09:10" / "31 Oct, 16:05" */
export function fmtRelative(t: number, now = Date.now()) {
  const d = new Date(t);
  const n = new Date(now);
  const startOfToday = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  if (t >= startOfToday) return `Today, ${fmtTime(t)}`;
  if (t >= startOfToday - 86_400_000) return `Yesterday, ${fmtTime(t)}`;
  return `${dayFmt.format(d)}, ${fmtTime(t)}`;
}

/** Compact axis labels: 24.9K, 67.4K, 1.0842 */
export function fmtAxis(n: number, decimals: number) {
  if (Math.abs(n) >= 10000) return (n / 1000).toFixed(1) + 'K';
  return fmtNum(n, decimals);
}
