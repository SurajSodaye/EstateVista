import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  ArrowRight,
  Award,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { isValidEmail } from '../../utils/validation';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { getAuthErrorMessage } from '../../services/agentAuthService';

export default function AgentLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    agentUser,
    agentProfile,
    isAdvisor,
    isPendingAdvisor,
    agentLogin,
    agentLogout,
    isFirebaseConfigured,
  } = useAgentAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const reason = queryParams.get('reason');
  const redirectPath = queryParams.get('redirect') || '/agent/dashboard';

  // If already signed in as an accredited advisor
  if (agentUser && isAdvisor) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-sage shadow-card text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Clearance Verified
            </span>
            <h2 className="font-serif text-2xl font-bold text-charcoal pt-2">
              Advisor Active
            </h2>
            <p className="text-xs sm:text-sm text-mutedText">
              Authenticated as <strong className="text-forest">{agentUser.email}</strong> • Role: <strong className="text-forest uppercase">{agentProfile?.role || 'Agent'}</strong>
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/agent/dashboard')}
            >
              Enter Advisor Workspace
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={LogOut}
              onClick={() => agentLogout()}
            >
              Sign Out Advisor Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If signed in but application is pending review
  if (agentUser && isPendingAdvisor) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200 shadow-card text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              Application In Progress
            </span>
            <h2 className="font-serif text-2xl font-bold text-charcoal pt-2">
              Application Under Review
            </h2>
            <p className="text-xs sm:text-sm text-mutedText">
              Your advisor application for <strong className="text-forest">{agentUser.email}</strong> is currently being evaluated.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/agent/pending')}
            >
              Check Application Status
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={LogOut}
              onClick={() => agentLogout()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = {};

    if (!formData.email) {
      errs.email = 'Advisor email address is required';
    } else if (!isValidEmail(formData.email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Security password is required';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!isFirebaseConfigured) {
      setServerError('Firebase credentials have not been configured yet.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { profile } = await agentLogin(formData.email, formData.password);
      if (profile && (profile.role === 'agent' || profile.role === 'admin') && profile.advisorStatus === 'approved') {
        navigate(redirectPath);
      } else if (profile && profile.advisorStatus === 'pending') {
        navigate('/agent/pending');
      } else {
        navigate('/agent/portal?reason=access_denied');
      }
    } catch (err) {
      setServerError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-gold shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-serif text-2xl font-bold text-forest">EstateVista</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-forest/10 text-forest border border-forest/20">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>Accredited Brokerage Portal</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
            Advisor Sign In
          </h1>
          <p className="text-xs sm:text-sm text-mutedText">
            Access your luxury listings, lead inquiries, and advisor workspace
          </p>
        </div>

        {/* Reason Alert Banner */}
        {reason === 'auth_required' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Advisor Session Required</strong>
              Please sign in with your verified advisor credentials to continue.
            </div>
          </div>
        )}

        {reason === 'access_denied' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Advisor Clearance Required</strong>
              This account does not have approved advisor status. Please apply below.
            </div>
          </div>
        )}

        {serverError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/60 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="agent-login-email"
              label="Advisor Email"
              name="email"
              type="email"
              autoComplete="username"
              icon={Mail}
              placeholder="e.g. advisor@brokerage.com"
              value={formData.email}
              disabled={isSubmitting}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
                if (serverError) setServerError('');
              }}
              error={errors.email}
              required
            />

            <div>
              <label htmlFor="agent-login-password" className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
                Security Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="agent-login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                    if (serverError) setServerError('');
                  }}
                  className={`w-full rounded-xl bg-white border ${
                    errors.password ? 'border-red-400 focus:border-red-500' : 'border-sage focus:border-forest'
                  } py-2.5 pl-10 pr-10 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/40 shadow-sm disabled:opacity-60`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-mutedText hover:text-forest"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full mt-2"
            >
              Sign In to Advisor Workspace
            </Button>
          </form>

          {/* Switch to Apply */}
          <div className="mt-6 pt-6 border-t border-sage/40 text-center text-xs text-mutedText space-y-2">
            <div>
              <span>New partner? </span>
              <Link to="/agent/apply" className="font-semibold text-forest hover:text-gold transition-colors">
                Apply for Advisor Accreditation
              </Link>
            </div>
            <div>
              <Link to="/" className="text-mutedText hover:text-charcoal transition-colors">
                ← Return to Public Website
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
