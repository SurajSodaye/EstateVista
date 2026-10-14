import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Star,
  StarOff,
  MoreVertical,
  X,
  ExternalLink,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Sparkles,
  Trash2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Plus,
  Edit2,
  User,
  Calendar,
  AlertOctagon,
  Archive,
  Shield,
  FileText,
  Clock,
  Undo2,
  Check,
  Send,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getFirestoreAdminProperties,
  publishFirestoreProperty,
  unpublishFirestoreProperty,
  republishFirestoreProperty,
  rejectFirestoreProperty,
  retireFirestoreProperty,
  returnFirestorePropertyForCorrection,
  restoreRetiredFirestoreProperty,
  archiveFirestoreProperty,
  restoreFirestoreProperty,
  updateFirestorePropertyModeration,
  toggleFirestorePropertyFeatured,
  deleteFirestoreProperty,
  checkPropertyRelatedRecords,
} from '../../services/adminFirestoreService';
import { formatCurrency } from '../../utils/formatCurrency';
import AdminPropertyModal from '../../components/admin/AdminPropertyModal';

export default function AdminProperties() {
  const { adminUser } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

  // Filtering State
  const initialStatus = searchParams.get('status') || 'all';
  const [statusFilter, setStatusFilter] = useState(initialStatus); // 'all' | 'published' | 'pending' | 'unpublished' | 'draft' | 'rejected' | 'retired' | 'archived'
  const [originFilter, setOriginFilter] = useState('all'); // 'all' | 'advisor' | 'admin'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'Buy' | 'Rent'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price-desc' | 'price-asc' | 'title'
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10 | 25 | 50

  // Moderation Audit Modal State
  const [selectedProp, setSelectedProp] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [auditNotes, setAuditNotes] = useState('');

  // Property Create / Edit Modal State
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState(null);

  // Delete & Safe Archival Confirmation Modal State
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleteInquiryInfo, setDeleteInquiryInfo] = useState({ checking: false, count: 0 });
  const [isDeleting, setIsDeleting] = useState(false);

  // Rejection Dialog State (Strictly Mandatory Reason)
  const [propertyToReject, setPropertyToReject] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Unpublish Dialog State (Temporary, Preserves Approval)
  const [propertyToUnpublish, setPropertyToUnpublish] = useState(null);
  const [unpublishReasonInput, setUnpublishReasonInput] = useState('');
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  // Retire Dialog State (Permanently remove from publication)
  const [propertyToRetire, setPropertyToRetire] = useState(null);
  const [retireReasonInput, setRetireReasonInput] = useState('');
  const [isRetiring, setIsRetiring] = useState(false);

  // Return for Correction Dialog State
  const [propertyToCorrect, setPropertyToCorrect] = useState(null);
  const [correctionNotesInput, setCorrectionNotesInput] = useState('');
  const [isReturning, setIsReturning] = useState(false);

  // Synchronize statusFilter with URL query param
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const handleStatusTabChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (newStatus === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', newStatus);
    }
    setSearchParams(newParams);
  };

  const loadData = async () => {
    setLoading(true);
    const data = await getFirestoreAdminProperties();
    setProperties(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset page when search or secondary filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, originFilter, typeFilter]);

  // Featured toggle
  const handleToggleFeatured = async (id) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;
    await toggleFirestorePropertyFeatured(id, prop.isFeatured);
    await loadData();
  };

  // Open Create / Edit
  const handleOpenCreate = () => {
    setPropertyToEdit(null);
    setIsPropertyModalOpen(true);
  };

  const handleOpenEdit = (prop) => {
    setPropertyToEdit(prop);
    setIsPropertyModalOpen(true);
  };

  const handlePropertySaved = (savedProp) => {
    const isEdit = Boolean(propertyToEdit);
    setNotification(
      isEdit
        ? `Property "${savedProp.title || 'Asset'}" updated successfully in Cloud Firestore.`
        : `New property "${savedProp.title || 'Asset'}" created successfully in Cloud Firestore.`
    );
    loadData();
    setTimeout(() => setNotification(''), 4500);
  };

  // Publish / Republish
  const handlePublishProperty = async (prop, notes = '') => {
    try {
      await publishFirestoreProperty(prop.id, notes, adminUser);
      setNotification(`Property "${prop.title}" successfully approved and published to live catalog.`);
      if (selectedProp?.id === prop.id) {
        setSelectedProp(null);
      }
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } catch (err) {
      setNotification(`Publish failed: ${err.message || 'Operation failed'}`);
      setTimeout(() => setNotification(''), 5000);
    }
  };

  const handleRepublishProperty = async (prop) => {
    try {
      await republishFirestoreProperty(prop.id, 'Republished to live platform', adminUser);
      setNotification(`Property "${prop.title}" republished to live catalog.`);
      if (selectedProp?.id === prop.id) {
        setSelectedProp(null);
      }
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } catch (err) {
      setNotification(`Republish failed: ${err.message || 'Operation failed'}`);
      setTimeout(() => setNotification(''), 5000);
    }
  };

  // Temporary Unpublish Dialog & Submission
  const handleOpenUnpublishDialog = (prop) => {
    setPropertyToUnpublish(prop);
    setUnpublishReasonInput(prop.unpublishedReason || '');
  };

  const handleConfirmUnpublish = async () => {
    if (!propertyToUnpublish) return;
    setIsUnpublishing(true);
    try {
      await unpublishFirestoreProperty(propertyToUnpublish.id, unpublishReasonInput, adminUser);
      setNotification(
        `Property "${propertyToUnpublish.title}" temporarily taken offline. Approval status preserved.`
      );
      setPropertyToUnpublish(null);
      if (selectedProp?.id === propertyToUnpublish.id) {
        setSelectedProp(null);
      }
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } catch (err) {
      setNotification(`Unpublish failed: ${err.message || 'Operation failed'}`);
      setTimeout(() => setNotification(''), 5000);
    } finally {
      setIsUnpublishing(false);
    }
  };

  // Rejection Dialog & Submission (MANDATORY REASON)
  const handleOpenRejectDialog = (prop) => {
    setPropertyToReject(prop);
    setRejectionReasonInput(prop.rejectionReason || '');
    setRejectionError('');
  };

  const handleConfirmReject = async () => {
    if (!propertyToReject) return;
    if (!rejectionReasonInput || !rejectionReasonInput.trim()) {
      setRejectionError('A detailed rejection reason is strictly required to provide advisor feedback.');
      return;
    }

    setIsRejecting(true);
    try {
      await rejectFirestoreProperty(propertyToReject.id, rejectionReasonInput, adminUser);
      setNotification(
        `Property "${propertyToReject.title}" rejected. Rejection reason dispatched to listing advisor.`
      );
      setPropertyToReject(null);
      if (selectedProp?.id === propertyToReject.id) {
        setSelectedProp(null);
      }
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } catch (err) {
      setRejectionError(err.message || 'Failed to reject listing.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Archive & Restore
  const handleArchiveProperty = async (prop) => {
    try {
      await archiveFirestoreProperty(prop.id, 'Archived by administrator', adminUser);
      setNotification(`Property "${prop.title}" archived. Inquiries and property data preserved.`);
      if (selectedProp?.id === prop.id) {
        setSelectedProp(null);
      }
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } catch (err) {
      setNotification(`Archival failed: ${err.message || 'Operation failed'}`);
      setTimeout(() => setNotification(''), 5000);
    }
  };

  const handleRestoreProperty = async (prop) => {
    try {
      await restoreFirestoreProperty(prop.id, adminUser);
      setNotification(`Property "${prop.title}" restored from archive. Ready for review or republication.`);
      if (selectedProp?.id === prop.id) {
        setSelectedProp(null);
      }
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } catch (err) {
      setNotification(`Restoration failed: ${err.message || 'Operation failed'}`);
      setTimeout(() => setNotification(''), 5000);
    }
  };

  // Permanently Remove from Publication (Retire)
  const handleOpenRetireDialog = (prop) => {
    setPropertyToRetire(prop);
    setRetireReasonInput('');
  };

  const handleConfirmRetire = async () => {
    if (!propertyToRetire) return;
    if (!retireReasonInput.trim()) {
      setNotification('A reason is required to permanently retire a listing.');
      setTimeout(() => setNotification(''), 4000);
      return;
    }
    setIsRetiring(true);
    try {
      await retireFirestoreProperty(propertyToRetire.id, retireReasonInput, adminUser);
      setNotification(`Property "${propertyToRetire.title}" permanently retired from publication.`);
      setPropertyToRetire(null);
      if (selectedProp?.id === propertyToRetire.id) setSelectedProp(null);
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } catch (err) {
      setNotification(`Retirement failed: ${err.message || 'Operation failed'}`);
      setTimeout(() => setNotification(''), 5000);
    } finally {
      setIsRetiring(false);
    }
  };

  // Return for Correction
  const handleOpenCorrectionDialog = (prop) => {
    setPropertyToCorrect(prop);
    setCorrectionNotesInput('');
  };

  const handleConfirmReturnForCorrection = async () => {
    if (!propertyToCorrect) return;
    setIsReturning(true);
    try {
      await returnFirestorePropertyForCorrection(propertyToCorrect.id, correctionNotesInput, adminUser);
      setNotification(`Property "${propertyToCorrect.title}" returned to advisor for editorial correction.`);
      setPropertyToCorrect(null);
      if (selectedProp?.id === propertyToCorrect.id) setSelectedProp(null);
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } catch (err) {
      setNotification(`Action failed: ${err.message || 'Operation failed'}`);
      setTimeout(() => setNotification(''), 5000);
    } finally {
      setIsReturning(false);
    }
  };

  // Restore Retired Listing
  const handleRestoreRetired = async (prop) => {
    try {
      await restoreRetiredFirestoreProperty(prop.id, adminUser);
      setNotification(`Property "${prop.title}" restored from retired status to unpublished draft.`);
      if (selectedProp?.id === prop.id) setSelectedProp(null);
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } catch (err) {
      setNotification(`Restoration failed: ${err.message || 'Operation failed'}`);
      setTimeout(() => setNotification(''), 5000);
    }
  };

  // Delete & Safe Archival Dialog
  const handleOpenDeleteDialog = async (prop) => {
    setPropertyToDelete(prop);
    setDeleteInquiryInfo({ checking: true, count: 0 });
    const info = await checkPropertyRelatedRecords(prop.id);
    setDeleteInquiryInfo({ checking: false, count: info.count });
  };

  const handleConfirmDelete = async (forcePermanent = false) => {
    if (!propertyToDelete) return;
    setIsDeleting(true);

    const result = await deleteFirestoreProperty(
      propertyToDelete.id,
      adminUser?.email || 'Administrator',
      forcePermanent,
      adminUser?.uid || ''
    );

    setIsDeleting(false);

    if (result.success) {
      if (result.action === 'archived') {
        setNotification(
          `Property "${propertyToDelete.title}" safely archived because ${result.inquiryCount} active inquiry record(s) reference it.`
        );
      } else {
        setNotification(`Property "${propertyToDelete.title}" permanently removed from Cloud Firestore.`);
      }

      setPropertyToDelete(null);
      if (selectedProp?.id === propertyToDelete.id) {
        setSelectedProp(null);
      }
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } else {
      setNotification('Failed to process property deletion. Check administrative permissions.');
      setTimeout(() => setNotification(''), 4500);
    }
  };

  const formatPropertyDate = (dateVal) => {
    if (!dateVal) return '—';
    try {
      if (typeof dateVal?.toDate === 'function') {
        return dateVal.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
      if (typeof dateVal?.seconds === 'number') {
        return new Date(dateVal.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  // Filtered Properties Pipeline
  const filteredProperties = useMemo(() => {
    const list = properties.filter((p) => {
      const pubStatus = p.publicationStatus || (p.isPublished ? 'published' : 'draft');
      const isArchived = Boolean(p.isArchived || pubStatus === 'archived');

      // Status Tab Matching
      let matchesStatus = true;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'published') {
        matchesStatus = p.isPublished === true || pubStatus === 'published';
      } else if (statusFilter === 'pending') {
        matchesStatus = pubStatus === 'pending';
      } else if (statusFilter === 'unpublished') {
        // Matches explicitly unpublished or non-published drafts/approved holdings
        matchesStatus =
          pubStatus === 'unpublished' ||
          (!p.isPublished && !isArchived && pubStatus !== 'rejected' && pubStatus !== 'pending' && pubStatus !== 'retired');
      } else if (statusFilter === 'draft') {
        matchesStatus = pubStatus === 'draft';
      } else if (statusFilter === 'rejected') {
        matchesStatus = pubStatus === 'rejected';
      } else if (statusFilter === 'retired') {
        matchesStatus = pubStatus === 'retired' || p.moderationStatus === 'retired';
      } else if (statusFilter === 'archived') {
        matchesStatus = isArchived;
      } else {
        matchesStatus = pubStatus === statusFilter;
      }

      // Type & Origin Matching
      const matchesType = typeFilter === 'all' || p.listingType === typeFilter;
      const matchesOrigin =
        originFilter === 'all' ||
        (originFilter === 'admin' && p.isAdminCreated) ||
        (originFilter === 'advisor' && !p.isAdminCreated);

      // Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.location && p.location.toLowerCase().includes(query)) ||
        (p.city && p.city.toLowerCase().includes(query)) ||
        (p.locality && p.locality.toLowerCase().includes(query)) ||
        (p.id && p.id.toLowerCase().includes(query)) ||
        (p.agentName && p.agentName.toLowerCase().includes(query)) ||
        (p.agentEmail && p.agentEmail.toLowerCase().includes(query));

      return matchesStatus && matchesType && matchesOrigin && matchesSearch;
    });

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return list;
  }, [properties, statusFilter, originFilter, typeFilter, searchQuery, sortBy]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredProperties.length);
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Title & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
            Portfolio Moderation & Asset Control
          </h2>
          <p className="text-xs text-mutedText mt-0.5">
            Audit advisor submissions, manage direct administrative listings, and enforce editorial governance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenCreate}
            className="text-xs shrink-0 shadow-sm"
          >
            Create New Property
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            notification.toLowerCase().includes('fail') || notification.toLowerCase().includes('error')
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.toLowerCase().includes('fail') || notification.toLowerCase().includes('error') ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{notification}</span>
        </div>
      )}

      {/* Controls Bar: Status Tabs, Search, and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-sage/60 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs with Counts */}
            {[
              { id: 'all', label: 'All Listings' },
              { id: 'published', label: 'Published' },
              { id: 'pending', label: 'Pending Review' },
              { id: 'unpublished', label: 'Unpublished' },
              { id: 'draft', label: 'Draft' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'retired', label: 'Retired' },
              { id: 'archived', label: 'Archived' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleStatusTabChange(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  statusFilter === st.id
                    ? 'bg-forest text-white shadow-xs'
                    : 'bg-ivory text-charcoal/70 hover:bg-sage/30 border border-sage/40'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, city, advisor, or ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-ivory border border-sage/70 text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
        </div>

        {/* Secondary Filter Row: Source, Type & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sage/40 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider mr-1">
              Source:
            </span>
            {[
              { id: 'all', label: 'All Sources' },
              { id: 'advisor', label: 'Advisor Submissions' },
              { id: 'admin', label: 'Admin Created' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setOriginFilter(s.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  originFilter === s.id
                    ? 'bg-forest text-white'
                    : 'bg-ivory text-charcoal/70 hover:bg-sage/20 border border-sage/40'
                }`}
              >
                {s.label}
              </button>
            ))}

            <div className="h-3.5 w-px bg-sage mx-1 hidden sm:block" />

            <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider mr-1">
              Type:
            </span>
            {[
              { id: 'all', label: 'All Types' },
              { id: 'Buy', label: 'For Sale (Buy)' },
              { id: 'Rent', label: 'For Lease (Rent)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  typeFilter === t.id
                    ? 'bg-[#C7A76C] text-forest font-bold'
                    : 'bg-ivory text-charcoal/70 hover:bg-sage/20 border border-sage/40'
                }`}
              >
                {t.label}
              </button>
            ))}

            <div className="h-3.5 w-px bg-sage mx-1 hidden sm:block" />

            <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider mr-1">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-ivory text-charcoal border border-sage/60 text-xs focus:outline-none focus:ring-1 focus:ring-forest"
            >
              <option value="newest">Newest First</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="title">Title: A to Z</option>
            </select>
          </div>

          <div className="text-mutedText text-[11px]">
            Filtered: <strong className="text-forest">{filteredProperties.length}</strong> of{' '}
            <strong className="text-charcoal">{properties.length}</strong> listings
          </div>
        </div>
      </div>

      {/* Table / Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-mutedText">Loading property moderation database from Cloud Firestore...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-sage/60 text-center space-y-3">
          <Building2 className="w-10 h-10 text-mutedText mx-auto" />
          <h3 className="font-serif text-base font-bold text-charcoal">No Listings Match Filter</h3>
          <p className="text-xs text-mutedText">Adjust your status tabs, source filter, or search parameters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sage/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-sage/60 text-mutedText uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Property Asset</th>
                  <th className="py-3 px-4">Owner / Attribution</th>
                  <th className="py-3 px-4">Type & Price</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/40">
                {paginatedProperties.map((prop) => {
                  const propImages = (
                    (prop.imageUrls && prop.imageUrls.length > 0
                      ? prop.imageUrls
                      : prop.images) || []
                  ).filter(Boolean);

                  const pubStatus = prop.publicationStatus || (prop.isPublished ? 'published' : 'draft');
                  const isArchived = Boolean(prop.isArchived || pubStatus === 'archived');
                  const isApproved = prop.moderationStatus === 'approved';

                  return (
                    <tr key={prop.id} className="hover:bg-ivory/40 transition-colors">
                      {/* Asset column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <img
                            src={
                              propImages[0] ||
                              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=150&q=80'
                            }
                            alt={prop.title}
                            className="w-14 h-14 rounded-xl object-cover border border-sage shrink-0 bg-sage-light"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=150&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-charcoal truncate max-w-xs" title={prop.title}>
                              {prop.title}
                            </p>
                            <p className="text-[10px] text-mutedText font-mono mt-0.5">
                              ID: {prop.id} • {prop.propertyType}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-forest/80 bg-sage-light px-1.5 py-0.5 rounded mt-1">
                              <ImageIcon className="w-2.5 h-2.5" />
                              {propImages.length} Photo{propImages.length === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Owner / Attribution */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[170px]">
                        {prop.isAdminCreated ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C7A76C]/30 text-forest border border-[#C7A76C]">
                              <Shield className="w-2.5 h-2.5 text-forest" />
                              Admin Representation
                            </span>
                            <p className="text-[10px] text-mutedText truncate mt-0.5 max-w-[160px]">
                              {prop.agentEmail || 'Console'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-mutedText" />
                              <span className="font-bold text-charcoal truncate max-w-[140px]" title={prop.agentName}>
                                {prop.agentName || 'Advisor'}
                              </span>
                            </div>
                            <p className="text-[10px] text-mutedText truncate max-w-[150px]" title={prop.agentEmail}>
                              {prop.agentEmail || '—'}
                            </p>
                            <p className="text-[9px] text-mutedText/70 font-mono">
                              UID: {prop.createdByUid ? prop.createdByUid.slice(0, 8) + '...' : '—'}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Type & Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-forest">
                          {formatCurrency(prop.price)}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5 ${
                            prop.listingType === 'Buy'
                              ? 'bg-forest/10 text-forest'
                              : 'bg-[#C7A76C]/20 text-forest'
                          }`}
                        >
                          {prop.listingType === 'Buy' ? 'Sale' : 'Rent'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-charcoal/80 whitespace-nowrap">
                        <div className="font-medium">{prop.city}</div>
                        {prop.locality && (
                          <div className="text-[10px] text-mutedText truncate max-w-[120px]" title={prop.locality}>
                            {prop.locality}
                          </div>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 text-mutedText whitespace-nowrap font-mono text-[11px]">
                        {formatPropertyDate(prop.createdAt)}
                      </td>

                      {/* Moderation Status & Featured */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              prop.isPublished || pubStatus === 'published'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : pubStatus === 'pending'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : pubStatus === 'unpublished'
                                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                : pubStatus === 'rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : isArchived
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}
                          >
                            {isArchived
                              ? 'archived'
                              : prop.isPublished
                              ? 'published'
                              : pubStatus}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(prop.id)}
                            className={`p-1 rounded-md border transition-colors ${
                              prop.isFeatured
                                ? 'bg-amber-50 border-amber-300 text-amber-600'
                                : 'bg-ivory border-sage/60 text-mutedText hover:text-charcoal'
                            }`}
                            title={prop.isFeatured ? 'Featured on Homepage (Click to toggle)' : 'Not Featured'}
                          >
                            <Star className={`w-3 h-3 ${prop.isFeatured ? 'fill-amber-500' : ''}`} />
                          </button>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Quick Publication / Governance Action Button */}
                          {prop.isPublished ? (
                            <button
                              type="button"
                              onClick={() => handleOpenUnpublishDialog(prop)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors"
                              title="Temporarily unpublish listing (keeps approval)"
                            >
                              Unpublish
                            </button>
                          ) : isArchived ? (
                            <button
                              type="button"
                              onClick={() => handleRestoreProperty(prop)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200 transition-colors flex items-center gap-1"
                              title="Restore property from archive"
                            >
                              <Undo2 className="w-3 h-3" />
                              Restore
                            </button>
                          ) : isApproved && !prop.isPublished ? (
                            <button
                              type="button"
                              onClick={() => handleRepublishProperty(prop)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors"
                              title="Republish approved listing"
                            >
                              Republish
                            </button>
                          ) : pubStatus === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePublishProperty(prop)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                title="Approve and publish listing"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectDialog(prop)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-colors"
                                title="Reject listing with mandatory feedback"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}

                          {/* 2. Audit / Review Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Eye}
                            onClick={() => {
                              setSelectedProp(prop);
                              setActiveImageIndex(0);
                              setAuditNotes(prop.rejectionReason || prop.moderatorNotes || '');
                            }}
                            className="text-xs"
                            title="Audit submitted imagery & moderation workflow"
                          >
                            Audit
                          </Button>

                          {/* 3. Edit Details Button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEdit(prop)}
                            className="text-xs"
                            title="Edit property details"
                          >
                            Edit
                          </Button>

                          {/* 4. Delete / Safe Archive Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteDialog(prop)}
                            className="p-1.5 rounded-xl border border-sage/60 text-mutedText hover:text-red-700 hover:border-red-300 hover:bg-red-50 transition-colors"
                            title="Delete or safe-archive property"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ======================================================== */}
          {/* PAGINATION TOOLBAR                                       */}
          {/* ======================================================== */}
          <div className="bg-ivory/60 border-t border-sage/60 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-charcoal">
            <div className="flex items-center gap-3">
              <span className="text-mutedText">
                Showing <strong className="text-forest">{startIndex + 1}</strong> to{' '}
                <strong className="text-forest">{endIndex}</strong> of{' '}
                <strong className="text-charcoal">{filteredProperties.length}</strong> listings
              </span>

              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] text-mutedText">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-sage rounded-lg px-2 py-1 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-forest"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-sage bg-white text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sage/20 transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Show condensed page numbers for large sets
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= validCurrentPage - 1 && pageNum <= validCurrentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-semibold transition-colors ${
                        validCurrentPage === pageNum
                          ? 'bg-forest text-white'
                          : 'bg-white border border-sage text-charcoal hover:bg-sage/20'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === validCurrentPage - 2 || pageNum === validCurrentPage + 2) {
                  return (
                    <span key={pageNum} className="px-1 text-mutedText">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-sage bg-white text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sage/20 transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. PROPERTY CREATION & EDIT MODAL                        */}
      {/* ======================================================== */}
      <AdminPropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        property={propertyToEdit}
        onSaved={handlePropertySaved}
        adminUser={adminUser}
      />

      {/* ======================================================== */}
      {/* 2. REJECTION DIALOG (MANDATORY REASON)                   */}
      {/* ======================================================== */}
      {propertyToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-sage shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-sage/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-charcoal">
                    Reject Property Submission
                  </h3>
                  <p className="text-xs text-mutedText">
                    Reference ID: <code className="font-mono">{propertyToReject.id}</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPropertyToReject(null)}
                className="p-1 rounded-xl text-mutedText hover:text-charcoal hover:bg-sage/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-charcoal">
              <p>
                You are rejecting listing{' '}
                <strong className="text-charcoal">"{propertyToReject.title}"</strong>.
              </p>
              <div className="p-3 rounded-xl bg-ivory border border-sage/70 text-[11px] text-mutedText">
                <span className="font-bold text-charcoal">Advisor Feedback Guarantee: </span>
                A specific rejection reason is mandatory. It will be communicated directly to the submitting advisor (
                <strong>{propertyToReject.agentName || propertyToReject.agentEmail || 'Advisor'}</strong>) so they can correct their listing.
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-charcoal">
                  Mandatory Rejection Feedback <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={rejectionReasonInput}
                  onChange={(e) => {
                    setRejectionReasonInput(e.target.value);
                    if (rejectionError) setRejectionError('');
                  }}
                  rows={3}
                  placeholder="Specify why this listing was rejected (e.g., blurry exterior photos, inaccurate price per sq.ft, missing address)..."
                  className={`w-full p-3 rounded-xl bg-ivory border text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 ${
                    rejectionError
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-sage focus:ring-forest'
                  }`}
                />
                {rejectionError && (
                  <p className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{rejectionError}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-sage/60 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setPropertyToReject(null)}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                icon={AlertTriangle}
                onClick={handleConfirmReject}
                isLoading={isRejecting}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TEMPORARY UNPUBLISH DIALOG (PRESERVES APPROVAL)       */}
      {/* ======================================================== */}
      {propertyToUnpublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-sage shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-sage/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-charcoal">
                    Temporarily Unpublish Listing
                  </h3>
                  <p className="text-xs text-mutedText">
                    Reference ID: <code className="font-mono">{propertyToUnpublish.id}</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPropertyToUnpublish(null)}
                className="p-1 rounded-xl text-mutedText hover:text-charcoal hover:bg-sage/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-charcoal">
              <p>
                You are taking listing <strong className="text-charcoal">"{propertyToUnpublish.title}"</strong> offline.
              </p>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                <span className="font-bold">Approval Preservation Guarantee: </span>
                This listing will be hidden from the public website immediately, but its <strong>approved status and complete data remain intact</strong>. You can republish it at any time without requiring re-approval.
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-charcoal">
                  Reason for Taking Offline (Optional Audit Record)
                </label>
                <textarea
                  value={unpublishReasonInput}
                  onChange={(e) => setUnpublishReasonInput(e.target.value)}
                  rows={2}
                  placeholder="e.g., Under active client negotiation, owner renovation in progress..."
                  className="w-full p-3 rounded-xl bg-ivory border border-sage text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-sage/60 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setPropertyToUnpublish(null)}
                disabled={isUnpublishing}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleConfirmUnpublish}
                isLoading={isUnpublishing}
              >
                Unpublish Listing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DELETE & SAFE-ARCHIVE CONFIRMATION MODAL              */}
      {/* ======================================================== */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-sage shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-sage/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center border border-red-200">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-charcoal">
                    Confirm Listing Deletion
                  </h3>
                  <p className="text-xs text-mutedText">
                    Reference ID: <code className="font-mono">{propertyToDelete.id}</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPropertyToDelete(null)}
                className="p-1 rounded-xl text-mutedText hover:text-charcoal hover:bg-sage/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-charcoal">
              <p>
                You are about to delete property listing{' '}
                <strong className="text-charcoal">"{propertyToDelete.title}"</strong>.
              </p>

              {/* Owner account safety notice */}
              <div className="p-3 rounded-xl bg-ivory border border-sage/70 text-[11px] text-mutedText">
                <span className="font-bold text-charcoal">Account Safety Assurance: </span>
                This action only modifies the property record in Cloud Firestore. The listing owner account (
                <strong>{propertyToDelete.agentName || 'Advisor'}</strong>) will <strong>NOT</strong> be deleted or penalized.
              </div>

              {/* Inquiry Reference Check Banner */}
              {deleteInquiryInfo.checking ? (
                <div className="p-3 rounded-xl bg-sage-light text-[11px] text-forest flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying related client inquiry records...</span>
                </div>
              ) : deleteInquiryInfo.count > 0 ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Inquiry References Detected ({deleteInquiryInfo.count} Records)</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Active client leads reference this listing. Permanent deletion will orphan these inquiry references.
                    We recommend <strong>Safe Archival</strong>, which unpublishes the listing while preserving client communication history.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-mutedText">
                  0 associated client inquiry references found. This property can be permanently deleted cleanly.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-sage/60 flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setPropertyToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              {deleteInquiryInfo.count > 0 ? (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={Archive}
                    onClick={() => handleConfirmDelete(false)}
                    isLoading={isDeleting}
                  >
                    Safe Archive (Recommended)
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    icon={Trash2}
                    onClick={() => handleConfirmDelete(true)}
                    isLoading={isDeleting}
                  >
                    Delete Permanently
                  </Button>
                </>
              ) : (
                <Button
                  variant="danger"
                  size="md"
                  icon={Trash2}
                  onClick={() => handleConfirmDelete(true)}
                  isLoading={isDeleting}
                >
                  Delete Permanently
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PROPERTY MODERATION AUDIT MODAL                       */}
      {/* ======================================================== */}
      {selectedProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-sage shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-sage/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                  Asset Moderation Evaluation
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-1">
                  {selectedProp.title}
                </h3>
                <p className="text-xs text-mutedText">
                  {selectedProp.location} • Reference ID: <code className="font-mono">{selectedProp.id}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProp(null)}
                className="p-1 rounded-xl text-mutedText hover:text-charcoal hover:bg-sage/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Complete Submitted Image Gallery Viewer */}
            {(() => {
              const propImages = (
                (selectedProp.imageUrls && selectedProp.imageUrls.length > 0
                  ? selectedProp.imageUrls
                  : selectedProp.images) || []
              ).filter(Boolean);

              const activeImg = propImages[activeImageIndex] || propImages[0];

              if (propImages.length === 0) {
                return (
                  <div className="p-8 rounded-2xl bg-ivory border border-sage/60 text-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-mutedText mx-auto" />
                    <p className="text-xs font-bold text-charcoal">No Submitted Photos</p>
                    <p className="text-[11px] text-mutedText">The advisor submitted this listing without image URLs.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-mutedText">
                    <span className="font-bold text-charcoal text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-forest" />
                      Submitted Imagery ({propImages.length} Photo{propImages.length > 1 ? 's' : ''})
                    </span>
                    <span className="font-mono text-[11px]">
                      Viewing {activeImageIndex + 1} of {propImages.length}
                    </span>
                  </div>

                  {/* Main Hero Preview */}
                  <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-sage bg-charcoal/5 shadow-inner group">
                    <img
                      src={activeImg}
                      alt={`${selectedProp.title} photo ${activeImageIndex + 1}`}
                      className="w-full h-full object-cover transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    {/* Navigation Arrows */}
                    {propImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : propImages.length - 1))}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity shadow-md"
                          title="Previous photo"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex((prev) => (prev < propImages.length - 1 ? prev + 1 : 0))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity shadow-md"
                          title="Next photo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Counter Badge */}
                    <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs shadow-xs">
                      Photo {activeImageIndex + 1} / {propImages.length}
                    </div>
                  </div>

                  {/* Complete Thumbnail Strip */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                    {propImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImageIndex(i)}
                        className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                          activeImageIndex === i
                            ? 'border-forest ring-2 ring-forest/30 scale-102 shadow-sm'
                            : 'border-sage/60 opacity-70 hover:opacity-100 hover:border-forest/50'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${i + 1}`}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=200&q=80';
                          }}
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded font-mono">
                          {i + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Asset Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-ivory border border-sage/60">
                <span className="text-[10px] text-mutedText uppercase font-bold block">Price</span>
                <span className="text-xs font-bold text-forest">{formatCurrency(selectedProp.price)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-ivory border border-sage/60">
                <span className="text-[10px] text-mutedText uppercase font-bold block">Bedrooms</span>
                <span className="text-xs font-bold text-charcoal">{selectedProp.bedrooms} Beds</span>
              </div>
              <div className="p-2.5 rounded-xl bg-ivory border border-sage/60">
                <span className="text-[10px] text-mutedText uppercase font-bold block">Bathrooms</span>
                <span className="text-xs font-bold text-charcoal">{selectedProp.bathrooms} Baths</span>
              </div>
              <div className="p-2.5 rounded-xl bg-ivory border border-sage/60">
                <span className="text-[10px] text-mutedText uppercase font-bold block">Carpet Area</span>
                <span className="text-xs font-bold text-charcoal">{selectedProp.areaSqFt} sq.ft</span>
              </div>
            </div>

            {/* Existing Rejection Reason Alert if previously rejected */}
            {selectedProp.rejectionReason && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-950">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Existing Rejection Feedback:</span>
                </div>
                <p className="text-[11px] text-rose-800">{selectedProp.rejectionReason}</p>
              </div>
            )}

            {/* Offline Reason Alert if unpublished */}
            {selectedProp.unpublishedReason && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-950">
                  <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Offline Hold Reason:</span>
                </div>
                <p className="text-[11px] text-slate-800">{selectedProp.unpublishedReason}</p>
              </div>
            )}

            {/* Description */}
            <div>
              <span className="text-[10px] uppercase font-bold text-mutedText block mb-1">
                Property Representation Copy
              </span>
              <p className="p-3.5 rounded-xl bg-ivory/70 border border-sage/40 text-xs text-charcoal leading-relaxed max-h-36 overflow-y-auto">
                {selectedProp.description || 'No description provided.'}
              </p>
            </div>

            {/* Moderator Audit Notes Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-charcoal">
                Administrator Audit Notes (Appended to publication audit event)
              </label>
              <textarea
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                rows={2}
                placeholder="Add editorial clearance notes or compliance verification details..."
                className="w-full p-3 rounded-xl bg-ivory border border-sage text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            {/* Audit Modal Actions */}
            <div className="pt-4 border-t border-sage/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Publish Action */}
                {!selectedProp.isPublished ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => handlePublishProperty(selectedProp, auditNotes)}
                  >
                    Publish Listing
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={FileText}
                    onClick={() => {
                      handleOpenUnpublishDialog(selectedProp);
                    }}
                  >
                    Unpublish (Take Offline)
                  </Button>
                )}

                {/* Reject Action */}
                <Button
                  variant="danger"
                  size="sm"
                  icon={AlertTriangle}
                  onClick={() => {
                    handleOpenRejectDialog(selectedProp);
                  }}
                >
                  Reject Listing
                </Button>

                {/* Safe Archival / Restore */}
                {selectedProp.isArchived || selectedProp.publicationStatus === 'archived' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Undo2}
                    onClick={() => handleRestoreProperty(selectedProp)}
                  >
                    Restore from Archive
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Archive}
                    onClick={() => handleArchiveProperty(selectedProp)}
                  >
                    Archive
                  </Button>
                )}

                {/* Edit Details */}
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Edit2}
                  onClick={() => {
                    handleOpenEdit(selectedProp);
                    setSelectedProp(null);
                  }}
                >
                  Edit Details
                </Button>
              </div>

              <a
                href={`/properties/${selectedProp.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-forest hover:underline inline-flex items-center gap-1"
              >
                <span>Preview on Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
