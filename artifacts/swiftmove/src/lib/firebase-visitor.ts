// Firebase config — values come from VITE_FIREBASE_* environment variables.
// To change the Firebase project, update those variables in Replit → Secrets & Env Vars
// and restart the dev server. No code changes needed.

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";

const FIREBASE_APP_NAME = "swiftmove-visitor";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const existingApp = getApps().find((a) => a.name === FIREBASE_APP_NAME);
export const visitorFirebaseApp = existingApp ?? initializeApp(firebaseConfig, FIREBASE_APP_NAME);
export const visitorDb = getFirestore(visitorFirebaseApp);
export const visitorRtdb = getDatabase(visitorFirebaseApp);
export const visitorAuth = getAuth(visitorFirebaseApp);

/**
 * Anonymous Firebase Auth — required by the security rules: every visitor doc
 * stores `ownerUid` and only its owner (or an authenticated admin) can read or
 * update it. Resolves with the signed-in user; all Firestore/RTDB access must
 * await this first.
 */
/**
 * Resolves with the signed-in anonymous User, or null when anonymous auth is
 * disabled in the Firebase project (graceful degradation — tracking is skipped
 * but the rest of the app continues to work normally).
 */
export const visitorAuthReady: Promise<User | null> = new Promise((resolve) => {
  const unsub = onAuthStateChanged(visitorAuth, (user) => {
    if (user) {
      unsub();
      resolve(user);
    }
  });
  signInAnonymously(visitorAuth).catch(() => {
    unsub();
    resolve(null); // anonymous auth disabled — degrade gracefully, never crash
  });
});
