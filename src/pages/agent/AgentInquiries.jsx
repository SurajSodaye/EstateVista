import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  Phone,
  Mail,
  Calendar,
  Building2,
  X,
  ExternalLink,
  Save,
  Sparkles,
  Info,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import {
  getAgentInquiries,
  subscribeAgentInquiries,
  updateInquiryStatus,
  markInquiryReadStatus,
} from '../../services/agentPortalService';

export default function AgentInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Inquiry for Detail Modal/Panel
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeAgentInquiries(
      (data) => {
        setInquiries(data);
        setLoading(false);
        setError(null);
      },
      { search, status: statusFilter }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [search, statusFilter]);

  const handleOpenDetail = (inquiry) => {
    setSelectedInquiry(inquiry);
    setEditingNotes(inquiry.agentNotes || '');
  };

  const handleStatusChange = async (inquiryId, newStatus) => {
    await updateInquiryStatus(inquiryId, newStatus, editingNotes);
    if (selectedInquiry && selectedInquiry.id === inquiryId) {
      setSelectedInquiry((prev) => ({
        ...prev,
        status: newStatus,
        isRead: newStatus !== 'new',
      }));
    }
  };

  const handleToggleRead = async (e, inquiryId, newIsRead) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await markInquiryReadStatus(inquiryId, newIsRead);
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry((prev) => ({ ...prev, isRead: newIsRead }));
      }
    } catch (err) {
      console.error('Failed to update read status:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setIsSavingNotes(true);
    await updateInquiryStatus(selectedInquiry.id, selectedInquiry.status, editingNotes);
    setIsSavingNotes(false);
    setSelectedInquiry((prev) => ({ ...prev, agentNotes: editingNotes }));
  };

  const statusTabs = [
    { id: 'all', label: 'All Inquiries' },
    { id: 'unread', label: 'New / Unread' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'closed', label: 'Closed' },
  ];

  const getStatusBadge = (status, isRead) => {
    if (isRead === false || status === 'new') {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold">● Unread Lead</Badge>;
    }
    switch (status) {
      case 'contacted':
        return <Badge className="bg-blue-50 text-blue-800 border-blue-200">Contacted</Badge>;
      case 'closed':
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">Closed</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Read</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-charcoal tracking-tight">
            Client Inquiries & Leads
          </h2>
          <p className="text-xs sm:text-sm text-mutedText">
            Direct inquiries and leads received from prospective buyers and tenants.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-Time Cloud Firestore Sync</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-sage p-4 shadow-soft space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none border-b border-sage/60">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-charcoal/70 hover:bg-sage/40 hover:text-forest'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by client name, email, or property title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory/60 border border-sage text-xs sm:text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest text-charcoal placeholder-mutedText/70"
          />
        </div>
      </div>

      {/* Inquiry List Content */}
      {loading ? (
        <LoadingState message="Retrieving client inquiry records..." />
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage p-8 shadow-soft">
          <EmptyState
            title="No Inquiries Found"
            message={
              search || statusFilter !== 'all'
                ? 'No inquiries match your current search or status filter.'
                : 'No inquiries have been received yet. Test by submitting an inquiry from any public property details page.'
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sage shadow-soft overflow-hidden divide-y divide-sage/40">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              onClick={() => handleOpenDetail(inq)}
              className={`p-5 hover:bg-ivory/40 transition-colors cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                inq.isRead === false ? 'bg-amber-50/20' : ''
              }`}
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {getStatusBadge(inq.status, inq.isRead)}
                  <h4 className="text-sm font-bold text-charcoal group-hover:text-forest transition-colors">
                    {inq.clientName}
                  </h4>
                  <span className="text-xs text-mutedText">•</span>
                  <span className="text-xs text-mutedText font-medium">
                    {inq.clientEmail}
                  </span>
                </div>

                <p className="text-xs font-semibold text-forest flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Listing: {inq.propertyTitle}</span>
                </p>

                <p className="text-xs text-charcoal/70 line-clamp-2 leading-relaxed">
                  "{inq.message}"
                </p>

                {inq.agentNotes && (
                  <p className="text-[11px] text-mutedText bg-sage-light/60 px-2 py-0.5 rounded inline-block">
                    Advisor note: {inq.agentNotes}
                  </p>
                )}
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-2">
                <span className="text-[11px] text-mutedText flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(inq.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleToggleRead(e, inq.id, !inq.isRead)}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold text-charcoal/70 hover:text-forest hover:bg-sage/40 transition-colors"
                    title={inq.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  >
                    {inq.isRead ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Review
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* INQUIRY DETAIL MODAL                                     */}
      {/* ======================================================== */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedInquiry(null)}
            aria-hidden="true"
          />

          <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-sage p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-sage/60">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(selectedInquiry.status, selectedInquiry.isRead)}
                  <span className="text-[11px] font-semibold text-mutedText">
                    Inquiry ID: {selectedInquiry.id}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-charcoal">
                  {selectedInquiry.clientName}
                </h3>
                <p className="text-xs text-mutedText">
                  Received on{' '}
                  {new Date(selectedInquiry.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleToggleRead(e, selectedInquiry.id, !selectedInquiry.isRead)}
                  className="text-xs"
                >
                  {selectedInquiry.isRead ? 'Mark Unread' : 'Mark Read'}
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="p-1.5 rounded-lg text-mutedText hover:text-charcoal hover:bg-sage/40 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Property Reference */}
            <div className="p-4 rounded-xl bg-ivory border border-sage/80 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-mutedText tracking-wider">
                  Associated Listing
                </span>
                <p className="text-xs font-bold text-forest truncate mt-0.5">
                  {selectedInquiry.propertyTitle}
                </p>
              </div>
              <a
                href={`/properties/${selectedInquiry.propertyId}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-forest hover:bg-sage/40 rounded-lg shrink-0"
                title="View Public Listing"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Client Message */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal/70 mb-2">
                Client Message
              </h4>
              <div className="p-4 rounded-xl bg-sage-light/40 border border-sage text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
                "{selectedInquiry.message}"
              </div>
            </div>

            {/* Client Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-sage bg-white space-y-1">
                <span className="text-[11px] font-semibold text-mutedText flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-forest" /> Email Address
                </span>
                <p className="text-xs font-bold text-charcoal select-all">
                  {selectedInquiry.clientEmail}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-sage bg-white space-y-1">
                <span className="text-[11px] font-semibold text-mutedText flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-forest" /> Phone Number
                </span>
                <p className="text-xs font-bold text-charcoal select-all">
                  {selectedInquiry.clientPhone}
                </p>
              </div>

              {selectedInquiry.preferredTime && (
                <div className="p-3.5 rounded-xl border border-sage bg-white space-y-1">
                  <span className="text-[11px] font-semibold text-mutedText flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-forest" /> Preferred Time
                  </span>
                  <p className="text-xs font-bold text-charcoal">
                    {selectedInquiry.preferredTime}
                  </p>
                </div>
              )}

              {selectedInquiry.budgetRange && (
                <div className="p-3.5 rounded-xl border border-sage bg-white space-y-1">
                  <span className="text-[11px] font-semibold text-mutedText">
                    Estimated Budget Range
                  </span>
                  <p className="text-xs font-bold text-forest">
                    {selectedInquiry.budgetRange}
                  </p>
                </div>
              )}
            </div>

            {/* Status Transition Control */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal/70 mb-2">
                Update Lead Status
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedInquiry.id, 'new')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    selectedInquiry.status === 'new'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                      : 'bg-white text-charcoal/70 border-sage hover:bg-sage/30'
                  }`}
                >
                  New Lead
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedInquiry.id, 'contacted')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    selectedInquiry.status === 'contacted'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-charcoal/70 border-sage hover:bg-sage/30'
                  }`}
                >
                  Contacted
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedInquiry.id, 'closed')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    selectedInquiry.status === 'closed'
                      ? 'bg-forest text-white border-forest shadow-xs'
                      : 'bg-white text-charcoal/70 border-sage hover:bg-sage/30'
                  }`}
                >
                  Closed
                </button>
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal/70">
                  Internal Advisor Notes
                </label>
                <span className="text-[11px] text-emerald-700 font-medium">Persisted to Firestore</span>
              </div>
              <textarea
                rows={3}
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Record call summary, client feedback, walkthrough dates, or next action items..."
                className="w-full p-3 rounded-xl bg-ivory/60 border border-sage text-xs text-charcoal focus:outline-none focus:border-forest"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Save}
                  onClick={handleSaveNotes}
                  isLoading={isSavingNotes}
                >
                  Save Notes
                </Button>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="pt-4 border-t border-sage/60 flex items-center justify-between">
              <span className="text-[11px] text-mutedText italic flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Synchronized with Cloud Firestore inquiry records.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInquiry(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
