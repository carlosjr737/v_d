import { auth, firebaseConfig } from '@/config/firebase';

type Plan = 'monthly' | 'annual';

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

async function authFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  if (!base) {
    throw new Error(
      'URL das Cloud Functions não configurada. Defina VITE_FUNCTIONS_BASE_URL ou configure VITE_FIREBASE_PROJECT_ID corretamente.'
    );
  }

  const user = auth.currentUser;
  if (!user) throw new Error('not_authenticated');

  // pega o ID token (force refresh opcional pra evitar token expirado)
  const token = await user.getIdToken(/* forceRefresh */ false);

  const headers = new Headers(init?.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(`${base}${path}`, { ...init, headers });

  // melhora o erro retornando JSON quando houver
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error || JSON.stringify(j);
    } catch {
      detail = await res.text();
    }
    throw new Error(detail || `request_failed_${res.status}`);
  }

  // algumas rotas podem devolver 204/empty
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/**
 * Cria sessão de checkout no backend e devolve a URL do Stripe.
 * O backend deve responder: { url: "https://checkout.stripe.com/..." }
 */
export async function createCheckoutSession(
  promoCode?: string,
  plan: Plan = 'monthly'
): Promise<{ url: string }> {
  const body = JSON.stringify({ promoCode, plan });
  return authFetch<{ url: string }>('/createCheckoutSession', { method: 'POST', body });
}

/**
 * Atalho para iniciar o checkout (faz a request e redireciona o navegador).
 * Use este no seu botão "Liberar agora".
 */
export async function startCheckout(options?: { promoCode?: string; plan?: Plan }) {
  const plan = options?.plan ?? 'monthly';
  const promoCode = options?.promoCode;
  const { url } = await createCheckoutSession(promoCode, plan);
  if (!url) throw new Error('checkout_url_missing');
  window.location.href = url;
}

/**
 * Verifica (no backend) se o usuário tem direito/assinatura ativa.
 * O backend pode sincronizar com a Stripe e devolver algo como:
 * { active: boolean, plan?: "monthly"|"annual", currentPeriodEnd?: number }
 */
export async function checkEntitlement() {
  return authFetch<{ active: boolean; plan?: Plan | null; currentPeriodEnd?: number | null }>(
    '/checkEntitlement',
    { method: 'GET' }
  );
}
