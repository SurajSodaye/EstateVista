import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Heart,
  Building2,
  Sparkles,
  ArrowRight,
  User,
  LogIn,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
  Compass,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import { fetchUserSavedPropertiesDetailed } from '../services/savedPropertiesService';
import PropertyCard from '../components/property/PropertyCard';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import { formatCurrency } from '../utils/formatCurrency';

export default function SavedProperties() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, loading: authLoading } = useAuth();
  const { savedPropertyIds, savedItems, loading: savedContextLoading } = useSavedProperties();

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'price-asc' | 'price-desc'
  const [typeFilter, setTypeFilter] = useState('All');

  /**
   * Fetches full property details for all user's saved property references
   */
  const loadSavedProperties = useCallback(async () => {
    if (!currentUser) {
      setProperties([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const detailed = await fetchUserSavedPropertiesDetailed(currentUser.uid);
      setProperties(detailed);
    } catch (err) {
      console.error('[SavedProperties] Error fetching details:', err);
      setFetchError('Unable to load saved property details. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Initial fetch on mount or when currentUser changes
  useEffect(() => {
    if (!authLoading) {
      loadSavedProperties();
    }
  }, [authLoading, currentUser, loadSavedProperties]);

  // Keep detailed properties synchronized with real-time savedPropertyIds changes:
  // If a property was unsaved from another card or detail view, instantly prune it from the view
  useEffect(() => {
    setProperties((prev) =>
      prev.filter((p) => savedPropertyIds.has(String(p.id)))
    );
  }, [savedPropertyIds]);

  // If a new item was saved elsewhere and isn't in detailed properties yet, re-fetch
  useEffect(() => {
    if (!currentUser || isLoading) return;
    const existingIds = new Set(properties.map((p) => String(p.id)));
    const hasNewItem = Array.from(savedPropertyIds).some((id) => !existingIds.has(String(id)));
    if (hasNewItem) {
      loadSavedProperties();
    }
  }, [savedPropertyIds, properties, currentUser, isLoading, loadSavedProperties]);

  // Filter & Sort
  const filteredAndSortedProperties = useMemo(() => {
    let list = [...properties];

    if (typeFilter !== 'All') {
      list = list.filter(
        (p) => (p.propertyType || '').toLowerCase() === typeFilter.toLowerCase()
      );
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      // Sort by savedAt descending (most recent first)
      list.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
    }

    return list;
  }, [properties, typeFilter, sortBy]);

  // Portfolio total valuation metric
  const totalPortfolioValue = useMemo(() => {
    return properties.reduce((acc, p) => acc + (p.price || 0), 0);
  }, [properties]);

  // Property types available in current saved collection
  const availableTypes = useMemo(() => {
    const types = new Set(properties.map((p) => p.propertyType).filter(Boolean));
    return ['All', ...Array.from(types)];
  }, [properties]);

  // =========================================================================
  // 1. UNAUTHENTICATED STATE
  // =========================================================================
  if (!authLoading && !currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center bg-white rounded-3xl p-8 sm:p-12 border border-sage/60 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mx-auto mb-6 border border-sage">
            <Heart className="w-8 h-8 text-forest" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sage-light text-forest border border-sage/60 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold-dark" />
            <span>Private Wishlist Registry</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mb-3">
            Sign In to Access Your Saved Residences
          </h1>

          <p className="text-sm sm:text-base text-mutedText leading-relaxed mb-8 max-w-lg mx-auto">
            Your saved properties and private wishlist portfolio are securely tied to your EstateVista account. Sign in or create an account to view and synchronize your saved residences across devices.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={LogIn}
              onClick={() =>
                navigate('/login', {
                  state: { from: location.pathname + location.search },
                })
              }
              className="w-full sm:w-auto shadow-md"
            >
              Sign In to Your Account
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto"
            >
              Create Free Account
            </Button>
          </div>

          <div className="pt-8 mt-8 border-t border-sage/40 flex items-center justify-center gap-2 text-xs text-mutedText">
            <span>Want to browse first?</span>
            <Link
              to="/properties"
              className="text-forest font-semibold hover:underline inline-flex items-center gap-1"
            >
              Explore Property Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. LOADING STATE
  // =========================================================================
  if (authLoading || (isLoading && properties.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="bg-white rounded-3xl p-12 border border-sage/60 shadow-card max-w-xl mx-auto text-center">
          <LoadingState message="Retrieving your private saved residence portfolio from Cloud Firestore..." />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. ERROR STATE
  // =========================================================================
  if (fetchError && properties.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-red-200 shadow-card max-w-lg mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-charcoal mb-2">
            Failed to Synchronize Saved Properties
          </h2>
          <p className="text-xs sm:text-sm text-mutedText mb-6">
            {fetchError}
          </p>
          <Button
            variant="primary"
            size="md"
            icon={RefreshCw}
            onClick={loadSavedProperties}
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. MAIN SAVED PROPERTIES DISPLAY (FOUND & EMPTY STATES)
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-mutedText">
        <Link to="/" className="hover:text-forest transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-forest font-semibold">Saved Properties</span>
      </nav>

      {/* Header Banner & Portfolio Metrics */}
      <div className="mb-8 pb-6 border-b border-sage/60">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-dark mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Collection</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal">
              Saved Residences & Wishlist
            </h1>
            <p className="text-xs sm:text-sm text-mutedText mt-1.5">
              Review, compare, and manage the luxury residences bookmarked in your private account
            </p>
          </div>

          {/* Quick Metrics Bar for Discerning Buyers */}
          {properties.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-2.5 rounded-2xl bg-white border border-sage/60 shadow-soft flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest/5 text-forest flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-current text-red-500" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-mutedText font-bold block">
                    Saved Residences
                  </span>
                  <span className="font-serif text-base font-bold text-forest">
                    {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
                  </span>
                </div>
              </div>

              {totalPortfolioValue > 0 && (
                <div className="px-4 py-2.5 rounded-2xl bg-white border border-sage/60 shadow-soft flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold-dark flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-mutedText font-bold block">
                      Saved Portfolio Value
                    </span>
                    <span className="font-serif text-base font-bold text-charcoal">
                      {formatCurrency(totalPortfolioValue, true)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toolbar: Filter by Type, Sorting & Refresh */}
        {properties.length > 0 && (
          <div className="mt-6 pt-4 border-t border-sage/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {availableTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    typeFilter === t
                      ? 'bg-forest text-white shadow-sm'
                      : 'bg-white text-charcoal/80 border border-sage/60 hover:bg-ivory'
                  }`}
                >
                  {t === 'All' ? `All (${properties.length})` : t}
                </button>
              ))}
            </div>

            {/* Sort Dropdown & Refresh */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <div className="flex items-center gap-2 bg-white rounded-xl border border-sage px-3 py-1.5 shadow-sm">
                <ArrowUpDown className="w-3.5 h-3.5 text-forest shrink-0" />
                <span className="text-xs text-mutedText hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-charcoal focus:outline-none cursor-pointer pr-1"
                >
                  <option value="recent">Recently Saved</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              <button
                type="button"
                onClick={loadSavedProperties}
                title="Refresh saved properties"
                className="p-2 rounded-xl bg-white border border-sage text-charcoal hover:bg-ivory transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-forest" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          EMPTY STATE
         ========================================================================= */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-16 border border-sage/60 shadow-soft text-center max-w-2xl mx-auto my-8">
          <div className="w-20 h-20 rounded-3xl bg-sage-light text-forest flex items-center justify-center mx-auto mb-6 border border-sage">
            <Heart className="w-10 h-10 text-forest/70" />
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mb-2">
            No Saved Properties Yet
          </h2>

          <p className="text-sm text-mutedText leading-relaxed mb-8 max-w-md mx-auto">
            You haven&apos;t added any residences to your saved list yet. Browse our curated catalog of luxury villas, penthouses, and estates and click the heart bookmark to save them for easy reference.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={Compass}
              onClick={() => navigate('/properties')}
              className="w-full sm:w-auto shadow-md"
            >
              Explore Available Properties
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/properties?listingType=Buy')}
              className="w-full sm:w-auto"
            >
              Browse Properties for Sale
            </Button>
          </div>

          {/* Quick Categories */}
          <div className="mt-10 pt-8 border-t border-sage/40">
            <p className="text-xs uppercase tracking-wider text-mutedText font-bold mb-3">
              Popular Collections
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/properties?propertyType=Apartment"
                className="px-3 py-1.5 rounded-lg bg-ivory border border-sage/60 text-xs font-medium text-charcoal hover:text-forest hover:border-forest transition-colors"
              >
                Luxury Apartments
              </Link>
              <Link
                to="/properties?propertyType=Villa"
                className="px-3 py-1.5 rounded-lg bg-ivory border border-sage/60 text-xs font-medium text-charcoal hover:text-forest hover:border-forest transition-colors"
              >
                Private Villas
              </Link>
              <Link
                to="/properties?city=Mumbai"
                className="px-3 py-1.5 rounded-lg bg-ivory border border-sage/60 text-xs font-medium text-charcoal hover:text-forest hover:border-forest transition-colors"
              >
                Mumbai Seafront
              </Link>
              <Link
                to="/properties?city=Bengaluru"
                className="px-3 py-1.5 rounded-lg bg-ivory border border-sage/60 text-xs font-medium text-charcoal hover:text-forest hover:border-forest transition-colors"
              >
                Bengaluru Tech Estates
              </Link>
            </div>
          </div>
        </div>
      ) : filteredAndSortedProperties.length === 0 ? (
        /* Empty after filtering by type */
        <div className="bg-white rounded-2xl p-12 text-center border border-sage/60 max-w-md mx-auto my-12">
          <p className="text-sm font-semibold text-charcoal mb-2">
            No saved residences matching &ldquo;{typeFilter}&rdquo;
          </p>
          <p className="text-xs text-mutedText mb-4">
            Try switching to another property category or view all saved items.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setTypeFilter('All')}>
            Reset Category Filter
          </Button>
        </div>
      ) : (
        /* =========================================================================
            PROPERTIES FOUND: DYNAMIC GRID
           ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredAndSortedProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {/* Footer Concierge Advisory Banner */}
      {properties.length > 0 && (
        <div className="mt-16 bg-gradient-to-r from-forest to-forest-light text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-card">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-serif text-xl sm:text-2xl font-bold">
              Ready to schedule a private viewing?
            </h3>
            <p className="text-xs sm:text-sm text-sage/90">
              Our accredited advisors can arrange bespoke on-site walk-throughs for your saved residences.
            </p>
          </div>
          <Link to="/contact">
            <Button variant="gold" size="md" className="shrink-0 font-bold shadow-md">
              Connect with Concierge
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
