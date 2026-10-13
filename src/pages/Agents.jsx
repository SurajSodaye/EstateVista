import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Users, Award, Sparkles, MapPin } from 'lucide-react';
import AgentCard from '../components/agent/AgentCard';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import { getAllAgents } from '../services/agentService';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const locations = ['All', 'Mumbai', 'Bengaluru', 'Delhi NCR', 'Pune', 'Goa', 'Hyderabad'];

  useEffect(() => {
    async function loadAgents() {
      setIsLoading(true);
      try {
        const data = await getAllAgents();
        setAgents(data);
        setFilteredAgents(data);
      } catch (err) {
        console.error('Failed to load agents', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAgents();
  }, []);

  useEffect(() => {
    let result = [...agents];

    if (selectedLocation !== 'All') {
      result = result.filter((a) =>
        a.serviceLocations.some(
          (loc) => loc.toLowerCase() === selectedLocation.toLowerCase()
        )
      );
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.agency.toLowerCase().includes(q) ||
          a.specialties.some((s) => s.toLowerCase().includes(q))
      );
    }

    setFilteredAgents(result);
  }, [selectedLocation, searchQuery, agents]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sage-light text-forest text-xs font-semibold mb-3 border border-sage">
          <ShieldCheck className="w-4 h-4 text-gold-dark" />
          <span>Accredited Advisory Directory</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-charcoal mb-4">
          Meet Our Prime Property Advisors
        </h1>
        <p className="text-xs sm:text-base text-mutedText leading-relaxed">
          Connect with trusted luxury property consultants and regional specialists who represent premier residential and commercial assets with absolute discretion.
        </p>

        {/* Demo Notice Banner */}
        <div className="mt-5 p-3 rounded-xl bg-ivory border border-sage/60 text-xs text-mutedText max-w-xl mx-auto">
          <span className="font-semibold text-forest">Demonstration Directory:</span> Profiles shown below represent certified advisor models staged for future Firebase identity verification.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-sage/60 shadow-soft mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search advisor by name, agency, or specialty..."
            className="w-full bg-ivory/60 border border-sage rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-charcoal placeholder-mutedText/60 focus:outline-none focus:ring-2 focus:ring-forest"
          />
          <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-3" />
        </div>

        {/* Location Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 sm:pb-0 scrollbar-none">
          {locations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setSelectedLocation(loc)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                selectedLocation === loc
                  ? 'bg-forest text-white shadow-sm'
                  : 'bg-ivory text-charcoal/70 hover:bg-sage/40'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <LoadingState message="Loading luxury advisor profiles..." />
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No advisors found"
          description="Try selecting another city or clearing your search keywords."
          actionText="View All Advisors"
          onAction={() => {
            setSelectedLocation('All');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
