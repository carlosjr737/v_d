import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@/styles/animations.css';

import App from './App.tsx';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

// ⬇️ NEW: React Router
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import CheckoutSuccess from '@/routes/CheckoutSuccess';
import CheckoutCancel from '@/routes/CheckoutCancel';

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
  window.addEventListener('error', (e) => add((e as any)?.error?.message || (e as any)?.message || 'erro desconhecido'));
  window.addEventListener('unhandledrejection', (e: any) => {
    const reason = e?.reason?.message || String(e?.reason || 'unhandledrejection');
    add(reason);
  });
}
attachGlobalErrorBanner();

// ⬇️ NEW: rotas do app
const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/pay/success', element: <CheckoutSuccess /> },
  { path: '/pay/cancel', element: <CheckoutCancel /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <RouterProvider router={router} />
    </AppErrorBoundary>
  </StrictMode>
);
