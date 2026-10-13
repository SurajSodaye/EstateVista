import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInAgent,
  signOutAgent,
  subscribeToAgentAuthState,
  fetchAgentProfile,
  registerAgentAccount,
  submitAgentApplication,
} from '../services/agentAuthService.js';
import { isFirebaseConfigured } from '../lib/firebase.js';

const AgentAuthContext = createContext(null);

export function AgentAuthProvider({ children }) {
  const [agentUser, setAgentUser] = useState(null);
  const [agentProfile, setAgentProfile] = useState(null);
  const [agentProfileError, setAgentProfileError] = useState(null);
  const [agentLoading, setAgentLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication changes on the dedicated AgentApp auth instance
    const unsubscribe = subscribeToAgentAuthState(async (user) => {
      setAgentUser(user);
      if (user) {
        const profile = await fetchAgentProfile(user.uid);
        if (profile?.isError) {
          setAgentProfileError(profile.error);
          setAgentProfile(null);
        } else if (profile?.isMissing) {
          setAgentProfileError(new Error('Advisor profile record not found in Firestore.'));
          setAgentProfile(null);
        } else {
          setAgentProfile(profile);
          setAgentProfileError(null);
        }
      } else {
        setAgentProfile(null);
        setAgentProfileError(null);
      }
      setAgentLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const agentLogin = async (email, password) => {
    const result = await signInAgent(email, password);
    if (result.profile?.isError) {
      setAgentProfileError(result.profile.error);
      throw result.profile.error;
    }
    if (result.profile?.isMissing) {
      const missingErr = new Error('Advisor profile record not found in Firestore. Please contact support.');
      setAgentProfileError(missingErr);
      throw missingErr;
    }

    setAgentUser(result.user);
    setAgentProfile(result.profile);
    setAgentProfileError(null);
    return { user: result.user, profile: result.profile };
  };

  const agentLogout = async () => {
    await signOutAgent();
    setAgentUser(null);
    setAgentProfile(null);
    setAgentProfileError(null);
  };

  const agentRegister = async (params) => {
    const result = await registerAgentAccount(params);
    setAgentUser(result.user);
    setAgentProfile(result.profile);
    setAgentProfileError(null);
    return result;
  };

  const applyForAdvisor = async (applicationData) => {
    const result = await submitAgentApplication(applicationData);
    await refreshAgentProfile();
    return result;
  };

  const refreshAgentProfile = async () => {
    if (agentUser) {
      const profile = await fetchAgentProfile(agentUser.uid);
      if (profile && !profile.isError && !profile.isMissing) {
        setAgentProfile(profile);
        setAgentProfileError(null);
        return profile;
      } else if (profile?.isError) {
        setAgentProfileError(profile.error);
      }
    }
    return null;
  };

  // Role and authorization determination from trusted profile state
  // An advisor must have role: 'agent' or accredited 'admin' AND approval status: 'approved'
  const isAdvisor = Boolean(
    agentUser &&
      agentProfile &&
      (agentProfile.role === 'agent' || agentProfile.role === 'admin') &&
      agentProfile.advisorStatus === 'approved'
  );

  const isPendingAdvisor = Boolean(
    agentUser &&
      agentProfile &&
      agentProfile.advisorStatus === 'pending'
  );

  const isRejectedAdvisor = Boolean(
    agentUser &&
      agentProfile &&
      agentProfile.advisorStatus === 'rejected'
  );

  const value = {
    agentUser,
    agentProfile,
    agentProfileError,
    agentLoading,
    isAdvisor,
    isPendingAdvisor,
    isRejectedAdvisor,
    isFirebaseConfigured,
    agentLogin,
    agentLogout,
    agentRegister,
    applyForAdvisor,
    refreshAgentProfile,
  };

  return (
    <AgentAuthContext.Provider value={value}>
      {children}
    </AgentAuthContext.Provider>
  );
}

export function useAgentAuth() {
  const context = useContext(AgentAuthContext);
  if (!context) {
    throw new Error('useAgentAuth must be used within an AgentAuthProvider');
  }
  return context;
}
