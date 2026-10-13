import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Building,
  ShieldCheck,
  Mail,
  Phone,
  ArrowLeft,
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';
import PropertyGrid from '../components/property/PropertyGrid';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import NotFoundState from '../components/common/NotFoundState';
import { getAgentById } from '../services/agentService';

export default function AgentDetails() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function loadAgent() {
      setIsLoading(true);
      setIsNotFound(false);
      try {
        const data = await getAgentById(id);
        if (!data) {
          setIsNotFound(true);
        } else {
          setAgent(data);
        }
      } catch (err) {
        console.error('Failed to load agent', err);
        setIsNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadAgent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <LoadingState message="Loading advisor profile and portfolio..." />
      </div>
    );
  }

  if (isNotFound || !agent) {
    return (
      <NotFoundState
        title="Agent Not Found"
        message="The property advisor profile you are looking for does not exist in our demonstration registry."
        backLink="/agents"
        backText="View All Advisors"
      />
    );
  }

  return (
    <div className="pb-24">
      {/* Top Breadcrumb */}
      <div className="bg-ivory border-b border-sage/60 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-mutedText">
          <Link to="/" className="hover:text-forest transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/agents" className="hover:text-forest transition-colors">
            Advisors
          </Link>
          <span>/</span>
          <span className="text-forest font-semibold">{agent.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Agent Profile Banner Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-sage/60 shadow-card mb-12">
          {/* Decorative Gradient Banner */}
          <div className="h-32 sm:h-44 bg-gradient-to-r from-forest-dark via-forest to-forest-light relative p-6 flex justify-end">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white h-fit">
              <ShieldCheck className="w-4 h-4 text-gold" />
              <span>Demonstration Verified Advisor</span>
            </span>
          </div>

          <div className="px-6 sm:px-10 pb-8 pt-0">
            {/* Avatar & Action Row */}
            <div className="-mt-16 sm:-mt-20 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-white shadow-elevated bg-sage-light"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-serif text-2xl sm:text-4xl font-bold text-charcoal">
                      {agent.name}
                    </h1>
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-800">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{agent.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gold-dark flex items-center gap-1.5">
                    <Building className="w-4 h-4 shrink-0" />
                    <span>{agent.agency}</span>
                    <span className="text-mutedText font-normal">| {agent.title}</span>
                  </p>
                </div>
              </div>

              {/* Contact Information Quick Bar */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                <a
                  href={`tel:${agent.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-light transition-colors shadow-sm"
                >
                  <Phone className="w-4 h-4 text-gold" />
                  <span>Call {agent.phone}</span>
                </a>
                <a
                  href={`mailto:${agent.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ivory border border-sage text-charcoal text-xs font-semibold hover:bg-sage/40 transition-colors"
                >
                  <Mail className="w-4 h-4 text-forest" />
                  <span>Email Advisor</span>
                </a>
              </div>
            </div>

            {/* Profile Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-sage/40">
              {/* Bio & Philosophy */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-serif text-xl font-bold text-charcoal">
                  Professional Biography
                </h3>
                <p className="text-sm text-charcoal/80 leading-relaxed font-light">
                  {agent.bio}
                </p>

                {/* Specialties */}
                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-mutedText block mb-2">
                    Key Advisory Specialties
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {agent.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-sage-light text-forest text-xs font-medium border border-sage"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Locations & Stats */}
              <div className="bg-ivory/60 rounded-2xl p-5 border border-sage/60 space-y-4 text-xs">
                <div>
                  <span className="text-mutedText font-semibold uppercase tracking-wider block mb-1">
                    Experience & Track Record
                  </span>
                  <p className="text-sm font-bold text-forest">
                    {agent.experienceYears} Years in Prime Realty
                  </p>
                  <p className="text-mutedText text-[11px] mt-0.5">
                    Over 50+ closed transactions in Grade-A developments.
                  </p>
                </div>

                <div className="pt-2 border-t border-sage/40">
                  <span className="text-mutedText font-semibold uppercase tracking-wider block mb-1.5">
                    Covered Micro-Markets
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.serviceLocations.map((loc) => (
                      <span
                        key={loc}
                        className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-sage/70 text-charcoal font-medium"
                      >
                        <MapPin className="w-3 h-3 text-forest" />
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Represented by Agent */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block mb-1">
                Active Demonstration Portfolio
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
                Listings Represented by {agent.name.split(' ')[0]} ({agent.properties?.length || 0})
              </h2>
            </div>
          </div>

          <PropertyGrid
            properties={agent.properties}
            emptyTitle="No active listings currently"
            emptyMessage={`${agent.name} does not have any active demonstration listings in the current dataset.`}
            columns={3}
          />
        </div>
      </div>
    </div>
  );
}
