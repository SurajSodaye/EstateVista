import React, { useState, useEffect } from 'react';
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
  Save,
  Send,
  HelpCircle,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import NotFoundState from '../../components/common/NotFoundState';
import LoadingState from '../../components/common/LoadingState';
import {
  getAgentPropertyById,
  createAgentProperty,
  updateAgentProperty,
  uploadAgentMedia,
} from '../../services/agentPortalService';

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

  const [loading, setLoading] = useState(isEditMode);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);

  const [uploadingImage, setUploadingImage] = useState(false);

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
  });

  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [errors, setErrors] = useState({});

  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingImage(true);
    setErrors((prev) => ({ ...prev, imageUrls: null }));
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          setErrors((prev) => ({ ...prev, imageUrls: 'Each image must be under 10MB.' }));
          continue;
        }
        const downloadUrl = await uploadAgentMedia(file, 'properties');
        setFormData((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, downloadUrl],
        }));
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setErrors((prev) => ({ ...prev, imageUrls: 'Failed to upload image to Firebase Storage: ' + (err.message || 'Error') }));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Load existing property when in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    setLoading(true);

    getAgentPropertyById(id)
      .then((property) => {
        if (!isMounted) return;

        if (!property) {
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
          imageUrls: Array.isArray(property.imageUrls) && property.imageUrls.length > 0 ? property.imageUrls : [SAMPLE_DEMO_IMAGES[0]],
          isFeatured: Boolean(property.isFeatured),
          publicationStatus: property.publicationStatus || 'draft',
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
  }, [id, isEditMode]);

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

  // Image Management
  const handleAddImageUrl = () => {
    const trimmed = newImageUrlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrors((prev) => ({ ...prev, newImageUrl: 'Please enter a valid HTTP/HTTPS image URL' }));
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
    if (!validateForm()) {
      // Scroll to top of form to show validation messages
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    const submissionPayload = {
      ...formData,
      location: `${formData.locality}, ${formData.city}`,
      price: Number(formData.price),
      areaSqFt: Number(formData.areaSqFt),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      parkingSlots: Number(formData.parkingSlots),
      publicationStatus: targetStatus,
    };

    try {
      if (isEditMode) {
        await updateAgentProperty(id, submissionPayload);
        setSuccessNotice({
          title: 'Listing Updated in Firestore',
          message: `The changes to "${formData.title}" have been saved to Cloud Firestore (${targetStatus === 'published' ? 'Published' : targetStatus === 'pending' ? 'Submitted for Approval' : 'Draft'}).`,
        });
      } else {
        const created = await createAgentProperty(submissionPayload, targetStatus);
        setSuccessNotice({
          title: 'Listing Created in Firestore',
          message: `"${created.title}" has been saved to Cloud Firestore as a ${targetStatus === 'pending' ? 'Pending Approval' : 'Draft'} listing.`,
        });
      }
    } catch (err) {
      console.error('Failed to save listing:', err);
      alert('Failed to save property listing to Cloud Firestore: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
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
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Save}
            onClick={() => handleSubmit('draft')}
            isLoading={submitting}
          >
            Save as Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Send}
            onClick={() => handleSubmit('pending')}
            isLoading={submitting}
          >
            Submit for Approval
          </Button>
        </div>
      </div>

      {/* Success Notification Modal */}
      {successNotice && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-base">
                {successNotice.title}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                {successNotice.message}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                ✓ Persisted and synchronized with Cloud Firestore
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/agent/properties')}
            >
              View My Properties
            </Button>
            {!isEditMode && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSuccessNotice(null);
                  setFormData({
                    title: '',
                    description: '',
                    listingType: 'Buy',
                    propertyType: 'Apartment',
                    price: '',
                    bedrooms: '3',
                    bathrooms: '3',
                    areaSqFt: '',
                    furnishing: 'Fully Furnished',
                    parkingSlots: '2',
                    address: '',
                    locality: '',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '',
                    amenities: ['24/7 Security', 'Covered Parking'],
                    imageUrls: [SAMPLE_DEMO_IMAGES[0]],
                    isFeatured: false,
                    publicationStatus: 'draft',
                  });
                }}
              >
                Add Another
              </Button>
            )}
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

          {/* Property Imagery (Storage & URLs) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider">
                Property Photographs <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-mutedText">
                High-resolution JPEG, PNG, or WebP
              </span>
            </div>

            {/* Upload Button & URL fallback */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-semibold transition-colors shrink-0 shadow-xs">
                <Upload className="w-4 h-4" />
                <span>{uploadingImage ? 'Uploading to Firebase Storage...' : 'Upload Photos (Firebase Storage)'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste external image URL (Unsplash, CDN, etc)..."
                  value={newImageUrlInput}
                  onChange={(e) => setNewImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-ivory/60 border border-sage text-xs focus:outline-none focus:border-forest"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddImageUrl}
                >
                  Add URL
                </Button>
              </div>
            </div>

            {errors.newImageUrl && (
              <p className="text-xs text-red-600 mb-2">{errors.newImageUrl}</p>
            )}
            {errors.imageUrls && (
              <p className="text-xs text-red-600 mb-2">{errors.imageUrls}</p>
            )}

            {/* Thumbnail Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {formData.imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden border border-sage bg-ivory aspect-video"
                >
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {idx === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-forest text-white px-1.5 py-0.5 rounded shadow">
                      Cover Photo
                    </span>
                  )}
                </div>
              ))}
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
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={Save}
              onClick={() => handleSubmit('draft')}
              isLoading={submitting}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Send}
              onClick={() => handleSubmit('pending')}
              isLoading={submitting}
            >
              Submit for Approval
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
