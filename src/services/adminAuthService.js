import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { adminAuth, adminDb, isFirebaseConfigured } from '../lib/firebase.js';
import { getAuthErrorMessage } from './authService.js';

/**
 * Sign in administrator using the dedicated AdminApp auth instance.
 * Validates credentials and verifies that the user possesses role: 'admin'
 * in the trusted Cloud Firestore profile.
 *
 * If the authenticated account is NOT an administrator (e.g. a customer or agent),
 * it is immediately signed out of adminAuth, and an access-denied error is thrown.
 * The public website authentication session is completely untouched.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, profile: Object }>}
 */
export async function signInAdmin(email, password) {
  if (!isFirebaseConfigured || !adminAuth) {
    throw new Error('Firebase credentials are not configured in .env.local.');
  }

  // 1. Authenticate with dedicated adminAuth instance
  const credential = await signInWithEmailAndPassword(adminAuth, email.trim(), password);
  const user = credential.user;

  // 2. Fetch trusted user profile from Firestore using adminDb
  const profile = await fetchAdminProfile(user.uid);

  // 3. Strict administrative clearance check
  if (!profile || profile.role !== 'admin') {
    // Immediately terminate the admin session to prevent unauthorized lingering state
    try {
      await firebaseSignOut(adminAuth);
    } catch (signOutErr) {
      console.warn('[AdminAuthService] Error signing out unauthorized user:', signOutErr);
    }

    const deniedError = new Error(
      `Access Denied: Account '${user.email}' is registered with role '${profile?.role || 'customer'}'. Administrative access is strictly restricted to verified administrators.`
    );
    deniedError.code = 'auth/access-denied-not-admin';
    throw deniedError;
  }

  return { user, profile };
}

/**
 * Sign out administrator from the dedicated adminAuth instance.
 * Completely isolates the sign-out action so public customer/advisor sessions remain active.
 *
 * @returns {Promise<void>}
 */
export async function signOutAdmin() {
  if (!isFirebaseConfigured || !adminAuth) {
    return Promise.resolve();
  }
  return firebaseSignOut(adminAuth);
}

/**
 * Subscribe to authentication state changes on the dedicated adminAuth instance
 *
 * @param {Function} callback - (user: Object|null) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAdminAuthState(callback) {
  if (!isFirebaseConfigured || !adminAuth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(adminAuth, callback);
}

/**
 * Fetch administrator profile from Cloud Firestore (/users/{uid}) using adminDb
 *
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function fetchAdminProfile(uid) {
  if (!adminDb || !uid) return null;

  try {
    const userDocRef = doc(adminDb, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        role: data.role || 'customer',
        advisorStatus: data.advisorStatus || 'none',
      };
    }
  } catch (err) {
    console.warn('[AdminAuthService] Could not fetch administrator profile from Firestore:', err);
  }
  return null;
}

export { getAuthErrorMessage };
