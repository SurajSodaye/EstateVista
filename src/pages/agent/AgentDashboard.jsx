import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Eye,
  Edit,
  ExternalLink,
  ChevronRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { subscribeAgentDashboardStats, getAgentDashboardStats } from '../../services/agentPortalService';

export default function AgentDashboard() {
  const { agentUser, agentProfile } = useAgentAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadStats = () => {
    setError(null);
    setLoading(true);
    const unsubscribe = subscribeAgentDashboardStats(
      (data) => {
        setStats(data);
        setLoading(false);
        setError(null);
        setIsRetrying(false);
      },
      (err) => {
        console.error('Dashboard stats subscription error:', err);
        setError(err.message || 'Unable to load live dashboard statistics from Cloud Firestore.');
        setLoading(false);
        setIsRetrying(false);
      }
    );
    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = loadStats();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [agentUser?.uid]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    try {
      const data = await getAgentDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to refresh statistics.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading advisor metrics and activity from Cloud Firestore..." />;
  }

  // Format currency helper for Indian format (₹ Cr / Lakh)
  const formatPrice = (price, listingType) => {
    if (!price) return '₹0';
    if (listingType === 'Rent') {
      if (price >= 100000) {
        return `₹${(price / 100000).toFixed(1)} L/mo`;
      }
      return `₹${price.toLocaleString('en-IN')}/mo`;
    }
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(1)} Lakh`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge variant="status">Published</Badge>;
      case 'pending':
        return <Badge className="bg-amber-50 text-amber-800 border-amber-200">Pending Approval</Badge>;
      case 'draft':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-300">Draft</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Needs Revision</Badge>;
      default:
        return <Badge>{status || 'Draft'}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Error Alert with Manual Retry */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            isLoading={isRetrying}
            className="shrink-0 text-xs"
          >
            Retry Sync
          </Button>
        </div>
      )}

      {/* Welcome Banner & Quick Actions */}
      <div className="bg-forest text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-card">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-forest-light/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 -mb-10 w-48 h-48 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gold border border-gold/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EstateVista Advisor Workspace</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {agentProfile?.name || agentUser?.displayName || 'Advisor'}
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Track your property portfolio, evaluate client inquiries, and manage your luxury listings in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/agent/properties/new">
              <Button variant="gold" size="md" icon={PlusCircle}>
                Add New Property
              </Button>
            </Link>
            <Link to="/agent/properties">
              <Button variant="white" size="md" icon={Building2}>
                View All Listings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Empty State Onboarding Card (Shown if portfolio is empty) */}
      {stats && stats.totalProperties === 0 && (
        <div className="bg-sage-light/60 border border-sage rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-forest text-gold flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-forest">
                Start Building Your Portfolio
              </h3>
              <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed max-w-xl">
                You do not have any property listings under your advisor account yet. Create your first listing to submit for editorial review and receive direct inquiries from prospective high-net-worth buyers.
              </p>
            </div>
          </div>
          <Link to="/agent/properties/new" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="md" icon={PlusCircle} className="w-full sm:w-auto">
              Create First Listing
            </Button>
          </Link>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Properties */}
        <div className="bg-white rounded-2xl p-5 border border-sage shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-mutedText mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Listings</span>
            <div className="w-9 h-9 rounded-xl bg-sage-light text-forest flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-charcoal">
              {stats?.totalProperties || 0}
            </div>
            <div className="mt-1 text-xs text-mutedText flex items-center gap-1">
              <span>Managed by your account</span>
            </div>
          </div>
        </div>

        {/* Published Properties */}
        <div className="bg-white rounded-2xl p-5 border border-sage shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-mutedText mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Published</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-forest">
              {stats?.publishedCount || 0}
            </div>
            <div className="mt-1 text-xs text-emerald-700 font-medium">
              Live on public catalog
            </div>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white rounded-2xl p-5 border border-sage shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-mutedText mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Under Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-charcoal">
              {stats?.pendingCount || 0}
            </div>
            <div className="mt-1 text-xs text-amber-700 font-medium">
              Pending editorial review
            </div>
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white rounded-2xl p-5 border border-sage shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-mutedText mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Drafts</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-charcoal">
              {stats?.draftCount || 0}
            </div>
            <div className="mt-1 text-xs text-mutedText">
              Unpublished listings
            </div>
          </div>
        </div>

        {/* Total Inquiries */}
        <div className="bg-white rounded-2xl p-5 border border-sage shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-mutedText mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Inquiries</span>
            <div className="w-9 h-9 rounded-xl bg-gold/15 text-forest flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-forest flex items-baseline gap-2">
              <span>{stats?.totalInquiries || 0}</span>
              {(stats?.newInquiriesCount || 0) > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gold/20 text-forest border border-gold/40">
                  {stats.newInquiriesCount} new
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-mutedText">
              From interested buyers
            </div>
          </div>
        </div>
      </div>

      {/* Analytical Visualizations (Live Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Inquiries & Portfolio Trend (Clean SVG Chart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-sage shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                Portfolio Growth & Inquiries Activity
              </h3>
              <p className="text-xs text-mutedText">
                Real client inquiries and new listings added over the last 6 months
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-forest font-medium">
                <span className="w-3 h-3 rounded bg-forest inline-block" />
                Inquiries
              </span>
              <span className="flex items-center gap-1.5 text-mutedText font-medium">
                <span className="w-3 h-3 rounded bg-gold inline-block" />
                Listings Added
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-6 pt-4 border-b border-sage/60 pb-2">
            {stats?.monthlyActivity?.map((item) => {
              const maxCount = Math.max(
                ...stats.monthlyActivity.map((m) => Math.max(m.inquiries, m.listings || 0)),
                5
              );
              const inqPercent = Math.min(100, Math.round((item.inquiries / maxCount) * 100));
              const listPercent = Math.min(100, Math.round(((item.listings || 0) / maxCount) * 100));

              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                    {/* Listings Bar */}
                    <div
                      style={{ height: `${Math.max(listPercent, item.listings ? 8 : 0)}%` }}
                      className="w-1/2 sm:w-5 max-w-[20px] bg-gold/70 rounded-t-md transition-all duration-300 group-hover:bg-gold relative"
                      title={`${item.listings || 0} Listings Added`}
                    />
                    {/* Inquiries Bar */}
                    <div
                      style={{ height: `${Math.max(inqPercent, item.inquiries ? 8 : 0)}%` }}
                      className="w-1/2 sm:w-5 max-w-[20px] bg-forest rounded-t-md transition-all duration-300 group-hover:bg-forest-light relative shadow-xs"
                      title={`${item.inquiries} Inquiries`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-charcoal/70 group-hover:text-forest transition-colors">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-mutedText">
            <span>Portfolio engagement activity</span>
            <span className="text-emerald-700 font-medium">✓ Scoped to {agentUser?.email}</span>
          </div>
        </div>

        {/* Portfolio Status Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-sage shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
              Listing Status Breakdown
            </h3>
            <p className="text-xs text-mutedText mb-6">
              Distribution of listings across review stages
            </p>

            <div className="space-y-4">
              {/* Published Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-medium">
                  <span className="text-emerald-800">Published ({stats.publishedCount})</span>
                  <span className="text-mutedText">
                    {stats.totalProperties ? Math.round((stats.publishedCount / stats.totalProperties) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-sage-light rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${stats.totalProperties ? (stats.publishedCount / stats.totalProperties) * 100 : 0}%`,
                    }}
                    className="h-full bg-forest rounded-full"
                  />
                </div>
              </div>

              {/* Pending Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-medium">
                  <span className="text-amber-800">Pending Review ({stats.pendingCount})</span>
                  <span className="text-mutedText">
                    {stats.totalProperties ? Math.round((stats.pendingCount / stats.totalProperties) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-sage-light rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${stats.totalProperties ? (stats.pendingCount / stats.totalProperties) * 100 : 0}%`,
                    }}
                    className="h-full bg-gold rounded-full"
                  />
                </div>
              </div>

              {/* Draft Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-700">Drafts ({stats.draftCount})</span>
                  <span className="text-mutedText">
                    {stats.totalProperties ? Math.round((stats.draftCount / stats.totalProperties) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-sage-light rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${stats.totalProperties ? (stats.draftCount / stats.totalProperties) * 100 : 0}%`,
                    }}
                    className="h-full bg-slate-400 rounded-full"
                  />
                </div>
              </div>

              {/* Rejected / Needs Revision */}
              {stats.rejectedCount > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-medium">
                    <span className="text-rose-700">Needs Revision ({stats.rejectedCount})</span>
                    <span className="text-mutedText">
                      {stats.totalProperties ? Math.round((stats.rejectedCount / stats.totalProperties) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-sage-light rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${stats.totalProperties ? (stats.rejectedCount / stats.totalProperties) * 100 : 0}%`,
                      }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-sage/60 mt-4">
            <Link
              to="/agent/properties"
              className="inline-flex items-center justify-between w-full text-xs font-semibold text-forest hover:text-forest-light group"
            >
              <span>Manage all listings in table</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Properties & Recent Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Properties Widget */}
        <div className="bg-white rounded-2xl border border-sage shadow-soft p-6">
          <div className="flex items-center justify-between pb-4 border-b border-sage/60 mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                Recent Properties
              </h3>
              <p className="text-xs text-mutedText">
                Latest portfolio additions and updates
              </p>
            </div>
            <Link to="/agent/properties">
              <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                View All
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-sage/40">
            {stats.recentProperties && stats.recentProperties.length > 0 ? (
              stats.recentProperties.map((prop) => (
                <div key={prop.id} className="py-3.5 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prop.imageUrls?.[0] || prop.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=150&q=80'}
                      alt={prop.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-sage"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {getStatusBadge(prop.publicationStatus)}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText">
                          {prop.listingType}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-charcoal truncate group-hover:text-forest transition-colors">
                        {prop.title}
                      </h4>
                      <p className="text-[11px] text-mutedText truncate">
                        {prop.location}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-forest">
                      {formatPrice(prop.price, prop.listingType)}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <Link
                        to={`/agent/properties/${prop.id}/edit`}
                        className="p-1 text-mutedText hover:text-forest hover:bg-sage/40 rounded-lg transition-colors"
                        title="Edit Listing"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to={`/properties/${prop.id}`}
                        target="_blank"
                        className="p-1 text-mutedText hover:text-forest hover:bg-sage/40 rounded-lg transition-colors"
                        title="Preview on Public Website"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-mutedText text-sm space-y-2">
                <p>No listings added to your portfolio yet.</p>
                <Link to="/agent/properties/new" className="inline-block text-xs font-semibold text-forest underline hover:text-forest-dark">
                  Create your first property listing
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Inquiries Widget */}
        <div className="bg-white rounded-2xl border border-sage shadow-soft p-6">
          <div className="flex items-center justify-between pb-4 border-b border-sage/60 mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                Recent Inquiries Activity
              </h3>
              <p className="text-xs text-mutedText">
                Direct inquiries from prospective buyers
              </p>
            </div>
            <Link to="/agent/inquiries">
              <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                View All
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-sage/40">
            {stats.recentInquiries && stats.recentInquiries.length > 0 ? (
              stats.recentInquiries.map((inq) => (
                <div key={inq.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-forest">
                      {inq.clientName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        inq.status === 'new'
                          ? 'bg-amber-100 text-amber-800'
                          : inq.status === 'contacted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {inq.status?.toUpperCase() || 'NEW'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-charcoal truncate">
                    Regarding: {inq.propertyTitle}
                  </p>
                  <p className="text-xs text-charcoal/70 line-clamp-1 italic">
                    "{inq.message}"
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-mutedText pt-1">
                    <span>{inq.createdAt || inq.date ? new Date(inq.createdAt || inq.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                    <Link
                      to="/agent/inquiries"
                      className="text-forest hover:underline font-semibold"
                    >
                      Review inquiry
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-mutedText text-sm space-y-1">
                <p>No client inquiries received yet.</p>
                <p className="text-xs text-mutedText/70">
                  When clients inquire about your listings, leads will be routed directly here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
