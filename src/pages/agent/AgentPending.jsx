import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Building2,
  ShieldCheck,
  FileText,
  RotateCw,
  LogOut,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAgentAuth } from '../../context/AgentAuthContext';

export default function AgentPending() {
  const navigate = useNavigate();
  const {
    agentUser,
    agentProfile,
    isAdvisor,
    isPendingAdvisor,
    refreshAgentProfile,
    agentLogout,
  } = useAgentAuth();
  const currentUser = agentUser;
  const userProfile = agentProfile;
  const logout = agentLogout;
  const refreshUserProfile = refreshAgentProfile;
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage('');
    const updated = await refreshUserProfile();
    setChecking(false);

    if (updated && (updated.role === 'agent' || updated.role === 'admin') && updated.advisorStatus === 'approved') {
      setStatusMessage('Congratulations! Your advisor accreditation has been approved.');
    } else {
      setStatusMessage('Your application remains in the editorial verification queue.');
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // If already approved
  if (isAdvisor) {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            Accreditation Approved
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
            Welcome to EstateVista, Advisor
          </h2>
          <p className="text-xs sm:text-sm text-mutedText">
            Your credentials have been authenticated. You now have full clearance to publish listings and manage inquiries.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/agent/dashboard">
            <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
              Enter Advisor Workspace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-8">
      {/* Primary Status Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-sage shadow-card text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-sm animate-pulse">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span>Status: Pending Editorial Review</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
            Advisor Application Under Review
          </h1>
          <p className="text-xs sm:text-sm text-mutedText leading-relaxed max-w-md mx-auto">
            Thank you for applying to represent luxury real estate on EstateVista. Your application is currently awaiting editorial verification.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-sage-light text-forest text-xs font-semibold border border-sage animate-in fade-in">
            {statusMessage}
          </div>
        )}

        {/* Application Summary Box */}
        <div className="bg-ivory/60 rounded-2xl p-5 border border-sage/70 text-left text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-sage/60">
            <span className="text-mutedText">Applicant Name:</span>
            <span className="font-bold text-charcoal">
              {userProfile?.name || currentUser?.displayName || 'Advisor Applicant'}
            </span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-sage/60">
            <span className="text-mutedText">Registered Email:</span>
            <span className="font-bold text-charcoal font-mono">
              {currentUser?.email || 'N/A'}
            </span>
          </div>
          {userProfile?.requestedAgency && (
            <div className="flex items-center justify-between pb-2 border-b border-sage/60">
              <span className="text-mutedText">Brokerage Firm:</span>
              <span className="font-bold text-charcoal">
                {userProfile.requestedAgency}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-mutedText">Current Permissions:</span>
            <span className="font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
              Standard Customer (Browsing & Saved Homes)
            </span>
          </div>
        </div>

        {/* Verification Stage Timeline */}
        <div className="space-y-3 text-left pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-mutedText">
            Verification Pipeline
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  1. Identity & Account Registration
                </p>
                <p className="text-[11px] text-emerald-800/80">
                  Authenticated user credentials created and verified via Firebase.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-950">
                  2. Brokerage & RERA License Verification
                </p>
                <p className="text-[11px] text-amber-900/80">
                  EstateVista concierge is checking license records and agency registration.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 opacity-60">
              <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-700">
                  3. Workspace Activation & Listing Permissions
                </p>
                <p className="text-[11px] text-gray-500">
                  Granted once accreditation is formally signed off by the platform administrator.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-sage/60">
          <Button
            variant="primary"
            size="md"
            icon={RotateCw}
            onClick={handleCheckStatus}
            isLoading={checking}
            className="w-full sm:w-auto"
          >
            Check Status Again
          </Button>
          <Link to="/properties" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full sm:w-auto">
              Explore Properties
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="md"
            icon={LogOut}
            onClick={() => logout()}
            className="w-full sm:w-auto text-xs text-mutedText"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
