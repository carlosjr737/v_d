import { auth, firebaseConfig } from '@/config/firebase';

function inferFunctionsBaseUrl() {
  const envBase = (import.meta.env.VITE_FUNCTIONS_BASE_URL as string | undefined)?.trim();
  if (envBase) return envBase.replace(/\/$/, '');

  const projectId = firebaseConfig.projectId;
  if (!projectId) return '';

  if (import.meta.env.DEV) {
    return `http://localhost:5001/${projectId}/southamerica-east1`;
  }

  return `https://southamerica-east1-${projectId}.cloudfunctions.net`;
}

const base = inferFunctionsBaseUrl();

async function authFetch(path: string, init?: RequestInit) {
  if (!base) {
    throw new Error(
      'URL das Cloud Functions não configurada. Defina VITE_FUNCTIONS_BASE_URL ou configure VITE_FIREBASE_PROJECT_ID corretamente.'
    );
  }
  const user = auth.currentUser;
  if (!user) throw new Error('not_authenticated');
  const token = await user.getIdToken();
  const headers = new Headers(init?.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCheckoutSession(promoCode?: string, plan: 'monthly' | 'annual' = 'monthly') {
  const body = JSON.stringify({ promoCode, plan });
  return authFetch('/createCheckoutSession', { method: 'POST', body });
}

export async function checkEntitlement() {
  return authFetch('/checkEntitlement', { method: 'GET' });
}
