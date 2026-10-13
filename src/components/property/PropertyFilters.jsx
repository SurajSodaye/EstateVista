import React from 'react';
import { Filter, RotateCcw, X, Search } from 'lucide-react';
import Button from '../common/Button';

export default function PropertyFilters({
  filters,
  onChange,
  onReset,
  totalResults,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
}) {
  const cities = ['All', 'Mumbai', 'Bengaluru', 'Delhi NCR', 'Goa', 'Pune', 'Hyderabad'];
  const propertyTypes = ['All', 'Apartment', 'Villa', 'Independent House', 'Plot', 'Commercial'];
  const bedroomOptions = ['All', '1', '2', '3', '4', '5+'];

  const filterContent = (
    <div className="space-y-6">
      {/* Search Input Query */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80 mb-2">
          Keywords or Locality
        </label>
        <div className="relative">
          <input
            type="text"
            value={filters.query || ''}
            onChange={(e) => onChange('query', e.target.value)}
            placeholder="e.g. Bandra, Sea View, Villa..."
            className="w-full bg-white border border-sage rounded-xl pl-9 pr-3 py-2 text-sm text-charcoal placeholder-mutedText/60 focus:outline-none focus:ring-2 focus:ring-forest"
          />
          <Search className="w-4 h-4 text-mutedText absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Listing Purpose (Buy vs Rent) */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80 mb-2">
          Listing Purpose
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-ivory rounded-xl border border-sage/60">
          {['All', 'Buy', 'Rent'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange('listingType', type)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filters.listingType === type
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-charcoal/70 hover:text-forest'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* City / Location */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80 mb-2">
          Location / City
        </label>
        <select
          value={filters.city || 'All'}
          onChange={(e) => onChange('city', e.target.value)}
          className="w-full bg-white border border-sage rounded-xl px-3 py-2 text-sm text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
        >
          {cities.map((city) => (
            <option key={city} value={city}>
              {city === 'All' ? 'All Locations' : city}
            </option>
          ))}
        </select>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80 mb-2">
          Property Type
        </label>
        <select
          value={filters.propertyType || 'All'}
          onChange={(e) => onChange('propertyType', e.target.value)}
          className="w-full bg-white border border-sage rounded-xl px-3 py-2 text-sm text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
        >
          {propertyTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'All' ? 'All Types' : type}
            </option>
          ))}
        </select>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80 mb-2">
          Bedrooms
        </label>
        <div className="flex flex-wrap gap-1.5">
          {bedroomOptions.map((bed) => (
            <button
              key={bed}
              type="button"
              onClick={() => onChange('bedrooms', bed)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                filters.bedrooms === bed
                  ? 'bg-forest text-white border-forest shadow-sm'
                  : 'bg-white text-charcoal/80 border-sage hover:border-forest/50'
              }`}
            >
              {bed === 'All' ? 'Any' : `${bed} BHK`}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/80 mb-2">
          Price Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-mutedText block mb-1">Min (₹)</span>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice || ''}
              onChange={(e) => onChange('minPrice', e.target.value ? Number(e.target.value) : 0)}
              className="w-full bg-white border border-sage rounded-xl px-3 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
          <div>
            <span className="text-[11px] text-mutedText block mb-1">Max (₹)</span>
            <input
              type="number"
              placeholder="No limit"
              value={filters.maxPrice === Infinity ? '' : filters.maxPrice || ''}
              onChange={(e) => onChange('maxPrice', e.target.value ? Number(e.target.value) : Infinity)}
              className="w-full bg-white border border-sage rounded-xl px-3 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
        </div>
      </div>

      {/* Reset Filter Button */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          icon={RotateCcw}
          onClick={onReset}
          className="w-full text-xs"
        >
          Reset All Filters
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Panel */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-soft sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-sage/60 mb-5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-forest" />
              <h3 className="font-serif text-lg font-bold text-forest">Filter Properties</h3>
            </div>
            <span className="text-xs font-semibold bg-sage-light text-forest px-2.5 py-1 rounded-md">
              {totalResults} {totalResults === 1 ? 'result' : 'results'}
            </span>
          </div>

          {filterContent}
        </div>
      </aside>

      {/* Mobile Filter Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10">
            <div className="p-4 border-b border-sage flex items-center justify-between bg-ivory">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-forest" />
                <h3 className="font-serif text-lg font-bold text-forest">Filter Properties</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-charcoal hover:bg-sage/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-grow">{filterContent}</div>

            <div className="p-4 border-t border-sage bg-ivory">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setIsMobileDrawerOpen(false)}
              >
                Show {totalResults} Results
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
