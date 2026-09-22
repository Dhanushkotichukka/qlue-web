import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from 'firebase/auth';
import { Env } from '@/config/env';

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function initFirebase(): FirebaseApp {
  if (app) return app;
  app = initializeApp({
    apiKey: Env.firebaseApiKey,
    appId: Env.firebaseAppId,
    messagingSenderId: Env.messagingSenderId,
    projectId: Env.firebaseProjectId,
    measurementId: Env.measurementId || undefined,
    authDomain: Env.firebaseProjectId
      ? `${Env.firebaseProjectId}.firebaseapp.com`
      : undefined,
  });
  return app;
}

export function auth(): Auth {
  if (!authInstance) authInstance = getAuth(initFirebase());
  return authInstance;
}

export const googleProvider = (() => {
  const p = new GoogleAuthProvider();
  p.addScope('email');
  p.addScope('profile');
  return p;
})();

/** Current Firebase ID token (optionally forced-refresh), or null. */
export async function currentIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth().currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}
