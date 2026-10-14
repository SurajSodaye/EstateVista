/**
 * Property Service Abstraction Layer
 * 
 * Strict Constraint Compliance:
 * The public property catalog is intentionally static for now (backed by baseline DEMO_PROPERTIES).
 * getPropertyById allows lookup in DEMO_PROPERTIES with a direct Firestore document fallback
 * so that advisors and administrators can preview their created listings from their portals.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase.js';
import { DEMO_PROPERTIES } from '../data/properties.js';

/**
 * Fetch all properties from the baseline static demonstration catalog
 * @returns {Promise<Array>}
 */
export async function getAllProperties() {
  return [...DEMO_PROPERTIES];
}

/**
 * Fetch featured properties from the baseline static demonstration catalog
 * @returns {Promise<Array>}
 */
export async function getFeaturedProperties() {
  return DEMO_PROPERTIES.filter((p) => p.isFeatured);
}

/**
 * Fetch latest listed properties from the baseline static demonstration catalog
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getLatestProperties(limit = 6) {
  const sorted = [...DEMO_PROPERTIES].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  return sorted.slice(0, limit);
}

/**
 * Fetch a single property by its ID.
 * Checks the static demonstration catalog first; if not found, falls back to Cloud Firestore
 * so advisors and administrators can preview their custom listings.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getPropertyById(id) {
  if (!id) return null;

  // 1. Check baseline demonstration catalog first
  const demoMatch = DEMO_PROPERTIES.find((p) => p.id === id);
  if (demoMatch) return { ...demoMatch };

  // 2. Query Firestore directly by doc ID for advisor/admin property preview
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'properties', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        const imgs = Array.isArray(d.imageUrls) && d.imageUrls.length > 0
          ? d.imageUrls
          : (Array.isArray(d.images) && d.images.length > 0 ? d.images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80']);
        return {
          id: snap.id,
          ...d,
          images: imgs,
          imageUrls: imgs,
          featuredImage: d.featuredImage || imgs[0] || '',
          amenities: Array.isArray(d.amenities) ? d.amenities : [],
          areaSqFt: d.areaSqFt || d.area || 0,
          createdAt: d.createdAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('[propertyService] Direct Firestore property fetch error:', err);
    }
  }

  return null;
}

/**
 * Fetch related properties from the baseline static demonstration catalog
 * @param {string} currentId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRelatedProperties(currentId, limit = 3) {
  const current = DEMO_PROPERTIES.find((p) => p.id === currentId);
  if (!current) return [];

  return DEMO_PROPERTIES.filter(
    (p) =>
      p.id !== currentId &&
      (p.city?.toLowerCase() === current.city?.toLowerCase() ||
        p.propertyType?.toLowerCase() === current.propertyType?.toLowerCase())
  ).slice(0, limit);
}

/**
 * Multi-criteria property filtering & search across static demonstration properties
 * @param {Object} filters
 * @returns {Promise<{properties: Array, totalCount: number}>}
 */
export async function searchProperties(filters = {}) {
  const {
    query = '',
    city = '',
    listingType = 'All',
    propertyType = 'All',
    minPrice = 0,
    maxPrice = Infinity,
    bedrooms = 'All',
    sortBy = 'newest',
  } = filters;

  let results = [...DEMO_PROPERTIES];

  // Listing Type filter
  if (listingType && listingType !== 'All') {
    results = results.filter(
      (p) => (p.listingType || '').toLowerCase() === listingType.toLowerCase()
    );
  }

  // City filter
  if (city && city !== 'All') {
    results = results.filter(
      (p) => (p.city || '').toLowerCase() === city.toLowerCase()
    );
  }

  // Property Type filter
  if (propertyType && propertyType !== 'All') {
    results = results.filter(
      (p) => (p.propertyType || '').toLowerCase() === propertyType.toLowerCase()
    );
  }

  // Bedrooms filter
  if (bedrooms && bedrooms !== 'All') {
    if (bedrooms === '5+' || bedrooms === '5') {
      results = results.filter((p) => p.bedrooms >= 5);
    } else {
      const bedNum = parseInt(bedrooms, 10);
      results = results.filter((p) => p.bedrooms === bedNum);
    }
  }

  // Price range filter
  if (minPrice > 0) {
    results = results.filter((p) => p.price >= minPrice);
  }
  if (maxPrice && maxPrice !== Infinity) {
    results = results.filter((p) => p.price <= maxPrice);
  }

  // Text query search
  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.locality || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (Array.isArray(p.amenities) && p.amenities.some((a) => a.toLowerCase().includes(q)))
    );
  }

  // Sorting
  if (sortBy === 'price-asc') {
    results.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    results.sort((a, b) => b.price - a.price);
  } else {
    results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  return {
    properties: results,
    totalCount: results.length,
  };
}

/**
 * Count properties by city in baseline demonstration catalog
 * @param {string} cityName
 * @returns {number}
 */
export function getPropertyCountByLocation(cityName) {
  return DEMO_PROPERTIES.filter(
    (p) => p.city.toLowerCase() === cityName.toLowerCase()
  ).length;
}

/**
 * Count properties by property type in baseline demonstration catalog
 * @param {string} typeName
 * @returns {number}
 */
export function getPropertyCountByType(typeName) {
  return DEMO_PROPERTIES.filter(
    (p) => p.propertyType.toLowerCase() === typeName.toLowerCase()
  ).length;
}
