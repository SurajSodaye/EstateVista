import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAgentAuth } from '../../context/AgentAuthContext';
import LoadingState from '../common/LoadingState';
import Button from '../common/Button';

/**
 * Reusable Route Guard for Protected Advisor/Owner Portal Routes (/agent/*)
 * 
 * Verifies that the user is:
 * 1. Authenticated via dedicated AgentApp Firebase Authentication (agentAuth).
 * 2. Assigned the role 'agent' or 'admin' in their trusted Firestore profile.
 * 3. Approved with advisorStatus: 'approved' (or admin).
 * 
 * Handles loading states cleanly to prevent flicker and redirects:
 * - Unauthenticated visitors -> /agent/login?reason=auth_required
 * - Profile loading or permission error -> Profile Verification Error view (Case D)
 * - Pending applicants -> /agent/pending
 * - Normal customers (denied access) -> /agent/portal?reason=access_denied
 */
export default function AdvisorRoute({ children }) {
  const { agentUser, agentProfileError, agentLoading, isAdvisor, isPendingAdvisor } = useAgentAuth();
  const location = useLocation();

  // 1. Prevent redirection flicker while Firebase initializes
  if (agentLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 border border-sage shadow-card max-w-md w-full text-center">
          <LoadingState message="Verifying advisor credentials and security authorization..." />
        </div>
      </div>
    );
  }

  // 2. Unauthenticated visitor: redirect to dedicated Advisor Login
  if (!agentUser) {
    return (
      <Navigate
        to={`/agent/login?reason=auth_required&redirect=${encodeURIComponent(location.pathname)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  // 3. Handle Firestore permission error or missing profile distinctly (Case D)
  // Prevents silently misclassifying profile-loading failures as normal customers
  if (agentProfileError) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-card max-w-md w-full text-center space-y-5 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mx-auto border border-red-200 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-xl font-bold text-red-900">
              Advisor Profile Error
            </h2>
            <p className="text-xs text-charcoal/80 leading-relaxed">
              {agentProfileError.message || 'Unable to load advisor profile credentials from Cloud Firestore.'}
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => window.location.reload()}
              className="mx-auto"
            >
              Retry Profile Check
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. User has a pending advisor application under review
  if (isPendingAdvisor) {
    return <Navigate to="/agent/pending" state={{ from: location }} replace />;
  }

  // 4. Logged-in customer without approved advisor credentials
  if (!isAdvisor) {
    return (
      <Navigate
        to={`/agent/portal?reason=access_denied&attempted=${encodeURIComponent(location.pathname)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  // 5. Authorized advisor: render child routes or outlet
  return children ? children : <Outlet />;
}
