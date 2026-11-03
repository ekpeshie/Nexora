import { useEffect, type ReactNode } from 'react';
import { ACCOUNT, toSlug } from '../data/mock';
import { fmtUSD } from '../lib/format';
import { buyingPower } from '../lib/portfolio';
import { navigate, type Route } from '../lib/router';
import { useStore } from '../lib/store';
import { Icon, type IconName } from './ui';

type NavKey = 'overview' | 'markets' | 'trade' | 'orders';

function useNavItems(): { key: NavKey; label: string; icon: IconName; href: string }[] {
  const { lastSymbol } = useStore();
  const slug = toSlug(lastSymbol);
  return [
    { key: 'overview', label: 'Overview', icon: 'overview', href: '#/overview' },
    { key: 'markets', label: 'Markets', icon: 'markets', href: `#/asset/${slug}` },
    { key: 'trade', label: 'Trade', icon: 'trade', href: `#/trade/${slug}?side=buy` },
    { key: 'orders', label: 'Orders', icon: 'orders', href: '#/orders' },
  ];
}

const activeKey = (r: Route): NavKey => (r.name === 'asset' ? 'markets' : r.name);

export function Logo() {
  return (
    <a className="logo" href="#/overview" aria-label="Nexora home">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--elevated)" />
        <path d="M9 23V9l14 14V9" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="logo__word">Nexora</span>
    </a>
  );
}

export function Sidebar({ route }: { route: Route }) {
  const items = useNavItems();
  const { orders, reset, toast } = useStore();
  const active = activeKey(route);
  const openCount = orders.filter((o) => o.status === 'open' || o.status === 'partial').length;
  return (
    <aside className="sidebar" aria-label="Primary">
      <Logo />
      <nav className="sidebar__nav">
        {items.map((it) => (
          <a key={it.key} href={it.href} className={`navlink ${active === it.key ? 'is-active' : ''}`} aria-current={active === it.key ? 'page' : undefined}>
            <Icon name={it.icon} size={20} />
            <span className="navlink__label">{it.label}</span>
            {it.key === 'orders' && openCount > 0 && (
              <span className="navlink__count" aria-label={`${openCount} working orders`}>
                {openCount}
              </span>
            )}
          </a>
        ))}
      </nav>
      <div className="sidebar__foot">
        <div className="acct">
          <span className="acct__avatar">
            <Icon name="user" size={16} />
          </span>
          <span className="acct__meta">
            <span className="acct__name">{ACCOUNT.name}</span>
            <span className="acct__id">{ACCOUNT.id} · USD</span>
          </span>
        </div>
        <button
          type="button"
          className="sidebar__reset"
          onClick={() => {
            reset();
            toast({ tone: 'info', title: 'Demo data reset', body: 'Orders and settings were restored to their starting state.' });
          }}
        >
          <Icon name="reset" size={16} />
          <span className="navlink__label">Reset demo</span>
        </button>
      </div>
    </aside>
  );
}

export function BottomNav({ route }: { route: Route }) {
  const items = useNavItems();
  const active = activeKey(route);
  return (
    <nav className="bottomnav" aria-label="Primary">
      {items.map((it) => (
        <a key={it.key} href={it.href} className={`bottomnav__item ${active === it.key ? 'is-active' : ''}`} aria-current={active === it.key ? 'page' : undefined}>
          <Icon name={it.icon} size={22} />
          <span>{it.label}</span>
        </a>
      ))}
    </nav>
  );
}

/** Persistent strip making clear that nothing on screen is live. */
export function DemoBanner() {
  return (
    <div className="demobar" role="note">
      <Icon name="info" size={14} />
      <span>
        <strong>Prototype · demo data.</strong> <span className="demobar__more">Prices are illustrative, not live. Orders are simulated locally — nothing is sent to a broker or exchange. Not investment advice.</span>
      </span>
    </div>
  );
}

export function TopBar({ title, back, actions }: { title: ReactNode; back?: { label: string; href: string }; actions?: ReactNode }) {
  const { orders } = useStore();
  const bp = buyingPower(orders);
  return (
    <header className="topbar">
      <div className="topbar__left">
        {back && (
          <a href={back.href} className="topbar__back" aria-label={`Back to ${back.label}`}>
            <Icon name="back" size={18} />
            <span className="topbar__backlabel">{back.label}</span>
          </a>
        )}
        <div className="topbar__brand-m">
          <Logo />
        </div>
        <h1 className="topbar__title">{title}</h1>
      </div>
      <div className="topbar__right">
        {actions}
        <div className="topbar__bp" title="Buying power (demo funds)">
          <Icon name="wallet" size={16} />
          <span className="topbar__bplabel">Buying power</span>
          <span className="num">{fmtUSD(bp)}</span>
        </div>
      </div>
    </header>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`} role="status">
          <Icon name={t.tone === 'success' ? 'check' : t.tone === 'warning' ? 'alert' : 'info'} size={18} />
          <div className="toast__text">
            <p className="toast__title">{t.title}</p>
            {t.body && <p className="toast__body">{t.body}</p>}
          </div>
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification">
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * On touch devices, hide fixed bottom bars while a text field is focused so the
 * on-screen keyboard never pushes them over the field being edited.
 */
export function useKeyboardAwareness() {
  useEffect(() => {
    const isField = (el: EventTarget | null) => el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
    const onIn = (e: FocusEvent) => {
      if (!isField(e.target) || !window.matchMedia('(max-width: 767px)').matches) return;
      document.body.classList.add('kbd-open');
      const el = e.target as HTMLElement;
      window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
    };
    const onOut = (e: FocusEvent) => {
      if (isField(e.target)) document.body.classList.remove('kbd-open');
    };
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);
}

export function goToAsset(symbol: string) {
  navigate(`/asset/${toSlug(symbol)}`);
}
