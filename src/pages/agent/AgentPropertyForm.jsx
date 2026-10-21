import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  HelpCircle,
  CheckCircle2,
  Upload,
  X,
  Star,
  Loader2,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import NotFoundState from '../../components/common/NotFoundState';
import LoadingState from '../../components/common/LoadingState';
import { useAgentAuth } from '../../context/AgentAuthContext';
import {
  getAgentPropertyById,
  createAgentProperty,
  updateAgentProperty,
  generateStablePropertyId,
} from '../../services/agentPortalService';
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
];

export default function AgentPropertyForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { agentUser, agentProfile } = useAgentAuth();

  const [loading, setLoading] = useState(isEditMode);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(null); // 'draft' | 'pending' | null
  const isSubmittingRef = useRef(false);
  const submissionDocIdRef = useRef(id || null);
  const [hasCreatedRecord, setHasCreatedRecord] = useState(isEditMode);
  const [successNotice, setSuccessNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Photography State (Browser-native local compression directly to Firestore, No Firebase Storage)
  const fileInputRef = useRef(null);
  const [processingImages, setProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [imageError, setImageError] = useState('');
  const [imageNotice, setImageNotice] = useState('');

  // Form Fields State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    listingType: 'Buy', // 'Buy' = Sale, 'Rent' = Rent
    propertyType: 'Apartment',
    price: '',
    bedrooms: '3',
    bathrooms: '3',
    areaSqFt: '',
    furnishing: 'Fully Furnished',
    parkingSlots: '2',
    // Location
    address: '',
    locality: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '',
    // Features & Images
    amenities: ['24/7 Security', 'Covered Parking', 'Elevator Access'],
    imageUrls: [],
    isFeatured: false,
    publicationStatus: 'draft',
    rejectionReason: null,
  });

  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [errors, setErrors] = useState({});



  // Ensure stable document ID is established for this creation session or bound to existing ID
  useEffect(() => {
    if (isEditMode) {
      submissionDocIdRef.current = id;
      setHasCreatedRecord(true);
    } else if (!submissionDocIdRef.current) {
      submissionDocIdRef.current = generateStablePropertyId();
    }
  }, [id, isEditMode]);

  // Load existing property when in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    setLoading(true);

    getAgentPropertyById(id)
      .then((property) => {
        if (!isMounted) return;

        // Security check: Must exist and belong to current authenticated advisor
        if (!property || (agentUser?.uid && property.createdByUid && property.createdByUid !== agentUser.uid)) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setFormData({
          title: property.title || '',
          description: property.description || '',
          listingType: property.listingType || 'Buy',
          propertyType: property.propertyType || 'Apartment',
          price: property.price ? String(property.price) : '',
          bedrooms: property.bedrooms !== undefined ? String(property.bedrooms) : '0',
          bathrooms: property.bathrooms !== undefined ? String(property.bathrooms) : '1',
          areaSqFt: property.areaSqFt ? String(property.areaSqFt) : '',
          furnishing: property.furnishing || 'Fully Furnished',
          parkingSlots: property.parkingSlots !== undefined ? String(property.parkingSlots) : '1',
          address: property.address || property.location || '',
          locality: property.locality || '',
          city: property.city || 'Mumbai',
          state: property.state || 'Maharashtra',
          postalCode: property.postalCode || '',
          amenities: Array.isArray(property.amenities) ? property.amenities : [],
          imageUrls: Array.isArray(property.imageUrls) && property.imageUrls.length > 0
            ? property.imageUrls
            : (Array.isArray(property.images) ? property.images : []),
          isFeatured: Boolean(property.isFeatured),
          publicationStatus: property.publicationStatus || 'draft',
          rejectionReason: property.rejectionReason || null,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load property:', err);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, agentUser?.uid]);

  if (loading) {
    return <LoadingState message="Retrieving listing specifications..." />;
  }

  // Not Found State for unknown ID (strictly prevented silent creation)
  if (isEditMode && notFound) {
    return (
      <div className="bg-white rounded-3xl border border-sage p-8 shadow-soft">
        <NotFoundState
          title="Listing Not Found"
          message={`The property listing ID "${id}" does not exist in your agent portfolio or may have been deleted.`}
          backLink="/agent/properties"
          backText="Return to My Properties"
        />
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Toggle Amenities
  const toggleAmenity = (amenity) => {
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

  // Add Custom Amenity
  const handleAddCustomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    if (trimmed && !formData.amenities.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, trimmed],
      }));
      setCustomAmenityInput('');
    }
  };

  // ==========================================
  // Image & Gallery Management
  // ==========================================

  const handleImageFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImageError('');
    setImageNotice('');

    const currentCount = formData.imageUrls.length;
    const availableSlots = MAX_PROPERTY_IMAGES - currentCount;

    if (availableSlots <= 0) {
      setImageError(`You have already attached the maximum allowed ${MAX_PROPERTY_IMAGES} photos for this property listing.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    let filesToProcess = files;
    if (files.length > availableSlots) {
      filesToProcess = files.slice(0, availableSlots);
      setImageNotice(
        `Added first ${availableSlots} photos. Maximum gallery capacity is ${MAX_PROPERTY_IMAGES} photos per property.`
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
              `Skipped "${file.name}": Total property gallery budget limit (${Math.round(MAX_GALLERY_BUDGET_BYTES / 1024)} KB) reached.`
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
      } else if (!imageNotice && newlyAddedUrls.length > 0) {
        setImageNotice(`Successfully added ${newlyAddedUrls.length} property photo${newlyAddedUrls.length > 1 ? 's' : ''}.`);
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
    const trimmed = newImageUrlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrors((prev) => ({ ...prev, newImageUrl: 'Please enter a valid HTTP/HTTPS image URL' }));
      return;
    }

    if (formData.imageUrls.length >= MAX_PROPERTY_IMAGES) {
      setImageError(`Maximum gallery capacity of ${MAX_PROPERTY_IMAGES} photos reached.`);
      return;
    }

    if (formData.imageUrls.includes(trimmed)) {
      setErrors((prev) => ({ ...prev, newImageUrl: 'This image URL is already in the gallery.' }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, trimmed],
    }));
    setNewImageUrlInput('');
    setErrors((prev) => ({ ...prev, newImageUrl: null, imageUrls: null }));
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, idx) => idx !== indexToRemove),
    }));
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

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Property title is required';
    } else if (formData.title.trim().length < 8) {
      newErrors.title = 'Title should be at least 8 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Property description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description should be at least 20 characters';
    }

    const numericPrice = Number(formData.price);
    if (!formData.price || isNaN(numericPrice) || numericPrice <= 0) {
      newErrors.price = 'Please enter a valid positive price';
    }

    const numericArea = Number(formData.areaSqFt);
    if (!formData.areaSqFt || isNaN(numericArea) || numericArea <= 0) {
      newErrors.areaSqFt = 'Please enter a valid positive area in square feet';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required';
    }

    if (!formData.locality.trim()) {
      newErrors.locality = 'Locality / neighborhood is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal / PIN code is required';
    }

    if (!formData.imageUrls || formData.imageUrls.length === 0) {
      newErrors.imageUrls = 'Please include at least one property image (upload a file or paste a URL)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (targetStatus) => {
    // 1. Synchronously ignore any repeated clicks, double-clicks, or Enter events while in-flight
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    setErrorMessage('');
    if (!validateForm()) {
      // Scroll to top of form to show validation messages
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    // 2. Lock immediately before async operations begin
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmittingAction(targetStatus);

    // 3. Guarantee a stable property document ID for this submission session
    if (!submissionDocIdRef.current) {
      submissionDocIdRef.current = id || generateStablePropertyId();
    }
    const currentDocId = submissionDocIdRef.current;

    const submissionPayload = {
      ...formData,
      location: `${formData.locality}, ${formData.city}`,
      price: Number(formData.price),
      areaSqFt: Number(formData.areaSqFt),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      parkingSlots: Number(formData.parkingSlots),
      publicationStatus: targetStatus,
      agentName: agentProfile?.name || agentUser?.displayName || 'Advisor',
      agentEmail: agentUser?.email || '',
      agentPhone: agentProfile?.phone || '',
      agency: agentProfile?.agency || '',
    };

    try {
      if (isEditMode || hasCreatedRecord) {
        // Updating an existing draft, resubmitting a rejected listing, or applying revisions
        await updateAgentProperty(currentDocId, submissionPayload);
        setSuccessNotice({
          status: targetStatus,
          propertyTitle: formData.title?.trim() || 'Property Listing',
          isEdit: true,
          propertyId: currentDocId,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Initial creation with deterministic stable document ID
        const created = await createAgentProperty(submissionPayload, targetStatus, currentDocId);
        setHasCreatedRecord(true);
        submissionDocIdRef.current = created.id;
        setSuccessNotice({
          status: targetStatus,
          propertyTitle: created?.title?.trim() || formData.title?.trim() || 'Property Listing',
          isEdit: false,
          propertyId: created.id,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to save listing:', err);
      setErrorMessage(err.message || 'Failed to save property listing to Cloud Firestore. Please verify your connection.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } finally {
      // Re-enable button only if the request failed or completed
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  // Render dedicated success confirmation panel once property is saved
  if (successNotice) {
    const isPendingReview = successNotice.status === 'pending';
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-14 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-sage/80 shadow-soft p-8 sm:p-12 text-center space-y-6">
          {/* Tasteful success checkmark icon with subtle green accent */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8 stroke-[2]" />
          </div>

          {/* Status badge */}
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isPendingReview
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPendingReview ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {isPendingReview ? 'Pending Review' : 'Draft'}
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal tracking-tight">
              {isPendingReview ? 'Property Submitted Successfully!' : 'Property Saved as Draft'}
            </h2>
            <p className="text-sm sm:text-base text-charcoal/80 leading-relaxed max-w-lg mx-auto">
              {isPendingReview
                ? `Your property "${successNotice.propertyTitle}" has been submitted successfully for review. Our team will review your listing, and you will be notified once a decision has been made.`
                : `Your property "${successNotice.propertyTitle}" has been saved as a draft. You can continue editing or submit it for review at any time.`}
            </p>
          </div>

          {/* Optional supporting text */}
          <p className="text-xs sm:text-sm text-mutedText">
            {isPendingReview
              ? "You can track your property's review status in My Properties."
              : 'You can access your drafts anytime in My Properties.'}
          </p>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/agent/properties')}
              className="w-full sm:w-auto shadow-sm"
            >
              View My Properties
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/agent/dashboard')}
              className="w-full sm:w-auto"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleFormKeyDown = (e) => {
    // Prevent Enter key in single-line inputs from triggering accidental submissions
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  return (
    <div onKeyDown={handleFormKeyDown} className="space-y-8 max-w-5xl mx-auto">
      {/* Back button and page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/agent/properties"
            className="p-2 rounded-xl bg-white border border-sage text-charcoal/80 hover:text-forest hover:bg-sage/40 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-serif text-2xl font-bold text-charcoal tracking-tight">
              {isEditMode ? 'Edit Property Listing' : 'Create New Property Listing'}
            </h2>
            <p className="text-xs text-mutedText">
              {isEditMode
                ? `Updating listing ID: ${id}`
                : 'Enter specifications, architectural details, and pricing.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/agent/properties')}
            disabled={isSubmitting || processingImages}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Save}
            onClick={() => handleSubmit('draft')}
            isLoading={isSubmitting && submittingAction === 'draft'}
            disabled={isSubmitting || processingImages}
          >
            {isSubmitting && submittingAction === 'draft' ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Send}
            onClick={() => handleSubmit('pending')}
            isLoading={isSubmitting && submittingAction === 'pending'}
            disabled={isSubmitting || processingImages}
          >
            {isSubmitting && submittingAction === 'pending' ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>

      {/* In-Page Error Notification Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 shadow-soft flex items-start justify-between gap-3.5 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-rose-900 text-sm sm:text-base">
                Failed to Save Property Listing
              </h3>
              <p className="text-xs sm:text-sm text-rose-800 mt-0.5 leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="p-1 rounded-lg text-rose-700 hover:bg-rose-100 transition-colors shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rejection Feedback Banner for Rejected Properties in Edit Mode */}
      {isEditMode && formData.publicationStatus === 'rejected' && formData.rejectionReason && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-soft flex items-start gap-3.5 animate-in fade-in duration-200">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-rose-900 text-sm sm:text-base">
                Listing Revisions Requested by Administrator
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-200 text-rose-800">
                Revision Required
              </span>
            </div>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed font-medium">
              {formData.rejectionReason}
            </p>
            <p className="text-[11px] text-rose-700 pt-0.5">
              Please address the administrator feedback above and click <strong>"Submit for Review"</strong> to resubmit this listing.
            </p>
          </div>
        </div>
      )}



      {/* Main Form Body */}
      <div className="space-y-8">
        {/* ======================================================== */}
        {/* SECTION 1: BASIC PROPERTY INFORMATION                     */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-sage p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sage/60">
            <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                1. Property Information
              </h3>
              <p className="text-xs text-mutedText">
                Primary specifications, dimensions, and transactional type
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <Input
              label="Property Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. The Imperial Sky Residence — Sea-Facing Duplex"
              required
              error={errors.title}
            />

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe architectural style, natural lighting, finishes, floor heights, view horizons, and neighborhood appeal..."
                className={`w-full rounded-xl bg-white border ${
                  errors.description ? 'border-red-400 focus:border-red-500' : 'border-sage focus:border-forest'
                } p-3 text-sm text-charcoal placeholder-mutedText/60 focus:outline-none focus:ring-1 focus:ring-forest transition-colors`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.description}</p>
              )}
            </div>

            {/* Transaction Purpose & Property Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-2">
                  Listing Purpose <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, listingType: 'Buy' }))}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                      formData.listingType === 'Buy'
                        ? 'bg-forest text-white border-forest shadow-xs'
                        : 'bg-white text-charcoal border-sage hover:bg-sage/30'
                    }`}
                  >
                    For Sale (Buy)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, listingType: 'Rent' }))}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                      formData.listingType === 'Rent'
                        ? 'bg-forest text-white border-forest shadow-xs'
                        : 'bg-white text-charcoal border-sage hover:bg-sage/30'
                    }`}
                  >
                    For Rent
                  </button>
                </div>
              </div>

              <Select
                label="Property Type"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                options={[
                  { value: 'Apartment', label: 'Apartment / Penthouse' },
                  { value: 'Villa', label: 'Villa / Estate' },
                  { value: 'Independent House', label: 'Independent Bungalow' },
                  { value: 'Plot/Land', label: 'Plot / Land' },
                  { value: 'Commercial', label: 'Commercial Office / Retail' },
                ]}
                required
              />
            </div>

            {/* Price & Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={formData.listingType === 'Rent' ? 'Rental Price (₹ / month)' : 'Asking Price (₹ Total)'}
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                placeholder={formData.listingType === 'Rent' ? 'e.g. 500000' : 'e.g. 185000000'}
                required
                error={errors.price}
                helperText={
                  formData.price && !isNaN(Number(formData.price))
                    ? formData.listingType === 'Rent'
                      ? `Format preview: ₹${(Number(formData.price) / 100000).toFixed(2)} Lakh / month`
                      : `Format preview: ₹${(Number(formData.price) / 10000000).toFixed(2)} Cr`
                    : null
                }
              />

              <Input
                label="Super Built-up Area (Sq.Ft)"
                name="areaSqFt"
                type="number"
                value={formData.areaSqFt}
                onChange={handleInputChange}
                placeholder="e.g. 4800"
                required
                error={errors.areaSqFt}
              />
            </div>

            {/* Bedrooms, Bathrooms, Furnishing, Parking */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Select
                label="Bedrooms"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                options={[
                  { value: '0', label: 'Studio / Plot' },
                  { value: '1', label: '1 BHK' },
                  { value: '2', label: '2 BHK' },
                  { value: '3', label: '3 BHK' },
                  { value: '4', label: '4 BHK' },
                  { value: '5', label: '5 BHK' },
                  { value: '6', label: '6+ BHK' },
                ]}
              />

              <Select
                label="Bathrooms"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                options={[
                  { value: '1', label: '1 Bath' },
                  { value: '2', label: '2 Baths' },
                  { value: '3', label: '3 Baths' },
                  { value: '4', label: '4 Baths' },
                  { value: '5', label: '5 Baths' },
                  { value: '6', label: '6+ Baths' },
                ]}
              />

              <Select
                label="Furnishing"
                name="furnishing"
                value={formData.furnishing}
                onChange={handleInputChange}
                options={[
                  { value: 'Fully Furnished', label: 'Fully Furnished' },
                  { value: 'Semi-Furnished', label: 'Semi-Furnished' },
                  { value: 'Unfurnished', label: 'Unfurnished' },
                ]}
              />

              <Select
                label="Parking Slots"
                name="parkingSlots"
                value={formData.parkingSlots}
                onChange={handleInputChange}
                options={[
                  { value: '0', label: 'None' },
                  { value: '1', label: '1 Slot' },
                  { value: '2', label: '2 Slots' },
                  { value: '3', label: '3 Slots' },
                  { value: '4', label: '4 Slots' },
                  { value: '5', label: '5+ Slots' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: LOCATION DETAILS                               */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-sage p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sage/60">
            <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                2. Location & Address
              </h3>
              <p className="text-xs text-mutedText">
                Neighborhood, administrative boundaries, and pin code
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Street Address / Tower Name"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="e.g. 14th Floor, Celeste Towers, Nargis Dutt Road"
              required
              error={errors.address}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Locality / Enclave"
                name="locality"
                value={formData.locality}
                onChange={handleInputChange}
                placeholder="e.g. Pali Hill, Bandra West"
                required
                error={errors.locality}
              />

              <Select
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                options={[
                  { value: 'Mumbai', label: 'Mumbai' },
                  { value: 'Bengaluru', label: 'Bengaluru' },
                  { value: 'Delhi NCR', label: 'Delhi NCR (Gurugram/South Delhi)' },
                  { value: 'Goa', label: 'Goa' },
                  { value: 'Pune', label: 'Pune' },
                  { value: 'Hyderabad', label: 'Hyderabad' },
                ]}
                required
                error={errors.city}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="e.g. Maharashtra"
                required
                error={errors.state}
              />

              <Input
                label="Postal Code (PIN)"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="e.g. 400050"
                required
                error={errors.postalCode}
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: FEATURES, AMENITIES & IMAGES                   */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-sage p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sage/60">
            <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                3. Features, Amenities & Photography
              </h3>
              <p className="text-xs text-mutedText">
                Property photography and key architectural luxury amenities
              </p>
            </div>
          </div>

          {/* Amenities Selector */}
          <div>
            <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-2">
              Select Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_AMENITIES.map((amenity) => {
                const selected = formData.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                      selected
                        ? 'bg-forest text-white border-forest shadow-xs'
                        : 'bg-ivory/60 text-charcoal/80 border-sage hover:bg-sage/40'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        selected
                          ? 'bg-gold border-gold text-forest'
                          : 'border-sage bg-white'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amenity Adder */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Add custom amenity (e.g. Private Helipad, Wine Cellar)..."
                value={customAmenityInput}
                onChange={(e) => setCustomAmenityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAmenity();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-ivory/60 border border-sage text-xs focus:outline-none focus:border-forest"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={handleAddCustomAmenity}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Featured Listing Preference */}
          <div className="p-4 rounded-xl bg-gold/10 border border-gold/40 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-forest">
                Request Featured Placement
              </p>
              <p className="text-[11px] text-mutedText">
                Showcase this listing on the EstateVista homepage showcase hero carousel.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-sage peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
            </label>
          </div>

          {/* Property Imagery (Local Browser Compression directly to Firestore) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sage/40">
              <div>
                <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider">
                  Property Photographs <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-mutedText">
                  Upload multiple photos from your device. First photo is designated as the listing's primary cover photo.
                </p>
              </div>

              {/* Gallery Metrics Badge */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest bg-sage-light px-2.5 py-1 rounded-lg border border-sage">
                  <span>Gallery: {formData.imageUrls.length} / {MAX_PROPERTY_IMAGES} photos</span>
                  {calculateGallerySize(formData.imageUrls) > 0 && (
                    <span className="text-mutedText font-normal">
                      ({Math.round(calculateGallerySize(formData.imageUrls) / 1024)} KB)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Notification / Error Alerts */}
            {imageNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{imageNotice}</span>
              </div>
            )}

            {imageError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            {/* Progress Box during batch upload */}
            {processingImages && (
              <div className="p-4 rounded-xl bg-forest/5 border border-forest/20 flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-forest">
                      Processing & Optimizing Image {processingProgress.current} of {processingProgress.total}...
                    </p>
                    <p className="text-[11px] text-mutedText">
                      Resizing to high-def landscape and compressing directly in your browser.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button & External URL Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                disabled={processingImages || isSubmitting || formData.imageUrls.length >= MAX_PROPERTY_IMAGES}
                onChange={handleImageFilesSelected}
                className="hidden"
              />

              <Button
                type="button"
                variant="primary"
                size="md"
                icon={Upload}
                isLoading={processingImages}
                disabled={isSubmitting || formData.imageUrls.length >= MAX_PROPERTY_IMAGES}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                Upload Photos
              </Button>

              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste external image URL (Unsplash, CDN, etc)..."
                  value={newImageUrlInput}
                  disabled={processingImages || isSubmitting}
                  onChange={(e) => setNewImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-ivory/60 border border-sage text-xs focus:outline-none focus:border-forest text-charcoal"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  disabled={processingImages || isSubmitting || formData.imageUrls.length >= MAX_PROPERTY_IMAGES}
                  onClick={handleAddImageUrl}
                >
                  Add URL
                </Button>
              </div>
            </div>

            {errors.newImageUrl && (
              <p className="text-xs text-red-600">{errors.newImageUrl}</p>
            )}
            {errors.imageUrls && (
              <p className="text-xs text-red-600 font-semibold">{errors.imageUrls}</p>
            )}

            {/* Thumbnail Preview Grid with Reordering & Cover controls */}
            {formData.imageUrls.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-2">
                {formData.imageUrls.map((url, idx) => {
                  const isCover = idx === 0;
                  const isBase64 = typeof url === 'string' && url.startsWith('data:');
                  const approxKb = isBase64 ? Math.round(url.length / 1024) : null;

                  return (
                    <div
                      key={idx}
                      className={`relative group rounded-2xl overflow-hidden border ${
                        isCover ? 'border-gold shadow-md ring-2 ring-gold/40' : 'border-sage/70 shadow-xs'
                      } bg-ivory aspect-[16/10] flex flex-col justify-between`}
                    >
                      <img
                        src={url}
                        alt={`Property photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80';
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-charcoal/70 text-white backdrop-blur-xs">
                          #{idx + 1}
                        </span>

                        {isCover ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold text-forest shadow border border-white tracking-wide">
                            ★ Cover Photo
                          </span>
                        ) : approxKb ? (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/50 text-white backdrop-blur-xs">
                            {approxKb} KB
                          </span>
                        ) : null}
                      </div>

                      {/* Interactive Controls Overlay */}
                      <div className="absolute inset-0 bg-charcoal/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 gap-2">
                        <div className="flex items-center justify-between gap-1.5">
                          {/* Reordering Buttons */}
                          <div className="flex items-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, idx - 1)}
                                className="p-1.5 rounded-lg bg-white/90 text-charcoal hover:bg-forest hover:text-white transition-colors"
                                title="Move left / earlier in gallery"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {idx < formData.imageUrls.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, idx + 1)}
                                className="p-1.5 rounded-lg bg-white/90 text-charcoal hover:bg-forest hover:text-white transition-colors"
                                title="Move right / later in gallery"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(idx)}
                                className="px-2 py-1 rounded-lg bg-gold text-forest hover:bg-gold-light text-[10px] font-bold transition-colors shadow-xs"
                                title="Set as Cover Photo"
                              >
                                Make Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl border-2 border-dashed border-sage text-center space-y-2 bg-ivory/40">
                <div className="w-10 h-10 rounded-xl bg-sage-light text-forest flex items-center justify-center mx-auto">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-sm font-bold text-charcoal">
                  No Property Photos Attached Yet
                </h4>
                <p className="text-xs text-mutedText max-w-sm mx-auto">
                  Click <strong>Upload Photos</strong> to select photos from your device, or paste external image URLs. Up to {MAX_PROPERTY_IMAGES} photos supported per listing.
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-ivory/60 border border-sage/60 text-[11px] text-mutedText space-y-1">
              <p className="font-bold text-charcoal flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold" />
                <span>Zero External Storage Footprint</span>
              </p>
              <p className="leading-relaxed">
                Photos uploaded from your device are automatically center-optimized to high-resolution landscape (max 960×640 px) and compressed under 75 KB locally in your browser. Saved images are permanently stored directly with the listing in Cloud Firestore without requiring Firebase Cloud Storage or third-party image hosting.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar Footer */}
        <div className="bg-white rounded-2xl border border-sage p-4 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-mutedText text-center sm:text-left">
            Listing changes will be synchronized directly to Cloud Firestore.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/agent/properties')}
              disabled={isSubmitting || processingImages}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={Save}
              onClick={() => handleSubmit('draft')}
              isLoading={isSubmitting && submittingAction === 'draft'}
              disabled={isSubmitting || processingImages}
            >
              {isSubmitting && submittingAction === 'draft' ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Send}
              onClick={() => handleSubmit('pending')}
              isLoading={isSubmitting && submittingAction === 'pending'}
              disabled={isSubmitting || processingImages}
            >
              {isSubmitting && submittingAction === 'pending' ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
