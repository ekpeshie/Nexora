import { useEffect, useState } from 'react';

export type Route =
  | { name: 'overview' }
  | { name: 'asset'; slug: string }
  | { name: 'trade'; slug: string | null; params: URLSearchParams }
  | { name: 'orders'; params: URLSearchParams };

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/overview';
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query);
  switch (parts[0]) {
    case 'asset':
      return parts[1] ? { name: 'asset', slug: parts[1] } : { name: 'overview' };
    case 'trade':
      return { name: 'trade', slug: parts[1] ?? null, params };
    case 'orders':
      return { name: 'orders', params };
    default:
      return { name: 'overview' };
  }
}

export function navigate(to: string) {
  const next = to.startsWith('#') ? to : `#${to}`;
  if (location.hash === next) return;
  location.hash = next;
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => {
      const next = parseHash(location.hash);
      setRoute((prev) => {
        // Only scroll to top when the screen changes, not when only the query changes.
        if (prev.name !== next.name || ('slug' in prev && 'slug' in next && prev.slug !== next.slug)) {
          window.scrollTo({ top: 0 });
        }
        return next;
      });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
