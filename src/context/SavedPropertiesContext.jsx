import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  saveProperty,
  unsaveProperty,
  subscribeUserSavedProperties,
} from '../services/savedPropertiesService';

const SavedPropertiesContext = createContext(null);

export function SavedPropertiesProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const [savedPropertyIds, setSavedPropertyIds] = useState(new Set());
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-dismiss toast notification after 3.5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Set up real-time listener whenever authenticated user changes
  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setSavedPropertyIds(new Set());
      setSavedItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeUserSavedProperties(
      currentUser.uid,
      (items) => {
        const idSet = new Set(items.map((item) => String(item.propertyId)));
        setSavedItems(items);
        setSavedPropertyIds(idSet);
        setLoading(false);
      },
      (err) => {
        console.error('[SavedPropertiesContext] Subscription failed:', err);
        setError('Failed to synchronize saved properties with Cloud Firestore.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser, authLoading]);

  /**
   * Fast O(1) check if a property is saved
   */
  const isSaved = useCallback(
    (propertyId) => {
      if (!propertyId) return false;
      return savedPropertyIds.has(String(propertyId));
    },
    [savedPropertyIds]
  );

  /**
   * Toggles save/unsave state for a property with optimistic UI updates and instant rollback on error
   * @param {string} propertyId
   * @param {string} [title]
   * @returns {Promise<{success: boolean, action: 'saved' | 'removed' | 'require_auth'}>}
   */
  const toggleSave = useCallback(
    async (propertyId, title = 'Residence') => {
      if (!currentUser) {
        return { success: false, action: 'require_auth' };
      }

      if (!propertyId) {
        return { success: false, error: 'Property ID missing' };
      }

      const cleanId = String(propertyId).trim();
      const currentlySaved = savedPropertyIds.has(cleanId);
      const targetAction = currentlySaved ? 'removed' : 'saved';

      // 1. Optimistic UI update
      const previousSet = new Set(savedPropertyIds);
      const nextSet = new Set(savedPropertyIds);
      if (currentlySaved) {
        nextSet.delete(cleanId);
      } else {
        nextSet.add(cleanId);
      }
      setSavedPropertyIds(nextSet);

      // 2. Perform Firestore operation
      try {
        if (currentlySaved) {
          await unsaveProperty(currentUser.uid, cleanId);
          setToastMessage({
            type: 'removed',
            text: `"${title}" removed from your saved residences.`,
          });
        } else {
          await saveProperty(currentUser.uid, cleanId);
          setToastMessage({
            type: 'saved',
            text: `"${title}" added to your private saved collection.`,
          });
        }
        return { success: true, action: targetAction };
      } catch (err) {
        console.error('[SavedPropertiesContext] Toggle save failed:', err);
        // Rollback optimistic state on failure
        setSavedPropertyIds(previousSet);
        setToastMessage({
          type: 'error',
          text: 'Unable to update saved property. Please check your network connection.',
        });
        return { success: false, error: err.message };
      }
    },
    [currentUser, savedPropertyIds]
  );

  /**
   * Explicitly remove a property from saved list
   */
  const removeSaved = useCallback(
    async (propertyId, title = 'Residence') => {
      return toggleSave(propertyId, title);
    },
    [toggleSave]
  );

  const savedCount = useMemo(() => savedPropertyIds.size, [savedPropertyIds]);

  const value = useMemo(
    () => ({
      savedPropertyIds,
      savedItems,
      savedCount,
      loading,
      error,
      isSaved,
      toggleSave,
      removeSaved,
      toastMessage,
      dismissToast: () => setToastMessage(null),
    }),
    [
      savedPropertyIds,
      savedItems,
      savedCount,
      loading,
      error,
      isSaved,
      toggleSave,
      removeSaved,
      toastMessage,
    ]
  );

  return (
    <SavedPropertiesContext.Provider value={value}>
      {children}
      {/* Global floating toast notification for save/unsave feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up pointer-events-none">
          <div
            className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-card border text-xs font-semibold flex items-center gap-2.5 max-w-sm backdrop-blur-md transition-all ${
              toastMessage.type === 'error'
                ? 'bg-red-50 text-red-900 border-red-200'
                : toastMessage.type === 'saved'
                ? 'bg-forest text-gold border-forest-light'
                : 'bg-ivory text-charcoal border-sage/80'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                toastMessage.type === 'error'
                  ? 'bg-red-500'
                  : toastMessage.type === 'saved'
                  ? 'bg-gold animate-pulse'
                  : 'bg-charcoal/40'
              }`}
            />
            <span className="truncate">{toastMessage.text}</span>
          </div>
        </div>
      )}
    </SavedPropertiesContext.Provider>
  );
}

export function useSavedProperties() {
  const context = useContext(SavedPropertiesContext);
  if (!context) {
    throw new Error('useSavedProperties must be used within a SavedPropertiesProvider');
  }
  return context;
}
