import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// When a new service worker takes control (after a deploy), reload once so the
// installed PWA picks up the latest build instead of serving a stale cache.
if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
