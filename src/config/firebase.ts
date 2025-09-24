export const firebaseConfig = {
  apiKey: 'AIzaSyD6k5hRvxPpAp-k3Hhoifyt4LPp1E5Zo1Q',
  authDomain: 'verdadeconsequencia.firebaseapp.com',
  projectId: 'verdadeconsequencia',
  storageBucket: 'verdadeconsequencia.firebasestorage.app',
  messagingSenderId: '704487870593',
  appId: '1:704487870593:web:f49d0203223fcf7abe7d80',
} as const;

export const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

export const CARDS_COLLECTION = 'cards';
