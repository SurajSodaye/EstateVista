import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase.js';

/**
 * Transforms Firebase Auth error codes into clean, human-friendly messages
 * @param {Error} error
 * @returns {string}
 */
export function getAuthErrorMessage(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in or reset your password.';
    case 'auth/invalid-email':
      return 'The email address is invalid. Please check for typos and try again.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials and try again.';
    case 'auth/weak-password':
      return 'Your password is too weak. Please choose a password with at least 8 characters.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Please reset your password or try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact EstateVista concierge support.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in the Firebase Console. Please enable it under Authentication > Sign-in method.';
    case 'auth/requires-recent-login':
      return 'This sensitive operation requires a recent login. Please sign in again.';
    default:
      if (!isFirebaseConfigured) {
        return 'Firebase credentials have not been configured yet. Please add your credentials to .env.local.';
      }
      return error.message || 'Authentication failed. Please verify your details and try again.';
  }
}

/**
 * Register a new user with email and password
 * Creates auth user + creates basic Firestore profile with role: 'customer'
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.name
 * @param {string} [params.phone]
 * @param {string} [params.accountType] - 'buyer' or 'owner_agent' from registration form
 * @returns {Promise<{user: Object, profile: Object}>}
 */
export async function registerUser({ email, password, name, phone = '', accountType = 'buyer' }) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not yet configured. Please add your Firebase credentials to .env.local.');
  }

  // 1. Create Firebase Authentication account
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  // 2. Set Firebase Auth display name
  if (name && name.trim()) {
    try {
      await updateProfile(user, { displayName: name.trim() });
    } catch (profileErr) {
      console.warn('[EstateVista Auth] Could not set display name on auth profile:', profileErr);
    }
  }

  // 3. Create basic unprivileged user profile document in Firestore
  // SECURITY NOTICE: Every newly registered user is strictly assigned role: 'customer'.
  // Client selection of 'owner_agent' is saved only as a request (requestedAccountType)
  // for subsequent admin verification. A user can never elevate themselves directly.
  const profileData = {
    uid: user.uid,
    name: name.trim(),
    email: user.email.toLowerCase(),
    phone: phone ? phone.trim() : null,
    role: 'customer', // Strictly unprivileged default role
    advisorStatus: 'none', // Strictly unapproved default status ('none' | 'pending' | 'approved' | 'rejected')
    requestedAccountType: accountType === 'owner_agent' ? 'agent' : 'customer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        ...profileData,
        serverTimestamp: serverTimestamp(),
      });
    } catch (firestoreErr) {
      console.warn('[EstateVista Auth] User created in Auth, but initial Firestore profile write was blocked or delayed:', firestoreErr);
    }
  }

  return { user, profile: profileData };
}

/**
 * Sign in existing user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
export async function signInUser(email, password) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not yet configured. Please add your Firebase credentials to .env.local.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return userCredential.user;
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  if (!isFirebaseConfigured || !auth) {
    return Promise.resolve();
  }
  return firebaseSignOut(auth);
}

/**
 * Send password reset email
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function sendPasswordReset(email) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not yet configured. Please add your Firebase credentials to .env.local.');
  }
  return sendPasswordResetEmail(auth, email.trim());
}

/**
 * Fetch user profile from Firestore
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function fetchUserProfile(uid) {
  if (!db || !uid) return null;

  try {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let role = data.role || 'customer';
      let advisorStatus = data.advisorStatus || 'none';

      // Ensure consistent role and accreditation resolution
      if (role === 'agent' && advisorStatus === 'none') {
        advisorStatus = 'approved';
      }

      return {
        ...data,
        role,
        advisorStatus,
      };
    }
  } catch (err) {
    console.warn('[EstateVista Auth] Could not fetch user profile from Firestore:', err);
  }
  return null;
}

/**
 * Submit an application to become an EstateVista luxury advisor
 * Stores application in Firestore 'advisorApplications/{uid}'
 * and marks user's profile advisorStatus as 'pending'.
 * Role remains 'customer' until explicitly approved by an admin.
 *
 * @param {Object} applicationData
 * @returns {Promise<Object>}
 */
export async function submitAdvisorApplication(applicationData) {
  if (!auth?.currentUser) {
    throw new Error('You must be signed in to submit an advisor application.');
  }

  const user = auth.currentUser;
  const uid = user.uid;

  const applicationPayload = {
    uid,
    applicantName: applicationData.name?.trim() || user.displayName || 'Advisor Applicant',
    applicantEmail: user.email.toLowerCase(),
    phone: applicationData.phone?.trim() || '',
    agency: applicationData.agency?.trim() || '',
    licenseNumber: applicationData.licenseNumber?.trim() || '',
    experienceYears: Number(applicationData.experienceYears) || 0,
    specialties: Array.isArray(applicationData.specialties) ? applicationData.specialties : [],
    serviceLocations: Array.isArray(applicationData.serviceLocations) ? applicationData.serviceLocations : [],
    bio: applicationData.bio?.trim() || '',
    status: 'pending', // Strictly pending, never auto-approved
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      // 1. Write application to advisorApplications collection
      const appDocRef = doc(db, 'advisorApplications', uid);
      await setDoc(appDocRef, {
        ...applicationPayload,
        serverTimestamp: serverTimestamp(),
      });

      // 2. Update user profile in Firestore to record pending status without modifying role
      const userDocRef = doc(db, 'users', uid);
      await setDoc(
        userDocRef,
        {
          advisorStatus: 'pending',
          requestedAgency: applicationData.agency?.trim() || '',
          advisorApplicationSubmittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (firestoreErr) {
      console.warn('[EstateVista Auth] Could not write application to Firestore:', firestoreErr);
      throw firestoreErr;
    }
  }

  return applicationPayload;
}

/**
 * Fetch advisor application status
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function fetchAdvisorApplication(uid) {
  if (!db || !uid) return null;

  try {
    const appDocRef = doc(db, 'advisorApplications', uid);
    const docSnap = await getDoc(appDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.warn('[EstateVista Auth] Could not fetch advisor application from Firestore:', err);
  }
  return null;
}

/**
 * Subscribe to Firebase Authentication state changes
 * @param {Function} callback
 * @returns {Function} unsubscribe function
 */
export function subscribeToAuthState(callback) {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
