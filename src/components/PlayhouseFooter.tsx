import React from 'react';
import { Play, ExternalLink, Gamepad2 } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface PlayhouseFooterProps {
  onPlayClick: () => void;
}

export const PlayhouseFooter: React.FC<PlayhouseFooterProps> = ({ onPlayClick }) => {
  return (
    <footer className="w-full bg-transparent border-t border-[#A5B2A0]/30 py-12 sm:py-16 text-[#1E281C] relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner with final CTA */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white/90 backdrop-blur-md border-2 border-[#A5B2A0]/40 shadow-xl mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E281C]/5 text-[#9A8449] font-mono text-xs uppercase font-bold tracking-widest border border-[#A5B2A0]/30">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Ready for Action?</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E281C]">
              Launch the Playhouse Experience
            </h3>
            <p className="text-sm text-[#1E281C]/75 font-sans">
              Play through our interactive 3D runner, cyber matrix, vertical bouncer, and agility challenges.
            </p>
          </div>

          <button
            onClick={() => {
              playClickSound();
              onPlayClick();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] transition-all font-mono text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>PLAY NOW</span>
          </button>
        </div>

        {/* Links & Attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#1E281C]/60 pt-4 border-t border-[#A5B2A0]/20">
          <div className="flex items-center gap-3">
            <img
              src="logo-enthioshub.png"
              alt="EnthiosHub"
              className="h-10 sm:h-12 w-auto object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = 'https://enthioshub.com/logo-enthioshub.png';
              }}
            />
            <span>© {new Date().getFullYear()} EnthiosHub. Digital Playhouse.</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://enthioshub.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1E281C] transition-colors flex items-center gap-1"
            >
              <span>Main Platform</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://enthioshub.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1E281C] transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://enthioshub.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1E281C] transition-colors"
            >
              Terms
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
