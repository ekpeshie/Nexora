import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { DEFAULT_THRESHOLD, seedOrders, type Order, type OrderSide, type OrderType } from '../data/mock';

export interface Toast {
  id: number;
  tone: 'success' | 'info' | 'warning';
  title: string;
  body?: string;
}

interface State {
  orders: Order[];
  threshold: number;
  toasts: Toast[];
  lastSymbol: string;
}

type Action =
  | { type: 'place'; order: Order }
  | { type: 'cancel'; id: string; at: number }
  | { type: 'threshold'; value: number }
  | { type: 'toast'; toast: Toast }
  | { type: 'dismiss'; id: number }
  | { type: 'lastSymbol'; symbol: string }
  | { type: 'reset' };

const STORAGE_KEY = 'nexora-demo-v1';

function load(): State {
  const base: State = { orders: seedOrders(), threshold: DEFAULT_THRESHOLD, toasts: [], lastSymbol: 'AAPL' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<State>;
    return {
      ...base,
      orders: Array.isArray(saved.orders) ? saved.orders : base.orders,
      threshold: typeof saved.threshold === 'number' ? saved.threshold : base.threshold,
      lastSymbol: typeof saved.lastSymbol === 'string' ? saved.lastSymbol : base.lastSymbol,
    };
  } catch {
    return base;
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'place':
      return { ...state, orders: [action.order, ...state.orders.map((o) => ({ ...o, isNew: false }))] };
    case 'cancel':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id && (o.status === 'open' || o.status === 'partial')
            ? {
                ...o,
                status: 'cancelled',
                updatedAt: action.at,
                events: [
                  ...o.events,
                  {
                    label: 'Cancelled by you',
                    at: action.at,
                    kind: 'failed',
                    detail: o.filledQty > 0 ? 'Unfilled remainder cancelled; filled portion kept' : undefined,
                  },
                ],
              }
            : o,
        ),
      };
    case 'threshold':
      return { ...state, threshold: action.value };
    case 'toast':
      return { ...state, toasts: [...state.toasts.slice(-2), action.toast] };
    case 'dismiss':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'lastSymbol':
      return state.lastSymbol === action.symbol ? state : { ...state, lastSymbol: action.symbol };
    case 'reset':
      return { orders: seedOrders(), threshold: DEFAULT_THRESHOLD, toasts: [], lastSymbol: 'AAPL' };
  }
}

export interface NewOrderInput {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  limitPrice?: number;
  estPrice: number;
  fee: number;
}

interface Ctx extends State {
  placeOrder: (input: NewOrderInput) => Order;
  cancelOrder: (id: string) => void;
  setThreshold: (v: number) => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  setLastSymbol: (s: string) => void;
  reset: () => void;
}

const StoreContext = createContext<Ctx | null>(null);
let toastId = 1;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ orders: state.orders, threshold: state.threshold, lastSymbol: state.lastSymbol }),
      );
    } catch {
      /* storage unavailable — state simply won't persist */
    }
  }, [state.orders, state.threshold, state.lastSymbol]);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = toastId++;
    dispatch({ type: 'toast', toast: { ...t, id } });
    window.setTimeout(() => dispatch({ type: 'dismiss', id }), 6000);
  }, []);

  const placeOrder = useCallback(
    (input: NewOrderInput) => {
      const now = Date.now();
      const nums = state.orders.map((o) => parseInt(o.id.replace(/\D/g, ''), 10)).filter(Number.isFinite);
      const id = `NX-${Math.max(10420, ...nums) + 1}`;
      const order: Order = {
        id,
        ...input,
        filledQty: 0,
        status: 'open',
        createdAt: now,
        updatedAt: now,
        isNew: true,
        events: [
          { label: 'Order created', at: now },
          { label: 'Accepted (demo)', at: now + 400, detail: 'Simulated locally — not sent to any broker or exchange' },
        ],
      };
      dispatch({ type: 'place', order });
      return order;
    },
    [state.orders],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      placeOrder,
      cancelOrder: (id) => dispatch({ type: 'cancel', id, at: Date.now() }),
      setThreshold: (v) => dispatch({ type: 'threshold', value: v }),
      toast,
      dismissToast: (id) => dispatch({ type: 'dismiss', id }),
      setLastSymbol: (s) => dispatch({ type: 'lastSymbol', symbol: s }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state, placeOrder, toast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
