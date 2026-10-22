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
      latencyMs: 0,
      users: { status: 'not_configured', total: 0, customers: 0, advisors: 0, admins: 0, suspended: 0 },
      applications: { status: 'not_configured', total: 0, pending: 0, approved: 0, rejected: 0 },
      properties: { status: 'not_configured', total: 0, published: 0, unpublished: 0, pending: 0, draft: 0, rejected: 0, retired: 0, archived: 0 },
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
      latencyMs: 0,
      users: { status: 'error', total: 0, customers: 0, advisors: 0, admins: 0, suspended: 0 },
      applications: { status: 'error', total: 0, pending: 0, approved: 0, rejected: 0 },
      properties: { status: 'error', total: 0, published: 0, unpublished: 0, pending: 0, draft: 0, rejected: 0, retired: 0, archived: 0 },
      inquiries: { status: 'error', total: 0, new: 0, contacted: 0, closed: 0 },
    };
  }

  const startTime = Date.now();
  const result = {
    isConfigured: true,
    overallStatus: 'connected',
    dataSource: 'Cloud Firestore (Live Production Database)',
    timestamp: new Date().toISOString(),
    latencyMs: 0,
    error: null,
    users: {
      status: 'loading',
      total: 0,
      customers: 0,
      advisors: 0,
      admins: 0,
      suspended: 0,
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
      unpublished: 0,
      pending: 0,
      draft: 0,
      rejected: 0,
      retired: 0,
      archived: 0,
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

    let suspendedCount = 0;
    try {
      const suspQuery = query(usersColl, where('accountStatus', '==', 'suspended'));
      const suspSnap = await getCountFromServer(suspQuery);
      suspendedCount = suspSnap.data().count;
    } catch {
      suspendedCount = 0;
    }
    result.users.suspended = suspendedCount;

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

  // 3. Properties Aggregation (All 6 Governance Dimensions)
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

    let explicitUnpublished = 0;
    try {
      const unpubQuery = query(propsColl, where('publicationStatus', '==', 'unpublished'));
      const unpubSnap = await getCountFromServer(unpubQuery);
      explicitUnpublished = unpubSnap.data().count;
    } catch {
      explicitUnpublished = 0;
    }

    const rejectedPropsQuery = query(propsColl, where('publicationStatus', '==', 'rejected'));
    const rejectedPropsSnap = await getCountFromServer(rejectedPropsQuery);
    result.properties.rejected = rejectedPropsSnap.data().count;

    let archivedCount = 0;
    try {
      const archivedPropsQuery = query(propsColl, where('publicationStatus', '==', 'archived'));
      const archivedPropsSnap = await getCountFromServer(archivedPropsQuery);
      archivedCount = archivedPropsSnap.data().count;
    } catch {
      archivedCount = 0;
    }
    result.properties.archived = archivedCount;

    let retiredCount = 0;
    try {
      const retiredPropsQuery = query(propsColl, where('publicationStatus', '==', 'retired'));
      const retiredPropsSnap = await getCountFromServer(retiredPropsQuery);
      retiredCount = retiredPropsSnap.data().count;
    } catch {
      retiredCount = 0;
    }
    result.properties.retired = retiredCount;

    // Unpublished listings: approved or draft listings held offline (not live on public catalog)
    result.properties.unpublished = explicitUnpublished + result.properties.draft;
    // Fallback: If legacy documents don't have explicit draft or unpublished flags, compute remainder
    const nonPublishedRemainder = Math.max(
      0,
      result.properties.total - result.properties.published - result.properties.pending - result.properties.rejected - result.properties.archived - result.properties.retired
    );
    if (result.properties.unpublished === 0 && nonPublishedRemainder > 0) {
      result.properties.unpublished = nonPublishedRemainder;
    }

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

  result.latencyMs = Math.max(1, Date.now() - startTime);
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
    const seenIds = new Set();

    snapshot.forEach((docSnap) => {
      if (seenIds.has(docSnap.id)) return;
      seenIds.add(docSnap.id);
      const data = docSnap.data();
      const pubStatus = data.publicationStatus || (data.isPublished ? 'published' : 'draft');
      properties.push({
        id: docSnap.id,
        ...data,
        publicationStatus: pubStatus,
        moderationStatus: pubStatus, // Backwards compatible with existing table
        title: data.title || 'Untitled Property',
        description: data.description || '',
        price: Number(data.price) || 0,
        listingType: data.listingType || 'Buy',
        propertyType: data.propertyType || 'Apartment',
        location: data.location || data.locality || data.city || 'India',
        address: data.address || '',
        locality: data.locality || '',
        city: data.city || '',
        state: data.state || 'Maharashtra',
        postalCode: data.postalCode || '',
        bedrooms: Number(data.bedrooms) || 0,
        bathrooms: Number(data.bathrooms) || 0,
        areaSqFt: Number(data.areaSqFt) || 0,
        furnishing: data.furnishing || 'Unfurnished',
        parkingSlots: Number(data.parkingSlots) || 0,
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        isFeatured: Boolean(data.isFeatured),
        isPublished: Boolean(data.isPublished),
        isArchived: Boolean(data.isArchived || pubStatus === 'archived'),
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : (Array.isArray(data.images) ? data.images : []),
        images: Array.isArray(data.images) ? data.images : (Array.isArray(data.imageUrls) ? data.imageUrls : []),
        featuredImage: data.featuredImage || data.imageUrls?.[0] || data.images?.[0] || '',
        agentId: data.agentId || data.createdByUid || '',
        agentName: data.agentName || (data.isAdminCreated ? 'System Administrator' : 'Advisor'),
        agentEmail: data.agentEmail || '',
        createdByUid: data.createdByUid || '',
        createdByRole: data.createdByRole || (data.isAdminCreated ? 'admin' : 'agent'),
        isAdminCreated: Boolean(data.isAdminCreated || data.createdByRole === 'admin'),
        lastEditedByAdmin: data.lastEditedByAdmin || null,
        rejectionReason: data.rejectionReason || null,
        moderatorNotes: data.moderatorNotes || null,
        createdAt: data.createdAt || data.date || new Date().toISOString(),
        updatedAt: data.updatedAt || null,
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
      const seenIds = new Set();
      snapshot.forEach((docSnap) => {
        if (seenIds.has(docSnap.id)) return;
        seenIds.add(docSnap.id);
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
 * Publish an approved or reviewed property listing to the platform.
 * Enforces: publicationStatus: 'published', isPublished: true, moderationStatus: 'approved'.
 * @param {string} id Property document ID
 * @param {string} [notes=''] Administrative audit notes
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function publishFirestoreProperty(id, notes = '', adminUser = null) {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  const propRef = doc(db, 'properties', id);
  const snap = await getDoc(propRef);
  if (!snap.exists()) {
    throw new Error('Property does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();
  const previousStatus = existingData.publicationStatus || (existingData.isPublished ? 'published' : 'draft');
  const nowIso = new Date().toISOString();
  const reviewer = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const adminUid = adminUser?.uid || auth?.currentUser?.uid || '';

  const updatePayload = {
    publicationStatus: 'published',
    isPublished: true,
    moderationStatus: 'approved',
    rejectionReason: null,
    unpublishedReason: null,
    isArchived: false,
    archivedAt: null,
    publishedAt: existingData.publishedAt || nowIso,
    moderatedAt: nowIso,
    moderatedBy: reviewer,
    updatedAt: nowIso,
    lastEditedByAdmin: reviewer,
  };

  await updateDoc(propRef, updatePayload);

  await logFirestoreAdminAction({
    action: 'PROPERTY_PUBLISHED',
    adminUid,
    actorEmail: reviewer,
    propertyId: id,
    previousStatus,
    newStatus: 'published',
    reason: notes.trim() || 'Approved and published by administrator',
    target: `Property ID: ${id} (${existingData.title || 'Asset'})`,
    details: `Property published to platform. Moderation status: approved. Notes: ${notes.trim() || 'None'}`,
  });

  return true;
}

/**
 * Temporarily unpublish a property listing (take offline).
 * Enforces: publicationStatus: 'unpublished', isPublished: false.
 * CRITICAL GOVERNANCE RULE: Preserves moderationStatus === 'approved' so the property retains approval.
 * @param {string} id Property document ID
 * @param {string} [reason=''] Reason for taking listing offline
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function unpublishFirestoreProperty(id, reason = '', adminUser = null) {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  const propRef = doc(db, 'properties', id);
  const snap = await getDoc(propRef);
  if (!snap.exists()) {
    throw new Error('Property does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();
  const previousStatus = existingData.publicationStatus || (existingData.isPublished ? 'published' : 'draft');
  const nowIso = new Date().toISOString();
  const reviewer = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const adminUid = adminUser?.uid || auth?.currentUser?.uid || '';

  const updatePayload = {
    publicationStatus: 'unpublished',
    isPublished: false,
    // Preserves approval status!
    moderationStatus: existingData.moderationStatus === 'approved' ? 'approved' : (existingData.moderationStatus || 'pending'),
    unpublishedReason: reason.trim() || 'Temporarily taken offline by administrator',
    unpublishedAt: nowIso,
    unpublishedBy: reviewer,
    updatedAt: nowIso,
    lastEditedByAdmin: reviewer,
  };

  await updateDoc(propRef, updatePayload);

  await logFirestoreAdminAction({
    action: 'PROPERTY_UNPUBLISHED',
    adminUid,
    actorEmail: reviewer,
    propertyId: id,
    previousStatus,
    newStatus: 'unpublished',
    reason: reason.trim() || 'Temporarily taken offline by administrator',
    target: `Property ID: ${id} (${existingData.title || 'Asset'})`,
    details: `Property temporarily unpublished. Retains moderationStatus: ${updatePayload.moderationStatus}. Reason: ${reason.trim() || 'None'}`,
  });

  return true;
}

/**
 * Republish a temporarily unpublished property without re-approval.
 * @param {string} id Property document ID
 * @param {string} [notes=''] Administrative notes
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function republishFirestoreProperty(id, notes = '', adminUser = null) {
  return publishFirestoreProperty(id, notes || 'Republished to live platform by administrator', adminUser);
}

/**
 * Reject a submitted property listing with a mandatory reason.
 * Enforces: publicationStatus: 'rejected', isPublished: false, moderationStatus: 'rejected'.
 * Rejection reason is strictly mandatory.
 * @param {string} id Property document ID
 * @param {string} rejectionReason Mandatory reason provided to advisor
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function rejectFirestoreProperty(id, rejectionReason, adminUser = null) {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error('A detailed rejection reason is mandatory to reject a property listing.');
  }

  const propRef = doc(db, 'properties', id);
  const snap = await getDoc(propRef);
  if (!snap.exists()) {
    throw new Error('Property does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();
  const previousStatus = existingData.publicationStatus || (existingData.isPublished ? 'published' : 'draft');
  const nowIso = new Date().toISOString();
  const reviewer = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const adminUid = adminUser?.uid || auth?.currentUser?.uid || '';
  const reasonText = rejectionReason.trim();

  const updatePayload = {
    publicationStatus: 'rejected',
    isPublished: false,
    moderationStatus: 'rejected',
    rejectionReason: reasonText,
    moderatedAt: nowIso,
    moderatedBy: reviewer,
    updatedAt: nowIso,
    lastEditedByAdmin: reviewer,
  };

  await updateDoc(propRef, updatePayload);

  await logFirestoreAdminAction({
    action: 'PROPERTY_REJECTED',
    adminUid,
    actorEmail: reviewer,
    propertyId: id,
    previousStatus,
    newStatus: 'rejected',
    reason: reasonText,
    target: `Property ID: ${id} (${existingData.title || 'Asset'})`,
    details: `Property rejected. Mandatory reason: "${reasonText}".`,
  });

  return true;
}

/**
 * Archive a property listing (reversible, preserves inquiries and data).
 * Enforces: publicationStatus: 'archived', isPublished: false, isArchived: true.
 * @param {string} id Property document ID
 * @param {string} [reason=''] Archival reason
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function archiveFirestoreProperty(id, reason = '', adminUser = null) {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  const propRef = doc(db, 'properties', id);
  const snap = await getDoc(propRef);
  if (!snap.exists()) {
    throw new Error('Property does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();
  const previousStatus = existingData.publicationStatus || (existingData.isPublished ? 'published' : 'draft');
  const nowIso = new Date().toISOString();
  const reviewer = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const adminUid = adminUser?.uid || auth?.currentUser?.uid || '';

  const updatePayload = {
    publicationStatus: 'archived',
    isPublished: false,
    isArchived: true,
    archivedReason: reason.trim() || 'Archived by administrator',
    archivedAt: nowIso,
    archivedBy: reviewer,
    updatedAt: nowIso,
    lastEditedByAdmin: reviewer,
  };

  await updateDoc(propRef, updatePayload);

  await logFirestoreAdminAction({
    action: 'PROPERTY_ARCHIVED',
    adminUid,
    actorEmail: reviewer,
    propertyId: id,
    previousStatus,
    newStatus: 'archived',
    reason: reason.trim() || 'Archived by administrator',
    target: `Property ID: ${id} (${existingData.title || 'Asset'})`,
    details: `Property listing moved to archive. Reason: ${reason.trim() || 'None'}`,
  });

  return true;
}

/**
 * Restore an archived property listing.
 * Enforces: isArchived: false, archivedAt: null.
 * Restores to 'unpublished' if previously approved, or 'draft'.
 * @param {string} id Property document ID
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function restoreFirestoreProperty(id, adminUser = null) {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  const propRef = doc(db, 'properties', id);
  const snap = await getDoc(propRef);
  if (!snap.exists()) {
    throw new Error('Property does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();
  const nowIso = new Date().toISOString();
  const reviewer = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const adminUid = adminUser?.uid || auth?.currentUser?.uid || '';

  // If it was previously approved, restore to 'unpublished' (ready to republish), otherwise 'draft'
  const targetStatus = existingData.moderationStatus === 'approved' ? 'unpublished' : 'draft';

  const updatePayload = {
    publicationStatus: targetStatus,
    isPublished: false,
    isArchived: false,
    archivedAt: null,
    archivedReason: null,
    restoredAt: nowIso,
    restoredBy: reviewer,
    updatedAt: nowIso,
    lastEditedByAdmin: reviewer,
  };

  await updateDoc(propRef, updatePayload);

  await logFirestoreAdminAction({
    action: 'PROPERTY_RESTORED',
    adminUid,
    actorEmail: reviewer,
    propertyId: id,
    previousStatus: 'archived',
    newStatus: targetStatus,
    reason: 'Restored from platform archive',
    target: `Property ID: ${id} (${existingData.title || 'Asset'})`,
    details: `Archived property restored to status: ${targetStatus}.`,
  });

  return true;
}

/**
 * Permanently remove from publication (Retire listing).
 * Enforces: publicationStatus: 'retired', isPublished: false, moderationStatus: 'retired'.
 * A retired listing cannot be published through ordinary publish actions without explicit restoration.
 * @param {string} id Property document ID
 * @param {string} reason Mandatory retirement justification
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function retireFirestoreProperty(id, reason, adminUser = null) {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  if (!reason || !reason.trim()) {
    throw new Error('A retirement reason is required to permanently remove a listing from publication.');
  }

  const propRef = doc(db, 'properties', id);
  const snap = await getDoc(propRef);
  if (!snap.exists()) {
    throw new Error('Property does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();
  const previousStatus = existingData.publicationStatus || (existingData.isPublished ? 'published' : 'draft');
  const nowIso = new Date().toISOString();
  const reviewer = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const adminUid = adminUser?.uid || auth?.currentUser?.uid || '';
  const reasonText = reason.trim();

  const updatePayload = {
    publicationStatus: 'retired',
    isPublished: false,
    moderationStatus: 'retired',
    retiredAt: nowIso,
    retiredBy: reviewer,
    retiredReason: reasonText,
    updatedAt: nowIso,
    lastEditedByAdmin: reviewer,
  };

  await updateDoc(propRef, updatePayload);

  await logFirestoreAdminAction({
    action: 'PROPERTY_RETIRED',
    adminUid,
    actorEmail: reviewer,
    propertyId: id,
    previousStatus,
    newStatus: 'retired',
    reason: reasonText,
    target: `Property ID: ${id} (${existingData.title || 'Asset'})`,
    details: `Property permanently removed from publication (retired). Reason: "${reasonText}".`,
  });

  return true;
}

/**
 * Return a property submission to the advisor for editorial correction.
 * Enforces: publicationStatus: 'draft', moderationStatus: 'correction_needed', isPublished: false.
 * Leaves property accessible to advisor for editing and resubmission.
 * @param {string} id Property document ID
 * @param {string} notes Revision notes and correction requirements
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function returnFirestorePropertyForCorrection(id, notes, adminUser = null) {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  const propRef = doc(db, 'properties', id);
  const snap = await getDoc(propRef);
  if (!snap.exists()) {
    throw new Error('Property does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();
  const previousStatus = existingData.publicationStatus || (existingData.isPublished ? 'published' : 'draft');
  const nowIso = new Date().toISOString();
  const reviewer = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const adminUid = adminUser?.uid || auth?.currentUser?.uid || '';
  const notesText = (notes || '').trim() || 'Please revise property details and resubmit for editorial review.';

  const updatePayload = {
    publicationStatus: 'draft',
    moderationStatus: 'correction_needed',
    isPublished: false,
    rejectionReason: notesText,
    returnedForCorrectionAt: nowIso,
    returnedBy: reviewer,
    updatedAt: nowIso,
    lastEditedByAdmin: reviewer,
  };

  await updateDoc(propRef, updatePayload);

  await logFirestoreAdminAction({
    action: 'PROPERTY_RETURNED_FOR_CORRECTION',
    adminUid,
    actorEmail: reviewer,
    propertyId: id,
    previousStatus,
    newStatus: 'draft',
    reason: notesText,
    target: `Property ID: ${id} (${existingData.title || 'Asset'})`,
    details: `Property returned to advisor for correction. Editorial notes: "${notesText}".`,
  });

  return true;
}

/**
 * Privileged restoration of a retired listing to unpublished state.
 * @param {string} id Property document ID
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function restoreRetiredFirestoreProperty(id, adminUser = null) {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  const propRef = doc(db, 'properties', id);
  const snap = await getDoc(propRef);
  if (!snap.exists()) {
    throw new Error('Property does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();
  const nowIso = new Date().toISOString();
  const reviewer = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const adminUid = adminUser?.uid || auth?.currentUser?.uid || '';

  const updatePayload = {
    publicationStatus: 'unpublished',
    moderationStatus: 'draft',
    isPublished: false,
    retiredAt: null,
    retiredReason: null,
    restoredAt: nowIso,
    restoredBy: reviewer,
    updatedAt: nowIso,
    lastEditedByAdmin: reviewer,
  };

  await updateDoc(propRef, updatePayload);

  await logFirestoreAdminAction({
    action: 'PROPERTY_RETIRED_RESTORED',
    adminUid,
    actorEmail: reviewer,
    propertyId: id,
    previousStatus: 'retired',
    newStatus: 'unpublished',
    reason: 'Privileged restoration of retired listing',
    target: `Property ID: ${id} (${existingData.title || 'Asset'})`,
    details: 'Permanently retired property restored to unpublished status by administrator.',
  });

  return true;
}

/**
 * Update property publication and moderation status in Cloud Firestore (Backwards Compatible Helper)
 * @param {string} id Property document ID
 * @param {string} newStatus ('published' | 'pending' | 'draft' | 'rejected' | 'unpublished' | 'archived')
 * @param {string} [notes=''] Editorial reason or notes
 * @param {string} [adminEmail=''] Reviewer
 * @param {string} [adminUid=''] Admin UID
 * @returns {Promise<boolean>}
 */
export async function updateFirestorePropertyModeration(id, newStatus, notes = '', adminEmail = '', adminUid = '') {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Firebase configuration or property ID missing.');
  }

  if (newStatus === 'published') {
    return publishFirestoreProperty(id, notes, { email: adminEmail, uid: adminUid });
  }
  if (newStatus === 'unpublished') {
    return unpublishFirestoreProperty(id, notes, { email: adminEmail, uid: adminUid });
  }
  if (newStatus === 'rejected') {
    return rejectFirestoreProperty(id, notes || 'Editorial compliance revision required.', { email: adminEmail, uid: adminUid });
  }
  if (newStatus === 'archived') {
    return archiveFirestoreProperty(id, notes, { email: adminEmail, uid: adminUid });
  }
  if (newStatus === 'retired') {
    return retireFirestoreProperty(id, notes || 'Retired from publication by administrator', { email: adminEmail, uid: adminUid });
  }
  if (newStatus === 'correction_needed') {
    return returnFirestorePropertyForCorrection(id, notes, { email: adminEmail, uid: adminUid });
  }

  const propRef = doc(db, 'properties', id);
  const snap = await getDoc(propRef);
  const existingData = snap.exists() ? snap.data() : {};
  const previousStatus = existingData.publicationStatus || (existingData.isPublished ? 'published' : 'draft');

  const targetStatus = newStatus === 'pending_review' ? 'pending' : newStatus;
  const isPublished = targetStatus === 'published';
  const reviewer = adminEmail || auth?.currentUser?.email || 'Administrator';
  const currentUid = adminUid || auth?.currentUser?.uid || '';
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

  await updateDoc(propRef, updatePayload);

  await logFirestoreAdminAction({
    action: `PROPERTY_MODERATION_${targetStatus.toUpperCase()}`,
    adminUid: currentUid,
    actorEmail: reviewer,
    propertyId: id,
    previousStatus,
    newStatus: targetStatus,
    reason: notes.trim() || '',
    target: `Property ID: ${id}`,
    details: `Publication status set to ${targetStatus}. Notes: ${notes.trim() || 'None'}`,
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
 * Fetch a single property listing by ID for Administrative view/edit
 * @param {string} id Property ID
 * @returns {Promise<Object|null>}
 */
export async function getFirestoreAdminPropertyById(id) {
  if (!isFirebaseConfigured || !db || !id) return null;

  try {
    const propRef = doc(db, 'properties', id);
    const snap = await getDoc(propRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    const pubStatus = data.publicationStatus || (data.isPublished ? 'published' : 'draft');
    return {
      id: snap.id,
      ...data,
      publicationStatus: pubStatus,
      moderationStatus: pubStatus,
      title: data.title || '',
      description: data.description || '',
      price: Number(data.price) || 0,
      listingType: data.listingType || 'Buy',
      propertyType: data.propertyType || 'Apartment',
      location: data.location || data.locality || data.city || 'India',
      address: data.address || '',
      locality: data.locality || '',
      city: data.city || '',
      state: data.state || 'Maharashtra',
      postalCode: data.postalCode || '',
      bedrooms: Number(data.bedrooms) || 0,
      bathrooms: Number(data.bathrooms) || 0,
      areaSqFt: Number(data.areaSqFt) || 0,
      furnishing: data.furnishing || 'Unfurnished',
      parkingSlots: Number(data.parkingSlots) || 0,
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      isFeatured: Boolean(data.isFeatured),
      isPublished: Boolean(data.isPublished),
      isArchived: Boolean(data.isArchived || pubStatus === 'archived'),
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : (Array.isArray(data.images) ? data.images : []),
      images: Array.isArray(data.images) ? data.images : (Array.isArray(data.imageUrls) ? data.imageUrls : []),
      featuredImage: data.featuredImage || data.imageUrls?.[0] || data.images?.[0] || '',
      agentId: data.agentId || data.createdByUid || '',
      agentName: data.agentName || (data.isAdminCreated ? 'System Administrator' : 'Advisor'),
      agentEmail: data.agentEmail || '',
      createdByUid: data.createdByUid || '',
      createdByRole: data.createdByRole || (data.isAdminCreated ? 'admin' : 'agent'),
      isAdminCreated: Boolean(data.isAdminCreated || data.createdByRole === 'admin'),
      lastEditedByAdmin: data.lastEditedByAdmin || null,
      rejectionReason: data.rejectionReason || null,
      moderatorNotes: data.moderatorNotes || null,
      createdAt: data.createdAt || data.date || new Date().toISOString(),
      updatedAt: data.updatedAt || null,
    };
  } catch (err) {
    console.error('[AdminFirestoreService] Failed to fetch property by id:', err);
    return null;
  }
}

/**
 * Create a new property listing in Cloud Firestore by an authorized Administrator
 * @param {Object} propertyData Property form data
 * @param {Object} adminUser Authenticated admin user { uid, email, displayName }
 * @returns {Promise<Object>} Created property object with ID
 */
export async function createFirestoreAdminProperty(propertyData, adminUser) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Cloud Firestore is not configured.');
  }

  if (!auth?.currentUser || !adminUser?.uid) {
    throw new Error('Active administrator authentication session is required.');
  }

  const nowIso = new Date().toISOString();
  const rawImages = propertyData.imageUrls !== undefined ? propertyData.imageUrls : (propertyData.images || []);
  const normalizedImages = Array.isArray(rawImages)
    ? rawImages.filter((img) => typeof img === 'string' && img.trim())
    : [];

  // Determine publication status: Admin can specify, but default to 'draft' or 'pending' if not specified
  const publicationStatus = propertyData.publicationStatus || 'draft';
  const isPublished = publicationStatus === 'published';

  const payload = {
    title: propertyData.title?.trim() || 'Untitled Property',
    description: propertyData.description?.trim() || '',
    listingType: propertyData.listingType || 'Buy',
    propertyType: propertyData.propertyType || 'Apartment',
    price: Number(propertyData.price) || 0,
    areaSqFt: Number(propertyData.areaSqFt) || 0,
    bedrooms: Number(propertyData.bedrooms) || 0,
    bathrooms: Number(propertyData.bathrooms) || 0,
    furnishing: propertyData.furnishing || 'Unfurnished',
    parkingSlots: Number(propertyData.parkingSlots) || 0,

    // Location
    address: propertyData.address?.trim() || '',
    locality: propertyData.locality?.trim() || '',
    city: propertyData.city?.trim() || 'Mumbai',
    state: propertyData.state?.trim() || 'Maharashtra',
    postalCode: propertyData.postalCode?.trim() || '',
    location: propertyData.locality
      ? `${propertyData.locality}, ${propertyData.city || 'India'}`
      : (propertyData.city || 'India'),

    // Media & Amenities
    amenities: Array.isArray(propertyData.amenities) ? propertyData.amenities : [],
    imageUrls: normalizedImages,
    images: normalizedImages,
    featuredImage: propertyData.featuredImage || normalizedImages[0] || '',

    // Moderation & Publication status
    publicationStatus,
    isPublished,
    moderationStatus: publicationStatus,
    isFeatured: Boolean(propertyData.isFeatured),
    rejectionReason: publicationStatus === 'rejected' ? (propertyData.rejectionReason || 'Rejected by administrator.') : null,

    // Provenance: Clearly identify Admin creation
    createdByUid: adminUser.uid,
    createdByRole: 'admin',
    isAdminCreated: true,
    agentId: adminUser.uid,
    agentName: propertyData.agentName?.trim() || adminUser.displayName || 'System Administrator',
    agentEmail: propertyData.agentEmail?.trim() || adminUser.email || 'admin@estatevista.com',

    createdAt: nowIso,
    updatedAt: nowIso,
    lastEditedByAdmin: adminUser.email || 'Administrator',
  };

  const serializedSize = JSON.stringify(payload).length;
  if (serializedSize > 600 * 1024) {
    throw new Error(
      `Property document payload (${Math.round(serializedSize / 1024)} KB) exceeds the 600 KB safety limit for Cloud Firestore. Please reduce the number of attached photos.`
    );
  }

  const docRef = await addDoc(collection(db, 'properties'), payload);

  await logFirestoreAdminAction({
    action: 'PROPERTY_CREATED_BY_ADMIN',
    adminUid: adminUser.uid,
    actorEmail: adminUser.email || 'Administrator',
    propertyId: docRef.id,
    previousStatus: 'none',
    newStatus: publicationStatus,
    reason: `Direct administrative listing creation (${publicationStatus})`,
    target: `Property ID: ${docRef.id} (${payload.title})`,
    details: `Admin created listing "${payload.title}" (${payload.listingType} - ${payload.propertyType}) with status: ${publicationStatus}`,
  });

  return { id: docRef.id, ...payload };
}

/**
 * Update an existing property in Cloud Firestore by an authorized Administrator.
 * Preserves original ownership and advisor attribution unless explicitly modified.
 * Enforces moderation rule: does not automatically publish unless publicationStatus === 'published'.
 * @param {string} id Property document ID
 * @param {Object} updates Form data updates
 * @param {Object} adminUser Authenticated admin user { uid, email }
 * @returns {Promise<boolean>}
 */
export async function updateFirestoreAdminProperty(id, updates, adminUser) {
  if (!isFirebaseConfigured || !db || !id) {
    throw new Error('Cloud Firestore configuration or property ID missing.');
  }

  if (!auth?.currentUser) {
    throw new Error('Active administrator authentication session is required.');
  }

  const propRef = doc(db, 'properties', id);
  const existingSnap = await getDoc(propRef);
  if (!existingSnap.exists()) {
    throw new Error('Property listing does not exist in Cloud Firestore.');
  }

  const existingData = existingSnap.data();
  const nowIso = new Date().toISOString();

  const rawImages = updates.imageUrls !== undefined ? updates.imageUrls : (updates.images || existingData.imageUrls || existingData.images || []);
  const normalizedImages = Array.isArray(rawImages)
    ? rawImages.filter((img) => typeof img === 'string' && img.trim())
    : [];

  // Determine publication status:
  // If updates explicitly changes publicationStatus, use it; otherwise preserve existing
  const targetPublicationStatus = updates.publicationStatus || existingData.publicationStatus || (existingData.isPublished ? 'published' : 'draft');
  const isPublished = targetPublicationStatus === 'published';

  const payload = {
    title: updates.title !== undefined ? updates.title.trim() : (existingData.title || ''),
    description: updates.description !== undefined ? updates.description.trim() : (existingData.description || ''),
    listingType: updates.listingType || existingData.listingType || 'Buy',
    propertyType: updates.propertyType || existingData.propertyType || 'Apartment',
    price: updates.price !== undefined ? Number(updates.price) : (Number(existingData.price) || 0),
    areaSqFt: updates.areaSqFt !== undefined ? Number(updates.areaSqFt) : (Number(existingData.areaSqFt) || 0),
    bedrooms: updates.bedrooms !== undefined ? Number(updates.bedrooms) : (Number(existingData.bedrooms) || 0),
    bathrooms: updates.bathrooms !== undefined ? Number(updates.bathrooms) : (Number(existingData.bathrooms) || 0),
    furnishing: updates.furnishing || existingData.furnishing || 'Unfurnished',
    parkingSlots: updates.parkingSlots !== undefined ? Number(updates.parkingSlots) : (Number(existingData.parkingSlots) || 0),

    // Location
    address: updates.address !== undefined ? updates.address.trim() : (existingData.address || ''),
    locality: updates.locality !== undefined ? updates.locality.trim() : (existingData.locality || ''),
    city: updates.city !== undefined ? updates.city.trim() : (existingData.city || 'Mumbai'),
    state: updates.state !== undefined ? updates.state.trim() : (existingData.state || 'Maharashtra'),
    postalCode: updates.postalCode !== undefined ? updates.postalCode.trim() : (existingData.postalCode || ''),
    location: updates.locality
      ? `${updates.locality}, ${updates.city || 'India'}`
      : (updates.city || existingData.location || 'India'),

    // Media & Amenities
    amenities: updates.amenities !== undefined ? (Array.isArray(updates.amenities) ? updates.amenities : []) : (existingData.amenities || []),
    imageUrls: normalizedImages,
    images: normalizedImages,
    featuredImage: updates.featuredImage || normalizedImages[0] || existingData.featuredImage || '',

    // Moderation & Publication status
    publicationStatus: targetPublicationStatus,
    moderationStatus: targetPublicationStatus,
    isPublished,
    isFeatured: updates.isFeatured !== undefined ? Boolean(updates.isFeatured) : Boolean(existingData.isFeatured),
    rejectionReason: targetPublicationStatus === 'rejected'
      ? (updates.rejectionReason || existingData.rejectionReason || 'Editorial compliance revision required.')
      : null,

    // PRESERVE original owner attribution unless explicitly reassigned
    createdByUid: updates.createdByUid || existingData.createdByUid,
    createdByRole: existingData.createdByRole || (existingData.isAdminCreated ? 'admin' : 'agent'),
    isAdminCreated: Boolean(existingData.isAdminCreated || existingData.createdByRole === 'admin'),
    agentId: updates.agentId || existingData.agentId || existingData.createdByUid,
    agentName: updates.agentName !== undefined ? updates.agentName : (existingData.agentName || 'Advisor'),
    agentEmail: updates.agentEmail !== undefined ? updates.agentEmail : (existingData.agentEmail || ''),

    updatedAt: nowIso,
    lastEditedByAdmin: adminUser?.email || 'Administrator',
  };

  const serializedSize = JSON.stringify(payload).length;
  if (serializedSize > 600 * 1024) {
    throw new Error(
      `Property document payload (${Math.round(serializedSize / 1024)} KB) exceeds the 600 KB safety limit for Cloud Firestore. Please reduce the number of attached photos.`
    );
  }

  await updateDoc(propRef, payload);

  await logFirestoreAdminAction({
    action: 'PROPERTY_UPDATED_BY_ADMIN',
    adminUid: adminUser?.uid || auth?.currentUser?.uid || '',
    actorEmail: adminUser?.email || 'Administrator',
    propertyId: id,
    previousStatus: existingData.publicationStatus || (existingData.isPublished ? 'published' : 'draft'),
    newStatus: targetPublicationStatus,
    reason: updates.moderationReason || updates.rejectionReason || 'Admin edited property specifications',
    target: `Property ID: ${id} (${payload.title})`,
    details: `Admin modified details for "${payload.title}". Status: ${targetPublicationStatus}, Price: ${payload.price}`,
  });

  return true;
}

/**
 * Check for related inquiries associated with a property ID
 * @param {string} id Property ID
 * @returns {Promise<{ hasInquiries: boolean, count: number, inquiries: Array }>}
 */
export async function checkPropertyRelatedRecords(id) {
  if (!isFirebaseConfigured || !db || !id) {
    return { hasInquiries: false, count: 0, inquiries: [] };
  }

  try {
    const inqColl = collection(db, 'inquiries');
    const q = query(inqColl, where('propertyId', '==', id));
    const snap = await getDocs(q);
    const inquiries = [];
    snap.forEach((d) => inquiries.push({ id: d.id, ...d.data() }));

    return {
      hasInquiries: inquiries.length > 0,
      count: inquiries.length,
      inquiries,
    };
  } catch (err) {
    console.warn('[AdminFirestoreService] Could not check property inquiries:', err);
    return { hasInquiries: false, count: 0, inquiries: [] };
  }
}

/**
 * Safely archive or permanently delete a property from Cloud Firestore.
 * If active customer inquiries reference the property and permanent deletion wasn't forced,
 * safe-archives the property to preserve inquiry record references.
 * @param {string} id Property document ID
 * @param {string} [adminEmail=''] Reviewer/Administrator email
 * @param {boolean} [forcePermanent=false] If true, permanently deletes doc; if false and inquiries exist, safe-archives.
 * @returns {Promise<{ success: boolean, action: 'deleted' | 'archived', inquiryCount: number }>}
 */
export async function deleteFirestoreProperty(id, adminEmail = '', forcePermanent = false, adminUid = '') {
  if (!isFirebaseConfigured || !db || !id) {
    return { success: false, action: 'error', inquiryCount: 0 };
  }

  const reviewer = adminEmail || auth?.currentUser?.email || 'Administrator';
  const currentUid = adminUid || auth?.currentUser?.uid || '';
  const propRef = doc(db, 'properties', id);

  const propSnap = await getDoc(propRef);
  const propData = propSnap.exists() ? propSnap.data() : {};
  const previousStatus = propData.publicationStatus || (propData.isPublished ? 'published' : 'draft');
  const propTitle = propData.title || 'Asset';

  // 1. Check for references in /inquiries
  const { hasInquiries, count: inquiryCount } = await checkPropertyRelatedRecords(id);

  // If customer inquiries reference this property and permanent deletion wasn't explicitly forced,
  // safe-archive the listing so customer and advisor inquiry history remains intact
  if (hasInquiries && !forcePermanent) {
    const nowIso = new Date().toISOString();
    await updateDoc(propRef, {
      publicationStatus: 'archived',
      moderationStatus: 'archived',
      isPublished: false,
      isArchived: true,
      archivedAt: nowIso,
      archivedBy: reviewer,
      updatedAt: nowIso,
    });

    await logFirestoreAdminAction({
      action: 'PROPERTY_ARCHIVED_SAFE',
      adminUid: currentUid,
      actorEmail: reviewer,
      propertyId: id,
      previousStatus,
      newStatus: 'archived',
      reason: `Safely archived property listing because ${inquiryCount} active client inquiry record(s) reference it.`,
      target: `Property ID: ${id} (${propTitle})`,
      details: `Safely archived property listing because ${inquiryCount} active client inquiry record(s) reference it.`,
    });

    return { success: true, action: 'archived', inquiryCount };
  }

  // 2. Otherwise perform permanent deletion with audit logging recorded before deletion
  await logFirestoreAdminAction({
    action: 'PROPERTY_DELETED',
    adminUid: currentUid,
    actorEmail: reviewer,
    propertyId: id,
    previousStatus,
    newStatus: 'deleted',
    reason: forcePermanent
      ? `Permanent deletion confirmed with administrative override (${inquiryCount} inquiry reference(s) acknowledged)`
      : 'Permanently deleted clean listing with 0 inquiries',
    target: `Property ID: ${id} (${propTitle})`,
    details: `Permanently removed listing from Cloud Firestore. Related inquiries check: ${inquiryCount} inquiry record(s) detected.`,
  });

  await deleteDoc(propRef);

  return { success: true, action: 'deleted', inquiryCount };
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
      const accountStatus = data.accountStatus || data.status || 'active';
      users.push({
        id: docSnap.id,
        uid: data.uid || docSnap.id,
        name: data.name || data.displayName || 'EstateVista Member',
        displayName: data.displayName || data.name || 'EstateVista Member',
        email: data.email || 'N/A',
        phone: data.phone || '',
        role: data.role || 'customer',
        advisorStatus: data.advisorStatus || 'none',
        accountStatus,
        status: accountStatus,
        isSuspended: accountStatus === 'suspended',
        suspendedAt: data.suspendedAt || null,
        suspendedBy: data.suspendedBy || null,
        suspensionReason: data.suspensionReason || '',
        bio: data.bio || '',
        company: data.company || data.agency || '',
        agency: data.agency || data.company || '',
        location: data.location || data.city || '',
        city: data.city || '',
        address: data.address || '',
        photoURL: data.photoURL || data.avatar || '',
        createdAt: data.createdAt || data.joinedAt || null,
        joinedAt: data.joinedAt || data.createdAt || null,
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
          (u.phone && u.phone.includes(q)) ||
          (u.company && u.company.toLowerCase().includes(q))
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
 * Update permitted profile fields for a user in Cloud Firestore
 * @param {string} uid User UID
 * @param {Object} profileFields { name, phone, bio, company, location, city, address }
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function updateFirestoreUserProfile(uid, profileFields, adminUser = null) {
  if (!isFirebaseConfigured || !db || !uid) {
    throw new Error('Firebase configuration or user UID missing.');
  }

  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('User profile record does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();
  const nowIso = new Date().toISOString();
  const reviewer = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const adminUid = adminUser?.uid || auth?.currentUser?.uid || '';

  const payload = {
    updatedAt: nowIso,
    lastEditedByAdmin: reviewer,
  };

  if (profileFields.name !== undefined) {
    payload.name = profileFields.name.trim();
    payload.displayName = profileFields.name.trim();
  }
  if (profileFields.phone !== undefined) {
    payload.phone = profileFields.phone.trim();
  }
  if (profileFields.bio !== undefined) {
    payload.bio = profileFields.bio.trim();
  }
  if (profileFields.company !== undefined) {
    payload.company = profileFields.company.trim();
    payload.agency = profileFields.company.trim();
  }
  if (profileFields.location !== undefined) {
    payload.location = profileFields.location.trim();
  }
  if (profileFields.city !== undefined) {
    payload.city = profileFields.city.trim();
  }
  if (profileFields.address !== undefined) {
    payload.address = profileFields.address.trim();
  }

  await updateDoc(userDocRef, payload);

  await logFirestoreAdminAction({
    action: 'USER_PROFILE_UPDATED',
    adminUid,
    actorEmail: reviewer,
    target: `User UID: ${uid} (${existingData.email || 'User'})`,
    details: `Admin modified profile fields: ${Object.keys(payload).filter((k) => k !== 'updatedAt' && k !== 'lastEditedByAdmin').join(', ')}`,
  });

  return true;
}

/**
 * Suspend a user account in Cloud Firestore.
 * Prevents account from performing protected advisor or administrative actions.
 * @param {string} uid User UID to suspend
 * @param {string} reason Mandatory suspension reason
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function suspendFirestoreUser(uid, reason, adminUser = null) {
  if (!isFirebaseConfigured || !db || !uid) {
    throw new Error('Firebase configuration or user UID missing.');
  }

  if (!reason || !reason.trim()) {
    throw new Error('A detailed justification is mandatory to suspend a user account.');
  }

  const currentAdminUid = adminUser?.uid || auth?.currentUser?.uid || '';
  const currentAdminEmail = adminUser?.email || auth?.currentUser?.email || 'Administrator';

  // Safeguard 1: Administrator cannot suspend their own active session
  if (uid === currentAdminUid) {
    throw new Error('Security Policy Violation: You cannot suspend your own administrator account.');
  }

  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('User profile record does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();

  // Safeguard 2: Cannot suspend the last remaining admin on the platform
  if (existingData.role === 'admin') {
    const usersColl = collection(db, 'users');
    const adminQuery = query(usersColl, where('role', '==', 'admin'));
    const adminSnap = await getDocs(adminQuery);
    const activeAdmins = adminSnap.docs.filter(
      (d) => d.id !== uid && d.data().accountStatus !== 'suspended' && d.data().status !== 'suspended'
    );
    if (activeAdmins.length === 0) {
      throw new Error('Security Policy Violation: Cannot suspend the last remaining active System Administrator on the platform.');
    }
  }

  const nowIso = new Date().toISOString();
  const reasonText = reason.trim();

  const updatePayload = {
    accountStatus: 'suspended',
    status: 'suspended',
    suspendedAt: nowIso,
    suspendedBy: currentAdminEmail,
    suspendedByUid: currentAdminUid,
    suspensionReason: reasonText,
    updatedAt: nowIso,
  };

  await updateDoc(userDocRef, updatePayload);

  await logFirestoreAdminAction({
    action: 'USER_SUSPENDED',
    adminUid: currentAdminUid,
    actorEmail: currentAdminEmail,
    target: `User UID: ${uid} (${existingData.email || 'User'})`,
    reason: reasonText,
    details: `Account suspended. Reason: "${reasonText}".`,
  });

  return true;
}

/**
 * Reactivate a previously suspended user account in Cloud Firestore.
 * @param {string} uid User UID to reactivate
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<boolean>}
 */
export async function reactivateFirestoreUser(uid, adminUser = null) {
  if (!isFirebaseConfigured || !db || !uid) {
    throw new Error('Firebase configuration or user UID missing.');
  }

  const currentAdminUid = adminUser?.uid || auth?.currentUser?.uid || '';
  const currentAdminEmail = adminUser?.email || auth?.currentUser?.email || 'Administrator';

  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('User profile record does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();
  const nowIso = new Date().toISOString();

  const updatePayload = {
    accountStatus: 'active',
    status: 'active',
    reactivatedAt: nowIso,
    reactivatedBy: currentAdminEmail,
    suspendedAt: null,
    suspendedBy: null,
    suspensionReason: null,
    updatedAt: nowIso,
  };

  await updateDoc(userDocRef, updatePayload);

  await logFirestoreAdminAction({
    action: 'USER_REACTIVATED',
    adminUid: currentAdminUid,
    actorEmail: currentAdminEmail,
    target: `User UID: ${uid} (${existingData.email || 'User'})`,
    reason: 'Account reinstated by administrator',
    details: 'User account restored to active status.',
  });

  return true;
}

/**
 * Safely delete a user profile document from Cloud Firestore.
 * Requires verification that user is not the active administrator or the last system administrator.
 * Note: Deleting a Firestore document does not delete Firebase Authentication credentials,
 * which requires Firebase Admin SDK / Cloud Functions.
 * @param {string} uid User UID to delete
 * @param {Object} [adminUser=null] Authenticated administrator { uid, email }
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function deleteFirestoreUser(uid, adminUser = null) {
  if (!isFirebaseConfigured || !db || !uid) {
    throw new Error('Firebase configuration or user UID missing.');
  }

  const currentAdminUid = adminUser?.uid || auth?.currentUser?.uid || '';
  const currentAdminEmail = adminUser?.email || auth?.currentUser?.email || 'Administrator';

  // Safeguard 1: Administrator cannot delete their own account
  if (uid === currentAdminUid) {
    throw new Error('Security Policy Violation: You cannot delete your own administrator account.');
  }

  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('User profile record does not exist in Cloud Firestore.');
  }

  const existingData = snap.data();

  // Safeguard 2: Cannot delete the last remaining system admin
  if (existingData.role === 'admin') {
    const usersColl = collection(db, 'users');
    const adminQuery = query(usersColl, where('role', '==', 'admin'));
    const adminSnap = await getDocs(adminQuery);
    if (adminSnap.size <= 1) {
      throw new Error('Security Policy Violation: Cannot delete the last remaining System Administrator on the platform.');
    }
  }

  await logFirestoreAdminAction({
    action: 'USER_DELETED',
    adminUid: currentAdminUid,
    actorEmail: currentAdminEmail,
    target: `User UID: ${uid} (${existingData.email || 'User'})`,
    reason: 'Administrative user profile deletion',
    details: `User profile document removed from /users/${uid}. Role was: ${existingData.role || 'customer'}. Note: Firebase Authentication account requires Admin SDK to purge.`,
  });

  await deleteDoc(userDocRef);

  return {
    success: true,
    message: 'User profile successfully removed from Cloud Firestore. (Note: Firebase Authentication account credentials require Admin SDK or Firebase Console to purge permanently).',
  };
}

/**
 * Update a user account's role in Cloud Firestore with security safeguards.
 * @param {string} uid User UID
 * @param {'customer' | 'agent' | 'admin'} targetRole 
 * @param {string} [adminEmail='']
 * @param {string} [adminUid='']
 * @returns {Promise<boolean>}
 */
export async function updateFirestoreUserRole(uid, targetRole, adminEmail = '', adminUid = '') {
  if (!isFirebaseConfigured || !db || !uid) {
    throw new Error('Firebase configuration or user UID missing.');
  }

  if (!['customer', 'agent', 'admin'].includes(targetRole)) {
    throw new Error(`Invalid role specification: ${targetRole}`);
  }

  const currentAdminUid = adminUid || auth?.currentUser?.uid || '';
  const currentAdminEmail = adminEmail || auth?.currentUser?.email || 'Administrator';

  // Safeguard 1: Self-demotion protection
  if (currentAdminUid && uid === currentAdminUid && targetRole !== 'admin') {
    throw new Error('Security Policy Violation: Administrators cannot revoke their own administrative clearance.');
  }

  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('User profile record does not exist in Cloud Firestore.');
  }
  const existingData = snap.data();

  // Safeguard 2: Last administrator protection
  if (existingData.role === 'admin' && targetRole !== 'admin') {
    const usersColl = collection(db, 'users');
    const adminQuery = query(usersColl, where('role', '==', 'admin'));
    const adminSnap = await getDocs(adminQuery);
    if (adminSnap.size <= 1) {
      throw new Error('Security Policy Violation: Cannot demote the last remaining System Administrator on the platform.');
    }
  }

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
    adminUid: currentAdminUid,
    target: `User UID: ${uid} (${existingData.email || 'User'})`,
    details: `Role updated from ${existingData.role || 'customer'} to ${targetRole.toUpperCase()}`,
    actorEmail: currentAdminEmail,
  });

  return true;
}

/**
 * Approve a user or agent in Cloud Firestore with security safeguards.
 * @param {string} uid User UID
 * @param {Object} [options={}]
 * @param {'agent' | 'customer' | 'user'} [options.approvalType='user']
 * @param {string} [options.notes='']
 * @param {Object} [options.adminUser=null]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function approveFirestoreUserOrAgent(uid, { approvalType = 'user', notes = '', adminUser = null } = {}) {
  if (!isFirebaseConfigured || !db || !uid) {
    throw new Error('Firebase configuration or user UID missing.');
  }

  const currentAdminEmail = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const currentAdminUid = adminUser?.uid || auth?.currentUser?.uid || '';
  const nowIso = new Date().toISOString();
  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('User record does not exist in Cloud Firestore.');
  }
  const existing = snap.data();

  const userUpdate = {
    updatedAt: nowIso,
    accountStatus: 'active',
    status: 'active',
    approvedAt: nowIso,
    approvedBy: currentAdminEmail,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    suspensionReason: null,
    suspendedAt: null,
    suspendedBy: null,
  };

  if (approvalType === 'agent') {
    userUpdate.role = 'agent';
    userUpdate.advisorStatus = 'approved';
    if (notes?.trim()) {
      userUpdate.approvalNotes = notes.trim();
    }

    // Also synchronize advisorApplications/{uid} if present
    try {
      const appDocRef = doc(db, 'advisorApplications', uid);
      const appSnap = await getDoc(appDocRef);
      if (appSnap.exists()) {
        await updateDoc(appDocRef, {
          status: 'approved',
          reviewedAt: nowIso,
          reviewedBy: currentAdminEmail,
          reviewNotes: notes?.trim() || 'Approved by Administrator',
          updatedAt: nowIso,
        });
      }
    } catch (appErr) {
      console.warn('[AdminFirestoreService] Could not sync advisorApplications doc:', appErr);
    }

    await updateDoc(userDocRef, userUpdate);

    await logFirestoreAdminAction({
      action: 'AGENT_APPROVED',
      adminUid: currentAdminUid,
      actorEmail: currentAdminEmail,
      target: `User UID: ${uid} (${existing.email || 'User'})`,
      details: `Approved as Accredited Agent. Notes: ${notes?.trim() || 'None'}`,
    });

    return { success: true, message: `Successfully approved ${existing.name || existing.email} as an Accredited Agent.` };
  } else {
    // Approve user / customer account
    if (notes?.trim()) {
      userUpdate.approvalNotes = notes.trim();
    }
    await updateDoc(userDocRef, userUpdate);

    await logFirestoreAdminAction({
      action: 'USER_APPROVED',
      adminUid: currentAdminUid,
      actorEmail: currentAdminEmail,
      target: `User UID: ${uid} (${existing.email || 'User'})`,
      details: `User account approved/reactivated. Notes: ${notes?.trim() || 'None'}`,
    });

    return { success: true, message: `Successfully approved user account for ${existing.name || existing.email}.` };
  }
}

/**
 * Reject a user or agent in Cloud Firestore with security safeguards.
 * @param {string} uid User UID
 * @param {Object} [options={}]
 * @param {'agent' | 'customer' | 'user'} [options.rejectionType='user']
 * @param {string} [options.reason=''] Mandatory rejection reason
 * @param {Object} [options.adminUser=null]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function rejectFirestoreUserOrAgent(uid, { rejectionType = 'user', reason = '', adminUser = null } = {}) {
  if (!isFirebaseConfigured || !db || !uid) {
    throw new Error('Firebase configuration or user UID missing.');
  }

  const currentAdminEmail = adminUser?.email || auth?.currentUser?.email || 'Administrator';
  const currentAdminUid = adminUser?.uid || auth?.currentUser?.uid || '';
  const nowIso = new Date().toISOString();

  // Safeguard: cannot reject yourself
  if (currentAdminUid && uid === currentAdminUid) {
    throw new Error('Security Policy Violation: You cannot reject or suspend your own administrator account.');
  }

  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('User record does not exist in Cloud Firestore.');
  }
  const existing = snap.data();

  // Safeguard: cannot reject last system administrator
  if (existing.role === 'admin') {
    const usersColl = collection(db, 'users');
    const adminQuery = query(usersColl, where('role', '==', 'admin'));
    const adminSnap = await getDocs(adminQuery);
    const activeAdmins = adminSnap.docs.filter((d) => d.id !== uid && d.data().accountStatus !== 'suspended' && d.data().accountStatus !== 'rejected');
    if (activeAdmins.length === 0) {
      throw new Error('Security Policy Violation: Cannot reject or suspend the last remaining active System Administrator on the platform.');
    }
  }

  const reasonTrimmed = (reason || '').trim() || 'Rejected by Administrator';

  if (rejectionType === 'agent') {
    // Reject agent accreditation: demote role to customer, set advisorStatus to rejected
    const userUpdate = {
      role: 'customer',
      advisorStatus: 'rejected',
      rejectedAt: nowIso,
      rejectedBy: currentAdminEmail,
      rejectionReason: reasonTrimmed,
      updatedAt: nowIso,
    };

    // Also synchronize advisorApplications/{uid}
    try {
      const appDocRef = doc(db, 'advisorApplications', uid);
      const appSnap = await getDoc(appDocRef);
      if (appSnap.exists()) {
        await updateDoc(appDocRef, {
          status: 'rejected',
          reviewedAt: nowIso,
          reviewedBy: currentAdminEmail,
          reviewNotes: reasonTrimmed,
          updatedAt: nowIso,
        });
      }
    } catch (appErr) {
      console.warn('[AdminFirestoreService] Could not sync advisorApplications doc:', appErr);
    }

    await updateDoc(userDocRef, userUpdate);

    await logFirestoreAdminAction({
      action: 'AGENT_REJECTED',
      adminUid: currentAdminUid,
      actorEmail: currentAdminEmail,
      target: `User UID: ${uid} (${existing.email || 'User'})`,
      reason: reasonTrimmed,
      details: `Agent accreditation rejected. Demoted to customer. Reason: "${reasonTrimmed}"`,
    });

    return { success: true, message: `Successfully rejected Agent accreditation for ${existing.name || existing.email}.` };
  } else {
    // Reject user account: marks accountStatus as rejected
    const userUpdate = {
      accountStatus: 'rejected',
      status: 'rejected',
      rejectedAt: nowIso,
      rejectedBy: currentAdminEmail,
      rejectionReason: reasonTrimmed,
      suspensionReason: reasonTrimmed,
      updatedAt: nowIso,
    };

    await updateDoc(userDocRef, userUpdate);

    await logFirestoreAdminAction({
      action: 'USER_REJECTED',
      adminUid: currentAdminUid,
      actorEmail: currentAdminEmail,
      target: `User UID: ${uid} (${existing.email || 'User'})`,
      reason: reasonTrimmed,
      details: `User account rejected. Reason: "${reasonTrimmed}"`,
    });

    return { success: true, message: `Successfully rejected user account for ${existing.name || existing.email}.` };
  }
}

// ========================================================
// 5. CLIENT INQUIRIES & CONCIERGE LEADS
// ========================================================

/**
/**
 * Fetch all approved advisors available for inquiry assignment
 * @returns {Promise<Array>} List of approved advisors
 */
export async function getFirestoreApprovedAdvisors() {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    return [];
  }

  try {
    const usersColl = collection(db, 'users');
    const snapshot = await getDocs(usersColl);
    const advisors = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const isApproved =
        (data.role === 'agent' || data.advisorStatus === 'approved') &&
        data.accountStatus !== 'suspended' &&
        data.accountStatus !== 'rejected' &&
        data.status !== 'suspended' &&
        data.status !== 'rejected';

      if (isApproved) {
        advisors.push({
          uid: data.uid || docSnap.id,
          name: data.name || data.displayName || 'Advisor',
          email: data.email || '',
          agency: data.agency || data.company || 'Independent Advisor',
          phone: data.phone || '',
        });
      }
    });

    advisors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return advisors;
  } catch (err) {
    console.error('[AdminFirestoreService] Failed to load approved advisors:', err);
    return [];
  }
}

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
        propertyTitle: data.propertyTitle || (data.subject ? `Subject: ${data.subject}` : 'General Concierge Inquiry'),
        propertyId: data.propertyId || null,
        subject: data.subject || '',
        advisorUid: data.advisorUid || '',
        assignedAgentName: data.assignedAgentName || '',
        message: data.message || '',
        agentNotes: data.agentNotes || data.notes || '',
        adminNotes: data.adminNotes || '',
        source: data.source || (data.propertyId ? 'property_inquiry' : 'contact_form'),
        date: data.createdAt || data.date || new Date().toISOString(),
        createdAt: data.createdAt || data.date || new Date().toISOString(),
        updatedAt: data.updatedAt || null,
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
          (i.clientName || '').toLowerCase().includes(q) ||
          (i.clientEmail || '').toLowerCase().includes(q) ||
          (i.propertyTitle || '').toLowerCase().includes(q) ||
          (i.message || '').toLowerCase().includes(q) ||
          (i.assignedAgentName || '').toLowerCase().includes(q)
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
          propertyTitle: data.propertyTitle || (data.subject ? `Subject: ${data.subject}` : 'General Concierge Inquiry'),
          propertyId: data.propertyId || null,
          subject: data.subject || '',
          advisorUid: data.advisorUid || '',
          assignedAgentName: data.assignedAgentName || '',
          message: data.message || '',
          agentNotes: data.agentNotes || data.notes || '',
          adminNotes: data.adminNotes || '',
          source: data.source || (data.propertyId ? 'property_inquiry' : 'contact_form'),
          date: data.createdAt || data.date || new Date().toISOString(),
          createdAt: data.createdAt || data.date || new Date().toISOString(),
          updatedAt: data.updatedAt || null,
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
            (i.clientName || '').toLowerCase().includes(q) ||
            (i.clientEmail || '').toLowerCase().includes(q) ||
            (i.propertyTitle || '').toLowerCase().includes(q) ||
            (i.message || '').toLowerCase().includes(q) ||
            (i.assignedAgentName || '').toLowerCase().includes(q)
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
 * Update an inquiry's status in Cloud Firestore (Preserves advisor and admin notes)
 * @param {string} id Inquiry document ID
 * @param {string} newStatus ('new' | 'contacted' | 'closed')
 * @param {string} [adminEmail=''] Reviewer/administrator email
 * @returns {Promise<boolean>}
 */
export async function updateFirestoreInquiryStatus(id, newStatus, adminEmail = '') {
  if (!isFirebaseConfigured || !db || !id) return false;

  const target = newStatus === 'resolved' ? 'closed' : newStatus;
  const inqRef = doc(db, 'inquiries', id);
  const payload = {
    status: target,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(inqRef, payload);

  const actor = adminEmail || auth?.currentUser?.email || 'Administrator';
  await logFirestoreAdminAction({
    action: 'INQUIRY_STATUS_UPDATED',
    target: `Inquiry ID: ${id}`,
    details: `Status set to ${target}`,
    actorEmail: actor,
  });

  return true;
}

/**
 * Update administrative follow-up notes on an inquiry (Preserves agent notes and status)
 * @param {string} id Inquiry document ID
 * @param {string} adminNotes Internal notes from administrator
 * @param {string} [adminEmail='']
 * @returns {Promise<boolean>}
 */
export async function updateFirestoreInquiryAdminNotes(id, adminNotes = '', adminEmail = '') {
  if (!isFirebaseConfigured || !db || !id) return false;

  const inqRef = doc(db, 'inquiries', id);
  const nowIso = new Date().toISOString();
  const payload = {
    adminNotes: (adminNotes || '').trim(),
    adminNotesUpdatedAt: nowIso,
    updatedAt: nowIso,
  };

  await updateDoc(inqRef, payload);

  const actor = adminEmail || auth?.currentUser?.email || 'Administrator';
  await logFirestoreAdminAction({
    action: 'INQUIRY_ADMIN_NOTES_UPDATED',
    target: `Inquiry ID: ${id}`,
    details: 'Updated administrative follow-up notes',
    actorEmail: actor,
  });

  return true;
}

/**
 * Update customer-visible note and resolution update on an inquiry.
 * This is the update visible to the customer on their private My Inquiries portal.
 * Internal admin notes and advisor notes are completely preserved.
 *
 * @param {string} id Inquiry document ID
 * @param {string} customerVisibleNote Message intended for the client
 * @param {string} [adminEmail=''] Reviewing administrator email
 * @param {string} [optionalStatus=''] Optional status change ('contacted' | 'closed')
 * @returns {Promise<boolean>}
 */
export async function updateFirestoreInquiryCustomerNote(id, customerVisibleNote = '', adminEmail = '', optionalStatus = '') {
  if (!isFirebaseConfigured || !db || !id) return false;

  const inqRef = doc(db, 'inquiries', id);
  const nowIso = new Date().toISOString();
  const payload = {
    customerVisibleNote: (customerVisibleNote || '').trim(),
    customerVisibleNoteUpdatedAt: nowIso,
    customerVisibleNoteUpdatedByRole: 'admin',
    customerVisibleNoteUpdatedByName: 'EstateVista Concierge Desk',
    updatedAt: nowIso,
  };

  if (optionalStatus && ['new', 'contacted', 'closed', 'resolved'].includes(optionalStatus)) {
    payload.status = optionalStatus === 'resolved' ? 'closed' : optionalStatus;
  }

  await updateDoc(inqRef, payload);

  const actor = adminEmail || auth?.currentUser?.email || 'Administrator';
  await logFirestoreAdminAction({
    action: 'INQUIRY_CUSTOMER_NOTE_UPDATED',
    target: `Inquiry ID: ${id}`,
    details: `Updated customer-visible note${optionalStatus ? ` with status '${payload.status}'` : ''}`,
    actorEmail: actor,
  });

  return true;
}

/**
 * Assign or reassign an inquiry to an approved advisor
 * @param {string} id Inquiry document ID
 * @param {string} advisorUid Selected advisor's UID (or empty string to unassign)
 * @param {string} [advisorName=''] Advisor display name
 * @param {string} [adminEmail='']
 * @returns {Promise<boolean>}
 */
export async function assignFirestoreInquiryAdvisor(id, advisorUid = '', advisorName = '', adminEmail = '') {
  if (!isFirebaseConfigured || !db || !id) return false;

  const inqRef = doc(db, 'inquiries', id);
  const nowIso = new Date().toISOString();
  const payload = {
    advisorUid: advisorUid || '',
    assignedAgentName: advisorName || '',
    updatedAt: nowIso,
  };

  await updateDoc(inqRef, payload);

  const actor = adminEmail || auth?.currentUser?.email || 'Administrator';
  await logFirestoreAdminAction({
    action: advisorUid ? 'INQUIRY_ASSIGNED' : 'INQUIRY_UNASSIGNED',
    target: `Inquiry ID: ${id}`,
    details: advisorUid
      ? `Assigned to advisor: ${advisorName || 'Advisor'} (${advisorUid})`
      : 'Unassigned inquiry from advisor',
    actorEmail: actor,
  });

  return true;
}

/**
 * Permanently delete an inquiry from Cloud Firestore
 * @param {string} id 
 * @param {string} [adminEmail='']
 * @returns {Promise<boolean>}
 */
export async function deleteFirestoreInquiry(id, adminEmail = '') {
  if (!isFirebaseConfigured || !db || !id) return false;

  const inqRef = doc(db, 'inquiries', id);
  await deleteDoc(inqRef);

  const actor = adminEmail || auth?.currentUser?.email || 'Administrator';
  await logFirestoreAdminAction({
    action: 'INQUIRY_DELETED',
    target: `Inquiry ID: ${id}`,
    details: 'Permanently removed inquiry from Cloud Firestore.',
    actorEmail: actor,
  });

  return true;
}

// ========================================================
// 6. GOVERNANCE AUDIT LOGGING & SETTINGS
// ========================================================

/**
 * Record an administrative action into Cloud Firestore
 * @param {Object} logParams { action, target, details, actorEmail, adminUid, propertyId, previousStatus, newStatus, reason }
 */
export async function logFirestoreAdminAction({
  action,
  target,
  details,
  actorEmail,
  adminUid = '',
  propertyId = '',
  previousStatus = '',
  newStatus = '',
  reason = '',
}) {
  if (!isFirebaseConfigured || !db) return;

  try {
    const auditColl = collection(db, 'auditLogs');
    const currentUid = adminUid || auth?.currentUser?.uid || 'admin_console';
    const currentEmail = actorEmail || auth?.currentUser?.email || 'Administrator';
    const nowIso = new Date().toISOString();

    await addDoc(auditColl, {
      action,
      adminUid: currentUid,
      actorEmail: currentEmail,
      adminEmail: currentEmail,
      propertyId: propertyId || '',
      previousStatus: previousStatus || '',
      newStatus: newStatus || '',
      reason: reason || '',
      target: target || (propertyId ? `Property ID: ${propertyId}` : 'Administrative System'),
      details: details || '',
      timestamp: nowIso,
      ip: '127.0.0.1 (Authorized Admin Console)',
    });
  } catch (err) {
    // Audit logging is non-blocking to primary administrative actions
    console.warn('[AdminFirestoreService] Failed to record audit log:', err);
  }
}

/**
 * Fetch administrative governance audit logs from Cloud Firestore using server-side ordering.
 * Gracefully handles query and missing-index errors with unindexed fallback, and reports query state.
 * @param {number} [limitCount=50] 
 * @returns {Promise<Array>} Array of audit log records with attached .queryError and .isComplete metadata
 */
export async function getFirestoreAdminAuditLogs(limitCount = 50) {
  if (!isFirebaseConfigured || !db) {
    const empty = [];
    empty.queryError = {
      code: 'not_configured',
      message: 'Cloud Firestore is not configured in .env.local.',
      type: 'config_error',
    };
    empty.isComplete = false;
    return empty;
  }

  if (!auth?.currentUser) {
    const empty = [];
    empty.queryError = {
      code: 'unauthenticated',
      message: 'Active administrator authentication session is missing.',
      type: 'auth_error',
    };
    empty.isComplete = false;
    return empty;
  }

  const auditColl = collection(db, 'auditLogs');
  let snapshot = null;
  let queryError = null;

  try {
    // 1. Primary server-side ordered query on actual timestamp field
    const orderedQuery = query(auditColl, orderBy('timestamp', 'desc'), limit(limitCount));
    snapshot = await getDocs(orderedQuery);
  } catch (primaryErr) {
    console.warn('[AdminFirestoreService] Server-side ordered query on /auditLogs failed, attempting fallback query:', primaryErr);
    queryError = parseFirestoreError(primaryErr);

    try {
      // 2. Fallback query if server-side ordering index is building or fails
      const fallbackQuery = query(auditColl, limit(limitCount));
      snapshot = await getDocs(fallbackQuery);
    } catch (fallbackErr) {
      console.error('[AdminFirestoreService] All audit log queries failed:', fallbackErr);
      const failed = [];
      failed.queryError = parseFirestoreError(fallbackErr);
      failed.isComplete = false;
      return failed;
    }
  }

  const logs = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    logs.push({
      id: docSnap.id,
      ...data,
      timestamp: data.timestamp || data.createdAt || null,
      action: data.action || 'ADMIN_ACTION',
      target: data.target || 'System',
      actorEmail: data.actorEmail || 'Administrator',
      ip: data.ip || '127.0.0.1 (Authorized Console)',
      details: data.details || '—',
    });
  });

  // Client-side sort guarantees newest first even if fallback query was used or records have varied timestamp formats
  logs.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  logs.queryError = queryError;
  logs.isComplete = queryError === null;
  return logs;
}

/**
 * Persist administrator console preferences in Cloud Firestore.
 * Safely updates only the `adminPreferences` field without modifying or overwriting profile fields.
 * @param {string} uid Administrator UID
 * @param {Object} prefs { currencyFormat, pageSize }
 * @returns {Promise<boolean>}
 */
export async function updateFirestoreAdminPreferences(uid, prefs) {
  if (!isFirebaseConfigured || !db || !uid) return false;

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      adminPreferences: prefs,
      updatedAt: new Date().toISOString(),
    });

    await logFirestoreAdminAction({
      action: 'ADMIN_PREFERENCES_UPDATED',
      target: `User UID: ${uid}`,
      details: `Saved preferences: ${JSON.stringify(prefs)}`,
      actorEmail: auth?.currentUser?.email || 'Administrator',
    });

    return true;
  } catch (err) {
    console.warn('[AdminFirestoreService] Failed to persist admin preferences in Firestore:', err);
    return false;
  }
}
