/**
 * EstateVista Admin Console Service
 * 
 * ARCHITECTURAL NOTICE:
 * This service manages data for the Executive Admin Portal.
 * Because additional Firestore integration is postponed per project scope:
 * - Read and write mutations are stored in browser localStorage.
 * - Live production collections are neither modified nor overwritten.
 * - When live Firestore integration is approved (Phase 2/3), these functions
 *   will map directly to Firestore collections ('users', 'advisorApplications',
 *   'properties', 'inquiries').
 */

import { DEMO_PROPERTIES } from '../data/properties.js';
import { DEMO_AGENTS } from '../data/agents.js';

const ADMIN_STORAGE_KEYS = {
  APPLICATIONS: 'estatevista_admin_demo_applications_v1',
  PROPERTIES: 'estatevista_admin_demo_properties_v1',
  USERS: 'estatevista_admin_demo_users_v1',
  INQUIRIES: 'estatevista_admin_demo_inquiries_v1',
  AUDIT_LOGS: 'estatevista_admin_demo_audit_v1',
};

// Initial demonstration advisor accreditation applications
const INITIAL_DEMO_APPLICATIONS = [
  {
    id: 'app-101',
    uid: 'agent-1',
    name: 'Arjun Singhania',
    email: 'arjun.singhania@estatevista.demo',
    phone: '+91 98201 44520',
    agency: 'Singhania Luxury Estates',
    licenseNumber: 'RERA/MH/2019/0942',
    experienceYears: 12,
    serviceLocations: ['Mumbai', 'Bandra West', 'Worli', 'Juhu'],
    specialties: ['Luxury Seafront Penthouses', 'Heritage Bungalows', 'High-Net-Worth Advisory'],
    bio: 'Over a decade of ultra-prime residential advisory across South Mumbai and Bandra coastline.',
    status: 'approved',
    submittedAt: '2026-08-14T09:30:00Z',
    reviewedAt: '2026-08-15T14:20:00Z',
    reviewedBy: 'Admin (System)',
    notes: 'Verified against Maharashtra RERA database. Excellent client portfolio.',
  },
  {
    id: 'app-102',
    uid: 'agent-2',
    name: 'Priyanka Nambiar',
    email: 'priyanka.nambiar@estatevista.demo',
    phone: '+91 99450 78120',
    agency: 'Nambiar & Co. Realty',
    licenseNumber: 'RERA/KA/2021/1183',
    experienceYears: 9,
    serviceLocations: ['Bengaluru', 'Indiranagar', 'Koramangala', 'Whitefield'],
    specialties: ['Gated Villa Communities', 'Tech Executive Relocations', 'Eco-architecture'],
    bio: 'Curator of bespoke sustainable villas and boutique penthouses across prime Bengaluru.',
    status: 'approved',
    submittedAt: '2026-09-02T11:15:00Z',
    reviewedAt: '2026-09-03T16:00:00Z',
    reviewedBy: 'Admin (System)',
    notes: 'Karnataka RERA license verified. High reputational references.',
  },
  {
    id: 'app-103',
    uid: 'usr-pending-01',
    name: 'Vikramaditya Roy',
    email: 'vikram.roy@imperialcrown.demo',
    phone: '+91 98204 99182',
    agency: 'Imperial Crown Realty Advisors',
    licenseNumber: 'RERA/MH/2024/7741',
    experienceYears: 14,
    serviceLocations: ['Mumbai', 'Worli Sea Face', 'Malabar Hill', 'Lower Parel'],
    specialties: ['Ultra-Luxury Seafront Towers', 'Corporate Restructuring Real Estate'],
    bio: 'Senior managing partner specializing in off-market transactions exceeding ₹50 Cr along Worli and Malabar Hill.',
    status: 'pending',
    submittedAt: '2026-10-10T14:45:00Z',
    reviewedAt: null,
    reviewedBy: null,
    notes: '',
  },
  {
    id: 'app-104',
    uid: 'usr-pending-02',
    name: 'Meera Kapoor',
    email: 'meera.kapoor@kapoorresidences.demo',
    phone: '+91 98112 34509',
    agency: 'Kapoor Signature Residences',
    licenseNumber: 'RERA/HR/2023/3321',
    experienceYears: 8,
    serviceLocations: ['Delhi NCR', 'Golf Course Road', 'DLF Phase 5', 'Camelia Enclave'],
    specialties: ['Golf Course Condominiums', 'Modern Farmhouses'],
    bio: 'Exclusive mandate advisor for luxury condominium transfers and penthouse acquisitions in Gurugram.',
    status: 'pending',
    submittedAt: '2026-10-11T08:20:00Z',
    reviewedAt: null,
    reviewedBy: null,
    notes: '',
  },
  {
    id: 'app-105',
    uid: 'usr-rejected-01',
    name: 'Devang Shah',
    email: 'devang.shah@fastdealers.demo',
    phone: '+91 98980 12044',
    agency: 'Fast Property Hub',
    licenseNumber: 'RERA/GJ/2025/0019',
    experienceYears: 1,
    serviceLocations: ['Ahmedabad', 'SG Highway'],
    specialties: ['Affordable Mid-segment'],
    bio: 'Independent broker looking to list regional properties.',
    status: 'rejected',
    submittedAt: '2026-09-20T10:00:00Z',
    reviewedAt: '2026-09-21T11:30:00Z',
    reviewedBy: 'Admin (System)',
    notes: 'Does not meet minimum 3-year luxury advisory experience threshold for EstateVista prestige catalogue.',
  },
];

// Initial demonstration properties for admin moderation
const INITIAL_DEMO_PROPERTIES = DEMO_PROPERTIES.map((prop, idx) => ({
  ...prop,
  moderationStatus: idx === 3 ? 'pending_review' : idx === 5 ? 'draft' : 'published',
  viewsCount: 1200 + (idx * 450),
  inquiriesCount: 8 + (idx * 3),
  moderatorNotes: idx === 3 ? 'Awaiting floor plan verification from agent.' : 'Approved for public listing.',
}));

// Initial demonstration user directory
const INITIAL_DEMO_USERS = [
  {
    uid: 'admin-super-01',
    name: 'Devinder Oberoi',
    email: 'admin@estatevista.luxury',
    role: 'admin',
    advisorStatus: 'none',
    phone: '+91 98100 00001',
    joinedAt: '2026-01-01T00:00:00Z',
    lastActive: '2026-10-12T10:30:00Z',
    status: 'active',
  },
  {
    uid: 'agent-1',
    name: 'Arjun Singhania',
    email: 'arjun.singhania@estatevista.demo',
    role: 'agent',
    advisorStatus: 'approved',
    phone: '+91 98201 44520',
    joinedAt: '2026-08-14T09:30:00Z',
    lastActive: '2026-10-12T09:45:00Z',
    status: 'active',
  },
  {
    uid: 'agent-2',
    name: 'Priyanka Nambiar',
    email: 'priyanka.nambiar@estatevista.demo',
    role: 'agent',
    advisorStatus: 'approved',
    phone: '+91 99450 78120',
    joinedAt: '2026-09-02T11:15:00Z',
    lastActive: '2026-10-11T16:20:00Z',
    status: 'active',
  },
  {
    uid: 'usr-pending-01',
    name: 'Vikramaditya Roy',
    email: 'vikram.roy@imperialcrown.demo',
    role: 'customer',
    advisorStatus: 'pending',
    phone: '+91 98204 99182',
    joinedAt: '2026-10-10T14:40:00Z',
    lastActive: '2026-10-12T08:10:00Z',
    status: 'active',
  },
  {
    uid: 'usr-pending-02',
    name: 'Meera Kapoor',
    email: 'meera.kapoor@kapoorresidences.demo',
    role: 'customer',
    advisorStatus: 'pending',
    phone: '+91 98112 34509',
    joinedAt: '2026-10-11T08:15:00Z',
    lastActive: '2026-10-11T19:30:00Z',
    status: 'active',
  },
  {
    uid: 'cust-101',
    name: 'Vikramaditya Oberoi',
    email: 'v.oberoi@investcorp-demo.com',
    role: 'customer',
    advisorStatus: 'none',
    phone: '+91 98200 12345',
    joinedAt: '2026-09-12T15:20:00Z',
    lastActive: '2026-10-12T07:15:00Z',
    status: 'active',
  },
  {
    uid: 'cust-102',
    name: 'Dr. Radhika Srinivasan',
    email: 'radhika.s@cardio-specialists.demo',
    role: 'customer',
    advisorStatus: 'none',
    phone: '+91 99450 67890',
    joinedAt: '2026-09-18T12:00:00Z',
    lastActive: '2026-10-11T14:50:00Z',
    status: 'active',
  },
  {
    uid: 'cust-103',
    name: 'Amitav Mehra',
    email: 'amitav.m@apexventures-demo.com',
    role: 'customer',
    advisorStatus: 'none',
    phone: '+91 98110 54321',
    joinedAt: '2026-10-01T10:10:00Z',
    lastActive: '2026-10-10T11:40:00Z',
    status: 'active',
  },
  {
    uid: 'cust-104',
    name: 'Tanya Sen',
    email: 'tanya.sen@atelier-design.demo',
    role: 'customer',
    advisorStatus: 'none',
    phone: '+91 98300 88219',
    joinedAt: '2026-10-04T16:35:00Z',
    lastActive: '2026-10-09T18:00:00Z',
    status: 'active',
  },
];

// Initial demonstration platform inquiries
const INITIAL_DEMO_INQUIRIES = [
  {
    id: 'inq-admin-1',
    propertyId: 'prop-1',
    propertyTitle: 'The Celestia Sky Villa — Sea-Facing Penthouse',
    propertyLocation: 'Bandra West, Mumbai',
    senderName: 'Vikramaditya Oberoi',
    senderEmail: 'v.oberoi@investcorp-demo.com',
    senderPhone: '+91 98200 12345',
    assignedAgentName: 'Arjun Singhania',
    message: 'Evaluating duplex penthouses for executive relocation. Requesting private walkthrough this Saturday afternoon.',
    createdAt: '2026-10-12T08:30:00Z',
    status: 'new',
    priority: 'high',
  },
  {
    id: 'inq-admin-2',
    propertyId: 'prop-2',
    propertyTitle: 'Serenade Biophilic Villa with Private Zen Courtyard',
    propertyLocation: 'Indiranagar, Bengaluru',
    senderName: 'Dr. Radhika Srinivasan',
    senderEmail: 'radhika.s@cardio-specialists.demo',
    senderPhone: '+91 99450 67890',
    assignedAgentName: 'Priyanka Nambiar',
    message: 'Inquiring regarding eco-specifications and solar power setup. Are maintenance charges documented?',
    createdAt: '2026-10-11T12:00:00Z',
    status: 'contacted',
    priority: 'medium',
  },
  {
    id: 'inq-admin-3',
    propertyId: 'prop-3',
    propertyTitle: 'The Camellias Grand Residence — Golf Vista Suite',
    propertyLocation: 'Golf Course Road, Gurugram',
    senderName: 'Amitav Mehra',
    senderEmail: 'amitav.m@apexventures-demo.com',
    senderPhone: '+91 98110 54321',
    assignedAgentName: 'Kabir Malhotra',
    message: 'Requesting ownership title status, carpet area blueprints, and parking slot assignments.',
    createdAt: '2026-10-10T16:45:00Z',
    status: 'resolved',
    priority: 'high',
  },
  {
    id: 'inq-admin-4',
    propertyId: 'prop-4',
    propertyTitle: 'Palazzo Della Luna — Heritage Portuguese Villa',
    propertyLocation: 'Assagao, North Goa',
    senderName: 'Tanya Sen',
    senderEmail: 'tanya.sen@atelier-design.demo',
    senderPhone: '+91 98300 88219',
    assignedAgentName: 'Ananya Deshmukh',
    message: 'Inquiring about title clearance for heritage structure modifications and swimming pool expansion.',
    createdAt: '2026-10-09T14:15:00Z',
    status: 'archived',
    priority: 'low',
  },
];

// Initial demonstration security audit log
const INITIAL_DEMO_AUDIT = [
  {
    id: 'audit-1',
    timestamp: '2026-10-12T10:15:22Z',
    actorEmail: 'admin@estatevista.luxury',
    action: 'SECURITY_RULES_VERIFY',
    target: 'cloud.firestore/rules_v2',
    details: 'Security rules audited: role elevation blocked, client-side self-approval rejected.',
    ip: '192.168.1.104',
    severity: 'info',
  },
  {
    id: 'audit-2',
    timestamp: '2026-10-11T14:32:00Z',
    actorEmail: 'admin@estatevista.luxury',
    action: 'ADVISOR_APPROVAL',
    target: 'users/agent-2 (Priyanka Nambiar)',
    details: 'Accreditation granted. Karnataka RERA license verified.',
    ip: '192.168.1.104',
    severity: 'notice',
  },
  {
    id: 'audit-3',
    timestamp: '2026-10-10T09:12:44Z',
    actorEmail: 'system-gateway',
    action: 'AUTH_SESSION_RENEW',
    target: 'firebase.auth/session',
    details: 'Administrative token validation check executed successfully.',
    ip: '127.0.0.1',
    severity: 'info',
  },
];

// Local storage helper
function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[EstateVista Admin] Storage write failed for ${key}:`, err);
  }
}

// -------------------------------------------------------------
// PUBLIC API METHODS
// -------------------------------------------------------------

/**
 * Fetch aggregated administrative dashboard statistics
 */
export async function getAdminDashboardStats() {
  const applications = loadStorage(ADMIN_STORAGE_KEYS.APPLICATIONS, INITIAL_DEMO_APPLICATIONS);
  const properties = loadStorage(ADMIN_STORAGE_KEYS.PROPERTIES, INITIAL_DEMO_PROPERTIES);
  const users = loadStorage(ADMIN_STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  const inquiries = loadStorage(ADMIN_STORAGE_KEYS.INQUIRIES, INITIAL_DEMO_INQUIRIES);

  const pendingApps = applications.filter((a) => a.status === 'pending').length;
  const approvedAdvisors = applications.filter((a) => a.status === 'approved').length;
  const publishedListings = properties.filter((p) => p.moderationStatus === 'published').length;
  const pendingModeration = properties.filter((p) => p.moderationStatus === 'pending_review').length;
  const newInquiries = inquiries.filter((i) => i.status === 'new').length;

  const totalPortfolioValue = properties
    .filter((p) => p.price && p.listingType === 'Buy')
    .reduce((sum, p) => sum + Number(p.price || 0), 0);

  return {
    totalUsers: users.length,
    customerCount: users.filter((u) => u.role === 'customer').length,
    advisorCount: approvedAdvisors,
    adminCount: users.filter((u) => u.role === 'admin').length,
    pendingApplications: pendingApps,
    totalProperties: properties.length,
    publishedListings,
    pendingModeration,
    totalInquiries: inquiries.length,
    newInquiries,
    totalPortfolioValue, // In INR
  };
}

/**
 * Fetch all advisor accreditation applications
 */
export async function getAdminAdvisorApplications() {
  return loadStorage(ADMIN_STORAGE_KEYS.APPLICATIONS, INITIAL_DEMO_APPLICATIONS);
}

/**
 * Update status of an advisor application (Approve / Reject / Pending)
 */
export async function updateAdvisorApplicationStatus(id, newStatus, notes = '') {
  const applications = loadStorage(ADMIN_STORAGE_KEYS.APPLICATIONS, INITIAL_DEMO_APPLICATIONS);
  const users = loadStorage(ADMIN_STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);

  const updatedApps = applications.map((app) => {
    if (app.id === id) {
      return {
        ...app,
        status: newStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Admin Console',
        notes: notes || app.notes,
      };
    }
    return app;
  });

  saveStorage(ADMIN_STORAGE_KEYS.APPLICATIONS, updatedApps);

  // If approved, reflect in the user directory as well
  const targetApp = applications.find((a) => a.id === id);
  if (targetApp && (newStatus === 'approved' || newStatus === 'rejected')) {
    const updatedUsers = users.map((u) => {
      if (u.email.toLowerCase() === targetApp.email.toLowerCase() || u.uid === targetApp.uid) {
        return {
          ...u,
          role: newStatus === 'approved' ? 'agent' : 'customer',
          advisorStatus: newStatus,
        };
      }
      return u;
    });
    saveStorage(ADMIN_STORAGE_KEYS.USERS, updatedUsers);
  }

  // Record in audit log
  appendAuditLog({
    action: `ADVISOR_${newStatus.toUpperCase()}`,
    target: targetApp ? `Application ${id} (${targetApp.name})` : id,
    details: `Status transitioned to ${newStatus}. Notes: ${notes || 'None'}`,
    severity: newStatus === 'approved' ? 'notice' : 'info',
  });

  return updatedApps;
}

/**
 * Fetch all property listings for moderation
 */
export async function getAdminProperties() {
  return loadStorage(ADMIN_STORAGE_KEYS.PROPERTIES, INITIAL_DEMO_PROPERTIES);
}

/**
 * Update moderation status of a property listing
 */
export async function updatePropertyModerationStatus(id, newStatus, moderatorNotes = '') {
  const properties = loadStorage(ADMIN_STORAGE_KEYS.PROPERTIES, INITIAL_DEMO_PROPERTIES);

  const updated = properties.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        moderationStatus: newStatus,
        moderatorNotes: moderatorNotes || p.moderatorNotes,
      };
    }
    return p;
  });

  saveStorage(ADMIN_STORAGE_KEYS.PROPERTIES, updated);

  appendAuditLog({
    action: `PROPERTY_${newStatus.toUpperCase()}`,
    target: `Property ${id}`,
    details: `Moderation status changed to ${newStatus}.`,
    severity: 'info',
  });

  return updated;
}

/**
 * Toggle featured flag for a property
 */
export async function togglePropertyFeatured(id) {
  const properties = loadStorage(ADMIN_STORAGE_KEYS.PROPERTIES, INITIAL_DEMO_PROPERTIES);

  const updated = properties.map((p) => {
    if (p.id === id) {
      return { ...p, isFeatured: !p.isFeatured };
    }
    return p;
  });

  saveStorage(ADMIN_STORAGE_KEYS.PROPERTIES, updated);
  return updated;
}

/**
 * Fetch all platform users
 */
export async function getAdminUsers() {
  return loadStorage(ADMIN_STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
}

/**
 * Update a user's role in local demonstration storage
 * (Note: Live production role changes must be applied in Cloud Firestore /users/{uid})
 */
export async function updateAdminUserRole(uid, newRole) {
  const users = loadStorage(ADMIN_STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);

  const updated = users.map((u) => {
    if (u.uid === uid) {
      return {
        ...u,
        role: newRole,
        advisorStatus: newRole === 'agent' ? 'approved' : u.advisorStatus,
      };
    }
    return u;
  });

  saveStorage(ADMIN_STORAGE_KEYS.USERS, updated);

  appendAuditLog({
    action: 'USER_ROLE_CHANGE_DEMO',
    target: `User UID ${uid}`,
    details: `Role updated to ${newRole} in local demonstration directory.`,
    severity: 'notice',
  });

  return updated;
}

/**
 * Fetch all platform client inquiries
 */
export async function getAdminInquiries() {
  return loadStorage(ADMIN_STORAGE_KEYS.INQUIRIES, INITIAL_DEMO_INQUIRIES);
}

/**
 * Update inquiry handling status
 */
export async function updateAdminInquiryStatus(id, newStatus) {
  const inquiries = loadStorage(ADMIN_STORAGE_KEYS.INQUIRIES, INITIAL_DEMO_INQUIRIES);

  const updated = inquiries.map((inq) => {
    if (inq.id === id) {
      return { ...inq, status: newStatus };
    }
    return inq;
  });

  saveStorage(ADMIN_STORAGE_KEYS.INQUIRIES, updated);
  return updated;
}

/**
 * Fetch security audit logs
 */
export async function getAdminAuditLogs() {
  return loadStorage(ADMIN_STORAGE_KEYS.AUDIT_LOGS, INITIAL_DEMO_AUDIT);
}

function appendAuditLog(entry) {
  const logs = loadStorage(ADMIN_STORAGE_KEYS.AUDIT_LOGS, INITIAL_DEMO_AUDIT);
  const newEntry = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorEmail: 'current-admin@estatevista.luxury',
    ip: '127.0.0.1 (Local Session)',
    severity: 'info',
    ...entry,
  };
  saveStorage(ADMIN_STORAGE_KEYS.AUDIT_LOGS, [newEntry, ...logs]);
}

/**
 * Reset demonstration admin data to clean defaults
 */
export async function resetAdminDemoData() {
  Object.values(ADMIN_STORAGE_KEYS).forEach((k) => {
    localStorage.removeItem(k);
  });
  return true;
}
