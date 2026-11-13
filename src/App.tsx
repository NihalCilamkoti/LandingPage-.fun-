import React, { useState, useEffect } from 'react';
import { GAME_SEQUENCE } from './config/games';
import { getSavedGameIndex, loadPlayerStats, PlayerStats } from './utils/storage';
import { playClickSound } from './utils/sound';
import { Premium3DBackground } from './components/landing/Premium3DBackground';
import { PlayhouseNavbar } from './components/PlayhouseNavbar';
import { PlayhouseHero } from './components/PlayhouseHero';
import { DiscoverEventsSection } from './components/DiscoverEventsSection';
import { PlatformFeaturesSection } from './components/PlatformFeaturesSection';
import { PlayhouseFooter } from './components/PlayhouseFooter';
import { SequentialGameLauncher } from './components/SequentialGameLauncher';

export const App: React.FC = () => {
  const [activeGameIndex, setActiveGameIndex] = useState<number | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalCoins: 0,
    gamesPlayed: 0,
    highScores: { chase: 0, surge: 0, jump: 0, snake: 0, glider: 0, stars: 0 },
  });

  useEffect(() => {
    setPlayerStats(loadPlayerStats());
  }, []);

  const handlePlayClick = () => {
    playClickSound();
    const currentQueued = getSavedGameIndex(GAME_SEQUENCE.length);
    setActiveGameIndex(currentQueued);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseGame = () => {
    setActiveGameIndex(null);
    setPlayerStats(loadPlayerStats());
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#1E281C] font-sans antialiased selection:bg-[#CBB57B]/30 selection:text-[#121911] flex flex-col relative overflow-x-hidden">
      
      {/* Glossy Premium 3D Abstract Sculpture (EnthiosHub Light Theme) */}
      <Premium3DBackground />

      {/* Main Single-Page Content */}
      <div className="relative z-10 flex flex-col flex-1">
        
        {/* Navigation Bar */}
        <PlayhouseNavbar onPlayClick={handlePlayClick} />

        <main className="flex-1">
          {/* Main Hero: ONE Primary Mystery PLAY Button & Live High Score HUD */}
          <PlayhouseHero
            onPlayClick={handlePlayClick}
            playerStats={playerStats}
          />

          {/* Real Platform Published Events (Live API Feed) */}
          <DiscoverEventsSection />

          {/* Platform Capabilities & Architecture */}
          <PlatformFeaturesSection />
        </main>

        {/* Minimal Footer */}
        <PlayhouseFooter onPlayClick={handlePlayClick} />

      </div>

      {/* Sequential Game Launcher Modal */}
      {activeGameIndex !== null && (
        <SequentialGameLauncher
          initialGameIndex={activeGameIndex}
          onClose={handleCloseGame}
        />
      )}

    </div>
  );
};

export default App;
