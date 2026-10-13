import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building2, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { isValidEmail } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, login, logout, isFirebaseConfigured } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already logged in, show their active session card
  if (currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-sage/60 shadow-card text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-forest text-gold flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-charcoal">
            Already Signed In
          </h2>
          <p className="text-xs sm:text-sm text-mutedText">
            You are currently authenticated as <strong className="text-forest">{currentUser.email}</strong>.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Button variant="primary" size="md" onClick={() => navigate('/')}>
              Explore Properties Home
            </Button>
            <Button variant="outline" size="md" icon={LogOut} onClick={() => logout()}>
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
      errs.email = 'Email address is required';
    } else if (!isValidEmail(formData.email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    if (!isFirebaseConfigured) {
      setServerError('Firebase credentials have not been configured yet. Please add your credentials from the Firebase Console to .env.local.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      const redirectPath = location.state?.from || '/';
      navigate(redirectPath);
    } catch (err) {
      setServerError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-gold shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-serif text-2xl font-bold text-forest">EstateVista</span>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Access your saved residences and private inquiries
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/60 shadow-card">
          {/* Server / Auth Error Banner */}
          {serverError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Setup Notice if .env.local is missing */}
          {!isFirebaseConfigured && (
            <div className="mb-6 p-4 rounded-2xl bg-sage-light border border-sage text-xs text-charcoal space-y-1">
              <div className="flex items-center gap-2 font-bold text-forest">
                <AlertCircle className="w-4 h-4 text-gold shrink-0" />
                <span>Configuration Notice</span>
              </div>
              <p>
                Firebase is awaiting your project keys. Copy <code className="bg-ivory px-1 rounded text-forest font-mono">.env.example</code> to <code className="bg-ivory px-1 rounded text-forest font-mono">.env.local</code> and supply your Firebase Web App credentials.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="customer-login-email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="username"
              icon={Mail}
              placeholder="e.g. yourname@domain.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
                if (serverError) setServerError('');
              }}
              error={errors.email}
              disabled={isSubmitting}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="customer-login-password" className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-forest hover:text-gold font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="customer-login-password"
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
              Sign In to EstateVista
            </Button>
          </form>

          {/* Switch to Register */}
          <div className="mt-6 pt-6 border-t border-sage/40 text-center text-xs text-mutedText">
            <span>Don't have an account yet? </span>
            <Link to="/register" className="font-semibold text-forest hover:text-gold transition-colors">
              Join Free Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
