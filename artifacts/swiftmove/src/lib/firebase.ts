/**
 * firebase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the Firebase SDK in SwiftMove & Clean.
 *
 * Configuration comes from VITE_FIREBASE_* environment variables.
 * To switch Firebase projects, update those vars in Replit → Secrets & Env Vars
 * and restart the dev server — no code changes needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore,   type Firestore }            from "firebase/firestore";
import { getDatabase,    type Database }              from "firebase/database";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";

// ─── Config ──────────────────────────────────────────────────────────────────

const REQUIRED_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_DATABASE_URL",
  "VITE_FIREBASE_PROJECT_ID",
] as const;

for (const key of REQUIRED_VARS) {
  if (!import.meta.env[key]) {
    console.warn(`[Firebase] Missing env var: ${key}. Firebase features will be disabled.`);
  }
}

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

// ─── App (singleton) ─────────────────────────────────────────────────────────

const APP_NAME = "swiftmove";

export const app: FirebaseApp =
  getApps().find((a) => a.name === APP_NAME) ??
  initializeApp(firebaseConfig, APP_NAME);

// ─── Services ────────────────────────────────────────────────────────────────

/** Firestore — visitor sessions & booking tracking */
export const db: Firestore = getFirestore(app);

/** Realtime Database — live presence & chat */
export const rtdb: Database = getDatabase(app);

/** Auth instance */
export const auth: Auth = getAuth(app);

// ─── Anonymous Auth ───────────────────────────────────────────────────────────
/**
 * Resolves with the signed-in anonymous User.
 * Resolves null when anonymous auth is disabled in Firebase Console
 * (graceful degradation — tracking is silently skipped, booking flow continues).
 */
export const authReady: Promise<User | null> = new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
      unsub();
      resolve(user);
    }
  });

  signInAnonymously(auth).catch(() => {
    unsub();
    resolve(null);
  });
});
