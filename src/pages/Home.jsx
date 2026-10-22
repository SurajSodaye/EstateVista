import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Search,
  Compass,
  FileCheck,
  Building,
  Sparkles,
  Users,
  Award,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Eye,
  MessageSquare
} from 'lucide-react';
import PropertySearch from '../components/property/PropertySearch';
import PropertyGrid from '../components/property/PropertyGrid';
import Button from '../components/common/Button';
import { getFeaturedProperties, getLatestProperties, getPropertyCountByLocation, getPropertyCountByType } from '../services/propertyService';
import { PROPERTY_TYPES, POPULAR_LOCATIONS } from '../data/properties';

export default function Home() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [latestProperties, setLatestProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [featured, latest] = await Promise.all([
          getFeaturedProperties(),
          getLatestProperties(4),
        ]);
        setFeaturedProperties(featured);
        setLatestProperties(latest);
      } catch (err) {
        console.error('Failed to load home properties', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-20 sm:space-y-28 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[640px] lg:min-h-[720px] flex items-center justify-center pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Image with Dark & Warm Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=85"
            alt="EstateVista Luxury Architecture"
            className="w-full h-full object-cover object-center filter brightness-[0.85]"
          />
          {/* Subtle multi-layer gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/80 via-forest-dark/50 to-charcoal-dark/90" />
          <div className="absolute inset-0 bg-forest/20 mix-blend-multiply" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="tracking-wide">Premier Indian Real Estate Registry</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.15] max-w-4xl text-shadow-md mb-6">
            Find a Place You'll Love <br className="hidden sm:inline" />
            <span className="text-gold italic font-normal">to Call Home</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base lg:text-lg text-sage-light/90 max-w-2xl font-light leading-relaxed mb-10 text-shadow-sm">
            Explore curated high-rise sea-facing penthouses, private biophilic villas, and prime plots across India's most sought-after urban enclaves.
          </p>

          {/* Property Search Panel */}
          <PropertySearch className="mt-2" />

          {/* Key Metric Highlights */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 text-white/90 border-t border-white/15 pt-8 w-full max-w-3xl">
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-gold">100%</p>
              <p className="text-xs text-sage/80 mt-1 uppercase tracking-wider font-medium">Curated Assets</p>
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-gold">₹15,000 +</p>
              <p className="text-xs text-sage/80 mt-1 uppercase tracking-wider font-medium">Registry Value</p>
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-gold">6 Metro</p>
              <p className="text-xs text-sage/80 mt-1 uppercase tracking-wider font-medium">Prime Enclaves</p>
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-gold">Zero</p>
              <p className="text-xs text-sage/80 mt-1 uppercase tracking-wider font-medium">Spam Listings</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EXPLORE BY PROPERTY TYPE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block mb-2">
              Categorized Discovery
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal">
              Explore by Property Type
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-mutedText max-w-md mt-2 md:mt-0">
            Tailor your search by architectural configuration, from sprawling gated villas to Grade-A corporate towers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {PROPERTY_TYPES.map((type) => {
            const count = getPropertyCountByType(type.id);
            return (
              <Link
                key={type.id}
                to={`/properties?propertyType=${encodeURIComponent(type.id)}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-soft border border-sage/60 hover:shadow-card transition-all duration-300 flex flex-col justify-end p-5 hover:-translate-y-1.5"
              >
                <img
                  src={type.image}
                  alt={type.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/90 via-charcoal/40 to-transparent" />
                <div className="relative z-10 text-white">
                  <span className="inline-block text-[11px] font-semibold text-gold bg-forest/80 backdrop-blur-sm px-2.5 py-0.5 rounded-md mb-2">
                    {count} {count === 1 ? 'Listing' : 'Listings'}
                  </span>
                  <h3 className="font-serif text-lg font-bold leading-snug group-hover:text-gold transition-colors">
                    {type.name}
                  </h3>
                  <p className="text-[11px] text-sage-light/80 line-clamp-1 mt-1 font-light">
                    {type.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED PROPERTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-gold-dark text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked Portfolios</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal">
              Featured Luxury Residencies
            </h2>
          </div>
          <Link to="/properties">
            <Button variant="secondary" icon={ArrowRight} iconPosition="right">
              View All Properties
            </Button>
          </Link>
        </div>

        <PropertyGrid properties={featuredProperties} isLoading={isLoading} columns={3} />
      </section>

      {/* 4. DISCOVER POPULAR LOCATIONS */}
      <section className="bg-ivory-dark/40 py-16 sm:py-20 border-y border-sage/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block mb-2">
              Prime Destinations
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal mb-3">
              Discover Popular Locations
            </h2>
            <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
              Explore premier residential micro-markets across India's vibrant financial, technological, and coastal capitals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {POPULAR_LOCATIONS.map((loc) => {
              const count = getPropertyCountByLocation(loc.city);
              return (
                <Link
                  key={loc.city}
                  to={`/properties?city=${encodeURIComponent(loc.city)}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[16/10] shadow-soft border border-sage/60 hover:shadow-card transition-all duration-300 p-6 flex flex-col justify-between hover:-translate-y-1"
                >
                  <img
                    src={loc.image}
                    alt={loc.city}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/95 via-forest-dark/40 to-transparent" />
                  <div className="relative z-10 flex justify-end">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-forest shadow-sm">
                      {count} {count === 1 ? 'Property' : 'Properties'}
                    </span>
                  </div>
                  <div className="relative z-10 text-white">
                    <p className="text-xs text-gold font-medium mb-1">{loc.tagline}</p>
                    <h3 className="font-serif text-2xl font-bold group-hover:text-gold transition-colors">
                      {loc.city}
                    </h3>
                    <p className="text-xs text-sage/80 mt-1 font-light">
                      Key localities: {loc.popularLocalities.join(', ')}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US (PLANNED PLATFORM ARCHITECTURE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block mb-2">
            The EstateVista Standard
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal mb-3">
            Why Discerning Clients Choose Us
          </h2>
          <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
            Built from the ground up for transparent discovery, high-fidelity architectural previews, and direct advisory connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-soft hover:shadow-card transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-sage-light text-forest flex items-center justify-center mb-5 border border-sage">
              <FileCheck className="w-6 h-6 text-forest" />
            </div>
            <h3 className="font-serif text-lg font-bold text-charcoal mb-2">
              Verified Listing Workflow
            </h3>
            <p className="text-xs text-mutedText leading-relaxed">
              Our planned platform architecture requires strict title verification and developer sanction validation before any property goes live.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-soft hover:shadow-card transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-sage-light text-forest flex items-center justify-center mb-5 border border-sage">
              <Compass className="w-6 h-6 text-forest" />
            </div>
            <h3 className="font-serif text-lg font-bold text-charcoal mb-2">
              Intuitive Discovery
            </h3>
            <p className="text-xs text-mutedText leading-relaxed">
              Effortlessly filter by carpet area, floor height, vastu orientation, and curated lifestyle amenities across premier neighborhoods.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-soft hover:shadow-card transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-sage-light text-forest flex items-center justify-center mb-5 border border-sage">
              <Award className="w-6 h-6 text-forest" />
            </div>
            <h3 className="font-serif text-lg font-bold text-charcoal mb-2">
              Rich Architectural Data
            </h3>
            <p className="text-xs text-mutedText leading-relaxed">
              Every listing includes high-resolution photography, floorplan dimensions, maintenance disclosures, and locality advantages.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-soft hover:shadow-card transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-sage-light text-forest flex items-center justify-center mb-5 border border-sage">
              <MessageSquare className="w-6 h-6 text-forest" />
            </div>
            <h3 className="font-serif text-lg font-bold text-charcoal mb-2">
              Direct Advisory Inquiries
            </h3>
            <p className="text-xs text-mutedText leading-relaxed">
              Connect directly with designated property advisors and certified luxury consultants without third-party telemarketing middle-men.
            </p>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="bg-forest text-white py-16 sm:py-24 rounded-3xl mx-4 sm:mx-6 lg:mx-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#DCE8DF_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gold block mb-2">
            Seamless Three-Step Journey
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold mb-4">
            How EstateVista Works
          </h2>
          <p className="text-xs sm:text-sm text-sage/80 max-w-xl mx-auto mb-14 leading-relaxed">
            From initial exploration to on-site private walk-throughs, we streamline every step of finding your dream home.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Step 1 */}
            <div className="bg-forest-light/60 border border-forest-light rounded-2xl p-6 relative">
              <span className="text-4xl font-serif font-bold text-gold/30 absolute top-4 right-4">
                01
              </span>
              <div className="w-10 h-10 rounded-xl bg-gold text-forest flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white mb-2">
                1. Search Properties
              </h3>
              <p className="text-xs text-sage/80 leading-relaxed">
                Filter by prime localities, price brackets, carpet areas, and configurations. Browse curated apartments, townhouses, and plots.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-forest-light/60 border border-forest-light rounded-2xl p-6 relative">
              <span className="text-4xl font-serif font-bold text-gold/30 absolute top-4 right-4">
                02
              </span>
              <div className="w-10 h-10 rounded-xl bg-gold text-forest flex items-center justify-center mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white mb-2">
                2. Explore Details
              </h3>
              <p className="text-xs text-sage/80 leading-relaxed">
                Review verified dimensions, lifestyle amenities, surrounding civic infrastructure, high-definition galleries, and pricing breakdown.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-forest-light/60 border border-forest-light rounded-2xl p-6 relative">
              <span className="text-4xl font-serif font-bold text-gold/30 absolute top-4 right-4">
                03
              </span>
              <div className="w-10 h-10 rounded-xl bg-gold text-forest flex items-center justify-center mb-4">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white mb-2">
                3. Connect & Inquire
              </h3>
              <p className="text-xs text-sage/80 leading-relaxed">
                Submit an inquiry directly to the accredited advisor to schedule a confidential physical walk-through and receive title documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LATEST PROPERTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block mb-2">
              Fresh Additions
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal">
              Latest Additions to Registry
            </h2>
          </div>
          <Link to="/properties?sortBy=newest">
            <Button variant="outline" size="sm" icon={ChevronRight} iconPosition="right">
              Explore All New
            </Button>
          </Link>
        </div>

        <PropertyGrid properties={latestProperties} isLoading={isLoading} columns={4} />
      </section>

      {/* 8. CALL TO ACTION SECTION (FOR OWNERS & AGENTS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-forest-dark via-forest to-forest-light rounded-3xl p-8 sm:p-12 lg:p-16 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-elevated relative overflow-hidden">
          <div className="space-y-4 max-w-xl text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>Partner With EstateVista</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold leading-tight">
              Are You a Property Owner or Accredited Agent?
            </h2>
            <p className="text-xs sm:text-sm text-sage/80 leading-relaxed">
              In our upcoming Phase 2 release, we are opening direct property onboarding and the agent portfolio portal with cloud media uploads and verified inquiry CRM.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 z-10 shrink-0 w-full lg:w-auto">
            <Link to="/contact" className="w-full sm:w-auto">
              <Button variant="gold" size="lg" className="w-full sm:w-auto">
                Inquire for Early Access
              </Button>
            </Link>
            <Link to="/about" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                Learn About Platform
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
