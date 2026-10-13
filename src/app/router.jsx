import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Public Layout
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// Public Pages
import Home from '../pages/Home';
import Properties from '../pages/Properties';
import PropertyDetails from '../pages/PropertyDetails';
import Agents from '../pages/Agents';
import AgentDetails from '../pages/AgentDetails';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import NotFound from '../pages/NotFound';

// Advisor Portal Entry & Application Pages (Public Layout)
import AdvisorPortalLanding from '../pages/agent/AdvisorPortalLanding';
import AgentLogin from '../pages/agent/AgentLogin';
import AgentApply from '../pages/agent/AgentApply';
import AgentPending from '../pages/agent/AgentPending';
import { useAgentAuth } from '../context/AgentAuthContext';

// Advisor Protected Workspace & Route Guard
import AdvisorRoute from '../components/agent/AdvisorRoute';
import AgentLayout from '../components/agent/AgentLayout';
import AgentDashboard from '../pages/agent/AgentDashboard';
import AgentProperties from '../pages/agent/AgentProperties';
import AgentPropertyForm from '../pages/agent/AgentPropertyForm';
import AgentInquiries from '../pages/agent/AgentInquiries';
import AgentProfile from '../pages/agent/AgentProfile';
import AgentSettings from '../pages/agent/AgentSettings';

// Admin Dedicated Console & Protected Routes
import AdminRoute from '../components/admin/AdminRoute';
import AdminLayout from '../components/admin/AdminLayout';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminAdvisorApplications from '../pages/admin/AdminAdvisorApplications';
import AdminProperties from '../pages/admin/AdminProperties';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminInquiries from '../pages/admin/AdminInquiries';
import AdminSettings from '../pages/admin/AdminSettings';

/**
 * ScrollToTop helper component to reset viewport scroll position on route change
 */
function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

/**
 * Layout wrapper for public website pages (includes Navbar & Footer)
 */
function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-ivory text-charcoal overflow-x-hidden">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/**
 * Gateway for /agent index: redirects approved advisors directly to their dashboard,
 * while presenting the dedicated Advisor Portal entry page to customers & guests.
 */
function AgentGateway() {
  const { isAdvisor, isPendingAdvisor, agentLoading } = useAgentAuth();

  if (agentLoading) return null;

  if (isAdvisor) {
    return <Navigate to="/agent/dashboard" replace />;
  }

  if (isPendingAdvisor) {
    return <Navigate to="/agent/pending" replace />;
  }

  return <AdvisorPortalLanding />;
}

export default function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ======================================================== */}
        {/* PROTECTED OPERATIONS ADMIN CONSOLE ROUTES                */}
        {/* Protected by AdminRoute guard (Firebase Auth + Admin role)*/}
        {/* ======================================================== */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="advisor-applications" element={<AdminAdvisorApplications />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* ======================================================== */}
        {/* PROTECTED ADVISOR / OWNER WORKSPACE ROUTES               */}
        {/* Protected by AdvisorRoute guard (Firebase Auth + Roles)  */}
        {/* ======================================================== */}
        <Route element={<AdvisorRoute />}>
          <Route path="/agent" element={<AgentLayout />}>
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="properties" element={<AgentProperties />} />
            <Route path="properties/new" element={<AgentPropertyForm />} />
            <Route path="properties/:id/edit" element={<AgentPropertyForm />} />
            <Route path="inquiries" element={<AgentInquiries />} />
            <Route path="profile" element={<AgentProfile />} />
            <Route path="settings" element={<AgentSettings />} />
          </Route>
        </Route>

        {/* ======================================================== */}
        {/* PUBLIC WEBSITE & ADVISOR ONBOARDING ROUTES               */}
        {/* Rendered inside PublicLayout with Navbar & Footer        */}
        {/* ======================================================== */}
        <Route element={<PublicLayout />}>
          {/* Advisor Portal Public Gateway, Apply & Pending Pages */}
          <Route path="/agent" element={<AgentGateway />} />
          <Route path="/agent/portal" element={<AdvisorPortalLanding />} />
          <Route path="/agent/login" element={<AgentLogin />} />
          <Route path="/agent/apply" element={<AgentApply />} />
          <Route path="/agent/pending" element={<AgentPending />} />

          {/* Standard Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
