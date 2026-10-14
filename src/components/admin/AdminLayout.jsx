import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Users,
  MessageSquare,
  Sliders,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Bell,
  RotateCw,
  AlertTriangle,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import Button from '../common/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getFirestoreAdminDashboardStats } from '../../services/adminFirestoreService';

export default function AdminLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, adminProfile, adminLogout } = useAdminAuth();

  const adminName = adminProfile?.name || adminUser?.displayName || 'System Administrator';
  const adminEmail = adminUser?.email || 'admin@estatevista.luxury';

  const fetchStats = async () => {
    try {
      const data = await getFirestoreAdminDashboardStats();
      setStats(data);
    } catch (err) {
      console.warn('Failed to load admin stats:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getFirestoreAdminDashboardStats().then((data) => {
      if (isMounted) setStats(data);
    });
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const pendingAppsCount = stats?.applications?.pending ?? stats?.pendingApplications ?? 0;
  const pendingPropsCount = stats?.properties?.pending ?? stats?.pendingModeration ?? 0;
  const totalUsersCount = stats?.users?.total ?? stats?.totalUsers ?? 0;
  const newInquiriesCount = stats?.inquiries?.new ?? stats?.newInquiries ?? 0;

  const navItems = [
    {
      name: 'Overview',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Advisor Applications',
      path: '/admin/advisor-applications',
      icon: ShieldCheck,
      badge: pendingAppsCount > 0 ? `${pendingAppsCount} Pending` : null,
      badgeVariant: 'amber',
    },
    {
      name: 'Properties Moderation',
      path: '/admin/properties',
      icon: Building2,
      badge: pendingPropsCount > 0 ? `${pendingPropsCount} Review` : null,
      badgeVariant: 'blue',
    },
    {
      name: 'User Management',
      path: '/admin/users',
      icon: Users,
      badge: totalUsersCount > 0 ? `${totalUsersCount}` : null,
      badgeVariant: 'gray',
    },
    {
      name: 'Client Inquiries',
      path: '/admin/inquiries',
      icon: MessageSquare,
      badge: newInquiriesCount > 0 ? `${newInquiriesCount} New` : null,
      badgeVariant: 'emerald',
    },
    {
      name: 'Settings & Audit',
      path: '/admin/settings',
      icon: Sliders,
      badge: null,
    },
  ];

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    await fetchStats();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const getPageTitle = () => {
    const current = navItems.find((item) => location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path)));
    return current ? current.name : 'Operations Console';
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#1E2922] flex flex-col md:flex-row font-sans">
      {/* ======================================================== */}
      {/* DESKTOP EXECUTIVE SIDEBAR                                */}
      {/* ======================================================== */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col bg-[#0B1E19] text-[#F8F7F2] border-r border-[#1B3E34] shrink-0 z-30 sticky top-0 h-screen select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1B3E34] flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#153E35] border border-[#C7A76C]/40 flex items-center justify-center text-[#C7A76C] shadow-md transition-transform duration-300 group-hover:scale-105">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif text-lg font-bold text-white tracking-tight leading-tight">
                EstateVista
              </div>
              <div className="text-[10px] font-bold text-[#C7A76C] uppercase tracking-wider">
                Admin Console
              </div>
            </div>
          </Link>
        </div>

        {/* System Mode Indicator */}
        <div className="px-4 py-3 bg-[#112B24] border-b border-[#1B3E34] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-200">Cloud Firestore Live</span>
          </div>
          <span className="text-[10px] font-mono text-white/50">v1.2.0</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#A2B8B1]">
            Platform Governance
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#153E35] text-[#F8F7F2] font-semibold shadow-sm border border-[#C7A76C]/30'
                    : 'text-[#C9D6D1] hover:bg-[#132E27] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#C7A76C]' : 'text-[#87A39B]'}`} />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeVariant === 'amber'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : item.badgeVariant === 'emerald'
                        ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                        : item.badgeVariant === 'blue'
                        ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                        : 'bg-white/10 text-white/80'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin User Footer Card */}
        <div className="p-4 border-t border-[#1B3E34] bg-[#0E241E]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#153E35] border border-[#23584B] flex items-center justify-center text-[#C7A76C] font-serif font-bold text-sm">
              {adminName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{adminName}</p>
              <p className="text-[11px] text-[#A2B8B1] truncate">{adminEmail}</p>
              <div className="mt-0.5">
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-gold/20 text-[#C7A76C] border border-[#C7A76C]/30">
                  Verified Admin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-[#1B3E34]/80">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[#A2B8B1] hover:text-white hover:bg-[#153E35] transition-colors"
              title="Open public website in a new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-red-300 hover:text-red-200 hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE HEADER & SLIDE-OVER DRAWER                        */}
      {/* ======================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0B1E19] text-white border-b border-[#1B3E34] px-4 py-3 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#153E35] border border-[#C7A76C]/40 flex items-center justify-center text-[#C7A76C]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif font-bold text-white text-base">EstateVista</span>
            <span className="block text-[9px] font-bold text-[#C7A76C] uppercase tracking-wider -mt-1">
              Admin Console
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-2 rounded-lg bg-[#153E35] text-white hover:bg-[#1B4B40] transition-colors"
            aria-label="Toggle Navigation Drawer"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-[85%] bg-[#0B1E19] text-white flex flex-col h-full border-r border-[#1B3E34]">
            <div className="p-4 border-b border-[#1B3E34] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#153E35] flex items-center justify-center text-[#C7A76C]">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-serif font-bold text-sm">EstateVista Admin</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 rounded text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                      isActive ? 'bg-[#153E35] text-white font-semibold border border-[#C7A76C]/30' : 'text-[#C9D6D1] hover:bg-[#132E27]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#C7A76C]' : 'text-[#87A39B]'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#1B3E34] bg-[#0E241E]">
              <div className="text-xs font-bold text-white truncate">{adminName}</div>
              <div className="text-[11px] text-[#A2B8B1] truncate">{adminEmail}</div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full py-2 rounded-lg bg-red-950/60 text-red-200 text-xs font-semibold hover:bg-red-900 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MAIN WORKSPACE CONTENT AREA                              */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E2E8E4] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-mutedText">
                <span>Operations</span>
                <ChevronRight className="w-3 h-3 text-mutedText/60" />
                <span className="text-forest font-semibold">{getPageTitle()}</span>
              </div>
              <h1 className="font-serif text-lg sm:text-xl font-bold text-charcoal leading-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Operational live telemetry pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Synchronized</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={RotateCw}
              onClick={handleRefreshStats}
              isLoading={isRefreshing}
              className="text-xs"
              title="Refresh live telemetry from Cloud Firestore"
            >
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </header>

        {/* Page Content Rendered Here */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
