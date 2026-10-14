import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { validateContactForm } from '../utils/validation';
import { db, isFirebaseConfigured } from '../lib/firebase';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedSubject, setSubmittedSubject] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'How does EstateVista verify luxury properties?',
      a: 'In our upcoming production release with Firebase, every listing undergoes a strict three-tier verification protocol: Title Deed check, RERA registration validation, and physical site documentation by certified regional partners.',
    },
    {
      q: 'Can property owners list directly on EstateVista?',
      a: 'Yes, in Phase 2, property owners and certified developers can onboard their residences via a dedicated owner portal with document uploads and image galleries.',
    },
    {
      q: 'How can I schedule a private property viewing?',
      a: 'Browse to any listing and submit an inquiry through the property details page. The designated advisor will respond within 24 business hours to arrange a confidential walk-through.',
    },
    {
      q: 'Are there listing fees for prospective buyers or tenants?',
      a: 'Browsing, searching, and submitting direct inquiries on EstateVista is completely free for prospective buyers and tenants.',
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const validation = validateContactForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const currentSubject = formData.subject.trim();
      const payload = {
        clientName: formData.name.trim(),
        name: formData.name.trim(),
        clientEmail: formData.email.trim(),
        senderEmail: formData.email.trim(),
        clientPhone: formData.phone.trim(),
        phone: formData.phone.trim(),
        subject: currentSubject,
        message: formData.message.trim(),
        propertyId: null,
        propertyTitle: 'General Concierge Inquiry',
        advisorUid: '',
        assignedAgentName: '',
        status: 'new',
        agentNotes: '',
        adminNotes: '',
        isRead: false,
        createdAt: nowIso,
        date: nowIso,
        updatedAt: nowIso,
        source: 'contact_form',
      };

      if (!isFirebaseConfigured || !db) {
        throw new Error('Database service is not configured. Please contact our concierge directly.');
      }

      await addDoc(collection(db, 'inquiries'), payload);

      setSubmittedSubject(currentSubject);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setErrors({});
    } catch (err) {
      console.error('Failed to submit contact inquiry:', err);
      setSubmitError(err.message || 'Unable to submit your inquiry at this time. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block">
          Get in Touch
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-charcoal">
          Contact Our Private Concierge
        </h1>
        <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
          Whether you are looking to acquire a trophy asset, lease a high-rise residence, or partner as an accredited advisor, our team is at your disposal.
        </p>
      </div>

      {/* Main Grid: Contact Info + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column: Office Placeholders */}
        <div className="space-y-6">
          <div className="bg-forest text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-soft">
            <h3 className="font-serif text-xl font-bold text-white">
              Demonstration Headquarters
            </h3>
            <p className="text-xs text-sage/80 leading-relaxed">
              Our central concierge team coordinates private viewings and advisor appointments across all six metro locations.
            </p>

            <div className="space-y-4 text-xs text-sage/90 pt-4 border-t border-forest-light">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Corporate Office (Placeholder):</strong>
                  <span>Level 14, Crest Tower, BKC, Mumbai — 400051</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <div>
                  <strong className="text-white block">Concierge Desk:</strong>
                  <span>+91 (022) 6780 9000</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <div>
                  <strong className="text-white block">Direct Inquiries:</strong>
                  <span>concierge@estatevista.demo</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gold shrink-0" />
                <div>
                  <strong className="text-white block">Hours of Operation:</strong>
                  <span>Mon – Sat: 9:00 AM – 7:30 PM IST</span>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Representative Desk Placeholder */}
          <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-soft space-y-3 text-xs">
            <h4 className="font-serif text-base font-bold text-charcoal">
              Regional Representative Desks
            </h4>
            <div className="space-y-2 text-mutedText">
              <p><strong>Bengaluru:</strong> 100 Feet Road, Indiranagar</p>
              <p><strong>Delhi NCR:</strong> DLF Phase 5, Golf Course Road</p>
              <p><strong>North Goa:</strong> Badem Junction, Assagao</p>
            </div>
            <p className="text-[11px] text-mutedText pt-2 border-t border-sage/40">
              * Note: Contact numbers & addresses are demonstration placeholders for this development phase.
            </p>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-10 border border-sage/60 shadow-soft">
          <h2 className="font-serif text-2xl font-bold text-charcoal mb-2">
            Send a Private Message
          </h2>
          <p className="text-xs sm:text-sm text-mutedText mb-8">
            Please fill out your details and your inquiry subject. Our demonstration form will validate your inputs in real time.
          </p>

          {isSubmitted ? (
            <div className="bg-sage-light/60 border border-sage rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-forest text-gold flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-forest">
                Inquiry Successfully Transmitted
              </h3>
              <p className="text-sm text-charcoal/80 max-w-md mx-auto">
                Thank you. Your message titled <em>"{submittedSubject || 'General Concierge Inquiry'}"</em> has been securely transmitted and logged in our concierge inquiry system.
              </p>
              <div className="bg-white rounded-xl p-4 text-xs text-mutedText max-w-lg mx-auto text-left border border-sage space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-forest">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Logged to EstateVista Concierge</span>
                </div>
                <p>
                  Our accredited luxury property advisors review new inquiries within 24 business hours. A confirmation has been recorded in our directory.
                </p>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setIsSubmitted(false);
                  setSubmittedSubject('');
                  setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Transmission Failed</p>
                    <p>{submitError}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  id="contact-name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  placeholder="e.g. Rohini Mehta"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                />
                <Input
                  id="contact-email"
                  label="Email Address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. rohini@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  id="contact-phone"
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="e.g. +91 98200 55443"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                />
                <Input
                  id="contact-subject"
                  label="Subject"
                  name="subject"
                  placeholder="e.g. Acquiring a sea-facing penthouse in Bandra"
                  value={formData.subject}
                  onChange={handleChange}
                  error={errors.subject}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  rows={5}
                  placeholder="Please describe your acquisition or listing requirement in detail..."
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full rounded-xl bg-white border ${
                    errors.message ? 'border-red-400 focus:border-red-500' : 'border-sage focus:border-forest'
                  } p-3.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/40 shadow-sm`}
                />
                {errors.message && <p className="mt-1 text-xs text-red-600 font-medium">{errors.message}</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                icon={Send}
                className="w-full sm:w-auto"
              >
                Submit Inquiry
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="max-w-4xl mx-auto pt-8 border-t border-sage/60 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-mutedText">
            Answers to common questions regarding EstateVista's discovery model and upcoming features.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-sage/60 overflow-hidden shadow-soft transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-serif text-base sm:text-lg font-semibold text-charcoal hover:text-forest transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-forest shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-charcoal/80 leading-relaxed border-t border-sage/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
