/**
 * Illustrative demo data for the Nexora prototype.
 * Nothing here is live market data, and no figure is investment advice.
 */

export type AssetClass = 'stocks' | 'crypto' | 'forex' | 'commodities';
export type AllocationKey = AssetClass | 'cash';

export interface Instrument {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  market: string;
  /** Indicative (illustrative) price in USD per unit. */
  price: number;
  /** Daily change in percent. */
  changePct: number;
  /** Decimal places used when displaying the price. */
  priceDecimals: number;
  /** Decimal places allowed for order quantities. */
  qtyDecimals: number;
  /** Unit label for quantities, e.g. "shares", "BTC". */
  unit: string;
  /** Demo maximum order size, used for "excessive quantity" validation. */
  maxOrderQty: number;
  /** Typical daily volatility in percent, used to generate chart data. */
  dailyVol: number;
  /** Extra descriptive stats shown on Asset Details. */
  stats: { label: string; value: string }[];
}

export const CLASS_META: Record<AllocationKey, { label: string; short: string; color: string }> = {
  stocks: { label: 'Stocks', short: 'Stocks', color: '#7EA6E0' },
  crypto: { label: 'Crypto', short: 'Crypto', color: '#B49BE8' },
  forex: { label: 'Forex', short: 'FX', color: '#64C6BE' },
  commodities: { label: 'Commodities', short: 'Cmdty', color: '#D4B483' },
  cash: { label: 'Cash (USD)', short: 'Cash', color: '#6B7466' },
};

export const ASSET_CLASSES: AssetClass[] = ['stocks', 'crypto', 'forex', 'commodities'];

export const INSTRUMENTS: Instrument[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    assetClass: 'stocks',
    market: 'NASDAQ',
    price: 232.8,
    changePct: 0.84,
    priceDecimals: 2,
    qtyDecimals: 0,
    unit: 'shares',
    maxOrderQty: 5000,
    dailyVol: 1.4,
    stats: [
      { label: 'Market cap', value: '$3.52T' },
      { label: 'P/E (TTM)', value: '35.4' },
      { label: 'Avg volume (30D)', value: '52.6M' },
      { label: 'Dividend yield', value: '0.43%' },
    ],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    assetClass: 'stocks',
    market: 'NASDAQ',
    price: 412.3,
    changePct: -0.36,
    priceDecimals: 2,
    qtyDecimals: 0,
    unit: 'shares',
    maxOrderQty: 5000,
    dailyVol: 1.3,
    stats: [
      { label: 'Market cap', value: '$3.06T' },
      { label: 'P/E (TTM)', value: '34.8' },
      { label: 'Avg volume (30D)', value: '19.8M' },
      { label: 'Dividend yield', value: '0.76%' },
    ],
  },
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    assetClass: 'crypto',
    market: 'Crypto · 24/7',
    price: 67482.1,
    changePct: 2.31,
    priceDecimals: 2,
    qtyDecimals: 4,
    unit: 'BTC',
    maxOrderQty: 10,
    dailyVol: 3.1,
    stats: [
      { label: 'Market cap', value: '$1.33T' },
      { label: '24h volume', value: '$28.4B' },
      { label: 'Circulating supply', value: '19.77M BTC' },
      { label: 'Trading hours', value: '24/7' },
    ],
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    assetClass: 'crypto',
    market: 'Crypto · 24/7',
    price: 3551.2,
    changePct: 1.12,
    priceDecimals: 2,
    qtyDecimals: 4,
    unit: 'ETH',
    maxOrderQty: 200,
    dailyVol: 3.6,
    stats: [
      { label: 'Market cap', value: '$427.1B' },
      { label: '24h volume', value: '$14.2B' },
      { label: 'Circulating supply', value: '120.3M ETH' },
      { label: 'Trading hours', value: '24/7' },
    ],
  },
  {
    symbol: 'EUR/USD',
    name: 'Euro / US dollar',
    assetClass: 'forex',
    market: 'FX · OTC',
    price: 1.0842,
    changePct: -0.18,
    priceDecimals: 4,
    qtyDecimals: 0,
    unit: 'EUR',
    maxOrderQty: 1000000,
    dailyVol: 0.45,
    stats: [
      { label: 'Typical spread', value: '0.6 pips' },
      { label: 'Pip value (10k EUR)', value: '$1.00' },
      { label: 'Session', value: 'London / New York' },
      { label: 'Base / quote', value: 'EUR / USD' },
    ],
  },
  {
    symbol: 'GBP/USD',
    name: 'British pound / US dollar',
    assetClass: 'forex',
    market: 'FX · OTC',
    price: 1.2964,
    changePct: 0.07,
    priceDecimals: 4,
    qtyDecimals: 0,
    unit: 'GBP',
    maxOrderQty: 1000000,
    dailyVol: 0.5,
    stats: [
      { label: 'Typical spread', value: '0.9 pips' },
      { label: 'Pip value (10k GBP)', value: '$1.00' },
      { label: 'Session', value: 'London / New York' },
      { label: 'Base / quote', value: 'GBP / USD' },
    ],
  },
  {
    symbol: 'XAU/USD',
    name: 'Gold',
    assetClass: 'commodities',
    market: 'Spot metals',
    price: 2745.6,
    changePct: 0.42,
    priceDecimals: 2,
    qtyDecimals: 2,
    unit: 'oz',
    maxOrderQty: 500,
    dailyVol: 0.9,
    stats: [
      { label: 'Unit', value: '1 troy ounce' },
      { label: 'Typical spread', value: '$0.35' },
      { label: 'Session', value: '23h / weekdays' },
      { label: 'Settlement', value: 'Spot, cash-settled (demo)' },
    ],
  },
  {
    symbol: 'XAG/USD',
    name: 'Silver',
    assetClass: 'commodities',
    market: 'Spot metals',
    price: 32.48,
    changePct: -0.55,
    priceDecimals: 2,
    qtyDecimals: 2,
    unit: 'oz',
    maxOrderQty: 20000,
    dailyVol: 1.6,
    stats: [
      { label: 'Unit', value: '1 troy ounce' },
      { label: 'Typical spread', value: '$0.03' },
      { label: 'Session', value: '23h / weekdays' },
      { label: 'Settlement', value: 'Spot, cash-settled (demo)' },
    ],
  },
];

export function getInstrument(symbol: string): Instrument | undefined {
  return INSTRUMENTS.find((i) => i.symbol === symbol);
}

/** URL-safe slug: "BTC/USD" → "BTC-USD". */
export const toSlug = (symbol: string) => symbol.replace('/', '-');
export const fromSlug = (slug: string) => {
  const decoded = decodeURIComponent(slug);
  return INSTRUMENTS.find((i) => toSlug(i.symbol) === decoded || i.symbol === decoded)?.symbol;
};

/* ------------------------------------------------------------------ */
/* Account                                                             */
/* ------------------------------------------------------------------ */

export const ACCOUNT = {
  name: 'Demo account',
  id: 'NX-DEMO-0042',
  currency: 'USD',
  /** Total portfolio value incl. cash, in USD. */
  totalValue: 24860.42,
  dayPnl: 312.68,
};

/** Previous close: total − today's P&L (so +312.68 ⇒ +1.27%). */
export const PREV_CLOSE_VALUE = +(ACCOUNT.totalValue - ACCOUNT.dayPnl).toFixed(2);

/**
 * Holdings. Values are qty × indicative price. Cash is the remainder so that
 * the account always totals exactly $24,860.42.
 */
export const POSITIONS: { symbol: string; qty: number; avgCost: number }[] = [
  { symbol: 'AAPL', qty: 15, avgCost: 214.1 },
  { symbol: 'MSFT', qty: 6, avgCost: 398.75 },
  { symbol: 'BTC/USD', qty: 0.0721, avgCost: 58210.0 },
  { symbol: 'ETH/USD', qty: 0.38, avgCost: 3120.4 },
  { symbol: 'EUR/USD', qty: 2293, avgCost: 1.0915 },
  { symbol: 'XAU/USD', qty: 1.2, avgCost: 2588.0 },
  { symbol: 'XAG/USD', qty: 21, avgCost: 30.12 },
];

export const WATCHLIST: string[] = INSTRUMENTS.map((i) => i.symbol);

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type OrderStatus = 'open' | 'partial' | 'filled' | 'cancelled' | 'rejected';

export interface OrderEvent {
  label: string;
  at: number;
  detail?: string;
  kind?: 'done' | 'failed';
}

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  limitPrice?: number;
  /** Price used for the value estimate (limit price, or indicative price at entry for market orders). */
  estPrice: number;
  filledQty: number;
  avgFillPrice?: number;
  fee: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  rejectReason?: string;
  events: OrderEvent[];
  /** Created by the user in this session. */
  isNew?: boolean;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function seedOrders(now = Date.now()): Order[] {
  const at = (ago: number) => now - ago;
  return [
    {
      id: 'NX-10418',
      symbol: 'XAU/USD',
      side: 'buy',
      type: 'limit',
      qty: 0.5,
      limitPrice: 2701.0,
      estPrice: 2701.0,
      filledQty: 0.2,
      avgFillPrice: 2701.0,
      fee: 0,
      status: 'partial',
      createdAt: at(3 * HOUR + 12 * MIN),
      updatedAt: at(52 * MIN),
      events: [
        { label: 'Order created', at: at(3 * HOUR + 12 * MIN) },
        { label: 'Accepted (demo)', at: at(3 * HOUR + 12 * MIN - 2000) },
        { label: 'Partially filled', at: at(52 * MIN), detail: '0.20 of 0.50 oz at $2,701.00' },
      ],
    },
    {
      id: 'NX-10415',
      symbol: 'MSFT',
      side: 'sell',
      type: 'limit',
      qty: 2,
      limitPrice: 430.0,
      estPrice: 430.0,
      filledQty: 0,
      fee: 0,
      status: 'open',
      createdAt: at(1 * DAY + 2 * HOUR),
      updatedAt: at(1 * DAY + 2 * HOUR),
      events: [
        { label: 'Order created', at: at(1 * DAY + 2 * HOUR) },
        { label: 'Accepted (demo)', at: at(1 * DAY + 2 * HOUR - 1500) },
      ],
    },
    {
      id: 'NX-10411',
      symbol: 'BTC/USD',
      side: 'buy',
      type: 'market',
      qty: 0.015,
      estPrice: 66890.0,
      filledQty: 0.015,
      avgFillPrice: 66910.0,
      fee: 0,
      status: 'filled',
      createdAt: at(1 * DAY + 6 * HOUR),
      updatedAt: at(1 * DAY + 6 * HOUR - 1000),
      events: [
        { label: 'Order created', at: at(1 * DAY + 6 * HOUR) },
        { label: 'Accepted (demo)', at: at(1 * DAY + 6 * HOUR - 400) },
        { label: 'Filled', at: at(1 * DAY + 6 * HOUR - 1000), detail: '0.0150 BTC at $66,910.00' },
      ],
    },
    {
      id: 'NX-10409',
      symbol: 'ETH/USD',
      side: 'buy',
      type: 'limit',
      qty: 0.5,
      limitPrice: 3380.0,
      estPrice: 3380.0,
      filledQty: 0,
      fee: 0,
      status: 'cancelled',
      createdAt: at(2 * DAY + 4 * HOUR),
      updatedAt: at(2 * DAY + 1 * HOUR),
      events: [
        { label: 'Order created', at: at(2 * DAY + 4 * HOUR) },
        { label: 'Accepted (demo)', at: at(2 * DAY + 4 * HOUR - 1200) },
        { label: 'Cancelled by you', at: at(2 * DAY + 1 * HOUR), kind: 'failed' },
      ],
    },
    {
      id: 'NX-10402',
      symbol: 'EUR/USD',
      side: 'sell',
      type: 'market',
      qty: 1000,
      estPrice: 1.0861,
      filledQty: 0,
      fee: 0,
      status: 'rejected',
      rejectReason: 'Market closed — the demo FX session was not open when this order was sent.',
      createdAt: at(3 * DAY + 9 * HOUR),
      updatedAt: at(3 * DAY + 9 * HOUR - 800),
      events: [
        { label: 'Order created', at: at(3 * DAY + 9 * HOUR) },
        { label: 'Rejected', at: at(3 * DAY + 9 * HOUR - 800), detail: 'Market closed (demo session)', kind: 'failed' },
      ],
    },
    {
      id: 'NX-10398',
      symbol: 'AAPL',
      side: 'buy',
      type: 'market',
      qty: 5,
      estPrice: 228.1,
      filledQty: 5,
      avgFillPrice: 228.4,
      fee: 0,
      status: 'filled',
      createdAt: at(4 * DAY + 5 * HOUR),
      updatedAt: at(4 * DAY + 5 * HOUR - 900),
      events: [
        { label: 'Order created', at: at(4 * DAY + 5 * HOUR) },
        { label: 'Accepted (demo)', at: at(4 * DAY + 5 * HOUR - 300) },
        { label: 'Filled', at: at(4 * DAY + 5 * HOUR - 900), detail: '5 shares at $228.40' },
      ],
    },
  ];
}

/** Non-order account activity shown alongside orders on Overview. */
export function seedActivity(now = Date.now()) {
  return [
    { id: 'act-1', kind: 'dividend' as const, label: 'Dividend · AAPL', amount: 3.75, at: now - 2 * DAY - 3 * HOUR },
    { id: 'act-2', kind: 'deposit' as const, label: 'Deposit (demo funds)', amount: 2000, at: now - 5 * DAY },
  ];
}

/** Configurable concentration threshold options (percent of total portfolio value). */
export const THRESHOLD_OPTIONS = [20, 25, 30, 35, 40, 50];
export const DEFAULT_THRESHOLD = 30;
