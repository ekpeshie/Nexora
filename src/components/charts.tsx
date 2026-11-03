import { useEffect, useMemo, useRef, useState } from 'react';
import type { Candle, Timeframe } from '../lib/series';
import { fmtAxis, fmtDay, fmtTime } from '../lib/format';
import type { AllocationRow } from '../lib/portfolio';
import { Segmented } from './ui';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    setW(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function TimeframeControl({ value, onChange, options }: { value: Timeframe; onChange: (t: Timeframe) => void; options: Timeframe[] }) {
  return <Segmented size="sm" label="Chart timeframe" value={value} onChange={onChange} options={options.map((o) => ({ value: o, label: o }))} />;
}

/**
 * Price chart rendered as SVG at the container's real pixel width
 * (so text and strokes never stretch). Supports line and candlestick modes
 * with a hover / touch crosshair.
 */
export function PriceChart({
  data,
  mode,
  height = 280,
  decimals,
  tf,
  formatValue,
  ariaLabel,
  baseline,
}: {
  data: Candle[];
  mode: 'line' | 'candle';
  height?: number;
  decimals: number;
  tf: Timeframe;
  formatValue: (n: number) => string;
  ariaLabel: string;
  /** Optional reference line, e.g. previous close. */
  baseline?: number;
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padR = 56;
  const padL = 4;
  const padT = 12;
  const padB = 26;
  const innerW = Math.max(0, width - padL - padR);
  const innerH = height - padT - padB;

  const { min, max } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const c of data) {
      lo = Math.min(lo, mode === 'candle' ? c.l : c.c, c.o);
      hi = Math.max(hi, mode === 'candle' ? c.h : c.c, c.o);
    }
    if (baseline !== undefined) {
      lo = Math.min(lo, baseline);
      hi = Math.max(hi, baseline);
    }
    const pad = (hi - lo) * 0.08 || hi * 0.001;
    return { min: lo - pad, max: hi + pad };
  }, [data, mode, baseline]);

  const n = data.length;
  const x = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * innerH;
  const first = data[0]?.o ?? 0;
  const last = data[n - 1]?.c ?? 0;
  const up = last >= first;
  const stroke = up ? 'var(--pos)' : 'var(--neg)';

  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= 4; i++) out.push(min + ((max - min) * i) / 4);
    return out;
  }, [min, max]);

  const xTicks = useMemo(() => {
    const count = width < 480 ? 3 : 5;
    const idx: number[] = [];
    for (let i = 0; i < count; i++) idx.push(Math.round(((n - 1) * (i + 0.5)) / count));
    return idx;
  }, [n, width]);

  const timeLabel = (t: number) => (tf === '1H' || tf === '4H' || tf === '1D' ? fmtTime(t) : fmtDay(t));

  const linePath = useMemo(() => {
    if (!width || !n) return '';
    return [`M${x(0)},${y(data[0].o)}`, ...data.map((c, i) => `L${x(i)},${y(c.c)}`)].join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, min, max]);

  const onMove = (clientX: number) => {
    const el = wrapRef.current;
    if (!el || !n) return;
    const rect = el.getBoundingClientRect();
    const rel = clientX - rect.left - padL;
    const i = Math.round((rel / innerW) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const h = hover !== null ? data[hover] : null;
  const candleW = Math.max(1, Math.min(10, (innerW / n) * 0.62));

  return (
    <div className="chart" ref={wrapRef} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          onMouseMove={(e) => onMove(e.clientX)}
          onMouseLeave={() => setHover(null)}
          onTouchStart={(e) => onMove(e.touches[0].clientX)}
          onTouchMove={(e) => onMove(e.touches[0].clientX)}
          onTouchEnd={() => setHover(null)}
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={up ? '#83D9A1' : '#FF827C'} stopOpacity="0.14" />
              <stop offset="100%" stopColor={up ? '#83D9A1' : '#FF827C'} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={padL} x2={padL + innerW} y1={y(t)} y2={y(t)} className="chart__grid" />
              {/* Skip axis labels that would sit under the last-price tag. */}
              {Math.abs(y(t) - y(last)) > 14 && (
                <text x={width - padR + 8} y={y(t) + 4} className="chart__axis">
                  {fmtAxis(t, decimals)}
                </text>
              )}
            </g>
          ))}
          {xTicks.map((i) => (
            <text key={i} x={x(i)} y={height - 8} className="chart__axis" textAnchor="middle">
              {data[i] ? timeLabel(data[i].t) : ''}
            </text>
          ))}
          {baseline !== undefined && (
            <g>
              <line x1={padL} x2={padL + innerW} y1={y(baseline)} y2={y(baseline)} className="chart__baseline" />
            </g>
          )}
          {mode === 'line' ? (
            <>
              <path d={`${linePath} L${x(n - 1)},${padT + innerH} L${x(0)},${padT + innerH} Z`} fill="url(#chart-fill)" />
              <path d={linePath} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinejoin="round" />
            </>
          ) : (
            data.map((c, i) => {
              const bull = c.c >= c.o;
              const col = bull ? 'var(--pos)' : 'var(--neg)';
              const top = y(Math.max(c.o, c.c));
              const bh = Math.max(1, Math.abs(y(c.o) - y(c.c)));
              return (
                <g key={i}>
                  <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth={1} />
                  <rect
                    x={x(i) - candleW / 2}
                    y={top}
                    width={candleW}
                    height={bh}
                    fill={bull ? 'var(--surface)' : col}
                    stroke={col}
                    strokeWidth={1}
                  />
                </g>
              );
            })
          )}
          <line x1={padL} x2={padL + innerW} y1={y(last)} y2={y(last)} className="chart__last" />
          <g transform={`translate(${width - padR + 2}, ${y(last) - 10})`}>
            <rect width={padR - 4} height={20} rx={4} fill={stroke} />
            <text x={(padR - 4) / 2} y={14} textAnchor="middle" className="chart__lasttext">
              {fmtAxis(last, decimals)}
            </text>
          </g>
          {h && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + innerH} className="chart__cross" />
              <circle cx={x(hover)} cy={y(h.c)} r={3.5} fill="var(--text)" />
            </g>
          )}
        </svg>
      )}
      {h && hover !== null && (
        <div className="chart__tip" style={{ left: Math.min(Math.max(x(hover) - 80, 0), Math.max(0, width - padR - 160)) }} aria-hidden="true">
          <span className="chart__tip-time">{tf === '1Y' || tf === '1M' ? fmtDay(h.t) : `${fmtDay(h.t)} ${fmtTime(h.t)}`}</span>
          {mode === 'candle' ? (
            <span className="num">
              O {formatValue(h.o)} · H {formatValue(h.h)} · L {formatValue(h.l)} · C {formatValue(h.c)}
            </span>
          ) : (
            <span className="num">{formatValue(h.c)}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function Sparkline({ values, width = 72, height = 24 }: { values: number[]; width?: number; height?: number }) {
  if (!values.length) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const d = values
    .map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * width).toFixed(1)},${(height - 2 - ((v - lo) / (hi - lo || 1)) * (height - 4)).toFixed(1)}`)
    .join(' ');
  const up = values[values.length - 1] >= values[0];
  return (
    <svg width={width} height={height} aria-hidden="true" className="spark">
      <path d={d} fill="none" stroke={up ? 'var(--pos)' : 'var(--neg)'} strokeWidth={1.4} />
    </svg>
  );
}

/** Horizontal 100% stacked allocation bar with labelled legend. */
export function AllocationBar({ rows, threshold }: { rows: AllocationRow[]; threshold?: number }) {
  return (
    <div className="alloc">
      <div className="alloc__bar" role="img" aria-label={rows.map((r) => `${r.label} ${r.pct.toFixed(1)}%`).join(', ')}>
        {rows.map((r) => (
          <span key={r.key} style={{ width: `${r.pct}%`, background: r.color }} />
        ))}
        {threshold !== undefined && <i className="alloc__mark" style={{ left: `${threshold}%` }} />}
      </div>
    </div>
  );
}
