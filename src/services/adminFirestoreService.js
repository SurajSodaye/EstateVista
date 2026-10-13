/**
 * EstateVista Executive Admin Cloud Firestore Service Layer
 * 
 * FULL DYNAMIC CLOUD FIRESTORE & FIREBASE STORAGE INTEGRATION:
 * 1. Authoritative Source of Truth:
 *    - /users/{userId}: System user records, role assignments ('customer' | 'agent' | 'admin'), and profiles.
 *    - /advisorApplications/{userId}: Advisor accreditation applications with review history.
 *    - /properties/{propertyId}: Luxury properties portfolio, moderation states, and media.
 *    - /inquiries/{inquiryId}: Customer inquiries and client leads routed to listing advisors.
 *    - /auditLogs/{logId}: Chronological governance trail of administrative security actions.
 * 2. Strict Session Isolation:
 *    - Uses dedicated `adminDb` and `adminAuth` (from 'AdminApp'), strictly isolated from
 *      the customer and advisor app instances.
 * 3. Security Rules Enforcement:
 *    - Operations carry admin authentication credentials satisfying `isAdmin()` in firestore.rules.
 * 4. Real-time Synchronization:
 *    - Provides `onSnapshot` listeners with cleanup handlers for live dashboard updates.
 */

import {
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  limit,
  doc,
  writeBatch,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { adminDb as db, adminAuth as auth, isFirebaseConfigured } from '../lib/firebase.js';

/**
 * Standard error formatter for Firestore operations
 * @param {Error} error 
 * @returns {{ code: string, message: string, type: string }}
 */
function parseFirestoreError(error) {
  if (!error) return { code: 'unknown', message: 'An unknown error occurred.', type: 'unknown' };

  const code = error.code || '';
  if (code.includes('permission-denied')) {
    return {
      code: 'permission-denied',
      message: 'Cloud Firestore rejected this operation: Administrative clearance is required. Ensure your user profile at /users/{uid} has role: "admin" and firestore.rules is published.',
      type: 'permission_denied',
    };
  }
  if (code.includes('unavailable')) {
    return {
      code: 'unavailable',
      message: 'Cloud Firestore backend is currently unreachable. Check your internet connection and Firebase project status.',
      type: 'network_error',
    };
  }
  if (code.includes('unauthenticated')) {
    return {
      code: 'unauthenticated',
      message: 'Active Firebase Authentication session is missing. Please sign in at /admin/login.',
      type: 'auth_error',
    };
  }
  return {
    code: code || 'error',
    message: error.message || 'Failed to complete Cloud Firestore operation.',
    type: 'generic_error',
  };
}

// ========================================================
// 1. EXECUTIVE DASHBOARD TELEMETRY & STATS
// ========================================================

/**
 * Fetch dynamic aggregate metrics from Cloud Firestore for the Admin Dashboard
 * @returns {Promise<Object>} Structured telemetry data
 */
export async function getFirestoreAdminDashboardStats() {
  if (!isFirebaseConfigured || !db) {
    return {
      isConfigured: false,
      overallStatus: 'not_configured',
      error: {
        code: 'not_configured',
        message: 'Firebase credentials are not configured in .env.local.',
        type: 'config_error',
      },
      users: { status: 'not_configured', total: 0, customers: 0, advisors: 0, admins: 0 },
      applications: { status: 'not_configured', total: 0, pending: 0, approved: 0, rejected: 0 },
      properties: { status: 'not_configured', total: 0, published: 0, pending: 0, draft: 0, rejected: 0 },
      inquiries: { status: 'not_configured', total: 0, new: 0, contacted: 0, closed: 0 },
    };
  }

  if (!auth?.currentUser) {
    return {
      isConfigured: true,
      overallStatus: 'unauthenticated',
      error: {
        code: 'unauthenticated',
        message: 'No authenticated Firebase user found. Sign in at /admin/login.',
        type: 'auth_error',
      },
      users: { status: 'error', total: 0, customers: 0, advisors: 0, admins: 0 },
      applications: { status: 'error', total: 0, pending: 0, approved: 0, rejected: 0 },
      properties: { status: 'error', total: 0, published: 0, pending: 0, draft: 0, rejected: 0 },
      inquiries: { status: 'error', total: 0, new: 0, contacted: 0, closed: 0 },
    };
  }

  const result = {
    isConfigured: true,
    overallStatus: 'connected',
    dataSource: 'Cloud Firestore (Live)',
    timestamp: new Date().toISOString(),
    error: null,
    users: {
      status: 'loading',
      total: 0,
      customers: 0,
      advisors: 0,
      admins: 0,
      error: null,
    },
    applications: {
      status: 'loading',
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      error: null,
    },
    properties: {
      status: 'loading',
      total: 0,
      published: 0,
      pending: 0,
      draft: 0,
      rejected: 0,
      error: null,
    },
    inquiries: {
      status: 'loading',
      total: 0,
      new: 0,
      contacted: 0,
      closed: 0,
      error: null,
    },
  };

  // 1. Users Aggregation
  try {
    const usersColl = collection(db, 'users');
    const totalSnap = await getCountFromServer(usersColl);
    result.users.total = totalSnap.data().count;

    const custQuery = query(usersColl, where('role', '==', 'customer'));
    const custSnap = await getCountFromServer(custQuery);
    result.users.customers = custSnap.data().count;

    const agentQuery = query(usersColl, where('role', '==', 'agent'));
    const agentSnap = await getCountFromServer(agentQuery);
    result.users.advisors = agentSnap.data().count;

    const adminQuery = query(usersColl, where('role', '==', 'admin'));
    const adminSnap = await getCountFromServer(adminQuery);
    result.users.admins = adminSnap.data().count;

    result.users.status = 'ready';
  } catch (err) {
    const parsedErr = parseFirestoreError(err);
    result.users.status = parsedErr.type;
    result.users.error = parsedErr;
    result.overallStatus = parsedErr.type;
    result.error = parsedErr;
    console.warn('[AdminFirestoreService] Could not aggregate users collection:', err);
  }

  // 2. Advisor Applications Aggregation
  try {
    const appsColl = collection(db, 'advisorApplications');
    const totalAppsSnap = await getCountFromServer(appsColl);
    result.applications.total = totalAppsSnap.data().count;

    const pendingQuery = query(appsColl, where('status', '==', 'pending'));
    const pendingSnap = await getCountFromServer(pendingQuery);
    result.applications.pending = pendingSnap.data().count;

    const approvedQuery = query(appsColl, where('status', '==', 'approved'));
    const approvedSnap = await getCountFromServer(approvedQuery);
    result.applications.approved = approvedSnap.data().count;

    const rejectedQuery = query(appsColl, where('status', '==', 'rejected'));
    const rejectedSnap = await getCountFromServer(rejectedQuery);
    result.applications.rejected = rejectedSnap.data().count;

    result.applications.status = 'ready';
  } catch (err) {
    const parsedErr = parseFirestoreError(err);
    result.applications.status = parsedErr.type;
    result.applications.error = parsedErr;
    if (!result.error) {
      result.overallStatus = parsedErr.type;
      result.error = parsedErr;
    }
    console.warn('[AdminFirestoreService] Could not aggregate advisorApplications collection:', err);
  }

  // 3. Properties Aggregation
  try {
    const propsColl = collection(db, 'properties');
    const totalPropsSnap = await getCountFromServer(propsColl);
    result.properties.total = totalPropsSnap.data().count;

    const publishedQuery = query(propsColl, where('publicationStatus', '==', 'published'));
    const publishedSnap = await getCountFromServer(publishedQuery);
    result.properties.published = publishedSnap.data().count;

    const pendingReviewQuery = query(propsColl, where('publicationStatus', '==', 'pending'));
    const pendingReviewSnap = await getCountFromServer(pendingReviewQuery);
    result.properties.pending = pendingReviewSnap.data().count;

    const draftQuery = query(propsColl, where('publicationStatus', '==', 'draft'));
    const draftSnap = await getCountFromServer(draftQuery);
    result.properties.draft = draftSnap.data().count;

    const rejectedPropsQuery = query(propsColl, where('publicationStatus', '==', 'rejected'));
    const rejectedPropsSnap = await getCountFromServer(rejectedPropsQuery);
    result.properties.rejected = rejectedPropsSnap.data().count;

    result.properties.status = 'ready';
  } catch (err) {
    const parsedErr = parseFirestoreError(err);
    result.properties.status = parsedErr.type;
    result.properties.error = parsedErr;
    if (!result.error) {
      result.overallStatus = parsedErr.type;
      result.error = parsedErr;
    }
    console.warn('[AdminFirestoreService] Could not aggregate properties collection:', err);
  }

  // 4. Inquiries Aggregation
  try {
    const inqColl = collection(db, 'inquiries');
    const totalInqSnap = await getCountFromServer(inqColl);
    result.inquiries.total = totalInqSnap.data().count;

    const newInqQuery = query(inqColl, where('status', '==', 'new'));
    const newInqSnap = await getCountFromServer(newInqQuery);
    result.inquiries.new = newInqSnap.data().count;

    const contactedInqQuery = query(inqColl, where('status', '==', 'contacted'));
    const contactedInqSnap = await getCountFromServer(contactedInqQuery);
    result.inquiries.contacted = contactedInqSnap.data().count;

    const closedInqQuery = query(inqColl, where('status', '==', 'closed'));
    const closedInqSnap = await getCountFromServer(closedInqQuery);
    result.inquiries.closed = closedInqSnap.data().count;

    result.inquiries.status = 'ready';
  } catch (err) {
    const parsedErr = parseFirestoreError(err);
    result.inquiries.status = parsedErr.type;
    result.inquiries.error = parsedErr;
    if (!result.error) {
      result.overallStatus = parsedErr.type;
      result.error = parsedErr;
    }
    console.warn('[AdminFirestoreService] Could not aggregate inquiries collection:', err);
  }

  return result;
}

/**
 * Fetch pending advisor applications directly from Cloud Firestore
 * @param {number} maxItems 
 * @returns {Promise<{ status: string, applications: Array, error: Object|null }>}
 */
export async function getFirestorePendingAdvisorApplications(maxItems = 3) {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    return { status: 'not_configured', applications: [], error: null };
  }

  try {
    const appsColl = collection(db, 'advisorApplications');
    const q = query(
      appsColl,
      where('status', '==', 'pending'),
      limit(maxItems)
    );

    const snapshot = await getDocs(q);
    const applications = [];
    snapshot.forEach((docSnap) => {
      applications.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

    return {
      status: applications.length > 0 ? 'ready' : 'empty',
      applications,
      error: null,
    };
  } catch (err) {
    const parsedErr = parseFirestoreError(err);
    console.warn('[AdminFirestoreService] Could not fetch pending applications:', err);
    return {
      status: parsedErr.type,
      applications: [],
      error: parsedErr,
    };
  }
}

/**
 * Fetch recent properties submitted for moderation
 * @param {number} maxItems 
 * @returns {Promise<{ status: string, properties: Array, error: Object|null }>}
 */
export async function getFirestoreRecentProperties(maxItems = 3) {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    return { status: 'not_configured', properties: [], error: null };
  }

  try {
    const propsColl = collection(db, 'properties');
    const q = query(propsColl, limit(maxItems * 3));
    const snapshot = await getDocs(q);
    const properties = [];
    snapshot.forEach((docSnap) => {
      properties.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

    properties.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const slice = properties.slice(0, maxItems);

    return {
      status: slice.length > 0 ? 'ready' : 'empty',
      properties: slice,
      error: null,
    };
  } catch (err) {
    const parsedErr = parseFirestoreError(err);
    console.warn('[AdminFirestoreService] Could not fetch recent properties:', err);
    return {
      status: parsedErr.type,
      properties: [],
      error: parsedErr,
    };
  }
}

/**
 * Fetch recent inquiries
 * @param {number} maxItems 
 * @returns {Promise<{ status: string, inquiries: Array, error: Object|null }>}
 */
export async function getFirestoreRecentInquiries(maxItems = 3) {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    return { status: 'not_configured', inquiries: [], error: null };
  }

  try {
    const inqColl = collection(db, 'inquiries');
    const q = query(inqColl, limit(maxItems * 3));
    const snapshot = await getDocs(q);
    const inquiries = [];
    snapshot.forEach((docSnap) => {
      inquiries.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

    inquiries.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
    const slice = inquiries.slice(0, maxItems);

    return {
      status: slice.length > 0 ? 'ready' : 'empty',
      inquiries: slice,
      error: null,
    };
  } catch (err) {
    const parsedErr = parseFirestoreError(err);
    console.warn('[AdminFirestoreService] Could not fetch recent inquiries:', err);
    return {
      status: parsedErr.type,
      inquiries: [],
      error: parsedErr,
    };
  }
}

// ========================================================
// 2. ADVISOR ACCREDITATION APPLICATIONS
// ========================================================

/**
 * Fetch all advisor accreditation applications from Cloud Firestore
 * @param {string} [statusFilter='all']
 * @returns {Promise<Object>}
 */
export async function getAllFirestoreAdvisorApplications(statusFilter = 'all') {
  if (!isFirebaseConfigured || !db) {
    return {
      status: 'not_configured',
      applications: [],
      allApplications: [],
      counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
      error: { code: 'not_configured', message: 'Firebase configuration is missing in .env.local.', type: 'config_error' },
    };
  }

  if (!auth?.currentUser) {
    return {
      status: 'auth_error',
      applications: [],
      allApplications: [],
      counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
      error: { code: 'unauthenticated', message: 'Active Firebase Authentication session is missing.', type: 'auth_error' },
    };
  }

  try {
    const appsColl = collection(db, 'advisorApplications');
    const snapshot = await getDocs(appsColl);

    const allApps = [];
    const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const status = data.status || 'pending';

      counts.all += 1;
      if (status === 'pending') counts.pending += 1;
      else if (status === 'approved') counts.approved += 1;
      else if (status === 'rejected') counts.rejected += 1;

      allApps.push({
        id: docSnap.id,
        uid: data.uid || docSnap.id,
        name: data.applicantName || data.name || 'Advisor Applicant',
        applicantName: data.applicantName || data.name || 'Advisor Applicant',
        email: data.applicantEmail || data.email || 'N/A',
        applicantEmail: data.applicantEmail || data.email || 'N/A',
        phone: data.phone || '',
        agency: data.agency || 'Independent Advisor',
        licenseNumber: data.licenseNumber || '',
        experienceYears: typeof data.experienceYears === 'number' ? data.experienceYears : 0,
        specialties: Array.isArray(data.specialties) ? data.specialties : [],
        serviceLocations: Array.isArray(data.serviceLocations) ? data.serviceLocations : [],
        bio: data.bio || '',
        status,
        submittedAt: data.submittedAt || null,
        updatedAt: data.updatedAt || null,
        reviewedAt: data.reviewedAt || null,
        reviewedBy: data.reviewedBy || null,
        reviewNotes: data.reviewNotes || data.notes || '',
        notes: data.reviewNotes || data.notes || '',
      });
    });

    allApps.sort((a, b) => {
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return timeB - timeA;
    });

    const filtered = statusFilter === 'all'
      ? allApps
      : allApps.filter((app) => app.status === statusFilter);

    return {
      status: allApps.length > 0 ? 'ready' : 'empty',
      applications: filtered,
      allApplications: allApps,
      counts,
      error: null,
    };
  } catch (err) {
    const parsedErr = parseFirestoreError(err);
    console.warn('[AdminFirestoreService] Could not read advisor applications from Cloud Firestore:', err);
    return {
      status: parsedErr.type,
      applications: [],
      allApplications: [],
      counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
      error: parsedErr,
    };
  }
}

/**
 * Approve, reject, or return an advisor application to pending in Cloud Firestore.
 * Performs an atomic batch update on both 'advisorApplications/{uid}' and 'users/{uid}'.
 * @param {string} uid
 * @param {'approved' | 'rejected' | 'pending'} newStatus
 * @param {string} [reviewNotes='']
 * @param {string} [adminEmail='']
 * @returns {Promise<{ success: boolean, status: string, error: Object|null }>}
 */
export async function updateFirestoreAdvisorApplicationStatus(uid, newStatus, reviewNotes = '', adminEmail = '') {
  if (!isFirebaseConfigured || !db) {
    return { success: false, status: newStatus, error: { code: 'not_configured', message: 'Firebase is not configured.', type: 'config_error' } };
  }

  if (!auth?.currentUser) {
    return { success: false, status: newStatus, error: { code: 'unauthenticated', message: 'Active session is missing.', type: 'auth_error' } };
  }

  if (!['approved', 'rejected', 'pending'].includes(newStatus)) {
    return { success: false, status: newStatus, error: { code: 'invalid-argument', message: `Invalid status: ${newStatus}.`, type: 'validation_error' } };
  }

  if (!uid) {
    return { success: false, status: newStatus, error: { code: 'invalid-argument', message: 'Application document UID is required.', type: 'validation_error' } };
  }

  try {
    const batch = writeBatch(db);
    const nowIso = new Date().toISOString();
    const reviewer = adminEmail || auth.currentUser?.email || 'Administrator';
    const notesTrimmed = (reviewNotes || '').trim();

    // 1. Update advisorApplications/{uid}
    const appDocRef = doc(db, 'advisorApplications', uid);
    batch.set(
      appDocRef,
      {
        status: newStatus,
        reviewedAt: nowIso,
        reviewedBy: reviewer,
        reviewNotes: notesTrimmed,
        notes: notesTrimmed,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    // 2. Synchronize user profile in users/{uid}
    const userDocRef = doc(db, 'users', uid);
    const userUpdatePayload = {
      advisorStatus: newStatus,
      updatedAt: nowIso,
    };

    if (newStatus === 'approved') {
      userUpdatePayload.role = 'agent';
    } else {
      userUpdatePayload.role = 'customer';
    }

    batch.set(userDocRef, userUpdatePayload, { merge: true });

    // Commit both updates atomically
    await batch.commit();

    // Record governance audit log
    await logFirestoreAdminAction({
      action: `ADVISOR_APPLICATION_${newStatus.toUpperCase()}`,
      target: `Application UID: ${uid}`,
      details: `Status set to ${newStatus}. Notes: ${notesTrimmed || 'None'}`,
      actorEmail: reviewer,
    });

    return {
      success: true,
      status: newStatus,
      error: null,
    };
  } catch (err) {
    const parsedErr = parseFirestoreError(err);
    console.error('[AdminFirestoreService] Failed to update advisor application in Cloud Firestore:', err);
    return {
      success: false,
      status: newStatus,
      error: parsedErr,
    };
  }
}

// ========================================================
// 3. PROPERTY PORTFOLIO & MODERATION CONTROL
// ========================================================

/**
 * Fetch all properties from Cloud Firestore for Administrative Moderation
 * @param {Object} options { search, status, listingType, sortBy }
 * @returns {Promise<Array>}
 */
export async function getFirestoreAdminProperties({ search = '', status = 'all', listingType = 'all', sortBy = 'newest' } = {}) {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    return [];
  }

  try {
    const propsColl = collection(db, 'properties');
    const snapshot = await getDocs(propsColl);
    let properties = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const pubStatus = data.publicationStatus || (data.isPublished ? 'published' : 'draft');
      properties.push({
        id: docSnap.id,
        ...data,
        publicationStatus: pubStatus,
        moderationStatus: pubStatus, // Backwards compatible with existing table
        title: data.title || 'Untitled Property',
        price: Number(data.price) || 0,
        listingType: data.listingType || 'Buy',
        propertyType: data.propertyType || 'Apartment',
        location: data.location || data.locality || data.city || 'India',
        city: data.city || '',
        locality: data.locality || '',
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        areaSqFt: data.areaSqFt || 0,
        isFeatured: Boolean(data.isFeatured),
        isPublished: Boolean(data.isPublished),
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
        agentName: data.agentName || 'Advisor',
        agentEmail: data.agentEmail || '',
        createdByUid: data.createdByUid || '',
        createdAt: data.createdAt || data.date || new Date().toISOString(),
      });
    });

    // 1. Status Filter
    if (status && status !== 'all') {
      const target = status === 'pending_review' ? 'pending' : status;
      properties = properties.filter((p) => p.publicationStatus === target);
    }

    // 2. Listing Type Filter
    if (listingType && listingType !== 'all') {
      properties = properties.filter((p) => (p.listingType || '').toLowerCase() === listingType.toLowerCase());
    }

    // 3. Search Filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      properties = properties.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.agentName.toLowerCase().includes(q)
      );
    }

    // 4. Sorting
    if (sortBy === 'newest') {
      properties.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'price-desc') {
      properties.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'price-asc') {
      properties.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'title') {
      properties.sort((a, b) => a.title.localeCompare(b.title));
    }

    return properties;
  } catch (err) {
    console.error('[AdminFirestoreService] Failed to load properties for admin:', err);
    return [];
  }
}

/**
 * Subscribe to live properties collection in Cloud Firestore
 * @param {Function} callback
 * @param {Object} options
 * @returns {Function} Unsubscribe
 */
export function subscribeFirestoreAdminProperties(callback, { search = '', status = 'all', listingType = 'all', sortBy = 'newest' } = {}) {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    callback([]);
    return () => {};
  }

  const propsColl = collection(db, 'properties');

  return onSnapshot(
    propsColl,
    (snapshot) => {
      let properties = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const pubStatus = data.publicationStatus || (data.isPublished ? 'published' : 'draft');
        properties.push({
          id: docSnap.id,
          ...data,
          publicationStatus: pubStatus,
          moderationStatus: pubStatus,
          title: data.title || 'Untitled Property',
          price: Number(data.price) || 0,
          listingType: data.listingType || 'Buy',
          propertyType: data.propertyType || 'Apartment',
          location: data.location || data.locality || data.city || 'India',
          city: data.city || '',
          locality: data.locality || '',
          bedrooms: data.bedrooms || 0,
          bathrooms: data.bathrooms || 0,
          areaSqFt: data.areaSqFt || 0,
          isFeatured: Boolean(data.isFeatured),
          isPublished: Boolean(data.isPublished),
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
          agentName: data.agentName || 'Advisor',
          agentEmail: data.agentEmail || '',
          createdByUid: data.createdByUid || '',
          createdAt: data.createdAt || data.date || new Date().toISOString(),
        });
      });

      if (status && status !== 'all') {
        const target = status === 'pending_review' ? 'pending' : status;
        properties = properties.filter((p) => p.publicationStatus === target);
      }

      if (listingType && listingType !== 'all') {
        properties = properties.filter((p) => (p.listingType || '').toLowerCase() === listingType.toLowerCase());
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        properties = properties.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            p.agentName.toLowerCase().includes(q)
        );
      }

      if (sortBy === 'newest') {
        properties.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else if (sortBy === 'price-desc') {
        properties.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'price-asc') {
        properties.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'title') {
        properties.sort((a, b) => a.title.localeCompare(b.title));
      }

      callback(properties);
    },
    (err) => {
      console.warn('[AdminFirestoreService] Properties listener warning:', err);
      callback([]);
    }
  );
}

/**
 * Update property publication and moderation status in Cloud Firestore
 * @param {string} id Property document ID
 * @param {string} newStatus ('published' | 'pending' | 'draft' | 'rejected')
 * @param {string} [notes=''] Editorial reason or notes
 * @param {string} [adminEmail=''] Reviewer
 * @returns {Promise<boolean>}
 */
export async function updateFirestorePropertyModeration(id, newStatus, notes = '', adminEmail = '') {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  const targetStatus = newStatus === 'pending_review' ? 'pending' : newStatus;
  const isPublished = targetStatus === 'published';
  const reviewer = adminEmail || auth?.currentUser?.email || 'Administrator';
  const nowIso = new Date().toISOString();

  const updatePayload = {
    publicationStatus: targetStatus,
    isPublished,
    moderationStatus: targetStatus,
    updatedAt: nowIso,
    moderatedAt: nowIso,
    moderatedBy: reviewer,
    rejectionReason: targetStatus === 'rejected' ? (notes.trim() || 'Editorial compliance revision required.') : null,
  };

  const propRef = doc(db, 'properties', id);
  await updateDoc(propRef, updatePayload);

  await logFirestoreAdminAction({
    action: `PROPERTY_MODERATION_${targetStatus.toUpperCase()}`,
    target: `Property ID: ${id}`,
    details: `Publication status set to ${targetStatus}. Notes: ${notes.trim() || 'None'}`,
    actorEmail: reviewer,
  });

  return true;
}

/**
 * Toggle featured listing placement in Cloud Firestore
 * @param {string} id 
 * @param {boolean} currentFeatured 
 * @returns {Promise<boolean>}
 */
export async function toggleFirestorePropertyFeatured(id, currentFeatured) {
  if (!isFirebaseConfigured || !db || !id) return false;

  const propRef = doc(db, 'properties', id);
  const nextVal = !currentFeatured;
  await updateDoc(propRef, {
    isFeatured: nextVal,
    updatedAt: new Date().toISOString(),
  });

  await logFirestoreAdminAction({
    action: 'PROPERTY_FEATURED_TOGGLE',
    target: `Property ID: ${id}`,
    details: `Featured placement set to ${nextVal}`,
    actorEmail: auth?.currentUser?.email || 'Administrator',
  });

  return true;
}

/**
 * Permanently delete a property from Cloud Firestore
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export async function deleteFirestoreProperty(id) {
  if (!isFirebaseConfigured || !db || !id) return false;

  const propRef = doc(db, 'properties', id);
  await deleteDoc(propRef);

  await logFirestoreAdminAction({
    action: 'PROPERTY_DELETED',
    target: `Property ID: ${id}`,
    details: 'Permanently removed listing from Cloud Firestore.',
    actorEmail: auth?.currentUser?.email || 'Administrator',
  });

  return true;
}

// ========================================================
// 4. USER DIRECTORY & ROLE GOVERNANCE
// ========================================================

/**
 * Fetch all registered users from Cloud Firestore
 * @param {Object} options { search, role, sortBy }
 * @returns {Promise<Array>}
 */
export async function getFirestoreAdminUsers({ search = '', role = 'all', sortBy = 'newest' } = {}) {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    return [];
  }

  try {
    const usersColl = collection(db, 'users');
    const snapshot = await getDocs(usersColl);
    let users = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        id: docSnap.id,
        uid: data.uid || docSnap.id,
        name: data.name || data.displayName || 'EstateVista Member',
        email: data.email || 'N/A',
        phone: data.phone || '',
        role: data.role || 'customer',
        advisorStatus: data.advisorStatus || 'none',
        agency: data.agency || '',
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      });
    });

    if (role && role !== 'all') {
      users = users.filter((u) => u.role === role);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.uid.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
      );
    }

    if (sortBy === 'newest') {
      users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'name') {
      users.sort((a, b) => a.name.localeCompare(b.name));
    }

    return users;
  } catch (err) {
    console.error('[AdminFirestoreService] Failed to load users for admin:', err);
    return [];
  }
}

/**
 * Update a user account's role in Cloud Firestore
 * @param {string} uid User UID
 * @param {'customer' | 'agent' | 'admin'} targetRole 
 * @param {string} [adminEmail='']
 * @returns {Promise<boolean>}
 */
export async function updateFirestoreUserRole(uid, targetRole, adminEmail = '') {
  if (!isFirebaseConfigured || !db || !uid) {
    throw new Error('Firebase configuration or user UID missing.');
  }

  if (!['customer', 'agent', 'admin'].includes(targetRole)) {
    throw new Error(`Invalid role specification: ${targetRole}`);
  }

  const userDocRef = doc(db, 'users', uid);
  const updatePayload = {
    role: targetRole,
    updatedAt: new Date().toISOString(),
  };

  if (targetRole === 'agent') {
    updatePayload.advisorStatus = 'approved';
  }

  await updateDoc(userDocRef, updatePayload);

  await logFirestoreAdminAction({
    action: `USER_ROLE_UPDATED`,
    target: `User UID: ${uid}`,
    details: `Role updated to ${targetRole.toUpperCase()}`,
    actorEmail: adminEmail || auth?.currentUser?.email || 'Administrator',
  });

  return true;
}

// ========================================================
// 5. CLIENT INQUIRIES & CONCIERGE LEADS
// ========================================================

/**
 * Fetch all client inquiries from Cloud Firestore
 * @param {Object} options { search, status }
 * @returns {Promise<Array>}
 */
export async function getFirestoreAdminInquiries({ search = '', status = 'all' } = {}) {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    return [];
  }

  try {
    const inqColl = collection(db, 'inquiries');
    const snapshot = await getDocs(inqColl);
    let inquiries = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const inqStatus = data.status || 'new';
      inquiries.push({
        id: docSnap.id,
        ...data,
        status: inqStatus,
        clientName: data.clientName || data.name || data.senderName || 'Prospective Buyer',
        senderName: data.clientName || data.name || data.senderName || 'Prospective Buyer',
        clientEmail: data.clientEmail || data.senderEmail || data.email || 'N/A',
        senderEmail: data.clientEmail || data.senderEmail || data.email || 'N/A',
        clientPhone: data.clientPhone || data.phone || '',
        propertyTitle: data.propertyTitle || 'Luxury Representation',
        propertyId: data.propertyId || '',
        advisorUid: data.advisorUid || '',
        message: data.message || '',
        agentNotes: data.agentNotes || data.notes || '',
        date: data.createdAt || data.date || new Date().toISOString(),
        createdAt: data.createdAt || data.date || new Date().toISOString(),
      });
    });

    if (status && status !== 'all') {
      const target = status === 'resolved' ? 'closed' : status;
      inquiries = inquiries.filter((i) => i.status === target || (status === 'resolved' && i.status === 'closed'));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      inquiries = inquiries.filter(
        (i) =>
          i.clientName.toLowerCase().includes(q) ||
          i.clientEmail.toLowerCase().includes(q) ||
          i.propertyTitle.toLowerCase().includes(q) ||
          i.message.toLowerCase().includes(q)
      );
    }

    inquiries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return inquiries;
  } catch (err) {
    console.error('[AdminFirestoreService] Failed to load inquiries for admin:', err);
    return [];
  }
}

/**
 * Subscribe to client inquiries in Cloud Firestore
 * @param {Function} callback 
 * @param {Object} options 
 * @returns {Function} Unsubscribe
 */
export function subscribeFirestoreAdminInquiries(callback, { search = '', status = 'all' } = {}) {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    callback([]);
    return () => {};
  }

  const inqColl = collection(db, 'inquiries');

  return onSnapshot(
    inqColl,
    (snapshot) => {
      let inquiries = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const inqStatus = data.status || 'new';
        inquiries.push({
          id: docSnap.id,
          ...data,
          status: inqStatus,
          clientName: data.clientName || data.name || data.senderName || 'Prospective Buyer',
          senderName: data.clientName || data.name || data.senderName || 'Prospective Buyer',
          clientEmail: data.clientEmail || data.senderEmail || data.email || 'N/A',
          senderEmail: data.clientEmail || data.senderEmail || data.email || 'N/A',
          clientPhone: data.clientPhone || data.phone || '',
          propertyTitle: data.propertyTitle || 'Luxury Representation',
          propertyId: data.propertyId || '',
          advisorUid: data.advisorUid || '',
          message: data.message || '',
          agentNotes: data.agentNotes || data.notes || '',
          date: data.createdAt || data.date || new Date().toISOString(),
          createdAt: data.createdAt || data.date || new Date().toISOString(),
        });
      });

      if (status && status !== 'all') {
        const target = status === 'resolved' ? 'closed' : status;
        inquiries = inquiries.filter((i) => i.status === target || (status === 'resolved' && i.status === 'closed'));
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        inquiries = inquiries.filter(
          (i) =>
            i.clientName.toLowerCase().includes(q) ||
            i.clientEmail.toLowerCase().includes(q) ||
            i.propertyTitle.toLowerCase().includes(q) ||
            i.message.toLowerCase().includes(q)
        );
      }

      inquiries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      callback(inquiries);
    },
    (err) => {
      console.warn('[AdminFirestoreService] Inquiries listener warning:', err);
      callback([]);
    }
  );
}

/**
 * Update an inquiry's status and notes in Cloud Firestore
 * @param {string} id Inquiry document ID
 * @param {string} newStatus ('new' | 'contacted' | 'closed' | 'resolved')
 * @param {string} [notes='']
 * @returns {Promise<boolean>}
 */
export async function updateFirestoreInquiryStatus(id, newStatus, notes = '') {
  if (!isFirebaseConfigured || !db || !id) return false;

  const target = newStatus === 'resolved' ? 'closed' : newStatus;
  const inqRef = doc(db, 'inquiries', id);
  const payload = {
    status: target,
    updatedAt: new Date().toISOString(),
  };

  if (notes !== undefined && notes !== null && notes.trim()) {
    payload.agentNotes = notes.trim();
  }

  await updateDoc(inqRef, payload);

  await logFirestoreAdminAction({
    action: 'INQUIRY_STATUS_UPDATED',
    target: `Inquiry ID: ${id}`,
    details: `Status set to ${target}`,
    actorEmail: auth?.currentUser?.email || 'Administrator',
  });

  return true;
}

/**
 * Permanently delete an inquiry from Cloud Firestore
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export async function deleteFirestoreInquiry(id) {
  if (!isFirebaseConfigured || !db || !id) return false;

  const inqRef = doc(db, 'inquiries', id);
  await deleteDoc(inqRef);

  await logFirestoreAdminAction({
    action: 'INQUIRY_DELETED',
    target: `Inquiry ID: ${id}`,
    details: 'Permanently removed inquiry from Cloud Firestore.',
    actorEmail: auth?.currentUser?.email || 'Administrator',
  });

  return true;
}

// ========================================================
// 6. GOVERNANCE AUDIT LOGGING & SETTINGS
// ========================================================

/**
 * Record an administrative action into Cloud Firestore
 * @param {Object} logParams { action, target, details, actorEmail }
 */
export async function logFirestoreAdminAction({ action, target, details, actorEmail }) {
  if (!isFirebaseConfigured || !db) return;

  try {
    const auditColl = collection(db, 'auditLogs');
    await addDoc(auditColl, {
      action,
      target,
      details,
      actorEmail: actorEmail || auth?.currentUser?.email || 'Administrator',
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1 (Authorized Admin Console)',
    });
  } catch (err) {
    // Audit logging is non-blocking to primary administrative actions
    console.warn('[AdminFirestoreService] Failed to record audit log:', err);
  }
}

/**
 * Fetch administrative governance audit logs from Cloud Firestore
 * @param {number} [limitCount=50] 
 * @returns {Promise<Array>}
 */
export async function getFirestoreAdminAuditLogs(limitCount = 50) {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    return [];
  }

  try {
    const auditColl = collection(db, 'auditLogs');
    const q = query(auditColl, limit(limitCount));
    const snapshot = await getDocs(q);
    const logs = [];

    snapshot.forEach((docSnap) => {
      logs.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

    logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return logs;
  } catch (err) {
    console.warn('[AdminFirestoreService] Failed to fetch audit logs:', err);
    return [];
  }
}
