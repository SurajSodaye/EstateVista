import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Building, ArrowUpRight, ShieldCheck, Mail, Phone } from 'lucide-react';
import Button from '../common/Button';

export default function AgentCard({ agent }) {
  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-sage/60 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      {/* Top Banner & Avatar */}
      <div>
        <div className="h-20 bg-gradient-to-r from-forest to-forest-light relative p-3">
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-forest shadow-sm">
            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
            <span>{agent.rating}</span>
            <span className="text-mutedText text-[10px]">({agent.reviewCount})</span>
          </div>
        </div>

        <div className="px-6 pb-4 pt-0 relative">
          <div className="-mt-10 mb-3 flex items-end justify-between">
            <div className="relative">
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-sage-light"
              />
              {agent.isVerifiedDemo && (
                <div
                  title="Demonstration Profile"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold text-forest flex items-center justify-center border-2 border-white shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
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
          <p className="text-xs text-charcoal/70 line-clamp-2 mt-3 leading-relaxed">
            {agent.bio}
          </p>

          {/* Service Locations */}
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
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 bg-ivory/60 border-t border-sage/50 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-mutedText">
          {agent.experienceYears} Years Exp.
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
