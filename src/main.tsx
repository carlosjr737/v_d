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
      Object.assign(el.style, {
        position: 'fixed', left: '0', right: '0', bottom: '0', zIndex: '9999',
        padding: '12px 16px', background: 'rgba(192,30,30,.95)', color: '#fff',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial', fontSize: '13px',
        whiteSpace: 'pre-wrap'
      } as CSSStyleDeclaration);
      document.body.appendChild(el);
    }
    el.textContent = `Erro de execução: ${msg}`;
  };
  window.addEventListener('error', (e) => add(e?.error?.message || e?.message || 'erro desconhecido'));
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
