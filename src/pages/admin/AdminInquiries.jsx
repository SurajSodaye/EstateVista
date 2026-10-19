import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Building2,
  User,
  X,
  ExternalLink,
  Trash2,
  AlertCircle,
  Shield,
  UserCheck,
  Save,
  Tag,
  RefreshCw,
  FileText,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  subscribeFirestoreAdminInquiries,
  getFirestoreAdminInquiries,
  getFirestoreApprovedAdvisors,
  updateFirestoreInquiryStatus,
  updateFirestoreInquiryAdminNotes,
  assignFirestoreInquiryAdvisor,
  deleteFirestoreInquiry,
} from '../../services/adminFirestoreService';

export default function AdminInquiries() {
  const { adminUser } = useAdminAuth();
  const [inquiries, setInquiries] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'new' | 'contacted' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [notification, setNotification] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal edit states
  const [modalAdminNotes, setModalAdminNotes] = useState('');
  const [selectedAdvisorUid, setSelectedAdvisorUid] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [assigningAdvisor, setAssigningAdvisor] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deletingInquiry, setDeletingInquiry] = useState(false);

  useEffect(() => {
    loadApprovedAdvisors();

    setLoading(true);
    const unsubscribe = subscribeFirestoreAdminInquiries((data) => {
      setInquiries(data);
      setLoading(false);

      setSelectedInquiry((prev) => {
        if (!prev) return null;
        const updated = data.find((i) => i.id === prev.id);
        return updated || null;
      });
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const loadApprovedAdvisors = async () => {
    try {
      const list = await getFirestoreApprovedAdvisors();
      setAdvisors(list);
    } catch (err) {
      console.warn('Failed to load approved advisors list:', err);
    }
  };

  const handleOpenModal = (inq) => {
    setSelectedInquiry(inq);
    setModalAdminNotes(inq.adminNotes || '');
    setSelectedAdvisorUid(inq.advisorUid || '');
    setErrorMessage('');
  };

  const handleCloseModal = () => {
    setSelectedInquiry(null);
    setModalAdminNotes('');
    setSelectedAdvisorUid('');
    setErrorMessage('');
  };

  const handleStatusChange = async (id, newStatus) => {
    setStatusUpdating(true);
    setErrorMessage('');
    try {
      const ok = await updateFirestoreInquiryStatus(id, newStatus, adminUser?.email || 'Administrator');
      if (ok) {
        showSuccessNotification(`Inquiry status updated to: ${newStatus.toUpperCase()}`);
      } else {
        setErrorMessage('Failed to update inquiry status in Firestore.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setErrorMessage(err.message || 'Error updating status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedInquiry) return;
    setSavingNotes(true);
    setErrorMessage('');
    try {
      const ok = await updateFirestoreInquiryAdminNotes(
        selectedInquiry.id,
        modalAdminNotes,
        adminUser?.email || 'Administrator'
      );
      if (ok) {
        showSuccessNotification('Administrative follow-up notes successfully saved and synced to client view.');
        setSelectedInquiry((prev) => ({
          ...prev,
          adminNotes: modalAdminNotes.trim(),
          adminNotesUpdatedAt: new Date().toISOString(),
        }));
      } else {
        setErrorMessage('Failed to save administrative notes.');
      }
    } catch (err) {
      console.error('Error saving admin notes:', err);
      setErrorMessage(err.message || 'Error saving notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAssignAdvisor = async () => {
    if (!selectedInquiry) return;
    setAssigningAdvisor(true);
    setErrorMessage('');
    try {
      const chosen = advisors.find((a) => a.uid === selectedAdvisorUid);
      const advisorName = chosen ? chosen.name : '';

      const ok = await assignFirestoreInquiryAdvisor(
        selectedInquiry.id,
        selectedAdvisorUid,
        advisorName,
        adminUser?.email || 'Administrator'
      );
      if (ok) {
        showSuccessNotification(
          selectedAdvisorUid
            ? `Inquiry successfully assigned to ${advisorName || 'Advisor'}.`
            : 'Inquiry unassigned and returned to Concierge queue.'
        );
      } else {
        setErrorMessage('Failed to update advisor assignment in Firestore.');
      }
    } catch (err) {
      console.error('Error assigning advisor:', err);
      setErrorMessage(err.message || 'Error assigning advisor');
    } finally {
      setAssigningAdvisor(false);
    }
  };

  const isTestInquiry = (inq) => {
    const email = (inq.clientEmail || inq.senderEmail || '').toLowerCase();
    const name = (inq.clientName || inq.senderName || '').toLowerCase();
    const msg = (inq.message || '').toLowerCase();
    return (
      email.includes('@estatevista.test') ||
      email.includes('@example.com') ||
      email.includes('anonymous.buyer') ||
      email.includes('test-customer') ||
      name.includes('aarav sharma') ||
      name.includes('guest visitor') ||
      name.includes('customer a') ||
      name.includes('customer b') ||
      msg.includes('testing customer inquiry') ||
      msg.includes('public inquiry without account')
    );
  };

  const [cleaningTests, setCleaningTests] = useState(false);

  const handleCleanAllTestInquiries = async () => {
    const testList = inquiries.filter(isTestInquiry);
    if (testList.length === 0) {
      showSuccessNotification('No automated test inquiries detected.');
      return;
    }

    if (
      !window.confirm(
        `Permanently remove all ${testList.length} automated test inquiries from Cloud Firestore? Genuine customer inquiries (such as user@gmail.com) will be preserved.`
      )
    ) {
      return;
    }

    setCleaningTests(true);
    setErrorMessage('');
    let deletedCount = 0;
    try {
      for (const inq of testList) {
        await deleteFirestoreInquiry(inq.id, adminUser?.email || 'Administrator');
        deletedCount++;
      }
      showSuccessNotification(`Successfully purged ${deletedCount} test inquiries from Cloud Firestore.`);
    } catch (err) {
      console.error('Failed to clean test inquiries:', err);
      setErrorMessage(err.message || 'Error purging some test inquiries.');
    } finally {
      setCleaningTests(false);
    }
  };

  const testInquiriesCount = inquiries.filter(isTestInquiry).length;

  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Delete this client inquiry permanently from Cloud Firestore? This action cannot be undone.')) return;
    setDeletingInquiry(true);
    setErrorMessage('');
    try {
      const success = await deleteFirestoreInquiry(id, adminUser?.email || 'Administrator');
      if (success) {
        showSuccessNotification('Inquiry record permanently deleted from Cloud Firestore.');
        handleCloseModal();
      } else {
        setErrorMessage('Failed to delete inquiry from Firestore.');
      }
    } catch (err) {
      console.error('Error deleting inquiry:', err);
      setErrorMessage(err.message || 'Error deleting inquiry');
    } finally {
      setDeletingInquiry(false);
    }
  };

  const showSuccessNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const sender = (inq.clientName || inq.senderName || '').toLowerCase();
    const email = (inq.clientEmail || inq.senderEmail || '').toLowerCase();
    const prop = (inq.propertyTitle || '').toLowerCase();
    const msg = (inq.message || '').toLowerCase();
    const agent = (inq.assignedAgentName || '').toLowerCase();
    const subject = (inq.subject || '').toLowerCase();

    const matchesSearch =
      !query ||
      sender.includes(query) ||
      email.includes(query) ||
      prop.includes(query) ||
      msg.includes(query) ||
      agent.includes(query) ||
      subject.includes(query);

    return matchesStatus && matchesSearch;
  });

  const counts = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === 'new').length,
    contacted: inquiries.filter((i) => i.status === 'contacted').length,
    closed: inquiries.filter((i) => i.status === 'closed' || i.status === 'resolved').length,
    unassigned: inquiries.filter((i) => !i.advisorUid).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
            Client Inquiries & Concierge Leads
          </h2>
          <p className="text-xs text-mutedText mt-0.5">
            Monitor client acquisition signals, manage advisor assignments, and record executive follow-up notes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {testInquiriesCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              onClick={handleCleanAllTestInquiries}
              isLoading={cleaningTests}
              disabled={cleaningTests}
              className="text-xs text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 font-semibold cursor-pointer shadow-xs"
            >
              Purge {testInquiriesCount} Test Inquiries
            </Button>
          )}
          <span className="px-3 py-1 rounded-xl bg-ivory border border-sage/60 text-mutedText">
            Total: <strong className="text-forest">{counts.total}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            New: <strong className="font-bold">{counts.new}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
            Contacted: <strong>{counts.contacted}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            Closed: <strong>{counts.closed}</strong>
          </span>
          {counts.unassigned > 0 && (
            <span className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 font-semibold">
              Unassigned: <strong>{counts.unassigned}</strong>
            </span>
          )}
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
              {st} {st !== 'all' && `(${counts[st] || 0})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, property, advisor..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-ivory border border-sage/70 text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-mutedText">Synchronizing client inquiries from Cloud Firestore...</p>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-sage/60 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-mutedText mx-auto" />
          <h3 className="font-serif text-base font-bold text-charcoal">No Inquiries Found</h3>
          <p className="text-xs text-mutedText">
            {searchQuery
              ? 'No client inquiry matches your search criteria.'
              : 'No client inquiries in this filter category.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sage/60 shadow-xs divide-y divide-sage/40 overflow-hidden">
          {filteredInquiries.map((inq) => {
            const isUnassigned = !inq.advisorUid;
            return (
              <div
                key={inq.id}
                className="p-5 hover:bg-ivory/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-charcoal">
                      {inq.clientName || inq.senderName}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        inq.status === 'new'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                          : inq.status === 'contacted'
                          ? 'bg-blue-100 text-blue-800'
                          : inq.status === 'closed' || inq.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {inq.status}
                    </span>

                    {/* Source Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        inq.source === 'property_inquiry'
                          ? 'bg-forest/10 text-forest border border-forest/20'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {inq.source === 'property_inquiry' ? 'Property Listing' : 'Contact Form'}
                    </span>

                    {/* Timestamp */}
                    <span className="text-[10px] text-mutedText font-mono">
                      {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  {/* Property / Topic Title */}
                  <div className="flex items-center gap-1.5 text-xs text-forest font-semibold truncate">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{inq.propertyTitle}</span>
                  </div>

                  {/* Advisor status badge */}
                  <div className="flex items-center gap-2 pt-0.5">
                    {isUnassigned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        Unassigned (Concierge Queue)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sage-light text-forest text-[11px] font-medium border border-sage">
                        <UserCheck className="w-3 h-3 text-gold shrink-0" />
                        Advisor: <strong className="text-charcoal">{inq.assignedAgentName || 'Assigned'}</strong>
                      </span>
                    )}

                    {inq.adminNotes && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-forest font-medium bg-sage-light/60 border border-sage px-2 py-0.5 rounded-md">
                        <FileText className="w-3 h-3 text-forest shrink-0" />
                        Has Follow-Up Notes
                      </span>
                    )}
                  </div>

                  {/* Message excerpt */}
                  <p className="text-xs text-charcoal/80 line-clamp-2 leading-relaxed pt-0.5">
                    "{inq.message}"
                  </p>

                  {/* Contact info strip */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-mutedText pt-1">
                    <span>
                      Email: <strong className="text-charcoal">{inq.clientEmail || inq.senderEmail}</strong>
                    </span>
                    {(inq.clientPhone || inq.senderPhone) && (
                      <span>
                        Phone: <strong className="text-charcoal">{inq.clientPhone || inq.senderPhone}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(inq)}
                    className="text-xs"
                  >
                    Inspect Lead
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDeleteInquiry(inq.id)}
                    className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                    title="Delete inquiry permanently from Firestore"
                    aria-label="Delete inquiry permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* INQUIRY DETAIL MODAL                                     */}
      {/* ======================================================== */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-sage shadow-2xl p-6 sm:p-8 space-y-6 my-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-sage/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                    Client Inquiry Lead Dossier
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedInquiry.status === 'new'
                        ? 'bg-amber-100 text-amber-900'
                        : selectedInquiry.status === 'contacted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedInquiry.status}
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-1">
                  {selectedInquiry.clientName || selectedInquiry.senderName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-forest font-semibold">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{selectedInquiry.propertyTitle}</span>
                  {selectedInquiry.propertyId && (
                    <Link
                      to={`/properties/${selectedInquiry.propertyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-gold hover:underline inline-flex items-center gap-0.5"
                    >
                      (View Listing <ExternalLink className="w-2.5 h-2.5" />)
                    </Link>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-xl text-mutedText hover:text-charcoal hover:bg-sage/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sender and inquiry metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-ivory border border-sage/60">
                <span className="text-[10px] uppercase font-bold text-mutedText block">Client Email</span>
                <a
                  href={`mailto:${selectedInquiry.clientEmail || selectedInquiry.senderEmail}`}
                  className="font-semibold text-forest hover:underline break-all"
                >
                  {selectedInquiry.clientEmail || selectedInquiry.senderEmail}
                </a>
              </div>
              <div className="p-3 rounded-xl bg-ivory border border-sage/60">
                <span className="text-[10px] uppercase font-bold text-mutedText block">Client Phone</span>
                {selectedInquiry.clientPhone || selectedInquiry.senderPhone ? (
                  <a
                    href={`tel:${selectedInquiry.clientPhone || selectedInquiry.senderPhone}`}
                    className="font-semibold text-charcoal hover:underline"
                  >
                    {selectedInquiry.clientPhone || selectedInquiry.senderPhone}
                  </a>
                ) : (
                  <span className="text-mutedText">Not provided</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-ivory border border-sage/60">
                <span className="text-[10px] uppercase font-bold text-mutedText block">Acquisition Source</span>
                <span className="font-semibold text-charcoal capitalize">
                  {selectedInquiry.source === 'property_inquiry' ? 'Property Listing' : 'Contact Form'}
                </span>
                <span className="block text-[10px] text-mutedText font-mono mt-0.5">
                  {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Message Payload */}
            <div>
              <span className="text-[10px] uppercase font-bold text-mutedText block mb-1">
                Client Inquiry Message
              </span>
              <p className="p-4 rounded-xl bg-ivory/80 border border-sage/60 text-xs text-charcoal leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">
                {selectedInquiry.message}
              </p>
            </div>

            {/* Advisor Assignment Section */}
            <div className="p-4 rounded-2xl bg-sage-light/40 border border-sage space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-gold shrink-0" />
                    Advisor Assignment & Lead Routing
                  </h4>
                  <p className="text-[11px] text-mutedText">
                    Assign this lead to an approved advisor for private representation. Only approved advisors appear.
                  </p>
                </div>
                {selectedInquiry.assignedAgentName && (
                  <span className="text-[11px] font-semibold text-forest bg-white px-2.5 py-1 rounded-lg border border-sage">
                    Active: {selectedInquiry.assignedAgentName}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <select
                  value={selectedAdvisorUid}
                  onChange={(e) => setSelectedAdvisorUid(e.target.value)}
                  className="flex-1 w-full rounded-xl bg-white border border-sage/80 p-2.5 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  <option value="">-- Unassigned (EstateVista Private Concierge) --</option>
                  {advisors.map((adv) => (
                    <option key={adv.uid} value={adv.uid}>
                      {adv.name} {adv.agency ? `(${adv.agency})` : ''} — {adv.email}
                    </option>
                  ))}
                </select>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAssignAdvisor}
                  isLoading={assigningAdvisor}
                  disabled={assigningAdvisor}
                  className="w-full sm:w-auto text-xs shrink-0"
                >
                  {selectedAdvisorUid ? 'Assign Advisor' : 'Set as Unassigned'}
                </Button>
              </div>
            </div>

            {/* Administrative Follow-Up Notes (adminNotes) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-forest shrink-0" />
                    Administrative Follow-Up Notes
                  </h4>
                  <p className="text-[11px] text-mutedText">
                    Notes saved here will be visible to the customer in My Inquiries. Do not enter confidential internal information.
                  </p>
                </div>
                {selectedInquiry.adminNotesUpdatedAt && (
                  <span className="text-[10px] text-forest bg-sage-light/60 px-2 py-0.5 rounded border border-sage font-mono">
                    Updated: {new Date(selectedInquiry.adminNotesUpdatedAt).toLocaleString()}
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={modalAdminNotes}
                onChange={(e) => setModalAdminNotes(e.target.value)}
                placeholder="Enter client-facing follow-up or resolution notes (e.g., 'Thank you for your inquiry. We have confirmed availability and an advisor will contact you today.')..."
                className="w-full rounded-xl bg-white border border-sage p-3 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Save}
                  onClick={handleSaveAdminNotes}
                  isLoading={savingNotes}
                  disabled={savingNotes}
                  className="text-xs bg-forest hover:bg-forest-dark text-white"
                >
                  Save Admin Notes
                </Button>
              </div>
            </div>

            {/* Advisor Notes (agentNotes) - Read-Only Context */}
            {selectedInquiry.agentNotes && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Advisor Logged Notes (Read-Only Context)</span>
                </div>
                <p className="text-charcoal/80 whitespace-pre-wrap leading-relaxed">
                  {selectedInquiry.agentNotes}
                </p>
              </div>
            )}

            {/* Status Change & Deletion Strip */}
            <div className="space-y-3 pt-3 border-t border-sage/60">
              <span className="text-xs font-bold text-charcoal block">
                Manage Concierge Status
              </span>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {['new', 'contacted', 'closed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => handleStatusChange(selectedInquiry.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                        selectedInquiry.status === st
                          ? 'bg-forest text-white shadow-xs'
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
                  disabled={deletingInquiry}
                  isLoading={deletingInquiry}
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
