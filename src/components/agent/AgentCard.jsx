import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building, ArrowUpRight, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AgentCard({ agent }) {
  const [imgError, setImgError] = useState(false);
  const hasAvatar = Boolean(agent.avatar) && !imgError;

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-sage/60 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      {/* Top Banner & Accreditation Tag */}
      <div>
        <div className="h-20 bg-gradient-to-r from-forest to-forest-light relative p-3">
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-forest shadow-xs border border-sage/40">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-dark shrink-0" />
            <span>Accredited Advisor</span>
          </div>
        </div>

        <div className="px-6 pb-4 pt-0 relative z-10">
          <div className="-mt-10 mb-3 flex items-end justify-between">
            <div className="relative shrink-0 z-10">
              {hasAvatar ? (
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  onError={() => setImgError(true)}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-sage-light"
                />
              ) : (
                <div
                  aria-label={agent.name}
                  className="w-20 h-20 rounded-2xl bg-forest text-gold border-4 border-white shadow-md flex items-center justify-center font-serif text-xl font-bold tracking-wider"
                >
                  {getInitials(agent.name)}
                </div>
              )}
            </div>

            <span className="text-xs font-medium text-forest bg-sage-light px-2.5 py-1 rounded-lg border border-sage">
              {agent.propertyCount} {agent.propertyCount === 1 ? 'Listing' : 'Listings'}
            </span>
          </div>

          {/* Name & Agency */}
          <Link to={`/agents/${agent.id}`} className="block group/link">
            <h3 className="font-serif text-xl font-bold text-charcoal group-hover/link:text-forest transition-colors">
              {agent.name}
            </h3>
          </Link>
          <p className="text-xs font-medium text-gold-dark flex items-center gap-1.5 mt-0.5">
            <Building className="w-3.5 h-3.5 shrink-0" />
            <span>{agent.agency}</span>
          </p>
          <p className="text-xs text-mutedText mt-0.5 font-medium">{agent.title}</p>

          {/* Bio excerpt */}
          {agent.bio ? (
            <p className="text-xs text-charcoal/70 line-clamp-2 mt-3 leading-relaxed">
              {agent.bio}
            </p>
          ) : (
            <p className="text-xs text-mutedText italic line-clamp-2 mt-3 leading-relaxed">
              Accredited luxury property advisor representing verified residences across premier markets.
            </p>
          )}

          {/* Service Locations */}
          {agent.serviceLocations && agent.serviceLocations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-sage/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block mb-1.5">
                Service Locations
              </span>
              <div className="flex flex-wrap gap-1">
                {agent.serviceLocations.slice(0, 3).map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1 text-[11px] bg-ivory text-charcoal/80 px-2 py-0.5 rounded-md border border-sage/50"
                  >
                    <MapPin className="w-3 h-3 text-forest/70" />
                    {loc}
                  </span>
                ))}
                {agent.serviceLocations.length > 3 && (
                  <span className="text-[10px] text-mutedText self-center px-1">
                    +{agent.serviceLocations.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 bg-ivory/60 border-t border-sage/50 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-mutedText">
          {agent.experienceYears > 0 ? `${agent.experienceYears} Years Exp.` : 'Prime Realty Advisor'}
        </span>
        <Link to={`/agents/${agent.id}`}>
          <Button variant="secondary" size="sm" icon={ArrowUpRight} iconPosition="right" className="text-xs">
            View Profile & Properties
          </Button>
        </Link>
      </div>
    </article>
  );
}
