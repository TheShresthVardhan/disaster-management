import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let db = null;
let storage = null;
let firebaseEnabled = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseEnabled = true;
    console.log('[Firebase] Firestore and Storage initialized successfully');
  } else {
    console.warn('[Firebase] Configuration incomplete. Firebase services disabled. App will use localStorage fallback.');
  }
} catch (error) {
  console.error('[Firebase] Initialization failed:', error);
  console.warn('[Firebase] App will use localStorage fallback.');
}

export { db, storage, firebaseEnabled };
export default app;