import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { isValidEmail, isValidPhone } from '../../utils/validation';

export default function AgentApply() {
  const navigate = useNavigate();
  const {
    agentUser,
    isAdvisor,
    isPendingAdvisor,
    applyForAdvisor,
    agentRegister,
    isFirebaseConfigured,
  } = useAgentAuth();
  const currentUser = agentUser;

  const [formData, setFormData] = useState({
    name: agentUser?.displayName || '',
    email: agentUser?.email || '',
    phone: '',
    password: '',
    agency: '',
    licenseNumber: '',
    experienceYears: '',
    serviceLocations: '',
    specialties: '',
    bio: '',
    agreeToEthics: false,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // If already approved as an advisor
  if (currentUser && isAdvisor) {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-charcoal">
          Already an Accredited Advisor
        </h2>
        <p className="text-xs sm:text-sm text-mutedText">
          Your account has active advisor credentials and full workspace access.
        </p>
        <div className="pt-2">
          <Link to="/agent/dashboard">
            <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
              Go to Advisor Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If application is already pending
  if (currentUser && isPendingAdvisor) {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-charcoal">
          Application Already Submitted
        </h2>
        <p className="text-xs sm:text-sm text-mutedText">
          Your advisor application for <strong className="text-forest">{currentUser.email}</strong> is currently under editorial review.
        </p>
        <div className="pt-2">
          <Link to="/agent/pending">
            <Button variant="primary" size="md">
              View Application Status
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) errs.name = 'Full legal name is required';

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!isValidEmail(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!currentUser && !formData.password) {
      errs.password = 'Password is required to create your authenticated account';
    } else if (!currentUser && formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone)) {
      errs.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.agency.trim()) errs.agency = 'Brokerage or agency firm name is required';
    if (!formData.licenseNumber.trim()) errs.licenseNumber = 'RERA or real estate license number is required';

    const exp = Number(formData.experienceYears);
    if (isNaN(exp) || exp < 1) {
      errs.experienceYears = 'Please specify at least 1 year of professional experience';
    }

    if (!formData.bio.trim() || formData.bio.trim().length < 25) {
      errs.bio = 'Please provide a brief professional summary (minimum 25 characters)';
    }

    if (!formData.agreeToEthics) {
      errs.agreeToEthics = 'You must agree to the EstateVista Luxury Code of Ethics';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      // 1. If not authenticated, first register an account with role: 'customer'
      if (!currentUser) {
        if (!isFirebaseConfigured) {
          throw new Error('Firebase credentials are not configured in .env.local.');
        }
        await agentRegister({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          accountType: 'owner_agent',
        });
      }

      // 2. Submit the advisor accreditation application
      const parsedLocations = formData.serviceLocations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const parsedSpecialties = formData.specialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await applyForAdvisor({
        name: formData.name,
        phone: formData.phone,
        agency: formData.agency,
        licenseNumber: formData.licenseNumber,
        experienceYears: Number(formData.experienceYears),
        serviceLocations: parsedLocations,
        specialties: parsedSpecialties,
        bio: formData.bio,
      });

      // 3. Navigate to pending review page
      navigate('/agent/pending');
    } catch (err) {
      console.error('Failed to submit application:', err);
      setServerError(err.message || 'An error occurred while submitting your application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold/15 text-forest border border-gold/40">
          <Award className="w-4 h-4 text-gold" />
          <span>Accreditation Application</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal">
          Apply to Become an EstateVista Advisor
        </h1>
        <p className="text-xs sm:text-sm text-mutedText max-w-xl mx-auto leading-relaxed">
          Submit your professional credentials and brokerage details. Every application undergoes editorial and regulatory verification before workspace activation.
        </p>
      </div>

      {serverError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Main Application Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identity & Authentication */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage shadow-card space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sage/60">
            <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                1. Professional Identity
              </h3>
              <p className="text-xs text-mutedText">
                {currentUser ? `Linked to authenticated account (${currentUser.email})` : 'Create your authenticated login and personal profile'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="agent-apply-name"
              label="Full Legal Name"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Vikramaditya Singhania"
              required
              error={errors.name}
            />

            <Input
              id="agent-apply-email"
              label="Professional Email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g. vikram@singhaniarealty.demo"
              disabled={Boolean(currentUser)}
              required
              error={errors.email}
              helperText={currentUser ? 'Using active signed-in email address' : null}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="agent-apply-phone"
              label="Direct Mobile / WhatsApp"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g. +91 98201 12345"
              required
              error={errors.phone}
            />

            {!currentUser && (
              <Input
                id="agent-apply-password"
                label="Create Account Password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="At least 8 characters"
                required
                error={errors.password}
                helperText="Required to sign in to check your application status"
              />
            )}
          </div>
        </div>

        {/* Section 2: Brokerage & Regulatory Credentials */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage shadow-card space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sage/60">
            <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                2. Brokerage & Regulatory Verification
              </h3>
              <p className="text-xs text-mutedText">
                Government license and agency accreditation details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="agent-apply-agency"
              label="Agency / Brokerage Firm Name"
              name="agency"
              autoComplete="organization"
              value={formData.agency}
              onChange={handleInputChange}
              placeholder="e.g. Singhania Luxury Estates Pvt Ltd"
              required
              error={errors.agency}
            />

            <Input
              id="agent-apply-license"
              label="RERA / Real Estate License Number"
              name="licenseNumber"
              autoComplete="off"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              placeholder="e.g. MAHARERA-A51900012345"
              required
              error={errors.licenseNumber}
            />
          </div>

          <Input
            id="agent-apply-experience"
            label="Years of Experience in Luxury Real Estate"
            name="experienceYears"
            type="number"
            autoComplete="off"
            value={formData.experienceYears}
            onChange={handleInputChange}
            placeholder="e.g. 8"
            required
            error={errors.experienceYears}
          />
        </div>

        {/* Section 3: Market Focus & Bio */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage shadow-card space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sage/60">
            <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                3. Market Focus & Track Record
              </h3>
              <p className="text-xs text-mutedText">
                Operating localities, property categories, and professional bio
              </p>
            </div>
          </div>

          <Input
            id="agent-apply-locations"
            label="Primary Service Locations (Comma-separated)"
            name="serviceLocations"
            autoComplete="off"
            value={formData.serviceLocations}
            onChange={handleInputChange}
            placeholder="e.g. Mumbai, Bandra West, Worli, Juhu"
            helperText="Separate multiple localities with commas"
          />

          <Input
            id="agent-apply-specialties"
            label="Specialties & Categories (Comma-separated)"
            name="specialties"
            autoComplete="off"
            value={formData.specialties}
            onChange={handleInputChange}
            placeholder="e.g. Penthouses, Seafront Duplexes, Heritage Bungalows"
            helperText="Separate multiple specialties with commas"
          />

          <div>
            <label htmlFor="agent-apply-bio" className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
              Professional Track Record / Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              id="agent-apply-bio"
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Brief summary of your luxury advisory background, landmark transactions represented, or clientele focus..."
              className={`w-full p-3.5 rounded-xl bg-white border ${
                errors.bio ? 'border-red-400 focus:border-red-500' : 'border-sage focus:border-forest'
              } text-xs sm:text-sm text-charcoal placeholder-mutedText/60 focus:outline-none focus:ring-1 focus:ring-forest transition-colors`}
            />
            {errors.bio && <p className="mt-1 text-xs text-red-600 font-medium">{errors.bio}</p>}
          </div>
        </div>

        {/* Section 4: Ethics Commitment & Notice */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage shadow-card space-y-4">
          <div className="p-4 rounded-2xl bg-sage-light/70 border border-sage text-xs text-charcoal space-y-2">
            <div className="flex items-center gap-2 font-bold text-forest">
              <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
              <span>Review Policy & Separation of Privilege</span>
            </div>
            <p className="leading-relaxed">
              Submitting an application registers your candidacy in our verification queue. Submissions are strictly pending until reviewed by the EstateVista platform administrator. An unapproved account retains customer privileges and cannot access protected listing publishing endpoints.
            </p>
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="agreeToEthics"
                checked={formData.agreeToEthics}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 rounded text-forest focus:ring-forest border-sage"
              />
              <span className="text-xs text-charcoal/80 leading-relaxed">
                I certify that the information provided is accurate and that I am licensed to represent luxury real estate transactions in accordance with local regulations and the EstateVista Code of Ethics.
              </span>
            </label>
            {errors.agreeToEthics && (
              <p className="mt-1 text-xs text-red-600 font-medium pl-7">{errors.agreeToEthics}</p>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link to="/agent/portal" className="text-xs font-semibold text-mutedText hover:text-forest">
            ← Return to Advisor Portal Gateway
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            isLoading={submitting}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Submit Application for Review
          </Button>
        </div>
      </form>
    </div>
  );
}
