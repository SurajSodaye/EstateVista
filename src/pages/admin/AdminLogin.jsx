import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Eye,
  EyeOff,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { isValidEmail } from '../../utils/validation';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getAuthErrorMessage } from '../../services/adminAuthService';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, adminProfile, adminLogin, adminLogout, isAdmin, isFirebaseConfigured } = useAdminAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const reason = queryParams.get('reason');
  const redirectPath = queryParams.get('redirect') || '/admin/dashboard';

  // If user is already signed in on adminAuth and HAS admin privileges
  if (adminUser && isAdmin) {
    return (
      <div className="min-h-screen bg-[#0C1E1A] flex items-center justify-center p-4 sm:p-6 text-[#F8F7F2]">
        <div className="max-w-md w-full bg-[#112A24] rounded-3xl p-8 border border-[#23584B] shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#153E35] border border-[#C7A76C]/40 text-[#C7A76C] flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Clearance Verified
            </span>
            <h2 className="font-serif text-2xl font-bold text-white pt-2">
              Administrator Active
            </h2>
            <p className="text-xs text-[#A2B8B1]">
              Authenticated as <strong className="text-white">{adminUser.email}</strong> with role <span className="text-[#C7A76C] font-mono font-bold">admin</span>.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="gold"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/admin/dashboard')}
            >
              Enter Operations Console
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={LogOut}
              className="text-[#C9D6D1] border-white/20 hover:bg-white/5"
              onClick={() => adminLogout()}
            >
              Sign Out Administrative Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user is signed into adminAuth but DOES NOT have admin privileges
  if (adminUser && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0C1E1A] flex items-center justify-center p-4 sm:p-6 text-[#F8F7F2]">
        <div className="max-w-md w-full bg-[#112A24] rounded-3xl p-8 border border-red-500/30 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
              Access Denied
            </span>
            <h2 className="font-serif text-2xl font-bold text-white pt-2">
              Administrative Clearance Required
            </h2>
            <p className="text-xs text-[#A2B8B1] leading-relaxed">
              Your account <strong className="text-white">{adminUser.email}</strong> is registered with role <span className="text-amber-300 font-mono font-bold">'{adminProfile?.role || 'customer'}'</span>. Administrative access is restricted to verified administrators.
            </p>
          </div>

          <div className="bg-[#0C1E1A] rounded-2xl p-4 border border-[#23584B] text-left text-xs space-y-2 text-[#A2B8B1]">
            <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
              <Info className="w-3.5 h-3.5 text-[#C7A76C]" />
              <span>Administrative Provisioning Rule</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              In accordance with EstateVista security policies, admin privileges can never be self-assigned. An existing administrator or owner must set <code className="text-[#C7A76C]">role: "admin"</code> in Cloud Firestore under <code className="text-white">/users/{adminUser.uid}</code>.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              icon={LogOut}
              className="text-white border-white/20 hover:bg-white/10"
              onClick={() => adminLogout()}
            >
              Sign Out & Switch Account
            </Button>
            <Link to="/">
              <Button variant="ghost" size="md" className="w-full text-xs text-[#A2B8B1] hover:text-white">
                Return to Public Website
              </Button>
            </Link>
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
      errs.email = 'Administrator email address is required';
    } else if (!isValidEmail(formData.email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Security password is required';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!isFirebaseConfigured) {
      setServerError('Firebase credentials are not configured in .env.local.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { profile } = await adminLogin(formData.email, formData.password);
      if (profile && profile.role === 'admin') {
        navigate(redirectPath);
      }
    } catch (err) {
      setServerError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C1E1A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#F8F7F2]">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Console Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#153E35] border border-[#C7A76C]/40 flex items-center justify-center text-[#C7A76C] mx-auto shadow-lg">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            EstateVista Operations
          </h1>
          <p className="text-xs text-[#A2B8B1]">
            Executive Administration & Governance Console
          </p>
        </div>

        {/* Reason Alert Banner */}
        {reason === 'access_denied' && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-red-300">Access Denied</strong>
              Administrative credentials are required to enter the operations workspace.
            </div>
          </div>
        )}

        {reason === 'auth_required' && (
          <div className="p-4 rounded-2xl bg-[#153E35] border border-[#C7A76C]/40 text-xs text-[#F8F7F2] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#C7A76C] shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-[#C7A76C]">Session Required</strong>
              Please authenticate with your administrative credentials to continue.
            </div>
          </div>
        )}

        {/* Server Error Banner */}
        {serverError && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Console Login Form Card */}
        <div className="bg-[#112A24] rounded-3xl p-6 sm:p-8 border border-[#23584B] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-login-email" className="block text-xs font-semibold text-[#C9D6D1] mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#87A39B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-login-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={formData.email}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                    if (serverError) setServerError('');
                  }}
                  placeholder="admin@estatevista.luxury"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0C1E1A] border border-[#23584B] text-white text-xs placeholder:text-[#5E7A72] focus:outline-none focus:ring-2 focus:ring-[#C7A76C] focus:border-transparent transition-all"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="admin-login-password" className="block text-xs font-semibold text-[#C9D6D1] mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#87A39B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                    if (serverError) setServerError('');
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0C1E1A] border border-[#23584B] text-white text-xs placeholder:text-[#5E7A72] focus:outline-none focus:ring-2 focus:ring-[#C7A76C] focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#87A39B] hover:text-[#C7A76C]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-red-400">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-2 font-bold tracking-wide"
            >
              Authenticate & Enter Console
            </Button>
          </form>

          {/* Secure Provisioning Guide Dropdown */}
          <div className="mt-6 pt-5 border-t border-[#1B3E34]">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-[#A2B8B1] hover:text-[#C7A76C] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#C7A76C]" />
                <span>How to Provision an Admin Account</span>
              </div>
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showGuide && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#0C1E1A] border border-[#23584B] text-[11px] text-[#A2B8B1] space-y-2 leading-relaxed animate-in fade-in">
                <p className="font-bold text-white">
                  Trusted Role Provisioning Protocol:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[#87A39B]">
                  <li>
                    Register an account at <code className="text-[#C7A76C]">/register</code> using your admin email address.
                  </li>
                  <li>
                    Open the <strong className="text-white">Firebase Console</strong> $\rightarrow$ <strong>Firestore Database</strong>.
                  </li>
                  <li>
                    Navigate to <code className="text-[#C7A76C]">/users/{'{uid}'}</code> for your new account.
                  </li>
                  <li>
                    Edit the <code className="text-[#C7A76C]">role</code> field and change it from <code className="text-white">"customer"</code> to <code className="text-[#C7A76C]">"admin"</code>.
                  </li>
                  <li>
                    Return to this page (<code className="text-[#C7A76C]">/admin/login</code>) and sign in.
                  </li>
                </ol>
                <p className="text-[10px] text-amber-300 pt-1 border-t border-[#1B3E34]">
                  ⚠️ Security Policy: Client forms and localStorage cannot grant admin rights; only trusted Firestore profile data is accepted.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-[#87A39B] hover:text-[#C7A76C] transition-colors"
          >
            ← Return to EstateVista Public Home
          </Link>
        </div>
      </div>
    </div>
  );
}
