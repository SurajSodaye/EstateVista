import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { agentAuth, agentDb, isFirebaseConfigured } from '../lib/firebase.js';
import { getAuthErrorMessage } from './authService.js';

/**
 * Sign in agent/advisor using the dedicated AgentApp auth instance.
 * Operates completely independently of Customer and Admin authentication.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, profile: Object|null }>}
 */
export async function signInAgent(email, password) {
  if (!isFirebaseConfigured || !agentAuth) {
    throw new Error('Firebase credentials are not configured in .env.local.');
  }

  const credential = await signInWithEmailAndPassword(agentAuth, email.trim(), password);
  const user = credential.user;
  const profile = await fetchAgentProfile(user.uid);

  return { user, profile };
}

/**
 * Sign out agent from the dedicated AgentApp auth instance.
 * Completely isolates the sign-out action so Customer and Admin sessions remain active.
 *
 * @returns {Promise<void>}
 */
export async function signOutAgent() {
  if (!isFirebaseConfigured || !agentAuth) {
    return Promise.resolve();
  }
  return firebaseSignOut(agentAuth);
}

/**
 * Subscribe to authentication state changes on the dedicated AgentApp auth instance
 *
 * @param {Function} callback - (user: Object|null) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAgentAuthState(callback) {
  if (!isFirebaseConfigured || !agentAuth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(agentAuth, callback);
}

/**
 * Fetch agent profile from Cloud Firestore (/users/{uid}) using agentDb.
 * Performs synchronized role resolution between users/{uid} and advisorApplications/{uid}.
 * Distinguishes genuine profiles, missing profile documents, and security/network errors (Case D).
 *
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function fetchAgentProfile(uid) {
  if (!agentDb || !uid) return null;

  try {
    const userDocRef = doc(agentDb, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      let role = data.role || 'customer';
      let advisorStatus = data.advisorStatus || 'none';

      // 1. Case A: If user has role: 'agent' or 'admin', resolve intended approved status
      if (role === 'agent' && advisorStatus === 'none') {
        advisorStatus = 'approved';
      }

      // 2. Synchronize with advisorApplications/{uid} if advisorStatus is not already approved
      if (advisorStatus !== 'approved') {
        try {
          const appDocRef = doc(agentDb, 'advisorApplications', uid);
          const appSnap = await getDoc(appDocRef);
          if (appSnap.exists()) {
            const appData = appSnap.data();
            if (appData.status === 'approved') {
              advisorStatus = 'approved';
              role = 'agent';
            } else if (appData.status === 'pending' && advisorStatus === 'none') {
              advisorStatus = 'pending';
            } else if (appData.status === 'rejected' && advisorStatus === 'none') {
              advisorStatus = 'rejected';
            }
          }
        } catch {
          // Secondary application check is non-fatal
        }
      }

      return {
        ...data,
        role,
        advisorStatus,
      };
    }

    // Document does not exist in Firestore
    return { isMissing: true };
  } catch (err) {
    console.warn('[AgentAuthService] Could not fetch agent profile from Firestore:', err);
    // Return explicit error object so callers do not falsely treat failed reads as default customers (Case D)
    return { isError: true, error: err };
  }
}

/**
 * Register a new applicant account on the dedicated AgentApp auth instance.
 * Strictly assigns default role: 'customer' until explicitly approved by an administrator.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.name
 * @param {string} [params.phone]
 * @returns {Promise<{ user: Object, profile: Object }>}
 */
export async function registerAgentAccount({ email, password, name, phone = '' }) {
  if (!isFirebaseConfigured || !agentAuth) {
    throw new Error('Firebase credentials are not configured in .env.local.');
  }

  const userCredential = await createUserWithEmailAndPassword(agentAuth, email.trim(), password);
  const user = userCredential.user;

  if (name && name.trim()) {
    try {
      await updateProfile(user, { displayName: name.trim() });
    } catch (profileErr) {
      console.warn('[AgentAuthService] Could not set display name on auth profile:', profileErr);
    }
  }

  const profileData = {
    uid: user.uid,
    name: name.trim(),
    email: user.email.toLowerCase(),
    phone: phone ? phone.trim() : null,
    role: 'customer',
    advisorStatus: 'none',
    requestedAccountType: 'agent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (agentDb) {
    try {
      const userDocRef = doc(agentDb, 'users', user.uid);
      await setDoc(userDocRef, {
        ...profileData,
        serverTimestamp: serverTimestamp(),
      });
    } catch (firestoreErr) {
      console.warn('[AgentAuthService] Could not write initial profile to Firestore:', firestoreErr);
    }
  }

  return { user, profile: profileData };
}

/**
 * Submit an application to become an EstateVista luxury advisor using agentDb.
 * Stores application in 'advisorApplications/{uid}' and marks user profile advisorStatus as 'pending'.
 * Role remains 'customer' until approved by an admin.
 *
 * @param {Object} applicationData
 * @returns {Promise<Object>}
 */
export async function submitAgentApplication(applicationData) {
  if (!agentAuth?.currentUser) {
    throw new Error('You must be signed in to submit an advisor application.');
  }

  const user = agentAuth.currentUser;
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
    status: 'pending',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (agentDb) {
    try {
      const appDocRef = doc(agentDb, 'advisorApplications', uid);
      await setDoc(appDocRef, {
        ...applicationPayload,
        serverTimestamp: serverTimestamp(),
      });

      const userDocRef = doc(agentDb, 'users', uid);
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
      console.warn('[AgentAuthService] Could not write application to Firestore:', firestoreErr);
      throw firestoreErr;
    }
  }

  return applicationPayload;
}

/**
 * Fetch advisor application status using agentDb
 *
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function fetchAgentApplication(uid) {
  if (!agentDb || !uid) return null;

  try {
    const appDocRef = doc(agentDb, 'advisorApplications', uid);
    const docSnap = await getDoc(appDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.warn('[AgentAuthService] Could not fetch advisor application from Firestore:', err);
  }
  return null;
}

export { getAuthErrorMessage };
