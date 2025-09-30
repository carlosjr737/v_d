import { auth } from '@/config/firebase';

const base = import.meta.env.VITE_FUNCTIONS_BASE_URL as string;

async function authFetch(path: string, init?: RequestInit) {
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
