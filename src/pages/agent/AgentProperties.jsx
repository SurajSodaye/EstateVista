import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  ExternalLink,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  ArrowUpDown,
  MoreVertical,
  Check,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ConfirmationModal from '../../components/agent/ConfirmationModal';
import {
  getAgentProperties,
  subscribeAgentProperties,
  deleteAgentProperty,
  updatePropertyPublicationStatus,
} from '../../services/agentPortalService';

export default function AgentProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Confirmation modal states
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    propertyId: null,
    propertyTitle: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Status popover state
  const [actionMenuPropertyId, setActionMenuPropertyId] = useState(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAgentProperties(
      (data) => {
        setProperties(data);
        setLoading(false);
      },
      {
        search,
        status: statusFilter,
        listingType: typeFilter,
        sortBy,
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [search, statusFilter, typeFilter, sortBy]);

  const handleDeleteConfirm = async () => {
    if (!deleteModalState.propertyId) return;
    setIsDeleting(true);
    setErrorMessage('');
    try {
      await deleteAgentProperty(deleteModalState.propertyId);
      setSuccessMessage('Property listing removed successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
      setDeleteModalState({ isOpen: false, propertyId: null, propertyTitle: '' });
    } catch (err) {
      console.error('Delete property failed:', err);
      setErrorMessage(err.message || 'Failed to delete property listing.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (propertyId, newStatus) => {
    setActionMenuPropertyId(null);
    setErrorMessage('');
    try {
      await updatePropertyPublicationStatus(propertyId, newStatus);
      setSuccessMessage(`Listing status updated to ${newStatus}.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Status change failed:', err);
      setErrorMessage(err.message || 'Failed to update publication status.');
    }
  };

  const formatPrice = (price, listingType) => {
    if (!price) return '₹0';
    if (listingType === 'Rent') {
      if (price >= 100000) {
        return `₹${(price / 100000).toFixed(1)} L/mo`;
      }
      return `₹${price.toLocaleString('en-IN')}/mo`;
    }
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(1)} Lakh`;
  };

  const statusTabs = [
    { id: 'all', label: 'All Listings' },
    { id: 'published', label: 'Published' },
    { id: 'pending', label: 'Pending Approval' },
    { id: 'draft', label: 'Drafts' },
    { id: 'rejected', label: 'Needs Revision' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge variant="status">Published</Badge>;
      case 'pending':
        return <Badge className="bg-amber-50 text-amber-800 border-amber-200">Pending Review</Badge>;
      case 'draft':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-300">Draft</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Needs Revision</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-charcoal tracking-tight">
            My Property Listings
          </h2>
          <p className="text-xs sm:text-sm text-mutedText">
            Manage your active portfolio, publish drafts, and review moderation feedback.
          </p>
        </div>

        <Link to="/agent/properties/new">
          <Button variant="primary" size="md" icon={PlusCircle}>
            Add New Property
          </Button>
        </Link>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
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

        {/* Search & Sorting Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, location, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-ivory/60 border border-sage text-xs sm:text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest text-charcoal placeholder-mutedText/70"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-ivory/60 border border-sage text-xs sm:text-sm focus:outline-none focus:border-forest text-charcoal cursor-pointer"
            >
              <option value="all">All Purposes (Buy & Rent)</option>
              <option value="Buy">For Sale (Buy)</option>
              <option value="Rent">For Rent</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-ivory/60 border border-sage text-xs sm:text-sm focus:outline-none focus:border-forest text-charcoal cursor-pointer"
            >
              <option value="newest">Sort by Newest</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listing Content Area */}
      {loading ? (
        <LoadingState message="Loading your listings..." />
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage p-8 shadow-soft">
          <EmptyState
            title="No Listings Found"
            message={
              search || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No property records match your current filters. Try resetting the search or filter criteria.'
                : 'You have not created any property listings yet. Get started by adding your first luxury listing.'
            }
            actionText="Create Listing"
            actionLink="/agent/properties/new"
          />
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* DESKTOP TABLE VIEW (Visible on md and above)              */}
          {/* ======================================================== */}
          <div className="hidden md:block bg-white rounded-2xl border border-sage shadow-soft overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ivory/80 border-b border-sage text-[11px] font-bold text-mutedText uppercase tracking-wider">
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Type & Purpose</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/40 text-xs">
                {properties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-ivory/40 transition-colors group">
                    {/* Property Image & Title */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={prop.imageUrls?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=150&q=80'}
                          alt={prop.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-sage/60"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-charcoal group-hover:text-forest transition-colors truncate">
                            {prop.title}
                          </h4>
                          <p className="text-[11px] text-mutedText mt-0.5">
                            ID: <span className="font-mono">{prop.id}</span>
                          </p>
                          {prop.rejectionReason && prop.publicationStatus === 'rejected' && (
                            <p className="text-[10px] text-rose-600 mt-1 line-clamp-1 italic">
                              Rejection note: {prop.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type & Purpose */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            prop.listingType === 'Buy'
                              ? 'bg-forest text-white'
                              : 'bg-gold text-forest'
                          }`}
                        >
                          {prop.listingType === 'Buy' ? 'For Sale' : 'For Rent'}
                        </span>
                        <p className="text-mutedText text-[11px]">
                          {prop.propertyType} • {prop.bedrooms ? `${prop.bedrooms} BHK` : 'N/A'}
                        </p>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4 font-bold text-forest">
                      {formatPrice(prop.price, prop.listingType)}
                      <p className="text-[10px] font-normal text-mutedText">
                        {prop.areaSqFt ? `${prop.areaSqFt} sq.ft` : ''}
                      </p>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-charcoal/80 max-w-[160px] truncate">
                      <p className="font-medium truncate">{prop.locality || prop.city}</p>
                      <p className="text-[11px] text-mutedText truncate">{prop.city}</p>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {getStatusBadge(prop.publicationStatus)}
                        {prop.isFeatured && (
                          <div>
                            <span className="text-[9px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/30">
                              Featured
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 relative">
                        {/* Edit Button */}
                        <Link
                          to={`/agent/properties/${prop.id}/edit`}
                          className="p-1.5 rounded-lg text-charcoal/70 hover:text-forest hover:bg-sage/40 transition-colors"
                          title="Edit Listing"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* View Public Button */}
                        <Link
                          to={`/properties/${prop.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-charcoal/70 hover:text-forest hover:bg-sage/40 transition-colors"
                          title="Preview Public Listing"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Status Change Selector Popover */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenuPropertyId(
                                actionMenuPropertyId === prop.id ? null : prop.id
                              )
                            }
                            className="p-1.5 rounded-lg text-charcoal/70 hover:text-forest hover:bg-sage/40 transition-colors"
                            title="Update Status"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {actionMenuPropertyId === prop.id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-sage p-1.5 z-30 text-left">
                              <p className="text-[10px] font-bold uppercase text-mutedText px-2 py-1">
                                Change Status
                              </p>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(prop.id, 'published')}
                                className="flex items-center justify-between w-full px-2 py-1.5 text-xs text-charcoal hover:bg-sage/30 rounded-lg"
                              >
                                <span>Publish</span>
                                {prop.publicationStatus === 'published' && <Check className="w-3 h-3 text-forest" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(prop.id, 'pending')}
                                className="flex items-center justify-between w-full px-2 py-1.5 text-xs text-charcoal hover:bg-sage/30 rounded-lg"
                              >
                                <span>Submit for Review</span>
                                {prop.publicationStatus === 'pending' && <Check className="w-3 h-3 text-amber-600" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(prop.id, 'draft')}
                                className="flex items-center justify-between w-full px-2 py-1.5 text-xs text-charcoal hover:bg-sage/30 rounded-lg"
                              >
                                <span>Move to Draft</span>
                                {prop.publicationStatus === 'draft' && <Check className="w-3 h-3 text-slate-600" />}
                              </button>
                              <div className="border-t border-sage/60 my-1" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuPropertyId(null);
                                  setDeleteModalState({
                                    isOpen: true,
                                    propertyId: prop.id,
                                    propertyTitle: prop.title,
                                  });
                                }}
                                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete Listing</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ======================================================== */}
          {/* MOBILE CARDS VIEW (Visible below md)                      */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {properties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white rounded-2xl border border-sage p-4 shadow-soft space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={prop.imageUrls?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=150&q=80'}
                    alt={prop.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-sage/60"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          prop.listingType === 'Buy'
                            ? 'bg-forest text-white'
                            : 'bg-gold text-forest'
                        }`}
                      >
                        {prop.listingType === 'Buy' ? 'Sale' : 'Rent'}
                      </span>
                      {getStatusBadge(prop.publicationStatus)}
                    </div>
                    <h4 className="font-bold text-sm text-charcoal line-clamp-1">
                      {prop.title}
                    </h4>
                    <p className="text-xs text-mutedText truncate">
                      {prop.location}
                    </p>
                    <p className="text-sm font-bold text-forest mt-1">
                      {formatPrice(prop.price, prop.listingType)}
                    </p>
                  </div>
                </div>

                {prop.rejectionReason && prop.publicationStatus === 'rejected' && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    <strong>Revision Required:</strong> {prop.rejectionReason}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-sage/60">
                  <Link
                    to={`/properties/${prop.id}`}
                    target="_blank"
                    className="text-xs font-semibold text-mutedText hover:text-forest flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link to={`/agent/properties/${prop.id}/edit`}>
                      <Button variant="outline" size="sm" icon={Edit}>
                        Edit
                      </Button>
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteModalState({
                          isOpen: true,
                          propertyId: prop.id,
                          propertyTitle: prop.title,
                        })
                      }
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalState.isOpen}
        title="Delete Property Listing"
        message={`Are you sure you want to permanently delete "${deleteModalState.propertyTitle}"? This will remove the listing from Cloud Firestore.`}
        confirmText="Delete Listing"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() =>
          setDeleteModalState({ isOpen: false, propertyId: null, propertyTitle: '' })
        }
      />
    </div>
  );
}
