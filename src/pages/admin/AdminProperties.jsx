import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getFirestoreAdminProperties,
  updateFirestorePropertyModeration,
  toggleFirestorePropertyFeatured,
  deleteFirestoreProperty,
} from '../../services/adminFirestoreService';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminProperties() {
  const { adminUser } = useAdminAuth();
  const [properties, setProperties] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'pending' | 'draft' | 'rejected'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'Buy' | 'Rent'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProp, setSelectedProp] = useState(null);
  const [notes, setNotes] = useState('');
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getFirestoreAdminProperties();
    setProperties(data);
    setLoading(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    await updateFirestorePropertyModeration(id, newStatus, notes, adminUser?.email || 'Administrator');
    setNotification(`Listing status updated to: ${newStatus.toUpperCase()}`);
    setSelectedProp(null);
    setNotes('');
    await loadData();
    setTimeout(() => setNotification(''), 4000);
  };

  const handleToggleFeatured = async (id) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;
    await toggleFirestorePropertyFeatured(id, prop.isFeatured);
    await loadData();
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm('Permanently remove this luxury asset listing from Cloud Firestore? This action cannot be undone.')) {
      return;
    }
    const success = await deleteFirestoreProperty(id, adminUser?.email || 'Administrator');
    if (success) {
      setNotification('Property successfully deleted from Cloud Firestore.');
      setSelectedProp(null);
      await loadData();
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const pubStatus = p.publicationStatus || (p.isPublished ? 'published' : 'draft');
    const matchesStatus = statusFilter === 'all' || pubStatus === statusFilter;
    const matchesType = typeFilter === 'all' || p.listingType === typeFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (p.title && p.title.toLowerCase().includes(query)) ||
      (p.location && p.location.toLowerCase().includes(query)) ||
      (p.city && p.city.toLowerCase().includes(query)) ||
      (p.id && p.id.toLowerCase().includes(query));
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
            Portfolio Moderation & Asset Control
          </h2>
          <p className="text-xs text-mutedText mt-0.5">
            Audit luxury residential representations, verify photographic standards, and moderate publication
          </p>
        </div>
        <div className="text-xs text-mutedText">
          Managing <strong className="text-forest">{properties.length}</strong> listings across {properties.filter((p) => p.moderationStatus === 'published').length} active
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-sage/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          {['all', 'published', 'pending', 'draft', 'rejected'].map((st) => (
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
              {st === 'pending' ? 'Pending Review' : st === 'all' ? 'All Listings' : st}
            </button>
          ))}

          <div className="h-4 w-px bg-sage mx-1 hidden sm:block" />

          {/* Type Filter */}
          {['all', 'Buy', 'Rent'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                typeFilter === t
                  ? 'bg-[#C7A76C] text-forest shadow-xs'
                  : 'bg-ivory text-charcoal/70 hover:bg-sage/30 border border-sage/40'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
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
            placeholder="Search title, city, or ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-ivory border border-sage/70 text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
      </div>

      {/* Table / Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-mutedText">Loading property moderation database...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-sage/60 text-center space-y-3">
          <Building2 className="w-10 h-10 text-mutedText mx-auto" />
          <h3 className="font-serif text-base font-bold text-charcoal">No Listings Match Filter</h3>
          <p className="text-xs text-mutedText">Adjust your status tabs or search parameters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sage/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-sage/60 text-mutedText uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Property Asset</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/40">
                {filteredProperties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-ivory/40 transition-colors">
                    {/* Asset column */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <img
                          src={prop.imageUrls?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=150&q=80'}
                          alt={prop.title}
                          className="w-12 h-12 rounded-xl object-cover border border-sage shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-charcoal truncate max-w-xs" title={prop.title}>
                            {prop.title}
                          </p>
                          <p className="text-[10px] text-mutedText font-mono">
                            ID: {prop.id} • {prop.propertyType}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Listing Type */}
                    <td className="py-3.5 px-4 font-semibold text-charcoal">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        prop.listingType === 'Buy' ? 'bg-forest/10 text-forest' : 'bg-[#C7A76C]/20 text-forest'
                      }`}>
                        {prop.listingType}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-forest whitespace-nowrap">
                      {formatCurrency(prop.price)}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-charcoal/80 whitespace-nowrap">
                      {prop.city}
                    </td>

                    {/* Featured toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(prop.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          prop.isFeatured
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-ivory border-sage/60 text-mutedText hover:text-charcoal'
                        }`}
                        title={prop.isFeatured ? 'Featured on Homepage (Click to toggle)' : 'Not Featured (Click to toggle)'}
                      >
                        <Star className={`w-3.5 h-3.5 ${prop.isFeatured ? 'fill-amber-500' : ''}`} />
                      </button>
                    </td>

                    {/* Moderation Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          (prop.publicationStatus || prop.moderationStatus) === 'published'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : (prop.publicationStatus || prop.moderationStatus) === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : (prop.publicationStatus || prop.moderationStatus) === 'rejected'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-gray-100 text-gray-800 border border-gray-300'
                        }`}
                      >
                        {prop.publicationStatus || prop.moderationStatus || 'draft'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => {
                          setSelectedProp(prop);
                          setNotes(prop.moderatorNotes || '');
                        }}
                        className="text-xs"
                      >
                        Audit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PROPERTY MODERATION AUDIT MODAL                          */}
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

            {/* Photo Gallery Strip */}
            <div className="grid grid-cols-3 gap-2">
              {selectedProp.imageUrls?.slice(0, 3).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Asset view ${i + 1}`}
                  className="w-full h-28 rounded-xl object-cover border border-sage"
                />
              ))}
            </div>

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

            {/* Description */}
            <div>
              <span className="text-[10px] uppercase font-bold text-mutedText block mb-1">
                Property Representation Copy
              </span>
              <p className="p-3.5 rounded-xl bg-ivory/70 border border-sage/40 text-xs text-charcoal leading-relaxed">
                {selectedProp.description}
              </p>
            </div>

            {/* Moderation Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-charcoal">
                Moderator Audit Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Add compliance notes or issues detected..."
                className="w-full p-3 rounded-xl bg-ivory border border-sage text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-sage/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => handleStatusChange(selectedProp.id, 'published')}
                >
                  Publish Listing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(selectedProp.id, 'draft')}
                >
                  Mark as Draft / Hold
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={AlertTriangle}
                  onClick={() => handleStatusChange(selectedProp.id, 'rejected')}
                >
                  Reject Listing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDeleteProperty(selectedProp.id)}
                  className="text-red-700 hover:bg-red-50 hover:border-red-300"
                >
                  Delete
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
