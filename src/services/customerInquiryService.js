import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase.js';
import { DEMO_PROPERTIES } from '../data/properties.js';

/**
 * Parses any Firestore timestamp representation (Timestamp object, seconds, ISO string, Date)
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
 * Normalizes raw Firestore inquiry document data to a consistent, strongly typed schema
 * @param {string} id
 * @param {Object} data
 * @returns {Object}
 */
export function normalizeInquiryDoc(id, data = {}) {
  const createdAt = parseTimestampToIso(data.createdAt || data.date);
  const updatedAt = parseTimestampToIso(data.updatedAt || data.createdAt || data.date);
  const isGeneral = !data.propertyId || data.source === 'contact_form';

  return {
    id,
    customerUid: data.customerUid || '',
    clientName: data.clientName || data.name || 'Member',
    clientEmail: data.clientEmail || data.senderEmail || '',
    clientPhone: data.clientPhone || data.phone || '',
    propertyId: data.propertyId ? String(data.propertyId) : null,
    propertyTitle: isGeneral
      ? (data.subject ? `General Inquiry: ${data.subject}` : 'General Concierge Inquiry')
      : (data.propertyTitle || data.subject || 'Exclusive Property Listing'),
    subject: data.subject || '',
    message: data.message || '',
    status: (data.status || 'new').toLowerCase(),
    assignedAgentName: data.assignedAgentName || '',
    advisorUid: data.advisorUid || '',
    // Administrative follow-up notes (from platform administrator)
    adminNotes: (data.adminNotes || data.customerVisibleNote || data.adminNote || '').trim(),
    adminNotesUpdatedAt: data.adminNotesUpdatedAt
      ? parseTimestampToIso(data.adminNotesUpdatedAt)
      : (data.customerVisibleNoteUpdatedAt
          ? parseTimestampToIso(data.customerVisibleNoteUpdatedAt)
          : ((data.adminNotes || data.customerVisibleNote) && data.updatedAt
              ? parseTimestampToIso(data.updatedAt)
              : null)),
    // Agent / Advisor notes (from assigned property advisor)
    agentNotes: (data.agentNotes || data.advisorNotes || (!data.adminNotes && data.notes ? data.notes : '') || '').trim(),
    agentNotesUpdatedAt: data.agentNotesUpdatedAt
      ? parseTimestampToIso(data.agentNotesUpdatedAt)
      : (data.notesUpdatedAt
          ? parseTimestampToIso(data.notesUpdatedAt)
          : ((data.agentNotes || data.notes) && data.updatedAt ? parseTimestampToIso(data.updatedAt) : null)),
    source: data.source || (data.propertyId ? 'property_inquiry' : 'contact_form'),
    propertyThumbnail: data.propertyThumbnail || null,
    propertyLocation: data.propertyLocation || null,
    propertyPrice: data.propertyPrice || null,
    propertyListingType: data.propertyListingType || null,
    isGeneral,
    createdAt,
    updatedAt,
  };
}

/**
 * Enriches an inquiry document with property metadata (thumbnail, location, price, listingType)
 * from the stored payload or fallback demonstration properties catalog.
 * @param {Object} inquiry
 * @returns {Object}
 */
export function enrichInquiryWithProperty(inquiry) {
  if (!inquiry) return inquiry;

  let propertyThumbnail = inquiry.propertyThumbnail || null;
  let propertyLocation = inquiry.propertyLocation || null;
  let propertyPrice = inquiry.propertyPrice || null;
  let propertyListingType = inquiry.propertyListingType || null;

  if (inquiry.propertyId) {
    const matched = DEMO_PROPERTIES.find(
      (p) => String(p.id) === String(inquiry.propertyId)
    );

    if (matched) {
      if (!propertyThumbnail) propertyThumbnail = matched.imageUrls?.[0] || null;
      if (!propertyLocation) propertyLocation = matched.location || `${matched.locality || ''}, ${matched.city || ''}`;
      if (!propertyPrice) propertyPrice = matched.price || null;
      if (!propertyListingType) propertyListingType = matched.listingType || null;
    }
  }

  return {
    ...inquiry,
    propertyThumbnail,
    propertyLocation: propertyLocation || (inquiry.propertyId ? 'Verified Luxury Listing' : 'Private Concierge Desk'),
    propertyPrice,
    propertyListingType,
  };
}

/**
 * Fetch all inquiries submitted by a specific authenticated customer
 * @param {string} customerUid - Firebase Auth UID of the customer
 * @returns {Promise<Array>}
 */
export async function getCustomerInquiries(customerUid) {
  if (!isFirebaseConfigured || !db || !customerUid) {
    return [];
  }

  try {
    const q = query(
      collection(db, 'inquiries'),
      where('customerUid', '==', customerUid)
    );

    const snapshot = await getDocs(q);
    const inquiries = [];

    snapshot.forEach((docSnap) => {
      const normalized = normalizeInquiryDoc(docSnap.id, docSnap.data());
      inquiries.push(enrichInquiryWithProperty(normalized));
    });

    // Client-side sort newest first (avoids mandatory composite index requirements)
    inquiries.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return inquiries;
  } catch (err) {
    console.error('[CustomerInquiryService] Error fetching customer inquiries:', err);
    throw err;
  }
}

/**
 * Real-time Firestore subscription to inquiries submitted by the customer
 * @param {string} customerUid - Firebase Auth UID of the customer
 * @param {Function} onData - Callback receiving the updated array of inquiries
 * @param {Function} [onError] - Error callback
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeCustomerInquiries(customerUid, onData, onError) {
  if (!isFirebaseConfigured || !db || !customerUid) {
    if (typeof onData === 'function') onData([]);
    return () => {};
  }

  const q = query(
    collection(db, 'inquiries'),
    where('customerUid', '==', customerUid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const inquiries = [];
      snapshot.forEach((docSnap) => {
        const normalized = normalizeInquiryDoc(docSnap.id, docSnap.data());
        inquiries.push(enrichInquiryWithProperty(normalized));
      });

      inquiries.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      if (typeof onData === 'function') {
        onData(inquiries);
      }
    },
    (err) => {
      console.warn('[CustomerInquiryService] Real-time subscription error:', err);
      if (typeof onError === 'function') {
        onError(err);
      }
    }
  );
}
