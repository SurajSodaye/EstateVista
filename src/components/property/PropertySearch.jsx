import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Home, IndianRupee } from 'lucide-react';
import Button from '../common/Button';

export default function PropertySearch({ initialValues = {}, className = '' }) {
  const navigate = useNavigate();
  const [listingType, setListingType] = useState(initialValues.listingType || 'Buy');
  const [city, setCity] = useState(initialValues.city || 'All');
  const [propertyType, setPropertyType] = useState(initialValues.propertyType || 'All');
  const [budget, setBudget] = useState(initialValues.budget || 'All');

  const cities = ['All', 'Mumbai', 'Bengaluru', 'Delhi NCR', 'Goa', 'Pune', 'Hyderabad'];
  const propertyTypes = ['All', 'Apartment', 'Villa', 'Independent House', 'Plot', 'Commercial'];

  const budgetOptionsBuy = [
    { value: 'All', label: 'Any Budget' },
    { value: '0-10000000', label: 'Under ₹1 Cr' },
    { value: '10000000-50000000', label: '₹1 Cr – ₹5 Cr' },
    { value: '50000000-150000000', label: '₹5 Cr – ₹15 Cr' },
    { value: '150000000-500000000', label: '₹15 Cr+' },
  ];

  const budgetOptionsRent = [
    { value: 'All', label: 'Any Rent' },
    { value: '0-100000', label: 'Under ₹1 L/mo' },
    { value: '100000-300000', label: '₹1 L – ₹3 L/mo' },
    { value: '300000-600000', label: '₹3 L – ₹6 L/mo' },
    { value: '600000-2000000', label: '₹6 L+/mo' },
  ];

  const currentBudgetOptions = listingType === 'Rent' ? budgetOptionsRent : budgetOptionsBuy;

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (listingType) params.set('listingType', listingType);
    if (city && city !== 'All') params.set('city', city);
    if (propertyType && propertyType !== 'All') params.set('propertyType', propertyType);

    if (budget && budget !== 'All') {
      const [min, max] = budget.split('-');
      if (min) params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
    }

    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Listing Type Toggle Tabs */}
      <div className="flex items-center gap-1 mb-2 ml-2">
        <button
          type="button"
          onClick={() => {
            setListingType('Buy');
            setBudget('All');
          }}
          className={`px-6 py-2.5 rounded-t-xl text-sm font-semibold transition-all duration-200 ${
            listingType === 'Buy'
              ? 'bg-white text-forest shadow-sm'
              : 'bg-white/40 text-white/90 hover:bg-white/60 hover:text-forest'
          }`}
        >
          Buy Property
        </button>
        <button
          type="button"
          onClick={() => {
            setListingType('Rent');
            setBudget('All');
          }}
          className={`px-6 py-2.5 rounded-t-xl text-sm font-semibold transition-all duration-200 ${
            listingType === 'Rent'
              ? 'bg-white text-forest shadow-sm'
              : 'bg-white/40 text-white/90 hover:bg-white/60 hover:text-forest'
          }`}
        >
          Rent Property
        </button>
      </div>

      {/* Main Search Panel Box */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl rounded-tl-none p-4 sm:p-5 shadow-elevated border border-sage/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
      >
        {/* City selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/70 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-forest" />
            <span>Location</span>
          </label>
          <div className="relative">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-ivory/60 hover:bg-ivory border border-sage rounded-xl px-3.5 py-2.5 text-sm text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer appearance-none transition-colors"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Prime Cities' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Property Type selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/70 mb-1.5 flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-forest" />
            <span>Property Type</span>
          </label>
          <div className="relative">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full bg-ivory/60 hover:bg-ivory border border-sage rounded-xl px-3.5 py-2.5 text-sm text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer appearance-none transition-colors"
            >
              {propertyTypes.map((pt) => (
                <option key={pt} value={pt}>
                  {pt === 'All' ? 'All Property Types' : pt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/70 mb-1.5 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-forest" />
            <span>Budget Range</span>
          </label>
          <div className="relative">
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-ivory/60 hover:bg-ivory border border-sage rounded-xl px-3.5 py-2.5 text-sm text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer appearance-none transition-colors"
            >
              {currentBudgetOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Submit Button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Search}
            className="w-full py-2.5 h-[42px] font-semibold tracking-wide"
          >
            Search Properties
          </Button>
        </div>
      </form>
    </div>
  );
}
