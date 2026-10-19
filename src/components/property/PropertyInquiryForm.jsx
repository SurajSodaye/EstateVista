import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, User, Mail, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import Button from '../common/Button';
import Input from '../common/Input';
import { validateInquiryForm } from '../../utils/validation';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

function isLikelyFirebaseUid(uid) {
  if (!uid || typeof uid !== 'string') return false;
  const trimmed = uid.trim();
  if (/^(agent-\d+|demo|mock|advisor$)/i.test(trimmed)) return false;
  return trimmed.length >= 20 && !trimmed.includes(' ');
}

export default function PropertyInquiryForm({
  propertyTitle = 'this property',
  agentName = 'the property advisor',
  propertyId,
  advisorUid,
  propertyThumbnail,
  propertyLocation,
  propertyPrice,
  propertyListingType,
}) {
  const { currentUser, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Hello, I am interested in exploring ${propertyTitle} (Ref: ${propertyId || 'Listing'}). Please share further architectural floorplans and arrange a private tour.`,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Auto-populate customer credentials if authenticated
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || userProfile?.name || currentUser.displayName || '',
        email: prev.email || currentUser.email || '',
        phone: prev.phone || userProfile?.phone || '',
      }));
    }
  }, [currentUser, userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateInquiryForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const isRealUid = isLikelyFirebaseUid(advisorUid);
      const effectiveAdvisorUid = isRealUid ? advisorUid.trim() : '';
      const effectiveAdvisorName = agentName ? agentName.trim() : '';
      const nowIso = new Date().toISOString();

      const payload = {
        customerUid: currentUser?.uid || '',
        advisorUid: effectiveAdvisorUid,
        assignedAgentName: effectiveAdvisorName,
        propertyId: propertyId ? String(propertyId) : '',
        propertyTitle: propertyTitle || 'Exclusive Property Listing',
        propertyThumbnail: propertyThumbnail || null,
        propertyLocation: propertyLocation || '',
        propertyPrice: propertyPrice || null,
        propertyListingType: propertyListingType || null,
        subject: propertyTitle ? `Inquiry: ${propertyTitle}` : 'Property Inquiry',
        clientName: formData.name.trim(),
        name: formData.name.trim(),
        clientEmail: formData.email.trim(),
        senderEmail: formData.email.trim(),
        clientPhone: formData.phone.trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim(),
        status: 'new',
        agentNotes: '',
        adminNotes: '',
        customerVisibleNote: '',
        customerVisibleNoteUpdatedAt: null,
        customerVisibleNoteUpdatedByRole: null,
        customerVisibleNoteUpdatedByName: null,
        isRead: false,
        source: 'property_inquiry',
        createdAt: nowIso,
        date: nowIso,
        updatedAt: nowIso,
      };

      if (!isFirebaseConfigured || !db) {
        throw new Error('Database connection is not configured. Please contact our concierge directly.');
      }

      await addDoc(collection(db, 'inquiries'), payload);

      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit property inquiry:', err);
      setSubmitError(err.message || 'Unable to transmit inquiry. Please verify your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubmitError('');
    setFormData({
      name: currentUser ? (userProfile?.name || currentUser.displayName || '') : '',
      email: currentUser ? (currentUser.email || '') : '',
      phone: currentUser ? (userProfile?.phone || '') : '',
      message: `Hello, I am interested in exploring ${propertyTitle}. Please share further architectural floorplans.`,
    });
  };

  if (isSubmitted) {
    return (
      <div className="bg-sage-light/60 border border-sage rounded-2xl p-6 text-center animate-fadeIn">
        <div className="w-12 h-12 rounded-full bg-forest text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-gold" />
        </div>
        <h4 className="font-serif text-lg font-bold text-forest mb-2">
          Inquiry Successfully Delivered
        </h4>
        <p className="text-xs text-charcoal/80 leading-relaxed mb-4">
          Thank you, <strong className="text-forest">{formData.name}</strong>. Your inquiry has been routed directly to <strong className="text-forest">{agentName || 'the property advisor'}</strong> in real-time.
        </p>
        <div className="bg-white/80 rounded-xl p-3 text-xs text-mutedText text-left border border-sage/60 mb-5 space-y-1">
          <p className="text-forest font-medium">
            ✓ Message recorded in EstateVista Advisor Portal
          </p>
          <p className="text-[11px] text-mutedText">
            The listing advisor will review your preferred walkthrough schedule and reach out to you directly at <span className="font-semibold text-charcoal">{formData.email}</span>.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="w-full text-xs">
          Submit Another Inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div>
        <Input
          id="inquiry-name"
          label="Your Name"
          name="name"
          autoComplete="name"
          icon={User}
          placeholder="e.g. Vikramaditya Oberoi"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
      </div>

      <div>
        <Input
          id="inquiry-email"
          label="Email Address"
          name="email"
          type="email"
          autoComplete="email"
          icon={Mail}
          placeholder="e.g. vikram@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
      </div>

      <div>
        <Input
          id="inquiry-phone"
          label="Phone Number"
          name="phone"
          type="tel"
          autoComplete="tel"
          icon={Phone}
          placeholder="e.g. +91 98200 12345"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
          Inquiry Message <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className={`w-full rounded-xl bg-white border ${
              errors.message ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-sage focus:border-forest focus:ring-sage/40'
            } p-3 text-xs sm:text-sm text-charcoal focus:outline-none focus:ring-2 resize-none shadow-sm`}
          />
        </div>
        {errors.message && <p className="mt-1 text-xs text-red-600 font-medium">{errors.message}</p>}
      </div>

      <div className="pt-1">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          icon={Send}
          className="w-full"
        >
          Send Inquiry to {agentName ? agentName.split(' ')[0] : 'Advisor'}
        </Button>
      </div>

      <p className="text-[11px] text-mutedText text-center leading-normal">
        By submitting, you agree to EstateVista terms and privacy policy. Your inquiry is securely delivered to the listing advisor.
      </p>
    </form>
  );
}
