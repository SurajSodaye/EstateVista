import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize2, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../common/Badge';
import { useSavedProperties } from '../../context/SavedPropertiesContext';

export default function PropertyCard({ property }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSaved, toggleSave } = useSavedProperties();
  const isFavorite = isSaved(property.id);

  const resolvePropertyImage = (prop) => {
    if (prop?.imageUrls && prop.imageUrls.length > 0 && prop.imageUrls[0]) {
      return prop.imageUrls[0];
    }
    if (prop?.images && prop.images.length > 0 && prop.images[0]) {
      return prop.images[0];
    }
    if (prop?.featuredImage) {
      return prop.featuredImage;
    }
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';
  };

  const [imgSrc, setImgSrc] = useState(() => resolvePropertyImage(property));

  useEffect(() => {
    setImgSrc(resolvePropertyImage(property));
  }, [property?.imageUrls, property?.images, property?.featuredImage]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleSave(property.id, property.title);
    if (res?.action === 'require_auth') {
      navigate('/login', {
        state: { from: location.pathname + location.search },
      });
    }
  };

  const handleImageError = () => {
    setImgSrc('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80');
  };

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-sage/60 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
      {/* Media Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-sage-light">
        <img
          src={imgSrc}
          alt={property.title}
          onError={handleImageError}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Gradient Overlay for badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={property.listingType === 'Rent' ? 'rent' : 'sale'} size="sm">
              For {property.listingType}
            </Badge>
            {property.isFeatured && (
              <Badge variant="featured" size="sm">
                Featured
              </Badge>
            )}
          </div>

          {/* Interactive Favorite Button */}
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={isFavorite ? 'Remove from saved' : 'Save property'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-sm ${
              isFavorite
                ? 'bg-red-500 text-white scale-110'
                : 'bg-white/80 text-charcoal hover:bg-white hover:text-red-500 hover:scale-105'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Property Type Badge bottom left */}
        <div className="absolute bottom-3 left-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-forest shadow-sm">
            {property.propertyType}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          {/* Price Header */}
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold text-forest">
                {formatCurrency(property.price, true)}
              </span>
              {property.pricePeriod && (
                <span className="text-xs font-medium text-mutedText">
                  {property.pricePeriod}
                </span>
              )}
            </div>
            <span className="text-xs text-mutedText font-medium bg-ivory px-2 py-0.5 rounded border border-sage/50">
              {formatCurrency(property.price)}
            </span>
          </div>

          {/* Title */}
          <Link to={`/properties/${property.id}`} className="block group/title">
            <h3 className="font-serif text-lg font-semibold text-charcoal line-clamp-1 group-hover/title:text-forest transition-colors mb-1.5">
              {property.title}
            </h3>
          </Link>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-mutedText text-xs mb-4">
            <MapPin className="w-3.5 h-3.5 text-forest/70 shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>

          {/* Specs Strip */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-sage/40 text-charcoal text-xs mb-4 bg-ivory/50 rounded-xl px-2">
            {property.bedrooms > 0 ? (
              <div className="flex items-center gap-1.5 justify-center">
                <Bed className="w-4 h-4 text-forest/80 shrink-0" />
                <span className="font-semibold">{property.bedrooms}</span>
                <span className="text-mutedText text-[11px]">Beds</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 justify-center">
                <span className="font-medium text-mutedText text-[11px]">— Commercial</span>
              </div>
            )}

            {property.bathrooms > 0 ? (
              <div className="flex items-center gap-1.5 justify-center">
                <Bath className="w-4 h-4 text-forest/80 shrink-0" />
                <span className="font-semibold">{property.bathrooms}</span>
                <span className="text-mutedText text-[11px]">Baths</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 justify-center">
                <span className="font-medium text-mutedText text-[11px]">— Plot</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 justify-center">
              <Maximize2 className="w-3.5 h-3.5 text-forest/80 shrink-0" />
              <span className="font-semibold">{new Intl.NumberFormat('en-IN').format(property.areaSqFt || 0)}</span>
              <span className="text-mutedText text-[11px]">sqft</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-xs text-mutedText font-medium">
            {property.status || 'Verified Listing'}
          </span>
          <Link
            to={`/properties/${property.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-gold transition-colors py-1 pl-2"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
