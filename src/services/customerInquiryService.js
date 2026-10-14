import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase.js';
import { DEMO_PROPERTIES } from '../data/properties.js';

/**
 * Enriches an inquiry document with property metadata (thumbnail, location, price)
 * from the demonstration properties catalog or listing reference.
 * @param {Object} inquiry
 * @returns {Object}
 */
export function enrichInquiryWithProperty(inquiry) {
  if (!inquiry) return inquiry;

  let propertyThumbnail = null;
  let propertyLocation = null;
  let propertyPrice = null;
  let propertyListingType = null;

  if (inquiry.propertyId) {
    const matched = DEMO_PROPERTIES.find(
      (p) => String(p.id) === String(inquiry.propertyId)
    );

    if (matched) {
      propertyThumbnail = matched.imageUrls?.[0] || null;
      propertyLocation = matched.location || `${matched.locality || ''}, ${matched.city || ''}`;
      propertyPrice = matched.price || null;
      propertyListingType = matched.listingType || null;
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
 * Normalizes raw Firestore inquiry document data to consistent schema
 * @param {string} id
 * @param {Object} data
 * @returns {Object}
 */
function normalizeInquiryDoc(id, data) {
  const createdAt = data.createdAt || data.date || new Date().toISOString();
  return {
    id,
    customerUid: data.customerUid || '',
    clientName: data.clientName || data.name || 'Member',
    clientEmail: data.clientEmail || data.senderEmail || '',
    clientPhone: data.clientPhone || data.phone || '',
    propertyId: data.propertyId || null,
    propertyTitle: data.propertyTitle || (data.subject ? `Subject: ${data.subject}` : 'General Concierge Inquiry'),
    subject: data.subject || '',
    message: data.message || '',
    status: data.status || 'new',
    assignedAgentName: data.assignedAgentName || '',
    source: data.source || (data.propertyId ? 'property_inquiry' : 'contact_form'),
    createdAt,
    updatedAt: data.updatedAt || createdAt,
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
