import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCw,
  Shield,
  FileText,
  Database,
  Lock,
  ExternalLink,
  Award,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getFirestoreAdminDashboardStats,
  getFirestorePendingAdvisorApplications,
  getFirestoreRecentProperties,
  getFirestoreRecentInquiries,
} from '../../services/adminFirestoreService';

export default function AdminDashboard() {
  const { adminUser, adminProfile } = useAdminAuth();
  const currentUser = adminUser;
  const userProfile = adminProfile;
  const [stats, setStats] = useState(null);
  const [pendingAppsResult, setPendingAppsResult] = useState({
    status: 'loading',
    applications: [],
    error: null,
  });
  const [recentPropsResult, setRecentPropsResult] = useState({
    status: 'loading',
    properties: [],
    error: null,
  });
  const [recentInqResult, setRecentInqResult] = useState({
    status: 'loading',
    inquiries: [],
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFirestoreTelemetry = async () => {
    try {
      const [firestoreStats, appsResult, propsResult, inqResult] = await Promise.all([
        getFirestoreAdminDashboardStats(),
        getFirestorePendingAdvisorApplications(3),
        getFirestoreRecentProperties(3),
        getFirestoreRecentInquiries(3),
      ]);
      setStats(firestoreStats);
      setPendingAppsResult(appsResult);
      setRecentPropsResult(propsResult);
      setRecentInqResult(inqResult);
    } catch (err) {
      console.error('Failed to load Cloud Firestore admin telemetry:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFirestoreTelemetry();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadFirestoreTelemetry();
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-1">
          <p className="font-serif text-sm font-bold text-charcoal">
            Querying Live Cloud Firestore
          </p>
          <p className="text-xs text-mutedText">
            Executing server aggregation queries for 'users' and 'advisorApplications'...
          </p>
        </div>
      </div>
    );
  }

  const hasPermissionError = stats?.error?.type === 'permission_denied';
  const hasNetworkError = stats?.error?.type === 'network_error';

  return (
    <div className="space-y-8">
      {/* ======================================================== */}
      {/* CONNECTION STATUS & REFRESH ACTION HEADER                */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-sage/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest text-gold flex items-center justify-center shadow-xs shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-bold text-charcoal">
                Cloud Firestore Telemetry
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Phase 1 Live Connection
              </span>
            </div>
            <p className="text-[11px] text-mutedText">
              Queries execute against live Google Cloud Firestore with server-side security rules enforcement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCw}
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            className="text-xs"
          >
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Firestore Stats'}</span>
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ERROR BANNER (Permission Denied or Network Error)        */}
      {/* ======================================================== */}
      {hasPermissionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-red-950">
            <Lock className="w-4 h-4 text-red-600 shrink-0" />
            <span>Cloud Firestore Read Blocked: Insufficient Security Clearance</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {stats.error.message}
          </p>
          <div className="text-[10px] text-red-800 pt-1 border-t border-red-200/60 font-mono">
            Active UID: {currentUser?.uid || 'anonymous'} • Profile Role: {userProfile?.role || 'customer'}
          </div>
        </div>
      )}

      {hasNetworkError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{stats.error.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. EXECUTIVE TELEMETRY KPI CARDS                         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users (Live Firestore) */}
        <div className="bg-white rounded-2xl p-5 border border-sage/60 shadow-xs hover:border-forest/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                Total Users
              </span>
              <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center text-forest">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              {stats?.users?.status === 'ready' ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
                    {stats.users.total}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                    Live Firestore
                  </span>
                </div>
              ) : stats?.users?.status === 'permission_denied' ? (
                <span className="text-xs font-bold text-red-600">Access Denied</span>
              ) : (
                <span className="text-xs text-mutedText">Unable to query</span>
              )}
            </div>
          </div>

          <p className="mt-3 text-[11px] text-mutedText flex items-center justify-between pt-2 border-t border-sage/40">
            <span>{stats?.users?.customers ?? '—'} Customers</span>
            <span>{stats?.users?.advisors ?? '—'} Advisors</span>
            <span>{stats?.users?.admins ?? '—'} Admins</span>
          </p>
        </div>

        {/* Card 2: Advisor Queue (Live Firestore) */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs bg-amber-50/20 hover:border-amber-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                Advisor Queue
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              {stats?.applications?.status === 'ready' ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-950">
                    {stats.applications.pending}
                  </span>
                  <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">
                    Pending Review
                  </span>
                </div>
              ) : stats?.applications?.status === 'permission_denied' ? (
                <span className="text-xs font-bold text-red-600">Access Denied</span>
              ) : (
                <span className="text-xs text-mutedText">Unable to query</span>
              )}
            </div>
          </div>

          <p className="mt-3 text-[11px] text-amber-900 flex items-center justify-between pt-2 border-t border-amber-200/60">
            <span>{stats?.applications?.total ?? 0} Total Filed</span>
            <span className="font-semibold text-amber-800">Live Firestore</span>
          </p>
        </div>

        {/* Card 3: Portfolio Assets (Live Firestore) */}
        <div className="bg-white rounded-2xl p-5 border border-sage/60 shadow-xs hover:border-forest/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                Portfolio Assets
              </span>
              <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center text-forest">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              {stats?.properties?.status === 'ready' ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
                    {stats.properties.total}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                    Live Portfolio
                  </span>
                </div>
              ) : stats?.properties?.status === 'permission_denied' ? (
                <span className="text-xs font-bold text-red-600">Access Denied</span>
              ) : (
                <span className="text-xs text-mutedText">Unable to query</span>
              )}
            </div>
          </div>

          <p className="mt-3 text-[11px] text-mutedText flex items-center justify-between pt-2 border-t border-sage/40">
            <span>{stats?.properties?.published ?? 0} Published</span>
            <span>{stats?.properties?.pending ?? 0} In Review</span>
            <span>{stats?.properties?.draft ?? 0} Drafts</span>
          </p>
        </div>

        {/* Card 4: Client Inquiries Stream (Live Firestore) */}
        <div className="bg-white rounded-2xl p-5 border border-sage/60 shadow-xs hover:border-forest/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                Inquiries Stream
              </span>
              <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center text-forest">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              {stats?.inquiries?.status === 'ready' ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
                    {stats.inquiries.total}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                    Live Leads
                  </span>
                </div>
              ) : stats?.inquiries?.status === 'permission_denied' ? (
                <span className="text-xs font-bold text-red-600">Access Denied</span>
              ) : (
                <span className="text-xs text-mutedText">Unable to query</span>
              )}
            </div>
          </div>

          <p className="mt-3 text-[11px] text-mutedText flex items-center justify-between pt-2 border-t border-sage/40">
            <span className="font-semibold text-emerald-800">{stats?.inquiries?.new ?? 0} New</span>
            <span>{stats?.inquiries?.contacted ?? 0} Contacted</span>
            <span>{stats?.inquiries?.closed ?? 0} Closed</span>
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GOVERNANCE SHORTCUTS                                  */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sage/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest text-gold flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-charcoal">
              Platform Governance Shortcuts
            </h3>
            <p className="text-[11px] text-mutedText">
              Administrative pathways for reviewing accreditation applications and system security
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/advisor-applications">
            <Button variant="primary" size="sm" icon={ShieldCheck}>
              Advisor Applications
            </Button>
          </Link>
          <Link to="/admin/properties">
            <Button variant="secondary" size="sm" icon={Building2}>
              Properties Moderation
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="outline" size="sm" icon={Users}>
              Manage Roles
            </Button>
          </Link>
          <Link to="/admin/settings">
            <Button variant="ghost" size="sm">
              Security Policy
            </Button>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TWO-COLUMN SECTIONS (Pending Queue & Integration Feed)*/}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Live Advisor Applications Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-forest" />
              <h2 className="font-serif text-base font-bold text-charcoal">
                Pending Advisor Applications (Live Firestore)
              </h2>
            </div>
            <Link
              to="/admin/advisor-applications"
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              <span>Review all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-sage/60 shadow-xs divide-y divide-sage/40 overflow-hidden">
            {pendingAppsResult.status === 'loading' ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-mutedText">Querying Firestore advisorApplications...</p>
              </div>
            ) : pendingAppsResult.status === 'permission_denied' ? (
              <div className="p-8 text-center space-y-2 bg-red-50/50">
                <Lock className="w-8 h-8 text-red-500 mx-auto" />
                <p className="text-xs font-bold text-red-900">Access Denied by Firestore Security Rules</p>
                <p className="text-[11px] text-red-700 max-w-sm mx-auto">
                  Only accounts with verified role 'admin' can query advisor applications.
                </p>
              </div>
            ) : pendingAppsResult.applications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-charcoal">All Live Applications Reviewed</p>
                <p className="text-[11px] text-mutedText">
                  There are currently 0 pending advisor applications in Cloud Firestore.
                </p>
              </div>
            ) : (
              pendingAppsResult.applications.map((app) => (
                <div key={app.id} className="p-4 sm:p-5 hover:bg-ivory/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-charcoal truncate">
                          {app.applicantName || 'Applicant'}
                        </span>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Pending
                        </span>
                      </div>
                      <p className="text-xs text-forest font-semibold mt-0.5">
                        {app.agency || 'Independent Brokerage'}
                      </p>
                      <p className="text-[11px] text-mutedText mt-1">
                        {app.experienceYears || 0} Years Experience • License: <code className="font-mono">{app.licenseNumber || '—'}</code>
                      </p>
                      <p className="text-[10px] text-mutedText mt-0.5">
                        Email: {app.applicantEmail}
                      </p>
                    </div>
                    <Link to="/admin/advisor-applications">
                      <Button variant="outline" size="sm" className="text-xs shrink-0">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Property Submissions Moderation Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-forest" />
              <h2 className="font-serif text-base font-bold text-charcoal">
                Recent Property Submissions (Live Firestore)
              </h2>
            </div>
            <Link
              to="/admin/properties"
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              <span>Moderate All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-sage/60 shadow-xs divide-y divide-sage/40 overflow-hidden">
            {recentPropsResult.status === 'loading' ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-mutedText">Querying Firestore properties...</p>
              </div>
            ) : recentPropsResult.status === 'permission_denied' ? (
              <div className="p-8 text-center space-y-2 bg-red-50/50">
                <Lock className="w-8 h-8 text-red-500 mx-auto" />
                <p className="text-xs font-bold text-red-900">Access Denied by Firestore Security Rules</p>
                <p className="text-[11px] text-red-700 max-w-sm mx-auto">
                  Only accounts with verified role 'admin' can query unpublished properties.
                </p>
              </div>
            ) : recentPropsResult.properties.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-charcoal">No Properties in Queue</p>
                <p className="text-[11px] text-mutedText">
                  There are currently 0 property submissions in Cloud Firestore.
                </p>
              </div>
            ) : (
              recentPropsResult.properties.map((prop) => (
                <div key={prop.id} className="p-4 sm:p-5 hover:bg-ivory/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={prop.imageUrls?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=120&q=80'}
                        alt={prop.title}
                        className="w-12 h-12 rounded-xl object-cover border border-sage shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-charcoal truncate" title={prop.title}>
                            {prop.title}
                          </span>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prop.publicationStatus === 'published'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : prop.publicationStatus === 'pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-gray-100 text-gray-800 border border-gray-300'
                          }`}>
                            {prop.publicationStatus || 'draft'}
                          </span>
                        </div>
                        <p className="text-xs text-forest font-semibold mt-0.5">
                          {prop.city || prop.location || 'India'} • {prop.propertyType}
                        </p>
                        <p className="text-[10px] text-mutedText mt-0.5 font-mono">
                          ID: {prop.id} • Advisor: {prop.agentName || 'Advisor'}
                        </p>
                      </div>
                    </div>
                    <Link to="/admin/properties">
                      <Button variant="outline" size="sm" className="text-xs shrink-0">
                        Audit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. CLOUD FIRESTORE TELEMETRY MATRIX                      */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-sage/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center text-forest">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-charcoal">
                Cloud Firestore Collection Telemetry Matrix
              </h3>
              <p className="text-[11px] text-mutedText">
                Live backend connection state and security verification per collection
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-mutedText">
            Timestamp: {new Date().toLocaleTimeString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory border-y border-sage/60 text-mutedText uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Collection Path</th>
                <th className="py-2.5 px-3">Integration Status</th>
                <th className="py-2.5 px-3">Security Rule Authorization</th>
                <th className="py-2.5 px-3">Live Document Count</th>
                <th className="py-2.5 px-3">Phase Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/40">
              <tr className="hover:bg-ivory/30">
                <td className="py-3 px-3 font-mono font-bold text-charcoal">/users</td>
                <td className="py-3 px-3">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    stats?.users?.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-800'
                      : stats?.users?.status === 'permission_denied'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {stats?.users?.status === 'ready' ? 'Connected' : stats?.users?.status || 'Unknown'}
                  </span>
                </td>
                <td className="py-3 px-3 text-mutedText">isOwner(uid) || isAdmin()</td>
                <td className="py-3 px-3 font-mono font-bold text-forest">
                  {stats?.users?.total !== null ? `${stats?.users?.total} documents` : '—'}
                </td>
                <td className="py-3 px-3 text-forest font-semibold">Active (Live)</td>
              </tr>

              <tr className="hover:bg-ivory/30">
                <td className="py-3 px-3 font-mono font-bold text-charcoal">/advisorApplications</td>
                <td className="py-3 px-3">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    stats?.applications?.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-800'
                      : stats?.applications?.status === 'permission_denied'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {stats?.applications?.status === 'ready' ? 'Connected' : stats?.applications?.status || 'Unknown'}
                  </span>
                </td>
                <td className="py-3 px-3 text-mutedText">isOwner(uid) || isAdmin()</td>
                <td className="py-3 px-3 font-mono font-bold text-amber-900">
                  {stats?.applications?.pending !== null ? `${stats?.applications?.pending} pending` : '—'}
                </td>
                <td className="py-3 px-3 text-forest font-semibold">Active (Live)</td>
              </tr>

              <tr className="hover:bg-ivory/30">
                <td className="py-3 px-3 font-mono font-bold text-charcoal">/properties</td>
                <td className="py-3 px-3">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    stats?.properties?.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-800'
                      : stats?.properties?.status === 'permission_denied'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {stats?.properties?.status === 'ready' ? 'Connected' : stats?.properties?.status || 'Unknown'}
                  </span>
                </td>
                <td className="py-3 px-3 text-mutedText">isPublished || isApprovedAdvisor() || isAdmin()</td>
                <td className="py-3 px-3 font-mono font-bold text-forest">
                  {stats?.properties?.total !== null ? `${stats?.properties?.total} documents` : '—'}
                </td>
                <td className="py-3 px-3 text-forest font-semibold">Active (Live)</td>
              </tr>

              <tr className="hover:bg-ivory/30">
                <td className="py-3 px-3 font-mono font-bold text-charcoal">/inquiries</td>
                <td className="py-3 px-3">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    stats?.inquiries?.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-800'
                      : stats?.inquiries?.status === 'permission_denied'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {stats?.inquiries?.status === 'ready' ? 'Connected' : stats?.inquiries?.status || 'Unknown'}
                  </span>
                </td>
                <td className="py-3 px-3 text-mutedText">isApprovedAdvisor() || isAdmin()</td>
                <td className="py-3 px-3 font-mono font-bold text-forest">
                  {stats?.inquiries?.total !== null ? `${stats?.inquiries?.total} documents` : '—'}
                </td>
                <td className="py-3 px-3 text-forest font-semibold">Active (Live)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
