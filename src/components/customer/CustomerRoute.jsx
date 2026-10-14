import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../common/LoadingState';

/**
 * Route guard for registered customer pages (/my-inquiries).
 * 
 * Enforces:
 * 1. Unauthenticated visitors are redirected to /login with return target state.
 * 2. Authenticated administrators are redirected to their management console (/admin/inquiries).
 * 3. Authenticated accredited advisors are redirected to their workspace (/agent/inquiries).
 * 4. Genuine customers are granted access to their private inquiries history.
 */
export default function CustomerRoute() {
  const { currentUser, loading, isAdvisor, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-ivory flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 border border-sage shadow-card max-w-md w-full text-center">
          <LoadingState message="Verifying member credentials and inquiry records..." />
        </div>
      </div>
    );
  }

  // 1. Unauthenticated: Redirect to login preserving destination
  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  // 2. Administrator account: redirect to Admin inquiries console
  if (isAdmin) {
    return <Navigate to="/admin/inquiries" replace />;
  }

  // 3. Advisor account: redirect to Advisor inquiries workspace
  if (isAdvisor) {
    return <Navigate to="/agent/inquiries" replace />;
  }

  // 4. Authenticated customer: render child route
  return <Outlet />;
}
