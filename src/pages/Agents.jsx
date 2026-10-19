import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldCheck, Search, Users, AlertCircle, RotateCw, MapPin } from 'lucide-react';
import AgentCard from '../components/agent/AgentCard';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { getAllAgents } from '../services/agentService';

const DEFAULT_METROS = ['All', 'Mumbai', 'Bengaluru', 'Delhi NCR', 'Pune', 'Goa', 'Hyderabad'];

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllAgents();
      setAgents(data);
      setFilteredAgents(data);
    } catch (err) {
      console.error('[Agents Page] Failed to load advisors from Firestore:', err);
      setError('Unable to load accredited property advisors from Cloud Firestore. Please check your network connection and retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Compute available locations dynamically from actual advisor data + default luxury metros
  const locations = useMemo(() => {
    const fromData = agents.flatMap((a) => a.serviceLocations || []).filter(Boolean);
    const combined = ['All', ...new Set([...fromData, ...DEFAULT_METROS.slice(1)])];
    return combined.slice(0, 8);
  }, [agents]);

  useEffect(() => {
    let result = [...agents];

    if (selectedLocation !== 'All') {
      result = result.filter((a) =>
        (a.serviceLocations || []).some(
          (loc) => loc.toLowerCase() === selectedLocation.toLowerCase()
        )
      );
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          (a.name || '').toLowerCase().includes(q) ||
          (a.agency || '').toLowerCase().includes(q) ||
          (a.title || '').toLowerCase().includes(q) ||
          (a.specialties || []).some((s) => s.toLowerCase().includes(q))
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

      {/* Directory Grid & States */}
      {isLoading ? (
        <LoadingState message="Synchronizing luxury advisor directory from Cloud Firestore..." />
      ) : error ? (
        <div className="bg-white rounded-3xl p-10 border border-red-200 text-center max-w-lg mx-auto space-y-4 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-charcoal">Unable to Load Advisors</h3>
          <p className="text-xs text-mutedText leading-relaxed">{error}</p>
          <Button
            variant="outline"
            size="sm"
            icon={RotateCw}
            onClick={loadAgents}
            className="mx-auto"
          >
            Retry Connection
          </Button>
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Accredited Advisors Registered Yet"
          description="Our advisory directory is currently being updated with certified luxury consultants. Check back soon or contact our concierge desk directly."
          actionText="Contact Concierge"
          onAction={() => {
            window.location.href = '/contact';
          }}
        />
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Matching Advisors Found"
          description={`No certified advisors matched "${searchQuery || selectedLocation}". Try clearing your search keywords or switching locations.`}
          actionText="Reset Filter"
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
