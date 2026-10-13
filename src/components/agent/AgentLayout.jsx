import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Home,
  PlusCircle,
  MessageSquare,
  User,
  Settings,
  Globe,
  Menu,
  X,
  ChevronRight,
  Info,
  LogOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import Button from '../common/Button';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { getAgentProfile } from '../../services/agentPortalService';

export default function AgentLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { agentUser, agentProfile, agentLogout } = useAgentAuth();
  const currentUser = agentUser;
  const userProfile = agentProfile;
  const logout = async () => {
    await agentLogout();
    navigate('/agent/login');
  };

  const displayName = userProfile?.name || currentUser?.displayName || profile?.name || 'Advisor';
  const displayAgency = userProfile?.agency || userProfile?.requestedAgency || profile?.agency || 'EstateVista Advisory Network';
  const displayEmail = currentUser?.email || profile?.email || '';

  useEffect(() => {
    let isMounted = true;
    getAgentProfile().then((data) => {
      if (isMounted && data) setProfile(data);
    });
    return () => {
      isMounted = false;
    };
  }, [userProfile]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      name: 'Dashboard',
      path: '/agent/dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics',
    },
    {
      name: 'My Properties',
      path: '/agent/properties',
      icon: Home,
      description: 'Manage listings',
    },
    {
      name: 'Add Property',
      path: '/agent/properties/new',
      icon: PlusCircle,
      description: 'Draft or submit listing',
    },
    {
      name: 'Inquiries',
      path: '/agent/inquiries',
      icon: MessageSquare,
      description: 'Client leads & messages',
    },
    {
      name: 'Agent Profile',
      path: '/agent/profile',
      icon: User,
      description: 'Public advisor bio',
    },
    {
      name: 'Settings',
      path: '/agent/settings',
      icon: Settings,
      description: 'Preferences & display',
    },
  ];


  const getPageTitle = () => {
    const current = navItems.find((item) => {
      if (item.path === '/agent/properties/new') {
        return location.pathname === '/agent/properties/new';
      }
      return location.pathname.startsWith(item.path);
    });
    if (location.pathname.includes('/edit')) return 'Edit Property Listing';
    return current ? current.name : 'Agent Portal';
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex flex-col md:flex-row">
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR                                          */}
      {/* ======================================================== */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col bg-white border-r border-sage shrink-0 z-30 sticky top-0 h-screen select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-sage/60 flex items-center justify-between">
          <Link to="/agent/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-gold shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif text-lg font-bold text-forest tracking-tight leading-tight">
                EstateVista
              </div>
              <div className="text-[11px] font-semibold text-gold uppercase tracking-wider">
                Advisor Portal
              </div>
            </div>
          </Link>
        </div>

        {/* Advisor Profile Summary Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-sage-light/60 border border-sage/70 flex items-center gap-3">
          <div className="relative">
            <img
              src={profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={profile?.name || 'Agent'}
              className="w-11 h-11 rounded-xl object-cover border border-forest/20 shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Active Advisor Session" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-forest truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-mutedText truncate">
              {displayAgency}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Verified Advisor
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/agent/properties'
                ? location.pathname === '/agent/properties'
                : item.path === '/agent/properties/new'
                ? location.pathname === '/agent/properties/new'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-forest text-white shadow-sm font-semibold'
                    : 'text-charcoal/80 hover:bg-sage/40 hover:text-forest'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gold' : 'text-forest/70'}`} />
                <span className="truncate">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-gold" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-sage/60 space-y-2">
          <Link
            to="/"
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-charcoal/80 hover:text-forest hover:bg-sage/40 rounded-xl transition-colors border border-sage/60"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-forest" />
              <span>Public Website</span>
            </div>
            <span className="text-[10px] text-mutedText">Exit Portal</span>
          </Link>

        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE DRAWER NAVIGATION                                 */}
      {/* ======================================================== */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85%] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-sage flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center text-gold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-serif text-base font-bold text-forest leading-tight">
                    EstateVista
                  </div>
                  <div className="text-[10px] font-semibold text-gold uppercase tracking-wider">
                    Advisor Portal
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 rounded-lg text-charcoal/70 hover:bg-sage/50"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/agent/properties'
                    ? location.pathname === '/agent/properties'
                    : item.path === '/agent/properties/new'
                    ? location.pathname === '/agent/properties/new'
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-forest text-white font-semibold'
                        : 'text-charcoal/80 hover:bg-sage/40 hover:text-forest'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gold' : 'text-forest'}`} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Drawer Footer */}
            <div className="p-4 border-t border-sage/60 space-y-2">
              <Link
                to="/"
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-sage-light text-forest font-semibold text-xs border border-sage"
              >
                <Globe className="w-4 h-4" />
                <span>Return to Public Website</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MAIN VIEWPORT CONTAINER                                  */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-sage px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 -ml-2 rounded-xl text-forest hover:bg-sage/40 md:hidden"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg sm:text-xl font-bold text-charcoal leading-tight">
                  {getPageTitle()}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-2.5 h-2.5 text-gold" />
                  Verified Workspace
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/agent/properties/new" className="hidden sm:inline-block">
              <Button variant="primary" size="sm" icon={PlusCircle}>
                Add Property
              </Button>
            </Link>

            <Link to="/" className="hidden lg:inline-block">
              <Button variant="secondary" size="sm" icon={Globe}>
                Public Site
              </Button>
            </Link>

            {/* Profile Dropdown Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-sage/40 transition-colors border border-transparent hover:border-sage/60"
                aria-expanded={isProfileMenuOpen}
              >
                <img
                  src={profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={profile?.name || 'Agent'}
                  className="w-8 h-8 rounded-lg object-cover border border-forest/20"
                />
                <span className="hidden sm:block text-xs font-semibold text-charcoal text-left max-w-[110px] truncate">
                  {displayName}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-sage p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-sage/60 mb-1">
                    <p className="text-xs font-bold text-forest truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-mutedText truncate">
                      {displayEmail}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold uppercase mt-0.5">
                      Verified Advisor Session
                    </p>
                  </div>

                  <Link
                    to="/agent/profile"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-charcoal hover:bg-sage/30 rounded-xl transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-forest" />
                    <span>Advisor Profile</span>
                  </Link>

                  <Link
                    to="/agent/settings"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-charcoal hover:bg-sage/30 rounded-xl transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-forest" />
                    <span>Portal Settings</span>
                  </Link>

                  <Link
                    to="/"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-charcoal hover:bg-sage/30 rounded-xl transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-forest" />
                    <span>View Public Website</span>
                  </Link>

                  <div className="border-t border-sage/60 my-1" />

                  {currentUser ? (
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out ({currentUser.email.split('@')[0]})</span>
                    </button>
                  ) : (
                    <Link
                      to="/agent/login"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-forest hover:bg-sage/30 rounded-xl transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Sign In as Agent</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
