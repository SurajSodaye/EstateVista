import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Building2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { isValidEmail } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authService';

export default function ForgotPassword() {
  const { resetPassword, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setError('');

    if (!email) {
      setError('Email address is required');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isFirebaseConfigured) {
      setServerError('Firebase credentials have not been configured yet. Please add your credentials from the Firebase Console to .env.local.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setIsSubmitted(true);
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
            Password Recovery
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Enter your email to receive recovery instructions
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/60 shadow-card">
          {serverError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {!isFirebaseConfigured && !serverError && (
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

          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-forest text-gold flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-forest">
                Recovery Email Sent
              </h3>
              <p className="text-xs text-charcoal/80 leading-relaxed">
                If an account is associated with <strong className="text-forest">{email}</strong>, a password reset link has been dispatched. Please inspect your inbox and spam folders.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="outline" size="md" className="w-full text-xs">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="forgot-password-email"
                label="Registered Email"
                name="email"
                type="email"
                autoComplete="email"
                icon={Mail}
                placeholder="e.g. yourname@domain.com"
                value={email}
                disabled={isSubmitting}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                  if (serverError) setServerError('');
                }}
                error={error}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="w-full mt-2"
              >
                Send Recovery Link
              </Button>

              <div className="pt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-mutedText hover:text-forest transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
