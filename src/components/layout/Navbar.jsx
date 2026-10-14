import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Building2, User, Heart, LogOut, LayoutDashboard } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { currentUser, userProfile, logout, isAdvisor } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Hidden admin shortcut: 5 clicks within 3 seconds
  const logoClicksRef = useRef([]);
  const logoTimerRef = useRef(null);
  const isRedirectingRef = useRef(false);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (logoTimerRef.current) {
        clearTimeout(logoTimerRef.current);
      }
    };
  }, []);

  const handleLogoClick = (e) => {
    // If redirect to admin was already triggered, prevent trailing clicks from navigating to home
    if (isRedirectingRef.current) {
      e.preventDefault();
      return;
    }

    const now = Date.now();
    // Filter out clicks older than 3 seconds (3000ms sliding window)
    const recentClicks = logoClicksRef.current.filter((time) => now - time <= 3000);
    recentClicks.push(now);
    logoClicksRef.current = recentClicks;

    // Reset timer for window expiration cleanup
    if (logoTimerRef.current) {
      clearTimeout(logoTimerRef.current);
    }
    logoTimerRef.current = setTimeout(() => {
      logoClicksRef.current = [];
      logoTimerRef.current = null;
    }, 3000);

    // On 5th click within 3 seconds, redirect to /admin/login
    if (recentClicks.length >= 5) {
      e.preventDefault();
      isRedirectingRef.current = true;
      logoClicksRef.current = [];
      if (logoTimerRef.current) {
        clearTimeout(logoTimerRef.current);
        logoTimerRef.current = null;
      }
      setIsMobileMenuOpen(false);
      navigate('/admin/login');

      // Release lock after 2 seconds
      setTimeout(() => {
        isRedirectingRef.current = false;
      }, 2000);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu whenever location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Buy', path: '/properties?listingType=Buy' },
    { name: 'Rent', path: '/properties?listingType=Rent' },
    { name: 'Agents', path: '/agents' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isLinkActive = (itemPath) => {
    if (itemPath === '/') {
      return location.pathname === '/';
    }
    const [pathPart, queryPart] = itemPath.split('?');
    if (location.pathname === pathPart) {
      if (!queryPart) return true;
      return location.search.includes(queryPart);
    }
    return false;
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'glass-header border-b border-sage/60 shadow-soft py-3'
            : 'bg-ivory/95 backdrop-blur-md border-b border-sage/30 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2.5 group select-none">
              <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-gold shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-tight text-forest leading-tight">
                  EstateVista
                </span>
                <span className="text-[10px] uppercase tracking-widest text-mutedText font-semibold">
                  Luxury Living
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const active = isLinkActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'text-forest font-semibold bg-sage/50'
                        : 'text-charcoal/80 hover:text-forest hover:bg-sage/20'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Auth & Action Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link to={isAdvisor ? '/agent/dashboard' : '/agent/portal'}>
                <Button variant="outline" size="sm" icon={LayoutDashboard} className="text-xs">
                  Advisor Portal
                </Button>
              </Link>
              <Link to="/properties">
                <Button variant="ghost" size="sm" icon={Heart} className="text-charcoal/80">
                  Saved
                </Button>
              </Link>
              <div className="h-4 w-px bg-sage"></div>
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sage-light text-forest border border-sage/60">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold max-w-[130px] truncate">
                      {userProfile?.name || currentUser.displayName || currentUser.email.split('@')[0]}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logout()}
                    className="text-xs"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" icon={User} iconPosition="left">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Join Free
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-forest hover:bg-sage/40 transition-colors focus:outline-none focus:ring-2 focus:ring-forest"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative bg-ivory rounded-t-3xl border-t border-sage shadow-2xl p-6 z-10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-sage/60 mb-4">
              <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 select-none">
                <div className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center text-gold">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-serif text-lg font-bold text-forest">
                  EstateVista
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-charcoal hover:bg-sage/50"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col space-y-1 mb-6">
              {navLinks.map((link) => {
                const active = isLinkActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      active
                        ? 'bg-forest text-white font-semibold'
                        : 'text-charcoal hover:bg-sage/40'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-sage/60 space-y-2.5">
              <Link
                to={isAdvisor ? '/agent/dashboard' : '/agent/portal'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full block"
              >
                <Button variant="secondary" size="md" icon={LayoutDashboard} className="w-full text-xs">
                  Advisor / Owner Portal
                </Button>
              </Link>
              <Link
                to="/properties"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full block"
              >
                <Button variant="ghost" size="md" icon={Heart} className="w-full text-charcoal border border-sage/60">
                  Saved Properties
                </Button>
              </Link>
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-sage-light text-forest border border-sage/60">
                    <User className="w-4 h-4 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold leading-tight truncate">
                        {userProfile?.name || currentUser.displayName || 'EstateVista Member'}
                      </p>
                      <p className="text-[11px] text-mutedText truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="md"
                    icon={LogOut}
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-xs"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full block"
                  >
                    <Button variant="outline" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full block"
                  >
                    <Button variant="primary" size="md" className="w-full">
                      Create Account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
