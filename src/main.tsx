import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import '@/styles/animations.css';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

function attachGlobalErrorBanner() {
  const add = (msg: string) => {
    let el = document.getElementById('boot-error-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'boot-error-banner';
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.right = '0';
      el.style.bottom = '0';
      el.style.zIndex = '9999';
      el.style.padding = '12px 16px';
      el.style.background = 'rgba(192, 30, 30, .95)';
      el.style.color = '#fff';
      el.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial';
      el.style.fontSize = '13px';
      el.style.whiteSpace = 'pre-wrap';
      document.body.appendChild(el);
    }
    el.textContent = `Erro de execução: ${msg}`;
  };

  window.addEventListener('error', e => {
    add(e?.error?.message || e?.message || 'erro desconhecido');
  });
  window.addEventListener('unhandledrejection', (e: any) => {
    const reason = e?.reason?.message || String(e?.reason || 'unhandledrejection');
    add(reason);
  });
}

attachGlobalErrorBanner();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
