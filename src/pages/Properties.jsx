import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, RefreshCw, X, Sparkles } from 'lucide-react';
import PropertyFilters from '../components/property/PropertyFilters';
import PropertyGrid from '../components/property/PropertyGrid';
import Button from '../components/common/Button';
import { searchProperties } from '../services/propertyService';
import { formatCurrency } from '../utils/formatCurrency';

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL search parameters
  const [filters, setFilters] = useState({
    query: searchParams.get('query') || '',
    city: searchParams.get('city') || 'All',
    listingType: searchParams.get('listingType') || 'All',
    propertyType: searchParams.get('propertyType') || 'All',
    bedrooms: searchParams.get('bedrooms') || 'All',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : Infinity,
    sortBy: searchParams.get('sortBy') || 'newest',
  });

  const [properties, setProperties] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  // Sync state if URL searchParams changes externally
  useEffect(() => {
    setFilters({
      query: searchParams.get('query') || '',
      city: searchParams.get('city') || 'All',
      listingType: searchParams.get('listingType') || 'All',
      propertyType: searchParams.get('propertyType') || 'All',
      bedrooms: searchParams.get('bedrooms') || 'All',
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : Infinity,
      sortBy: searchParams.get('sortBy') || 'newest',
    });
  }, [searchParams]);

  // Execute search whenever filters change
  useEffect(() => {
    let isCancelled = false;
    async function fetchFilteredProperties() {
      setIsLoading(true);
      try {
        const result = await searchProperties(filters);
        if (!isCancelled) {
          setProperties(result.properties);
          setTotalCount(result.totalCount);
          setVisibleCount(6); // reset load more on filter change
        }
      } catch (err) {
        console.error('Failed to filter properties', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchFilteredProperties();

    return () => {
      isCancelled = true;
    };
  }, [filters]);

  // Handler for individual filter updates - syncs to URL params
  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);

    const newParams = new URLSearchParams();
    if (updated.query) newParams.set('query', updated.query);
    if (updated.city && updated.city !== 'All') newParams.set('city', updated.city);
    if (updated.listingType && updated.listingType !== 'All') newParams.set('listingType', updated.listingType);
    if (updated.propertyType && updated.propertyType !== 'All') newParams.set('propertyType', updated.propertyType);
    if (updated.bedrooms && updated.bedrooms !== 'All') newParams.set('bedrooms', updated.bedrooms);
    if (updated.minPrice > 0) newParams.set('minPrice', updated.minPrice.toString());
    if (updated.maxPrice && updated.maxPrice !== Infinity) newParams.set('maxPrice', updated.maxPrice.toString());
    if (updated.sortBy && updated.sortBy !== 'newest') newParams.set('sortBy', updated.sortBy);

    setSearchParams(newParams, { replace: true });
  };

  const handleResetFilters = () => {
    const cleanFilters = {
      query: '',
      city: 'All',
      listingType: 'All',
      propertyType: 'All',
      bedrooms: 'All',
      minPrice: 0,
      maxPrice: Infinity,
      sortBy: 'newest',
    };
    setFilters(cleanFilters);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const activeChips = [];
  if (filters.listingType && filters.listingType !== 'All') {
    activeChips.push({ key: 'listingType', label: `For ${filters.listingType}` });
  }
  if (filters.city && filters.city !== 'All') {
    activeChips.push({ key: 'city', label: filters.city });
  }
  if (filters.propertyType && filters.propertyType !== 'All') {
    activeChips.push({ key: 'propertyType', label: filters.propertyType });
  }
  if (filters.bedrooms && filters.bedrooms !== 'All') {
    activeChips.push({ key: 'bedrooms', label: `${filters.bedrooms} BHK` });
  }
  if (filters.query) {
    activeChips.push({ key: 'query', label: `"${filters.query}"` });
  }
  if (filters.minPrice > 0 || (filters.maxPrice && filters.maxPrice !== Infinity)) {
    const minStr = filters.minPrice > 0 ? formatCurrency(filters.minPrice, true) : '₹0';
    const maxStr = filters.maxPrice && filters.maxPrice !== Infinity ? formatCurrency(filters.maxPrice, true) : 'No Max';
    activeChips.push({ key: 'priceRange', label: `${minStr} – ${maxStr}` });
  }

  const handleChipRemove = (key) => {
    if (key === 'priceRange') {
      const updated = { ...filters, minPrice: 0, maxPrice: Infinity };
      setFilters(updated);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('minPrice');
      newParams.delete('maxPrice');
      setSearchParams(newParams, { replace: true });
    } else if (key === 'query') {
      handleFilterChange('query', '');
    } else {
      handleFilterChange(key, 'All');
    }
  };

  const displayedProperties = properties.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8 pb-6 border-b border-sage/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-dark mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Property Registry</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal">
              Explore Available Properties
            </h1>
            <p className="text-xs sm:text-sm text-mutedText mt-1.5">
              Showing <span className="font-semibold text-forest">{totalCount}</span> luxury residences and commercial assets matching your criteria
            </p>
          </div>

          {/* Sort Selector & Mobile Filter Trigger */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-sage text-charcoal text-xs font-semibold shadow-sm hover:bg-ivory"
            >
              <SlidersHorizontal className="w-4 h-4 text-forest" />
              <span>Filters ({activeChips.length})</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-sage px-3 py-1.5 shadow-sm">
              <ArrowUpDown className="w-4 h-4 text-forest shrink-0" />
              <span className="text-xs text-mutedText hidden sm:inline">Sort:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="bg-transparent text-xs font-semibold text-charcoal focus:outline-none cursor-pointer pr-1"
              >
                <option value="newest">Newest Listed</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="mt-4 pt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-mutedText font-medium">Active filters:</span>
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sage-light text-forest border border-sage"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={() => handleChipRemove(chip.key)}
                  className="hover:text-red-500 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-gold-dark hover:underline font-semibold ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main Layout Grid: Sidebar Filters + Property Cards */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Filters Sidebar (desktop) and Drawer (mobile) */}
        <PropertyFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          totalResults={totalCount}
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />

        {/* Property Grid Results */}
        <div className="flex-grow w-full">
          <PropertyGrid
            properties={displayedProperties}
            isLoading={isLoading}
            onResetFilters={handleResetFilters}
            columns={2} // 2 columns next to 280px sidebar on desktop looks stunning & spacious
          />

          {/* Load More Button if results exceed visible count */}
          {!isLoading && visibleCount < properties.length && (
            <div className="mt-12 text-center">
              <Button
                variant="secondary"
                size="md"
                icon={RefreshCw}
                onClick={() => setVisibleCount((prev) => prev + 4)}
                className="px-8 shadow-sm"
              >
                Load More Properties ({properties.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
