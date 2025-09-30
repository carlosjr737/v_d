import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  isSignInWithEmailLink,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function requireEnv(name: string): string {
  const v = (import.meta as any).env?.[name];
  if (!v) {
    // Log explícito e mantém app vivo
    // Obs.: não lançamos exceção aqui para evitar “tela preta” por erro síncrono.
    console.error(`[ENV MISSING] ${name} não definido. Configure as variáveis VITE_* no ambiente de produção.`);
    return '';
  }
  return v as string;
}

export const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
  appId: requireEnv('VITE_FIREBASE_APP_ID'),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
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

export const FUNCTIONS_BASE_URL = requireEnv('VITE_FUNCTIONS_BASE_URL');

export const isEmailLink = () => typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href);

export const FIRESTORE_BASE_URL =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

export const CARDS_COLLECTION = 'cards';
