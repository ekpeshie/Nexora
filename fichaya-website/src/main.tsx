import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import Home from './Home';
import './styles/fonts';
import './styles/tokens.css';
import './styles/home.css';

// Production builds are prerendered to static HTML (scripts/prerender.mjs) and hydrated here;
// the dev server serves an empty root, so it renders from scratch.
const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <Home />
  </StrictMode>
);
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);
