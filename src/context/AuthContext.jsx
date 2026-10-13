import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  registerUser,
  signInUser,
  signOutUser,
  sendPasswordReset,
  fetchUserProfile,
  submitAdvisorApplication,
  subscribeToAuthState,
} from '../services/authService.js';
import { isFirebaseConfigured } from '../lib/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = subscribeToAuthState(async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch custom user profile from Firestore if available
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(
          profile || {
            uid: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: 'customer',
            advisorStatus: 'none',
          }
        );
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (currentUser) {
      const profile = await fetchUserProfile(currentUser.uid);
      if (profile) {
        setUserProfile(profile);
        return profile;
      }
    }
    return null;
  };

  const register = async (params) => {
    const result = await registerUser(params);
    setCurrentUser(result.user);
    setUserProfile(result.profile);
    return result;
  };

  const login = async (email, password) => {
    const user = await signInUser(email, password);
    setCurrentUser(user);
    const profile = await fetchUserProfile(user.uid);
    const resolvedProfile =
      profile || {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        role: 'customer',
        advisorStatus: 'none',
      };
    setUserProfile(resolvedProfile);
    return { user, profile: resolvedProfile };
  };

  const logout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email) => {
    return sendPasswordReset(email);
  };

  const applyForAdvisor = async (applicationData) => {
    const result = await submitAdvisorApplication(applicationData);
    await refreshUserProfile();
    return result;
  };

  // Role and authorization determination from trusted profile state
  // An advisor must have role: 'agent' or 'admin' AND approval status: 'approved'
  const isAdvisor = Boolean(
    currentUser &&
      userProfile &&
      (userProfile.role === 'agent' || userProfile.role === 'admin') &&
      (userProfile.advisorStatus === 'approved' || userProfile.role === 'admin')
  );

  const isPendingAdvisor = Boolean(
    currentUser &&
      userProfile &&
      userProfile.advisorStatus === 'pending'
  );

  const isRejectedAdvisor = Boolean(
    currentUser &&
      userProfile &&
      userProfile.advisorStatus === 'rejected'
  );

  const isAdmin = Boolean(
    currentUser &&
      userProfile &&
      userProfile.role === 'admin'
  );

  const isCustomer = Boolean(!isAdvisor && !isAdmin);

  const value = {
    currentUser,
    userProfile,
    loading,
    isFirebaseConfigured,
    // Authorization getters
    isAdmin,
    isAdvisor,
    isPendingAdvisor,
    isRejectedAdvisor,
    isCustomer,
    // Auth actions
    register,
    login,
    logout,
    resetPassword,
    refreshUserProfile,
    applyForAdvisor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
