import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInAdmin,
  signOutAdmin,
  subscribeToAdminAuthState,
  fetchAdminProfile,
} from '../services/adminAuthService.js';
import { isFirebaseConfigured } from '../lib/firebase.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication changes on the dedicated AdminApp auth instance
    const unsubscribe = subscribeToAdminAuthState(async (user) => {
      if (user) {
        // Fetch verified user profile directly from Cloud Firestore (/users/{uid})
        const profile = await fetchAdminProfile(user.uid);
        if (profile && profile.role === 'admin') {
          setAdminUser(user);
          setAdminProfile(profile);
        } else {
          // If non-admin account is detected in adminAuth, sign out from admin instance immediately
          await signOutAdmin();
          setAdminUser(null);
          setAdminProfile(null);
        }
      } else {
        setAdminUser(null);
        setAdminProfile(null);
      }
      setAdminLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const adminLogin = async (email, password) => {
    const result = await signInAdmin(email, password);
    setAdminUser(result.user);
    setAdminProfile(result.profile);
    return result;
  };

  const adminLogout = async () => {
    await signOutAdmin();
    setAdminUser(null);
    setAdminProfile(null);
  };

  const refreshAdminProfile = async () => {
    if (adminUser) {
      const profile = await fetchAdminProfile(adminUser.uid);
      if (profile && profile.role === 'admin') {
        setAdminProfile(profile);
        return profile;
      } else {
        await adminLogout();
        return null;
      }
    }
    return null;
  };

  // Verified admin status derived strictly from Firestore profile
  const isAdmin = Boolean(
    adminUser &&
    adminProfile &&
    adminProfile.role === 'admin'
  );

  const value = {
    adminUser,
    adminProfile,
    adminLoading,
    isAdmin,
    isFirebaseConfigured,
    adminLogin,
    adminLogout,
    refreshAdminProfile,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
