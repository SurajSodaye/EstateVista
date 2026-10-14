import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../context/AuthContext';
import { subscribeCustomerInquiries } from '../services/customerInquiryService';

export default function MyInquiries() {
  const { currentUser, userProfile } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'new' | 'contacted' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);

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
        setError('Unable to synchronize inquiry history. Please verify your connection.');
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser]);

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
            Walkthrough Completed
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
            My Property Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-mutedText max-w-2xl mt-1.5 leading-relaxed">
            Track private walkthrough schedules, floor plan disclosures, and direct communications with accredited EstateVista advisors.
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
            onClick={() => window.location.reload()}
            className="text-xs font-bold underline hover:text-red-900"
          >
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
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
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
            placeholder="Search property, location, notes..."
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
          <LoadingState message="Fetching your confidential inquiry telemetry from Cloud Firestore..." />
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
              You haven't submitted any property walkthrough or acquisition inquiries yet. When you discover a residence in our curated portfolio and submit an inquiry, your complete request history and advisor status updates will appear here in real time.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/properties">
              <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                Explore Available Residences
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
            const hasProperty = Boolean(inq.propertyId);
            return (
              <div
                key={inq.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-sage/60 p-5 sm:p-6 shadow-xs hover:border-forest/40 hover:shadow-soft transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Block: Thumbnail + Property Details */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-w-0 flex-1">
                  {/* Property Image or Luxury Placeholder */}
                  <div className="relative w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-ivory shrink-0 border border-sage/50">
                    {inq.propertyThumbnail ? (
                      <img
                        src={inq.propertyThumbnail}
                        alt={inq.propertyTitle}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sage/30 to-sage/10 text-forest p-3 text-center">
                        <Building2 className="w-7 h-7 text-gold mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/70">
                          {inq.source === 'contact_form' ? 'Concierge Lead' : 'Private Residence'}
                        </span>
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
                        {new Date(inq.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          inq.source === 'property_inquiry'
                            ? 'bg-sage-light text-forest border border-sage'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {inq.source === 'property_inquiry' ? 'Listing Inquiry' : 'Concierge Form'}
                      </span>
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

                  {hasProperty && (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-sage shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-sage/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark block">
                  Confidential Inquiry Dossier
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-1">
                  {selectedInquiry.propertyTitle}
                </h3>
                {selectedInquiry.propertyLocation && (
                  <p className="text-xs text-mutedText flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>{selectedInquiry.propertyLocation}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1 rounded-xl text-mutedText hover:text-charcoal hover:bg-sage/30 transition-colors"
                aria-label="Close dossier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Timestamp Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-ivory border border-sage/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-mutedText">Current Status:</span>
                {getStatusBadge(selectedInquiry.status)}
              </div>
              <div className="flex items-center gap-1.5 text-mutedText font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-gold" />
                <span>Submitted: {new Date(selectedInquiry.createdAt).toLocaleString()}</span>
              </div>
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
            <div className="grid grid-cols-2 gap-3 text-xs">
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

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-sage/60">
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
