import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  isSignInWithEmailLink,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const FALLBACK_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD6k5hRvxPpAp-k3Hhoifyt4LPp1E5Zo1Q',
  authDomain: 'verdadeconsequencia.firebaseapp.com',
  projectId: 'verdadeconsequencia',
  appId: '1:704487870593:web:f49d0203223fcf7abe7d80',
  storageBucket: 'verdadeconsequencia.firebasestorage.app',
} as const;

function requireEnv(name: string, fallbackKey: keyof typeof FALLBACK_FIREBASE_CONFIG | null = null): string {
  const raw = (import.meta as any).env?.[name];
  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }

  if (fallbackKey) {
    const fallback = FALLBACK_FIREBASE_CONFIG[fallbackKey];
    if (fallback) {
      console.warn(
        `[ENV MISSING] ${name} não definido. Usando fallback embutido para evitar quebra em desenvolvimento.`
      );
      return fallback;
    }
  }

  console.error(`[ENV MISSING] ${name} não definido. Configure as variáveis VITE_* no ambiente de produção.`);
  return '';
}

export const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY', 'apiKey'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID', 'projectId'),
  appId: requireEnv('VITE_FIREBASE_APP_ID', 'appId'),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket'),
} as const;

// Evita crash se env estiver faltando: só inicializa quando temos o mínimo
const canInit =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

let app: ReturnType<typeof initializeApp> | null = null;
try {
  if (canInit) {
    app = initializeApp(firebaseConfig);
  } else {
    console.warn('[Firebase] Variáveis incompletas: app não inicializado.');
  }
} catch (err) {
  console.error('[Firebase] Falha ao inicializar:', err);
}

export const auth = app ? getAuth(app) : (null as any);
export const db = app ? getFirestore(app) : (null as any);

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export const FUNCTIONS_BASE_URL = requireEnv('VITE_FUNCTIONS_BASE_URL', null);

export const isEmailLink = () => typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href);

export const FIRESTORE_BASE_URL =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

export const CARDS_COLLECTION = 'cards';
