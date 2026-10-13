/**
 * Property Service Abstraction Layer
 * Ready for future Firebase Firestore integration.
 * In this phase, operations read from DEMO_PROPERTIES.
 */

import { DEMO_PROPERTIES } from '../data/properties.js';

/**
 * Fetch all demonstration properties
 * @returns {Promise<Array>}
 */
export async function getAllProperties() {
  // Simulated asynchronous service call for seamless Firebase migration
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...DEMO_PROPERTIES]);
    }, 150);
  });
}

/**
 * Fetch featured properties
 * @returns {Promise<Array>}
 */
export async function getFeaturedProperties() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const featured = DEMO_PROPERTIES.filter((p) => p.isFeatured);
      resolve(featured);
    }, 100);
  });
}

/**
 * Fetch latest listed properties
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getLatestProperties(limit = 6) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sorted = [...DEMO_PROPERTIES].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      resolve(sorted.slice(0, limit));
    }, 100);
  });
}

/**
 * Fetch a single property by its ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getPropertyById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const property = DEMO_PROPERTIES.find((p) => p.id === id);
      resolve(property ? { ...property } : null);
    }, 100);
  });
}

/**
 * Fetch related properties (by city or property type, excluding current ID)
 * @param {string} currentId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRelatedProperties(currentId, limit = 3) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const current = DEMO_PROPERTIES.find((p) => p.id === currentId);
      if (!current) {
        resolve([]);
        return;
      }
      const related = DEMO_PROPERTIES.filter(
        (p) =>
          p.id !== currentId &&
          (p.city === current.city || p.propertyType === current.propertyType)
      ).slice(0, limit);
      resolve(related);
    }, 100);
  });
}

/**
 * Multi-criteria property filtering & search
 * @param {Object} filters
 * @returns {Promise<{properties: Array, totalCount: number}>}
 */
export async function searchProperties(filters = {}) {
  const {
    query = '',
    city = '',
    listingType = 'All', // 'All', 'Buy', 'Rent'
    propertyType = 'All', // 'All', 'Apartment', 'Villa', etc.
    minPrice = 0,
    maxPrice = Infinity,
    bedrooms = 'All', // 'All', '1', '2', '3', '4', '5+'
    sortBy = 'newest', // 'newest', 'price-asc', 'price-desc'
  } = filters;

  return new Promise((resolve) => {
    setTimeout(() => {
      let results = [...DEMO_PROPERTIES];

      // Listing Type filter
      if (listingType && listingType !== 'All') {
        results = results.filter(
          (p) => p.listingType.toLowerCase() === listingType.toLowerCase()
        );
      }

      // City filter
      if (city && city !== 'All') {
        results = results.filter(
          (p) => p.city.toLowerCase() === city.toLowerCase()
        );
      }

      // Property Type filter
      if (propertyType && propertyType !== 'All') {
        results = results.filter(
          (p) => p.propertyType.toLowerCase() === propertyType.toLowerCase()
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

      // Text query search (matches title, locality, city, description, amenities)
      if (query && query.trim() !== '') {
        const q = query.toLowerCase().trim();
        results = results.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.locality.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.amenities.some((a) => a.toLowerCase().includes(q))
        );
      }

      // Sorting
      if (sortBy === 'price-asc') {
        results.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-desc') {
        results.sort((a, b) => b.price - a.price);
      } else {
        // Default: newest
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      resolve({
        properties: results,
        totalCount: results.length,
      });
    }, 120);
  });
}

/**
 * Get count of properties in a city
 * @param {string} cityName
 * @returns {number}
 */
export function getPropertyCountByLocation(cityName) {
  return DEMO_PROPERTIES.filter(
    (p) => p.city.toLowerCase() === cityName.toLowerCase()
  ).length;
}

/**
 * Get count of properties for a type
 * @param {string} typeName
 * @returns {number}
 */
export function getPropertyCountByType(typeName) {
  return DEMO_PROPERTIES.filter(
    (p) => p.propertyType.toLowerCase() === typeName.toLowerCase()
  ).length;
}
