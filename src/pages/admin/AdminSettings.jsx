import React, { useState, useEffect } from 'react';
import {
  Sliders,
  User,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Clock,
  Lock,
  Key,
  Save,
  Copy,
  Check,
  Sparkles,
  Bell,
  Scale,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { updateFirestoreAdminPreferences } from '../../services/adminFirestoreService';
import { sendPasswordReset } from '../../services/authService';

export default function AdminSettings() {
  const { adminUser, adminProfile } = useAdminAuth();
  const currentUser = adminUser;
  const userProfile = adminProfile;

  // Settings State Form
  const [formData, setFormData] = useState({
    // 1. Console Display Preferences
    currencyFormat: 'inr_cr',
    pageSize: '10',
    dateFormat: 'dd_mm_yyyy',

    // 2. Platform Governance & Moderation
    requireListingApproval: true,
    requireAdvisorAccreditation: true,
    autoArchivePeriod: '180',
    featuredShowcaseLimit: '6',

    // 3. Lead & Inquiry Routing
    conciergeEmail: 'concierge@estatevista.luxury',
    notificationMode: 'immediate',
    autoAssignToAdvisor: true,
    highValueThreshold: '10cr',

    // 4. Agency & RERA Statutory Information
    officeAddress: 'Level 14, Crest Tower, BKC, Mumbai — 400051',
    hotlinePhone: '+91 (022) 6780 9000',
    reraRegistrationNumber: 'MahaRERA: A51900028472',
    operatingHours: 'Mon – Sat: 9:00 AM – 8:00 PM IST',

    // 5. Security & Session
    sessionTimeout: '4h',
  });

  const [notification, setNotification] = useState('');
  const [copiedUid, setCopiedUid] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // Load saved preferences from localStorage and adminProfile
  useEffect(() => {
    const saved = localStorage.getItem('estatevista_admin_prefs');
    let parsedLocal = {};
    if (saved) {
      try {
        parsedLocal = JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse admin prefs from localStorage', e);
      }
    }

    const firestorePrefs = adminProfile?.adminPreferences || {};
    setFormData((prev) => ({
      ...prev,
      ...parsedLocal,
      ...firestorePrefs,
    }));
  }, [adminProfile]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCopyUid = () => {
    const uid = currentUser?.uid || '';
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2500);
  };

  const handleSaveAllSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSettings(true);

    // 1. Local backup
    localStorage.setItem('estatevista_admin_prefs', JSON.stringify(formData));

    // 2. Persist in Cloud Firestore under /users/{adminUid}.adminPreferences
    if (adminUser?.uid) {
      await updateFirestoreAdminPreferences(adminUser.uid, formData);
    }

    setSavingSettings(false);
    setNotification('Administrative settings and platform governance policies saved successfully.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setNotification(''), 4500);
  };

  const handleSendPasswordReset = async () => {
    const email = currentUser?.email;
    if (!email) return;

    setSendingReset(true);
    try {
      await sendPasswordReset(email);
      setNotification(`Password recovery instructions dispatched to ${email}. Check your inbox.`);
      setTimeout(() => setNotification(''), 5000);
    } catch (err) {
      console.error('Password reset error:', err);
      setNotification('Unable to send password reset link at this time. Please try again.');
      setTimeout(() => setNotification(''), 5000);
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Title & Description */}
      <div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
          Admin Settings
        </h2>
        <p className="text-xs text-mutedText mt-0.5">
          Configure platform governance, listing moderation, lead routing, agency credentials, and operations preferences
        </p>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. ACTIVE ADMINISTRATOR PROFILE CARD                     */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-sage/40">
          <div className="w-9 h-9 rounded-xl bg-forest text-gold flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-charcoal">
              Active Administrator Profile
            </h3>
            <p className="text-[11px] text-mutedText">
              Authenticated credentials verified against Firebase Authentication and Cloud Firestore
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-ivory border border-sage/60">
            <span className="text-[10px] uppercase font-bold text-mutedText block">Admin Name</span>
            <span className="font-bold text-charcoal text-sm">
              {userProfile?.name || currentUser?.displayName || 'System Administrator'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-ivory border border-sage/60">
            <span className="text-[10px] uppercase font-bold text-mutedText block">Verified Email</span>
            <span className="font-bold text-forest text-sm truncate block" title={currentUser?.email}>
              {currentUser?.email || 'admin@estatevista.luxury'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-ivory border border-sage/60">
            <span className="text-[10px] uppercase font-bold text-mutedText block">Security Role</span>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C7A76C]/30 text-forest border border-[#C7A76C] mt-1">
              {userProfile?.role || 'admin'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-ivory border border-sage/60 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-mutedText block">User UID</span>
              <span className="font-mono text-[11px] text-charcoal truncate block mt-0.5" title={currentUser?.uid}>
                {currentUser?.uid ? `${currentUser.uid.slice(0, 10)}...` : 'local-admin-uid'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyUid}
              className="p-1.5 rounded-lg bg-white border border-sage hover:bg-sage/40 text-charcoal transition-colors shrink-0"
              title="Copy User UID"
            >
              {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveAllSettings} className="space-y-8">
        {/* ======================================================== */}
        {/* 2. PLATFORM GOVERNANCE & MODERATION POLICIES            */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-sage/40">
            <div className="w-9 h-9 rounded-xl bg-sage-light text-forest flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-charcoal">
                Platform Moderation & Listing Governance
              </h3>
              <p className="text-[11px] text-mutedText">
                Control property publication prerequisites and advisor verification rules
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Toggle 1: Mandatory Admin Approval */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-ivory border border-sage/60">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-charcoal">
                  Mandatory Property Moderation Review
                </p>
                <p className="text-[11px] text-mutedText">
                  When enabled, all listings submitted by advisors must be reviewed and approved by an administrator before appearing on the public website.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.requireListingApproval}
                  onChange={(e) => handleInputChange('requireListingApproval', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-sage peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
              </label>
            </div>

            {/* Toggle 2: Strict Advisor Accreditation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-ivory border border-sage/60">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-charcoal">
                  Enforce RERA Advisor Accreditation
                </p>
                <p className="text-[11px] text-mutedText">
                  Require newly registered real estate advisors to provide verified RERA broker credentials before their profile and listings can be activated.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.requireAdvisorAccreditation}
                  onChange={(e) => handleInputChange('requireAdvisorAccreditation', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-sage peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
              </label>
            </div>

            {/* Dropdowns: Auto Archive & Featured Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Listing Inactivity Auto-Archive
                </label>
                <select
                  value={formData.autoArchivePeriod}
                  onChange={(e) => handleInputChange('autoArchivePeriod', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
                >
                  <option value="90">Archive after 90 days of inactivity</option>
                  <option value="180">Archive after 180 days (6 months)</option>
                  <option value="365">Archive after 365 days (1 year)</option>
                  <option value="never">Never auto-archive (Manual only)</option>
                </select>
                <p className="text-[10px] text-mutedText mt-1">Archived properties are hidden from search without data loss.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Homepage Featured Showcase Capacity
                </label>
                <select
                  value={formData.featuredShowcaseLimit}
                  onChange={(e) => handleInputChange('featuredShowcaseLimit', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
                >
                  <option value="4">4 Trophy Residences</option>
                  <option value="6">6 Trophy Residences (Default)</option>
                  <option value="8">8 Trophy Residences</option>
                  <option value="12">12 Trophy Residences</option>
                </select>
                <p className="text-[10px] text-mutedText mt-1">Determines how many featured homes rotate on the public home page.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. LEAD ROUTING & INQUIRY CONCIERGE                     */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-sage/40">
            <div className="w-9 h-9 rounded-xl bg-sage-light text-forest flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-charcoal">
                Client Inquiry & Lead Routing Configuration
              </h3>
              <p className="text-[11px] text-mutedText">
                Configure concierge dispatch, notification frequency, and VIP inquiry thresholds
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Concierge Forwarding Email
              </label>
              <input
                type="email"
                value={formData.conciergeEmail}
                onChange={(e) => handleInputChange('conciergeEmail', e.target.value)}
                placeholder="e.g. concierge@estatevista.luxury"
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
              />
              <p className="text-[10px] text-mutedText mt-1">General concierge inquiries will be forwarded to this address.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Lead Notification Frequency
              </label>
              <select
                value={formData.notificationMode}
                onChange={(e) => handleInputChange('notificationMode', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
              >
                <option value="immediate">Immediate Dispatch (Instant Alert per Lead)</option>
                <option value="daily">Daily Digest Summary (Delivered at 9:00 AM)</option>
                <option value="console">In-App Console Only (No External Emails)</option>
              </select>
              <p className="text-[10px] text-mutedText mt-1">Controls how administrators receive alert updates.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-ivory border border-sage/60">
              <div>
                <p className="font-bold text-charcoal text-xs">Direct Advisor Lead Routing</p>
                <p className="text-[10px] text-mutedText">Automatically route listing inquiries to the assigned advisor</p>
              </div>
              <input
                type="checkbox"
                checked={formData.autoAssignToAdvisor}
                onChange={(e) => handleInputChange('autoAssignToAdvisor', e.target.checked)}
                className="w-4 h-4 text-forest rounded accent-forest cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                High-Value Lead Priority Alert Flag
              </label>
              <select
                value={formData.highValueThreshold}
                onChange={(e) => handleInputChange('highValueThreshold', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
              >
                <option value="5cr">Flag inquiries on homes above ₹5 Crores</option>
                <option value="10cr">Flag inquiries on homes above ₹10 Crores (VIP)</option>
                <option value="25cr">Flag inquiries on trophy estates above ₹25 Crores</option>
                <option value="all">Mark all inquiries as standard priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. AGENCY & REGULATORY COMPLIANCE DETAILS (RERA & OFFICE) */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-sage/40">
            <div className="w-9 h-9 rounded-xl bg-sage-light text-forest flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-charcoal">
                Agency Brand & Statutory RERA Compliance
              </h3>
              <p className="text-[11px] text-mutedText">
                Official brokerage disclosures, office address, and regulatory registration
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-forest" />
                <span>Corporate Headquarters Address</span>
              </label>
              <input
                type="text"
                value={formData.officeAddress}
                onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-forest" />
                <span>Concierge Telephone Hotline</span>
              </label>
              <input
                type="text"
                value={formData.hotlinePhone}
                onChange={(e) => handleInputChange('hotlinePhone', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-forest" />
                <span>Broker RERA Registration Number</span>
              </label>
              <input
                type="text"
                value={formData.reraRegistrationNumber}
                onChange={(e) => handleInputChange('reraRegistrationNumber', e.target.value)}
                placeholder="e.g. MahaRERA: A51900028472"
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
              />
              <p className="text-[10px] text-mutedText mt-1">Statutory real estate regulatory authority registration identifier.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-forest" />
                <span>Operating Hours</span>
              </label>
              <input
                type="text"
                value={formData.operatingHours}
                onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. CONSOLE DISPLAY & REGIONAL PREFERENCES                */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-sage/40">
            <div className="w-9 h-9 rounded-xl bg-sage-light text-forest flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-charcoal">
                Operations Console Preferences
              </h3>
              <p className="text-[11px] text-mutedText">
                Configure valuation currency formatting, table page size, and regional timestamps
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Valuation Currency Display
              </label>
              <select
                value={formData.currencyFormat}
                onChange={(e) => handleInputChange('currencyFormat', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
              >
                <option value="inr_cr">Indian Rupee (₹ Crores / Lakhs)</option>
                <option value="usd">US Dollar ($ Millions)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Default Records Per Page
              </label>
              <select
                value={formData.pageSize}
                onChange={(e) => handleInputChange('pageSize', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
              >
                <option value="10">10 Records per page</option>
                <option value="25">25 Records per page</option>
                <option value="50">50 Records per page</option>
                <option value="100">100 Records per page</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Timestamp Date Format
              </label>
              <select
                value={formData.dateFormat}
                onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
              >
                <option value="dd_mm_yyyy">DD/MM/YYYY (Indian Standard)</option>
                <option value="mm_dd_yyyy">MM/DD/YYYY (US Format)</option>
                <option value="iso">YYYY-MM-DD (ISO 8601)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. ADMIN SECURITY & SESSION CONTROLS                    */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-sage/40">
            <div className="w-9 h-9 rounded-xl bg-sage-light text-forest flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-charcoal">
                Security & Session Management
              </h3>
              <p className="text-[11px] text-mutedText">
                Session duration thresholds and administrator credential recovery
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs items-center">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Session Inactivity Timeout
              </label>
              <select
                value={formData.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
              >
                <option value="30m">30 Minutes of Inactivity</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours (Standard)</option>
                <option value="8h">8 Hours (Full Shift)</option>
                <option value="none">Keep session active indefinitely</option>
              </select>
              <p className="text-[10px] text-mutedText mt-1">Automatic sign-out when the browser tab is left unattended.</p>
            </div>

            <div className="p-4 rounded-xl bg-ivory border border-sage/60 space-y-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-forest" />
                <span className="font-bold text-charcoal text-xs">Admin Password Recovery</span>
              </div>
              <p className="text-[11px] text-mutedText leading-relaxed">
                Send a secure password reset link directly to your verified email address ({currentUser?.email || 'admin@gmail.com'}).
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendPasswordReset}
                isLoading={sendingReset}
                disabled={sendingReset}
                className="text-xs"
              >
                Send Password Reset Email
              </Button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BOTTOM SAVE BAR                                         */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl p-5 border border-sage/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-10 backdrop-blur-md bg-white/95">
          <div className="flex items-center gap-2 text-xs text-mutedText text-center sm:text-left">
            <Sparkles className="w-4 h-4 text-gold shrink-0" />
            <span>Changes will synchronize immediately across your operations console.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              isLoading={savingSettings}
              disabled={savingSettings}
              className="w-full sm:w-auto shadow-sm px-6"
            >
              {savingSettings ? 'Saving Settings...' : 'Save All Settings'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
