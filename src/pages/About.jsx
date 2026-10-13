import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Eye,
  ShieldCheck,
  CheckCircle,
  Building2,
  Sparkles,
  ArrowRight,
  Target,
  Palette,
  HeartHandshake
} from 'lucide-react';
import Button from '../components/common/Button';

export default function About() {
  return (
    <div className="pb-20 space-y-20">
      {/* Hero Header */}
      <section className="relative bg-forest text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#DCE8DF_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-gold text-xs font-semibold border border-white/15">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Overview & Philosophy</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Curating India's Most Refined <br className="hidden sm:inline" />
            <span className="text-gold italic font-normal">Living Experiences</span>
          </h1>

          <p className="text-sm sm:text-base text-sage/90 max-w-2xl mx-auto font-light leading-relaxed">
            EstateVista was conceived to bring architectural clarity, verified spatial data, and calm digital discovery to the luxury residential and commercial property landscape.
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block">
              Core Mission
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal leading-tight">
              A Platform Built on Architectural Integrity & Discovery
            </h2>
            <p className="text-sm text-charcoal/80 leading-relaxed font-light">
              Traditional real estate portals are often overwhelmed with duplicate listings, speculative prices, and misleading photographs. EstateVista is designed with a singular intention: to curate authentic, aesthetically distinguished properties and present them with museum-grade precision.
            </p>
            <p className="text-sm text-charcoal/80 leading-relaxed font-light">
              We focus on the narrative of each residence — highlighting biophilic courtyards, verified carpet dimensions, natural sunlight paths, and bespoke architectural materials.
            </p>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-sage/60 shadow-soft">
                <Target className="w-5 h-5 text-forest mb-2" />
                <h4 className="font-serif text-base font-bold text-charcoal mb-1">
                  Our Focus
                </h4>
                <p className="text-xs text-mutedText leading-relaxed">
                  High-caliber residences, heritage estates, and Grade-A workspaces across premier metros.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-sage/60 shadow-soft">
                <Palette className="w-5 h-5 text-forest mb-2" />
                <h4 className="font-serif text-base font-bold text-charcoal mb-1">
                  Design First
                </h4>
                <p className="text-xs text-mutedText leading-relaxed">
                  Clean whitespace, serene typography, and high-fidelity visual representations.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-card border border-sage/60">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                alt="Architectural Estate"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl border border-sage shadow-elevated max-w-xs hidden sm:block">
              <p className="font-serif text-2xl font-bold text-forest">₹15,000+ Cr</p>
              <p className="text-xs text-mutedText mt-0.5">
                Staged luxury residential portfolio volume across prime micro-markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Principles */}
      <section className="bg-ivory-dark/40 py-16 sm:py-20 border-y border-sage/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block mb-2">
              Our Foundations
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mb-3">
              User Experience Principles
            </h2>
            <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
              Every interface interaction on EstateVista is measured against three fundamental commitments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-sage/60 shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-sage-light text-forest flex items-center justify-center mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-3">
                1. Noise Reduction
              </h3>
              <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
                Zero spam calls, zero duplicate listings, and zero algorithmic pop-ups. We respect your attention and provide clean, unobstructed property specifications.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-sage/60 shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-sage-light text-forest flex items-center justify-center mb-6">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-3">
                2. Visual Fidelity
              </h3>
              <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
                High-resolution architectural photography, verified floor dimensions, orientation indicators, and clear distinction between carpet and built-up area.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-sage/60 shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-sage-light text-forest flex items-center justify-center mb-6">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-3">
                3. Direct Stewardship
              </h3>
              <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
                Inquiries are channeled directly to verified property custodians and accredited regional advisors, ensuring knowledgeable, courteous follow-through.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Long-term Vision CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal">
          Looking Towards Phase 2 & Beyond
        </h2>
        <p className="text-sm text-mutedText leading-relaxed max-w-2xl mx-auto font-light">
          EstateVista is currently launching its public frontend discovery experience. In our next phase, Firebase authentication, real-time Firestore synchronization, and secure agent portfolio management will be integrated seamlessly.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link to="/properties">
            <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
              Explore Active Listings
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" size="lg">
              Contact Concierge
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
