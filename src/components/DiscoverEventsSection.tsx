import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink, ArrowRight, Globe } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface EventItem {
  id: string | number;
  slug?: string;
  title?: string;
  name?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  venue_city?: string;
  venue_name?: string;
  location?: string;
  description?: string;
}

export const DiscoverEventsSection: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const categories = [
    { id: 'all', label: 'All Formats' },
    { id: 'hackathon', label: 'Hackathons' },
    { id: 'mun', label: 'Model UN' },
    { id: 'conference', label: 'Conferences' },
    { id: 'workshop', label: 'Workshops' },
  ];

  useEffect(() => {
    async function fetchLiveEvents() {
      try {
        setLoading(true);
        const res = await fetch('https://api.enthioshub.com/api/events');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        let list: EventItem[] = [];
        if (json && json.data) {
          if (Array.isArray(json.data)) list = json.data;
          else if (json.data.data && Array.isArray(json.data.data)) list = json.data.data;
        }

        const cleanList = list.filter((e) => (e.title || e.name) && !(e.title || e.name)!.startsWith('reg-'));
        setEvents(cleanList);
      } catch (err) {
        console.warn('Live API request fallback:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    if (selectedFilter === 'all') return true;
    const cat = (e.category || '').toLowerCase();
    return cat.includes(selectedFilter);
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date Announced Inside';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <section id="events" className="py-20 sm:py-28 bg-transparent text-left relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E281C]/5 text-[#9A8449] text-xs font-mono uppercase tracking-widest font-bold mb-3 border border-[#A5B2A0]/30">
              <Globe className="w-3.5 h-3.5" />
              <span>Real Platform Integration</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#1E281C] tracking-tight leading-tight">
              Discover Published Events
            </h2>
            <p className="mt-3 text-sm sm:text-lg text-[#1E281C]/75 font-normal leading-relaxed font-sans">
              Real university hackathons, conferences, and student symposiums currently deployed on EnthiosHub.
            </p>
          </div>

          <a
            href="https://enthioshub.com/events"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] transition-all font-mono text-xs font-bold uppercase tracking-wider shrink-0 shadow-sm"
          >
            <span>View Events Directory</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-10 pb-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                playClickSound();
                setSelectedFilter(c.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === c.id
                  ? 'bg-[#1E281C] text-[#CBB57B] shadow-sm'
                  : 'bg-white text-[#1E281C]/70 border border-[#A5B2A0]/30 hover:bg-gray-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-60 rounded-3xl bg-white animate-pulse border border-[#A5B2A0]/20 p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-20 h-5 bg-gray-200 rounded-full" />
                  <div className="w-3/4 h-6 bg-gray-200 rounded-lg" />
                  <div className="w-full h-4 bg-gray-200 rounded" />
                </div>
                <div className="w-1/2 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Live Event Cards Grid */}
        {!loading && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredEvents.slice(0, 6).map((event) => {
              const eventTitle = event.title || event.name || 'Official Event';
              const eventUrl = `https://enthioshub.com/events/${event.slug || event.id}`;
              const eventCategory = event.category || 'Collegiate Summit';
              const eventDate = formatDate(event.start_date);
              const eventLocation = event.venue_city || event.location || event.venue_name || 'Online / Hybrid';

              return (
                <div
                  key={event.id}
                  className="bg-white/85 backdrop-blur-md rounded-3xl border border-[#A5B2A0]/30 p-6 sm:p-7 flex flex-col justify-between hover:border-[#CBB57B] hover:shadow-xl transition-all duration-300 text-left group"
                >
                  <div>
                    {/* Category & Status */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                      <span className="px-3 py-1 rounded-full bg-[#F8F6F0] text-[#1E281C] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#A5B2A0]/30">
                        {eventCategory}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                        Live Event
                      </span>
                    </div>

                    {/* Event Title */}
                    <h3 className="font-serif text-2xl font-bold text-[#1E281C] group-hover:text-[#9A8449] transition-colors leading-snug line-clamp-2">
                      {eventTitle}
                    </h3>

                    {/* Metadata */}
                    <div className="mt-4 space-y-2 text-xs font-mono text-[#1E281C]/75">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#9A8449] shrink-0" />
                        <span>{eventDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#9A8449] shrink-0" />
                        <span className="truncate">{eventLocation}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="mt-4 text-xs text-[#1E281C]/70 line-clamp-2 leading-relaxed font-sans">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Card Action */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#1E281C]/50 font-bold uppercase tracking-wider">
                      Official Listing
                    </span>
                    <a
                      href={eventUrl}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#1E281C] group-hover:text-[#9A8449] group-hover:translate-x-1 transition-all"
                    >
                      <span>View Event</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
