// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  isSignInWithEmailLink,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/** Lê a env e falha com aviso claro (evita app "semi-inicializado"). */
function requireEnv(name: string): string {
  const v = (import.meta as any).env?.[name];
  if (!v || String(v).trim() === '') {
    console.error(`[ENV MISSING] ${name} não definido. Configure as variáveis VITE_* no ambiente.`);
    throw new Error(`Missing env ${name}`);
  }
  return v as string;
}

export const firebaseConfig = {
  apiKey:        requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain:    requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),      // ex: seu-projeto.firebaseapp.com
  projectId:     requireEnv('VITE_FIREBASE_PROJECT_ID'),
  appId:         requireEnv('VITE_FIREBASE_APP_ID'),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
} as const;

export const FUNCTIONS_BASE_URL = (() => {
  const url = requireEnv('VITE_FUNCTIONS_BASE_URL');           // ex: https://southamerica-east1-<proj>.cloudfunctions.net
  if (!/^https?:\/\//.test(url)) {
    throw new Error('VITE_FUNCTIONS_BASE_URL deve incluir http(s)://');
  }
  return url.replace(/\/+$/, ''); // remove trailing /
})();

export const FIRESTORE_BASE_URL =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

// --- Inicializa Firebase ---
const app = initializeApp(firebaseConfig);

// --- Auth e persistência robusta (Safari/Private fallback) ---
export const auth = getAuth(app);
export const db = getFirestore(app);

(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    await setPersistence(auth, inMemoryPersistence);
  }
  // trata retornos de redirect silenciosamente
  try { await getRedirectResult(auth); } catch {}
})();

// --- Providers ---
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const appleProvider = new OAuthProvider('apple.com');

// --- Helpers de Login ---
export async function loginWithGoogle(): Promise<User> {
  const ua = navigator.userAgent || '';
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  try {
    if (isSafari) {
      await signInWithRedirect(auth, googleProvider);
      // fluxo continua no redirect
      throw new Error('redirecting');
    }
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (e: any) {
    if (e?.code === 'auth/popup-blocked' || e?.message === 'redirecting') {
      await signInWithRedirect(auth, googleProvider);
      throw e;
    }
    throw e;
  }
}

export const isEmailLink = () =>
  typeof window !== 'undefined' &&
  auth &&
  isSignInWithEmailLink(auth, window.location.href);

// --- Token seguro + fetch autenticado ---
async function getIdTokenSafe(forceRefresh = true): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('no-user');
  return user.getIdToken(forceRefresh);
}

/** Sempre usa Bearer e JSON; path deve iniciar com "/". */
export async function authedFetch<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  if (!path.startsWith('/')) path = `/${path}`;
  const token = await getIdTokenSafe(true);

  const res = await fetch(`${FUNCTIONS_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
    ...init,
  });

  // Útil para depurar CORS
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('authedFetch error', res.status, text);
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}
