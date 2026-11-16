import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Canonical origin enforcement:
// The production API backend allows CORS from 'https://www.connect2code.in'.
// Navigating to the apex domain 'connect2code.in' causes browser CORS preflight
// rejections (HTTP 403 Forbidden). Immediately redirect to canonical www host.
if (typeof window !== 'undefined' && window.location.hostname === 'connect2code.in') {
  window.location.replace(
    `https://www.connect2code.in${window.location.pathname}${window.location.search}${window.location.hash}`
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

const application = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (rootElement.dataset.c2cSsr === 'true') {
  hydrateRoot(rootElement, application);
} else {
  createRoot(rootElement).render(application);
}
