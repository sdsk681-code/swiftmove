// Firebase config shared with swiftmove-L dashboard
// Both projects use the SAME Firebase project (swiftmove-l)
// so visitor data flows directly into the dashboard

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";

const FIREBASE_APP_NAME = "swiftmove-visitor";

const firebaseConfig = {
  apiKey: "AIzaSyCerXqJkAvH4JkXkD0Ut09TZyrHCe2kJHs",
  authDomain: "swiftmove-l.firebaseapp.com",
  databaseURL: "https://swiftmove-l-default-rtdb.firebaseio.com",
  projectId: "swiftmove-l",
  storageBucket: "swiftmove-l.firebasestorage.app",
  messagingSenderId: "742722534350",
  appId: "1:742722534350:web:b0c756c2d8a62d592dc99f",
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
