import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Firebase Client Configuration
 * Keys are loaded from Vite environment variables (import.meta.env).
 * Real credentials should be supplied locally in .env.local (ignored by Git).
 */
const env = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env
  : (typeof process !== 'undefined' && process.env ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/**
 * Determines whether valid Firebase credentials have been supplied
 * (i.e. not empty and not the default placeholder from .env.example)
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_firebase_api_key_here' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id'
);

// 1. Public Website: Default Firebase App instance (Customer session)
let app = null;
let auth = null;
let db = null;
let storage = null;

// 2. Agent / Owner Portal: Dedicated Named Firebase App ('AgentApp')
// Uses independent authentication session isolated from customer and admin
let agentApp = null;
let agentAuth = null;
let agentDb = null;
let agentStorage = null;

// 3. Admin Operations Portal: Dedicated Named Firebase App ('AdminApp')
// Uses independent authentication session with browserSessionPersistence
let adminApp = null;
let adminAuth = null;
let adminDb = null;
let adminStorage = null;

if (isFirebaseConfigured) {
  try {
    // Primary app initialization for public website customer authentication
    app = getApps().find((a) => a.name === '[DEFAULT]') || initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    try {
      storage = getStorage(app);
    } catch (storageErr) {
      console.warn('[EstateVista Firebase] Storage not enabled on default app:', storageErr);
    }

    // Dedicated named app for Agent/Advisor operations
    agentApp = getApps().find((a) => a.name === 'AgentApp') || initializeApp(firebaseConfig, 'AgentApp');
    agentAuth = getAuth(agentApp);
    agentDb = getFirestore(agentApp);
    try {
      agentStorage = getStorage(agentApp);
    } catch (agentStorageErr) {
      console.warn('[EstateVista Firebase] Storage not enabled on AgentApp:', agentStorageErr);
    }

    // Dedicated named app for administrator operations
    adminApp = getApps().find((a) => a.name === 'AdminApp') || initializeApp(firebaseConfig, 'AdminApp');
    try {
      adminAuth = initializeAuth(adminApp, {
        persistence: browserSessionPersistence,
      });
    } catch {
      adminAuth = getAuth(adminApp);
    }

    // Explicitly enforce session persistence (cleared when browser session ends)
    setPersistence(adminAuth, browserSessionPersistence).catch((err) => {
      console.warn('[EstateVista Firebase] Could not set browserSessionPersistence on adminAuth:', err);
    });

    // Dedicated Firestore instance linked to AdminApp
    // Requests from adminDb carry the adminAuth user credentials to satisfy security rules
    adminDb = getFirestore(adminApp);

    try {
      adminStorage = getStorage(adminApp);
    } catch (adminStorageErr) {
      console.warn('[EstateVista Firebase] Storage not enabled on AdminApp:', adminStorageErr);
    }
  } catch (err) {
    console.error('[EstateVista Firebase] Failed to initialize Firebase apps:', err);
  }
} else {
  // Graceful warning for developer before .env.local is populated
  console.info(
    '[EstateVista Firebase] Firebase environment variables not detected or contain placeholders. Please add your configuration to .env.local to enable live authentication.'
  );
}

export { app, auth, db, storage, agentApp, agentAuth, agentDb, agentStorage, adminApp, adminAuth, adminDb, adminStorage };


