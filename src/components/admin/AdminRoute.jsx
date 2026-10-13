import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import LoadingState from '../common/LoadingState';

/**
 * Route Guard for Protected Administrative Routes (/admin/*)
 * 
 * Verifies that the user is:
 * 1. Authenticated via dedicated AdminApp Firebase Authentication (adminAuth).
 * 2. Assigned the trusted role 'admin' in their verified Firestore profile.
 * 
 * Note: A user cannot self-assign the admin role from client code, local storage,
 * or registration forms. The role is strictly enforced from the Firestore user profile.
 * 
 * Routing Behavior:
 * - Loading -> Clean administrative loading state
 * - Unauthenticated -> Redirects to /admin/login?reason=auth_required
 * - Authenticated Non-Admin -> Redirects to /admin/login?reason=access_denied
 * - Verified Admin -> Renders administrative outlet or children
 */
export default function AdminRoute({ children }) {
  const { adminUser, adminLoading, isAdmin } = useAdminAuth();
  const location = useLocation();

  // 1. Prevent redirection flicker while Firebase initializes session
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-[#0C1E1A] flex items-center justify-center p-6 text-[#F8F7F2]">
        <div className="bg-[#153E35] rounded-3xl p-8 border border-[#285A4E] shadow-2xl max-w-md w-full text-center">
          <LoadingState message="Verifying administrative credentials and system authorization..." />
        </div>
      </div>
    );
  }

  // 2. Unauthenticated visitor: redirect to Admin Login
  if (!adminUser) {
    return (
      <Navigate
        to={`/admin/login?reason=auth_required&redirect=${encodeURIComponent(location.pathname)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  // 3. Authenticated customer or advisor without admin privileges
  if (!isAdmin) {
    return (
      <Navigate
        to={`/admin/login?reason=access_denied&attempted=${encodeURIComponent(location.pathname)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  // 4. Authorized Administrator
  return children ? children : <Outlet />;
}
