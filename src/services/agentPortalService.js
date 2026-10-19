/**
 * EstateVista Advisor Portal Firebase Service Layer
 *
 * FULL DYNAMIC CLOUD FIRESTORE & FIREBASE STORAGE INTEGRATION:
 * 1. Cloud Firestore is the authoritative source of truth for all advisor business records:
 *    - /users/{uid}: Advisor identity, biography, credentials, and settings.
 *    - /properties/{propertyId}: Property metadata, images, pricing, and publication workflow.
 *    - /inquiries/{inquiryId}: Customer inquiries and client leads routed to the listing advisor.
 * 2. Firebase Storage is the authoritative media store for high-res property photos and avatars.
 * 3. Multi-Session Isolation: All reads and writes strictly use `agentDb`, `agentAuth`, and
 *    `agentStorage` (AgentApp instance), preserving complete session isolation from Customer
 *    and Admin portals.
 * 4. Real-time updates: Provides `onSnapshot` listeners with clean unsubscribe handlers.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  agentDb,
  agentAuth,
  agentStorage,
  isFirebaseConfigured,
} from '../lib/firebase.js';

// ==========================================
// 1. DASHBOARD OVERVIEW & ANALYTICS
// ==========================================

/**
 * Fetch dynamic aggregate metrics for the signed-in advisor
 * @returns {Promise<Object>} Dynamic statistics object
 */
export async function getAgentDashboardStats() {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) {
    return getEmptyDashboardStats();
  }

  try {
    // 1. Fetch properties belonging to the signed-in advisor
    const propQuery = query(
      collection(agentDb, 'properties'),
      where('createdByUid', '==', currentUid)
    );
    const propSnapshot = await getDocs(propQuery);
    const properties = [];
    propSnapshot.forEach((docSnap) => {
      properties.push({ id: docSnap.id, ...docSnap.data() });
    });

    // 2. Fetch inquiries assigned to the signed-in advisor
    const inqQuery = query(
      collection(agentDb, 'inquiries'),
      where('advisorUid', '==', currentUid)
    );
    const inqSnapshot = await getDocs(inqQuery);
    const inquiries = [];
    inqSnapshot.forEach((docSnap) => {
      inquiries.push({ id: docSnap.id, ...docSnap.data() });
    });

    return calculateDashboardStats(properties, inquiries);
  } catch (err) {
    console.error('[AgentPortalService] Failed to fetch dashboard statistics:', err);
    return getEmptyDashboardStats();
  }
}

/**
 * Subscribe to real-time dashboard statistics updates
 * @param {Function} callback - (stats: Object) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribeAgentDashboardStats(callback, onError) {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) {
    callback(getEmptyDashboardStats());
    return () => {};
  }

  let properties = [];
  let inquiries = [];

  const propQuery = query(
    collection(agentDb, 'properties'),
    where('createdByUid', '==', currentUid)
  );
  const inqQuery = query(
    collection(agentDb, 'inquiries'),
    where('advisorUid', '==', currentUid)
  );

  const unsubProps = onSnapshot(
    propQuery,
    (snapshot) => {
      properties = [];
      snapshot.forEach((docSnap) => {
        properties.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(calculateDashboardStats(properties, inquiries));
    },
    (err) => {
      console.warn('[AgentPortalService] Property stats listener warning:', err);
      if (typeof onError === 'function') onError(err);
    }
  );

  const unsubInqs = onSnapshot(
    inqQuery,
    (snapshot) => {
      inquiries = [];
      snapshot.forEach((docSnap) => {
        inquiries.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(calculateDashboardStats(properties, inquiries));
    },
    (err) => {
      console.warn('[AgentPortalService] Inquiry stats listener warning:', err);
      if (typeof onError === 'function') onError(err);
    }
  );

  return () => {
    unsubProps();
    unsubInqs();
  };
}

function calculateDashboardStats(properties, inquiries) {
  const publishedCount = properties.filter(
    (p) => p.publicationStatus === 'published' || (p.isPublished === true && !p.publicationStatus)
  ).length;
  const draftCount = properties.filter((p) => p.publicationStatus === 'draft').length;
  const pendingCount = properties.filter((p) => p.publicationStatus === 'pending').length;
  const rejectedCount = properties.filter((p) => p.publicationStatus === 'rejected').length;
  const newInquiriesCount = inquiries.filter((i) => i.status === 'new' || i.isRead === false).length;

  const recentProperties = [...properties]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const recentInquiries = [...inquiries]
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
    .slice(0, 5);

  // Check for real property tracking data (view counts or impressions)
  const hasRealViews = properties.some(
    (p) => p.viewsCount !== undefined || p.viewCount !== undefined || p.views !== undefined
  );
  const totalViews = hasRealViews
    ? properties.reduce((acc, p) => acc + (Number(p.viewsCount || p.viewCount || p.views) || 0), 0)
    : null;

  // Dynamic monthly activity calculated from actual inquiries and listing additions
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyActivity = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = months[d.getMonth()];
    const year = d.getFullYear();
    const mInquiries = inquiries.filter((inq) => {
      const inqDate = new Date(inq.createdAt || inq.date || 0);
      return inqDate.getFullYear() === year && inqDate.getMonth() === d.getMonth();
    }).length;
    const mListings = properties.filter((p) => {
      const pDate = new Date(p.createdAt || 0);
      return pDate.getFullYear() === year && pDate.getMonth() === d.getMonth();
    }).length;

    monthlyActivity.push({
      month: mName,
      inquiries: mInquiries,
      listings: mListings,
    });
  }

  return {
    totalProperties: properties.length,
    publishedCount,
    draftCount,
    pendingCount,
    rejectedCount,
    totalInquiries: inquiries.length,
    newInquiriesCount,
    totalViews,
    hasRealViews,
    recentProperties,
    recentInquiries,
    monthlyActivity,
  };
}

function getEmptyDashboardStats() {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  return {
    totalProperties: 0,
    publishedCount: 0,
    draftCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    totalInquiries: 0,
    newInquiriesCount: 0,
    totalViews: null,
    hasRealViews: false,
    recentProperties: [],
    recentInquiries: [],
    monthlyActivity: months.map((m) => ({ month: m, inquiries: 0, listings: 0 })),
  };
}

// ==========================================
// 2. PROPERTIES CRUD OPERATIONS
// ==========================================

/**
 * Fetch all properties belonging to the authenticated advisor
 * @param {Object} options { search, status, listingType, sortBy }
 * @returns {Promise<Array>} List of property documents
 */
export async function getAgentProperties({ search = '', status = 'all', listingType = 'all', sortBy = 'newest' } = {}) {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) {
    return [];
  }

  try {
    const q = query(
      collection(agentDb, 'properties'),
      where('createdByUid', '==', currentUid)
    );
    const snapshot = await getDocs(q);
    let properties = [];
    snapshot.forEach((docSnap) => {
      properties.push({ id: docSnap.id, ...docSnap.data() });
    });

    // 1. Status Filter
    if (status && status !== 'all') {
      properties = properties.filter((p) => p.publicationStatus === status);
    }

    // 2. Listing Type Filter (Buy / Rent)
    if (listingType && listingType !== 'all') {
      properties = properties.filter((p) => (p.listingType || '').toLowerCase() === listingType.toLowerCase());
    }

    // 3. Search Filter
    if (search && search.trim()) {
      const qText = search.trim().toLowerCase();
      properties = properties.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(qText) ||
          (p.location || '').toLowerCase().includes(qText) ||
          (p.city || '').toLowerCase().includes(qText) ||
          (p.locality || '').toLowerCase().includes(qText)
      );
    }

    // 4. Sorting
    if (sortBy === 'newest') {
      properties.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'price-desc') {
      properties.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'price-asc') {
      properties.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'title') {
      properties.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return properties;
  } catch (err) {
    console.error('[AgentPortalService] Failed to load properties:', err);
    return [];
  }
}

/**
 * Real-time listener for advisor properties
 * @param {Function} callback - (properties: Array) => void
 * @param {Object} options
 * @returns {Function} Unsubscribe function
 */
export function subscribeAgentProperties(callback, { search = '', status = 'all', listingType = 'all', sortBy = 'newest' } = {}) {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(agentDb, 'properties'),
    where('createdByUid', '==', currentUid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      let properties = [];
      snapshot.forEach((docSnap) => {
        properties.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (status && status !== 'all') {
        properties = properties.filter((p) => p.publicationStatus === status);
      }
      if (listingType && listingType !== 'all') {
        properties = properties.filter((p) => (p.listingType || '').toLowerCase() === listingType.toLowerCase());
      }
      if (search && search.trim()) {
        const qText = search.trim().toLowerCase();
        properties = properties.filter(
          (p) =>
            (p.title || '').toLowerCase().includes(qText) ||
            (p.location || '').toLowerCase().includes(qText) ||
            (p.city || '').toLowerCase().includes(qText) ||
            (p.locality || '').toLowerCase().includes(qText)
        );
      }
      if (sortBy === 'newest') {
        properties.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else if (sortBy === 'price-desc') {
        properties.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      } else if (sortBy === 'price-asc') {
        properties.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      } else if (sortBy === 'title') {
        properties.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      }

      callback(properties);
    },
    (err) => {
      console.warn('[AgentPortalService] Properties listener warning:', err);
      callback([]);
    }
  );
}

/**
 * Fetch a single property listing by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getAgentPropertyById(id) {
  if (!isFirebaseConfigured || !agentDb || !id) return null;

  try {
    const docRef = doc(agentDb, 'properties', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    console.error('[AgentPortalService] Failed to fetch property by id:', err);
    return null;
  }
}

/**
 * Create a new property listing in Cloud Firestore
 * @param {Object} propertyData
 * @param {string} targetStatus ('draft' | 'pending' | 'published')
 * @returns {Promise<Object>} Created property with document ID
 */
export async function createAgentProperty(propertyData, targetStatus = 'draft') {
  if (!isFirebaseConfigured || !agentDb) {
    throw new Error('Firebase configuration missing.');
  }

  const currentUid = agentAuth?.currentUser?.uid;
  if (!currentUid) {
    throw new Error('You must be signed in with advisor credentials to create a property.');
  }

  // Non-admins can strictly only create as 'draft' or 'pending' per firestore.rules
  const publicationStatus = ['draft', 'pending'].includes(targetStatus) ? targetStatus : 'pending';

  const nowIso = new Date().toISOString();
  const author = agentAuth.currentUser;

  const rawImages = propertyData.imageUrls !== undefined ? propertyData.imageUrls : (propertyData.images || []);
  const normalizedImages = Array.isArray(rawImages)
    ? rawImages.filter((img) => typeof img === 'string' && img.trim())
    : [];

  const payload = {
    ...propertyData,
    imageUrls: normalizedImages,
    images: normalizedImages,
    featuredImage: propertyData.featuredImage || normalizedImages[0] || '',
    price: Number(propertyData.price) || 0,
    areaSqFt: Number(propertyData.areaSqFt) || 0,
    bedrooms: Number(propertyData.bedrooms) || 0,
    bathrooms: Number(propertyData.bathrooms) || 0,
    parkingSlots: Number(propertyData.parkingSlots) || 0,
    publicationStatus,
    isPublished: false, // strictly false for non-admin creation per firestore.rules
    rejectionReason: null,
    createdByUid: currentUid,
    agentId: currentUid,
    agentName: author.displayName || propertyData.agentName || 'Advisor',
    agentEmail: author.email || propertyData.agentEmail || '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const docRef = await addDoc(collection(agentDb, 'properties'), payload);
  return { id: docRef.id, ...payload };
}

/**
 * Update an existing property listing in Cloud Firestore
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>} Updated property
 */
export async function updateAgentProperty(id, updates) {
  if (!isFirebaseConfigured || !agentDb || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  const currentUid = agentAuth?.currentUser?.uid;
  if (!currentUid) {
    throw new Error('You must be signed in to edit property listings.');
  }

  const propRef = doc(agentDb, 'properties', id);
  const existingSnap = await getDoc(propRef);
  if (!existingSnap.exists()) {
    throw new Error('Property listing not found.');
  }

  const existingData = existingSnap.data();
  if (existingData.createdByUid !== currentUid) {
    throw new Error('Security Error: You are only permitted to update your own listings.');
  }

  const nowIso = new Date().toISOString();
  const safeUpdates = {
    ...updates,
    updatedAt: nowIso,
  };

  // Ownership immutability
  delete safeUpdates.createdByUid;
  delete safeUpdates.id;

  if (updates.imageUrls !== undefined || updates.images !== undefined) {
    const rawImages = updates.imageUrls !== undefined ? updates.imageUrls : updates.images;
    const normalizedImages = Array.isArray(rawImages)
      ? rawImages.filter((img) => typeof img === 'string' && img.trim())
      : [];
    safeUpdates.imageUrls = normalizedImages;
    safeUpdates.images = normalizedImages;
    safeUpdates.featuredImage = updates.featuredImage || normalizedImages[0] || '';
  }

  if (updates.price !== undefined) safeUpdates.price = Number(updates.price) || 0;
  if (updates.areaSqFt !== undefined) safeUpdates.areaSqFt = Number(updates.areaSqFt) || 0;
  if (updates.bedrooms !== undefined) safeUpdates.bedrooms = Number(updates.bedrooms) || 0;
  if (updates.bathrooms !== undefined) safeUpdates.bathrooms = Number(updates.bathrooms) || 0;
  if (updates.parkingSlots !== undefined) safeUpdates.parkingSlots = Number(updates.parkingSlots) || 0;

  // Non-admins cannot self-publish. Material updates or publication requests must stay or transition to 'pending' (or 'draft').
  if (updates.publicationStatus) {
    safeUpdates.publicationStatus = ['draft', 'pending'].includes(updates.publicationStatus)
      ? updates.publicationStatus
      : 'pending';
  } else if (existingData.publicationStatus === 'published') {
    // If an already published listing was edited by an advisor, reapply moderation
    safeUpdates.publicationStatus = 'pending';
  }
  safeUpdates.isPublished = false;

  await updateDoc(propRef, safeUpdates);
  return { id, ...existingData, ...safeUpdates };
}

/**
 * Delete a property listing from Cloud Firestore
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteAgentProperty(id) {
  if (!isFirebaseConfigured || !agentDb || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  const currentUid = agentAuth?.currentUser?.uid;
  if (!currentUid) {
    throw new Error('You must be signed in to delete listings.');
  }

  const propRef = doc(agentDb, 'properties', id);
  const snap = await getDoc(propRef);
  if (!snap.exists()) return true;

  if (snap.data().createdByUid !== currentUid) {
    throw new Error('Security Error: You are only permitted to delete your own listings.');
  }

  await deleteDoc(propRef);
  return true;
}

/**
 * Fast publication status transition (draft -> pending / move to draft)
 * Note: Non-admin agents can only submit for review or move to draft.
 * @param {string} id
 * @param {string} status ('pending' | 'draft')
 */
export async function updatePropertyPublicationStatus(id, status) {
  if (status === 'published') {
    throw new Error('Advisors cannot directly self-publish listings. Please submit for administrator review.');
  }
  return updateAgentProperty(id, {
    publicationStatus: status,
    isPublished: false,
    rejectionReason: status === 'rejected' ? 'Editorial compliance review required.' : null,
  });
}

// ==========================================
// 3. INQUIRIES MANAGEMENT
// ==========================================

/**
 * Fetch client inquiries directed to the authenticated advisor
 * @param {Object} options { search, status }
 * @returns {Promise<Array>} List of inquiry records
 */
export async function getAgentInquiries({ search = '', status = 'all' } = {}) {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) {
    return [];
  }

  try {
    const q = query(
      collection(agentDb, 'inquiries'),
      where('advisorUid', '==', currentUid)
    );
    const snap = await getDocs(q);
    let inquiries = [];

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const isRead = d.isRead !== undefined ? d.isRead : (d.status !== 'new');
      inquiries.push({
        id: docSnap.id,
        ...d,
        isRead,
        date: d.createdAt || d.date || new Date().toISOString(),
        clientName: d.clientName || d.name || 'Client',
        clientEmail: d.clientEmail || d.senderEmail || 'N/A',
        clientPhone: d.clientPhone || d.phone || '',
        status: d.status || 'new',
      });
    });

    if (status && status !== 'all') {
      if (status === 'unread') {
        inquiries = inquiries.filter((i) => i.isRead === false || i.status === 'new');
      } else if (status === 'read') {
        inquiries = inquiries.filter((i) => i.isRead === true && i.status !== 'new');
      } else {
        inquiries = inquiries.filter((i) => i.status === status);
      }
    }

    if (search && search.trim()) {
      const qText = search.trim().toLowerCase();
      inquiries = inquiries.filter(
        (i) =>
          (i.clientName || '').toLowerCase().includes(qText) ||
          (i.clientEmail || '').toLowerCase().includes(qText) ||
          (i.propertyTitle || '').toLowerCase().includes(qText) ||
          (i.message || '').toLowerCase().includes(qText)
      );
    }

    inquiries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return inquiries;
  } catch (err) {
    console.error('[AgentPortalService] Failed to load inquiries:', err);
    return [];
  }
}

/**
 * Real-time listener for client inquiries
 * @param {Function} callback - (inquiries: Array) => void
 * @param {Object} options
 * @returns {Function} Unsubscribe function
 */
export function subscribeAgentInquiries(callback, { search = '', status = 'all' } = {}) {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(agentDb, 'inquiries'),
    where('advisorUid', '==', currentUid)
  );

  return onSnapshot(
    q,
    (snap) => {
      let inquiries = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const isRead = d.isRead !== undefined ? d.isRead : (d.status !== 'new');
        inquiries.push({
          id: docSnap.id,
          ...d,
          isRead,
          date: d.createdAt || d.date || new Date().toISOString(),
          clientName: d.clientName || d.name || 'Client',
          clientEmail: d.clientEmail || d.senderEmail || 'N/A',
          clientPhone: d.clientPhone || d.phone || '',
          status: d.status || 'new',
        });
      });

      if (status && status !== 'all') {
        if (status === 'unread') {
          inquiries = inquiries.filter((i) => i.isRead === false || i.status === 'new');
        } else if (status === 'read') {
          inquiries = inquiries.filter((i) => i.isRead === true && i.status !== 'new');
        } else {
          inquiries = inquiries.filter((i) => i.status === status);
        }
      }
      if (search && search.trim()) {
        const qText = search.trim().toLowerCase();
        inquiries = inquiries.filter(
          (i) =>
            (i.clientName || '').toLowerCase().includes(qText) ||
            (i.clientEmail || '').toLowerCase().includes(qText) ||
            (i.propertyTitle || '').toLowerCase().includes(qText) ||
            (i.message || '').toLowerCase().includes(qText)
        );
      }

      inquiries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      callback(inquiries);
    },
    (err) => {
      console.warn('[AgentPortalService] Inquiries listener warning:', err);
      callback([]);
    }
  );
}

/**
 * Fetch single inquiry by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getInquiryById(id) {
  if (!isFirebaseConfigured || !agentDb || !id) return null;

  try {
    const docRef = doc(agentDb, 'inquiries', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const d = snap.data();
      return {
        id: snap.id,
        ...d,
        date: d.createdAt || d.date || new Date().toISOString(),
        clientName: d.clientName || d.name || 'Client',
        clientEmail: d.clientEmail || d.senderEmail || 'N/A',
        clientPhone: d.clientPhone || d.phone || '',
      };
    }
    return null;
  } catch (err) {
    console.error('[AgentPortalService] Failed to load inquiry:', err);
    return null;
  }
}

/**
 * Update client inquiry status (Preserves existing notes)
 * @param {string} id
 * @param {string} newStatus ('new' | 'contacted' | 'closed')
 * @returns {Promise<Object>}
 */
export async function updateInquiryStatus(id, newStatus) {
  if (!isFirebaseConfigured || !agentDb || !id) {
    throw new Error('Firebase configuration or inquiry ID missing.');
  }

  const docRef = doc(agentDb, 'inquiries', id);
  const nowIso = new Date().toISOString();
  const updatePayload = {
    status: newStatus,
    isRead: newStatus !== 'new',
    updatedAt: nowIso,
  };

  await updateDoc(docRef, updatePayload);
  const snap = await getDoc(docRef);
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    isRead: updatePayload.isRead,
    date: d.createdAt || d.date || nowIso,
    clientName: d.clientName || d.name || 'Client',
    clientEmail: d.clientEmail || d.senderEmail || 'N/A',
    clientPhone: d.clientPhone || d.phone || '',
  };
}

/**
 * Update client inquiry advisor notes specifically (Preserves status)
 * @param {string} id
 * @param {string} notes
 * @returns {Promise<Object>}
 */
export async function updateInquiryNotes(id, notes = '') {
  if (!isFirebaseConfigured || !agentDb || !id) {
    throw new Error('Firebase configuration or inquiry ID missing.');
  }

  const docRef = doc(agentDb, 'inquiries', id);
  const nowIso = new Date().toISOString();
  const updatePayload = {
    agentNotes: typeof notes === 'string' ? notes : '',
    agentNotesUpdatedAt: nowIso,
    updatedAt: nowIso,
  };

  await updateDoc(docRef, updatePayload);
  const snap = await getDoc(docRef);
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    date: d.createdAt || d.date || nowIso,
    clientName: d.clientName || d.name || 'Client',
    clientEmail: d.clientEmail || d.senderEmail || 'N/A',
    clientPhone: d.clientPhone || d.phone || '',
  };
}

/**
 * Update customer-visible note on an inquiry by the assigned advisor.
 * This is the update visible to the customer on their private My Inquiries portal.
 * Internal advisor notes and status are preserved unless optionalStatus is provided.
 *
 * @param {string} id Inquiry document ID
 * @param {string} customerVisibleNote Note intended for customer
 * @param {string} [optionalStatus=''] Optional status update ('contacted' | 'closed')
 * @returns {Promise<Object>}
 */
export async function updateCustomerVisibleNote(id, customerVisibleNote = '', optionalStatus = '') {
  if (!isFirebaseConfigured || !agentDb || !id) {
    throw new Error('Firebase configuration or inquiry ID missing.');
  }

  const docRef = doc(agentDb, 'inquiries', id);
  const nowIso = new Date().toISOString();
  const currentAdvisorName = agentAuth?.currentUser?.displayName || 'Designated Property Advisor';

  const updatePayload = {
    customerVisibleNote: (customerVisibleNote || '').trim(),
    customerVisibleNoteUpdatedAt: nowIso,
    customerVisibleNoteUpdatedByRole: 'advisor',
    customerVisibleNoteUpdatedByName: currentAdvisorName,
    updatedAt: nowIso,
  };

  if (optionalStatus && ['new', 'contacted', 'closed', 'resolved'].includes(optionalStatus)) {
    updatePayload.status = optionalStatus === 'resolved' ? 'closed' : optionalStatus;
    updatePayload.isRead = true;
  }

  await updateDoc(docRef, updatePayload);
  const snap = await getDoc(docRef);
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    date: d.createdAt || d.date || nowIso,
    clientName: d.clientName || d.name || 'Client',
    clientEmail: d.clientEmail || d.senderEmail || 'N/A',
    clientPhone: d.clientPhone || d.phone || '',
  };
}

/**
 * Mark client inquiry as read or unread
 * @param {string} id
 * @param {boolean} isRead
 * @returns {Promise<Object>}
 */
export async function markInquiryReadStatus(id, isRead = true) {
  if (!isFirebaseConfigured || !agentDb || !id) {
    throw new Error('Firebase configuration or inquiry ID missing.');
  }

  const docRef = doc(agentDb, 'inquiries', id);
  const nowIso = new Date().toISOString();
  const updatePayload = {
    isRead: Boolean(isRead),
    updatedAt: nowIso,
  };

  // If marked unread, optionally align status if closed/contacted
  if (!isRead) {
    updatePayload.status = 'new';
  }

  await updateDoc(docRef, updatePayload);
  const snap = await getDoc(docRef);
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    isRead: Boolean(isRead),
  };
}

// ==========================================
// 4. AGENT PROFILE MANAGEMENT
// ==========================================

/**
 * Fetch advisor profile directly from Cloud Firestore (/users/{uid})
 * @returns {Promise<Object|null>}
 */
export async function getAgentProfile() {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) return null;

  try {
    const userRef = doc(agentDb, 'users', currentUid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const d = snap.data();
      return {
        id: snap.id,
        uid: currentUid,
        name: d.name || agentAuth.currentUser.displayName || 'Advisor',
        email: d.email || agentAuth.currentUser.email || '',
        phone: d.phone || '',
        avatar: d.avatar || d.photoDataUrl || '',
        photoDataUrl: d.photoDataUrl || d.avatar || '',
        title: d.title || 'Senior Luxury Property Consultant',
        agency: d.agency || d.requestedAgency || 'EstateVista Advisory Services',
        experienceYears: Number(d.experienceYears) || 5,
        bio: d.bio || '',
        serviceLocations: Array.isArray(d.serviceLocations) && d.serviceLocations.length > 0
          ? d.serviceLocations
          : ['Mumbai', 'Bandra West'],
        specialties: Array.isArray(d.specialties) && d.specialties.length > 0
          ? d.specialties
          : ['Luxury Penthouses', 'Heritage Villas'],
        licenseNumber: d.licenseNumber || '',
        ...d,
      };
    }
    return null;
  } catch (err) {
    console.error('[AgentPortalService] Failed to load advisor profile:', err);
    return null;
  }
}

/**
 * Update advisor profile in Cloud Firestore (/users/{uid})
 * Preserves role and authorization fields immutability.
 * @param {Object} profileUpdates
 * @returns {Promise<Object>}
 */
export async function updateAgentProfile(profileUpdates) {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) {
    throw new Error('Authentication required to update advisor profile.');
  }

  const userRef = doc(agentDb, 'users', currentUid);
  const nowIso = new Date().toISOString();

  const safeUpdates = {
    name: profileUpdates.name?.trim() || '',
    phone: profileUpdates.phone?.trim() || '',
    avatar: profileUpdates.avatar || profileUpdates.photoDataUrl || '',
    photoDataUrl: profileUpdates.photoDataUrl || profileUpdates.avatar || '',
    title: profileUpdates.title?.trim() || '',
    agency: profileUpdates.agency?.trim() || '',
    experienceYears: Number(profileUpdates.experienceYears) || 0,
    bio: profileUpdates.bio?.trim() || '',
    serviceLocations: Array.isArray(profileUpdates.serviceLocations) ? profileUpdates.serviceLocations : [],
    specialties: Array.isArray(profileUpdates.specialties) ? profileUpdates.specialties : [],
    updatedAt: nowIso,
  };

  await setDoc(userRef, safeUpdates, { merge: true });
  const snap = await getDoc(userRef);
  return { id: snap.id, ...snap.data() };
}

/**
 * Update advisor profile photo directly in Cloud Firestore (/users/{uid})
 * Stores the optimized base64 Data URL or clears it when removed,
 * completely bypassing Firebase Storage.
 * 
 * @param {string} photoDataUrl Compressed base64 data URL or empty string to remove
 * @returns {Promise<Object>} Updated profile document
 */
export async function updateAgentProfilePhoto(photoDataUrl = '') {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) {
    throw new Error('Authentication required to update advisor profile photo.');
  }

  const sanitized = typeof photoDataUrl === 'string' ? photoDataUrl.trim() : '';

  // Max payload size check: 150 KB max
  if (sanitized && sanitized.length > 150 * 1024) {
    throw new Error('Profile photo payload exceeds the 150 KB Firestore document safety limit.');
  }

  const userRef = doc(agentDb, 'users', currentUid);
  const nowIso = new Date().toISOString();

  const photoPayload = {
    avatar: sanitized,
    photoDataUrl: sanitized,
    photoUpdatedAt: nowIso,
    updatedAt: nowIso,
  };

  await setDoc(userRef, photoPayload, { merge: true });
  const snap = await getDoc(userRef);
  return { id: snap.id, ...snap.data() };
}

// ==========================================
// 5. AGENT SETTINGS MANAGEMENT
// ==========================================

export async function getAgentSettings() {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) {
    return getDefaultSettings();
  }

  try {
    const userRef = doc(agentDb, 'users', currentUid);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().settings) {
      return { ...getDefaultSettings(), ...snap.data().settings };
    }
  } catch (err) {
    console.warn('[AgentPortalService] Could not read settings from Firestore:', err);
  }
  return getDefaultSettings();
}

export async function updateAgentSettings(newSettings) {
  const currentUid = agentAuth?.currentUser?.uid;
  if (!isFirebaseConfigured || !agentDb || !currentUid) {
    throw new Error('Authentication required to save settings.');
  }

  const userRef = doc(agentDb, 'users', currentUid);
  await setDoc(
    userRef,
    {
      settings: newSettings,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return newSettings;
}

function getDefaultSettings() {
  return {
    emailNotifications: true,
    publicProfileVisible: true,
    showPhonePublicly: true,
    currencyDisplay: 'INR',
    areaUnit: 'sqFt',
  };
}

// ==========================================
// 6. FIREBASE STORAGE MEDIA UPLOADER
// ==========================================

/**
 * Upload an image file to Firebase Storage under the advisor's directory
 * @param {File|Blob} file
 * @param {string} [folder='properties']
 * @returns {Promise<string>} Public download URL
 */
export async function uploadAgentMedia(file, folder = 'properties') {
  if (!isFirebaseConfigured || !agentStorage) {
    throw new Error(
      'Firebase Cloud Storage is not configured or not yet enabled. Open your Firebase Console (Build > Storage > Get Started) to activate your storage bucket.'
    );
  }

  const currentUid = agentAuth?.currentUser?.uid;
  if (!currentUid) {
    throw new Error('Authentication required to upload media.');
  }

  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Invalid file type: Only photographic images (JPEG, PNG, WebP) are accepted.');
  }

  const maxSize = folder === 'avatars' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File exceeds maximum allowed size of ${folder === 'avatars' ? '5MB' : '10MB'}.`);
  }

  const timestamp = Date.now();
  const safeName = (file.name || 'upload.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${currentUid}/${timestamp}_${safeName}`;
  const storageRef = ref(agentStorage, path);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.error('[AgentPortalService] Storage upload failed:', err);
    if (err?.code === 'storage/unauthorized') {
      throw new Error('Storage Access Denied: Please verify your Firebase Storage security rules.');
    }
    if (err?.code === 'storage/bucket-not-found' || err?.message?.includes('bucket')) {
      throw new Error('Firebase Storage bucket not found. Ensure Cloud Storage is activated in Firebase Console.');
    }
    throw new Error(err.message || 'Failed to upload photo to Firebase Cloud Storage.');
  }
}

/**
 * Reset helper for test suites (no-op in production Cloud Firestore mode)
 */
export async function resetDemoPortalData() {
  return Promise.resolve(true);
}
