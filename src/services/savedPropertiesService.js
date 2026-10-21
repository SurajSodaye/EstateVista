import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  query,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase.js';
import { getPropertyById } from './propertyService.js';

/**
 * Normalizes any Firestore timestamp representation (Timestamp object, seconds, ISO string, Date)
 * into a valid ISO 8601 string.
 * @param {*} val
 * @returns {string}
 */
export function parseTimestampToIso(val) {
  if (!val) return new Date().toISOString();
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString();
  }
  return new Date().toISOString();
}

/**
 * Saves a property reference to the authenticated user's savedProperties subcollection
 * Structure: users/{userId}/savedProperties/{propertyId}
 * 
 * @param {string} userId - Authenticated user UID
 * @param {string} propertyId - ID of property to save
 * @returns {Promise<{success: boolean, propertyId: string}>}
 */
export async function saveProperty(userId, propertyId) {
  if (!userId) {
    throw new Error('User authentication required to save properties.');
  }
  if (!propertyId) {
    throw new Error('Property ID is required.');
  }

  const cleanPropertyId = String(propertyId).trim();
  const docRef = doc(db, 'users', userId, 'savedProperties', cleanPropertyId);

  await setDoc(
    docRef,
    {
      propertyId: cleanPropertyId,
      savedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true, propertyId: cleanPropertyId };
}

/**
 * Removes a saved property reference from the authenticated user's savedProperties subcollection
 * 
 * @param {string} userId - Authenticated user UID
 * @param {string} propertyId - ID of property to remove
 * @returns {Promise<{success: boolean, propertyId: string}>}
 */
export async function unsaveProperty(userId, propertyId) {
  if (!userId) {
    throw new Error('User authentication required to manage saved properties.');
  }
  if (!propertyId) {
    throw new Error('Property ID is required.');
  }

  const cleanPropertyId = String(propertyId).trim();
  const docRef = doc(db, 'users', userId, 'savedProperties', cleanPropertyId);

  await deleteDoc(docRef);

  return { success: true, propertyId: cleanPropertyId };
}

/**
 * Checks whether a specific property is saved in the user's savedProperties subcollection
 * 
 * @param {string} userId - Authenticated user UID
 * @param {string} propertyId - ID of property
 * @returns {Promise<boolean>}
 */
export async function checkIsPropertySaved(userId, propertyId) {
  if (!isFirebaseConfigured || !db || !userId || !propertyId) {
    return false;
  }

  try {
    const cleanPropertyId = String(propertyId).trim();
    const docRef = doc(db, 'users', userId, 'savedProperties', cleanPropertyId);
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (err) {
    console.warn('[savedPropertiesService] checkIsPropertySaved error:', err);
    return false;
  }
}

/**
 * Fetches all saved property records (references) for a given user
 * 
 * @param {string} userId - Authenticated user UID
 * @returns {Promise<Array<{propertyId: string, savedAt: string}>>}
 */
export async function getUserSavedProperties(userId) {
  if (!isFirebaseConfigured || !db || !userId) {
    return [];
  }

  try {
    const subColRef = collection(db, 'users', userId, 'savedProperties');
    const snapshot = await getDocs(subColRef);

    const savedList = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      savedList.push({
        propertyId: docSnap.id,
        savedAt: parseTimestampToIso(data.savedAt),
      });
    });

    return savedList;
  } catch (err) {
    console.error('[savedPropertiesService] getUserSavedProperties error:', err);
    throw err;
  }
}

/**
 * Sets up a real-time onSnapshot listener for the user's savedProperties subcollection
 * 
 * @param {string} userId - Authenticated user UID
 * @param {Function} onData - Callback receiving array of { propertyId: string, savedAt: string }
 * @param {Function} [onError] - Optional error handler
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeUserSavedProperties(userId, onData, onError) {
  if (!isFirebaseConfigured || !db || !userId) {
    if (typeof onData === 'function') onData([]);
    return () => {};
  }

  const subColRef = collection(db, 'users', userId, 'savedProperties');

  return onSnapshot(
    subColRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          propertyId: docSnap.id,
          savedAt: parseTimestampToIso(data.savedAt),
        });
      });

      if (typeof onData === 'function') {
        onData(items);
      }
    },
    (err) => {
      console.warn('[savedPropertiesService] subscribeUserSavedProperties snapshot error:', err);
      if (typeof onError === 'function') {
        onError(err);
      }
    }
  );
}

/**
 * Fetches user saved properties populated with full live property details from propertyService.
 * Safely filters out deleted, archived, or unpublished properties to avoid broken cards.
 * 
 * @param {string} userId - Authenticated user UID
 * @returns {Promise<Array<Object>>} Enriched property objects with savedAt metadata
 */
export async function fetchUserSavedPropertiesDetailed(userId) {
  if (!isFirebaseConfigured || !db || !userId) {
    return [];
  }

  const savedRefs = await getUserSavedProperties(userId);
  if (!savedRefs || savedRefs.length === 0) {
    return [];
  }

  // Fetch all property details concurrently using existing propertyService
  const propertyPromises = savedRefs.map(async (ref) => {
    try {
      const prop = await getPropertyById(ref.propertyId);
      if (!prop) {
        // Property was deleted or does not exist
        return null;
      }

      // Check publication status: if Firestore document has isPublished: false, exclude from public view
      if (prop.isPublished === false || prop.publicationStatus === 'draft' || prop.publicationStatus === 'archived') {
        return null;
      }

      return {
        ...prop,
        savedAt: ref.savedAt,
      };
    } catch (err) {
      console.warn(`[savedPropertiesService] Failed to load details for property ${ref.propertyId}:`, err);
      return null;
    }
  });

  const detailedList = await Promise.all(propertyPromises);

  // Filter out any null entries (deleted/unpublished) and sort newest saved first
  const validProperties = detailedList.filter(Boolean);
  validProperties.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));

  return validProperties;
}
