import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Award,
  CheckCircle2,
  AlertCircle,
  Save,
  Sparkles,
  Info,
  Plus,
  X,
  Upload,
  ExternalLink,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingState from '../../components/common/LoadingState';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { getAgentProfile, updateAgentProfile, uploadAgentMedia } from '../../services/agentPortalService';

export default function AgentProfile() {
  const { agentUser, agentProfile, refreshAgentProfile } = useAgentAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Input states for tags
  const [newLocationInput, setNewLocationInput] = useState('');
  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');

  useEffect(() => {
    let isMounted = true;
    getAgentProfile().then((data) => {
      if (isMounted) {
        setProfile({
          ...data,
          serviceLocations: data?.serviceLocations || ['Mumbai', 'Bandra West'],
          specialties: data?.specialties || ['Luxury Penthouses'],
        });
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [agentUser?.uid]);

  if (loading) {
    return <LoadingState message="Loading your advisor credentials..." />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddLocation = () => {
    const trimmed = newLocationInput.trim();
    if (trimmed && !profile.serviceLocations.includes(trimmed)) {
      setProfile((prev) => ({
        ...prev,
        serviceLocations: [...prev.serviceLocations, trimmed],
      }));
      setNewLocationInput('');
    }
  };

  const handleRemoveLocation = (loc) => {
    setProfile((prev) => ({
      ...prev,
      serviceLocations: prev.serviceLocations.filter((l) => l !== loc),
    }));
  };

  const handleAddSpecialty = () => {
    const trimmed = newSpecialtyInput.trim();
    if (trimmed && !profile.specialties.includes(trimmed)) {
      setProfile((prev) => ({
        ...prev,
        specialties: [...prev.specialties, trimmed],
      }));
      setNewSpecialtyInput('');
    }
  };

  const handleRemoveSpecialty = (spec) => {
    setProfile((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((s) => s !== spec),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!profile.name?.trim()) errs.name = 'Full name is required';
    if (!profile.agency?.trim()) errs.agency = 'Agency name is required';
    if (!profile.title?.trim()) errs.title = 'Professional title is required';

    if (!profile.email?.trim()) {
      errs.email = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!profile.phone?.trim()) {
      errs.phone = 'Phone number is required';
    }

    const exp = Number(profile.experienceYears);
    if (isNaN(exp) || exp < 0) {
      errs.experienceYears = 'Experience must be a positive number';
    }

    if (!profile.bio?.trim()) {
      errs.bio = 'Professional bio is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Avatar image size must be under 5MB.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMessage('');
    try {
      const downloadUrl = await uploadAgentMedia(file, 'avatars');
      setProfile((prev) => ({ ...prev, avatar: downloadUrl }));
      setSuccessMessage('Avatar uploaded to Firebase Storage successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setErrorMessage('Failed to upload avatar to Firebase Storage: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setErrorMessage('');
    try {
      await updateAgentProfile(profile);
      await refreshAgentProfile();
      setSuccessMessage('Advisor profile successfully updated and synchronized to Firestore.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to update advisor profile:', err);
      setErrorMessage(err.message || 'Failed to save profile changes to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-charcoal tracking-tight">
            Advisor Public Profile
          </h2>
          <p className="text-xs sm:text-sm text-mutedText">
            Manage your professional presence, agency credentials, and client contact details.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Advisor Profile</span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Card Preview & Avatar Upload */}
        <div className="bg-white rounded-2xl border border-sage p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sage/60">
            <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                1. Identity & Portrait
              </h3>
              <p className="text-xs text-mutedText">
                Advisor portrait photograph and legal business identity
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <img
                src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={profile.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-forest/20 shadow-md"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
                }}
              />
              <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-forest text-gold rounded-full flex items-center justify-center border-2 border-white shadow text-[10px] font-bold">
                ✓
              </span>
            </div>

            <div className="flex-1 w-full space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sage-light hover:bg-sage text-forest text-xs font-semibold border border-sage transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingAvatar ? 'Uploading to Firebase Storage...' : 'Upload Image File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingAvatar}
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-mutedText">or paste image URL below</span>
              </div>
              <Input
                label="Portrait Image URL"
                name="avatar"
                value={profile.avatar || ''}
                onChange={handleInputChange}
                placeholder="https://images.unsplash.com/..."
                helperText="Upload a portrait file to Firebase Storage or enter a valid image URL."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Legal / Professional Name"
              name="name"
              value={profile.name || ''}
              onChange={handleInputChange}
              required
              error={errors.name}
            />

            <Input
              label="Professional Title"
              name="title"
              value={profile.title || ''}
              onChange={handleInputChange}
              placeholder="e.g. Principal Luxury Consultant"
              required
              error={errors.title}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Brokerage / Agency Firm"
              name="agency"
              value={profile.agency || ''}
              onChange={handleInputChange}
              required
              error={errors.agency}
            />

            <Input
              label="Experience (Years)"
              name="experienceYears"
              type="number"
              value={profile.experienceYears || ''}
              onChange={handleInputChange}
              required
              error={errors.experienceYears}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-sage p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sage/60">
            <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                2. Contact & Communications
              </h3>
              <p className="text-xs text-mutedText">
                Direct contact coordinates displayed to prospective buyers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Professional Email"
              name="email"
              type="email"
              value={profile.email || ''}
              onChange={handleInputChange}
              required
              error={errors.email}
            />

            <Input
              label="Direct Telephone / WhatsApp"
              name="phone"
              value={profile.phone || ''}
              onChange={handleInputChange}
              placeholder="+91 98201 00000"
              required
              error={errors.phone}
            />
          </div>
        </div>

        {/* Specialties & Service Locations */}
        <div className="bg-white rounded-2xl border border-sage p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sage/60">
            <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                3. Market Focus & Coverage
              </h3>
              <p className="text-xs text-mutedText">
                Target localities and luxury property competencies
              </p>
            </div>
          </div>

          {/* Service Locations Tags */}
          <div>
            <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-2">
              Service Locations
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.serviceLocations?.map((loc) => (
                <span
                  key={loc}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sage-light text-forest border border-sage"
                >
                  <span>{loc}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(loc)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add service location (e.g. Bandra West, Worli, Juhu)..."
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-ivory/60 border border-sage text-xs focus:outline-none focus:border-forest"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={handleAddLocation}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Specialties Tags */}
          <div>
            <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-2">
              Specialties & Expertise
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.specialties?.map((spec) => (
                <span
                  key={spec}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold/15 text-forest border border-gold/40"
                >
                  <span>{spec}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialty(spec)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add specialty (e.g. Waterfront Penthouses, Heritage Estates)..."
                value={newSpecialtyInput}
                onChange={(e) => setNewSpecialtyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpecialty();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-ivory/60 border border-sage text-xs focus:outline-none focus:border-forest"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={handleAddSpecialty}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-wider mb-1.5">
              Professional Biography
            </label>
            <textarea
              name="bio"
              rows={4}
              value={profile.bio || ''}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-xl bg-ivory/60 border ${
                errors.bio ? 'border-red-400' : 'border-sage'
              } text-xs sm:text-sm text-charcoal focus:outline-none focus:border-forest`}
            />
            {errors.bio && <p className="text-xs text-red-600 mt-1">{errors.bio}</p>}
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl border border-sage p-4 shadow-soft flex items-center justify-between">
          <p className="text-xs text-mutedText">
            Changes will be published to your client-facing profile and synchronized across EstateVista.
          </p>
          <Button
            variant="primary"
            size="md"
            type="submit"
            icon={Save}
            isLoading={saving}
          >
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
