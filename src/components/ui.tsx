import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { OrderStatus } from '../data/mock';
import { fmtPct } from '../lib/format';

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

const ICONS = {
  overview: (
    <>
      <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="14.5" width="7" height="6" rx="1.5" />
    </>
  ),
  markets: <path d="M3.5 17.5l5-5 4 4 8-8M15 8.5h5.5V14" />,
  trade: <path d="M7.5 20V4.5m0 0L4 8m3.5-3.5L11 8M16.5 4v15.5m0 0L13 16m3.5 3.5L20 16" />,
  orders: <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 3.8l9 15.7H3z" />
      <path d="M12 10v4.2M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  half: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 010 17z" fill="currentColor" stroke="none" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  reset: <path d="M4.5 12a7.5 7.5 0 101.9-5M4.5 4.5v3.5H8" />,
  wallet: (
    <>
      <rect x="3.5" y="6" width="17" height="13" rx="2" />
      <path d="M16 12.5h.01M3.5 9.5h17" />
    </>
  ),
  arrowDown: <path d="M12 5v14m0 0l-5-5m5 5l5-5" />,
  arrowUp: <path d="M12 19V5m0 0l-5 5m5-5l5 5" />,
  deposit: <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19.5h14" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.5 0-2.6.8-2.6 2s1 1.6 2.6 2c1.6.3 2.7.9 2.7 2.1s-1.2 2-2.7 2c-1.2 0-2.2-.5-2.6-1.3M12 6.5V8m0 8v1.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'buy' | 'sell' | 'danger';

export function Button({
  variant = 'secondary',
  size = 'md',
  block,
  icon,
  loading,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  icon?: IconName;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className}`}
      aria-busy={loading || undefined}
      {...rest}
      disabled={rest.disabled || loading}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null}
      <span>{children}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented control & tabs                                            */
/* ------------------------------------------------------------------ */

export interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
  tone?: 'buy' | 'sell';
  ariaLabel?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  block,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: 'sm' | 'md';
  block?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div className={`seg seg--${size} ${block ? 'seg--block' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.ariaLabel}
            tabIndex={active ? 0 : -1}
            className={`seg__opt ${active ? 'is-active' : ''} ${o.tone ? `seg__opt--${o.tone}` : ''}`}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${t.value}`}
            aria-selected={active}
            aria-controls={`panel-${t.value}`}
            tabIndex={active ? 0 : -1}
            className={`tabs__tab ${active ? 'is-active' : ''}`}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => {
              const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (!dir) return;
              e.preventDefault();
              const next = (i + dir + tabs.length) % tabs.length;
              onChange(tabs[next].value);
              refs.current[next]?.focus();
            }}
          >
            {t.label}
            {t.count !== undefined && <span className="tabs__count">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form fields                                                         */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  error,
  warning,
  children,
  htmlFor,
  aside,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  warning?: string | null;
  children: ReactNode;
  htmlFor: string;
  aside?: ReactNode;
}) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <div className="field__top">
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
        {aside && <span className="field__aside">{aside}</span>}
      </div>
      {children}
      {error ? (
        <p className="field__msg field__msg--error" id={`${htmlFor}-msg`} role="alert">
          <Icon name="alert" size={14} /> {error}
        </p>
      ) : warning ? (
        <p className="field__msg field__msg--warn" id={`${htmlFor}-msg`}>
          <Icon name="info" size={14} /> {warning}
        </p>
      ) : hint ? (
        <p className="field__msg" id={`${htmlFor}-msg`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function NumberInput({
  id,
  value,
  onChange,
  onBlur,
  suffix,
  prefix,
  invalid,
  step,
  decimals,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  suffix?: string;
  prefix?: string;
  invalid?: boolean;
  step: number;
  decimals: number;
  describedBy?: string;
}) {
  const bump = (dir: 1 | -1) => {
    const cur = parseFloat(value);
    const base = Number.isFinite(cur) ? cur : 0;
    const next = Math.max(0, base + dir * step);
    onChange(next.toFixed(decimals));
  };
  return (
    <div className={`input input--number ${invalid ? 'is-invalid' : ''}`}>
      <button type="button" className="input__step" onClick={() => bump(-1)} aria-label="Decrease" tabIndex={-1}>
        <Icon name="minus" size={16} />
      </button>
      {prefix && <span className="input__affix">{prefix}</span>}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.\-]/g, ''))}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            bump(1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            bump(-1);
          }
        }}
      />
      {suffix && <span className="input__affix input__affix--suffix">{suffix}</span>}
      <button type="button" className="input__step" onClick={() => bump(1)} aria-label="Increase" tabIndex={-1}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

export function Select({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  compact,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel?: string;
  compact?: boolean;
}) {
  return (
    <div className={`select ${compact ? 'select--compact' : ''}`}>
      <select id={id} value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron" size={14} className="select__chev" />
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const id = useId();
  return (
    <div className="input input--search">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Icon name="search" size={16} />
      <input id={id} type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" className="input__clear" onClick={() => onChange('')} aria-label="Clear search">
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Indicators                                                          */
/* ------------------------------------------------------------------ */

/** Price change with sign, arrow and colour — never colour alone. */
export function PriceChange({ pct, abs, size = 'md', pill }: { pct: number; abs?: string; size?: 'sm' | 'md' | 'lg'; pill?: boolean }) {
  const dir = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  return (
    <span className={`chg chg--${dir} chg--${size} ${pill ? 'chg--pill' : ''}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="chg__arrow">
        {dir === 'up' && <path d="M4 1l3.5 5.5h-7z" fill="currentColor" />}
        {dir === 'down' && <path d="M4 7L.5 1.5h7z" fill="currentColor" />}
        {dir === 'flat' && <rect x="1" y="3.25" width="6" height="1.5" fill="currentColor" />}
      </svg>
      <span className="sr-only">{dir === 'up' ? 'Up' : dir === 'down' ? 'Down' : 'Unchanged'} </span>
      {abs && <span className="num">{abs}&nbsp;</span>}
      <span className="num">{abs ? `(${fmtPct(pct)})` : fmtPct(pct)}</span>
    </span>
  );
}

const STATUS_META: Record<OrderStatus, { label: string; icon: IconName }> = {
  open: { label: 'Open', icon: 'clock' },
  partial: { label: 'Partially filled', icon: 'half' },
  filled: { label: 'Filled', icon: 'check' },
  cancelled: { label: 'Cancelled', icon: 'xCircle' },
  rejected: { label: 'Rejected', icon: 'alert' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`badge badge--${status}`}>
      <Icon name={m.icon} size={13} />
      {m.label}
    </span>
  );
}

export function SideTag({ side }: { side: 'buy' | 'sell' }) {
  return <span className={`side side--${side}`}>{side === 'buy' ? 'Buy' : 'Sell'}</span>;
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'warn' }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}

export function DemoTag({ children = 'Illustrative' }: { children?: ReactNode }) {
  return (
    <span className="tag tag--demo" title="Illustrative demo data — not live market information">
      <Icon name="info" size={12} />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Containers & states                                                 */
/* ------------------------------------------------------------------ */

export function Card({
  title,
  actions,
  children,
  className = '',
  pad = true,
  as: As = 'section',
  titleId,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
  as?: 'section' | 'div' | 'aside';
  titleId?: string;
}) {
  return (
    <As className={`card ${pad ? 'card--pad' : ''} ${className}`} aria-labelledby={title ? titleId : undefined}>
      {(title || actions) && (
        <header className="card__head">
          {title && (
            <h2 className="card__title" id={titleId}>
              {title}
            </h2>
          )}
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      {children}
    </As>
  );
}

export function EmptyState({ icon = 'orders', title, body, action }: { icon?: IconName; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon name={icon} size={22} />
      </div>
      <p className="empty__title">{title}</p>
      {body && <p className="empty__body">{body}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ w = '100%', h = 14, r = 6 }: { w?: number | string; h?: number; r?: number }) {
  return <span className="skel" style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />;
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warning' | 'error' | 'success'; title?: string; children?: ReactNode }) {
  const icon: IconName = tone === 'warning' || tone === 'error' ? 'alert' : tone === 'success' ? 'check' : 'info';
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon name={icon} size={16} />
      <div>
        {title && <p className="notice__title">{title}</p>}
        {children && <div className="notice__body">{children}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal / sheet                                                       */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  variant = 'dialog',
  describedBy,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** 'drawer' slides in from the right on desktop; all variants become a bottom sheet on mobile. */
  variant?: 'dialog' | 'drawer';
  describedBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.classList.add('modal-open');
    const el = ref.current;
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []);
    window.setTimeout(() => (el?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === 'Tab') {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Only unlock scroll when no other modal is still open.
      window.setTimeout(() => {
        if (!document.querySelector('.modal')) document.body.classList.remove('modal-open');
      }, 0);
      prevFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className={`modal modal--${variant}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal__panel modal__panel--${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={describedBy} ref={ref}>
        <header className="modal__head">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/** Key/value list used in summaries, stats and order details. */
export function KeyValues({ items, columns = 1 }: { items: { k: ReactNode; v: ReactNode; strong?: boolean }[]; columns?: 1 | 2 }) {
  return (
    <dl className={`kv kv--cols-${columns}`}>
      {items.map((it, i) => (
        <div className={`kv__row ${it.strong ? 'kv__row--strong' : ''}`} key={i}>
          <dt>{it.k}</dt>
          <dd className="num">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}
