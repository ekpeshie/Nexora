import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import Home from './Home';

export function render() {
  return renderToString(
    <StrictMode>
      <Home />
    </StrictMode>,
  );
}
