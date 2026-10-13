import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Building2,
  User,
  X,
  ExternalLink,
  Archive,
  ChevronRight,
  Trash2,
  RotateCw,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getFirestoreAdminInquiries,
  updateFirestoreInquiryStatus,
  deleteFirestoreInquiry,
} from '../../services/adminFirestoreService';

export default function AdminInquiries() {
  const { adminUser } = useAdminAuth();
  const [inquiries, setInquiries] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'new' | 'contacted' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getFirestoreAdminInquiries();
    setInquiries(data);
    setLoading(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    await updateFirestoreInquiryStatus(id, newStatus, adminUser?.email || 'Administrator');
    setNotification(`Inquiry status updated to: ${newStatus.toUpperCase()}`);
    setSelectedInquiry(null);
    await loadData();
    setTimeout(() => setNotification(''), 4000);
  };

  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Delete this client inquiry permanently from Cloud Firestore?')) return;
    const success = await deleteFirestoreInquiry(id, adminUser?.email || 'Administrator');
    if (success) {
      setNotification('Inquiry record deleted from Cloud Firestore.');
      setSelectedInquiry(null);
      await loadData();
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      inq.senderName.toLowerCase().includes(query) ||
      inq.senderEmail.toLowerCase().includes(query) ||
      inq.propertyTitle.toLowerCase().includes(query) ||
      inq.message.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
            Client Inquiries & Concierge Leads
          </h2>
          <p className="text-xs text-mutedText mt-0.5">
            Monitor client interest signals, audit advisor response times, and manage private communications
          </p>
        </div>
        <div className="text-xs text-mutedText">
          Total Inquiries: <strong className="text-forest">{inquiries.length} Records</strong>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-sage/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'new', 'contacted', 'closed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-forest text-white shadow-xs'
                  : 'bg-ivory text-charcoal/70 hover:bg-sage/30 border border-sage/40'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sender, property, text..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-ivory border border-sage/70 text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-mutedText">Loading client inquiries telemetry...</p>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-sage/60 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-mutedText mx-auto" />
          <h3 className="font-serif text-base font-bold text-charcoal">No Inquiries Found</h3>
          <p className="text-xs text-mutedText">No records match the active filter status.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sage/60 shadow-xs divide-y divide-sage/40 overflow-hidden">
          {filteredInquiries.map((inq) => (
            <div
              key={inq.id}
              className="p-5 hover:bg-ivory/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-charcoal">
                    {inq.senderName}
                  </span>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full ${
                      inq.status === 'new'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                        : inq.status === 'contacted'
                        ? 'bg-blue-100 text-blue-800'
                        : inq.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {inq.status}
                  </span>
                  <span className="text-[10px] text-mutedText font-mono">
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-forest font-semibold truncate">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{inq.propertyTitle}</span>
                  {inq.assignedAgentName && (
                    <span className="text-[11px] text-mutedText font-normal">
                      (Advisor: {inq.assignedAgentName})
                    </span>
                  )}
                </div>

                <p className="text-xs text-charcoal/80 line-clamp-2 leading-relaxed">
                  "{inq.message}"
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-mutedText pt-1">
                  <span>Email: <strong className="text-charcoal">{inq.senderEmail}</strong></span>
                  <span>Phone: <strong className="text-charcoal">{inq.senderPhone}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInquiry(inq)}
                  className="text-xs"
                >
                  Inspect Lead
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* INQUIRY DETAIL MODAL                                     */}
      {/* ======================================================== */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-sage shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-sage/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                  Client Inquiry Lead Dossier
                </span>
                <h3 className="font-serif text-xl font-bold text-charcoal mt-1">
                  {selectedInquiry.senderName}
                </h3>
                <p className="text-xs text-forest font-semibold">
                  Regarding: {selectedInquiry.propertyTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1 rounded-xl text-mutedText hover:text-charcoal hover:bg-sage/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sender details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-ivory border border-sage/60">
                <span className="text-[10px] uppercase font-bold text-mutedText block">Client Email</span>
                <span className="font-semibold text-charcoal">{selectedInquiry.senderEmail}</span>
              </div>
              <div className="p-3 rounded-xl bg-ivory border border-sage/60">
                <span className="text-[10px] uppercase font-bold text-mutedText block">Client Phone</span>
                <span className="font-semibold text-charcoal">{selectedInquiry.senderPhone}</span>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <span className="text-[10px] uppercase font-bold text-mutedText block mb-1">
                Inquiry Message Payload
              </span>
              <p className="p-4 rounded-xl bg-ivory/80 border border-sage/60 text-xs text-charcoal leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message}
              </p>
            </div>

            {/* Change Status Action */}
            <div className="space-y-3 pt-2 border-t border-sage/60">
              <span className="text-xs font-bold text-charcoal block">
                Update Concierge Status
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {['new', 'contacted', 'closed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedInquiry.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                        selectedInquiry.status === st
                          ? 'bg-forest text-white'
                          : 'bg-ivory text-charcoal hover:bg-sage/40 border border-sage/60'
                      }`}
                    >
                      Mark as {st}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                  className="text-red-700 hover:bg-red-50 hover:border-red-300 text-xs"
                >
                  Delete Inquiry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
