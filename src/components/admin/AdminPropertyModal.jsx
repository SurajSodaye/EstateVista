import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import {
  createFirestoreAdminProperty,
  updateFirestoreAdminProperty,
} from '../../services/adminFirestoreService';
import {
  uploadPropertyImage,
  calculateGallerySize,
  MAX_PROPERTY_IMAGES,
  MAX_GALLERY_BUDGET_BYTES,
} from '../../utils/imageProcessor';

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

  // Photography State (Client-Side Local Compression directly to Firestore)
  const fileInputRef = useRef(null);
  const [processingImages, setProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [imageError, setImageError] = useState('');
  const [imageNotice, setImageNotice] = useState('');

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
    setImageError('');
    setImageNotice('');
    setProcessingImages(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  // Direct photo file selection handler (Client-side Canvas compression)
  const handleImageFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImageError('');
    setImageNotice('');

    const currentCount = formData.imageUrls.length;
    const availableSlots = MAX_PROPERTY_IMAGES - currentCount;

    if (availableSlots <= 0) {
      setImageError(
        `Maximum gallery capacity of ${MAX_PROPERTY_IMAGES} photos has already been reached.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    let filesToProcess = files;
    if (files.length > availableSlots) {
      filesToProcess = files.slice(0, availableSlots);
      setImageNotice(
        `Added first ${availableSlots} photos. Maximum gallery capacity is ${MAX_PROPERTY_IMAGES} photos.`
      );
    }

    setProcessingImages(true);
    setProcessingProgress({ current: 0, total: filesToProcess.length });

    const newlyAddedUrls = [];
    const errorsList = [];

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setProcessingProgress({ current: i + 1, total: filesToProcess.length });

        try {
          const uploadResult = await uploadPropertyImage(file, { maxWidth: 960, maxHeight: 640 });

          // Budget validation for Firestore Base64 payload
          const currentTotalBytes = calculateGallerySize([...formData.imageUrls, ...newlyAddedUrls]);
          if (currentTotalBytes + uploadResult.sizeBytes > MAX_GALLERY_BUDGET_BYTES) {
            errorsList.push(
              `Skipped "${file.name}": Gallery payload limit (${Math.round(MAX_GALLERY_BUDGET_BYTES / 1024)} KB) reached.`
            );
            break;
          }

          newlyAddedUrls.push(uploadResult.url);
        } catch (itemErr) {
          console.warn(`Failed to process photo "${file.name}":`, itemErr);
          errorsList.push(`"${file.name}": ${itemErr.message || 'Processing failed.'}`);
        }
      }

      if (newlyAddedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, ...newlyAddedUrls],
        }));
        if (errors.imageUrls) {
          setErrors((prev) => ({ ...prev, imageUrls: null }));
        }
      }

      if (errorsList.length > 0) {
        setImageError(errorsList.join(' • '));
      } else if (newlyAddedUrls.length > 0 && !imageNotice) {
        setImageNotice(
          `Successfully processed ${newlyAddedUrls.length} photo${newlyAddedUrls.length > 1 ? 's' : ''}.`
        );
        setTimeout(() => setImageNotice(''), 4000);
      }
    } finally {
      setProcessingImages(false);
      setProcessingProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setImageError('Please enter a valid HTTP or HTTPS image URL.');
      return;
    }

    if (formData.imageUrls.length >= MAX_PROPERTY_IMAGES) {
      setImageError(`Maximum gallery capacity of ${MAX_PROPERTY_IMAGES} photos reached.`);
      return;
    }

    if (formData.imageUrls.includes(trimmed)) {
      setImageError('This photo URL has already been added to the gallery.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, trimmed],
    }));
    setNewImageUrl('');
    setImageError('');
    setErrors((prev) => ({ ...prev, imageUrls: null }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
    setImageError('');
  };

  const handleClearAllImages = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: [],
    }));
    setImageError('');
    setImageNotice('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMoveImage = (fromIndex, toIndex) => {
    setFormData((prev) => {
      if (toIndex < 0 || toIndex >= prev.imageUrls.length) return prev;
      const updated = [...prev.imageUrls];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return {
        ...prev,
        imageUrls: updated,
      };
    });
  };

  const handleSetCoverImage = (indexToCover) => {
    if (indexToCover <= 0) return;
    handleMoveImage(indexToCover, 0);
  };

  const handleAddSamplePhotos = () => {
    const combined = Array.from(new Set([...formData.imageUrls, ...SAMPLE_DEMO_IMAGES])).slice(0, MAX_PROPERTY_IMAGES);
    setFormData((prev) => ({
      ...prev,
      imageUrls: combined,
    }));
    setErrors((prev) => ({ ...prev, imageUrls: null }));
    setImageNotice(`Added sample luxury property photos (${combined.length} total).`);
    setTimeout(() => setImageNotice(''), 4000);
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
    if (calculateGallerySize(formData.imageUrls) > MAX_GALLERY_BUDGET_BYTES) {
      errs.imageUrls = `Total image payload size (${Math.round(calculateGallerySize(formData.imageUrls) / 1024)} KB) exceeds the ${Math.round(MAX_GALLERY_BUDGET_BYTES / 1024)} KB safety limit for Cloud Firestore. Please remove some photos.`;
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

          {/* Section 4: Imagery & Direct Photo Upload */}
          <div className="space-y-3.5 pt-3 border-t border-sage/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-forest" />
                  4. Photographic Assets ({formData.imageUrls.length} / {MAX_PROPERTY_IMAGES})
                </h4>
                <p className="text-[11px] text-mutedText mt-0.5">
                  Upload photos directly from your computer or paste image URLs. The first photo serves as the primary cover photo.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {/* Gallery Payload & Count Badge */}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest bg-sage-light px-2.5 py-1 rounded-xl border border-sage/70">
                  <span>Gallery: {formData.imageUrls.length} / {MAX_PROPERTY_IMAGES} photos</span>
                  {calculateGallerySize(formData.imageUrls) > 0 && (
                    <span className="text-mutedText font-normal">
                      ({Math.round(calculateGallerySize(formData.imageUrls) / 1024)} KB)
                    </span>
                  )}
                </span>

                {formData.imageUrls.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllImages}
                    disabled={processingImages || submitting}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                  >
                    Clear All
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAddSamplePhotos}
                  disabled={processingImages || submitting || formData.imageUrls.length >= MAX_PROPERTY_IMAGES}
                  className="text-[11px] font-bold text-forest hover:underline disabled:opacity-50"
                >
                  + Add Sample Photos
                </button>
              </div>
            </div>

            {/* Notification & Error Alerts */}
            {imageNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{imageNotice}</span>
              </div>
            )}

            {imageError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            {/* Processing Progress Indicator */}
            {processingImages && (
              <div className="p-3.5 rounded-xl bg-forest/5 border border-forest/20 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 text-forest animate-spin shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-forest">
                    Optimizing Photo {processingProgress.current} of {processingProgress.total}...
                  </p>
                  <p className="text-[11px] text-mutedText">
                    Resizing to high-resolution landscape and compressing directly in browser.
                  </p>
                </div>
              </div>
            )}

            {/* Upload Button & External URL Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                disabled={processingImages || submitting || formData.imageUrls.length >= MAX_PROPERTY_IMAGES}
                onChange={handleImageFilesSelected}
                className="hidden"
              />

              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Upload}
                isLoading={processingImages}
                disabled={submitting || formData.imageUrls.length >= MAX_PROPERTY_IMAGES}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs shrink-0"
              >
                Upload Photos from Device
              </Button>

              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="url"
                  placeholder="Or paste public image URL (https://...)..."
                  value={newImageUrl}
                  disabled={processingImages || submitting}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  className="flex-grow px-3 py-1.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest disabled:opacity-60"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  disabled={processingImages || submitting || formData.imageUrls.length >= MAX_PROPERTY_IMAGES}
                  onClick={handleAddImageUrl}
                  className="text-xs shrink-0"
                >
                  Add URL
                </Button>
              </div>
            </div>

            {errors.imageUrls && (
              <p className="text-xs text-rose-600 font-semibold">{errors.imageUrls}</p>
            )}

            {/* Thumbnail previews with cover badge, size footprint, reordering, and removal */}
            {formData.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {formData.imageUrls.map((url, i) => {
                  const isCover = i === 0;
                  const isBase64 = typeof url === 'string' && url.startsWith('data:');
                  const approxKb = isBase64 ? Math.round(url.length / 1024) : null;

                  return (
                    <div
                      key={i}
                      className={`relative group rounded-xl overflow-hidden border ${
                        isCover ? 'border-gold shadow-md ring-2 ring-gold/40' : 'border-sage/80 shadow-xs'
                      } bg-charcoal/5 h-28 flex flex-col justify-between`}
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

                      {/* Top Badges */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                        <span className="bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono backdrop-blur-xs">
                          #{i + 1}
                        </span>

                        {isCover ? (
                          <span className="bg-gold text-forest text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-white/60 tracking-wider">
                            ★ Cover
                          </span>
                        ) : approxKb ? (
                          <span className="bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs">
                            {approxKb} KB
                          </span>
                        ) : null}
                      </div>

                      {/* Interactive Controls Overlay */}
                      <div className="absolute inset-0 bg-charcoal/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1.5">
                        <div className="flex items-center justify-between gap-1">
                          {/* Reorder Buttons */}
                          <div className="flex items-center gap-0.5">
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(i, i - 1)}
                                className="p-1 rounded-md bg-white/90 text-charcoal hover:bg-forest hover:text-white transition-colors"
                                title="Move earlier in gallery"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                            {i < formData.imageUrls.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(i, i + 1)}
                                className="p-1 rounded-md bg-white/90 text-charcoal hover:bg-forest hover:text-white transition-colors"
                                title="Move later in gallery"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(i)}
                                className="px-1.5 py-0.5 rounded-md bg-gold text-forest hover:bg-gold-light text-[9px] font-bold transition-colors shadow-xs"
                                title="Set as primary cover photo"
                              >
                                Make Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(i)}
                              className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-ivory border border-sage/60 text-center space-y-1">
                <p className="text-xs font-semibold text-charcoal">No photographic assets attached yet</p>
                <p className="text-[11px] text-mutedText">
                  Click <strong className="text-forest">"Upload Photos from Device"</strong> to select photos from your computer, paste an image URL, or add sample luxury photos.
                </p>
              </div>
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
