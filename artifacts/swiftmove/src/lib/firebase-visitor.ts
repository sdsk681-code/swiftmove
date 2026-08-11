// Firebase config shared with swiftmove-L dashboard
// Both projects use the SAME Firebase project (swiftmove-l)
// so visitor data flows directly into the dashboard

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";

const FIREBASE_APP_NAME = "swiftmove-visitor";

const firebaseConfig = {
  apiKey: "AIzaSyAusNou7Mt8kURWl40_BA1QBuXz2CFuKzw",
  authDomain: "saffsa-aa.firebaseapp.com",
  databaseURL: "https://saffsa-aa-default-rtdb.firebaseio.com",
  projectId: "saffsa-aa",
  storageBucket: "saffsa-aa.firebasestorage.app",
  messagingSenderId: "283994765221",
  appId: "1:283994765221:web:fdf3435629a4bfd239da4c",
  measurementId: "G-FBX7B3HGDC",
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
