import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Share2,
  Heart,
  ShieldCheck,
  Check,
  Building,
  Car,
  Compass,
  Layers,
  Phone,
  Mail,
  ArrowLeft,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import PropertyGallery from '../components/property/PropertyGallery';
import PropertyInquiryForm from '../components/property/PropertyInquiryForm';
import PropertyGrid from '../components/property/PropertyGrid';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import NotFoundState from '../components/common/NotFoundState';
import { getPropertyById, getRelatedProperties } from '../services/propertyService';
import { getAgentById } from '../services/agentService';
import { formatCurrency, formatArea } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [agent, setAgent] = useState(null);
  const [relatedProperties, setRelatedProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Scroll to top upon ID change
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let isCancelled = false;

    async function loadPropertyDetails() {
      setIsLoading(true);
      setIsNotFound(false);
      try {
        const propData = await getPropertyById(id);
        if (isCancelled) return;

        if (!propData) {
          setIsNotFound(true);
          return;
        }

        setProperty(propData);

        // Fetch Agent & Related Properties in parallel
        const [agentData, related] = await Promise.all([
          getAgentById(propData.agentId),
          getRelatedProperties(propData.id, 3),
        ]);

        if (!isCancelled) {
          setAgent(agentData);
          setRelatedProperties(related);
        }
      } catch (err) {
        console.error('Failed to load property details', err);
        if (!isCancelled) setIsNotFound(true);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadPropertyDetails();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const handleShare = () => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
      }
    } catch {
      // ignore clipboard error in restricted browser contexts
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <LoadingState message="Fetching architectural specifications..." />
      </div>
    );
  }

  if (isNotFound || !property) {
    return (
      <NotFoundState
        title="Property Not Found"
        message="The property you are looking for does not exist in our demonstration registry or may have been archived."
        backLink="/properties"
        backText="Browse Available Properties"
      />
    );
  }

  return (
    <div className="pb-24">
      {/* Breadcrumb Strip */}
      <div className="bg-ivory border-b border-sage/60 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-mutedText">
          <div className="flex items-center gap-2 truncate">
            <Link to="/" className="hover:text-forest transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-forest transition-colors">
              Properties
            </Link>
            <span>/</span>
            <span className="text-charcoal font-medium truncate">{property.city}</span>
            <span>/</span>
            <span className="text-forest font-semibold truncate hidden sm:inline">{property.title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-sage hover:bg-sage/20 text-charcoal text-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition-colors ${
                isSaved
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-charcoal border-sage hover:bg-sage/20'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Title & Price Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={property.listingType === 'Rent' ? 'rent' : 'sale'} size="md">
                For {property.listingType}
              </Badge>
              <Badge variant="type" size="md">
                {property.propertyType}
              </Badge>
              {property.isFeatured && (
                <Badge variant="featured" size="md">
                  Featured Collection
                </Badge>
              )}
              <span className="text-xs text-mutedText">Ref: #{property.id}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-charcoal leading-tight">
              {property.title}
            </h1>

            <p className="flex items-center gap-2 text-xs sm:text-sm text-mutedText">
              <MapPin className="w-4 h-4 text-forest shrink-0" />
              <span>{property.location}</span>
            </p>
          </div>

          {/* Pricing Box */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sage/60 shadow-soft lg:text-right shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-mutedText block mb-1">
              {property.listingType === 'Rent' ? 'Lease Terms' : 'Offered Price'}
            </span>
            <div className="flex items-baseline gap-1.5 lg:justify-end">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-forest">
                {formatCurrency(property.price, true)}
              </span>
              {property.pricePeriod && (
                <span className="text-sm font-semibold text-mutedText">
                  {property.pricePeriod}
                </span>
              )}
            </div>
            <p className="text-xs text-mutedText mt-1">
              Exact: {formatCurrency(property.price)} (All inclusive)
            </p>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mb-10">
          <PropertyGallery images={property.imageUrls} title={property.title} />
        </div>

        {/* Main Content Layout: Specs & Description vs Sticky Inquiry Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Left Column (2 Cols on desktop) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Quick Specs Strip */}
            <div className="bg-white rounded-2xl p-5 border border-sage/60 shadow-soft grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage-light text-forest flex items-center justify-center shrink-0">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-mutedText block">Bedrooms</span>
                  <span className="font-serif text-base font-bold text-charcoal">
                    {property.bedrooms > 0 ? `${property.bedrooms} BHK` : 'Commercial'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage-light text-forest flex items-center justify-center shrink-0">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-mutedText block">Bathrooms</span>
                  <span className="font-serif text-base font-bold text-charcoal">
                    {property.bathrooms > 0 ? `${property.bathrooms} Baths` : 'Plots'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage-light text-forest flex items-center justify-center shrink-0">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-mutedText block">Carpet Area</span>
                  <span className="font-serif text-base font-bold text-charcoal">
                    {formatArea(property.areaSqFt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage-light text-forest flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-mutedText block">Date Listed</span>
                  <span className="font-serif text-base font-bold text-charcoal">
                    {formatDate(property.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-sage/60 shadow-soft space-y-4">
              <h2 className="font-serif text-2xl font-bold text-charcoal">
                Architectural Overview & Description
              </h2>
              <div className="text-sm text-charcoal/80 leading-relaxed space-y-3 font-light">
                <p>{property.description}</p>
                <p>
                  Crafted to international standards with expansive private corridors, climate efficiency, and premium European fixtures throughout. Every aspect of the residence has been designed to maximize natural light and ensure utter privacy.
                </p>
              </div>

              {/* Extra Details Grid */}
              <div className="pt-6 border-t border-sage/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-mutedText block">Furnishing:</span>
                  <span className="font-semibold text-charcoal">{property.furnishing || 'Furnished'}</span>
                </div>
                <div>
                  <span className="text-mutedText block">Facing:</span>
                  <span className="font-semibold text-charcoal">{property.facing || 'East'}</span>
                </div>
                <div>
                  <span className="text-mutedText block">Floor / Elevation:</span>
                  <span className="font-semibold text-charcoal">{property.floor || 'G+2 Floors'}</span>
                </div>
                <div>
                  <span className="text-mutedText block">Parking Slots:</span>
                  <span className="font-semibold text-charcoal">{property.parkingSlots || '2 Covered'}</span>
                </div>
              </div>
            </div>

            {/* Amenities & Features */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-sage/60 shadow-soft">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-gold" />
                <h2 className="font-serif text-2xl font-bold text-charcoal">
                  Amenities & Luxury Inclusions
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {property.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-ivory/60 border border-sage/50 text-xs sm:text-sm font-medium text-charcoal"
                  >
                    <div className="w-6 h-6 rounded-lg bg-forest text-gold flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location & Map Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-sage/60 shadow-soft space-y-4">
              <h2 className="font-serif text-2xl font-bold text-charcoal">
                Neighborhood & Location
              </h2>
              <p className="text-xs sm:text-sm text-mutedText">
                Situated in prime {property.locality}, {property.city}. Within walking distance to premier private clubs, international schools, and metro transit links.
              </p>

              {/* Styled Mock Map Canvas */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/8] bg-sage-light border border-sage flex items-center justify-center group">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
                  alt="Locality Map"
                  className="w-full h-full object-cover filter saturate-50 brightness-95 opacity-80"
                />
                <div className="absolute inset-0 bg-forest/20 backdrop-blur-[1px]" />
                <div className="relative z-10 flex flex-col items-center p-4 bg-white/95 rounded-2xl shadow-elevated border border-sage max-w-sm text-center">
                  <div className="w-10 h-10 rounded-full bg-forest text-gold flex items-center justify-center mb-2 animate-bounce">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif text-sm font-bold text-charcoal">
                    {property.location}
                  </h4>
                  <p className="text-[11px] text-mutedText mt-0.5">
                    Precise GPS coordinates released upon verified appointment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Agent Card & Direct Inquiry Form */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Agent Profile Widget */}
            {agent && (
              <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark block mb-3">
                  Designated Advisory Consultant
                </span>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-forest/20 shadow-sm"
                  />
                  <div>
                    <Link to={`/agents/${agent.id}`} className="hover:text-forest transition-colors">
                      <h3 className="font-serif text-lg font-bold text-charcoal">
                        {agent.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-gold-dark font-medium">{agent.agency}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] text-mutedText mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                      <span>{agent.experienceYears} Years Market Experience</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-charcoal/80 pt-3 border-t border-sage/40 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-forest" />
                    <span>{agent.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-forest" />
                    <span>{agent.email}</span>
                  </div>
                </div>

                <Link to={`/agents/${agent.id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Agent's Full Portfolio ({agent.propertyCount} listings)
                  </Button>
                </Link>
              </div>
            )}

            {/* Inquiry Form */}
            <div id="inquiry-form-section" className="bg-white rounded-2xl p-6 border border-sage/60 shadow-soft">
              <div className="mb-4">
                <h3 className="font-serif text-xl font-bold text-charcoal">
                  Direct Private Inquiry
                </h3>
                <p className="text-xs text-mutedText mt-1">
                  Connect with the designated advisor for verified floor plans & scheduled walk-throughs.
                </p>
              </div>

              <PropertyInquiryForm
                propertyTitle={property.title}
                agentName={agent?.name || property.agentName}
                propertyId={property.id}
                advisorUid={property.createdByUid || property.agentId || agent?.id || ''}
              />
            </div>
          </div>
        </div>

        {/* Related Properties Carousel/Grid */}
        {relatedProperties.length > 0 && (
          <div className="mt-20 pt-12 border-t border-sage/60">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block mb-1">
                  Similar Opportunities
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
                  Related Residencies You May Like
                </h2>
              </div>
              <Link to="/properties">
                <Button variant="secondary" size="sm">
                  View Full Registry
                </Button>
              </Link>
            </div>

            <PropertyGrid properties={relatedProperties} columns={3} />
          </div>
        )}
      </div>

      {/* Mobile Sticky Inquiry Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-sage p-3 shadow-elevated">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <span className="text-[10px] text-mutedText block font-medium">Offered At</span>
            <span className="font-serif text-lg font-bold text-forest">
              {formatCurrency(property.price, true)}
            </span>
          </div>
          <a href="#inquiry-form-section">
            <Button variant="primary" size="sm" className="shadow-sm">
              Inquire Now
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
