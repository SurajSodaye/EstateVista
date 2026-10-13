/**
 * Agent Service Abstraction Layer
 * Ready for future Firebase Firestore integration.
 */

import { DEMO_AGENTS } from '../data/agents.js';
import { DEMO_PROPERTIES } from '../data/properties.js';

/**
 * Fetch all demonstration agents
 * @returns {Promise<Array>}
 */
export async function getAllAgents() {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Calculate property count for each agent dynamically from DEMO_PROPERTIES
      const agentsWithCounts = DEMO_AGENTS.map((agent) => ({
        ...agent,
        propertyCount: DEMO_PROPERTIES.filter((p) => p.agentId === agent.id).length,
      }));
      resolve(agentsWithCounts);
    }, 100);
  });
}

/**
 * Fetch a single agent by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getAgentById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const agent = DEMO_AGENTS.find((a) => a.id === id);
      if (!agent) {
        resolve(null);
        return;
      }
      const properties = DEMO_PROPERTIES.filter((p) => p.agentId === id);
      resolve({
        ...agent,
        propertyCount: properties.length,
        properties,
      });
    }, 100);
  });
}
