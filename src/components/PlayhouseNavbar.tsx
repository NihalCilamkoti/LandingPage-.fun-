import React, { useState } from 'react';
import { Play, Volume2, VolumeX, Sparkles, ExternalLink } from 'lucide-react';
import { playClickSound, isSoundMuted, toggleSoundMute } from '../utils/sound';

interface PlayhouseNavbarProps {
  onPlayClick: () => void;
}

export const PlayhouseNavbar: React.FC<PlayhouseNavbarProps> = ({ onPlayClick }) => {
  const [muted, setMuted] = useState(isSoundMuted());

  const scrollToSection = (hash: string) => {
    playClickSound();
    const elem = document.querySelector(hash);
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F8F6F0]/90 backdrop-blur-md border-b border-[#A5B2A0]/30 transition-all text-[#1E281C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
        
        {/* Big EnthiosHub Brand Logo */}
        <div className="flex items-center">
          <a
            href="#"
            className="flex items-center group focus:outline-none"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img
              src="logo-enthioshub.png"
              alt="EnthiosHub"
              className="h-12 sm:h-16 md:h-18 w-auto object-contain transition-transform group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = 'https://enthioshub.com/logo-enthioshub.png';
              }}
            />
          </a>
        </div>

        {/* Minimal Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold uppercase tracking-wider text-[#1E281C]/75">
          <button
            onClick={() => scrollToSection('#about')}
            className="hover:text-[#1E281C] transition-colors focus:outline-none cursor-pointer"
          >
            Playhouse
          </button>
          <button
            onClick={() => scrollToSection('#events')}
            className="hover:text-[#1E281C] transition-colors focus:outline-none cursor-pointer"
          >
            Real Events
          </button>
          <button
            onClick={() => scrollToSection('#platform')}
            className="hover:text-[#1E281C] transition-colors focus:outline-none cursor-pointer"
          >
            Main Platform
          </button>
        </nav>

        {/* Audio Toggle & Primary PLAY CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nowMuted = toggleSoundMute();
              setMuted(nowMuted);
            }}
            className="p-2 sm:p-2.5 rounded-xl border border-[#A5B2A0]/40 text-[#1E281C] hover:bg-[#1E281C]/5 transition-all cursor-pointer"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-[#1E281C]" />}
          </button>

          <a
            href="https://enthioshub.com/login"
            className="hidden sm:inline-flex text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border border-[#A5B2A0]/40 text-[#1E281C] hover:bg-[#1E281C]/5 transition-all"
          >
            Sign In
          </a>

          <button
            onClick={() => {
              playClickSound();
              onPlayClick();
            }}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider px-4 sm:px-6 py-2.5 rounded-xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>PLAY NOW</span>
          </button>
        </div>

      </div>
    </header>
  );
};
