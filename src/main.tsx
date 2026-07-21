import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { registerServiceWorker } from '@/app/pwa/registerServiceWorker';
import '@/styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root-Element #root wurde nicht gefunden.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();
