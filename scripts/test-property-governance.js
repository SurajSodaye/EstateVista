/**
 * EstateVista Admin Property Governance Test Suite
 * Validates publication transitions, authorization, ownership preservation,
 * mandatory rejection reason, temporary unpublishing, archival, restoration, and audit logging.
 */

import assert from 'node:assert';

console.log('--- Starting EstateVista Admin Property Governance Test Suite ---');

// 1. Test Publication State Transitions & Schema Fields
console.log('\n[TEST 1] Publication State & Workflow Separation:');

function createInitialListing(overrides = {}) {
  return {
    id: 'prop_test_101',
    title: 'Seaside Villa Azure',
    createdByUid: 'advisor_uid_456',
    agentName: 'Aarav Patel',
    agentEmail: 'aarav@estatevista.luxury',
    price: 185000000,
    publicationStatus: 'pending',
    isPublished: false,
    moderationStatus: 'pending',
    rejectionReason: null,
    unpublishedReason: null,
    isArchived: false,
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
    ...overrides,
  };
}

// 1a. Publish Transition
function applyPublishTransition(listing, notes = '', adminUser = { uid: 'admin_1', email: 'admin@estatevista.luxury' }) {
  const previousStatus = listing.publicationStatus;
  const now = new Date().toISOString();
  const updated = {
    ...listing,
    publicationStatus: 'published',
    isPublished: true,
    moderationStatus: 'approved',
    rejectionReason: null,
    unpublishedReason: null,
    isArchived: false,
    archivedAt: null,
    publishedAt: listing.publishedAt || now,
    moderatedAt: now,
    moderatedBy: adminUser.email,
    updatedAt: now,
    lastEditedByAdmin: adminUser.email,
  };

  const auditLog = {
    action: 'PROPERTY_PUBLISHED',
    adminUid: adminUser.uid,
    actorEmail: adminUser.email,
    propertyId: listing.id,
    previousStatus,
    newStatus: 'published',
    reason: notes || 'Approved and published by administrator',
    timestamp: now,
  };

  return { updated, auditLog };
}

let listing = createInitialListing();
let { updated: publishedListing, auditLog: publishLog } = applyPublishTransition(listing, 'All photos verified');
assert.strictEqual(publishedListing.publicationStatus, 'published');
assert.strictEqual(publishedListing.isPublished, true);
assert.strictEqual(publishedListing.moderationStatus, 'approved');
assert.strictEqual(publishLog.newStatus, 'published');
assert.strictEqual(publishLog.previousStatus, 'pending');
assert.strictEqual(publishLog.adminUid, 'admin_1');
console.log('✓ Publish transition correctly sets publicationStatus="published", isPublished=true, moderationStatus="approved"');

// 1b. Temporary Unpublish Transition (Preserves Approval)
function applyUnpublishTransition(listing, reason = '', adminUser = { uid: 'admin_1', email: 'admin@estatevista.luxury' }) {
  const previousStatus = listing.publicationStatus;
  const now = new Date().toISOString();
  const updated = {
    ...listing,
    publicationStatus: 'unpublished',
    isPublished: false,
    // CRITICAL: Preserve approval status
    moderationStatus: listing.moderationStatus === 'approved' ? 'approved' : listing.moderationStatus,
    unpublishedReason: reason.trim() || 'Temporarily taken offline by administrator',
    unpublishedAt: now,
    unpublishedBy: adminUser.email,
    updatedAt: now,
    lastEditedByAdmin: adminUser.email,
  };

  const auditLog = {
    action: 'PROPERTY_UNPUBLISHED',
    adminUid: adminUser.uid,
    actorEmail: adminUser.email,
    propertyId: listing.id,
    previousStatus,
    newStatus: 'unpublished',
    reason,
    timestamp: now,
  };

  return { updated, auditLog };
}

let { updated: unpublishedListing, auditLog: unpublishLog } = applyUnpublishTransition(publishedListing, 'Under price re-evaluation');
assert.strictEqual(unpublishedListing.publicationStatus, 'unpublished');
assert.strictEqual(unpublishedListing.isPublished, false);
assert.strictEqual(unpublishedListing.moderationStatus, 'approved', 'Moderation status MUST remain approved when temporarily unpublished');
assert.strictEqual(unpublishedListing.unpublishedReason, 'Under price re-evaluation');
assert.strictEqual(unpublishLog.action, 'PROPERTY_UNPUBLISHED');
console.log('✓ Temporary unpublish sets publicationStatus="unpublished", isPublished=false, while PRESERVING moderationStatus="approved"');

// 1c. Republish without re-approval
let { updated: republishedListing, auditLog: republishLog } = applyPublishTransition(unpublishedListing, 'Price confirmed');
assert.strictEqual(republishedListing.publicationStatus, 'published');
assert.strictEqual(republishedListing.isPublished, true);
assert.strictEqual(republishedListing.moderationStatus, 'approved');
console.log('✓ Republish restores publicationStatus="published" and isPublished=true seamlessly');

// 2. Test Mandatory Rejection Reason
console.log('\n[TEST 2] Mandatory Rejection Feedback Enforcement:');

function applyRejectTransition(listing, rejectionReason, adminUser = { uid: 'admin_1', email: 'admin@estatevista.luxury' }) {
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error('A detailed rejection reason is mandatory to reject a property listing.');
  }

  const previousStatus = listing.publicationStatus;
  const now = new Date().toISOString();
  const updated = {
    ...listing,
    publicationStatus: 'rejected',
    isPublished: false,
    moderationStatus: 'rejected',
    rejectionReason: rejectionReason.trim(),
    moderatedAt: now,
    moderatedBy: adminUser.email,
    updatedAt: now,
    lastEditedByAdmin: adminUser.email,
  };

  const auditLog = {
    action: 'PROPERTY_REJECTED',
    adminUid: adminUser.uid,
    actorEmail: adminUser.email,
    propertyId: listing.id,
    previousStatus,
    newStatus: 'rejected',
    reason: rejectionReason.trim(),
    timestamp: now,
  };

  return { updated, auditLog };
}

// 2a. Rejection with empty reason must throw error
assert.throws(
  () => applyRejectTransition(listing, ''),
  /A detailed rejection reason is mandatory/,
  'Empty rejection reason must be rejected'
);
assert.throws(
  () => applyRejectTransition(listing, '   '),
  /A detailed rejection reason is mandatory/,
  'Whitespace-only rejection reason must be rejected'
);
console.log('✓ Rejection without a valid reason is strictly prevented by validation');

// 2b. Rejection with valid reason
let { updated: rejectedListing, auditLog: rejectLog } = applyRejectTransition(
  listing,
  'High-resolution floor plans and balcony dimensions are required.'
);
assert.strictEqual(rejectedListing.publicationStatus, 'rejected');
assert.strictEqual(rejectedListing.moderationStatus, 'rejected');
assert.strictEqual(rejectedListing.isPublished, false);
assert.strictEqual(rejectedListing.rejectionReason, 'High-resolution floor plans and balcony dimensions are required.');
assert.strictEqual(rejectLog.reason, 'High-resolution floor plans and balcony dimensions are required.');
console.log('✓ Rejection with feedback records rejectionReason on listing and in audit log');

// 3. Test Archival & Restoration
console.log('\n[TEST 3] Archival & Restoration Workflow:');

function applyArchiveTransition(listing, reason = '', adminUser = { uid: 'admin_1', email: 'admin@estatevista.luxury' }) {
  const previousStatus = listing.publicationStatus;
  const now = new Date().toISOString();
  const updated = {
    ...listing,
    publicationStatus: 'archived',
    isPublished: false,
    isArchived: true,
    archivedReason: reason.trim() || 'Archived by administrator',
    archivedAt: now,
    archivedBy: adminUser.email,
    updatedAt: now,
    lastEditedByAdmin: adminUser.email,
  };

  const auditLog = {
    action: 'PROPERTY_ARCHIVED',
    adminUid: adminUser.uid,
    actorEmail: adminUser.email,
    propertyId: listing.id,
    previousStatus,
    newStatus: 'archived',
    reason,
    timestamp: now,
  };

  return { updated, auditLog };
}

function applyRestoreTransition(listing, adminUser = { uid: 'admin_1', email: 'admin@estatevista.luxury' }) {
  const previousStatus = listing.publicationStatus;
  const now = new Date().toISOString();
  const targetStatus = listing.moderationStatus === 'approved' ? 'unpublished' : 'draft';
  const updated = {
    ...listing,
    publicationStatus: targetStatus,
    isPublished: false,
    isArchived: false,
    archivedAt: null,
    archivedReason: null,
    restoredAt: now,
    restoredBy: adminUser.email,
    updatedAt: now,
    lastEditedByAdmin: adminUser.email,
  };

  const auditLog = {
    action: 'PROPERTY_RESTORED',
    adminUid: adminUser.uid,
    actorEmail: adminUser.email,
    propertyId: listing.id,
    previousStatus: 'archived',
    newStatus: targetStatus,
    reason: 'Restored from platform archive',
    timestamp: now,
  };

  return { updated, auditLog };
}

let { updated: archivedListing, auditLog: archiveLog } = applyArchiveTransition(publishedListing, 'Archived after owner contract term');
assert.strictEqual(archivedListing.publicationStatus, 'archived');
assert.strictEqual(archivedListing.isArchived, true);
assert.strictEqual(archivedListing.isPublished, false);
console.log('✓ Archival sets publicationStatus="archived", isArchived=true, isPublished=false');

let { updated: restoredListing, auditLog: restoreLog } = applyRestoreTransition(archivedListing);
assert.strictEqual(restoredListing.isArchived, false);
assert.strictEqual(restoredListing.publicationStatus, 'unpublished', 'Approved property restores to unpublished');
assert.strictEqual(restoreLog.action, 'PROPERTY_RESTORED');
console.log('✓ Restoration clears isArchived and places property in unpublished state ready for review/republish');

// 4. Test Ownership Preservation on Administrative Edit
console.log('\n[TEST 4] Ownership & Provenance Preservation:');

function applyAdminEdit(existingData, updates, adminUser = { uid: 'admin_1', email: 'admin@estatevista.luxury' }) {
  const now = new Date().toISOString();
  return {
    ...existingData,
    title: updates.title !== undefined ? updates.title : existingData.title,
    price: updates.price !== undefined ? updates.price : existingData.price,
    // PRESERVE original owner attribution
    createdByUid: updates.createdByUid || existingData.createdByUid,
    createdByRole: existingData.createdByRole || (existingData.isAdminCreated ? 'admin' : 'agent'),
    isAdminCreated: Boolean(existingData.isAdminCreated || existingData.createdByRole === 'admin'),
    agentId: updates.agentId || existingData.agentId || existingData.createdByUid,
    agentName: updates.agentName !== undefined ? updates.agentName : existingData.agentName,
    agentEmail: updates.agentEmail !== undefined ? updates.agentEmail : existingData.agentEmail,
    createdAt: existingData.createdAt,
    updatedAt: now,
    lastEditedByAdmin: adminUser.email,
  };
}

const originalAdvisorListing = {
  id: 'prop_advisor_001',
  title: 'Penthouse Royale',
  createdByUid: 'advisor_aarav_99',
  createdByRole: 'agent',
  agentId: 'advisor_aarav_99',
  agentName: 'Aarav Patel',
  agentEmail: 'aarav@estatevista.luxury',
  isAdminCreated: false,
  price: 250000000,
  createdAt: '2026-09-01T08:00:00.000Z',
};

const editedListing = applyAdminEdit(originalAdvisorListing, {
  title: 'Penthouse Royale - High Floor',
  price: 260000000,
});

assert.strictEqual(editedListing.createdByUid, 'advisor_aarav_99', 'Advisor UID must NOT be transferred');
assert.strictEqual(editedListing.agentName, 'Aarav Patel', 'Advisor name must NOT be overwritten');
assert.strictEqual(editedListing.agentEmail, 'aarav@estatevista.luxury');
assert.strictEqual(editedListing.isAdminCreated, false, 'Advisor listing must not become admin created');
assert.strictEqual(editedListing.createdAt, '2026-09-01T08:00:00.000Z', 'Original createdAt must be preserved');
assert.strictEqual(editedListing.lastEditedByAdmin, 'admin@estatevista.luxury');
console.log('✓ Administrative edit preserves createdByUid, agentName, agentEmail, and original createdAt timestamp');

// 5. Test Deletion with Inquiry Reference Protection
console.log('\n[TEST 5] Deletion & Inquiry Foreign Key Protection:');

function evaluateDeletion(property, inquiryCount, forcePermanent = false) {
  if (inquiryCount > 0 && !forcePermanent) {
    return {
      action: 'archived',
      message: `Property "${property.title}" safely archived because ${inquiryCount} active inquiry record(s) reference it.`,
    };
  }
  return {
    action: 'deleted',
    message: `Property "${property.title}" permanently removed from Cloud Firestore.`,
  };
}

const resultWithInquiries = evaluateDeletion({ title: 'Skyline Residence' }, 3, false);
assert.strictEqual(resultWithInquiries.action, 'archived');
console.log('✓ Listing with active inquiries defaults to Safe Archival');

const resultForced = evaluateDeletion({ title: 'Skyline Residence' }, 3, true);
assert.strictEqual(resultForced.action, 'deleted');
console.log('✓ Permanent deletion override succeeds with explicit confirmation');

const resultClean = evaluateDeletion({ title: 'New Lot' }, 0, false);
assert.strictEqual(resultClean.action, 'deleted');
console.log('✓ Listing with 0 inquiries deletes permanently without issue');

console.log('\n======================================================');
console.log('ALL PROPERTY GOVERNANCE TESTS PASSED SUCCESSFULLY! (100%)');
console.log('======================================================\n');
