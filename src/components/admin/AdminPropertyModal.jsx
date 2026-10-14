import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Shield,
  User,
  MapPin,
  DollarSign,
  Layers,
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import {
  createFirestoreAdminProperty,
  updateFirestoreAdminProperty,
} from '../../services/adminFirestoreService';

const PRESET_AMENITIES = [
  'Sea View',
  'Private Pool',
  '24/7 Security',
  'Private Gymnasium',
  'Home Automation',
  'Italian Marble Flooring',
  'Covered Parking',
  'Direct Elevator Access',
  'Clubhouse Access',
  'Central Air Conditioning',
  'Solar Power Integration',
  'Landscaped Garden',
  'EV Charger Installed',
  'Wine Cellar',
  'Servant Quarter',
  'High-Speed Internet',
];

const SAMPLE_DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
];

export default function AdminPropertyModal({
  isOpen,
  onClose,
  property = null,
  onSaved,
  adminUser,
}) {
  const isEditMode = Boolean(property && property.id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    listingType: 'Buy',
    propertyType: 'Apartment',
    price: '',
    areaSqFt: '',
    bedrooms: '3',
    bathrooms: '3',
    furnishing: 'Fully Furnished',
    parkingSlots: '2',
    address: '',
    locality: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '',
    amenities: ['24/7 Security', 'Covered Parking', 'Direct Elevator Access'],
    imageUrls: [],
    publicationStatus: 'pending',
    rejectionReason: '',
    isFeatured: false,
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [customAmenity, setCustomAmenity] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Populate form when property changes or modal opens
  useEffect(() => {
    if (property) {
      const rawImages = property.imageUrls?.length > 0 ? property.imageUrls : (property.images || []);
      setFormData({
        title: property.title || '',
        description: property.description || '',
        listingType: property.listingType || 'Buy',
        propertyType: property.propertyType || 'Apartment',
        price: property.price ? String(property.price) : '',
        areaSqFt: property.areaSqFt ? String(property.areaSqFt) : '',
        bedrooms: property.bedrooms !== undefined ? String(property.bedrooms) : '3',
        bathrooms: property.bathrooms !== undefined ? String(property.bathrooms) : '3',
        furnishing: property.furnishing || 'Fully Furnished',
        parkingSlots: property.parkingSlots !== undefined ? String(property.parkingSlots) : '2',
        address: property.address || '',
        locality: property.locality || '',
        city: property.city || 'Mumbai',
        state: property.state || 'Maharashtra',
        postalCode: property.postalCode || '',
        amenities: Array.isArray(property.amenities) ? property.amenities : [],
        imageUrls: Array.isArray(rawImages) ? rawImages : [],
        publicationStatus: property.publicationStatus || (property.isPublished ? 'published' : 'draft'),
        rejectionReason: property.rejectionReason || '',
        isFeatured: Boolean(property.isFeatured),
      });
    } else {
      // Clean state for Create Property
      setFormData({
        title: '',
        description: '',
        listingType: 'Buy',
        propertyType: 'Apartment',
        price: '',
        areaSqFt: '',
        bedrooms: '3',
        bathrooms: '3',
        furnishing: 'Fully Furnished',
        parkingSlots: '2',
        address: '',
        locality: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '',
        amenities: ['24/7 Security', 'Covered Parking', 'Direct Elevator Access'],
        imageUrls: [],
        publicationStatus: 'draft',
        rejectionReason: '',
        isFeatured: false,
      });
    }
    setErrors({});
    setSubmitError('');
    setNewImageUrl('');
    setCustomAmenity('');
  }, [property, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleToggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    if (!formData.amenities.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, trimmed],
      }));
    }
    setCustomAmenity('');
  };

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, trimmed],
    }));
    setNewImageUrl('');
    setErrors((prev) => ({ ...prev, imageUrls: null }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleAddSamplePhotos = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: Array.from(new Set([...prev.imageUrls, ...SAMPLE_DEMO_IMAGES])),
    }));
    setErrors((prev) => ({ ...prev, imageUrls: null }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Property title is required.';
    }
    if (!formData.price || Number(formData.price) <= 0) {
      errs.price = 'Valid price in INR is required.';
    }
    if (!formData.areaSqFt || Number(formData.areaSqFt) <= 0) {
      errs.areaSqFt = 'Valid carpet area in square feet is required.';
    }
    if (!formData.city.trim()) {
      errs.city = 'City location is required.';
    }
    if (formData.publicationStatus === 'rejected' && !formData.rejectionReason.trim()) {
      errs.rejectionReason = 'Please state a reason for rejecting this property.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      if (isEditMode) {
        await updateFirestoreAdminProperty(property.id, formData, adminUser);
        onSaved({ id: property.id, ...formData });
      } else {
        const created = await createFirestoreAdminProperty(formData, adminUser);
        onSaved(created);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save property by admin:', err);
      setSubmitError(err.message || 'Operation failed. Check administrative permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-sage shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-sage/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
              Executive Asset Management
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mt-0.5">
              {isEditMode ? 'Edit Property Representation' : 'Create New Luxury Property'}
            </h3>
            <p className="text-xs text-mutedText mt-0.5">
              {isEditMode
                ? `Modifying Cloud Firestore document: ${property.id}`
                : 'Publish or draft a direct administrative property representation in Cloud Firestore'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-mutedText hover:text-charcoal hover:bg-sage/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ownership / Provenance Notice */}
        {isEditMode ? (
          <div className="p-3.5 rounded-2xl bg-sage-light/70 border border-sage flex items-start gap-3">
            <User className="w-4 h-4 text-forest shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-charcoal">
              <span className="font-bold text-forest">Ownership Attribution: </span>
              {property.isAdminCreated ? (
                <span className="font-semibold text-charcoal">
                  Direct Administrator Asset (Created by {property.agentEmail || 'Admin'})
                </span>
              ) : (
                <span>
                  Submitted by Advisor <strong>{property.agentName || 'Advisor'}</strong> ({property.agentEmail || 'No email'}) • Original UID:{' '}
                  <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-sage">
                    {property.createdByUid || property.agentId || 'N/A'}
                  </code>
                </span>
              )}
              <p className="text-[11px] text-mutedText mt-0.5">
                Note: Updating details will record your admin email in the audit trail while strictly preserving the listing's ownership.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/20 flex items-start gap-3">
            <Shield className="w-4 h-4 text-forest shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-charcoal">
              <span className="font-bold text-forest">Direct Admin Representation: </span>
              <span>
                This property will be created under administrator clearance ({adminUser?.email || 'Administrator'}) and will be flagged as an{' '}
                <strong>Admin Created</strong> asset.
              </span>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {submitError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Operation Denied</p>
              <p className="text-[11px] text-rose-800 mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-forest" />
              1. Asset Specifications
            </h4>

            <div>
              <Input
                label="Property Title"
                placeholder="e.g. The Imperial Seafront Penthouse, Worli Sea Face"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={errors.title}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1.5">
                Property Representation Description
              </label>
              <textarea
                rows={3}
                placeholder="Provide comprehensive details of architectural appointments, sweeping panoramas, and ultra-luxury specifications..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full p-3 rounded-xl bg-ivory border border-sage text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Listing Type"
                value={formData.listingType}
                onChange={(e) => handleChange('listingType', e.target.value)}
                options={[
                  { value: 'Buy', label: 'For Sale (Buy)' },
                  { value: 'Rent', label: 'For Lease (Rent)' },
                ]}
              />

              <Select
                label="Property Category"
                value={formData.propertyType}
                onChange={(e) => handleChange('propertyType', e.target.value)}
                options={[
                  { value: 'Apartment', label: 'Apartment' },
                  { value: 'Penthouse', label: 'Penthouse' },
                  { value: 'Villa', label: 'Villa' },
                  { value: 'Estate', label: 'Estate' },
                  { value: 'Mansion', label: 'Mansion' },
                  { value: 'Commercial', label: 'Commercial Prime' },
                ]}
              />

              <Input
                label="Price (INR ₹)"
                type="number"
                placeholder="e.g. 250000000"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                error={errors.price}
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Carpet Area (sq.ft)"
                type="number"
                placeholder="e.g. 4500"
                value={formData.areaSqFt}
                onChange={(e) => handleChange('areaSqFt', e.target.value)}
                error={errors.areaSqFt}
                required
              />

              <Select
                label="Bedrooms"
                value={formData.bedrooms}
                onChange={(e) => handleChange('bedrooms', e.target.value)}
                options={[
                  { value: '1', label: '1 BHK' },
                  { value: '2', label: '2 BHK' },
                  { value: '3', label: '3 BHK' },
                  { value: '4', label: '4 BHK' },
                  { value: '5', label: '5+ BHK' },
                ]}
              />

              <Select
                label="Bathrooms"
                value={formData.bathrooms}
                onChange={(e) => handleChange('bathrooms', e.target.value)}
                options={[
                  { value: '1', label: '1 Bath' },
                  { value: '2', label: '2 Baths' },
                  { value: '3', label: '3 Baths' },
                  { value: '4', label: '4 Baths' },
                  { value: '5', label: '5+ Baths' },
                ]}
              />

              <Select
                label="Furnishing Status"
                value={formData.furnishing}
                onChange={(e) => handleChange('furnishing', e.target.value)}
                options={[
                  { value: 'Fully Furnished', label: 'Fully Furnished' },
                  { value: 'Semi-Furnished', label: 'Semi-Furnished' },
                  { value: 'Unfurnished', label: 'Unfurnished' },
                ]}
              />
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="space-y-4 pt-3 border-t border-sage/60">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-forest" />
              2. Geographic Location
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="City"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                error={errors.city}
                required
              />

              <Input
                label="Locality / Neighborhood"
                placeholder="e.g. Worli Sea Face, Bandra West"
                value={formData.locality}
                onChange={(e) => handleChange('locality', e.target.value)}
              />

              <Input
                label="State"
                placeholder="e.g. Maharashtra"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Street Address / Building"
                placeholder="e.g. Tower A, The Seafront Residences, 42 Worli Promenade"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />

              <Input
                label="Postal Code"
                placeholder="e.g. 400018"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Amenities */}
          <div className="space-y-3 pt-3 border-t border-sage/60">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-forest" />
              3. Luxury Appointments & Amenities
            </h4>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_AMENITIES.map((am) => {
                const selected = formData.amenities.includes(am);
                return (
                  <button
                    key={am}
                    type="button"
                    onClick={() => handleToggleAmenity(am)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                      selected
                        ? 'bg-forest text-white shadow-xs'
                        : 'bg-ivory text-charcoal/70 hover:bg-sage/30 border border-sage/50'
                    }`}
                  >
                    {selected ? `✓ ${am}` : `+ ${am}`}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1 max-w-md">
              <input
                type="text"
                placeholder="Add custom amenity (e.g. Helipad Access)..."
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAmenity();
                  }
                }}
                className="flex-grow px-3 py-1.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddCustomAmenity}
                className="text-xs"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Section 4: Imagery */}
          <div className="space-y-3 pt-3 border-t border-sage/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-forest" />
                4. Photographic Assets ({formData.imageUrls.length} Photos)
              </h4>
              <button
                type="button"
                onClick={handleAddSamplePhotos}
                className="text-[11px] font-bold text-forest hover:underline"
              >
                + Add Sample Luxury Photos
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="Paste public image URL (e.g. https://images.unsplash.com/...)..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                className="flex-grow px-3 py-2 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={handleAddImageUrl}
                className="text-xs"
              >
                Add Photo URL
              </Button>
            </div>

            {/* Thumbnail previews */}
            {formData.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {formData.imageUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative group rounded-xl overflow-hidden border border-sage bg-charcoal/5 h-24"
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                      {i === 0 ? 'Cover' : `#${i + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-sm"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-mutedText italic">
                No images added yet. Add image URLs above or click "+ Add Sample Luxury Photos".
              </p>
            )}
          </div>

          {/* Section 5: Moderation, Publication & Featured Placement */}
          <div className="space-y-4 pt-3 border-t border-sage/60">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-forest" />
              5. Editorial Moderation & Publication Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Platform Publication Status"
                value={formData.publicationStatus}
                onChange={(e) => handleChange('publicationStatus', e.target.value)}
                options={[
                  { value: 'draft', label: 'Private Draft (Hidden)' },
                  { value: 'pending', label: 'Pending Review (Queue)' },
                  { value: 'published', label: 'Approved & Published Live' },
                  { value: 'rejected', label: 'Rejected by Administration' },
                ]}
              />

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => handleChange('isFeatured', e.target.checked)}
                    className="w-4 h-4 text-forest rounded focus:ring-forest"
                  />
                  <div>
                    <span className="text-xs font-bold text-charcoal block">
                      Featured Placement
                    </span>
                    <span className="text-[10px] text-mutedText">
                      Highlight in curated hero carousel on homepage
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {formData.publicationStatus === 'rejected' && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-bold text-red-900 mb-1">
                  Rejection Reason / Advisor Feedback
                </label>
                <textarea
                  rows={2}
                  placeholder="Specify editorial revision needed (e.g. High-res photos required, missing RERA details)..."
                  value={formData.rejectionReason}
                  onChange={(e) => handleChange('rejectionReason', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-red-50/50 border border-red-300 text-xs text-charcoal placeholder:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.rejectionReason && (
                  <p className="text-[11px] text-red-700 mt-1 font-semibold">
                    {errors.rejectionReason}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-sage/60 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={CheckCircle2}
              isLoading={submitting}
            >
              {isEditMode ? 'Save Property Updates' : 'Create Property Listing'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
