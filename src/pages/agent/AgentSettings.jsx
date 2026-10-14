import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Eye,
  Globe,
  RotateCcw,
  CheckCircle2,
  Save,
  Shield,
  Info,
} from 'lucide-react';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import {
  getAgentSettings,
  updateAgentSettings,
} from '../../services/agentPortalService';

export default function AgentSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    getAgentSettings().then((data) => {
      if (isMounted) {
        setSettings(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingState message="Loading portal preferences..." />;
  }

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelect = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      await updateAgentSettings(settings);
      setSuccessMessage('Portal preferences saved and synchronized to Cloud Firestore.');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      console.error('Failed to update agent settings:', err);
      setErrorMessage(err.message || 'Failed to update preferences in Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-charcoal tracking-tight">
          Portal Preferences & Settings
        </h2>
        <p className="text-xs sm:text-sm text-mutedText">
          Configure notification dispatch, regional formatting, and directory privacy.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
          <Info className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Communication Preferences */}
        <div className="bg-white rounded-2xl border border-sage p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-sage/60">
            <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                1. Client Inquiry Dispatch
              </h3>
              <p className="text-xs text-mutedText">
                Configure direct notifications when clients submit private walkthrough inquiries
              </p>
            </div>
          </div>

          <div className="divide-y divide-sage/40">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-charcoal">
                  Email Dispatch for Direct Inquiries
                </p>
                <p className="text-[11px] text-mutedText">
                  Receive email alerts at your registered advisor email when a prospective client inquires about your listings.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.emailNotifications)}
                onChange={() => handleToggle('emailNotifications')}
                className="w-4 h-4 rounded text-forest focus:ring-forest border-sage"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Directory & Privacy Preferences */}
        <div className="bg-white rounded-2xl border border-sage p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-sage/60">
            <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                2. Privacy & Directory Visibility
              </h3>
              <p className="text-xs text-mutedText">
                Control information shown on your public listings and directory card
              </p>
            </div>
          </div>

          <div className="divide-y divide-sage/40">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-charcoal">
                  Public Advisor Directory Listing
                </p>
                <p className="text-[11px] text-mutedText">
                  Display your profile card on the public `/agents` directory page.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.publicProfileVisible}
                onChange={() => handleToggle('publicProfileVisible')}
                className="w-4 h-4 rounded text-forest focus:ring-forest border-sage"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-charcoal">
                  Display Direct Phone Number Publicly
                </p>
                <p className="text-[11px] text-mutedText">
                  Allow buyers to call directly without routing through the inquiry concierge.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.showPhonePublicly}
                onChange={() => handleToggle('showPhonePublicly')}
                className="w-4 h-4 rounded text-forest focus:ring-forest border-sage"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Regional & Formatting Preferences */}
        <div className="bg-white rounded-2xl border border-sage p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-sage/60">
            <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                3. Currency & Measurement Units
              </h3>
              <p className="text-xs text-mutedText">
                Default unit formats for pricing and floor dimensions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
                Currency Notation
              </label>
              <select
                value={settings.currencyDisplay}
                onChange={(e) => handleSelect('currencyDisplay', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ivory/60 border border-sage text-xs focus:outline-none focus:border-forest"
              >
                <option value="INR">INR (₹ Indian Rupee — Cr / Lakh)</option>
                <option value="USD">USD ($ United States Dollar)</option>
                <option value="EUR">EUR (€ Euro)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
                Area Measurement Unit
              </label>
              <select
                value={settings.areaUnit}
                onChange={(e) => handleSelect('areaUnit', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ivory/60 border border-sage text-xs focus:outline-none focus:border-forest"
              >
                <option value="sqFt">Square Feet (sq.ft)</option>
                <option value="sqM">Square Meters (sq.m)</option>
                <option value="acres">Acres / Guntas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Security & Backend Boundary Notice */}
        <div className="bg-white rounded-2xl border border-sage p-6 shadow-soft space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-charcoal">
                Security & Role Authorization Notice
              </h4>
              <p className="text-xs text-mutedText leading-relaxed">
                Password changes and Multi-Factor Authentication (MFA) are managed directly through Firebase Authentication in accordance with our Phase 2 security architecture plan. Client-side role elevation is strictly prohibited.
              </p>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="bg-white rounded-2xl border border-sage p-4 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-mutedText text-center sm:text-left">
            Preferences are saved to your advisor profile document in Cloud Firestore.
          </p>

          <Button
            variant="primary"
            size="md"
            type="submit"
            icon={Save}
            isLoading={saving}
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
