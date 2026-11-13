import React, { useState } from 'react';
import { GAME_SEQUENCE, GameDefinition } from '../config/games';
import { EnthiosHubChase } from './games/EnthiosHubChase';
import { CyberGridSurge } from './games/CyberGridSurge';
import { CampusGravityJumper } from './games/CampusGravityJumper';
import { NeonGridCrawler } from './games/NeonGridCrawler';
import { CampusGlider } from './games/CampusGlider';
import { StarCollector } from './games/StarCollector';
import { advanceToNextGame } from '../utils/storage';
import { playClickSound } from '../utils/sound';

interface SequentialGameLauncherProps {
  initialGameIndex: number;
  onClose: () => void;
  onGameChange?: (newIndex: number) => void;
}

export const SequentialGameLauncher: React.FC<SequentialGameLauncherProps> = ({
  initialGameIndex,
  onClose,
  onGameChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialGameIndex % GAME_SEQUENCE.length);

  const currentGame: GameDefinition = GAME_SEQUENCE[currentIndex];

  const handleNextGame = () => {
    playClickSound();
    const nextIdx = advanceToNextGame(currentIndex, GAME_SEQUENCE.length);
    setCurrentIndex(nextIdx);
    if (onGameChange) onGameChange(nextIdx);
  };

  const handleClose = () => {
    advanceToNextGame(currentIndex, GAME_SEQUENCE.length);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#1E281C]/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto">
        
        {currentGame.id === 'chase' && (
          <EnthiosHubChase onClose={handleClose} onNextGame={handleNextGame} />
        )}

        {currentGame.id === 'surge' && (
          <CyberGridSurge onClose={handleClose} onNextGame={handleNextGame} />
        )}

        {currentGame.id === 'jump' && (
          <CampusGravityJumper onClose={handleClose} onNextGame={handleNextGame} />
        )}

        {currentGame.id === 'snake' && (
          <NeonGridCrawler onClose={handleClose} onNextGame={handleNextGame} />
        )}

        {currentGame.id === 'glider' && (
          <CampusGlider onClose={handleClose} onNextGame={handleNextGame} />
        )}

        {currentGame.id === 'stars' && (
          <StarCollector onClose={handleClose} onNextGame={handleNextGame} />
        )}

      </div>
    </div>
  );
};
