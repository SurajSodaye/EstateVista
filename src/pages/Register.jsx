import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Building2, AlertCircle, Phone, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { isValidEmail, isValidPhone } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const { currentUser, register, isFirebaseConfigured } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    accountType: 'buyer', // 'buyer' or 'owner_agent'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, show session state
  if (currentUser) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-sage/60 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-forest text-gold flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-charcoal">
            Already Registered & Signed In
          </h2>
          <p className="text-xs sm:text-sm text-mutedText">
            You are currently signed in as <strong className="text-forest">{currentUser.email}</strong>.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="md" onClick={() => navigate('/')}>
              Return to Home Overview
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

    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      errs.email = 'Email address is required';
    } else if (!isValidEmail(formData.email)) {
      errs.email = 'Enter a valid email address';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    if (!isFirebaseConfigured) {
      setServerError('Firebase credentials have not been configured yet. Please add your credentials from the Firebase Console to .env.local.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        accountType: formData.accountType,
      });
      navigate('/');
    } catch (err) {
      setServerError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
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
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Join discerning buyers, tenants, and property custodians
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
            {/* Account Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
                I am exploring as a:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setFormData({ ...formData, accountType: 'buyer' })}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    formData.accountType === 'buyer'
                      ? 'bg-forest text-white border-forest shadow-sm'
                      : 'bg-ivory text-charcoal/80 border-sage hover:bg-sage/30'
                  }`}
                >
                  Buyer or Tenant
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setFormData({ ...formData, accountType: 'owner_agent' })}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    formData.accountType === 'owner_agent'
                      ? 'bg-forest text-white border-forest shadow-sm'
                      : 'bg-ivory text-charcoal/80 border-sage hover:bg-sage/30'
                  }`}
                >
                  Owner or Advisor
                </button>
              </div>
              {formData.accountType === 'owner_agent' && (
                <p className="mt-1.5 text-[11px] text-mutedText leading-relaxed">
                  * Note: Advisor accounts register with standard access. Certified advisor status is activated following agency credentials review.
                </p>
              )}
            </div>

            <Input
              id="register-name"
              label="Full Name"
              name="name"
              autoComplete="name"
              icon={User}
              placeholder="e.g. Siddharth Singhania"
              value={formData.name}
              disabled={isSubmitting}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
                if (serverError) setServerError('');
              }}
              error={errors.name}
              required
            />

            <Input
              id="register-email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              icon={Mail}
              placeholder="e.g. siddharth@example.com"
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

            <Input
              id="register-phone"
              label="Phone Number"
              name="phone"
              type="tel"
              autoComplete="tel"
              icon={Phone}
              placeholder="e.g. +91 98200 44332"
              value={formData.phone}
              disabled={isSubmitting}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (errors.phone) setErrors({ ...errors, phone: '' });
                if (serverError) setServerError('');
              }}
              error={errors.phone}
            />

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm-password" className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    if (serverError) setServerError('');
                  }}
                  className={`w-full rounded-xl bg-white border ${
                    errors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-sage focus:border-forest'
                  } py-2.5 pl-10 pr-10 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/40 shadow-sm disabled:opacity-60`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-mutedText hover:text-forest"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full mt-3"
            >
              Create Account
            </Button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 pt-6 border-t border-sage/40 text-center text-xs text-mutedText">
            <span>Already have an account? </span>
            <Link to="/login" className="font-semibold text-forest hover:text-gold transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
