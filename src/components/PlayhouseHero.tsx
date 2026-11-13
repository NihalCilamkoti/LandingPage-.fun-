import React from 'react';
import { Play, Sparkles, Trophy, Coins } from 'lucide-react';
import { playClickSound } from '../utils/sound';
import { PlayerStats } from '../utils/storage';

interface PlayhouseHeroProps {
  onPlayClick: () => void;
  playerStats: PlayerStats;
}

export const PlayhouseHero: React.FC<PlayhouseHeroProps> = ({
  onPlayClick,
  playerStats,
}) => {
  return (
    <section id="about" className="relative pt-12 sm:pt-20 pb-20 sm:pb-28 overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Focused Gaming Directive & One Prominent Mystery PLAY Button */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Playground Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E281C]/5 border border-[#A5B2A0]/40 text-[#1E281C] text-xs font-mono uppercase tracking-widest font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Interactive Digital Playground // Season 2026</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#1E281C] tracking-tight leading-[1.05]">
              EnthiosHub <br />
              <span className="text-[#9A8449] italic font-normal">
                Playhouse.
              </span>
            </h1>

            {/* Short Gaming Introduction */}
            <p className="text-base sm:text-xl text-[#1E281C]/80 max-w-xl font-normal leading-relaxed font-sans">
              Welcome to the digital playground for campus innovators and tech enthusiasts. Jump into real-time skill challenges, test your reflexes, gather event tokens, and discover real collegiate summits.
            </p>

            {/* Primary PLAY Button — Mystery Adventure */}
            <div className="pt-2 sm:pt-4 space-y-4">
              <button
                onClick={() => {
                  playClickSound();
                  onPlayClick();
                }}
                className="inline-flex items-center gap-4 px-10 sm:px-14 py-5 rounded-2xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] transition-all font-mono text-base sm:text-lg font-bold uppercase tracking-wider shadow-2xl hover:shadow-3xl hover:-translate-y-1 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#CBB57B] text-[#1E281C] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <span>PLAY NOW</span>
              </button>

              {/* Mystery Indicator (NO spoilers or counts!) */}
              <div className="flex items-center gap-2 text-xs font-mono text-[#1E281C]/70">
                <span className="font-bold text-[#9A8449]">READY:</span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-[#A5B2A0]/40 font-bold text-[#1E281C]">
                  Surprise Challenge Queued
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Player Profile & Live High Score HUD */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-3xl bg-white border-2 border-[#A5B2A0]/40 p-6 sm:p-8 shadow-xl text-left relative overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E281C]/70">
                    PLAYER RECORD // LOCAL VAULT
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#9A8449] font-bold">
                  {playerStats.gamesPlayed} SESSIONS
                </span>
              </div>

              {/* Player Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-[#F8F6F0] border border-[#A5B2A0]/30">
                  <div className="flex items-center gap-1.5 text-xs text-[#1E281C]/60 font-mono mb-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>Total Coins</span>
                  </div>
                  <div className="text-xl font-mono font-bold text-[#1E281C]">
                    {playerStats.totalCoins}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8F6F0] border border-[#A5B2A0]/30">
                  <div className="flex items-center gap-1.5 text-xs text-[#1E281C]/60 font-mono mb-1">
                    <Trophy className="w-3.5 h-3.5 text-[#9A8449]" />
                    <span>Top Record</span>
                  </div>
                  <div className="text-xl font-mono font-bold text-[#1E281C]">
                    {Math.max(
                      playerStats.highScores.chase,
                      playerStats.highScores.surge,
                      playerStats.highScores.jump,
                      playerStats.highScores.snake,
                      playerStats.highScores.glider,
                      playerStats.highScores.stars
                    ) > 0
                      ? Math.max(
                          playerStats.highScores.chase,
                          playerStats.highScores.surge,
                          playerStats.highScores.jump,
                          playerStats.highScores.snake,
                          playerStats.highScores.glider,
                          playerStats.highScores.stars
                        ).toLocaleString()
                      : '—'}
                  </div>
                </div>
              </div>

              {/* Mystery Adventure Card (Zero spoilers, exciting invitation) */}
              <div className="p-4 rounded-2xl bg-[#F8F6F0]/60 border border-[#A5B2A0]/30 space-y-2 font-mono text-xs text-[#1E281C]/80">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#9A8449] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mystery Playhouse Pipeline</span>
                </div>
                <p className="leading-relaxed">
                  Every run unlocks a surprise challenge. Master runners, cyber matrixes, vertical climbs, and agility arenas as you rotate through the ecosystem.
                </p>
              </div>

              {/* Immediate Quick Play Trigger */}
              <div className="pt-5">
                <button
                  onClick={() => {
                    playClickSound();
                    onPlayClick();
                  }}
                  className="w-full py-3 rounded-xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] transition-all font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Enter Playhouse</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
