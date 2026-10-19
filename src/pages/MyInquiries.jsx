import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Building2,
  MapPin,
  Calendar,
  Clock,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  X,
  UserCheck,
  Tag,
  Eye,
  Mail,
  Phone,
  HelpCircle,
  Info,
  Shield,
} from 'lucide-react';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../context/AuthContext';
import { subscribeCustomerInquiries } from '../services/customerInquiryService';

function CustomerInquiryUpdateBox({ inquiry, formatDateTime }) {
  const status = inquiry.status;
  const adminNote = (inquiry.adminNotes || '').trim();
  const agentNote = (inquiry.agentNotes || '').trim();
  const hasAdminNote = Boolean(adminNote);
  const hasAgentNote = Boolean(agentNote);
  const hasAnyNote = hasAdminNote || hasAgentNote;

  if (status === 'new') {
    return (
      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-3">
        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-[11px] uppercase tracking-wider text-amber-900 block">
            Team Review in Progress
          </span>
          <p className="text-[11px] text-amber-900/80 leading-relaxed">
            Our concierge desk and regional advisors are currently reviewing your inquiry. Administrative and advisor updates will be posted here as soon as your request is handled.
          </p>
        </div>
      </div>
    );
  }

  if (!hasAnyNote) {
    return (
      <div className="p-3.5 rounded-xl bg-ivory border border-sage/60 text-xs text-mutedText flex items-center gap-2">
        <Info className="w-4 h-4 text-mutedText/70 shrink-0" />
        <span className="italic">No update provided yet.</span>
      </div>
    );
  }

  const isClosed = status === 'closed' || status === 'resolved';

  return (
    <div className="space-y-3">
      {/* 1. Administrative Follow-Up Note (Admin / Concierge Desk) */}
      {hasAdminNote && (
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-1.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-950 text-[11px] uppercase tracking-wider">
              {isClosed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              )}
              <span>{isClosed ? 'Final Administrative Resolution' : 'Administrative Follow-Up Note'}</span>
              <span className="text-blue-700 font-medium normal-case">
                • EstateVista Concierge Desk
              </span>
            </div>
            {inquiry.adminNotesUpdatedAt && (
              <span className="text-[10px] text-blue-800 font-mono">
                {formatDateTime(inquiry.adminNotesUpdatedAt)}
              </span>
            )}
          </div>
          <p className="text-xs text-charcoal/90 leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-blue-400">
            {adminNote}
          </p>
        </div>
      )}

      {/* 2. Designated Advisor Note (Assigned Property Agent) */}
      {hasAgentNote && (
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-[11px] uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isClosed ? 'Advisor Closing Note' : 'Designated Advisor Note'}</span>
              <span className="text-emerald-800 font-medium normal-case">
                • {inquiry.assignedAgentName || 'Assigned Property Advisor'}
              </span>
            </div>
            {inquiry.agentNotesUpdatedAt && (
              <span className="text-[10px] text-emerald-800 font-mono">
                {formatDateTime(inquiry.agentNotesUpdatedAt)}
              </span>
            )}
          </div>
          <p className="text-xs text-charcoal/90 leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-emerald-400">
            {agentNote}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MyInquiries() {
  const { currentUser, userProfile } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'new' | 'contacted' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      setInquiries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeCustomerInquiries(
      currentUser.uid,
      (data) => {
        setInquiries(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Failed to subscribe to customer inquiries:', err);
        setError('Unable to synchronize inquiry history from Cloud Firestore. Please verify your connection.');
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser, retryTrigger]);

  // Lock body scroll and close on Escape key when dossier modal is open
  useEffect(() => {
    if (!selectedInquiry) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedInquiry(null);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedInquiry]);

  // Status counters
  const counts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === 'new').length,
    contacted: inquiries.filter((i) => i.status === 'contacted').length,
    closed: inquiries.filter((i) => i.status === 'closed' || i.status === 'resolved').length,
  };

  // Filter and search logic
  const filteredInquiries = inquiries.filter((inq) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'closed'
        ? inq.status === 'closed' || inq.status === 'resolved'
        : inq.status === statusFilter;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (inq.propertyTitle || '').toLowerCase().includes(query) ||
      (inq.subject || '').toLowerCase().includes(query) ||
      (inq.propertyLocation || '').toLowerCase().includes(query) ||
      (inq.message || '').toLowerCase().includes(query) ||
      (inq.assignedAgentName || '').toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-700" />
            New / In Review
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
            <UserCheck className="w-3 h-3 text-blue-700" />
            Advisor Assigned
          </span>
        );
      case 'closed':
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Completed / Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold capitalize px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDateTime = (isoString) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recently';
      const datePart = d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const timePart = d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${datePart} at ${timePart}`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 animate-in fade-in duration-300">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sage/60 pb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-mutedText mb-2">
            <Link to="/" className="hover:text-forest transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-forest font-semibold">My Inquiries</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block mb-1">
            Private Concierge Telemetry
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal">
            My Inquiries & Concierge Requests
          </h1>
          <p className="text-xs sm:text-sm text-mutedText max-w-2xl mt-1.5 leading-relaxed">
            Track private walkthrough schedules, architectural floorplan requests, general concierge communications, and advisor updates in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-sage/80 shadow-xs flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-forest" />
            <span className="text-mutedText">Total Inquiries:</span>
            <strong className="text-forest font-bold text-sm">{counts.all}</strong>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to Load Inquiries</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="text-xs font-bold underline hover:text-red-900 inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Controls: Filter Tabs + Search */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sage/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Inquiries', count: counts.all },
            { id: 'new', label: 'New / In Review', count: counts.new },
            { id: 'contacted', label: 'Advisor Assigned', count: counts.contacted },
            { id: 'closed', label: 'Completed', count: counts.closed },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-forest text-white shadow-xs'
                    : 'bg-ivory text-charcoal/80 hover:bg-sage/40 border border-sage/50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-sage/60 text-forest'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search residence, subject, notes..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-ivory border border-sage/70 text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mutedText hover:text-charcoal p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20">
          <LoadingState message="Fetching your real-time inquiry telemetry from Cloud Firestore..." />
        </div>
      ) : inquiries.length === 0 ? (
        /* Empty State: Customer has no inquiries yet */
        <div className="bg-white rounded-3xl p-10 sm:p-16 border border-sage/60 shadow-soft text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-sage-light text-forest flex items-center justify-center mx-auto shadow-xs border border-sage">
            <MessageSquare className="w-8 h-8 text-gold-dark" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-charcoal">
              No Inquiries on Record
            </h3>
            <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
              You haven't submitted any property walkthrough or concierge inquiries yet. When you discover a residence in our curated portfolio or submit a message to our concierge desk, your complete request history and real-time advisor updates will appear here.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/properties">
              <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                Explore Available Residences
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="md">
                Contact Concierge
              </Button>
            </Link>
          </div>
        </div>
      ) : filteredInquiries.length === 0 ? (
        /* No records matching active filter or search */
        <div className="bg-white rounded-3xl p-12 border border-sage/60 text-center space-y-4">
          <MessageSquare className="w-10 h-10 text-mutedText mx-auto" />
          <h4 className="font-serif text-lg font-bold text-charcoal">
            No Matching Inquiries Found
          </h4>
          <p className="text-xs text-mutedText max-w-md mx-auto">
            No inquiry records match the selected filter <em>"{statusFilter}"</em>{' '}
            {searchQuery ? `and query "${searchQuery}"` : ''}.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        /* Inquiries Cards Stream */
        <div className="space-y-4">
          {filteredInquiries.map((inq) => {
            const isPropertyInquiry = Boolean(inq.propertyId);
            return (
              <div
                key={inq.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-sage/60 p-5 sm:p-6 shadow-xs hover:border-forest/40 hover:shadow-soft transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Block: Thumbnail + Inquiry Details */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-w-0 flex-1">
                  {/* Property Image or General Inquiry Icon Banner */}
                  <div className="relative w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-ivory shrink-0 border border-sage/50">
                    {isPropertyInquiry && inq.propertyThumbnail ? (
                      <img
                        src={inq.propertyThumbnail}
                        alt={inq.propertyTitle}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sage/30 to-sage/10 text-forest p-3 text-center">
                        {isPropertyInquiry ? (
                          <>
                            <Building2 className="w-7 h-7 text-gold mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/70">
                              Private Residence
                            </span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-7 h-7 text-forest mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-forest font-sans">
                              General Inquiry
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {inq.propertyListingType && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-forest/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                        {inq.propertyListingType}
                      </span>
                    )}
                  </div>

                  {/* Text Meta */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(inq.status)}

                      <span className="inline-flex items-center gap-1 text-[11px] text-mutedText font-mono">
                        <Calendar className="w-3 h-3 text-gold" />
                        {formatDateTime(inq.createdAt)}
                      </span>

                      {/* Explicit General Inquiry vs Listing Inquiry Tag */}
                      {isPropertyInquiry ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sage-light text-forest border border-sage">
                          Listing Inquiry
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300">
                          General Inquiry
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-base sm:text-lg font-bold text-charcoal hover:text-forest transition-colors truncate">
                      {inq.propertyTitle}
                    </h3>

                    {inq.propertyLocation && (
                      <div className="flex items-center gap-1.5 text-xs text-mutedText truncate">
                        <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span className="truncate">{inq.propertyLocation}</span>
                      </div>
                    )}

                    {/* Assigned Advisor Info */}
                    {inq.assignedAgentName && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-forest bg-sage-light/60 px-2.5 py-1 rounded-lg border border-sage/60">
                        <UserCheck className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span>
                          Designated Advisor: <strong>{inq.assignedAgentName}</strong>
                        </span>
                      </div>
                    )}

                    {/* Message Preview */}
                    <p className="text-xs text-charcoal/80 line-clamp-2 leading-relaxed bg-ivory/60 p-2.5 rounded-xl border border-sage/40">
                      "{inq.message}"
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-row md:flex-col items-center sm:justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-sage/40">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => setSelectedInquiry(inq)}
                    className="text-xs w-full sm:w-auto"
                  >
                    View Details
                  </Button>

                  {isPropertyInquiry && (
                    <Link
                      to={`/properties/${inq.propertyId}`}
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={ExternalLink}
                        iconPosition="right"
                        className="text-xs w-full"
                      >
                        View Property
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Helpful Policy Note */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sage/60 text-xs text-mutedText flex items-start gap-3 shadow-xs">
        <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-semibold text-charcoal">
            EstateVista Member Privacy & Inquiry Protocol
          </p>
          <p>
            Your inquiry communications are protected by confidential multi-tenant isolation. All inquiries submitted while signed in to your account are tracked here in real time. For immediate concierge assistance, reach out directly via our contact desk.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INQUIRY DETAIL MODAL                                     */}
      {/* ======================================================== */}
      {selectedInquiry && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-detail-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedInquiry(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-charcoal/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full border border-sage shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Sticky Header with Guaranteed-Visible Close Button */}
            <div className="shrink-0 px-6 sm:px-8 py-4 sm:py-5 border-b border-sage/60 bg-white flex items-center justify-between gap-4 z-10 shadow-xs">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark block truncate">
                  {selectedInquiry.propertyId ? 'Confidential Property Dossier' : 'General Concierge Dossier'}
                </span>
                <h3
                  id="inquiry-detail-modal-title"
                  className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-0.5 truncate"
                >
                  {selectedInquiry.propertyTitle}
                </h3>
                {selectedInquiry.propertyLocation && (
                  <p className="text-xs text-mutedText flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span className="truncate">{selectedInquiry.propertyLocation}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="shrink-0 p-2.5 rounded-2xl bg-ivory hover:bg-sage/40 text-charcoal/80 hover:text-charcoal border border-sage/80 transition-all shadow-2xs cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-forest"
                aria-label="Close dossier modal"
                title="Close (Esc)"
              >
                <X className="w-5 h-5 text-charcoal" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto px-6 sm:px-8 py-5 sm:py-6 space-y-5 flex-1">
              {/* Status & Timestamp Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-ivory border border-sage/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-mutedText">Current Status:</span>
                  {getStatusBadge(selectedInquiry.status)}
                </div>
                <div className="flex items-center gap-1.5 text-mutedText font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span>Submitted: {formatDateTime(selectedInquiry.createdAt)}</span>
                </div>
              </div>

              {/* Inquiry Type Identifier */}
              <div className="text-xs text-mutedText flex items-center gap-2">
                <span className="font-semibold text-charcoal">Inquiry Classification:</span>
                {selectedInquiry.propertyId ? (
                  <span className="text-[11px] font-semibold text-forest bg-sage-light px-2.5 py-0.5 rounded-md border border-sage">
                    Property Walkthrough & Spec Request (Ref ID: {selectedInquiry.propertyId})
                  </span>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-300">
                    General Concierge Inquiry
                  </span>
                )}
              </div>

              {/* Advisor Representation Card */}
              {selectedInquiry.assignedAgentName ? (
                <div className="p-4 rounded-2xl bg-sage-light/60 border border-sage flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest text-gold flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-forest">
                      Designated Advisor Assigned
                    </h4>
                    <p className="text-xs text-charcoal mt-0.5">
                      <strong>{selectedInquiry.assignedAgentName}</strong> has been allocated to oversee your inquiry and arrange a confidential walkthrough.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <p className="font-semibold">In Concierge Allocation Queue</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Our lead concierge is reviewing regional advisor availability. An accredited advisor will be allocated within 24 business hours.
                    </p>
                  </div>
                </div>
              )}

              {/* Team Updates & Resolution Status (Renders both Admin Notes and Agent Notes) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block">
                  Team Updates & Resolution Status
                </span>
                <CustomerInquiryUpdateBox inquiry={selectedInquiry} formatDateTime={formatDateTime} />
              </div>

              {/* Message Body */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block mb-1.5">
                  Submitted Message Payload
                </span>
                <div className="p-4 rounded-2xl bg-ivory/80 border border-sage/60 text-xs sm:text-sm text-charcoal leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Client Contact Submitted */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-ivory border border-sage/60">
                  <span className="text-[10px] font-bold uppercase text-mutedText block">Client Name</span>
                  <span className="font-semibold text-charcoal truncate block">
                    {selectedInquiry.clientName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-ivory border border-sage/60">
                  <span className="text-[10px] font-bold uppercase text-mutedText block">Contact Email</span>
                  <span className="font-semibold text-forest truncate block">
                    {selectedInquiry.clientEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="shrink-0 px-6 sm:px-8 py-3.5 sm:py-4 border-t border-sage/60 bg-ivory/60 flex items-center justify-end gap-3 z-10">
              {selectedInquiry.propertyId && (
                <Link
                  to={`/properties/${selectedInquiry.propertyId}`}
                  onClick={() => setSelectedInquiry(null)}
                >
                  <Button variant="primary" size="sm" icon={ExternalLink} iconPosition="right">
                    View Property Listing
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                icon={X}
                onClick={() => setSelectedInquiry(null)}
              >
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
