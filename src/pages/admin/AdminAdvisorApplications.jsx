import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  FileCheck,
  Phone,
  Mail,
  Award,
  AlertCircle,
  RotateCw,
  X,
  Lock,
  Database,
  Calendar,
  Building,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getAllFirestoreAdvisorApplications,
  updateFirestoreAdvisorApplicationStatus,
} from '../../services/adminFirestoreService';

export default function AdminAdvisorApplications() {
  const { adminUser } = useAdminAuth();
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const result = await getAllFirestoreAdvisorApplications();
    if (result.error) {
      setError(result.error);
      setApplications([]);
      setCounts({ all: 0, pending: 0, approved: 0, rejected: 0 });
    } else {
      setApplications(result.allApplications || []);
      setCounts(result.counts || { all: 0, pending: 0, approved: 0, rejected: 0 });
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (uid, newStatus) => {
    if (!uid) return;
    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    const result = await updateFirestoreAdvisorApplicationStatus(
      uid,
      newStatus,
      reviewNotes,
      adminUser?.email || 'Administrator'
    );

    setSubmitting(false);

    if (!result.success) {
      setActionError(
        result.error?.message || `Failed to transition application accreditation to: ${newStatus}.`
      );
      return;
    }

    setActionSuccess(`Application accreditation transitioned to: ${newStatus.toUpperCase()}`);
    setReviewNotes('');
    setSelectedApp(null);
    await loadData();
    setTimeout(() => setActionSuccess(''), 5000);
  };

  const filteredApps = applications.filter((app) => {
    const matchesTab = activeTab === 'all' || app.status === activeTab;
    const query = searchQuery.toLowerCase().trim();
    const name = (app.applicantName || app.name || '').toLowerCase();
    const email = (app.applicantEmail || app.email || '').toLowerCase();
    const agency = (app.agency || '').toLowerCase();
    const rera = (app.licenseNumber || '').toLowerCase();
    const matchesSearch =
      !query ||
      name.includes(query) ||
      email.includes(query) ||
      agency.includes(query) ||
      rera.includes(query);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Title, Live Telemetry Badge & Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
              Advisor Accreditation Dossiers
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Firestore</span>
            </div>
          </div>
          <p className="text-xs text-mutedText mt-0.5">
            Live evaluation of broker applications, RERA credentials, and advisor portal permissions
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{counts.pending} Awaiting Review</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            title="Refresh from Cloud Firestore"
            className="p-2 rounded-xl bg-white border border-sage/60 text-charcoal hover:bg-sage/20 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-forest' : 'text-charcoal'}`} />
          </button>
        </div>
      </div>

      {/* Permission-Denied / Firestore Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
          <div className="flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-red-950">
                {error.type === 'permission_denied'
                  ? 'Access Denied by Cloud Firestore Security Rules'
                  : 'Cloud Firestore Connection Issue'}
              </p>
              <p className="text-xs text-red-800 leading-relaxed">
                {error.message}
              </p>
              {error.type === 'permission_denied' && (
                <p className="text-[11px] text-red-700/90 font-mono">
                  Diagnostics: Authenticated user profile (/users/{adminUser?.uid || 'uid'}) must possess role: 'admin'.
                </p>
              )}
            </div>
          </div>
          <div className="pt-1 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
              Retry Query
            </Button>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Action Error Notification Banner */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-sage/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                : 'text-charcoal/70 hover:bg-sage/20'
            }`}
          >
            <span>Pending Review</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px]">
              {counts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'approved'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                : 'text-charcoal/70 hover:bg-sage/20'
            }`}
          >
            <span>Approved Advisors</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900 text-[10px]">
              {counts.approved}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'rejected'
                ? 'bg-red-100 text-red-900 border border-red-300 shadow-xs'
                : 'text-charcoal/70 hover:bg-sage/20'
            }`}
          >
            <span>Rejected</span>
            <span className="px-1.5 py-0.2 rounded-full bg-red-200 text-red-900 text-[10px]">
              {counts.rejected}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-forest text-white shadow-xs'
                : 'text-charcoal/70 hover:bg-sage/20'
            }`}
          >
            <span>All Dossiers</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px]">
              {counts.all}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applicant, RERA, agency..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-ivory border border-sage/70 text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-mutedText">Reading live advisor accreditation dossiers from Cloud Firestore...</p>
        </div>
      ) : applications.length === 0 && !error ? (
        <div className="bg-white rounded-2xl p-12 border border-sage/60 text-center space-y-3">
          <FileCheck className="w-10 h-10 text-mutedText mx-auto" />
          <h3 className="font-serif text-base font-bold text-charcoal">No Live Applications in Firestore</h3>
          <p className="text-xs text-mutedText max-w-sm mx-auto">
            The <code className="font-mono text-charcoal font-semibold">advisorApplications</code> collection is currently empty.
            When broker applicants submit dossiers through the Advisor Portal, they will appear here in real time.
          </p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-sage/60 text-center space-y-3">
          <FileCheck className="w-10 h-10 text-mutedText mx-auto" />
          <h3 className="font-serif text-base font-bold text-charcoal">No Matching Dossiers</h3>
          <p className="text-xs text-mutedText max-w-sm mx-auto">
            No applicant records match the '{activeTab}' filter tab and your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app) => (
            <div
              key={app.id || app.uid}
              className="bg-white rounded-2xl border border-sage/60 shadow-xs hover:border-forest/40 transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header: Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-serif text-sm font-bold text-charcoal truncate">
                      {app.applicantName || app.name || 'Advisor Applicant'}
                    </h3>
                    <p className="text-xs font-semibold text-forest truncate">
                      {app.agency || 'Independent Brokerage'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      app.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : app.status === 'rejected'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Details Pills */}
                <div className="bg-ivory/60 rounded-xl p-3 border border-sage/40 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-charcoal/80">
                    <Award className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>Experience: <strong>{app.experienceYears != null ? `${app.experienceYears} Years` : '—'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-charcoal/80">
                    <FileCheck className="w-3.5 h-3.5 text-forest shrink-0" />
                    <span className="truncate">RERA: <code className="font-mono text-[11px] font-bold">{app.licenseNumber || 'Pending'}</code></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-charcoal/80">
                    <Mail className="w-3.5 h-3.5 text-mutedText shrink-0" />
                    <span className="truncate text-[11px]">{app.applicantEmail || app.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-charcoal/80">
                    <Phone className="w-3.5 h-3.5 text-mutedText shrink-0" />
                    <span className="text-[11px]">{app.phone || 'N/A'}</span>
                  </div>
                </div>

                {/* Bio excerpt */}
                {app.bio ? (
                  <p className="text-[11px] text-mutedText line-clamp-2 leading-relaxed">
                    "{app.bio}"
                  </p>
                ) : (
                  <p className="text-[11px] text-mutedText/60 italic">
                    No bio summary provided.
                  </p>
                )}

                {/* Review note if existing */}
                {(app.reviewNotes || app.notes) && (
                  <div className="p-2 rounded-lg bg-sage-light/60 border border-sage text-[10px] text-charcoal/90">
                    <strong className="text-forest">Editorial Note:</strong> {app.reviewNotes || app.notes}
                  </div>
                )}
              </div>

              {/* Action Trigger & Submission Date */}
              <div className="pt-2 border-t border-sage/40 flex items-center justify-between">
                <span className="text-[10px] text-mutedText">
                  {app.submittedAt
                    ? `Submitted: ${new Date(app.submittedAt).toLocaleDateString()}`
                    : 'Submission: Date not recorded'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedApp(app);
                    setReviewNotes(app.reviewNotes || app.notes || '');
                    setActionError('');
                  }}
                  className="text-xs"
                >
                  Review Dossier
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* REVIEW DOSSIER MODAL DIALOG                              */}
      {/* ======================================================== */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-sage shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-sage/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                  Accreditation Dossier Evaluation (Live Cloud Firestore)
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-1">
                  {selectedApp.applicantName || selectedApp.name || 'Advisor Applicant'}
                </h3>
                <p className="text-xs text-forest font-semibold">
                  {selectedApp.agency || 'Independent Brokerage'}
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-xl text-mutedText hover:text-charcoal hover:bg-sage/20 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-ivory border border-sage/60 space-y-1">
                <span className="text-mutedText text-[10px] uppercase font-bold">RERA Registration</span>
                <p className="font-mono font-bold text-charcoal text-sm">{selectedApp.licenseNumber || 'Not submitted'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-ivory border border-sage/60 space-y-1">
                <span className="text-mutedText text-[10px] uppercase font-bold">Advisory Experience</span>
                <p className="font-bold text-charcoal text-sm">
                  {selectedApp.experienceYears != null ? `${selectedApp.experienceYears} Years Verified` : 'Not specified'}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-ivory border border-sage/60 space-y-1">
                <span className="text-mutedText text-[10px] uppercase font-bold">Direct Email</span>
                <p className="font-semibold text-charcoal truncate">{selectedApp.applicantEmail || selectedApp.email || 'N/A'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-ivory border border-sage/60 space-y-1">
                <span className="text-mutedText text-[10px] uppercase font-bold">Telephone Contact</span>
                <p className="font-semibold text-charcoal">{selectedApp.phone || 'N/A'}</p>
              </div>
            </div>

            {/* Specialties & Locations */}
            <div className="space-y-3 text-xs">
              {selectedApp.specialties && selectedApp.specialties.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-mutedText">Specialty Domains</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedApp.specialties.map((spec, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-sage-light text-forest text-[11px] font-semibold border border-sage">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.serviceLocations && selectedApp.serviceLocations.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-mutedText">Covered Micro-Markets</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedApp.serviceLocations.map((loc, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-ivory text-charcoal text-[11px] font-medium border border-sage/60">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.bio && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-mutedText">Professional Summary</span>
                  <p className="mt-1 p-3 rounded-xl bg-ivory/80 border border-sage/40 text-charcoal leading-relaxed text-xs">
                    {selectedApp.bio}
                  </p>
                </div>
              )}

              {/* Existing Review Audit History */}
              {selectedApp.reviewedAt && (
                <div className="p-3 rounded-xl bg-sage-light/50 border border-sage text-xs space-y-1">
                  <div className="flex items-center justify-between text-mutedText text-[11px]">
                    <span>Last Evaluated: <strong>{new Date(selectedApp.reviewedAt).toLocaleString()}</strong></span>
                    <span>Reviewer: <strong>{selectedApp.reviewedBy || 'Admin Console'}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Editorial Review Notes Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-charcoal">
                Editorial Review Audit Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                disabled={submitting}
                rows={3}
                placeholder="Record RERA registration verification notes or reasons for approval / rejection..."
                className="w-full p-3 rounded-xl bg-ivory border border-sage text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest disabled:opacity-50"
              />
            </div>

            {/* In-Modal Error Warning */}
            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-sage/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  icon={CheckCircle2}
                  disabled={submitting}
                  isLoading={submitting && selectedApp.status !== 'approved'}
                  onClick={() => handleUpdateStatus(selectedApp.uid || selectedApp.id, 'approved')}
                >
                  Approve Advisor Accreditation
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  icon={XCircle}
                  disabled={submitting}
                  isLoading={submitting && selectedApp.status === 'approved'}
                  onClick={() => handleUpdateStatus(selectedApp.uid || selectedApp.id, 'rejected')}
                >
                  Reject
                </Button>
              </div>

              {selectedApp.status !== 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={() => handleUpdateStatus(selectedApp.uid || selectedApp.id, 'pending')}
                  className="text-xs"
                >
                  Return to Pending Queue
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
