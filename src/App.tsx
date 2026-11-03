import { useState } from 'react';
import { BottomNav, DemoBanner, Sidebar, Toasts, useKeyboardAwareness } from './components/layout';
import { fromSlug } from './data/mock';
import { useRoute } from './lib/router';
import { AssetDetails } from './screens/AssetDetails';
import { OrderTicket } from './screens/OrderTicket';
import { Orders } from './screens/Orders';
import { Overview } from './screens/Overview';

export default function App() {
  const route = useRoute();
  // Freeze "now" for the session so generated chart data is stable across renders.
  const [now] = useState(() => Date.now());
  useKeyboardAwareness();

  let screen;
  switch (route.name) {
    case 'overview':
      screen = <Overview now={now} />;
      break;
    case 'asset':
      screen = <AssetDetails symbol={fromSlug(route.slug)} now={now} />;
      break;
    case 'trade':
      screen = <OrderTicket key="ticket" slug={route.slug} params={route.params} />;
      break;
    case 'orders':
      screen = <Orders params={route.params} />;
      break;
  }

  return (
    <div className={`app app--${route.name}`}>
      <a href="#main" className="skip-link" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())}>
        Skip to content
      </a>
      <Sidebar route={route} />
      <div className="app__main">
        <DemoBanner />
        <main id="main" tabIndex={-1}>
          {screen}
        </main>
      </div>
      <BottomNav route={route} />
      <Toasts />
    </div>
  );
}
