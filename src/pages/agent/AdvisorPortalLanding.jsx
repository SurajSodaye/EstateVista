import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  Lock,
  UserCheck,
  ArrowRight,
  Sparkles,
  Award,
  AlertTriangle,
  Clock,
  LogOut,
  ChevronRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useAgentAuth } from '../../context/AgentAuthContext';

export default function AdvisorPortalLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser: customerUser } = useAuth();
  const {
    agentUser,
    agentProfile,
    isAdvisor,
    isPendingAdvisor,
    agentLogout,
  } = useAgentAuth();

  const currentUser = agentUser || customerUser;
  const activeEmail = agentUser?.email || customerUser?.email;

  const reason = searchParams.get('reason');
  const attempted = searchParams.get('attempted');

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Access Denied / Auth Required Banner */}
      {reason === 'access_denied' && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 sm:p-8 shadow-soft flex items-start gap-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="font-serif text-lg font-bold text-amber-950">
              Advisor Clearance Required
            </h3>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              You attempted to access <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-950 font-mono text-xs">{attempted || 'the Advisor Portal'}</code>.{' '}
              Your current account {activeEmail ? (<>(<strong className="font-semibold">{activeEmail}</strong>) </>) : ''}is registered as a standard customer account and does not have advisor clearance.
            </p>
            <p className="text-xs text-amber-800 pt-1">
              To publish listings or manage client inquiries, please submit an advisor verification application below.
            </p>
          </div>
        </div>
      )}

      {reason === 'auth_required' && (
        <div className="bg-sage-light border border-sage rounded-3xl p-6 sm:p-8 shadow-soft flex items-start gap-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center shrink-0 border border-forest/20">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="font-serif text-lg font-bold text-forest">
              Authentication Required
            </h3>
            <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
              You must sign in with verified advisor credentials to access the EstateVista Advisor Workspace. Please sign in below or apply for advisor accreditation.
            </p>
          </div>
        </div>
      )}

      {/* Hero Presentation */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-forest/10 text-forest border border-forest/20">
          <ShieldCheck className="w-4 h-4 text-gold" />
          <span>Accredited Brokerage & Owner Gateway</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal tracking-tight">
          EstateVista Advisor Portal
        </h1>

        <p className="text-sm sm:text-base text-mutedText leading-relaxed">
          The private workstation for accredited real estate advisors, premier brokerage partners, and high-value property custodians. Manage verified luxury listings, evaluate confidential client leads, and access private market intelligence.
        </p>
      </div>

      {/* Dynamic State Container */}
      {agentUser && isAdvisor ? (
        // STATE 1: ALREADY AN APPROVED ADVISOR
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-sage shadow-card max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 mb-2">
              Advisor Clearance Active
            </span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Welcome Back, {agentProfile?.name || agentUser.displayName || 'Advisor'}
            </h2>
            <p className="text-xs sm:text-sm text-mutedText mt-1">
              Signed in as <strong className="text-forest">{agentUser.email}</strong> • Role: <strong className="text-forest uppercase">{agentProfile?.role || 'Agent'}</strong>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/agent/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto">
                Open Advisor Workspace
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => agentLogout()}
              className="w-full sm:w-auto text-xs"
            >
              Sign Out
            </Button>
          </div>
        </div>
      ) : agentUser && isPendingAdvisor ? (
        // STATE 2: PENDING ADVISOR APPLICANT
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-sage shadow-card max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 mb-2">
              Application Under Editorial Review
            </span>
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Advisor Application in Progress
            </h2>
            <p className="text-xs sm:text-sm text-mutedText mt-1">
              Your application for <strong className="text-forest">{agentUser.email}</strong> is currently undergoing editorial and accreditation verification.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/agent/pending" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" icon={FileCheck2} className="w-full sm:w-auto">
                View Application Status
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => agentLogout()}
              className="w-full sm:w-auto text-xs"
            >
              Sign Out
            </Button>
          </div>
        </div>
      ) : (
        // STATE 3: NOT LOGGED IN AS ADVISOR (TWO CLEAR OPTIONS)
        <div className="space-y-6 max-w-4xl mx-auto">
          {agentUser && !isAdvisor && !isPendingAdvisor && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl px-5 py-3 text-xs text-amber-900 flex items-center justify-between gap-3 animate-in fade-in">
              <span>Signed in as: <strong>{agentUser.email}</strong> (Standard Account — No Advisor Clearance)</span>
              <button
                type="button"
                onClick={() => agentLogout()}
                className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline shrink-0"
              >
                Sign Out
              </button>
            </div>
          )}
          {customerUser && !agentUser && (
            <div className="bg-sage-light/60 border border-sage rounded-2xl px-5 py-3 text-xs text-charcoal flex items-center justify-between">
              <span>Customer Session Active: <strong>{customerUser.email}</strong></span>
              <span className="text-mutedText">Advisor sessions operate independently</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Option A: Advisor Login */}
            <div className="bg-white rounded-3xl p-8 border border-sage shadow-card flex flex-col justify-between hover:border-forest/50 transition-all group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-forest text-gold flex items-center justify-center shadow-sm">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-charcoal group-hover:text-forest transition-colors">
                  Advisor Login
                </h2>
                <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
                  Already registered and accredited as an EstateVista partner? Sign in with your verified credentials to access your listings, draft reviews, and client inquiries.
                </p>
                <ul className="text-xs text-charcoal/80 space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                    Portfolio management & publishing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                    High-net-worth inquiry activity
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                    Market reach & visibility statistics
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link to="/agent/login">
                  <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" className="w-full">
                    Advisor Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Option B: Become an Advisor */}
          <div className="bg-white rounded-3xl p-8 border border-sage shadow-card flex flex-col justify-between hover:border-forest/50 transition-all group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gold/15 text-forest flex items-center justify-center border border-gold/40 shadow-sm">
                <Award className="w-7 h-7" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-charcoal group-hover:text-forest transition-colors">
                Become an Advisor
              </h2>
              <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
                Represent landmark residential properties on India's premier luxury real estate network. Apply for verified advisor status with your agency credentials.
              </p>
              <ul className="text-xs text-charcoal/80 space-y-2 pt-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  Editorial quality review & accreditation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  Prominent placement in Advisor Directory
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  Dedicated concierge support
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link to="/agent/apply">
                <Button variant="gold" size="lg" icon={ArrowRight} iconPosition="right" className="w-full">
                  Apply to Join
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Standards & Transparency Section */}
      <div className="border-t border-sage/60 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="bg-white/80 rounded-2xl p-6 border border-sage/60 space-y-2">
            <ShieldCheck className="w-6 h-6 text-forest mx-auto sm:mx-0" />
            <h4 className="font-serif text-base font-bold text-charcoal">
              Rigorous Verification
            </h4>
            <p className="text-xs text-mutedText leading-relaxed">
              Every advisor profile undergoes RERA license and brokerage authentication to ensure client discretion and transactional integrity.
            </p>
          </div>

          <div className="bg-white/80 rounded-2xl p-6 border border-sage/60 space-y-2">
            <TrendingUp className="w-6 h-6 text-forest mx-auto sm:mx-0" />
            <h4 className="font-serif text-base font-bold text-charcoal">
              Ultra-Prime Focus
            </h4>
            <p className="text-xs text-mutedText leading-relaxed">
              Curated specifically for trophy penthouses, heritage villas, and luxury beachfront residences across Mumbai, Bengaluru, and Delhi NCR.
            </p>
          </div>

          <div className="bg-white/80 rounded-2xl p-6 border border-sage/60 space-y-2">
            <Lock className="w-6 h-6 text-forest mx-auto sm:mx-0" />
            <h4 className="font-serif text-base font-bold text-charcoal">
              Role-Based Security
            </h4>
            <p className="text-xs text-mutedText leading-relaxed">
              Privileged portal access is protected by Firebase Authentication and Firestore security rules. Customer accounts cannot self-elevate permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
