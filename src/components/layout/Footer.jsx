import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, Instagram, Linkedin, Twitter, Facebook, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-forest text-white border-t border-forest-light pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-forest-light/60">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center text-forest">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-white leading-tight">
                  EstateVista
                </span>
                <span className="text-[10px] uppercase tracking-widest text-sage font-semibold">
                  Luxury Living Registry
                </span>
              </div>
            </Link>
            <p className="text-sage/80 text-sm leading-relaxed max-w-sm">
              Discover verified architectural masterpieces, high-rise penthouses, and tranquil coastal estates across premier Indian locations. Curated for discerning buyers and investors.
            </p>
            <div className="pt-2 flex items-center space-x-3 text-sage">
              <a
                href="#social"
                aria-label="Instagram"
                onClick={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-lg bg-forest-light/70 hover:bg-gold hover:text-forest flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#social"
                aria-label="LinkedIn"
                onClick={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-lg bg-forest-light/70 hover:bg-gold hover:text-forest flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#social"
                aria-label="Twitter"
                onClick={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-lg bg-forest-light/70 hover:bg-gold hover:text-forest flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#social"
                aria-label="Facebook"
                onClick={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-lg bg-forest-light/70 hover:bg-gold hover:text-forest flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-sage/80">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/properties?listingType=Buy" className="hover:text-white transition-colors">
                  Properties for Sale
                </Link>
              </li>
              <li>
                <Link to="/properties?listingType=Rent" className="hover:text-white transition-colors">
                  Properties for Rent
                </Link>
              </li>
              <li>
                <Link to="/saved-properties" className="hover:text-white transition-colors">
                  Saved Residences
                </Link>
              </li>
              <li>
                <Link to="/agents" className="hover:text-white transition-colors">
                  Advisory Agents
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About EstateVista
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Property Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold">
              Property Types
            </h4>
            <ul className="space-y-2 text-sm text-sage/80">
              <li>
                <Link to="/properties?propertyType=Apartment" className="hover:text-white transition-colors">
                  Luxury Apartments
                </Link>
              </li>
              <li>
                <Link to="/properties?propertyType=Villa" className="hover:text-white transition-colors">
                  Private Villas
                </Link>
              </li>
              <li>
                <Link to="/properties?propertyType=Independent%20House" className="hover:text-white transition-colors">
                  Independent Houses
                </Link>
              </li>
              <li>
                <Link to="/properties?propertyType=Plot" className="hover:text-white transition-colors">
                  Prime Land & Plots
                </Link>
              </li>
              <li>
                <Link to="/properties?propertyType=Commercial" className="hover:text-white transition-colors">
                  Grade-A Commercial
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information Placeholders */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold">
              Inquiries & Office
            </h4>
            <ul className="space-y-2.5 text-sm text-sage/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>Level 14, Crest Tower, BKC, Mumbai — 400051</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <span>+91 (022) 6780 9000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <span>concierge@estatevista.demo</span>
              </li>
            </ul>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-gold/90 bg-forest-light px-3 py-1.5 rounded-lg border border-gold/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Demo Registry Live</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-sage/60 gap-4">
          <p>© {currentYear} EstateVista Inc. All rights reserved. Public demonstration frontend.</p>
          <div className="flex items-center space-x-6">
            <Link to="/about" className="hover:text-sage transition-colors">
              Privacy Policy
            </Link>
            <Link to="/about" className="hover:text-sage transition-colors">
              Terms of Service
            </Link>
            <Link to="/about" className="hover:text-sage transition-colors">
              RERA Compliance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
