import { Capacitor } from '@capacitor/core';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cachedServices: FirebaseServices | null = null;

function hasConfigValue(value: string | undefined) {
  return typeof value === 'string' && value.trim().length > 0 && !value.includes('your-');
}

export function isFirebaseConfigured() {
  return [
    import.meta.env.VITE_FIREBASE_API_KEY,
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    import.meta.env.VITE_FIREBASE_APP_ID,
  ].every(hasConfigValue);
}

export function getFirebaseServices(): FirebaseServices | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (cachedServices) {
    return cachedServices;
  }

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY!,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN!,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID!,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
    appId: import.meta.env.VITE_FIREBASE_APP_ID!,
  };

  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  let db: Firestore;

  if (Capacitor.isNativePlatform()) {
    try {
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    } catch {
      db = getFirestore(app);
    }
  } else {
    db = getFirestore(app);
  }

  cachedServices = {
    app,
    auth: getAuth(app),
    db,
  };

  return cachedServices;
}

export async function ensureAnonymousSession() {
  const services = getFirebaseServices();

  if (!services) {
    return null;
  }

  let user: User | null = services.auth.currentUser;

  if (!user) {
    const credential = await signInAnonymously(services.auth);
    user = credential.user;
  }

  return {
    ...services,
    user,
  };
}
